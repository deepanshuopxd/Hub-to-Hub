const Booking = require('../models/Booking.model')

const initChatSocket = (io, socket) => {
  const user = socket.user

  // ── Check if user is a party to this booking ──────────────────────────────
  const isParty = (booking, userId) => {
    const uid = userId.toString()
    return [
      booking.user?.toString(),
      booking.startVendor?.toString(),
      booking.endVendor?.toString(),
      booking.vehicle?.owner?.toString(),
    ].filter(Boolean).includes(uid)
  }

  // ── Join room ─────────────────────────────────────────────────────────────
  socket.on('join_room', async ({ bookingId }) => {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('vehicle', 'owner')
        .populate('startVendor', 'name role')
        .populate('endVendor',   'name role')

      if (!booking) return socket.emit('error', { message: 'Booking not found' })
      if (!isParty(booking, user._id)) {
        return socket.emit('error', { message: 'Not authorised' })
      }

      socket.join(booking.chatRoomId)

      // Send full history + participants list
      socket.emit('room_history', {
        bookingId,
        messages:     booking.messages,
        participants: buildParticipants(booking),
      })

      // Notify others someone joined
      socket.to(booking.chatRoomId).emit('user_joined', {
        bookingId,
        userName: user.name,
        role:     user.role,
      })
    } catch {
      socket.emit('error', { message: 'Could not join room' })
    }
  })

  // ── Leave room ────────────────────────────────────────────────────────────
  socket.on('leave_room', ({ bookingId }) => {
    socket.leave(`booking_${bookingId}`)
  })

  // ── Send message ──────────────────────────────────────────────────────────
  socket.on('send_message', async ({ bookingId, content }) => {
    try {
      if (!content?.trim() || content.length > 1000) return

      const booking = await Booking.findById(bookingId).populate('vehicle', 'owner')
      if (!booking) return
      if (!isParty(booking, user._id)) return

      booking.messages.push({
        senderId:   user._id,
        senderName: user.name,
        senderRole: user.role,
        content:    content.trim(),
      })
      await booking.save()

      const saved = booking.messages[booking.messages.length - 1]

      // Broadcast to ALL parties in room (customer + startVendor + endVendor)
      io.to(booking.chatRoomId).emit('receive_message', {
        bookingId,
        message: saved,
      })

      // Push notification to parties NOT currently in the room
      const parties = [
        booking.user,
        booking.startVendor,
        booking.endVendor,
      ].filter(id => id && id.toString() !== user._id.toString())

      parties.forEach(partyId => {
        io.to(`user_${partyId}`).emit('new_message_notification', {
          bookingId,
          from:     user.name,
          preview:  content.trim().slice(0, 60),
        })
      })
    } catch {
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // ── Typing indicator ──────────────────────────────────────────────────────
  socket.on('typing', ({ bookingId, isTyping }) => {
    socket.to(`booking_${bookingId}`).emit('typing', {
      bookingId,
      isTyping,
      userName: user.name,
      role:     user.role,
    })
  })
}

// ── Build participants list for chat header ───────────────────────────────────
const buildParticipants = (booking) => {
  const list = []

  if (booking.user) {
    list.push({ role: 'customer', label: 'Customer', id: booking.user })
  }
  if (booking.startVendor) {
    list.push({
      role:  'start_vendor',
      label: booking.startVendor?.rentalService?.name || 'Pickup Vendor',
      id:    booking.startVendor?._id || booking.startVendor,
    })
  }
  if (booking.endVendor) {
    list.push({
      role:  'end_vendor',
      label: booking.endVendor?.rentalService?.name || 'Dropoff Vendor',
      id:    booking.endVendor?._id || booking.endVendor,
    })
  }

  return list
}

module.exports = initChatSocket