const Booking            = require('../models/Booking.model')
const Vehicle            = require('../models/Vehicle.model')
const User               = require('../models/User.model')
const { calculatePrice } = require('../utils/calculatePrice')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// ── Helper: populate booking fully ───────────────────────────────────────────
const populateBooking = (query) =>
  query
    .populate('vehicle',     'make model year plateNumber images currentHub securityDeposit homeService owner')
    .populate('user',        'name email phone kyc')
    .populate('startVendor', 'name email phone rentalService')
    .populate('endVendor',   'name email phone rentalService')

// ── Helper: check if user is a party ─────────────────────────────────────────
const isParty = (booking, userId) => {
  const uid = userId.toString()
  return [
    booking.user?._id?.toString()        || booking.user?.toString(),
    booking.startVendor?._id?.toString() || booking.startVendor?.toString(),
    booking.endVendor?._id?.toString()   || booking.endVendor?.toString(),
    booking.vehicle?.owner?.toString(),
  ].filter(Boolean).includes(uid)
}

// ─── POST /api/bookings ───────────────────────────────────────────────────────
// Customer creates booking — goes to startVendor first
const createBooking = asyncHandler(async (req, res) => {
  const {
    vehicleId,
    startHub,
    endHub,
    startDateTime,
    endDateTime,
    paymentMethod = 'wallet',
  } = req.body

  if (!vehicleId || !startHub || !endHub || !startDateTime || !endDateTime) {
    return res.status(400).json({ message: 'vehicleId, startHub, endHub, startDateTime, endDateTime are required' })
  }

  const start = new Date(startDateTime)
  const end   = new Date(endDateTime)
  if (start >= end)    return res.status(400).json({ message: 'End time must be after start time' })
  if (start < new Date()) return res.status(400).json({ message: 'Start time cannot be in the past' })

  const vehicle = await Vehicle.findById(vehicleId).populate('owner', 'name _id email phone rentalService')
  if (!vehicle || !vehicle.isActive)  return res.status(404).json({ message: 'Vehicle not found' })
  if (!vehicle.isAvailable)           return res.status(400).json({ message: 'Vehicle is currently unavailable' })

  const isAvailable = await Booking.isVehicleAvailable(vehicleId, startDateTime, endDateTime)
  if (!isAvailable) return res.status(409).json({ message: 'Vehicle already booked for this period' })

  const customer = await User.findById(req.user._id)
  const pricing  = calculatePrice(
    vehicle.pricePerDay, startDateTime, endDateTime,
    startHub, endHub, vehicle.securityDeposit,
  )

  const totalRequired = pricing.rentalCost + pricing.deposit

  if (paymentMethod === 'wallet') {
    if (customer.wallet.balance < totalRequired) {
      return res.status(400).json({
        message:       `Insufficient balance. Need ₹${totalRequired} (₹${pricing.rentalCost} rental + ₹${pricing.deposit} deposit).`,
        walletBalance: customer.wallet.balance,
        totalRequired,
      })
    }
    customer.wallet.balance -= pricing.rentalCost
    await customer.lockDeposit(pricing.deposit)
  }

  vehicle.isAvailable = false
  await vehicle.save()

  const startHubData = {
    name:          startHub.name          || startHub.city,
    city:          startHub.city          || startHub.name,
    address:       startHub.address       || '',
    lat:           startHub.lat           || 0,
    lng:           startHub.lng           || 0,
    vendorId:      vehicle.owner._id,
    rentalService: vehicle.owner.rentalService?.name || startHub.name,
  }

  const endHubData = {
    name:          endHub.name          || endHub.city,
    city:          endHub.city          || endHub.name,
    address:       endHub.address       || '',
    lat:           endHub.lat           || 0,
    lng:           endHub.lng           || 0,
    vendorId:      null,          // set later when startVendor assigns endVendor
    rentalService: null,
  }

  const booking = await Booking.create({
    user:          req.user._id,
    vehicle:       vehicleId,
    startVendor:   vehicle.owner._id,
    endVendor:     null,
    startHub:      startHubData,
    endHub:        endHubData,
    startDateTime: start,
    endDateTime:   end,
    startDate:     start,
    endDate:       end,
    pricePerDay:   vehicle.pricePerDay,
    rentalCost:    pricing.rentalCost,
    depositAmount: pricing.deposit,
    platformFee:   pricing.platformFee,
    totalPrice:    pricing.totalPrice,
    paymentMethod,
    paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
    status:        'pending',
    statusHistory: [{ status: 'pending', changedBy: req.user._id, note: 'Booking created by customer' }],
  })

  // Notify startVendor
  const io = req.app.get('io')
  io?.to(`vendor_${vehicle.owner._id}`).emit('new_booking_request', {
    bookingId:   booking._id,
    vehicle:     `${vehicle.make} ${vehicle.model}`,
    from:        startHubData.city,
    to:          endHubData.city,
    customer:    customer.name,
    rentalCost:  pricing.rentalCost,
    totalHours:  pricing.totalHours,
  })

  const populated = await populateBooking(Booking.findById(booking._id))
  res.status(201).json({ message: 'Booking created — awaiting vendor confirmation', booking: populated, pricing })
})

