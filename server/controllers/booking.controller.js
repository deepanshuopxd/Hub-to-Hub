// // const Booking = require('../models/Booking.model')
// // const Vehicle = require('../models/Vehicle.model')
// // const User    = require('../models/User.model')
// // const { asyncHandler, sendSuccess, sendError, calculatePrice, haversineKm } = require('../utils/helpers')

// // // ── POST /api/bookings ────────────────────────────────────────────────────────
// // // USP: customer picks startHub ≠ endHub. Vehicle will relocate after trip.
// // const createBooking = asyncHandler(async (req, res) => {
// //   const { vehicleId, startHub, endHub, startDate, endDate } = req.body

// //   if (!vehicleId || !startHub || !endHub || !startDate || !endDate) {
// //     return sendError(res, 400, 'All booking fields are required')
// //   }

// //   // Validate dates
// //   const start = new Date(startDate)
// //   const end   = new Date(endDate)
// //   if (start >= end)          return sendError(res, 400, 'End date must be after start date')
// //   if (start < new Date(new Date().toDateString())) {
// //     return sendError(res, 400, 'Start date cannot be in the past')
// //   }

// //   // Check vehicle exists and is available
// //   const vehicle = await Vehicle.findById(vehicleId).populate('owner')
// //   if (!vehicle || !vehicle.isActive) return sendError(res, 404, 'Vehicle not found')
// //   if (!vehicle.isAvailable)          return sendError(res, 400, 'Vehicle is not available')

// //   // Check no date conflict
// //   const available = await Booking.isVehicleAvailable(vehicleId, startDate, endDate)
// //   if (!available) {
// //     return sendError(res, 409, 'Vehicle is already booked for these dates')
// //   }

// //   // Wallet check — customer must have enough for security deposit
// //   const customer = await User.findById(req.user._id)
// //   const deposit  = Number(process.env.SECURITY_DEPOSIT) || 2000
// //   if (customer.wallet.balance < deposit) {
// //     return sendError(res, 400, `Insufficient wallet balance. Need ₹${deposit} for security deposit`)
// //   }

// //   // Price calculation
// //   const { days, rental, fee } = calculatePrice(vehicle.pricePerDay, startDate, endDate)

// //   // USP metadata: calculate hub-to-hub distance
// //   const distanceKm = haversineKm(
// //     startHub.lat, startHub.lng,
// //     endHub.lat,   endHub.lng
// //   )

// //   // Lock deposit in customer wallet
// //   await customer.lockDeposit(deposit)

// //   // Mark vehicle unavailable
// //   vehicle.isAvailable = false
// //   await vehicle.save()

// //   // Create booking
// //   const booking = await Booking.create({
// //     user:          req.user._id,
// //     vehicle:       vehicleId,
// //     startHub,
// //     endHub,
// //     startDate:     start,
// //     endDate:       end,
// //     totalDays:     days,
// //     pricePerDay:   vehicle.pricePerDay,
// //     rentalCost:    rental,
// //     depositAmount: deposit,
// //     platformFee:   fee,
// //     totalPrice:    rental,    // deposit is separate
// //     status:        'pending',
// //     statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Booking created' }],
// //   })

// //   // Emit real-time notification to vendor
// //   const io = req.app.get('io')
// //   io?.to(`vendor_${vehicle.owner._id}`).emit('new_booking_request', {
// //     bookingId:   booking._id,
// //     vehicleName: `${vehicle.make} ${vehicle.model}`,
// //     route:       `${startHub.name} → ${endHub.name}`,
// //     distanceKm,
// //     days,
// //     totalPrice:  rental,
// //     customer:    customer.name,
// //   })

// //   const populated = await Booking.findById(booking._id)
// //     .populate('vehicle', 'make model year plateNumber images category')
// //     .populate('user',    'name email phone')

// //   sendSuccess(res, 201, {
// //     message: 'Booking created — awaiting vendor confirmation',
// //     booking: populated,
// //     distanceKm,
// //   })
// // })

// // // ── GET /api/bookings/my ──────────────────────────────────────────────────────
// // const getMyBookings = asyncHandler(async (req, res) => {
// //   const bookings = await Booking.find({ user: req.user._id })
// //     .populate('vehicle', 'make model year plateNumber images category currentHub')
// //     .populate('user',    'name email phone')
// //     .sort({ createdAt: -1 })

// //   sendSuccess(res, 200, { count: bookings.length, bookings })
// // })

