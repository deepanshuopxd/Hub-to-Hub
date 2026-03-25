const Booking             = require('../models/Booking.model')
const Vehicle             = require('../models/Vehicle.model')
const User                = require('../models/User.model')
const { calculatePrice }  = require('../utils/calculatePrice')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// ─── POST /api/bookings ───────────────────────────────────────────────────────
const createBooking = asyncHandler(async (req, res) => {
  const {
    vehicleId, startHub, endHub,
    startDateTime, endDateTime,      // full datetime strings
    paymentMethod = 'wallet',
  } = req.body

  if (!vehicleId || !startHub || !endHub || !startDateTime || !endDateTime) {
    return res.status(400).json({ message: 'vehicleId, startHub, endHub, startDateTime, endDateTime are required' })
  }

  const start = new Date(startDateTime)
  const end   = new Date(endDateTime)
  if (start >= end)    return res.status(400).json({ message: 'End time must be after start time' })
  if (start < new Date()) return res.status(400).json({ message: 'Start time cannot be in the past' })

  // Vehicle check
  const vehicle = await Vehicle.findById(vehicleId).populate('owner', 'name _id rentalService')
  if (!vehicle || !vehicle.isActive)  return res.status(404).json({ message: 'Vehicle not found' })
  if (!vehicle.isAvailable)           return res.status(400).json({ message: 'Vehicle is currently unavailable' })

  // Conflict check
  const isAvailable = await Booking.isVehicleAvailable(vehicleId, startDateTime, endDateTime)
  if (!isAvailable) {
    return res.status(409).json({ message: 'Vehicle already booked for this time period' })
  }

  const customer = await User.findById(req.user._id)

  // Use vehicle's own securityDeposit (set by vendor)
  const pricing = calculatePrice(
    vehicle.pricePerDay,
    startDateTime,
    endDateTime,
    startHub,
    endHub,
    vehicle.securityDeposit,
  )

  const totalRequired = pricing.rentalCost + pricing.deposit

  // Payment handling
  if (paymentMethod === 'wallet') {
    if (customer.wallet.balance < totalRequired) {
      return res.status(400).json({
        message:       `Insufficient wallet balance. Need ₹${totalRequired} (₹${pricing.rentalCost} rental + ₹${pricing.deposit} deposit).`,
        walletBalance: customer.wallet.balance,
        rentalCost:    pricing.rentalCost,
        depositNeeded: pricing.deposit,
        totalRequired,
      })
    }
    // Deduct rental immediately, lock deposit
    customer.wallet.balance -= pricing.rentalCost
    await customer.lockDeposit(pricing.deposit)
  }
  // cash/razorpay: payment happens offline or via Razorpay — just create the booking

  // Mark vehicle unavailable
  vehicle.isAvailable = false
  await vehicle.save()

  // Build startHub with vendor info
  const startHubData = {
    ...startHub,
    vendorId:      vehicle.owner._id,
    rentalService: vehicle.owner.rentalService?.name || '',
  }

  // endHub vendor lookup (endVendor selected by startVendor later, or pre-set if provided)
  const endVendorId = req.body.endVendorId || null
  const endHubData  = {
    ...endHub,
    vendorId:      endVendorId,
    rentalService: req.body.endVendorServiceName || '',
  }

  const booking = await Booking.create({
    user:          req.user._id,
    vehicle:       vehicleId,
    startHub:      startHubData,
    endHub:        endHubData,
    startVendor:   vehicle.owner._id,
    endVendor:     endVendorId,
    startDateTime: start,
    endDateTime:   end,
    startDate:     start,
    endDate:       end,
    totalDays:     pricing.totalDays,
    totalHours:    pricing.totalHours,
    pricePerDay:   vehicle.pricePerDay,
    pricePerHour:  pricing.pricePerHour,
    rentalCost:    pricing.rentalCost,
    depositAmount: pricing.deposit,
    platformFee:   pricing.platformFee,
    totalPrice:    pricing.totalPrice,
    paymentMethod,
    paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
    status:        'pending',
    statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Booking created' }],
  })

  // Notify startVendor via socket
  const io = req.app.get('io')
  io?.to(`vendor_${vehicle.owner._id}`).emit('new_booking_request', {
    bookingId:    booking._id,
    vehicleName:  `${vehicle.make} ${vehicle.model}`,
    route:        `${startHub.city || startHub.name} → ${endHub.city || endHub.name}`,
    totalHours:   pricing.totalHours,
    totalDays:    pricing.totalDays,
    rentalCost:   pricing.rentalCost,
    customer:     customer.name,
    isCrossCity:  startHub.city !== endHub.city,
  })

  const populated = await Booking.findById(booking._id)
    .populate('vehicle',     'make model year plateNumber images currentHub')
    .populate('user',        'name email phone')
    .populate('startVendor', 'name rentalService')
    .populate('endVendor',   'name rentalService')

  res.status(201).json({
    message:        'Booking created — awaiting vendor confirmation',
    booking:        populated,
    pricing,
  })
})