// ─── PATCH /api/bookings/:id/start-vendor-action ─────────────────────────────
// startVendor approves (must also set endVendor) or declines
const startVendorAction = asyncHandler(async (req, res) => {
  const { action, endVendorId, note } = req.body
  // action: 'approve' | 'decline'

  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (booking.startVendor?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the pickup vendor can perform this action' })
  }
  if (booking.status !== 'pending') {
    return res.status(400).json({ message: `Cannot act on a booking with status: ${booking.status}` })
  }

  if (action === 'decline') {
    // Refund customer fully
    const customer = await User.findById(booking.user)
    if (booking.paymentMethod === 'wallet') {
      customer.wallet.balance += booking.rentalCost
      if (customer.wallet.locked >= booking.depositAmount) {
        await customer.releaseDeposit(booking.depositAmount)
      } else { await customer.save() }
    }

    const vehicle = await Vehicle.findById(booking.vehicle)
    vehicle.isAvailable = true
    await vehicle.save()

    booking.status       = 'cancelled'
    booking.cancelledBy  = req.user._id
    booking.cancelledAt  = new Date()
    booking.cancelReason = note || 'Declined by pickup vendor'
    booking.statusHistory.push({ status: 'cancelled', changedBy: req.user._id, note: booking.cancelReason })
    await booking.save()

    const io = req.app.get('io')
    io?.to(`user_${booking.user}`).emit('booking_status_change', {
      bookingId: booking._id,
      status:    'cancelled',
      message:   'Your booking was declined by the vendor. Full refund issued.',
    })

    const populated = await populateBooking(Booking.findById(booking._id))
    return res.status(200).json({ message: 'Booking declined and customer refunded', booking: populated })
  }

  if (action === 'approve') {
    if (!endVendorId) {
      return res.status(400).json({ message: 'Select a destination rental service before approving' })
    }

    const endVendor = await User.findById(endVendorId).select('name rentalService email phone role')
    if (!endVendor) {
      return res.status(404).json({ message: 'Destination vendor not found' })
    }
    if (endVendor.role !== 'center_admin') {
      return res.status(400).json({ message: 'Selected user is not a vendor' })
    }

    booking.endVendor              = endVendorId
    booking.endHub.vendorId        = endVendorId
    booking.endHub.rentalService   = endVendor.rentalService?.name || booking.endHub.city
    booking.startVendorApproved    = true
    booking.status                 = 'awaiting_destination_vendor'
    booking.statusHistory.push({
      status:    'awaiting_destination_vendor',
      changedBy: req.user._id,
      note:      note || `Approved by ${req.user.name}. Awaiting ${endVendor.rentalService?.name || 'destination vendor'} confirmation.`,
    })
    await booking.save()

    // Notify endVendor
    const io = req.app.get('io')
    io?.to(`vendor_${endVendorId}`).emit('destination_vendor_request', {
      bookingId:    booking._id,
      from:         booking.startHub.city,
      to:           booking.endHub.city,
      vehicle:      `${(await Vehicle.findById(booking.vehicle).select('make model'))?.make} `,
      startService: req.user.rentalService?.name || booking.startHub.rentalService,
      message:      'A vehicle will be dropped at your hub. Please approve.',
    })

    // Notify customer
    io?.to(`user_${booking.user}`).emit('booking_status_change', {
      bookingId: booking._id,
      status:    'awaiting_destination_vendor',
      message:   `Pickup vendor approved! Waiting for ${endVendor.rentalService?.name || 'destination hub'} confirmation.`,
    })

    const populated = await populateBooking(Booking.findById(booking._id))
    return res.status(200).json({ message: 'Approved — waiting for destination vendor', booking: populated })
  }

  return res.status(400).json({ message: 'action must be approve or decline' })
})

