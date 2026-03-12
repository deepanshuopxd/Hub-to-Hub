// const Vehicle = require('../models/Vehicle.model')
// const Booking = require('../models/Booking.model')
// const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers')
// const { cloudinary } = require('../config/cloudinary')

// // ── GET /api/vehicles ─────────────────────────────────────────────────────────
// // USP: filter by hub — customers see only vehicles AT their chosen start hub
// const getAllVehicles = asyncHandler(async (req, res) => {
//   const { hub, category, minPrice, maxPrice, available = 'true' } = req.query

//   const filter = { isActive: true }

//   if (available === 'true') filter.isAvailable = true

//   // USP core query: find vehicles at a specific hub
//   if (hub)      filter['currentHub.name'] = { $regex: hub, $options: 'i' }
//   if (category) filter.category = category

//   if (minPrice || maxPrice) {
//     filter.pricePerDay = {}
//     if (minPrice) filter.pricePerDay.$gte = Number(minPrice)
//     if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice)
//   }

//   const vehicles = await Vehicle.find(filter)
//     .populate('owner', 'name email phone homeHub')
//     .sort({ pricePerDay: 1 })
//     .lean()

//   sendSuccess(res, 200, { count: vehicles.length, vehicles })
// })

// // ── GET /api/vehicles/vendor/my-fleet ────────────────────────────────────────
// const getVendorFleet = asyncHandler(async (req, res) => {
//   const vehicles = await Vehicle.find({ owner: req.user._id, isActive: true })
//     .sort({ createdAt: -1 })
//     .lean()

//   // Attach active booking count per vehicle
//   const withStats = await Promise.all(
//     vehicles.map(async (v) => {
//       const activeBookings = await Booking.countDocuments({
//         vehicle: v._id,
//         status:  { $in: ['pending', 'active', 'in_transit'] },
//       })
//       const totalRevenue = await Booking.aggregate([
//         { $match: { vehicle: v._id, status: 'completed' } },
//         { $group: { _id: null, total: { $sum: '$rentalCost' } } },
//       ])
//       return {
//         ...v,
//         activeBookings,
//         totalRevenue: totalRevenue[0]?.total || 0,
//       }
//     })
//   )

//   sendSuccess(res, 200, { count: withStats.length, vehicles: withStats })
// })

// // ── GET /api/vehicles/:id ─────────────────────────────────────────────────────
// const getVehicleById = asyncHandler(async (req, res) => {
//   const vehicle = await Vehicle.findById(req.params.id)
//     .populate('owner', 'name email phone homeHub')

//   if (!vehicle || !vehicle.isActive) {
//     return sendError(res, 404, 'Vehicle not found')
//   }

//   sendSuccess(res, 200, { vehicle })
// })

// // ── POST /api/vehicles ────────────────────────────────────────────────────────
// const createVehicle = asyncHandler(async (req, res) => {
//   const {
//     make, model, year, plateNumber,
//     pricePerDay, category, description, currentHub,
//   } = req.body

//   if (!make || !model || !year || !plateNumber || !pricePerDay || !currentHub) {
//     return sendError(res, 400, 'All required fields must be provided')
//   }

//   // Parse hub if sent as JSON string
//   const hub = typeof currentHub === 'string' ? JSON.parse(currentHub) : currentHub

//   // Collect uploaded image URLs from Cloudinary (via multer)
//   const images = req.files?.map(f => f.path) || []

//   const vehicle = await Vehicle.create({
//     make:        make.trim(),
//     model:       model.trim(),
//     year:        Number(year),
//     plateNumber: plateNumber.trim().toUpperCase(),
//     pricePerDay: Number(pricePerDay),
//     category:    category || 'sedan',
//     description: description?.trim(),
//     currentHub:  hub,
//     images,
//     owner:       req.user._id,
//     // Record initial hub in history
//     hubHistory:  [{ hub, arrivedAt: new Date() }],
//   })

