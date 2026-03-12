// const Booking = require('../models/Booking.model')
// const Vehicle = require('../models/Vehicle.model')
// const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers')

// // ── GET /api/chat/:bookingId/history ─────────────────────────────────────────
// const getChatHistory = asyncHandler(async (req, res) => {
//   const booking = await Booking.findById(req.params.bookingId)
//     .select('messages chatRoomId user vehicle')
//     .populate('user',    'name')
//     .populate('vehicle', 'owner')

//   if (!booking) return sendError(res, 404, 'Booking not found')

//   // Auth: only booking parties
//   const isCustomer = booking.user._id.toString() === req.user._id.toString()
//   const isVendor   = booking.vehicle?.owner?.toString() === req.user._id.toString()
//   if (!isCustomer && !isVendor) return sendError(res, 403, 'Not authorised')

//   sendSuccess(res, 200, {
//     chatRoomId: booking.chatRoomId,
//     messages:   booking.messages,
//     count:      booking.messages.length,
//   })
// })

// // ── POST /api/chat/:bookingId/message ─────────────────────────────────────────
// // REST fallback — primary messaging is via Socket.io
// const sendMessage = asyncHandler(async (req, res) => {
//   const { content } = req.body
//   if (!content?.trim()) return sendError(res, 400, 'Message content required')
//   if (content.length > 1000) return sendError(res, 400, 'Message too long (max 1000 chars)')

//   const booking = await Booking.findById(req.params.bookingId)
//     .populate('vehicle', 'owner')
//   if (!booking) return sendError(res, 404, 'Booking not found')

//   const isCustomer = booking.user.toString() === req.user._id.toString()
//   const isVendor   = booking.vehicle?.owner?.toString() === req.user._id.toString()
//   if (!isCustomer && !isVendor) return sendError(res, 403, 'Not authorised')

//   const message = {
//     senderId:   req.user._id,
//     senderName: req.user.name,
//     senderRole: req.user.role,
//     content:    content.trim(),
//     createdAt:  new Date(),
//   }

//   booking.messages.push(message)
//   await booking.save()

//   // Also emit via socket
//   const io = req.app.get('io')
//   io?.to(booking.chatRoomId).emit('receive_message', {
//     bookingId: booking._id,
//     message:   booking.messages[booking.messages.length - 1],
//   })

//   sendSuccess(res, 201, { message: booking.messages[booking.messages.length - 1] })
// })

// // ── PATCH /api/chat/:bookingId/read ──────────────────────────────────────────
// const markMessagesRead = asyncHandler(async (req, res) => {
//   const booking = await Booking.findById(req.params.bookingId)
//   if (!booking) return sendError(res, 404, 'Booking not found')

//   // Mark all messages NOT from current user as read
//   booking.messages.forEach(msg => {
//     if (msg.senderId.toString() !== req.user._id.toString()) {
//       msg.read = true
//     }
//   })
//   await booking.save()

//   sendSuccess(res, 200, { message: 'Messages marked as read' })
// })

// module.exports = { getChatHistory, sendMessage, markMessagesRead }

const Booking = require('../models/Booking.model')
const Vehicle = require('../models/Vehicle.model')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// Helper — check if user is a party to the booking
const isParty = (booking, userId) => {
  const customerId = booking.user._id?.toString() || booking.user.toString()
  const vendorId   = booking.vehicle?.owner?.toString()
  const uid        = userId.toString()
  return customerId === uid || vendorId === uid
}

// GET /api/chat/:bookingId/history
const getChatHistory = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .select('messages chatRoomId user vehicle')
    .populate('vehicle', 'owner')

  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (!isParty(booking, req.user._id)) return res.status(403).json({ message: 'Not authorised' })

  res.status(200).json({
    chatRoomId: booking.chatRoomId,
    messages:   booking.messages,
    count:      booking.messages.length,
  })
})

// POST /api/chat/:bookingId/message  — REST fallback (primary is Socket.io)
const sendMessage = asyncHandler(async (req, res) => {
  const { content } = req.body
  if (!content?.trim()) return res.status(400).json({ message: 'Message cannot be empty' })
  if (content.length > 1000) return res.status(400).json({ message: 'Message too long (max 1000 chars)' })

  const booking = await Booking.findById(req.params.bookingId)
    .populate('vehicle', 'owner')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (!isParty(booking, req.user._id)) return res.status(403).json({ message: 'Not authorised' })

  booking.messages.push({
    senderId:   req.user._id,
    senderName: req.user.name,
    senderRole: req.user.role,
    content:    content.trim(),
  })
  await booking.save()

  const saved = booking.messages[booking.messages.length - 1]

  // Also emit via socket so connected clients get it instantly
  const io = req.app.get('io')
  io?.to(booking.chatRoomId).emit('receive_message', { bookingId: booking._id, message: saved })

  res.status(201).json({ message: saved })
})

// PATCH /api/chat/:bookingId/read
const markMessagesRead = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.bookingId)
    .populate('vehicle', 'owner')
  if (!booking) return res.status(404).json({ message: 'Booking not found' })
  if (!isParty(booking, req.user._id)) return res.status(403).json({ message: 'Not authorised' })

  booking.messages.forEach(msg => {
    if (msg.senderId.toString() !== req.user._id.toString()) msg.read = true
  })
  await booking.save()

  res.status(200).json({ message: 'Messages marked as read' })
})

module.exports = { getChatHistory, sendMessage, markMessagesRead }
