const User          = require('../models/User.model')
const generateToken = require('../utils/generateToken')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// POST /api/auth/register
const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body
  if (!name?.trim() || !email?.trim() || !phone?.trim() || !password) {
    return res.status(400).json({ message: 'All fields are required' })
  }

  const exists = await User.findOne({ email: email.trim().toLowerCase() })
  if (exists) return res.status(409).json({ message: 'Email already registered' })

  const safeRole = role === 'center_admin' ? 'center_admin' : 'customer'

  const user = await User.create({
    name:   name.trim(),
    email:  email.trim().toLowerCase(),
    phone:  phone.trim(),
    password,
    role:   safeRole,
    wallet: { balance: safeRole === 'center_admin' ? 0 : 5000, locked: 0 },
  })

  const token = generateToken(user._id, user.role)
  res.status(201).json({ message: 'Account created', token, user: user.toSafeObject() })
})

// POST /api/auth/login
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' })

  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+password')
  if (!user || !user.isActive) return res.status(401).json({ message: 'Invalid credentials' })

  const match = await user.comparePassword(password)
  if (!match) return res.status(401).json({ message: 'Invalid credentials' })

  user.lastLogin = new Date()
  await user.save({ validateBeforeSave: false })

  const token = generateToken(user._id, user.role)
  res.status(200).json({ message: 'Login successful', token, user: user.toSafeObject() })
})

// GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  res.status(200).json({ user: user.toSafeObject() })
})

// PUT /api/auth/profile
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone } = req.body
  const user = await User.findById(req.user._id)
  if (name?.trim())  user.name  = name.trim()
  if (phone?.trim()) user.phone = phone.trim()
  await user.save()
  res.status(200).json({ message: 'Profile updated', user: user.toSafeObject() })
})

// POST /api/auth/change-password
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

// PATCH /api/auth/wallet  — top up wallet balance
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

module.exports = { register, login, getMe, updateProfile, changePassword, topUpWallet }