// ─── GET /api/bookings/my ─────────────────────────────────────────────────────
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate('vehicle',     'make model year plateNumber images category currentHub')
    .populate('user',        'name email phone')
    .populate('startVendor', 'name rentalService')
    .populate('endVendor',   'name rentalService')
    .sort({ createdAt: -1 })
  res.status(200).json({ count: bookings.length, bookings })
})

// ─── GET /api/bookings/vendor ─────────────────────────────────────────────────
// Returns bookings where vendor is startVendor OR endVendor
const getVendorBookings = asyncHandler(async (req, res) => {
  const vendorId = req.user._id

  const bookings = await Booking.find({
    $or: [
      { startVendor: vendorId },
      { endVendor:   vendorId },
      // fallback: bookings from vehicles this vendor owns
      { vehicle: { $in: await Vehicle.find({ owner: vendorId }).distinct('_id') } },
    ],
  })
    .populate('vehicle',     'make model year plateNumber images category currentHub owner')
    .populate('user',        'name email phone kyc')
    .populate('startVendor', 'name rentalService')
    .populate('endVendor',   'name rentalService')
    .sort({ createdAt: -1 })

  const summary = {
    pending:      bookings.filter(b => b.status === 'pending').length,
    active:       bookings.filter(b => b.status === 'active').length,
    in_transit:   bookings.filter(b => b.status === 'in_transit').length,
    completed:    bookings.filter(b => b.status === 'completed').length,
    cancelled:    bookings.filter(b => b.status === 'cancelled').length,
    totalRevenue: bookings
      .filter(b => b.status === 'completed')
      .reduce((s, b) => s + b.rentalCost, 0),
  }

  res.status(200).json({ count: bookings.length, bookings, summary })
})

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .populate('vehicle',     'make model year plateNumber images category currentHub lastKnownPosition owner')
    .populate('user',        'name email phone kyc')
    .populate('startVendor', 'name rentalService')
    .populate('endVendor',   'name rentalService')

  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  const uid        = req.user._id.toString()
  const isCustomer = booking.user._id.toString()          === uid
  const isStartV   = booking.startVendor?._id?.toString() === uid
  const isEndV     = booking.endVendor?._id?.toString()   === uid
  const isOwner    = booking.vehicle?.owner?.toString()   === uid

  if (!isCustomer && !isStartV && !isEndV && !isOwner) {
    return res.status(403).json({ message: 'Not authorised' })
  }

  res.status(200).json({ booking })
})

