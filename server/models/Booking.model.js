// const mongoose = require('mongoose')

// const hubSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     city: { type: String },
//     lat:  { type: Number, required: true },
//     lng:  { type: Number, required: true },
//   },
//   { _id: false }
// )

// const messageSchema = new mongoose.Schema(
//   {
//     senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//     senderName: { type: String, required: true },
//     senderRole: { type: String, enum: ['customer', 'center_admin'] },
//     content:    { type: String, required: true, trim: true, maxlength: 1000 },
//     read:       { type: Boolean, default: false },
//   },
//   { timestamps: true }
// )

// const bookingSchema = new mongoose.Schema(
//   {
//     user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
//     vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },

//     // ── USP: The two hubs CAN be in completely different cities ───────────────
//     // startHub = where customer picks up the vehicle
//     // endHub   = where customer drops it off (different city = USP!)
//     // On completion: vehicle.currentHub automatically becomes endHub
//     startHub: { type: hubSchema, required: [true, 'Pickup hub required'] },
//     endHub:   { type: hubSchema, required: [true, 'Drop-off hub required'] },

//     startDate: { type: Date, required: [true, 'Start date required'] },
//     endDate:   { type: Date, required: [true, 'End date required'] },
//     totalDays: { type: Number, min: 1 },

//     // Pricing breakdown
//     pricePerDay:   { type: Number, required: true },
//     rentalCost:    { type: Number, required: true },
//     depositAmount: { type: Number, default: 2000 },
//     platformFee:   { type: Number, default: 0 },
//     totalPrice:    { type: Number, required: true },
//     depositReleased: { type: Boolean, default: false },
//     vendorPaid:      { type: Boolean, default: false },

//     // ── Status FSM ────────────────────────────────────────────────────────────
//     // pending → (vendor accepts) → active
//     // active  → (trip starts)   → in_transit
//     // in_transit → (arrives at endHub) → completed  ← vehicle relocates here!
//     // Any state → cancelled
//     status: {
//       type:    String,
//       enum:    ['pending', 'active', 'in_transit', 'completed', 'cancelled'],
//       default: 'pending',
//     },

//     statusHistory: [
//       {
//         status:    String,
//         note:      String,
//         changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//         changedAt: { type: Date, default: Date.now },
//       },
//     ],

//     // Live GPS during trip — updated via Socket.io push_location events
//     livePosition: {
//       lat:       { type: Number, default: null },
//       lng:       { type: Number, default: null },
//       updatedAt: { type: Date,   default: null },
//     },

//     // Chat room for customer ↔ vendor messaging
//     chatRoomId: { type: String },
//     messages:   [messageSchema],

//     // Cancellation info
//     cancelledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//     cancelledAt:  { type: Date,   default: null },
//     cancelReason: { type: String, default: null },

//     // Completion
//     completedAt:    { type: Date, default: null },
//     customerRating: { type: Number, min: 1, max: 5, default: null },
//     vendorRating:   { type: Number, min: 1, max: 5, default: null },
//     reviewNote:     { type: String, default: null },
//   },
//   { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
// )

// // Indexes
// bookingSchema.index({ user: 1, status: 1 })
// bookingSchema.index({ vehicle: 1, status: 1 })
// bookingSchema.index({ 'startHub.name': 1 })
// bookingSchema.index({ 'endHub.name': 1 })
// bookingSchema.index({ startDate: 1, endDate: 1 })

// // Pre-save: compute totalDays + auto chatRoomId
// bookingSchema.pre('save', function (next) {
//   if (this.isModified('startDate') || this.isModified('endDate')) {
//     const ms = new Date(this.endDate) - new Date(this.startDate)
//     this.totalDays = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
//   }
//   if (!this.chatRoomId) {
//     this.chatRoomId = `booking_${this._id}`
//   }
//   next()
// })

// // Virtuals
// bookingSchema.virtual('routeSummary').get(function () {
//   return `${this.startHub?.name} → ${this.endHub?.name}`
// })
// bookingSchema.virtual('isCrossHubTrip').get(function () {
//   return this.startHub?.name !== this.endHub?.name
// })

// // Static: check vehicle availability for date range
// bookingSchema.statics.isVehicleAvailable = async function (vehicleId, startDate, endDate, excludeId = null) {
//   const query = {
//     vehicle:   vehicleId,
//     status:    { $in: ['pending', 'active', 'in_transit'] },
//     startDate: { $lt: new Date(endDate) },
//     endDate:   { $gt: new Date(startDate) },
//   }
//   if (excludeId) query._id = { $ne: excludeId }
//   const conflict = await this.findOne(query)
//   return !conflict
// }