//   sendSuccess(res, 201, {
//     message: 'Vehicle added to fleet',
//     vehicle,
//   })
// })

// // ── PUT /api/vehicles/:id ─────────────────────────────────────────────────────
// const updateVehicle = asyncHandler(async (req, res) => {
//   const vehicle = await Vehicle.findById(req.params.id)
//   if (!vehicle) return sendError(res, 404, 'Vehicle not found')
//   if (vehicle.owner.toString() !== req.user._id.toString()) {
//     return sendError(res, 403, 'Not authorised to edit this vehicle')
//   }

//   const allowed = ['make', 'model', 'year', 'pricePerDay', 'category', 'description', 'isAvailable']
//   allowed.forEach(field => {
//     if (req.body[field] !== undefined) vehicle[field] = req.body[field]
//   })

//   // Handle hub change
//   if (req.body.currentHub) {
//     const hub = typeof req.body.currentHub === 'string'
//       ? JSON.parse(req.body.currentHub)
//       : req.body.currentHub
//     vehicle.currentHub = hub
//   }

//   await vehicle.save()
//   sendSuccess(res, 200, { message: 'Vehicle updated', vehicle })
// })

// // ── PATCH /api/vehicles/:id/availability ──────────────────────────────────────
// const toggleAvailability = asyncHandler(async (req, res) => {
//   const vehicle = await Vehicle.findById(req.params.id)
//   if (!vehicle) return sendError(res, 404, 'Vehicle not found')
//   if (vehicle.owner.toString() !== req.user._id.toString()) {
//     return sendError(res, 403, 'Not authorised')
//   }

//   vehicle.isAvailable = req.body.isAvailable ?? !vehicle.isAvailable
//   await vehicle.save()

//   sendSuccess(res, 200, {
//     message:     `Vehicle marked as ${vehicle.isAvailable ? 'available' : 'unavailable'}`,
//     isAvailable: vehicle.isAvailable,
//   })
// })

// // ── DELETE /api/vehicles/:id ──────────────────────────────────────────────────
// const deleteVehicle = asyncHandler(async (req, res) => {
//   const vehicle = await Vehicle.findById(req.params.id)
//   if (!vehicle) return sendError(res, 404, 'Vehicle not found')
//   if (vehicle.owner.toString() !== req.user._id.toString()) {
//     return sendError(res, 403, 'Not authorised to delete this vehicle')
//   }

//   // Check no active bookings
//   const active = await Booking.findOne({
//     vehicle: req.params.id,
//     status:  { $in: ['pending', 'active', 'in_transit'] },
//   })
//   if (active) {
//     return sendError(res, 400, 'Cannot delete vehicle with active bookings')
//   }

//   // Soft delete
//   vehicle.isActive = false
//   await vehicle.save()

//   sendSuccess(res, 200, { message: 'Vehicle removed from fleet' })
// })

// // ── GET /api/vehicles/hubs ────────────────────────────────────────────────────
// // Returns all distinct hubs that have at least one available vehicle
// // USP: powers the "where can I pick up?" discovery flow
// const getAvailableHubs = asyncHandler(async (req, res) => {
//   const hubs = await Vehicle.aggregate([
//     { $match: { isAvailable: true, isActive: true } },
//     {
//       $group: {
//         _id:          '$currentHub.name',
//         hubName:      { $first: '$currentHub.name' },
//         city:         { $first: '$currentHub.city' },
//         lat:          { $first: '$currentHub.lat' },
//         lng:          { $first: '$currentHub.lng' },
//         vehicleCount: { $sum: 1 },
//         minPrice:     { $min: '$pricePerDay' },
//         categories:   { $addToSet: '$category' },
//       },
//     },
//     { $sort: { vehicleCount: -1 } },
//   ])

//   sendSuccess(res, 200, { count: hubs.length, hubs })
// })