// ─── PATCH /api/bookings/:id/end-vendor-action ────────────────────────────────
// endVendor approves or declines
const endVendorAction = asyncHandler(async (req, res) => {
  const { action, note } = req.body

  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (booking.endVendor?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the destination vendor can perform this action' })
  }
  if (booking.status !== 'awaiting_destination_vendor') {
    return res.status(400).json({ message: `Cannot act on a booking with status: ${booking.status}` })
  }

  const io = req.app.get('io')

  if (action === 'decline') {
    // endVendor declines — booking goes back to startVendor to choose another
    booking.endVendorDeclined = true
    booking.endVendor         = null
    booking.endHub.vendorId   = null
    booking.endHub.rentalService = null
    booking.status            = 'pending'   // back to pending so startVendor can reassign
    booking.startVendorApproved = false
    booking.statusHistory.push({
      status:    'pending',
      changedBy: req.user._id,
      note:      note || `Declined by destination vendor ${req.user.name}. Pickup vendor must reassign.`,
    })
    await booking.save()

    // Notify startVendor to pick another destination
    io?.to(`vendor_${booking.startVendor}`).emit('destination_vendor_declined', {
      bookingId: booking._id,
      message:   `${req.user.name} declined. Please choose another rental service in ${booking.endHub.city}.`,
    })
    io?.to(`user_${booking.user}`).emit('booking_status_change', {
      bookingId: booking._id,
      status:    'pending',
      message:   'Destination hub declined. Pickup vendor is finding an alternative.',
    })

    const populated = await populateBooking(Booking.findById(booking._id))
    return res.status(200).json({ message: 'Declined — pickup vendor notified to reassign', booking: populated })
  }

  if (action === 'approve') {
    booking.endVendorApproved = true
    booking.status            = 'active'
    booking.statusHistory.push({
      status:    'active',
      changedBy: req.user._id,
      note:      note || `Approved by ${req.user.name}. Trip is now active.`,
    })
    await booking.save()

    // Notify all parties
    io?.to(`user_${booking.user}`).emit('booking_status_change', {
      bookingId: booking._id,
      status:    'active',
      message:   'Both vendors confirmed! Your trip is ready. Pick up your vehicle.',
    })
    io?.to(`vendor_${booking.startVendor}`).emit('booking_status_change', {
      bookingId: booking._id,
      status:    'active',
      message:   'Destination vendor confirmed. Trip is now active.',
    })

    const populated = await populateBooking(Booking.findById(booking._id))
    return res.status(200).json({ message: 'Trip confirmed by both vendors — now active', booking: populated })
  }

  return res.status(400).json({ message: 'action must be approve or decline' })
})