// // Static: top hub-to-hub routes (USP analytics)
// bookingSchema.statics.getTopRoutes = async function (limit = 10) {
//   return this.aggregate([
//     { $match: { status: 'completed' } },
//     {
//       $group: {
//         _id:           { from: '$startHub.name', to: '$endHub.name' },
//         totalBookings: { $sum: 1 },
//         totalRevenue:  { $sum: '$rentalCost' },
//         avgDays:       { $avg: '$totalDays' },
//       },
//     },
//     { $sort: { totalBookings: -1 } },
//     { $limit: limit },
//   ])
// }

// module.exports = mongoose.model('Booking', bookingSchema)








const mongoose = require('mongoose')

// ── Hub sub-schema ────────────────────────────────────────────────────────────
const hubSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true },
    city:          { type: String },
    address:       { type: String },
    lat:           { type: Number, required: true },
    lng:           { type: Number, required: true },
    vendorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rentalService: { type: String, default: null },
  },
  { _id: false }
)

// ── Message sub-schema (3-way chat) ──────────────────────────────────────────
const messageSchema = new mongoose.Schema(
  {
    senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    senderRole: { type: String, enum: ['customer', 'center_admin'] },
    content:    { type: String, required: true, trim: true, maxlength: 1000 },
    read:       { type: Boolean, default: false },
  },
  { timestamps: true }
)

