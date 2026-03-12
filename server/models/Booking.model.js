// const mongoose = require('mongoose')

// // Hub sub-schema (same shape as Vehicle model)
// const hubSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     city: { type: String },
//     lat:  { type: Number, required: true },
//     lng:  { type: Number, required: true },
//   },
//   { _id: false }
// )

// const bookingSchema = new mongoose.Schema(
//   {
//     // ── Parties ───────────────────────────────────────────────────────────────
//     user: {
//       type:     mongoose.Schema.Types.ObjectId,
//       ref:      'User',
//       required: true,
//     },
//     vehicle: {
//       type:     mongoose.Schema.Types.ObjectId,
//       ref:      'Vehicle',
//       required: true,
//     },

//     // ── USP HEART: Hub-to-Hub Route ───────────────────────────────────────────
//     // This is what makes HubDrive different from every other rental platform.
//     // startHub = where customer picks up the vehicle
//     // endHub   = where customer drops it off (CAN BE DIFFERENT CITY)
//     // After completion: vehicle.currentHub becomes endHub automatically
//     startHub: {
//       type:     hubSchema,
//       required: [true, 'Pickup hub is required'],
//     },
//     endHub: {
//       type:     hubSchema,
//       required: [true, 'Drop-off hub is required'],
//     },

//     // ── Dates ─────────────────────────────────────────────────────────────────
//     startDate: {
//       type:     Date,
//       required: [true, 'Start date is required'],
//     },
//     endDate: {
//       type:     Date,
//       required: [true, 'End date is required'],
//     },
//     totalDays: {
//       type: Number,
//       min:  1,
//     },

//     // ── Pricing (USP: distance-aware pricing can be added here) ───────────────
//     pricePerDay:    { type: Number, required: true },
//     rentalCost:     { type: Number, required: true },
//     depositAmount:  { type: Number, default: 2000 },
//     platformFee:    { type: Number, default: 0 },
//     totalPrice:     { type: Number, required: true },
//     depositReleased:{ type: Boolean, default: false },

//     // ── Status FSM ────────────────────────────────────────────────────────────
//     // pending    → vendor accepts → active
//     // active     → customer starts trip → in_transit
//     // in_transit → arrives at endHub → completed
//     // completed  → deposit auto-released, vehicle.currentHub = endHub (USP!)
//     // cancelled  → by either party before trip starts
//     status: {
//       type:    String,
//       enum:    ['pending', 'active', 'in_transit', 'completed', 'cancelled'],
//       default: 'pending',
//     },

//     // Timeline of status changes
//     statusHistory: [
//       {
//         status:    String,
//         changedAt: { type: Date, default: Date.now },
//         changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//         note:      String,
//       },
//     ],

//     // ── Live tracking ─────────────────────────────────────────────────────────
//     // Current GPS position of the vehicle during this trip
//     // Updated every ~5s via Socket.io from tracking.socket.js
//     livePosition: {
//       lat:       { type: Number, default: null },
//       lng:       { type: Number, default: null },
//       updatedAt: { type: Date,   default: null },
//     },

//     // Estimated arrival time (can be computed from distance)
//     estimatedArrival: { type: Date, default: null },

//     // ── Chat ──────────────────────────────────────────────────────────────────
//     // Socket.io room ID for customer-vendor messaging on this booking
//     chatRoomId: { type: String },
//     messages: [
//       {
//         senderId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//         senderName: { type: String },
//         senderRole: { type: String, enum: ['customer', 'center_admin'] },
//         content:    { type: String, required: true, trim: true, maxlength: 1000 },
//         createdAt:  { type: Date, default: Date.now },
//         read:       { type: Boolean, default: false },
//       },
//     ],

//     // ── Cancellation ──────────────────────────────────────────────────────────
//     cancelledBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
//     cancelledAt:    { type: Date, default: null },
//     cancelReason:   { type: String, default: null },

//     // ── Completion ────────────────────────────────────────────────────────────
//     completedAt:    { type: Date, default: null },
//     vendorRating:   { type: Number, min: 1, max: 5, default: null },
//     customerRating: { type: Number, min: 1, max: 5, default: null },
//     reviewNote:     { type: String, default: null },
//   },
//   {
//     timestamps: true,
//     toJSON:     { virtuals: true },
//     toObject:   { virtuals: true },
//   }
// )

// // ── Indexes ──────────────────────────────────────────────────────────────────
// bookingSchema.index({ user: 1, status: 1 })
// bookingSchema.index({ vehicle: 1, status: 1 })
// bookingSchema.index({ 'startHub.name': 1 })
// bookingSchema.index({ 'endHub.name': 1 })
// bookingSchema.index({ startDate: 1 })
// bookingSchema.index({ status: 1 })

// // ── Pre-save: compute derived fields ─────────────────────────────────────────
// bookingSchema.pre('save', function (next) {
//   if (this.isModified('startDate') || this.isModified('endDate')) {
//     const ms   = new Date(this.endDate) - new Date(this.startDate)
//     this.totalDays = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
//   }
//   // Auto-set chatRoomId on creation
//   if (!this.chatRoomId) {
//     this.chatRoomId = `booking_${this._id}`
//   }
//   next()
// })

// // ── Virtuals ─────────────────────────────────────────────────────────────────
// bookingSchema.virtual('routeSummary').get(function () {
//   return `${this.startHub?.name} → ${this.endHub?.name}`
// })

