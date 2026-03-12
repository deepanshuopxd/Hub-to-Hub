// // const mongoose = require('mongoose')
// // const bcrypt   = require('bcryptjs')
// // const jwt      = require('jsonwebtoken')

// // const userSchema = new mongoose.Schema(
// //   {
// //     name: {
// //       type:     String,
// //       required: [true, 'Name is required'],
// //       trim:     true,
// //       minlength: [2,  'Name must be at least 2 characters'],
// //       maxlength: [50, 'Name cannot exceed 50 characters'],
// //     },

// //     email: {
// //       type:      String,
// //       required:  [true, 'Email is required'],
// //       unique:    true,
// //       lowercase: true,
// //       trim:      true,
// //       match:     [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
// //     },

// //     phone: {
// //       type:     String,
// //       required: [true, 'Phone number is required'],
// //       trim:     true,
// //       match:    [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
// //     },

// //     password: {
// //       type:      String,
// //       required:  [true, 'Password is required'],
// //       minlength: [6, 'Password must be at least 6 characters'],
// //       select:    false,   // never returned in queries by default
// //     },

// //     // ── Role ────────────────────────────────────────────────────────────────
// //     // center_admin = Vendor who lists fleet at a hub
// //     // customer     = Person who books hub-to-hub trips
// //     role: {
// //       type:    String,
// //       enum:    ['customer', 'center_admin'],
// //       default: 'customer',
// //     },

// //     // ── KYC ─────────────────────────────────────────────────────────────────
// //     // Must be 'verified' before a customer can book any vehicle
// //     kyc: {
// //       status: {
// //         type:    String,
// //         enum:    ['pending', 'submitted', 'verified', 'rejected'],
// //         default: 'pending',
// //       },
// //       dlUrl:         { type: String, default: null },    // Cloudinary URL
// //       aadhaarUrl:    { type: String, default: null },
// //       extractedName: { type: String, default: null },    // From Tesseract OCR
// //       extractedDOB:  { type: String, default: null },
// //       dlNumber:      { type: String, default: null },
// //       aadhaarNumber: { type: String, default: null },
// //       rejectedReason:{ type: String, default: null },
// //       verifiedAt:    { type: Date,   default: null },
// //       submittedAt:   { type: Date,   default: null },
// //     },

// //     // ── Wallet ───────────────────────────────────────────────────────────────
// //     // USP support: deposits locked when booking created, released on completion
// //     // This enables vehicles to move freely hub-to-hub without cash friction
// //     wallet: {
// //       balance: { type: Number, default: 0, min: 0 },
// //       locked:  { type: Number, default: 0, min: 0 },  // security deposits held
// //     },

// //     // ── Vendor-specific ──────────────────────────────────────────────────────
// //     // Which hub(s) this vendor primarily operates from
// //     homeHub: {
// //       name: { type: String, default: null },
// //       lat:  { type: Number, default: null },
// //       lng:  { type: Number, default: null },
// //     },

// //     isActive: { type: Boolean, default: true },

// //     lastLogin: { type: Date, default: null },
// //   },
// //   {
// //     timestamps: true,
// //     toJSON:     { virtuals: true },
// //     toObject:   { virtuals: true },
// //   }
// // )

// // // ── Indexes ──────────────────────────────────────────────────────────────────
// // userSchema.index({ email: 1 })
// // userSchema.index({ role: 1 })
// // userSchema.index({ 'kyc.status': 1 })

// // // ── Virtuals ─────────────────────────────────────────────────────────────────
// // userSchema.virtual('walletAvailable').get(function () {
// //   return this.wallet.balance - this.wallet.locked
// // })

// // userSchema.virtual('isKycVerified').get(function () {
// //   return this.kyc.status === 'verified'
// // })

// // // ── Pre-save: hash password ───────────────────────────────────────────────────
// // userSchema.pre('save', async function (next) {
// //   if (!this.isModified('password')) return next()
// //   const salt    = await bcrypt.genSalt(12)
// //   this.password = await bcrypt.hash(this.password, salt)
// //   next()
// // })

// // // ── Methods ───────────────────────────────────────────────────────────────────
// // userSchema.methods.comparePassword = async function (candidatePassword) {
// //   return bcrypt.compare(candidatePassword, this.password)
// // }

// // userSchema.methods.generateToken = function () {
// //   return jwt.sign(
// //     { id: this._id, role: this.role },
// //     process.env.JWT_SECRET,
// //     { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
// //   )
// // }

// // // Lock deposit amount in wallet
// // userSchema.methods.lockDeposit = async function (amount) {
// //   if (this.wallet.balance < amount) {
// //     throw new Error('Insufficient wallet balance for security deposit')
// //   }
// //   this.wallet.locked += amount
// //   await this.save()
// // }

// // // Release deposit back to available balance
// // userSchema.methods.releaseDeposit = async function (amount) {
// //   this.wallet.locked  = Math.max(0, this.wallet.locked - amount)
// //   await this.save()
// // }

