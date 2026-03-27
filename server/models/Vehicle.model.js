const mongoose = require('mongoose')

// ── Hub sub-schema ────────────────────────────────────────────────────────────
const hubSchema = new mongoose.Schema(
  {
    name:    { type: String, required: true, trim: true },
    city:    { type: String, trim: true },
    address: { type: String, trim: true },
    lat:     { type: Number, required: true },
    lng:     { type: Number, required: true },
    // Which vendor/rental service owns this hub
    vendorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rentalService:  { type: String, trim: true, default: null },
  },
  { _id: false }
)

// ── Media sub-schema (images + video) ────────────────────────────────────────
const mediaSchema = new mongoose.Schema(
  {
    url:        { type: String, required: true },   // Cloudinary URL
    type:       { type: String, enum: ['image', 'video'], required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    uploadedAt: { type: Date, default: Date.now },
    note:       { type: String, default: null },     // optional caption
  },
  { _id: true }
)

const vehicleSchema = new mongoose.Schema(
  {
    make: {
      type:     String,
      required: [true, 'Make is required'],
      trim:     true,
    },
    model: {
      type:     String,
      required: [true, 'Model is required'],
      trim:     true,
    },
    year: {
      type:     Number,
      required: [true, 'Year is required'],
      min:      [2000, 'Year must be 2000 or later'],
      max:      [new Date().getFullYear() + 1, 'Invalid year'],
    },
    plateNumber: {
      type:      String,
      required:  [true, 'Plate number is required'],
      unique:    true,
      uppercase: true,
      trim:      true,
    },
    category: {
      type:    String,
      enum:    ['sedan', 'suv', 'hatchback', 'bike', 'van'],
      default: 'sedan',
    },
    description: { type: String, trim: true, maxlength: 500 },
    images:      [{ type: String }],   // Cloudinary image URLs

    // ── Pricing ───────────────────────────────────────────────────────────────
    pricePerDay: {
      type:     Number,
      required: [true, 'Price per day is required'],
      min:      [100, 'Minimum ₹100/day'],
    },
    // Vendor-defined security deposit for this specific vehicle
    // Replaces the hardcoded global SECURITY_DEPOSIT
    securityDeposit: {
      type:    Number,
      default: 2000,
      min:     [0, 'Security deposit cannot be negative'],
    },

    // ── Rental Service (which vendor hub this vehicle belongs to) ─────────────
    // homeService = the rental service that originally registered this vehicle
    // currentHub  = where it physically is right now (changes after each trip)
    homeService: {
      vendorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
      name:        { type: String, trim: true, default: null },
      city:        { type: String, trim: true, default: null },
      address:     { type: String, trim: true, default: null },
      lat:         { type: Number, default: null },
      lng:         { type: Number, default: null },
    },

    // ── USP CORE FIELD ────────────────────────────────────────────────────────
    // currentHub changes every time a booking completes — vehicle relocates
    currentHub: {
      type:     hubSchema,
      required: [true, 'Current hub is required'],
    },

    // Full trail of every hub this vehicle has visited
    hubHistory: [
      {
        hub:       hubSchema,
        arrivedAt: { type: Date, default: Date.now },
        bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
      },
    ],

    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // false while a trip is active; true when sitting at a hub ready to rent
    isAvailable: { type: Boolean, default: true },

    // Live GPS position — updated via Socket.io during a trip
    lastKnownPosition: {
      lat:       { type: Number, default: null },
      lng:       { type: Number, default: null },
      updatedAt: { type: Date,   default: null },
    },

    // ── Handover Media ────────────────────────────────────────────────────────
    // pickupMedia  = photos/videos taken at pickup (condition at handover to customer)
    // dropoffMedia = photos/videos taken at dropoff (condition when returned)
    // Both customer AND vendor can upload to either set
    pickupMedia:  [mediaSchema],
    dropoffMedia: [mediaSchema],

    // Analytics
    totalTrips:   { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// ── Indexes ───────────────────────────────────────────────────────────────────
vehicleSchema.index({ 'currentHub.name': 1 })
vehicleSchema.index({ 'currentHub.city': 1 })
vehicleSchema.index({ 'homeService.city': 1 })
vehicleSchema.index({ isAvailable: 1, isActive: 1 })
vehicleSchema.index({ owner: 1 })
vehicleSchema.index({ category: 1, pricePerDay: 1 })

// ── Virtuals ──────────────────────────────────────────────────────────────────
vehicleSchema.virtual('displayName').get(function () {
  return `${this.make} ${this.model} (${this.year})`
})

// ── Methods ───────────────────────────────────────────────────────────────────

// Called when a booking completes — vehicle relocates to endHub (THE USP)
// newHub must include vendorId of the destination vendor
vehicleSchema.methods.relocateToHub = async function (newHub, bookingId) {
  // Save where it was
  this.hubHistory.push({
    hub:       this.currentHub,
    arrivedAt: new Date(),
    bookingId,
  })
  // Move to new hub — currentHub.vendorId now points to endVendor
  // so the vehicle shows in the destination vendor's fleet
  this.currentHub  = {
    name:          newHub.name          || newHub.city,
    city:          newHub.city          || newHub.name,
    address:       newHub.address       || '',
    lat:           newHub.lat           || 0,
    lng:           newHub.lng           || 0,
    vendorId:      newHub.vendorId      || null,
    rentalService: newHub.rentalService || newHub.name,
  }
  this.isAvailable = true
  this.totalTrips += 1
  await this.save()
}

module.exports = mongoose.model('Vehicle', vehicleSchema)