// // // ── GET /api/bookings/vendor ──────────────────────────────────────────────────
// // const getVendorBookings = asyncHandler(async (req, res) => {
// //   // Find all vehicles owned by this vendor
// //   const vehicles = await Vehicle.find({ owner: req.user._id }).select('_id')
// //   const vehicleIds = vehicles.map(v => v._id)

// //   const bookings = await Booking.find({ vehicle: { $in: vehicleIds } })
// //     .populate('vehicle', 'make model year plateNumber images category currentHub')
// //     .populate('user',    'name email phone kyc')
// //     .sort({ createdAt: -1 })

// //   // Group by status for vendor dashboard
// //   const summary = {
// //     pending:    bookings.filter(b => b.status === 'pending').length,
// //     active:     bookings.filter(b => b.status === 'active').length,
// //     in_transit: bookings.filter(b => b.status === 'in_transit').length,
// //     completed:  bookings.filter(b => b.status === 'completed').length,
// //     cancelled:  bookings.filter(b => b.status === 'cancelled').length,
// //     totalRevenue: bookings
// //       .filter(b => b.status === 'completed')
// //       .reduce((sum, b) => sum + b.rentalCost, 0),
// //   }

// //   sendSuccess(res, 200, { count: bookings.length, bookings, summary })
// // })

// // // ── GET /api/bookings/:id ─────────────────────────────────────────────────────
// // const getBookingById = asyncHandler(async (req, res) => {
// //   const booking = await Booking.findById(req.params.id)
// //     .populate('vehicle', 'make model year plateNumber images category currentHub lastKnownPosition')
// //     .populate('user',    'name email phone')

// //   if (!booking) return sendError(res, 404, 'Booking not found')

// //   // Authorisation: only involved parties can see
// //   const isCustomer = booking.user._id.toString() === req.user._id.toString()
// //   const vehicle    = await Vehicle.findById(booking.vehicle._id)
// //   const isVendor   = vehicle?.owner?.toString() === req.user._id.toString()

// //   if (!isCustomer && !isVendor) {
// //     return sendError(res, 403, 'Not authorised to view this booking')
// //   }

// //   sendSuccess(res, 200, { booking })
// // })

// // // ── PATCH /api/bookings/:id/status ────────────────────────────────────────────
// // // USP CRITICAL: completing a booking relocates the vehicle to its endHub
// // const updateBookingStatus = asyncHandler(async (req, res) => {
// //   const { status, note } = req.body
// //   const validTransitions = {
// //     vendor:   { pending: 'active', active: 'in_transit', in_transit: 'completed', pending2: 'cancelled' },
// //     customer: { pending: 'cancelled' },
// //   }

// //   const booking = await Booking.findById(req.params.id)
// //     .populate('vehicle')
// //   if (!booking) return sendError(res, 404, 'Booking not found')

// //   const vehicle  = await Vehicle.findById(booking.vehicle._id)
// //   const isVendor = vehicle?.owner?.toString() === req.user._id.toString()
// //   const isCustomer = booking.user.toString() === req.user._id.toString()

// //   if (!isVendor && !isCustomer) return sendError(res, 403, 'Not authorised')

// //   // Validate status transition
// //   const allowed = isVendor
// //     ? ['active', 'in_transit', 'completed', 'cancelled']
// //     : ['cancelled']

// //   if (!allowed.includes(status)) {
// //     return sendError(res, 400, `Cannot set status to "${status}"`)
// //   }

// //   const previousStatus = booking.status
// //   booking.status = status
// //   booking.statusHistory.push({
// //     status,
// //     changedBy: req.user._id,
// //     note:      note || `Status changed to ${status}`,
// //   })

// //   // ── USP TRIGGER: Trip Completed ──────────────────────────────────────────
// //   // When a booking completes, the vehicle physically moves to the endHub.
// //   // This is the mechanism that makes the decentralised network self-sustaining.
// //   if (status === 'completed') {
// //     booking.completedAt  = new Date()
// //     booking.depositReleased = true

// //     // 1. Relocate vehicle to endHub (THE USP)
// //     await vehicle.relocateToHub(booking.endHub, booking._id)

// //     // 2. Release security deposit back to customer
// //     const customer = await User.findById(booking.user)
// //     await customer.releaseDeposit(booking.depositAmount)

// //     // 3. Pay vendor (rental cost minus platform fee)
// //     const vendorPayout = booking.rentalCost - booking.platformFee
// //     const vendor = await User.findById(vehicle.owner)
// //     vendor.wallet.balance += vendorPayout
// //     await vendor.save()