// ── Media sub-schema (handover photos/videos) ─────────────────────────────────
const mediaSchema = new mongoose.Schema(
  {
    url:        { type: String, required: true },
    type:       { type: String, enum: ['image', 'video'], required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role:       { type: String, enum: ['customer', 'center_admin'] },
    uploadedAt: { type: Date, default: Date.now },
    note:       { type: String, default: null },
  },
  { _id: true }
)

// ── Damage report sub-schema ──────────────────────────────────────────────────
const damageSchema = new mongoose.Schema(
  {
    reportedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedAt:    { type: Date, default: Date.now },
    description:   { type: String, trim: true },
    damageAmount:  { type: Number, default: 0 },    // amount deducted from deposit
    refundAmount:  { type: Number, default: 0 },    // amount returned to customer
    media:         [mediaSchema],                    // damage photos/videos
    resolved:      { type: Boolean, default: false },
  },
  { _id: false }
)

const bookingSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },

    // ── USP: startHub and endHub can be in completely different cities ─────────
    startHub: { type: hubSchema, required: [true, 'Pickup hub required'] },
    endHub:   { type: hubSchema, required: [true, 'Drop-off hub required'] },

    // ── Vendor references ─────────────────────────────────────────────────────
    // startVendor = vendor who owns the vehicle at pickup hub (accepts/rejects booking)
    // endVendor   = vendor at destination hub (receives vehicle, checks for damage)
    // Both get booking notifications and are part of the 3-way chat
    startVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    endVendor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ── DateTime (full timestamp, not just date) ──────────────────────────────
    // Billing is time-based: 24hr blocks rounded UP
    // e.g. 25 hrs = 2 days charged
    startDateTime: { type: Date, required: [true, 'Start date/time required'] },
    endDateTime:   { type: Date, required: [true, 'End date/time required'] },

    // Kept for backwards compatibility and quick queries
    startDate: { type: Date },
    endDate:   { type: Date },

    totalDays:  { type: Number, min: 1 },   // ceil(hours / 24)
    totalHours: { type: Number, min: 1 },   // exact hours

    // ── Pricing breakdown ─────────────────────────────────────────────────────
    pricePerDay:     { type: Number, required: true },
    pricePerHour:    { type: Number, default: 0 },       // pricePerDay / 24
    rentalCost:      { type: Number, required: true },
    depositAmount:   { type: Number, required: true },   // vehicle.securityDeposit
    platformFee:     { type: Number, default: 0 },
    totalPrice:      { type: Number, required: true },
    depositReleased: { type: Boolean, default: false },
    vendorPaid:      { type: Boolean, default: false },

    // ── Payment method ────────────────────────────────────────────────────────
    paymentMethod: {
      type:    String,
      enum:    ['wallet', 'razorpay', 'cash'],
      default: 'wallet',
    },
    paymentStatus: {
      type:    String,
      enum:    ['pending', 'paid', 'refunded', 'partial_refund'],
      default: 'pending',
    },
    razorpayOrderId:   { type: String, default: null },
    razorpayPaymentId: { type: String, default: null },

    // ── Status FSM ────────────────────────────────────────────────────────────
    // pending     → (start vendor accepts) → active
    // active      → (trip starts, customer picks up) → in_transit
    // in_transit  → (customer drops at endHub) → completed ← vehicle relocates!
    // completed   → endVendor reviews media, may raise damage claim
    // Any state   → cancelled
    status: {
      type:    String,
      enum:    ['pending', 'active', 'in_transit', 'completed', 'cancelled'],
      default: 'pending',
    },

    statusHistory: [
      {
        status:    String,
        note:      String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Handover Media ────────────────────────────────────────────────────────
    // pickupMedia  = uploaded at pickup (before trip) by customer or startVendor
    // dropoffMedia = uploaded at dropoff (after trip) by customer or endVendor
    pickupMedia:  [mediaSchema],
    dropoffMedia: [mediaSchema],

    // ── Damage Report ─────────────────────────────────────────────────────────
    // Raised by endVendor after reviewing dropoff media vs pickup media
    damageReport: { type: damageSchema, default: null },

    // Live GPS during trip
    livePosition: {
      lat:       { type: Number, default: null },
      lng:       { type: Number, default: null },
      updatedAt: { type: Date,   default: null },
    },

    // ── Chat (3-way: customer + startVendor + endVendor) ─────────────────────
    chatRoomId: { type: String },
    messages:   [messageSchema],

    // Cancellation info
    cancelledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt:  { type: Date,   default: null },
    cancelReason: { type: String, default: null },

    // Completion
    completedAt:    { type: Date,   default: null },
    customerRating: { type: Number, min: 1, max: 5, default: null },
    vendorRating:   { type: Number, min: 1, max: 5, default: null },
    reviewNote:     { type: String, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// ── Indexes ───────────────────────────────────────────────────────────────────
bookingSchema.index({ user: 1, status: 1 })
bookingSchema.index({ vehicle: 1, status: 1 })
bookingSchema.index({ startVendor: 1, status: 1 })
bookingSchema.index({ endVendor: 1, status: 1 })
bookingSchema.index({ 'startHub.city': 1 })
bookingSchema.index({ 'endHub.city': 1 })
bookingSchema.index({ startDateTime: 1, endDateTime: 1 })

// ── Pre-save: compute hours/days + chatRoomId ─────────────────────────────────
bookingSchema.pre('save', function (next) {
  // Sync startDate/endDate from DateTime fields
  if (this.startDateTime) this.startDate = this.startDateTime
  if (this.endDateTime)   this.endDate   = this.endDateTime

  if (this.startDateTime && this.endDateTime) {
    const ms         = new Date(this.endDateTime) - new Date(this.startDateTime)
    const hours      = ms / (1000 * 60 * 60)
    this.totalHours  = Math.max(1, Math.ceil(hours))
    this.totalDays   = Math.max(1, Math.ceil(hours / 24))  // rounds UP — charge full day
    this.pricePerHour = this.pricePerDay / 24
  }

  if (!this.chatRoomId) {
    this.chatRoomId = `booking_${this._id}`
  }
  next()
})

// ── Virtuals ──────────────────────────────────────────────────────────────────
bookingSchema.virtual('routeSummary').get(function () {
  return `${this.startHub?.name} → ${this.endHub?.name}`
})
bookingSchema.virtual('isCrossHubTrip').get(function () {
  return this.startHub?.city !== this.endHub?.city
})
bookingSchema.virtual('isCrossVendorTrip').get(function () {
  return this.startVendor?.toString() !== this.endVendor?.toString()
})

// ── Static: check vehicle availability ───────────────────────────────────────
bookingSchema.statics.isVehicleAvailable = async function (vehicleId, startDateTime, endDateTime, excludeId = null) {
  const query = {
    vehicle:       vehicleId,
    status:        { $in: ['pending', 'active', 'in_transit'] },
    startDateTime: { $lt: new Date(endDateTime) },
    endDateTime:   { $gt: new Date(startDateTime) },
  }
  if (excludeId) query._id = { $ne: excludeId }
  const conflict = await this.findOne(query)
  return !conflict
}

// ── Static: top routes (USP analytics) ───────────────────────────────────────
bookingSchema.statics.getTopRoutes = async function (limit = 10) {
  return this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id:           { from: '$startHub.city', to: '$endHub.city' },
        totalBookings: { $sum: 1 },
        totalRevenue:  { $sum: '$rentalCost' },
        avgHours:      { $avg: '$totalHours' },
      },
    },
    { $sort: { totalBookings: -1 } },
    { $limit: limit },
  ])
}

module.exports = mongoose.model('Booking', bookingSchema)