// // ── PATCH /api/vehicles/:id/position ─────────────────────────────────────────
// // Called by Socket.io tracking — updates last known GPS
// const updatePosition = asyncHandler(async (req, res) => {
//   const { lat, lng } = req.body
//   const vehicle = await Vehicle.findById(req.params.id)
//   if (!vehicle) return sendError(res, 404, 'Vehicle not found')

//   vehicle.lastKnownPosition = { lat, lng, updatedAt: new Date() }
//   await vehicle.save()

//   sendSuccess(res, 200, { message: 'Position updated' })
// })

// module.exports = {
//   getAllVehicles,
//   getVendorFleet,
//   getVehicleById,
//   createVehicle,
//   updateVehicle,
//   toggleAvailability,
//   deleteVehicle,
//   getAvailableHubs,
//   updatePosition,
// }





// const Vehicle = require('../models/Vehicle.model')
// const Booking = require('../models/Booking.model')

// const asyncHandler = (fn) => (req, res, next) =>
//   Promise.resolve(fn(req, res, next)).catch(next)

// // GET /api/vehicles  — browse all available vehicles, filter by hub (USP)
// const getAllVehicles = asyncHandler(async (req, res) => {
//   const { hub, category, minPrice, maxPrice, available = 'true' } = req.query

//   const filter = { isActive: true }
//   if (available === 'true') filter.isAvailable = true

//   // USP query: find vehicles sitting at a specific pickup hub
//   if (hub)      filter['currentHub.name'] = { $regex: hub, $options: 'i' }
//   if (category) filter.category           = category

//   if (minPrice || maxPrice) {
//     filter.pricePerDay = {}
//     if (minPrice) filter.pricePerDay.$gte = Number(minPrice)
//     if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice)
//   }

//   const vehicles = await Vehicle.find(filter)
//     .populate('owner', 'name phone homeHub')
//     .sort({ pricePerDay: 1 })
//     .lean()

//   res.status(200).json({ count: vehicles.length, vehicles })
// })

// // GET /api/vehicles/vendor/my-fleet
// const getVendorFleet = asyncHandler(async (req, res) => {
//   const vehicles = await Vehicle.find({ owner: req.user._id, isActive: true })
//     .sort({ createdAt: -1 })
//     .lean()

//   // Attach per-vehicle booking stats
//   const withStats = await Promise.all(
//     vehicles.map(async (v) => {
//       const [activeCount, revenueResult] = await Promise.all([
//         Booking.countDocuments({ vehicle: v._id, status: { $in: ['pending','active','in_transit'] } }),
//         Booking.aggregate([
//           { $match: { vehicle: v._id, status: 'completed' } },
//           { $group: { _id: null, total: { $sum: '$rentalCost' } } },
//         ]),
//       ])
//       return { ...v, activeBookings: activeCount, totalRevenue: revenueResult[0]?.total || 0 }
//     })
//   )

//   res.status(200).json({ count: withStats.length, vehicles: withStats })
// })

// // GET /api/vehicles/hubs — distinct hubs with available vehicle counts
// // Powers the "where can I pick up?" map on the booking page (USP)
// const getAvailableHubs = asyncHandler(async (req, res) => {
//   const hubs = await Vehicle.aggregate([
//     { $match: { isAvailable: true, isActive: true } },
//     {
//       $group: {
//         _id:          '$currentHub.name',
//         name:         { $first: '$currentHub.name' },
//         city:         { $first: '$currentHub.city' },
//         lat:          { $first: '$currentHub.lat' },
//         lng:          { $first: '$currentHub.lng' },
//         vehicleCount: { $sum: 1 },
//         minPrice:     { $min: '$pricePerDay' },
//         categories:   { $addToSet: '$category' },
//       },
//     },
//     { $sort: { vehicleCount: -1 } },
//   ])
//   res.status(200).json({ count: hubs.length, hubs })
// })