// //     // 4. Update vehicle revenue stats
// //     vehicle.totalRevenue += booking.rentalCost
// //     await vehicle.save()
// //   }

// //   // When cancelled, free the vehicle and return deposit
// //   if (status === 'cancelled') {
// //     booking.cancelledBy   = req.user._id
// //     booking.cancelledAt   = new Date()
// //     booking.cancelReason  = note || 'Cancelled by ' + req.user.role

// //     vehicle.isAvailable = true
// //     await vehicle.save()

// //     // Return deposit to customer
// //     const customer = await User.findById(booking.user)
// //     if (customer.wallet.locked >= booking.depositAmount) {
// //       await customer.releaseDeposit(booking.depositAmount)
// //     }
// //   }

// //   await booking.save()

// //   // Emit live update to both parties
// //   const io = req.app.get('io')
// //   io?.to(booking.chatRoomId).emit('booking_update', { ...booking.toObject(), status })
// //   io?.to(`user_${booking.user}`).emit('booking_status_change', {
// //     bookingId: booking._id,
// //     status,
// //     message:   getStatusMessage(status, booking),
// //   })

// //   const populated = await Booking.findById(booking._id)
// //     .populate('vehicle', 'make model year plateNumber images currentHub')
// //     .populate('user',    'name email phone')

// //   sendSuccess(res, 200, {
// //     message: `Booking ${status}`,
// //     booking: populated,
// //   })
// // })

// // // ── PATCH /api/bookings/:id/cancel ────────────────────────────────────────────
// // const cancelBooking = asyncHandler(async (req, res) => {
// //   req.body.status = 'cancelled'
// //   return updateBookingStatus(req, res)
// // })

// // // ── GET /api/bookings/stats ───────────────────────────────────────────────────
// // // USP analytics: most popular hub-to-hub routes
// // const getNetworkStats = asyncHandler(async (req, res) => {
// //   const routeStats = await Booking.getRouteStats()

// //   const totalCompleted = await Booking.countDocuments({ status: 'completed' })
// //   const totalRevenue   = await Booking.aggregate([
// //     { $match: { status: 'completed' } },
// //     { $group: { _id: null, total: { $sum: '$rentalCost' } } },
// //   ])

// //   const uniqueRoutes = await Booking.aggregate([
// //     { $match: { status: 'completed' } },
// //     {
// //       $group: {
// //         _id: { start: '$startHub.name', end: '$endHub.name' },
// //       },
// //     },
// //     { $count: 'total' },
// //   ])

// //   sendSuccess(res, 200, {
// //     totalTrips:   totalCompleted,
// //     totalRevenue: totalRevenue[0]?.total || 0,
// //     uniqueRoutes: uniqueRoutes[0]?.total || 0,
// //     topRoutes:    routeStats,
// //   })
// // })

// // // ── GET /api/bookings/:id/chat-history ────────────────────────────────────────
// // const getChatHistory = asyncHandler(async (req, res) => {
// //   const booking = await Booking.findById(req.params.id).select('messages chatRoomId user vehicle')
// //   if (!booking) return sendError(res, 404, 'Booking not found')

// //   sendSuccess(res, 200, {
// //     chatRoomId: booking.chatRoomId,
// //     messages:   booking.messages,
// //   })
// // })

// // // ── Helpers ───────────────────────────────────────────────────────────────────
// // const getStatusMessage = (status, booking) => ({
// //   active:     `Your booking for ${booking.vehicle?.make} is confirmed!`,
// //   in_transit: `Vehicle is on its way to ${booking.endHub?.name}`,
// //   completed:  `Trip completed! Your deposit of ₹${booking.depositAmount} has been released.`,
// //   cancelled:  `Booking cancelled. Deposit has been returned to your wallet.`,
// // }[status] || `Booking status updated to ${status}`)

// // module.exports = {
// //   createBooking,
// //   getMyBookings,
// //   getVendorBookings,
// //   getBookingById,
// //   updateBookingStatus,
// //   cancelBooking,
// //   getNetworkStats,
// //   getChatHistory,
// // }





// const Booking             = require('../models/Booking.model')
// const Vehicle             = require('../models/Vehicle.model')
// const User                = require('../models/User.model')
// const { calculatePrice }  = require('../utils/calculatePrice')

// const asyncHandler = (fn) => (req, res, next) =>
//   Promise.resolve(fn(req, res, next)).catch(next)

