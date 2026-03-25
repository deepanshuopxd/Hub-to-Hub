const Booking = require('../models/Booking.model')
const Vehicle = require('../models/Vehicle.model')
const User    = require('../models/User.model')
const path    = require('path')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// ── Helper: build media objects from uploaded files ───────────────────────────
const buildMediaItems = (files, uploadedBy, role, note = '') =>
  (files || []).map(f => {
    const isVideo = f.mimetype.startsWith('video/')
    return {
      url:        `/uploads/handover/${uploadedBy}/${f.filename}`,
      type:       isVideo ? 'video' : 'image',
      uploadedBy,
      role,
      uploadedAt: new Date(),
      note:       note || null,
    }
  })

// ── Auth helper: check if user is a party to the booking ─────────────────────
const checkAccess = (booking, userId) => {
  const uid = userId.toString()
  return [
    booking.user?.toString(),
    booking.startVendor?.toString(),
    booking.endVendor?.toString(),
    booking.vehicle?.owner?.toString(),
  ].filter(Boolean).includes(uid)
}

// ─── POST /api/bookings/:id/pickup-media ──────────────────────────────────────
// Upload photos/video at vehicle pickup (before trip starts)
// Both customer and startVendor can upload
const uploadPickupMedia = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('vehicle', 'owner')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (!checkAccess(booking, req.user._id)) {
    return res.status(403).json({ message: 'Not authorised' })
  }

  if (!['pending', 'active'].includes(booking.status)) {
    return res.status(400).json({ message: 'Pickup media can only be uploaded before/at trip start' })
  }

  if (!req.files?.length) {
    return res.status(400).json({ message: 'No files uploaded' })
  }

  const items = buildMediaItems(
    req.files,
    req.user._id,
    req.user.role,
    req.body.note || '',
  )

  booking.pickupMedia.push(...items)
  await booking.save()

  // Notify all parties via socket
  const io = req.app.get('io')
  io?.to(booking.chatRoomId).emit('media_uploaded', {
    bookingId: booking._id,
    type:      'pickup',
    by:        req.user.role,
    count:     items.length,
  })

  res.status(200).json({
    message:      `${items.length} pickup media uploaded`,
    pickupMedia:  booking.pickupMedia,
  })
})

// ─── POST /api/bookings/:id/dropoff-media ─────────────────────────────────────
// Upload photos/video at vehicle dropoff (after trip ends)
// Both customer and endVendor can upload
const uploadDropoffMedia = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('vehicle', 'owner')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (!checkAccess(booking, req.user._id)) {
    return res.status(403).json({ message: 'Not authorised' })
  }

  if (!['active', 'in_transit', 'completed'].includes(booking.status)) {
    return res.status(400).json({ message: 'Dropoff media can only be uploaded during or after trip' })
  }

  if (!req.files?.length) {
    return res.status(400).json({ message: 'No files uploaded' })
  }

  const items = buildMediaItems(
    req.files,
    req.user._id,
    req.user.role,
    req.body.note || '',
  )

  booking.dropoffMedia.push(...items)
  await booking.save()

  const io = req.app.get('io')
  io?.to(booking.chatRoomId).emit('media_uploaded', {
    bookingId: booking._id,
    type:      'dropoff',
    by:        req.user.role,
    count:     items.length,
  })

  res.status(200).json({
    message:      `${items.length} dropoff media uploaded`,
    dropoffMedia: booking.dropoffMedia,
  })
})

// ─── GET /api/bookings/:id/media ──────────────────────────────────────────────
// Get all pickup + dropoff media for a booking
const getMedia = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id)
    .select('pickupMedia dropoffMedia user startVendor endVendor vehicle status')
    .populate('vehicle', 'owner')

  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (!checkAccess(booking, req.user._id)) {
    return res.status(403).json({ message: 'Not authorised' })
  }

  res.status(200).json({
    status:       booking.status,
    pickupMedia:  booking.pickupMedia  || [],
    dropoffMedia: booking.dropoffMedia || [],
  })
})