// ─── PATCH /api/bookings/:id/status ──────────────────────────────────────────
// For in-trip status changes: in_transit, dropped_at_destination, completed_by_destination
const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status, note } = req.body
  const allowed = ['in_transit', 'cancelled']
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: `Use dedicated endpoints for other status changes` })
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

  if (status === 'in_transit') {
    if (booking.status !== 'active') return res.status(400).json({ message: 'Trip must be active first' })
    booking.status = 'in_transit'
    booking.statusHistory.push({ status: 'in_transit', changedBy: req.user._id, note: note || 'Vehicle picked up — trip started' })
  }

  if (status === 'cancelled') {
    if (!['pending', 'active'].includes(booking.status)) {
      return res.status(400).json({ message: 'Can only cancel pending or active bookings' })
    }
    booking.status       = 'cancelled'
    booking.cancelledBy  = req.user._id
    booking.cancelledAt  = new Date()
    booking.cancelReason = note || `Cancelled by ${req.user.role}`
    booking.statusHistory.push({ status: 'cancelled', changedBy: req.user._id, note: booking.cancelReason })

    vehicle.isAvailable = true
    await vehicle.save()

    if (booking.paymentMethod === 'wallet') {
      const customer = await User.findById(booking.user)
      customer.wallet.balance += booking.rentalCost
      if (customer.wallet.locked >= booking.depositAmount) {
        await customer.releaseDeposit(booking.depositAmount)
      } else { await customer.save() }
    }
  }

  await booking.save()

  const io = req.app.get('io')
  io?.to(booking.chatRoomId).emit('booking_update', booking.toObject())
  io?.to(`user_${booking.user}`).emit('booking_status_change', {
    bookingId: booking._id,
    status:    booking.status,
    message: {
      in_transit: 'Trip started! Enjoy your ride.',
      cancelled:  'Booking cancelled. Refund processed.',
    }[booking.status] || `Booking updated to ${booking.status}`,
  })

  const populated = await populateBooking(Booking.findById(booking._id))
  res.status(200).json({ message: `Booking ${booking.status}`, booking: populated })
})

// ─── PATCH /api/bookings/:id/mark-dropped ────────────────────────────────────
// Customer marks vehicle as dropped at destination hub
const markDropped = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (booking.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the customer can mark vehicle as dropped' })
  }
  if (booking.status !== 'in_transit') {
    return res.status(400).json({ message: 'Trip must be in transit to mark as dropped' })
  }

  booking.status = 'dropped_at_destination'
  booking.statusHistory.push({
    status:    'dropped_at_destination',
    changedBy: req.user._id,
    note:      req.body.note || 'Customer dropped vehicle at destination hub',
  })
  await booking.save()

  // Notify endVendor to go check vehicle
  const io = req.app.get('io')
  io?.to(`vendor_${booking.endVendor}`).emit('vehicle_dropped', {
    bookingId: booking._id,
    message:   'Customer has dropped the vehicle at your hub. Please verify and mark received.',
  })
  io?.to(`vendor_${booking.startVendor}`).emit('booking_status_change', {
    bookingId: booking._id,
    status:    'dropped_at_destination',
    message:   'Customer has dropped the vehicle at destination hub.',
  })

  const populated = await populateBooking(Booking.findById(booking._id))
  res.status(200).json({ message: 'Vehicle marked as dropped — destination vendor notified', booking: populated })
})

// ─── PATCH /api/bookings/:id/mark-received ───────────────────────────────────
// endVendor confirms they received the vehicle — triggers relocation
const markReceived = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (booking.endVendor?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the destination vendor can mark vehicle as received' })
  }
  if (booking.status !== 'dropped_at_destination') {
    return res.status(400).json({ message: 'Vehicle must be dropped first' })
  }

  const vehicle = await Vehicle.findById(booking.vehicle)

  // ── Vehicle relocates to endHub (THE USP) ────────────────────────────────
  await vehicle.relocateToHub(booking.endHub, booking._id)

  // ── Revenue goes ONLY to startVendor (rental minus platform fee) ────────
  const startVendor = await User.findById(booking.startVendor)
  if (startVendor) {
    startVendor.wallet.balance += booking.rentalCost - booking.platformFee
    booking.vendorPaid = true
    await startVendor.save()
  }

  // ── Platform fee goes to platform account ─────────────────────────────────
  // PLATFORM_ACCOUNT_EMAIL in .env — the admin account that collects fees
  if (process.env.PLATFORM_ACCOUNT_EMAIL && booking.platformFee > 0) {
    const platformAccount = await User.findOne({ email: process.env.PLATFORM_ACCOUNT_EMAIL })
    if (platformAccount) {
      platformAccount.wallet.balance += booking.platformFee
      await platformAccount.save()
    }
  }

  vehicle.totalRevenue += booking.rentalCost
  await vehicle.save()

  booking.status       = 'completed_by_destination'
  booking.statusHistory.push({
    status:    'completed_by_destination',
    changedBy: req.user._id,
    note:      req.body.note || `Vehicle received by ${req.user.name}. Awaiting deposit release from source vendor.`,
  })
  await booking.save()

  // Notify startVendor to release deposit
  const io = req.app.get('io')
  io?.to(`vendor_${booking.startVendor}`).emit('ready_to_release_deposit', {
    bookingId:     booking._id,
    message:       'Destination vendor confirmed receipt. Please review and release security deposit.',
    depositAmount: booking.depositAmount,
  })
  io?.to(`user_${booking.user}`).emit('booking_status_change', {
    bookingId: booking._id,
    status:    'completed_by_destination',
    message:   'Vehicle received at destination! Source vendor will review and release your security deposit.',
  })

  const populated = await populateBooking(Booking.findById(booking._id))
  res.status(200).json({ message: 'Vehicle received — source vendor notified to release deposit', booking: populated })
})