// // ─── POST /api/bookings ───────────────────────────────────────────────────────
// // USP: startHub ≠ endHub is the whole point. Vehicle relocates on completion.
// const createBooking = asyncHandler(async (req, res) => {
//   const { vehicleId, startHub, endHub, startDate, endDate } = req.body

//   if (!vehicleId || !startHub || !endHub || !startDate || !endDate) {
//     return res.status(400).json({ message: 'All booking fields are required' })
//   }

//   const start = new Date(startDate)
//   const end   = new Date(endDate)
//   if (start >= end)  return res.status(400).json({ message: 'End date must be after start date' })
//   if (start < new Date(new Date().toDateString())) {
//     return res.status(400).json({ message: 'Start date cannot be in the past' })
//   }

//   // Vehicle check
//   const vehicle = await Vehicle.findById(vehicleId).populate('owner', 'name _id')
//   if (!vehicle || !vehicle.isActive)  return res.status(404).json({ message: 'Vehicle not found' })
//   if (!vehicle.isAvailable)           return res.status(400).json({ message: 'Vehicle is currently unavailable' })

//   // Date conflict check
//   const isAvailable = await Booking.isVehicleAvailable(vehicleId, startDate, endDate)
//   if (!isAvailable) {
//     return res.status(409).json({ message: 'Vehicle already booked for these dates' })
//   }

//   // Wallet check — must have deposit
//   const customer = await User.findById(req.user._id)
//   const pricing  = calculatePrice(vehicle.pricePerDay, startDate, endDate, startHub, endHub)

//   if (customer.wallet.balance < pricing.deposit) {
//     return res.status(400).json({
//       message: `Insufficient wallet balance. Need ₹${pricing.deposit} for security deposit.`,
//       walletBalance: customer.wallet.balance,
//       depositNeeded: pricing.deposit,
//     })
//   }

//   // Lock deposit in customer wallet
//   await customer.lockDeposit(pricing.deposit)

//   // Mark vehicle unavailable
//   vehicle.isAvailable = false
//   await vehicle.save()

//   // Create booking
//   const booking = await Booking.create({
//     user:          req.user._id,
//     vehicle:       vehicleId,
//     startHub,
//     endHub,
//     startDate:     start,
//     endDate:       end,
//     totalDays:     pricing.days,
//     pricePerDay:   vehicle.pricePerDay,
//     rentalCost:    pricing.rentalCost,
//     depositAmount: pricing.deposit,
//     platformFee:   pricing.platformFee,
//     totalPrice:    pricing.rentalCost,
//     status:        'pending',
//     statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Booking created' }],
//   })

//   // Real-time notification to vendor
//   const io = req.app.get('io')
//   io?.to(`vendor_${vehicle.owner._id}`).emit('new_booking_request', {
//     bookingId:   booking._id,
//     vehicleName: vehicle.displayName,
//     route:       `${startHub.name} → ${endHub.name}`,
//     distanceKm:  pricing.distanceKm,
//     days:        pricing.days,
//     rentalCost:  pricing.rentalCost,
//     customer:    customer.name,
//   })

//   const populated = await Booking.findById(booking._id)
//     .populate('vehicle', 'make model year plateNumber images currentHub')
//     .populate('user',    'name email phone')

//   res.status(201).json({
//     message:    'Booking created — awaiting vendor confirmation',
//     booking:    populated,
//     distanceKm: pricing.distanceKm,
//     isCrossHubTrip: pricing.isCrossHubTrip,
//   })
// })

// // ─── GET /api/bookings/my ─────────────────────────────────────────────────────
// const getMyBookings = asyncHandler(async (req, res) => {
//   const bookings = await Booking.find({ user: req.user._id })
//     .populate('vehicle', 'make model year plateNumber images category currentHub')
//     .populate('user',    'name email phone')
//     .sort({ createdAt: -1 })
//   res.status(200).json({ count: bookings.length, bookings })
// })

// // ─── GET /api/bookings/vendor ─────────────────────────────────────────────────
// const getVendorBookings = asyncHandler(async (req, res) => {
//   const vehicles = await Vehicle.find({ owner: req.user._id }).select('_id')
//   const vehicleIds = vehicles.map(v => v._id)

//   const bookings = await Booking.find({ vehicle: { $in: vehicleIds } })
//     .populate('vehicle', 'make model year plateNumber images category currentHub')
//     .populate('user',    'name email phone kyc')
//     .sort({ createdAt: -1 })