// // // Safe user object (no password)
// // userSchema.methods.toSafeObject = function () {
// //   const obj = this.toObject()
// //   delete obj.password
// //   return obj
// // }

// // module.exports = mongoose.model('User', userSchema)


// // const mongoose = require('mongoose')
// // const bcrypt   = require('bcryptjs')

// // const userSchema = new mongoose.Schema(
// //   {
// //     name: {
// //       type:      String,
// //       required:  [true, 'Name is required'],
// //       trim:      true,
// //       minlength: [2,  'Name must be at least 2 characters'],
// //       maxlength: [60, 'Name cannot exceed 60 characters'],
// //     },
// //     email: {
// //       type:      String,
// //       required:  [true, 'Email is required'],
// //       unique:    true,
// //       lowercase: true,
// //       trim:      true,
// //       match:     [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
// //     },
// //     phone: {
// //       type:     String,
// //       required: [true, 'Phone is required'],
// //       trim:     true,
// //       match:    [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
// //     },
// //     password: {
// //       type:      String,
// //       required:  [true, 'Password is required'],
// //       minlength: [6, 'Password must be at least 6 characters'],
// //       select:    false,
// //     },

// //     // ── Role ─────────────────────────────────────────────────────────────────
// //     role: {
// //       type:    String,
// //       enum:    ['customer', 'center_admin'],
// //       default: 'customer',
// //     },

// //     // ── KYC (customer only) ───────────────────────────────────────────────────
// //     // KYC must be 'verified' before a customer can book any vehicle
// //     kyc: {
// //       status:        { type: String, enum: ['pending','submitted','verified','rejected'], default: 'pending' },
// //       dlUrl:         { type: String, default: null },
// //       aadhaarUrl:    { type: String, default: null },
// //       extractedName: { type: String, default: null },
// //       extractedDOB:  { type: String, default: null },
// //       dlNumber:      { type: String, default: null },
// //       aadhaarNumber: { type: String, default: null },
// //       rejectedReason:{ type: String, default: null },
// //       submittedAt:   { type: Date,   default: null },
// //       verifiedAt:    { type: Date,   default: null },
// //     },

// //     // ── Wallet ────────────────────────────────────────────────────────────────
// //     // balance = available funds
// //     // locked  = security deposits held during active bookings
// //     // USP: when vehicle completes hub-to-hub trip, locked amount is released
// //     wallet: {
// //       balance: { type: Number, default: 0, min: 0 },
// //       locked:  { type: Number, default: 0, min: 0 },
// //     },

// //     // Vendor home hub
// //     homeHub: {
// //       name: { type: String, default: null },
// //       lat:  { type: Number, default: null },
// //       lng:  { type: Number, default: null },
// //     },

// //     isActive:  { type: Boolean, default: true },
// //     lastLogin: { type: Date,    default: null },
// //   },
// //   { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
// // )

// // // Indexes
// // userSchema.index({ email: 1 })
// // userSchema.index({ role: 1 })
// // userSchema.index({ 'kyc.status': 1 })

// // // Virtuals
// // userSchema.virtual('walletAvailable').get(function () {
// //   return this.wallet.balance - this.wallet.locked
// // })
// // userSchema.virtual('isKycVerified').get(function () {
// //   return this.kyc.status === 'verified'
// // })

// // // Hash password before save
// // userSchema.pre('save', async function (next) {
// //   if (!this.isModified('password')) return next()
// //   this.password = await bcrypt.hash(this.password, 12)
// //   next()
// // })

// // // Methods
// // userSchema.methods.comparePassword = function (candidate) {
// //   return require('bcryptjs').compare(candidate, this.password)
// // }

// // userSchema.methods.lockDeposit = async function (amount) {
// //   if (this.wallet.balance < amount) {
// //     throw new Error(`Insufficient balance. Need ₹${amount} for security deposit.`)
// //   }
// //   this.wallet.locked += amount
// //   await this.save()
// // }

// // userSchema.methods.releaseDeposit = async function (amount) {
// //   this.wallet.locked = Math.max(0, this.wallet.locked - amount)
// //   await this.save()
// // }

// // userSchema.methods.toSafeObject = function () {
// //   const obj = this.toObject()
// //   delete obj.password
// //   return obj
// // }

// // module.exports = mongoose.model('User', userSchema)







// const mongoose = require('mongoose')
// const bcrypt = require('bcryptjs')

// const userSchema = new mongoose.Schema(
// {
//   name: {
//     type: String,
//     required: [true, 'Name is required'],
//     trim: true,
//     minlength: [2, 'Name must be at least 2 characters'],
//     maxlength: [60, 'Name cannot exceed 60 characters'],
//   },

//   email: {
//     type: String,
//     required: [true, 'Email is required'],
//     unique: true,
//     lowercase: true,
//     trim: true,
//     match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format'],
//   },

//   phone: {
//     type: String,
//     required: [true, 'Phone is required'],
//     trim: true,
//     match: [/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'],
//   },

//   password: {
//     type: String,
//     required: [true, 'Password is required'],
//     minlength: [6, 'Password must be at least 6 characters'],
//     select: false, // hidden unless explicitly selected
//   },