// bookingSchema.virtual('isSameHubTrip').get(function () {
//   return this.startHub?.name === this.endHub?.name
// })

// // ── Static: check if vehicle is available for date range ─────────────────────
// bookingSchema.statics.isVehicleAvailable = async function (vehicleId, startDate, endDate, excludeBookingId = null) {
//   const query = {
//     vehicle:   vehicleId,
//     status:    { $in: ['pending', 'active', 'in_transit'] },
//     startDate: { $lt: new Date(endDate) },
//     endDate:   { $gt: new Date(startDate) },
//   }
//   if (excludeBookingId) query._id = { $ne: excludeBookingId }
//   const conflict = await this.findOne(query)
//   return !conflict
// }

// // ── Static: get hub-to-hub stats (USP analytics) ─────────────────────────────
// bookingSchema.statics.getRouteStats = async function () {
//   return this.aggregate([
//     { $match: { status: 'completed' } },
//     {
//       $group: {
//         _id:          { start: '$startHub.name', end: '$endHub.name' },
//         totalBookings:{ $sum: 1 },
//         totalRevenue: { $sum: '$totalPrice' },
//       },
//     },
//     { $sort: { totalBookings: -1 } },
//     { $limit: 10 },
//   ])
// }

// module.exports = mongoose.model('Booking', bookingSchema)










const mongoose = require('mongoose')

const hubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    city: { type: String },
    lat:  { type: Number, required: true },
    lng:  { type: Number, required: true },
  },
  { _id: false }
)

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

const bookingSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },

    // ── USP: The two hubs CAN be in completely different cities ───────────────
    // startHub = where customer picks up the vehicle
    // endHub   = where customer drops it off (different city = USP!)
    // On completion: vehicle.currentHub automatically becomes endHub
    startHub: { type: hubSchema, required: [true, 'Pickup hub required'] },
    endHub:   { type: hubSchema, required: [true, 'Drop-off hub required'] },

    startDate: { type: Date, required: [true, 'Start date required'] },
    endDate:   { type: Date, required: [true, 'End date required'] },
    totalDays: { type: Number, min: 1 },

    // Pricing breakdown
    pricePerDay:   { type: Number, required: true },
    rentalCost:    { type: Number, required: true },
    depositAmount: { type: Number, default: 2000 },
    platformFee:   { type: Number, default: 0 },
    totalPrice:    { type: Number, required: true },
    depositReleased: { type: Boolean, default: false },
    vendorPaid:      { type: Boolean, default: false },

    // ── Status FSM ────────────────────────────────────────────────────────────
    // pending → (vendor accepts) → active
    // active  → (trip starts)   → in_transit
    // in_transit → (arrives at endHub) → completed  ← vehicle relocates here!
    // Any state → cancelled
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

    // Live GPS during trip — updated via Socket.io push_location events
    livePosition: {
      lat:       { type: Number, default: null },
      lng:       { type: Number, default: null },
      updatedAt: { type: Date,   default: null },
    },

    // Chat room for customer ↔ vendor messaging
    chatRoomId: { type: String },
    messages:   [messageSchema],

    // Cancellation info
    cancelledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt:  { type: Date,   default: null },
    cancelReason: { type: String, default: null },

    // Completion
    completedAt:    { type: Date, default: null },
    customerRating: { type: Number, min: 1, max: 5, default: null },
    vendorRating:   { type: Number, min: 1, max: 5, default: null },
    reviewNote:     { type: String, default: null },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Indexes
bookingSchema.index({ user: 1, status: 1 })
bookingSchema.index({ vehicle: 1, status: 1 })
bookingSchema.index({ 'startHub.name': 1 })
bookingSchema.index({ 'endHub.name': 1 })
bookingSchema.index({ startDate: 1, endDate: 1 })

// Pre-save: compute totalDays + auto chatRoomId
bookingSchema.pre('save', function (next) {
  if (this.isModified('startDate') || this.isModified('endDate')) {
    const ms = new Date(this.endDate) - new Date(this.startDate)
    this.totalDays = Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)))
  }
  if (!this.chatRoomId) {
    this.chatRoomId = `booking_${this._id}`
  }
  next()
})

// Virtuals
bookingSchema.virtual('routeSummary').get(function () {
  return `${this.startHub?.name} → ${this.endHub?.name}`
})
bookingSchema.virtual('isCrossHubTrip').get(function () {
  return this.startHub?.name !== this.endHub?.name
})

// Static: check vehicle availability for date range
bookingSchema.statics.isVehicleAvailable = async function (vehicleId, startDate, endDate, excludeId = null) {
  const query = {
    vehicle:   vehicleId,
    status:    { $in: ['pending', 'active', 'in_transit'] },
    startDate: { $lt: new Date(endDate) },
    endDate:   { $gt: new Date(startDate) },
  }
  if (excludeId) query._id = { $ne: excludeId }
  const conflict = await this.findOne(query)
  return !conflict
}

// Static: top hub-to-hub routes (USP analytics)
bookingSchema.statics.getTopRoutes = async function (limit = 10) {
  return this.aggregate([
    { $match: { status: 'completed' } },
    {
      $group: {
        _id:           { from: '$startHub.name', to: '$endHub.name' },
        totalBookings: { $sum: 1 },
        totalRevenue:  { $sum: '$rentalCost' },
        avgDays:       { $avg: '$totalDays' },
      },
    },
    { $sort: { totalBookings: -1 } },
    { $limit: limit },
  ])
}

module.exports = mongoose.model('Booking', bookingSchema)