// // GET /api/vehicles/:id
// const getVehicleById = asyncHandler(async (req, res) => {
//   const vehicle = await Vehicle.findById(req.params.id)
//     .populate('owner', 'name phone homeHub')
//   if (!vehicle || !vehicle.isActive) {
//     return res.status(404).json({ message: 'Vehicle not found' })
//   }
//   res.status(200).json({ vehicle })
// })

// // POST /api/vehicles
// const createVehicle = asyncHandler(async (req, res) => {
//   const { make, model, year, plateNumber, pricePerDay, category, description, currentHub } = req.body

//   if (!make || !model || !year || !plateNumber || !pricePerDay || !currentHub) {
//     return res.status(400).json({ message: 'All required fields must be provided' })
//   }

//   const hub    = typeof currentHub === 'string' ? JSON.parse(currentHub) : currentHub
//   const images = req.files?.map(f => f.path) || []

//   const vehicle = await Vehicle.create({
//     make:        make.trim(),
//     model:       model.trim(),
//     year:        Number(year),
//     plateNumber: plateNumber.trim().toUpperCase(),
//     pricePerDay: Number(pricePerDay),
//     category:    category || 'sedan',
//     description: description?.trim(),
//     currentHub:  hub,
//     images,
//     owner:       req.user._id,
//     hubHistory:  [{ hub, arrivedAt: new Date() }],
//   })

//   res.status(201).json({ message: 'Vehicle added to fleet', vehicle })
// })

// // PUT /api/vehicles/:id
// const updateVehicle = asyncHandler(async (req, res) => {
//   const vehicle = await Vehicle.findById(req.params.id)
//   if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
//   if (vehicle.owner.toString() !== req.user._id.toString()) {
//     return res.status(403).json({ message: 'Not authorised' })
//   }

//   const editable = ['make','model','year','pricePerDay','category','description','isAvailable']
//   editable.forEach(f => { if (req.body[f] !== undefined) vehicle[f] = req.body[f] })

//   if (req.body.currentHub) {
//     vehicle.currentHub = typeof req.body.currentHub === 'string'
//       ? JSON.parse(req.body.currentHub)
//       : req.body.currentHub
//   }

//   await vehicle.save()
//   res.status(200).json({ message: 'Vehicle updated', vehicle })
// })

// // PATCH /api/vehicles/:id/availability
// const toggleAvailability = asyncHandler(async (req, res) => {
//   const vehicle = await Vehicle.findById(req.params.id)
//   if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
//   if (vehicle.owner.toString() !== req.user._id.toString()) {
//     return res.status(403).json({ message: 'Not authorised' })
//   }

//   vehicle.isAvailable = req.body.isAvailable ?? !vehicle.isAvailable
//   await vehicle.save()
//   res.status(200).json({ message: 'Availability updated', isAvailable: vehicle.isAvailable })
// })

// // DELETE /api/vehicles/:id  (soft delete)
// const deleteVehicle = asyncHandler(async (req, res) => {
//   const vehicle = await Vehicle.findById(req.params.id)
//   if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
//   if (vehicle.owner.toString() !== req.user._id.toString()) {
//     return res.status(403).json({ message: 'Not authorised' })
//   }

//   const activeBooking = await Booking.findOne({
//     vehicle: req.params.id,
//     status:  { $in: ['pending','active','in_transit'] },
//   })
//   if (activeBooking) {
//     return res.status(400).json({ message: 'Cannot delete vehicle with active bookings' })
//   }

//   vehicle.isActive = false
//   await vehicle.save()
//   res.status(200).json({ message: 'Vehicle removed from fleet' })
// })

// module.exports = {
//   getAllVehicles, getVendorFleet, getAvailableHubs,
//   getVehicleById, createVehicle, updateVehicle,
//   toggleAvailability, deleteVehicle,
// }






