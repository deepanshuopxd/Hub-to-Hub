// const mongoose = require('mongoose')

// // ── Hub sub-schema (reused across models) ────────────────────────────────────
// // This is the CORE USP data structure — every vehicle always knows which
// // hub it currently lives at, enabling the hub-to-hub movement network.
// const hubSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true, trim: true },
//     city: { type: String, trim: true },
//     lat:  { type: Number, required: true },
//     lng:  { type: Number, required: true },
//   },
//   { _id: false }
// )

// const vehicleSchema = new mongoose.Schema(
//   {
//     // ── Identity ─────────────────────────────────────────────────────────────
//     make:  {
//       type:     String,
//       required: [true, 'Vehicle make is required'],
//       trim:     true,
//     },
//     model: {
//       type:     String,
//       required: [true, 'Vehicle model is required'],
//       trim:     true,
//     },
//     year:  {
//       type:     Number,
//       required: [true, 'Year is required'],
//       min:      [2000, 'Year must be 2000 or later'],
//       max:      [new Date().getFullYear() + 1, 'Invalid year'],
//     },
//     plateNumber: {
//       type:      String,
//       required:  [true, 'Plate number is required'],
//       unique:    true,
//       uppercase: true,
//       trim:      true,
//       match:     [/^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/, 'Invalid plate format (e.g. MH01AB1234)'],
//     },
//     category: {
//       type:    String,
//       enum:    ['sedan', 'suv', 'hatchback', 'bike', 'van'],
//       default: 'sedan',
//     },
//     description: { type: String, trim: true, maxlength: 500 },
//     images:      [{ type: String }],    // Cloudinary URLs

//     // ── Pricing ───────────────────────────────────────────────────────────────
//     pricePerDay: {
//       type:     Number,
//       required: [true, 'Price per day is required'],
//       min:      [100, 'Minimum price is ₹100/day'],
//     },

//     // ── USP CORE: Hub Location ────────────────────────────────────────────────
//     // currentHub = where the vehicle physically is RIGHT NOW
//     // This changes every time a booking completes — the vehicle lands at endHub
//     // This is what makes the decentralized network work.
//     currentHub: {
//       type:     hubSchema,
//       required: [true, 'Current hub location is required'],
//     },

//     // Full history of all hubs this vehicle has passed through
//     // Useful for analytics: most popular routes, vehicle utilisation
//     hubHistory: [
//       {
//         hub:       hubSchema,
//         arrivedAt: { type: Date, default: Date.now },
//         bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
//       },
//     ],

//     // ── Ownership ─────────────────────────────────────────────────────────────
//     owner: {
//       type:     mongoose.Schema.Types.ObjectId,
//       ref:      'User',
//       required: true,
//     },

//     // ── Availability ──────────────────────────────────────────────────────────
//     // false when a booking is active/in_transit
//     // true when vehicle is sitting at a hub ready to be booked
//     isAvailable: { type: Boolean, default: true },

//     // ── Stats (USP analytics) ─────────────────────────────────────────────────
//     // Track how many unique hub-to-hub routes this vehicle has done
//     totalTrips:      { type: Number, default: 0 },
//     totalKmEstimate: { type: Number, default: 0 },
//     totalRevenue:    { type: Number, default: 0 },

//     // Last GPS coordinates (updated live via Socket.io during a trip)
//     lastKnownPosition: {
//       lat:       { type: Number, default: null },
//       lng:       { type: Number, default: null },
//       updatedAt: { type: Date,   default: null },
//     },

//     isActive: { type: Boolean, default: true },
//   },
//   {
//     timestamps: true,
//     toJSON:     { virtuals: true },
//     toObject:   { virtuals: true },
//   }
// )

// // ── Indexes ──────────────────────────────────────────────────────────────────
// vehicleSchema.index({ 'currentHub.name': 1 })
// vehicleSchema.index({ isAvailable: 1 })
// vehicleSchema.index({ owner: 1 })
// vehicleSchema.index({ category: 1 })
// vehicleSchema.index({ pricePerDay: 1 })
// vehicleSchema.index({ plateNumber: 1 }, { unique: true })

// // ── Virtuals ─────────────────────────────────────────────────────────────────
// vehicleSchema.virtual('displayName').get(function () {
//   return `${this.make} ${this.model} (${this.year})`
// })

// // ── Methods ───────────────────────────────────────────────────────────────────

// // Called when a trip completes — moves vehicle to its new hub (USP logic)
// vehicleSchema.methods.relocateToHub = async function (newHub, bookingId) {
//   this.hubHistory.push({
//     hub:       this.currentHub,
//     arrivedAt: new Date(),
//     bookingId,
//   })
//   this.currentHub  = newHub
//   this.isAvailable = true
//   this.totalTrips += 1
//   await this.save()
// }

// // Update live GPS position during a trip
// vehicleSchema.methods.updatePosition = async function (lat, lng) {
//   this.lastKnownPosition = { lat, lng, updatedAt: new Date() }
//   await this.save()
// }

// module.exports = mongoose.model('Vehicle', vehicleSchema)




const mongoose = require('mongoose')

// Hub sub-schema — every vehicle always knows which hub it currently lives at
// This is the backbone of the USP: vehicles relocate hub-to-hub with every trip
const hubSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    city: { type: String, trim: true },
    lat:  { type: Number, required: true },
    lng:  { type: Number, required: true },
  },
  { _id: false }
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
      match:     [/^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$/, 'Invalid plate format e.g. MH01AB1234'],
    },
    category: {
      type:    String,
      enum:    ['sedan', 'suv', 'hatchback', 'bike', 'van'],
      default: 'sedan',
    },
    description: { type: String, trim: true, maxlength: 500 },
    images:      [{ type: String }],   // Cloudinary URLs

    pricePerDay: {
      type:     Number,
      required: [true, 'Price per day is required'],
      min:      [100, 'Minimum ₹100/day'],
    },

    // ── USP CORE FIELD ────────────────────────────────────────────────────────
    // currentHub: where this vehicle physically is RIGHT NOW
    // Changes automatically when a booking completes (vehicle relocates to endHub)
    // This is what enables "drop off anywhere" — the self-rebalancing network
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

    // Analytics
    totalTrips:   { type: Number, default: 0 },
    totalRevenue: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
)

// Indexes
vehicleSchema.index({ 'currentHub.name': 1 })
vehicleSchema.index({ isAvailable: 1, isActive: 1 })
vehicleSchema.index({ owner: 1 })
vehicleSchema.index({ category: 1, pricePerDay: 1 })

// Virtuals
vehicleSchema.virtual('displayName').get(function () {
  return `${this.make} ${this.model} (${this.year})`
})

// Called when a booking completes — vehicle relocates to the endHub (THE USP)
vehicleSchema.methods.relocateToHub = async function (newHub, bookingId) {
  this.hubHistory.push({
    hub:       this.currentHub,
    arrivedAt: new Date(),
    bookingId,
  })
  this.currentHub  = newHub
  this.isAvailable = true
  this.totalTrips += 1
  await this.save()
}

module.exports = mongoose.model('Vehicle', vehicleSchema)