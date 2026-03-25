const User          = require('../models/User.model')
const generateToken = require('../utils/generateToken')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// ── POST /api/auth/register ───────────────────────────────────────────────────
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role, rentalService } = req.body

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const emailExists = await User.findOne({ email: email.trim().toLowerCase() })
  if (emailExists) return res.status(409).json({ message: 'Email already registered' })

  const phoneExists = await User.findOne({ phone: phone.trim() })
  if (phoneExists) return res.status(409).json({ message: 'Phone already registered' })

  const safeRole = role === 'center_admin' ? 'center_admin' : 'customer'

  const userData = {
    name:   name.trim(),
    email:  email.trim().toLowerCase(),
    phone:  phone.trim(),
    password,
    role:   safeRole,
    wallet: { balance: 0, locked: 0 },
  }

  // Vendor must register with their rental service details
  if (safeRole === 'center_admin') {
    if (!rentalService?.name || !rentalService?.city) {
      return res.status(400).json({
        message: 'Vendors must provide rental service name and city',
      })
    }
    userData.rentalService = {
      name:    rentalService.name.trim(),
      city:    rentalService.city.trim(),
      address: rentalService.address?.trim() || '',
      lat:     rentalService.lat    || null,
      lng:     rentalService.lng    || null,
      hubCode: `HUB-${Date.now()}`,
    }
  }

  const user  = await User.create(userData)
  const token = generateToken(user._id, user.role)
  res.status(201).json({ message: 'Account created', token, user: user.toSafeObject() })
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
  if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' })

  // Block Google-only accounts from password login
  if (user.authProvider === 'google' && !user.password) {
    return res.status(400).json({ message: 'This account uses Google login. Please sign in with Google.' })
  }

  const match = await user.comparePassword(password)
  if (!match) return res.status(401).json({ message: 'Invalid credentials' })

  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  const token = generateToken(user._id, user.role)
  res.status(200).json({ message: 'Login successful', token, user: user.toSafeObject() })
})

// ── GET /api/auth/google/callback ─────────────────────────────────────────────
// Passport handles the OAuth flow — this is called after Google redirects back
// We generate a JWT and redirect to frontend with token in query param
const googleCallback = asyncHandler(async (req, res) => {
  try {
    const user  = req.user   // set by passport
    const token = generateToken(user._id, user.role)

    // Redirect to frontend — React picks up the token from the URL
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173'

    // If Google user has placeholder phone, redirect to phone verification
    const needsPhone = user.phone?.startsWith('google_')
    const redirectPath = needsPhone ? '/verify-phone' : (user.role === 'center_admin' ? '/vendor' : '/dashboard')

    res.redirect(`${clientUrl}${redirectPath}?token=${token}&needsPhone=${needsPhone}`)
  } catch {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=oauth_failed`)
  }
})

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.status(200).json({ user: user.toSafeObject() })
})

// ── PUT /api/auth/profile ─────────────────────────────────────────────────────
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, bankDetails, rentalService } = req.body
  const user = await User.findById(req.user._id)

  if (name?.trim())  user.name  = name.trim()
  if (phone?.trim()) user.phone = phone.trim()

  // Update bank/UPI details
  if (bankDetails) {
    user.bankDetails = {
      upiId:       bankDetails.upiId?.trim()       || user.bankDetails?.upiId,
      accountName: bankDetails.accountName?.trim() || user.bankDetails?.accountName,
      accountNo:   bankDetails.accountNo?.trim()   || user.bankDetails?.accountNo,
      ifsc:        bankDetails.ifsc?.trim()        || user.bankDetails?.ifsc,
    }
  }

  // Vendor can update their rental service details
  if (rentalService && user.role === 'center_admin') {
    user.rentalService = {
      ...user.rentalService,
      name:    rentalService.name?.trim()    || user.rentalService?.name,
      city:    rentalService.city?.trim()    || user.rentalService?.city,
      address: rentalService.address?.trim() || user.rentalService?.address,
      lat:     rentalService.lat             ?? user.rentalService?.lat,
      lng:     rentalService.lng             ?? user.rentalService?.lng,
    }
  }

  await user.save()
  res.status(200).json({ message: 'Profile updated', user: user.toSafeObject() })
})

// ── POST /api/auth/change-password ───────────────────────────────────────────
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Both passwords required' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'New password must be at least 6 characters' })
  }
  const user  = await User.findById(req.user._id).select('+password')
  const match = await user.comparePassword(currentPassword)
  if (!match) return res.status(401).json({ message: 'Current password incorrect' })

  user.password = newPassword
  await user.save()
  res.status(200).json({ message: 'Password changed successfully' })
})

// ── PATCH /api/auth/wallet ────────────────────────────────────────────────────
const topUpWallet = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount)
  if (!amount || amount <= 0 || amount > 100000) {
    return res.status(400).json({ message: 'Enter a valid amount (₹1 – ₹1,00,000)' })
  }
  const user = await User.findById(req.user._id)
  user.wallet.balance += amount
  await user.save()
  res.status(200).json({ message: `₹${amount} added to wallet`, wallet: user.wallet })
})

module.exports = { register, login, googleCallback, getMe, updateProfile, changePassword, topUpWallet }