// ─── POST /api/bookings/:id/damage-report ────────────────────────────────────
// endVendor raises a damage report after reviewing dropoff vs pickup media
// Can deduct from security deposit
const raiseDamageReport = asyncHandler(async (req, res) => {
  const { description, damageAmount } = req.body

  if (!description?.trim()) {
    return res.status(400).json({ message: 'Damage description is required' })
  }

  const amount = Number(damageAmount)
  if (isNaN(amount) || amount < 0) {
    return res.status(400).json({ message: 'Enter a valid damage amount' })
  }

  const booking = await Booking.findById(req.params.id).populate('vehicle', 'owner')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  // Only endVendor or vehicle owner can raise damage report
  const uid        = req.user._id.toString()
  const isEndV     = booking.endVendor?.toString()         === uid
  const isOwner    = booking.vehicle?.owner?.toString()    === uid
  const isStartV   = booking.startVendor?.toString()       === uid

  if (!isEndV && !isOwner && !isStartV) {
    return res.status(403).json({ message: 'Only the receiving vendor can raise a damage report' })
  }

  if (booking.status !== 'completed') {
    return res.status(400).json({ message: 'Damage report can only be raised after trip completion' })
  }

  if (booking.damageReport?.resolved) {
    return res.status(400).json({ message: 'Damage report already resolved' })
  }

  // Clamp damage amount to deposit
  const clampedAmount = Math.min(amount, booking.depositAmount)
  const refundAmount  = booking.depositAmount - clampedAmount

  // Build damage media from uploaded files
  const damageMedia = (req.files || []).map(f => ({
    url:        `/uploads/damage/${req.user._id}/${f.filename}`,
    type:       'image',
    uploadedBy: req.user._id,
    role:       req.user.role,
    uploadedAt: new Date(),
  }))

  booking.damageReport = {
    reportedBy:   req.user._id,
    reportedAt:   new Date(),
    description:  description.trim(),
    damageAmount: clampedAmount,
    refundAmount,
    media:        damageMedia,
    resolved:     false,
  }

  await booking.save()

  // Deduct from customer deposit
  // releaseDeposit already done at completion — need to claw back
  const customer = await User.findById(booking.user)

  if (clampedAmount > 0) {
    // Take damage amount back from customer balance
    customer.wallet.balance = Math.max(0, customer.wallet.balance - clampedAmount)
    await customer.save()

    // Pay damage amount to endVendor
    const payTo = await User.findById(booking.endVendor || booking.startVendor || booking.vehicle.owner)
    if (payTo) {
      payTo.wallet.balance += clampedAmount
      await payTo.save()
    }
  }

  // Notify customer via socket
  const io = req.app.get('io')
  io?.to(`user_${booking.user}`).emit('damage_report', {
    bookingId:    booking._id,
    damageAmount: clampedAmount,
    refundAmount,
    description:  description.trim(),
    message:      clampedAmount > 0
      ? `₹${clampedAmount} deducted from your security deposit for damage: ${description}`
      : 'Damage reported but no deduction made',
  })

  res.status(200).json({
    message:      'Damage report submitted',
    damageReport: booking.damageReport,
    deducted:     clampedAmount,
    refunded:     refundAmount,
  })
})

// ─── PATCH /api/bookings/:id/damage-report/resolve ───────────────────────────
// Mark damage report as resolved (after dispute settled)
const resolveDamageReport = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('vehicle', 'owner')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })

  const uid     = req.user._id.toString()
  const isVendor= [
    booking.startVendor?.toString(),
    booking.endVendor?.toString(),
    booking.vehicle?.owner?.toString(),
  ].includes(uid)

  if (!isVendor) return res.status(403).json({ message: 'Only vendors can resolve damage reports' })
  if (!booking.damageReport) return res.status(400).json({ message: 'No damage report found' })

  booking.damageReport.resolved = true
  await booking.save()

  res.status(200).json({ message: 'Damage report resolved', damageReport: booking.damageReport })
})

module.exports = {
  uploadPickupMedia,
  uploadDropoffMedia,
  getMedia,
  raiseDamageReport,
  resolveDamageReport,
}