const mongoose = require('mongoose')
const bcrypt   = require('bcryptjs')

const userSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Name is required'],
      trim:      true,
      minlength: [2,  'Name must be at least 2 characters'],
      maxlength: [60, 'Name cannot exceed 60 characters'],
    },
    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,
      lowercase: true,
      trim:      true,
      match:     [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
    },
    phone: {
      type:     String,
      required: [true, 'Phone is required'],
      trim:     true,
      match:    [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
    },
    password: {
      type:      String,
      required:  function() { return !this.googleId },  // not required for OAuth users
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false,
    },

    // ── OAuth ─────────────────────────────────────────────────────────────────
    googleId:   { type: String, default: null, sparse: true },
    authProvider: {
      type:    String,
      enum:    ['local', 'google'],
      default: 'local',
    },

    // ── OTP verification ──────────────────────────────────────────────────────
    otp: {
      code:      { type: String,  default: null, select: false },
      expiresAt: { type: Date,    default: null, select: false },
      verified:  { type: Boolean, default: false },
    },
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },

    // ── Role ──────────────────────────────────────────────────────────────────
    role: {
      type:    String,
      enum:    ['customer', 'center_admin'],
      default: 'customer',
    },

    // ── Rental Service (vendor only) ──────────────────────────────────────────
    // Each vendor registers ONE rental service at ONE city/location
    // Their vehicles are tied to this service
    // Bookings ending at their city get assigned to them
    rentalService: {
      name:    { type: String, trim: true, default: null },  // e.g. "Varanasi Rides"
      city:    { type: String, trim: true, default: null },  // e.g. "Varanasi"
      address: { type: String, trim: true, default: null },
      lat:     { type: Number, default: null },
      lng:     { type: Number, default: null },
      // Unique short code for the hub e.g. "VNS-001"
      hubCode: { type: String, uppercase: true, trim: true, default: null },
    },

    // ── KYC (customer only) ───────────────────────────────────────────────────
    kyc: {
      status:        { type: String, enum: ['pending','submitted','verified','rejected'], default: 'pending' },
      dlUrl:         { type: String, default: null },
      aadhaarUrl:    { type: String, default: null },
      extractedName: { type: String, default: null },
      extractedDOB:  { type: String, default: null },
      dlNumber:      { type: String, default: null },
      aadhaarNumber: { type: String, default: null },
      rejectedReason:{ type: String, default: null },
      submittedAt:   { type: Date,   default: null },
      verifiedAt:    { type: Date,   default: null },
    },

    // ── Wallet ────────────────────────────────────────────────────────────────
    // Starts at 0 — user must top up via Razorpay
    // balance = spendable funds
    // locked  = security deposits held during active bookings (returned after trip)
    wallet: {
      balance: { type: Number, default: 0, min: 0 },
      locked:  { type: Number, default: 0, min: 0 },
    },

    // ── Bank / UPI (for withdrawals) ──────────────────────────────────────────
    bankDetails: {
      upiId:       { type: String, trim: true, default: null },
      accountName: { type: String, trim: true, default: null },
      accountNo:   { type: String, trim: true, default: null },
      ifsc:        { type: String, trim: true, default: null },
    },

    isActive:  { type: Boolean, default: true },
    lastLogin: { type: Date,    default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// ── Indexes ───────────────────────────────────────────────────────────────────
userSchema.index({ role: 1 })
userSchema.index({ 'kyc.status': 1 })
userSchema.index({ 'rentalService.city': 1 })

// ── Virtuals ──────────────────────────────────────────────────────────────────
userSchema.virtual('walletAvailable').get(function () {
  return this.wallet.balance   // balance is already net of locked
})
userSchema.virtual('isKycVerified').get(function () {
  return this.kyc.status === 'verified'
})
userSchema.virtual('isVendor').get(function () {
  return this.role === 'center_admin'
})

// ── Pre-save: hash password ───────────────────────────────────────────────────
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// ── Methods ───────────────────────────────────────────────────────────────────
userSchema.methods.comparePassword = function (candidate) {
  return require('bcryptjs').compare(candidate, this.password)
}

// Lock deposit: deduct from available balance, hold in locked
userSchema.methods.lockDeposit = async function (amount) {
  if (this.wallet.balance < amount) {
    throw new Error(`Insufficient balance. Need ₹${amount} for security deposit.`)
  }
  this.wallet.balance -= amount
  this.wallet.locked  += amount
  await this.save()
}

// Release deposit: unlock and return to available balance
userSchema.methods.releaseDeposit = async function (amount) {
  const releaseAmt    = Math.min(amount, this.wallet.locked)
  this.wallet.locked  = Math.max(0, this.wallet.locked  - releaseAmt)
  this.wallet.balance += releaseAmt
  await this.save()
}

// Partial deposit deduction for damage: release only what's left after damage charge
userSchema.methods.deductFromDeposit = async function (damageAmount, totalDeposit) {
  const refund = Math.max(0, totalDeposit - damageAmount)
  this.wallet.locked  = Math.max(0, this.wallet.locked - totalDeposit)
  this.wallet.balance += refund   // return only undamaged portion
  await this.save()
  return refund
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  delete obj.otp
  return obj
}

module.exports = mongoose.model('User', userSchema)