//   const summary = {
//     pending:     bookings.filter(b => b.status === 'pending').length,
//     active:      bookings.filter(b => b.status === 'active').length,
//     in_transit:  bookings.filter(b => b.status === 'in_transit').length,
//     completed:   bookings.filter(b => b.status === 'completed').length,
//     cancelled:   bookings.filter(b => b.status === 'cancelled').length,
//     totalRevenue:bookings
//       .filter(b => b.status === 'completed')
//       .reduce((s, b) => s + b.rentalCost, 0),
//   }

//   res.status(200).json({ count: bookings.length, bookings, summary })
// })

// // ─── GET /api/bookings/:id ────────────────────────────────────────────────────
// const getBookingById = asyncHandler(async (req, res) => {
//   const booking = await Booking.findById(req.params.id)
//     .populate('vehicle', 'make model year plateNumber images category currentHub lastKnownPosition owner')
//     .populate('user',    'name email phone')

//   if (!booking) return res.status(404).json({ message: 'Booking not found' })

//   const isCustomer = booking.user._id.toString() === req.user._id.toString()
//   const isVendor   = booking.vehicle?.owner?.toString() === req.user._id.toString()
//   if (!isCustomer && !isVendor) return res.status(403).json({ message: 'Not authorised' })

//   res.status(200).json({ booking })
// })

// // ─── PATCH /api/bookings/:id/status ──────────────────────────────────────────
// // ⭐ USP TRIGGER: when status → 'completed', vehicle relocates to endHub
// const updateBookingStatus = asyncHandler(async (req, res) => {
//   const { status, note } = req.body
//   const allowed = ['active', 'in_transit', 'completed', 'cancelled']

//   if (!allowed.includes(status)) {
//     return res.status(400).json({ message: `Invalid status: ${status}` })
//   }

//   const booking = await Booking.findById(req.params.id)
//   if (!booking) return res.status(404).json({ message: 'Booking not found' })

//   const vehicle    = await Vehicle.findById(booking.vehicle)
//   const isVendor   = vehicle?.owner?.toString() === req.user._id.toString()
//   const isCustomer = booking.user.toString()    === req.user._id.toString()
//   if (!isVendor && !isCustomer) return res.status(403).json({ message: 'Not authorised' })

//   // Customers can only cancel
//   if (isCustomer && !isVendor && status !== 'cancelled') {
//     return res.status(403).json({ message: 'Customers can only cancel bookings' })
//   }

//   booking.status = status
//   booking.statusHistory.push({ status, changedBy: req.user._id, note: note || `Changed to ${status}` })

//   // ── USP: TRIP COMPLETED ───────────────────────────────────────────────────
//   // This is the single most important function in the whole codebase.
//   // Vehicle moves to the endHub — self-rebalancing decentralised network.
//   if (status === 'completed') {
//     booking.completedAt    = new Date()
//     booking.depositReleased= true
//     booking.vendorPaid     = true

//     // 1. Vehicle relocates to endHub (THE USP)
//     await vehicle.relocateToHub(booking.endHub, booking._id)

//     // 2. Release deposit back to customer
//     const customer = await User.findById(booking.user)
//     await customer.releaseDeposit(booking.depositAmount)

//     // 3. Pay vendor their cut
//     const vendor = await User.findById(vehicle.owner)
//     vendor.wallet.balance += booking.rentalCost - booking.platformFee
//     await vendor.save()

//     // 4. Update vehicle lifetime revenue
//     vehicle.totalRevenue += booking.rentalCost
//     await vehicle.save()
//   }

//   // ── CANCELLED ─────────────────────────────────────────────────────────────
//   if (status === 'cancelled') {
//     booking.cancelledBy  = req.user._id
//     booking.cancelledAt  = new Date()
//     booking.cancelReason = note || `Cancelled by ${req.user.role}`

//     // Free vehicle
//     vehicle.isAvailable = true
//     await vehicle.save()

//     // Return deposit to customer
//     const customer = await User.findById(booking.user)
//     if (customer.wallet.locked >= booking.depositAmount) {
//       await customer.releaseDeposit(booking.depositAmount)
//     }
//   }

//   await booking.save()