// ─── PATCH /api/bookings/:id/assign-end-vendor ───────────────────────────────
// startVendor calls this to assign the destination rental service
// before or at the time of accepting the booking
const assignEndVendor = asyncHandler(async (req, res) => {
  const { endVendorId } = req.body
  if (!endVendorId) return res.status(400).json({ message: 'endVendorId required' })

  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  // Only startVendor can assign endVendor
  if (booking.startVendor?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the start vendor can assign destination vendor' })
  }

  const endVendor = await User.findById(endVendorId).select('name rentalService')
  if (!endVendor || endVendor.role !== 'center_admin') {
    return res.status(404).json({ message: 'Destination vendor not found' })
  }

  booking.endVendor           = endVendorId
  booking.endHub.vendorId     = endVendorId
  booking.endHub.rentalService= endVendor.rentalService?.name || ''

  await booking.save()

  // Notify endVendor
  const io = req.app.get('io')
  io?.to(`vendor_${endVendorId}`).emit('assigned_as_destination', {
    bookingId: booking._id,
    route:     `${booking.startHub.city} → ${booking.endHub.city}`,
    message:   `You have been assigned as the destination hub for a booking`,
  })

  const populated = await Booking.findById(booking._id)
    .populate('endVendor', 'name rentalService')
  res.status(200).json({ message: 'Destination vendor assigned', booking: populated })
})

