const mongoose = require('mongoose')

// ── Hub sub-schema ────────────────────────────────────────────────────────────
const hubSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true },
    city:          { type: String },
    address:       { type: String },
    lat:           { type: Number, default: 0 },
    lng:           { type: Number, default: 0 },
    vendorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rentalService: { type: String, default: null },
  },
  { _id: false }
)

// ── Message sub-schema ────────────────────────────────────────────────────────
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

// ── Media sub-schema ──────────────────────────────────────────────────────────
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
    reportedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reportedAt:   { type: Date, default: Date.now },
    description:  { type: String, trim: true },
    damageAmount: { type: Number, default: 0 },
    refundAmount: { type: Number, default: 0 },
    media:        [mediaSchema],
    resolved:     { type: Boolean, default: false },
  },
  { _id: false }
)

const bookingSchema = new mongoose.Schema(
  {
    user:    { type: mongoose.Schema.Types.ObjectId, ref: 'User',    required: true },
    vehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },

    startHub: { type: hubSchema, required: [true, 'Pickup hub required'] },
    endHub:   { type: hubSchema, required: [true, 'Drop-off hub required'] },

    // ── Vendors ───────────────────────────────────────────────────────────────
    startVendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    endVendor:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

    // ── Status FSM ────────────────────────────────────────────────────────────
    // pending                → startVendor approves → awaiting_destination_vendor
    // awaiting_destination_vendor → endVendor approves → active
    // active                 → customer picks up → in_transit
    // in_transit             → customer drops at endHub → dropped_at_destination
    // dropped_at_destination → endVendor marks received → completed_by_destination
    // completed_by_destination → startVendor releases deposit → completed
    // Any state              → cancelled
    status: {
      type:    String,
      enum:    [
        'pending',
        'awaiting_destination_vendor',
        'active',
        'in_transit',
        'dropped_at_destination',
        'completed_by_destination',
        'completed',
        'cancelled',
      ],
      default: 'pending',
    },

    // ── Approval tracking ─────────────────────────────────────────────────────
    startVendorApproved: { type: Boolean, default: false },
    endVendorApproved:   { type: Boolean, default: false },
    endVendorDeclined:   { type: Boolean, default: false },  // endVendor can decline without killing booking

    // ── Deposit release (manual by startVendor) ───────────────────────────────
    depositReleased:     { type: Boolean, default: false },
    depositReleasedAt:   { type: Date,    default: null  },
    depositReleasedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    depositDeductAmount: { type: Number,  default: 0     },  // how much was deducted
    depositRefundAmount: { type: Number,  default: 0     },  // how much was returned

    vendorPaid: { type: Boolean, default: false },

    // ── DateTime ──────────────────────────────────────────────────────────────
    startDateTime: { type: Date, required: [true, 'Start date/time required'] },
    endDateTime:   { type: Date, required: [true, 'End date/time required'] },
    startDate:     { type: Date },
    endDate:       { type: Date },
    totalDays:     { type: Number, min: 1 },
    totalHours:    { type: Number, min: 1 },

    // ── Pricing ───────────────────────────────────────────────────────────────
    pricePerDay:     { type: Number, required: true },
    pricePerHour:    { type: Number, default: 0 },
    rentalCost:      { type: Number, required: true },
    depositAmount:   { type: Number, required: true },
    platformFee:     { type: Number, default: 0 },
    totalPrice:      { type: Number, required: true },

    // ── Payment ───────────────────────────────────────────────────────────────
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

    statusHistory: [
      {
        status:    String,
        note:      String,
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        changedAt: { type: Date, default: Date.now },
      },
    ],

    // ── Media ─────────────────────────────────────────────────────────────────
    pickupMedia:  [mediaSchema],
    dropoffMedia: [mediaSchema],

    // ── Damage ────────────────────────────────────────────────────────────────
    damageReport: { type: damageSchema, default: null },

    // ── Live position ─────────────────────────────────────────────────────────
    livePosition: {
      lat:       { type: Number, default: null },
      lng:       { type: Number, default: null },
      updatedAt: { type: Date,   default: null },
    },

    // ── Chat ──────────────────────────────────────────────────────────────────
    chatRoomId: { type: String },
    messages:   [messageSchema],

    // ── Cancellation ──────────────────────────────────────────────────────────
    cancelledBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    cancelledAt:  { type: Date,   default: null },
    cancelReason: { type: String, default: null },

    // ── Completion ────────────────────────────────────────────────────────────
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

// ── Pre-save ──────────────────────────────────────────────────────────────────
bookingSchema.pre('save', function (next) {
  if (this.startDateTime) this.startDate = this.startDateTime
  if (this.endDateTime)   this.endDate   = this.endDateTime

  if (this.startDateTime && this.endDateTime) {
    const ms          = new Date(this.endDateTime) - new Date(this.startDateTime)
    const hours       = ms / (1000 * 60 * 60)
    this.totalHours   = Math.max(1, Math.ceil(hours))
    this.totalDays    = Math.max(1, Math.ceil(hours / 24))
    this.pricePerHour = this.pricePerDay / 24
  }

  if (!this.chatRoomId) this.chatRoomId = `booking_${this._id}`
  next()
})

// ── Virtuals ──────────────────────────────────────────────────────────────────
bookingSchema.virtual('routeSummary').get(function () {
  return `${this.startHub?.city || this.startHub?.name} → ${this.endHub?.city || this.endHub?.name}`
})
bookingSchema.virtual('isCrossCity').get(function () {
  return this.startHub?.city !== this.endHub?.city
})

// ── Statics ───────────────────────────────────────────────────────────────────
bookingSchema.statics.isVehicleAvailable = async function (vehicleId, startDateTime, endDateTime, excludeId = null) {
  const query = {
    vehicle:       vehicleId,
    status:        { $in: ['pending', 'awaiting_destination_vendor', 'active', 'in_transit', 'dropped_at_destination', 'completed_by_destination'] },
    startDateTime: { $lt: new Date(endDateTime) },
    endDateTime:   { $gt: new Date(startDateTime) },
  }
  if (excludeId) query._id = { $ne: excludeId }
  const conflict = await this.findOne(query)
  return !conflict
}

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