//   // Broadcast status change via Socket.io
//   const io = req.app.get('io')
//   io?.to(booking.chatRoomId).emit('booking_update', { ...booking.toObject() })
//   io?.to(`user_${booking.user}`).emit('booking_status_change', {
//     bookingId: booking._id,
//     status,
//     message: {
//       active:     'Your booking is confirmed! Vehicle is ready at the pickup hub.',
//       in_transit: `Your vehicle is en route to ${booking.endHub?.name}`,
//       completed:  `Trip complete! ₹${booking.depositAmount} deposit returned to your wallet.`,
//       cancelled:  'Booking cancelled. Deposit returned to your wallet.',
//     }[status] || `Booking updated to ${status}`,
//   })

//   const populated = await Booking.findById(booking._id)
//     .populate('vehicle', 'make model year plateNumber currentHub')
//     .populate('user',    'name email phone')

//   res.status(200).json({ message: `Booking ${status}`, booking: populated })
// })

// // ─── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────
// const cancelBooking = asyncHandler(async (req, res) => {
//   req.body.status = 'cancelled'
//   return updateBookingStatus(req, res)
// })

// // ─── GET /api/bookings/network-stats ─────────────────────────────────────────
// // USP analytics — hub-to-hub trip stats for the landing page
// const getNetworkStats = asyncHandler(async (req, res) => {
//   const [totalCompleted, revenueResult, topRoutes, vehicleCount] = await Promise.all([
//     Booking.countDocuments({ status: 'completed' }),
//     Booking.aggregate([
//       { $match: { status: 'completed' } },
//       { $group: { _id: null, total: { $sum: '$rentalCost' } } },
//     ]),
//     Booking.getTopRoutes(8),
//     Vehicle.countDocuments({ isActive: true, isAvailable: true }),
//   ])

//   res.status(200).json({
//     totalTrips:       totalCompleted,
//     totalRevenue:     revenueResult[0]?.total || 0,
//     availableVehicles:vehicleCount,
//     topRoutes,
//   })
// })

// // ─── GET /api/bookings/:id/chat-history ──────────────────────────────────────
// const getChatHistory = asyncHandler(async (req, res) => {
//   const booking = await Booking.findById(req.params.id)
//     .select('messages chatRoomId user vehicle')
//     .populate('vehicle', 'owner')

//   if (!booking) return res.status(404).json({ message: 'Booking not found' })

//   const isCustomer = booking.user.toString()          === req.user._id.toString()
//   const isVendor   = booking.vehicle?.owner?.toString()=== req.user._id.toString()
//   if (!isCustomer && !isVendor) return res.status(403).json({ message: 'Not authorised' })

//   res.status(200).json({ chatRoomId: booking.chatRoomId, messages: booking.messages })
// })

// module.exports = {
//   createBooking, getMyBookings, getVendorBookings,
//   getBookingById, updateBookingStatus, cancelBooking,
//   getNetworkStats, getChatHistory,
// }
















