// ─── PATCH /api/bookings/:id/release-deposit ─────────────────────────────────
// startVendor manually releases deposit (full or partial after damage deduction)
const releaseDeposit = asyncHandler(async (req, res) => {
  const { deductAmount = 0, note } = req.body
  const deduct = Math.max(0, Number(deductAmount))

  const booking = await Booking.findById(req.params.id)
  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  if (booking.startVendor?.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Only the source vendor can release the deposit' })
  }
  if (booking.status !== 'completed_by_destination') {
    return res.status(400).json({ message: 'Trip must be completed by destination vendor first' })
  }
  if (booking.depositReleased) {
    return res.status(400).json({ message: 'Deposit already released' })
  }
  if (deduct > booking.depositAmount) {
    return res.status(400).json({ message: `Cannot deduct more than deposit (₹${booking.depositAmount})` })
  }

  const refund = booking.depositAmount - deduct
  const customer = await User.findById(booking.user)

  // Return deposit minus any deduction
  if (refund > 0) {
    customer.wallet.balance += refund
  }
  // Release from locked
  if (customer.wallet.locked >= booking.depositAmount) {
    customer.wallet.locked = Math.max(0, customer.wallet.locked - booking.depositAmount)
  }
  await customer.save()

  // If deduction, pay it to startVendor
  if (deduct > 0) {
    const startVendor = await User.findById(booking.startVendor)
    if (startVendor) {
      startVendor.wallet.balance += deduct
      await startVendor.save()
    }
  }

  booking.depositReleased      = true
  booking.depositReleasedAt    = new Date()
  booking.depositReleasedBy    = req.user._id
  booking.depositDeductAmount  = deduct
  booking.depositRefundAmount  = refund
  booking.status               = 'completed'
  booking.completedAt          = new Date()
  booking.statusHistory.push({
    status:    'completed',
    changedBy: req.user._id,
    note:      note || `Deposit released. Refunded ₹${refund}${deduct > 0 ? `, deducted ₹${deduct} for damage` : ''}.`,
  })
  await booking.save()

  const io = req.app.get('io')
  io?.to(`user_${booking.user}`).emit('deposit_released', {
    bookingId:    booking._id,
    refundAmount: refund,
    deductAmount: deduct,
    message:      deduct > 0
      ? `₹${refund} returned to wallet. ₹${deduct} deducted for damage.`
      : `₹${refund} security deposit returned to your wallet!`,
  })

  const populated = await populateBooking(Booking.findById(booking._id))
  res.status(200).json({
    message:      `Deposit processed. ₹${refund} refunded, ₹${deduct} deducted.`,
    booking:      populated,
    refundAmount: refund,
    deductAmount: deduct,
  })
})

// ─── GET /api/bookings/my ─────────────────────────────────────────────────────
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await populateBooking(
    Booking.find({ user: req.user._id }).sort({ createdAt: -1 })
  )
  res.status(200).json({ count: bookings.length, bookings })
})