const Vehicle = require('../models/Vehicle.model')
const Booking = require('../models/Booking.model')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// GET /api/vehicles
const getAllVehicles = asyncHandler(async (req, res) => {
  const { hub, category, minPrice, maxPrice, available = 'true' } = req.query
  const filter = { isActive: true }
  if (available === 'true') filter.isAvailable = true
  if (hub)      filter['currentHub.name'] = { $regex: hub, $options: 'i' }
  if (category) filter.category = category
  if (minPrice || maxPrice) {
    filter.pricePerDay = {}
    if (minPrice) filter.pricePerDay.$gte = Number(minPrice)
    if (maxPrice) filter.pricePerDay.$lte = Number(maxPrice)
  }
  const vehicles = await Vehicle.find(filter)
    .populate('owner', 'name phone homeHub')
    .sort({ pricePerDay: 1 })
    .lean()
  res.status(200).json({ count: vehicles.length, vehicles })
})

// GET /api/vehicles/vendor/my-fleet
const getVendorFleet = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ owner: req.user._id, isActive: true })
    .sort({ createdAt: -1 })
    .lean()
  const withStats = await Promise.all(
    vehicles.map(async (v) => {
      const [activeCount, revenueResult] = await Promise.all([
        Booking.countDocuments({ vehicle: v._id, status: { $in: ['pending','active','in_transit'] } }),
        Booking.aggregate([
          { $match: { vehicle: v._id, status: 'completed' } },
          { $group: { _id: null, total: { $sum: '$rentalCost' } } },
        ]),
      ])
      return { ...v, activeBookings: activeCount, totalRevenue: revenueResult[0]?.total || 0 }
    })
  )
  res.status(200).json({ count: withStats.length, vehicles: withStats })
})

// GET /api/vehicles/hubs
const getAvailableHubs = asyncHandler(async (req, res) => {
  const hubs = await Vehicle.aggregate([
    { $match: { isAvailable: true, isActive: true } },
    {
      $group: {
        _id:          '$currentHub.name',
        name:         { $first: '$currentHub.name' },
        city:         { $first: '$currentHub.city' },
        lat:          { $first: '$currentHub.lat' },
        lng:          { $first: '$currentHub.lng' },
        vehicleCount: { $sum: 1 },
        minPrice:     { $min: '$pricePerDay' },
        categories:   { $addToSet: '$category' },
      },
    },
    { $sort: { vehicleCount: -1 } },
  ])
  res.status(200).json({ count: hubs.length, hubs })
})

// GET /api/vehicles/:id
const getVehicleById = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
    .populate('owner', 'name phone homeHub')
  if (!vehicle || !vehicle.isActive) {
    return res.status(404).json({ message: 'Vehicle not found' })
  }
  res.status(200).json({ vehicle })
})

// POST /api/vehicles
// const createVehicle = asyncHandler(async (req, res) => {
//   const { make, model, year, plateNumber, pricePerDay, category, description, currentHub } = req.body

//   if (!make || !model || !year || !plateNumber || !pricePerDay || !currentHub) {
//     return res.status(400).json({ message: 'make, model, year, plateNumber, pricePerDay and currentHub are all required' })
//   }

//   // currentHub is sent as JSON string from multipart/form-data
//   let hub
//   try {
//     hub = typeof currentHub === 'string' ? JSON.parse(currentHub) : currentHub
//   } catch (e) {
//     return res.status(400).json({ message: 'Invalid currentHub format — must be a valid JSON object' })
//   }

//   if (!hub.name || !hub.lat || !hub.lng) {
//     return res.status(400).json({ message: 'currentHub must have name, lat and lng' })
//   }

//   // Collect Cloudinary URLs from multer upload
//   const images = req.files?.map(f => f.path) || []

//   const vehicle = await Vehicle.create({
//     make:        make.trim(),
//     model:       model.trim(),
//     year:        Number(year),
//     plateNumber: plateNumber.trim().toUpperCase(),
//     pricePerDay: Number(pricePerDay),
//     category:    category || 'sedan',
//     description: description?.trim(),
//     currentHub:  hub,
//     images,
//     owner:       req.user._id,
//     hubHistory:  [{ hub, arrivedAt: new Date() }],
//   })