const Booking             = require('../models/Booking.model')
const Vehicle             = require('../models/Vehicle.model')
const User                = require('../models/User.model')
const { calculatePrice }  = require('../utils/calculatePrice')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// ─── POST /api/bookings ───────────────────────────────────────────────────────
// USP: startHub ≠ endHub is the whole point. Vehicle relocates on completion.
const createBooking = asyncHandler(async (req, res) => {
  const { vehicleId, startHub, endHub, startDate, endDate } = req.body

  if (!vehicleId || !startHub || !endHub || !startDate || !endDate) {
    return res.status(400).json({ message: 'All booking fields are required' })
  }

  const start = new Date(startDate)
  const end   = new Date(endDate)
  if (start >= end)  return res.status(400).json({ message: 'End date must be after start date' })
  if (start < new Date(new Date().toDateString())) {
    return res.status(400).json({ message: 'Start date cannot be in the past' })
  }

  // Vehicle check
  const vehicle = await Vehicle.findById(vehicleId).populate('owner', 'name _id')
  if (!vehicle || !vehicle.isActive)  return res.status(404).json({ message: 'Vehicle not found' })
  if (!vehicle.isAvailable)           return res.status(400).json({ message: 'Vehicle is currently unavailable' })

  // Date conflict check
  const isAvailable = await Booking.isVehicleAvailable(vehicleId, startDate, endDate)
  if (!isAvailable) {
    return res.status(409).json({ message: 'Vehicle already booked for these dates' })
  }

  // Wallet check — must cover deposit + full rental upfront
  const customer = await User.findById(req.user._id)
  const pricing  = calculatePrice(vehicle.pricePerDay, startDate, endDate, startHub, endHub)
  const totalRequired = pricing.deposit + pricing.rentalCost

  if (customer.wallet.balance < totalRequired) {
    return res.status(400).json({
      message: `Insufficient wallet balance. Need ₹${totalRequired} (₹${pricing.rentalCost} rental + ₹${pricing.deposit} deposit).`,
      walletBalance: customer.wallet.balance,
      rentalCost:    pricing.rentalCost,
      depositNeeded: pricing.deposit,
      totalRequired,
    })
  }

  // Deduct full rental cost immediately
  customer.wallet.balance -= pricing.rentalCost

  // Lock deposit separately (returned after trip)
  await customer.lockDeposit(pricing.deposit)

  // Mark vehicle unavailable
  vehicle.isAvailable = false
  await vehicle.save()

  // Create booking
  const booking = await Booking.create({
    user:          req.user._id,
    vehicle:       vehicleId,
    startHub,
    endHub,
    startDate:     start,
    endDate:       end,
    totalDays:     pricing.days,
    pricePerDay:   vehicle.pricePerDay,
    rentalCost:    pricing.rentalCost,
    depositAmount: pricing.deposit,
    platformFee:   pricing.platformFee,
    totalPrice:    pricing.rentalCost,
    status:        'pending',
    statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Booking created' }],
  })

  // Real-time notification to vendor
  const io = req.app.get('io')
  io?.to(`vendor_${vehicle.owner._id}`).emit('new_booking_request', {
    bookingId:   booking._id,
    vehicleName: vehicle.displayName,
    route:       `${startHub.name} → ${endHub.name}`,
    distanceKm:  pricing.distanceKm,
    days:        pricing.days,
    rentalCost:  pricing.rentalCost,
    customer:    customer.name,
  })

  const populated = await Booking.findById(booking._id)
    .populate('vehicle', 'make model year plateNumber images currentHub')
    .populate('user',    'name email phone')

  res.status(201).json({
    message:    'Booking created — awaiting vendor confirmation',
    booking:    populated,
    distanceKm: pricing.distanceKm,
    isCrossHubTrip: pricing.isCrossHubTrip,
  })
})

// ─── GET /api/bookings/my ─────────────────────────────────────────────────────
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('vehicle', 'make model year plateNumber images category currentHub')
    .populate('user',    'name email phone')
    .sort({ createdAt: -1 })
  res.status(200).json({ count: bookings.length, bookings })
})

// ─── GET /api/bookings/vendor ─────────────────────────────────────────────────
const getVendorBookings = asyncHandler(async (req, res) => {
  const vehicles = await Vehicle.find({ owner: req.user._id }).select('_id')
  const vehicleIds = vehicles.map(v => v._id)

  const bookings = await Booking.find({ vehicle: { $in: vehicleIds } })
    .populate('vehicle', 'make model year plateNumber images category currentHub')
    .populate('user',    'name email phone kyc')
    .sort({ createdAt: -1 })

  const summary = {
    pending:     bookings.filter(b => b.status === 'pending').length,
    active:      bookings.filter(b => b.status === 'active').length,
    in_transit:  bookings.filter(b => b.status === 'in_transit').length,
    completed:   bookings.filter(b => b.status === 'completed').length,
    cancelled:   bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue:bookings
      .filter(b => b.status === 'completed')
      .reduce((s, b) => s + b.rentalCost, 0),
  }

  res.status(200).json({ count: bookings.length, bookings, summary })
})

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('vehicle', 'make model year plateNumber images category currentHub lastKnownPosition owner')
    .populate('user',    'name email phone')

  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  const isCustomer = booking.user._id.toString() === req.user._id.toString()
  const isVendor   = booking.vehicle?.owner?.toString() === req.user._id.toString()
  if (!isCustomer && !isVendor) return res.status(403).json({ message: 'Not authorised' })

  res.status(200).json({ booking })
})

