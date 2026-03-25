const User                          = require('../models/User.model')
const generateToken                 = require('../utils/generateToken')
const { verifyFirebaseToken }       = require('../config/firebase.config')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// ── POST /api/auth/verify-phone ───────────────────────────────────────────────
// Called after user completes Firebase phone OTP on the frontend.
// Frontend sends the Firebase ID token — we verify it server-side.
// Flow:
//   1. User enters phone on frontend
//   2. Frontend uses Firebase SDK to send OTP SMS and get ID token
//   3. Frontend sends ID token here
//   4. We verify token, mark phone as verified, return JWT
const verifyPhone = asyncHandler(async (req, res) => {
  const { firebaseToken, phone } = req.body

  if (!firebaseToken) {
    return res.status(400).json({ message: 'Firebase token required' })
  }

  let decoded
  try {
    decoded = await verifyFirebaseToken(firebaseToken)
  } catch {
    return res.status(401).json({ message: 'Invalid or expired Firebase token' })
  }

  // Firebase returns phone_number in E.164 format e.g. +919876543210
  const phoneFromToken = decoded.phone_number

  if (!phoneFromToken) {
    return res.status(400).json({ message: 'No phone number in token' })
  }

  // Normalize: strip +91 to get 10-digit number
  const normalized = phoneFromToken.replace(/^\+91/, '').replace(/\D/g, '')

  // Find user by phone or the provided phone number
  let user = await User.findOne({
    $or: [
      { phone: normalized },
      { phone: phoneFromToken },
      { phone: phone },
    ],
  })

  if (!user) {
    return res.status(404).json({
      message: 'No account found with this phone number. Please register first.',
      phoneVerified: true,
      phone: normalized,
    })
  }

  // Mark phone as verified
  user.isPhoneVerified = true
  user.phone           = normalized
  user.lastLogin       = new Date()
  await user.save({ validateBeforeSave: false })

  const token = generateToken(user._id, user.role)
  res.status(200).json({
    message: 'Phone verified successfully',
    token,
    user: user.toSafeObject(),
  })
})

// ── POST /api/auth/link-phone ─────────────────────────────────────────────────
// For users who signed up with Google (placeholder phone) or email/password
// and want to add/verify their real phone number
const linkPhone = asyncHandler(async (req, res) => {
  const { firebaseToken } = req.body

  if (!firebaseToken) {
    return res.status(400).json({ message: 'Firebase token required' })
  }

  let decoded
  try {
    decoded = await verifyFirebaseToken(firebaseToken)
  } catch {
    return res.status(401).json({ message: 'Invalid or expired Firebase token' })
  }

  const phoneFromToken = decoded.phone_number
  if (!phoneFromToken) {
    return res.status(400).json({ message: 'No phone number in token' })
  }

  const normalized = phoneFromToken.replace(/^\+91/, '').replace(/\D/g, '')

  // Check if another user already has this phone
  const existing = await User.findOne({
    phone:  normalized,
    _id:    { $ne: req.user._id },
  })
  if (existing) {
    return res.status(409).json({ message: 'Phone number already linked to another account' })
  }

  const user = await User.findById(req.user._id)
  user.phone           = normalized
  user.isPhoneVerified = true
  await user.save({ validateBeforeSave: false })

  res.status(200).json({
    message: 'Phone number verified and linked',
    user: user.toSafeObject(),
  })
})

// ── POST /api/auth/register-with-phone ───────────────────────────────────────
// Register a new account after phone OTP verified
// Frontend: user fills name + email + password + role, then verifies phone via Firebase
// Then sends firebaseToken + form data here in one request
const registerWithPhone = asyncHandler(async (req, res) => {
  const { name, email, password, role, firebaseToken, rentalService } = req.body

  if (!name?.trim() || !email?.trim() || !password || !firebaseToken) {
    return res.status(400).json({ message: 'name, email, password and firebaseToken are required' })
  }

  // Verify Firebase token
  let decoded
  try {
    decoded = await verifyFirebaseToken(firebaseToken)
  } catch {
    return res.status(401).json({ message: 'Phone verification failed — invalid token' })
  }

  const phoneFromToken = decoded.phone_number
  if (!phoneFromToken) {
    return res.status(400).json({ message: 'No phone number in Firebase token' })
  }

  const normalized = phoneFromToken.replace(/^\+91/, '').replace(/\D/g, '')

  // Check duplicates
  const emailExists = await User.findOne({ email: email.trim().toLowerCase() })
  if (emailExists) return res.status(409).json({ message: 'Email already registered' })

  const phoneExists = await User.findOne({ phone: normalized })
  if (phoneExists) return res.status(409).json({ message: 'Phone already registered' })

  const safeRole = role === 'center_admin' ? 'center_admin' : 'customer'

  const userData = {
    name:            name.trim(),
    email:           email.trim().toLowerCase(),
    phone:           normalized,
    password,
    role:            safeRole,
    isPhoneVerified: true,
    wallet:          { balance: 0, locked: 0 },
  }

  // Vendor registration — attach rental service
  if (safeRole === 'center_admin' && rentalService?.name && rentalService?.city) {
    userData.rentalService = {
      name:    rentalService.name.trim(),
      city:    rentalService.city.trim(),
      address: rentalService.address?.trim() || '',
      lat:     rentalService.lat     || null,
      lng:     rentalService.lng     || null,
      hubCode: rentalService.hubCode || `HUB-${Date.now()}`,
    }
  }

  const user  = await User.create(userData)
  const token = generateToken(user._id, user.role)

  res.status(201).json({
    message: 'Account created with verified phone',
    token,
    user: user.toSafeObject(),
  })
})

module.exports = { verifyPhone, linkPhone, registerWithPhone }