//   res.status(201).json({ message: 'Vehicle added to fleet', vehicle })
// })

const createVehicle = asyncHandler(async (req, res) => {
  try {
    const {
      make,
      model,
      year,
      plateNumber,
      pricePerDay,
      category,
      description,
      currentHub,
    } = req.body

    if (!make || !model || !year || !plateNumber || !pricePerDay || !currentHub) {
      return res.status(400).json({
        message:
          "make, model, year, plateNumber, pricePerDay and currentHub are all required",
      })
    }

    /* ---------------- Parse Hub ---------------- */

    let hub

    if (typeof currentHub === "string") {
      try {
        // try parsing JSON if sent as JSON string
        hub = JSON.parse(currentHub)
      } catch (err) {
        // fallback if only hub name sent
        hub = {
          name: currentHub,
          city: "Unknown",
          lat: 0,
          lng: 0,
        }
      }
    } else {
      hub = currentHub
    }

    if (!hub.name) {
      return res.status(400).json({
        message: "currentHub must include at least a hub name",
      })
    }

    /* ---------------- Images from Cloudinary ---------------- */

    const images =
      req.files && req.files.length > 0
        ? req.files.map((file) => file.path)
        : []

    /* ---------------- Create Vehicle ---------------- */

    const vehicle = await Vehicle.create({
      make: make.trim(),
      model: model.trim(),
      year: Number(year),
      plateNumber: plateNumber.trim().toUpperCase(),
      pricePerDay: Number(pricePerDay),
      category: category || "sedan",
      description: description?.trim(),
      currentHub: hub,
      images,
      owner: req.user._id,
      hubHistory: [
        {
          hub,
          arrivedAt: new Date(),
        },
      ],
    })

    res.status(201).json({
      message: "Vehicle added to fleet",
      vehicle,
    })
  } catch (error) {
    console.error("Create Vehicle Error:", error)

    res.status(500).json({
      message: "Failed to create vehicle",
      error: error.message,
    })
  }
})

// PUT /api/vehicles/:id
const updateVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
  if (vehicle.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised' })
  }
  const editable = ['make','model','year','pricePerDay','category','description','isAvailable']
  editable.forEach(f => { if (req.body[f] !== undefined) vehicle[f] = req.body[f] })
  if (req.body.currentHub) {
    try {
      vehicle.currentHub = typeof req.body.currentHub === 'string'
        ? JSON.parse(req.body.currentHub)
        : req.body.currentHub
    } catch (e) {
      return res.status(400).json({ message: 'Invalid currentHub format' })
    }
  }
  await vehicle.save()
  res.status(200).json({ message: 'Vehicle updated', vehicle })
})

// PATCH /api/vehicles/:id/availability
const toggleAvailability = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
  if (vehicle.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised' })
  }
  vehicle.isAvailable = req.body.isAvailable ?? !vehicle.isAvailable
  await vehicle.save()
  res.status(200).json({ message: 'Availability updated', isAvailable: vehicle.isAvailable })
})

// DELETE /api/vehicles/:id
const deleteVehicle = asyncHandler(async (req, res) => {
  const vehicle = await Vehicle.findById(req.params.id)
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' })
  if (vehicle.owner.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorised' })
  }
  const activeBooking = await Booking.findOne({
    vehicle: req.params.id,
    status:  { $in: ['pending','active','in_transit'] },
  })
  if (activeBooking) {
    return res.status(400).json({ message: 'Cannot delete vehicle with active bookings' })
  }
  vehicle.isActive = false
  await vehicle.save()
  res.status(200).json({ message: 'Vehicle removed from fleet' })
})

module.exports = {
  getAllVehicles, getVendorFleet, getAvailableHubs,
  getVehicleById, createVehicle, updateVehicle,
  toggleAvailability, deleteVehicle,
}