// ─── GET /api/bookings/vendor ─────────────────────────────────────────────────
const getVendorBookings = asyncHandler(async (req, res) => {
  const vendorId   = req.user._id
  const vehicleIds = await Vehicle.find({ owner: vendorId }).distinct('_id')

  const bookings = await populateBooking(
    Booking.find({
      $or: [
        { startVendor: vendorId },
        { endVendor:   vendorId },
        { vehicle:     { $in: vehicleIds } },
      ],
    }).sort({ createdAt: -1 })
  )

  // Deduplicate
  const seen = new Set()
  const unique = bookings.filter(b => {
    if (seen.has(b._id.toString())) return false
    seen.add(b._id.toString())
    return true
  })

  const summary = {
    pending:                    unique.filter(b => b.status === 'pending').length,
    awaiting_destination_vendor:unique.filter(b => b.status === 'awaiting_destination_vendor').length,
    active:                     unique.filter(b => b.status === 'active').length,
    in_transit:                 unique.filter(b => b.status === 'in_transit').length,
    dropped_at_destination:     unique.filter(b => b.status === 'dropped_at_destination').length,
    completed_by_destination:   unique.filter(b => b.status === 'completed_by_destination').length,
    completed:                  unique.filter(b => b.status === 'completed').length,
    cancelled:                  unique.filter(b => b.status === 'cancelled').length,
    totalRevenue: unique
      .filter(b => b.status === 'completed' && b.startVendor?.toString() === vendorId.toString())
      .reduce((s, b) => s + b.rentalCost, 0),
  }

  res.status(200).json({ count: unique.length, bookings: unique, summary })
})

// ─── GET /api/bookings/:id ────────────────────────────────────────────────────
const getBookingById = asyncHandler(async (req, res) => {
  const booking = await populateBooking(Booking.findById(req.params.id))
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (!isParty(booking, req.user._id)) return res.status(403).json({ message: 'Not authorised' })
  res.status(200).json({ booking })
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
  if (!isParty(booking, req.user._id)) return res.status(403).json({ message: 'Not authorised' })
  res.status(200).json({ chatRoomId: booking.chatRoomId, messages: booking.messages })
})

// ─── PATCH /api/bookings/:id/assign-end-vendor (kept for backward compat) ────
const assignEndVendor = asyncHandler(async (req, res) => {
  req.body.action = 'approve'
  return startVendorAction(req, res)
})

// ─── POST /api/bookings/:id/rate ──────────────────────────────────────────────
const submitRating = asyncHandler(async (req, res) => {
  const { rating, reviewNote } = req.body
  const stars = Number(rating)
  if (!stars || stars < 1 || stars > 5) return res.status(400).json({ message: 'Rating must be 1–5' })

  const booking = await Booking.findById(req.params.id).populate('vehicle', 'owner')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (booking.status !== 'completed') return res.status(400).json({ message: 'Can only rate completed bookings' })

  const uid        = req.user._id.toString()
  const isCustomer = booking.user.toString() === uid
  const isVendor   = [
    booking.startVendor?.toString(),
    booking.endVendor?.toString(),
    booking.vehicle?.owner?.toString(),
  ].filter(Boolean).includes(uid)

  if (!isCustomer && !isVendor) return res.status(403).json({ message: 'Not authorised' })

  if (isCustomer) {
    if (booking.customerRating) return res.status(400).json({ message: 'Already rated' })
    booking.customerRating = stars
    booking.reviewNote     = reviewNote?.trim() || null
  } else {
    if (booking.vendorRating) return res.status(400).json({ message: 'Already rated' })
    booking.vendorRating = stars
  }
  await booking.save()
  res.status(200).json({ message: 'Rating submitted!', customerRating: booking.customerRating, vendorRating: booking.vendorRating })
})

module.exports = {
  createBooking, getMyBookings, getVendorBookings,
  getBookingById, updateBookingStatus, cancelBooking,
  getNetworkStats, getChatHistory, assignEndVendor,
  startVendorAction, endVendorAction,
  markDropped, markReceived, releaseDeposit,
  submitRating,
}