//   // ── User Role ──────────────────────────────────────────
//   role: {
//     type: String,
//     enum: ['customer', 'center_admin'],
//     default: 'customer',
//   },

//   // ── KYC Data ───────────────────────────────────────────
//   kyc: {
//     status: {
//       type: String,
//       enum: ['pending', 'submitted', 'verified', 'rejected'],
//       default: 'pending',
//     },
//     dlUrl: { type: String, default: null },
//     aadhaarUrl: { type: String, default: null },

//     extractedName: { type: String, default: null },
//     extractedDOB: { type: String, default: null },

//     dlNumber: { type: String, default: null },
//     aadhaarNumber: { type: String, default: null },

//     rejectedReason: { type: String, default: null },

//     submittedAt: { type: Date, default: null },
//     verifiedAt: { type: Date, default: null },
//   },

//   // ── Wallet System ──────────────────────────────────────
//   wallet: {
//     balance: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//     locked: {
//       type: Number,
//       default: 0,
//       min: 0,
//     },
//   },

//   // ── Vendor Home Hub ────────────────────────────────────
//   homeHub: {
//     name: { type: String, default: null },
//     lat: { type: Number, default: null },
//     lng: { type: Number, default: null },
//   },

//   isActive: {
//     type: Boolean,
//     default: true,
//   },

//   lastLogin: {
//     type: Date,
//     default: null,
//   },

// },
// {
//   timestamps: true,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true },
// }
// )

// /* ───────────────── Indexes ───────────────── */

// userSchema.index({ role: 1 })
// userSchema.index({ 'kyc.status': 1 })

// /* ───────────────── Virtuals ───────────────── */

// userSchema.virtual('walletAvailable').get(function () {
//   return this.wallet.balance - this.wallet.locked
// })

// userSchema.virtual('isKycVerified').get(function () {
//   return this.kyc.status === 'verified'
// })

// /* ───────────────── Password Hash ───────────────── */

// userSchema.pre('save', async function (next) {

//   if (!this.isModified('password')) return next()

//   const salt = await bcrypt.genSalt(12)
//   this.password = await bcrypt.hash(this.password, salt)

//   next()
// })

// /* ───────────────── Methods ───────────────── */

// userSchema.methods.comparePassword = function (candidatePassword) {
//   return bcrypt.compare(candidatePassword, this.password)
// }

// userSchema.methods.lockDeposit = async function (amount) {

//   if (this.wallet.balance < amount) {
//     throw new Error(`Insufficient balance. Need ₹${amount} for security deposit.`)
//   }

//   this.wallet.locked += amount
//   await this.save()
// }

// userSchema.methods.releaseDeposit = async function (amount) {

//   this.wallet.locked = Math.max(0, this.wallet.locked - amount)

//   await this.save()
// }

// userSchema.methods.toSafeObject = function () {

//   const obj = this.toObject()

//   delete obj.password

//   return obj
// }

// module.exports = mongoose.model('User', userSchema)




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
      required:  [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select:    false,
    },

    // ── Role ─────────────────────────────────────────────────────────────────
    role: {
      type:    String,
      enum:    ['customer', 'center_admin'],
      default: 'customer',
    },

    // ── KYC (customer only) ───────────────────────────────────────────────────
    // KYC must be 'verified' before a customer can book any vehicle
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
    // balance = available funds
    // locked  = security deposits held during active bookings
    // USP: when vehicle completes hub-to-hub trip, locked amount is released
    wallet: {
      balance: { type: Number, default: 0, min: 0 },
      locked:  { type: Number, default: 0, min: 0 },
    },

    // Vendor home hub
    homeHub: {
      name: { type: String, default: null },
      lat:  { type: Number, default: null },
      lng:  { type: Number, default: null },
    },

    isActive:  { type: Boolean, default: true },
    lastLogin: { type: Date,    default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Indexes
userSchema.index({ email: 1 })
userSchema.index({ role: 1 })
userSchema.index({ 'kyc.status': 1 })

// Virtuals
userSchema.virtual('walletAvailable').get(function () {
  return this.wallet.balance - this.wallet.locked
})
userSchema.virtual('isKycVerified').get(function () {
  return this.kyc.status === 'verified'
})

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

// Methods
userSchema.methods.comparePassword = function (candidate) {
  return require('bcryptjs').compare(candidate, this.password)
}

userSchema.methods.lockDeposit = async function (amount) {
  if (this.wallet.balance < amount) {
    throw new Error(`Insufficient balance. Need ₹${amount} for security deposit.`)
  }
  this.wallet.balance -= amount   // deduct from available balance
  this.wallet.locked  += amount   // hold in locked
  await this.save()
}

userSchema.methods.releaseDeposit = async function (amount) {
  this.wallet.locked  = Math.max(0, this.wallet.locked  - amount)
  this.wallet.balance += amount   // return to available balance
  await this.save()
}

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject()
  delete obj.password
  return obj
}

module.exports = mongoose.model('User', userSchema)