// ─── PATCH /api/bookings/:id/status ──────────────────────────────────────────
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body
  const allowed = ['active', 'in_transit', 'completed', 'cancelled']
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Invalid status: ${status}` })
  }

  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  const vehicle    = await Vehicle.findById(booking.vehicle)
  const uid        = req.user._id.toString()
  const isStartV   = booking.startVendor?.toString() === uid
  const isEndV     = booking.endVendor?.toString()   === uid
  const isOwner    = vehicle?.owner?.toString()      === uid
  const isCustomer = booking.user.toString()         === uid
  const isVendor   = isStartV || isEndV || isOwner

  if (!isVendor && !isCustomer) return res.status(403).json({ message: 'Not authorised' })
  if (isCustomer && !isVendor && status !== 'cancelled') {
    return res.status(403).json({ message: 'Customers can only cancel bookings' })
  }

  booking.status = status
  booking.statusHistory.push({
    status,
    changedBy: req.user._id,
    note:      note || `Changed to ${status}`,
  })

  // ── COMPLETED ─────────────────────────────────────────────────────────────
  if (status === 'completed') {
    booking.completedAt     = new Date()
    booking.depositReleased = true
    booking.vendorPaid      = true

    // 1. Vehicle relocates to endHub (THE USP)
    await vehicle.relocateToHub(booking.endHub, booking._id)

    // 2. Release deposit back to customer
    const customer = await User.findById(booking.user)
    await customer.releaseDeposit(booking.depositAmount)

    // 3. Pay startVendor their cut (or vehicle owner)
    const payVendorId = booking.startVendor || vehicle.owner
    const vendor = await User.findById(payVendorId)
    if (vendor) {
      vendor.wallet.balance += booking.rentalCost - booking.platformFee
      await vendor.save()
    }

    // 4. Vehicle lifetime stats
    vehicle.totalRevenue += booking.rentalCost
    await vehicle.save()

    // 5. Notify endVendor that vehicle is arriving
    const io = req.app.get('io')
    if (booking.endVendor) {
      io?.to(`vendor_${booking.endVendor}`).emit('vehicle_arriving', {
        bookingId:  booking._id,
        vehicle:    `${vehicle.make} ${vehicle.model} (${vehicle.plateNumber})`,
        from:       booking.startHub.city,
        message:    'Vehicle is on its way to your hub',
      })
    }
  }

  // ── CANCELLED ─────────────────────────────────────────────────────────────
  if (status === 'cancelled') {
    booking.cancelledBy  = req.user._id
    booking.cancelledAt  = new Date()
    booking.cancelReason = note || `Cancelled by ${req.user.role}`

    vehicle.isAvailable = true
    await vehicle.save()

    if (booking.paymentMethod === 'wallet') {
      const customer = await User.findById(booking.user)
      customer.wallet.balance += booking.rentalCost
      if (customer.wallet.locked >= booking.depositAmount) {
        await customer.releaseDeposit(booking.depositAmount)
      } else {
        await customer.save()
      }
    }
  }

  await booking.save()

  const io = req.app.get('io')
  io?.to(booking.chatRoomId).emit('booking_update', booking.toObject())
  io?.to(`user_${booking.user}`).emit('booking_status_change', {
    bookingId: booking._id,
    status,
    message: {
      active:     'Your booking is confirmed! Vehicle is ready at the pickup hub.',
      in_transit: `Vehicle is en route to ${booking.endHub?.city || booking.endHub?.name}`,
      completed:  `Trip complete! ₹${booking.depositAmount} deposit returned to your wallet.`,
      cancelled:  'Booking cancelled. Deposit returned to your wallet.',
    }[status] || `Booking updated to ${status}`,
  })

  const populated = await Booking.findById(booking._id)
    .populate('vehicle',     'make model year plateNumber currentHub')
    .populate('user',        'name email phone')
    .populate('startVendor', 'name rentalService')
    .populate('endVendor',   'name rentalService')

  res.status(200).json({ message: `Booking ${status}`, booking: populated })
})

// ─── PATCH /api/bookings/:id/cancel ──────────────────────────────────────────
const cancelBooking = asyncHandler(async (req, res) => {
  req.body.status = 'cancelled'
  return updateBookingStatus(req, res)
})

// ─── GET /api/bookings/network-stats ─────────────────────────────────────────
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
    totalTrips:        totalCompleted,
    totalRevenue:      revenueResult[0]?.total || 0,
    availableVehicles: vehicleCount,
    topRoutes,
  })
})

// ─── GET /api/bookings/:id/chat-history ──────────────────────────────────────
const getChatHistory = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .select('messages chatRoomId user vehicle startVendor endVendor')
    .populate('vehicle', 'owner')

  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  const uid      = req.user._id.toString()
  const allowed  = [
    booking.user.toString(),
    booking.startVendor?.toString(),
    booking.endVendor?.toString(),
    booking.vehicle?.owner?.toString(),
  ].filter(Boolean)

  if (!allowed.includes(uid)) return res.status(403).json({ message: 'Not authorised' })

  res.status(200).json({ chatRoomId: booking.chatRoomId, messages: booking.messages })
})

// ─── POST /api/bookings/:id/rate ─────────────────────────────────────────────
// Customer rates vendor (1-5 stars) + Vendor rates customer
// Both can submit once per booking after completion
const submitRating = asyncHandler(async (req, res) => {
  const { rating, reviewNote } = req.body
  const stars = Number(rating)

  if (!stars || stars < 1 || stars > 5) {
    return res.status(400).json({ message: 'Rating must be between 1 and 5' })
  }

  const booking = await Booking.findById(req.params.id)
    .populate('vehicle', 'owner')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  if (booking.status !== 'completed') {
    return res.status(400).json({ message: 'Can only rate completed bookings' })
  }

  const uid        = req.user._id.toString()
  const isCustomer = booking.user.toString() === uid
  const isVendor   = [
    booking.startVendor?.toString(),
    booking.endVendor?.toString(),
    booking.vehicle?.owner?.toString(),
  ].filter(Boolean).includes(uid)

  if (!isCustomer && !isVendor) {
    return res.status(403).json({ message: 'Not authorised' })
  }

  // Customer rates the vendor experience
  if (isCustomer) {
    if (booking.customerRating) {
      return res.status(400).json({ message: 'You have already rated this booking' })
    }
    booking.customerRating = stars
    booking.reviewNote     = reviewNote?.trim() || null
  }

  // Vendor rates the customer
  if (isVendor && !isCustomer) {
    if (booking.vendorRating) {
      return res.status(400).json({ message: 'You have already rated this customer' })
    }
    booking.vendorRating = stars
  }

  await booking.save()

  res.status(200).json({
    message: 'Rating submitted — thank you!',
    customerRating: booking.customerRating,
    vendorRating:   booking.vendorRating,
    reviewNote:     booking.reviewNote,
  })
})

module.exports = {
  createBooking, getMyBookings, getVendorBookings,
  getBookingById, updateBookingStatus, cancelBooking,
  getNetworkStats, getChatHistory, assignEndVendor, submitRating,
}