// ─── PATCH /api/bookings/:id/status ──────────────────────────────────────────
// ⭐ USP TRIGGER: when status → 'completed', vehicle relocates to endHub
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body
  const allowed = ['active', 'in_transit', 'completed', 'cancelled']

  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Invalid status: ${status}` })
  }

  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  const vehicle    = await Vehicle.findById(booking.vehicle)
  const isVendor   = vehicle?.owner?.toString() === req.user._id.toString()
  const isCustomer = booking.user.toString()    === req.user._id.toString()
  if (!isVendor && !isCustomer) return res.status(403).json({ message: 'Not authorised' })

  // Customers can only cancel
  if (isCustomer && !isVendor && status !== 'cancelled') {
    return res.status(403).json({ message: 'Customers can only cancel bookings' })
  }

  booking.status = status
  booking.statusHistory.push({ status, changedBy: req.user._id, note: note || `Changed to ${status}` })

  // ── USP: TRIP COMPLETED ───────────────────────────────────────────────────
  // This is the single most important function in the whole codebase.
  // Vehicle moves to the endHub — self-rebalancing decentralised network.
  if (status === 'completed') {
    booking.completedAt    = new Date()
    booking.depositReleased= true
    booking.vendorPaid     = true

    // 1. Vehicle relocates to endHub (THE USP)
    await vehicle.relocateToHub(booking.endHub, booking._id)

    // 2. Release deposit back to customer (rental was already paid at booking time)
    const customer = await User.findById(booking.user)
    await customer.releaseDeposit(booking.depositAmount)

    // 3. Pay vendor (rental minus platform fee)
    const vendor = await User.findById(vehicle.owner)
    vendor.wallet.balance += booking.rentalCost - booking.platformFee
    await vendor.save()

    // 4. Update vehicle lifetime revenue
    vehicle.totalRevenue += booking.rentalCost
    await vehicle.save()
  }

  // ── CANCELLED ─────────────────────────────────────────────────────────────
  if (status === 'cancelled') {
    booking.cancelledBy  = req.user._id
    booking.cancelledAt  = new Date()
    booking.cancelReason = note || `Cancelled by ${req.user.role}`

    // Free vehicle
    vehicle.isAvailable = true
    await vehicle.save()

    // Return deposit + rental cost to customer
    const customer = await User.findById(booking.user)
    // Refund rental cost (was deducted at booking creation)
    customer.wallet.balance += booking.rentalCost
    // Release locked deposit
    if (customer.wallet.locked >= booking.depositAmount) {
      await customer.releaseDeposit(booking.depositAmount)
    } else {
      await customer.save()
    }
  }

  await booking.save()

  // Broadcast status change via Socket.io
  const io = req.app.get('io')
  io?.to(booking.chatRoomId).emit('booking_update', { ...booking.toObject() })
  io?.to(`user_${booking.user}`).emit('booking_status_change', {
    bookingId: booking._id,
    status,
    message: {
      active:     'Your booking is confirmed! Vehicle is ready at the pickup hub.',
      in_transit: `Your vehicle is en route to ${booking.endHub?.name}`,
      completed:  `Trip complete! ₹${booking.depositAmount} deposit returned to your wallet.`,
      cancelled:  'Booking cancelled. Deposit returned to your wallet.',
    }[status] || `Booking updated to ${status}`,
  })

  const populated = await Booking.findById(booking._id)
    .populate('vehicle', 'make model year plateNumber currentHub')
    .populate('user',    'name email phone')

  res.status(200).json({ message: `Booking ${status}`, booking: populated })
})

// ─── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────
const cancelBooking = asyncHandler(async (req, res) => {
  req.body.status = 'cancelled'
  return updateBookingStatus(req, res)
})

// ─── GET /api/bookings/network-stats ─────────────────────────────────────────
// USP analytics — hub-to-hub trip stats for the landing page
const getNetworkStats = asyncHandler(async (req, res) => {
  const [totalCompleted, revenueResult, topRoutes, vehicleCount] = await Promise.all([
    Booking.countDocuments({ status: 'completed' }),
    Booking.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$rentalCost' } } },
    ]),
    Booking.getTopRoutes(8),
    Vehicle.countDocuments({ isActive: true, isAvailable: true }),
  ])

  res.status(200).json({
    totalTrips:       totalCompleted,
    totalRevenue:     revenueResult[0]?.total || 0,
    availableVehicles:vehicleCount,
    topRoutes,
  })
})

// ─── GET /api/bookings/:id/chat-history ──────────────────────────────────────
const getChatHistory = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .select('messages chatRoomId user vehicle')
    .populate('vehicle', 'owner')

  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  const isCustomer = booking.user.toString()          === req.user._id.toString()
  const isVendor   = booking.vehicle?.owner?.toString()=== req.user._id.toString()
  if (!isCustomer && !isVendor) return res.status(403).json({ message: 'Not authorised' })

  res.status(200).json({ chatRoomId: booking.chatRoomId, messages: booking.messages })
})

module.exports = {
  createBooking, getMyBookings, getVendorBookings,
  getBookingById, updateBookingStatus, cancelBooking,
  getNetworkStats, getChatHistory,
}
