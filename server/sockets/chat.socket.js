// const Booking = require('../models/Booking.model')

// const initChatSocket = (io, socket) => {
//   const user = socket.user

//   // Join a booking's chat room
//   socket.on('join_room', async ({ bookingId }) => {
//     try {
//       const booking = await Booking.findById(bookingId).populate('vehicle', 'owner')
//       if (!booking) return socket.emit('error', { message: 'Booking not found' })

//       const isCustomer = booking.user.toString()          === user._id.toString()
//       const isVendor   = booking.vehicle?.owner?.toString()=== user._id.toString()
//       if (!isCustomer && !isVendor) {
//         return socket.emit('error', { message: 'Not authorised' })
//       }

//       socket.join(booking.chatRoomId)

//       // Send full history on join
//       socket.emit('room_history', {
//         bookingId,
//         messages: booking.messages,
//       })
//     } catch {
//       socket.emit('error', { message: 'Could not join room' })
//     }
//   })

//   // Leave room
//   socket.on('leave_room', ({ bookingId }) => {
//     socket.leave(`booking_${bookingId}`)
//   })

//   // Send message — persisted to DB + broadcast
//   socket.on('send_message', async ({ bookingId, content }) => {
//     try {
//       if (!content?.trim() || content.length > 1000) return

//       const booking = await Booking.findById(bookingId).populate('vehicle', 'owner')
//       if (!booking) return

//       const isCustomer = booking.user.toString()           === user._id.toString()
//       const isVendor   = booking.vehicle?.owner?.toString()=== user._id.toString()
//       if (!isCustomer && !isVendor) return

//       booking.messages.push({
//         senderId:   user._id,
//         senderName: user.name,
//         senderRole: user.role,
//         content:    content.trim(),
//       })
//       await booking.save()

//       const saved = booking.messages[booking.messages.length - 1]

//       io.to(booking.chatRoomId).emit('receive_message', {
//         bookingId,
//         message: saved,
//       })
//     } catch {
//       socket.emit('error', { message: 'Failed to send message' })
//     }
//   })

//   // Typing indicator
//   socket.on('typing', ({ bookingId, isTyping }) => {
//     socket.to(`booking_${bookingId}`).emit('typing', {
//       bookingId,
//       isTyping,
//       userName: user.name,
//     })
//   })
// }

// module.exports = initChatSocket



const Booking = require('../models/Booking.model')

const initChatSocket = (io, socket) => {
  const user = socket.user

  // Join a booking's chat room
  socket.on('join_room', async ({ bookingId }) => {
    try {
      const booking = await Booking.findById(bookingId).populate('vehicle', 'owner')
      if (!booking) return socket.emit('error', { message: 'Booking not found' })

      const isCustomer = booking.user.toString()          === user._id.toString()
      const isVendor   = booking.vehicle?.owner?.toString()=== user._id.toString()
      if (!isCustomer && !isVendor) {
        return socket.emit('error', { message: 'Not authorised' })
      }

      socket.join(booking.chatRoomId)

      // Send full history on join
      socket.emit('room_history', {
        bookingId,
        messages: booking.messages,
      })
    } catch {
      socket.emit('error', { message: 'Could not join room' })
    }
  })

  // Leave room
  socket.on('leave_room', ({ bookingId }) => {
    socket.leave(`booking_${bookingId}`)
  })

  // Send message — persisted to DB + broadcast
  socket.on('send_message', async ({ bookingId, content }) => {
    try {
      if (!content?.trim() || content.length > 1000) return

      const booking = await Booking.findById(bookingId).populate('vehicle', 'owner')
      if (!booking) return

      const isCustomer = booking.user.toString()           === user._id.toString()
      const isVendor   = booking.vehicle?.owner?.toString()=== user._id.toString()
      if (!isCustomer && !isVendor) return

      booking.messages.push({
        senderId:   user._id,
        senderName: user.name,
        senderRole: user.role,
        content:    content.trim(),
      })
      await booking.save()

      const saved = booking.messages[booking.messages.length - 1]

      io.to(booking.chatRoomId).emit('receive_message', {
        bookingId,
        message: saved,
      })
    } catch {
      socket.emit('error', { message: 'Failed to send message' })
    }
  })

  // Typing indicator
  socket.on('typing', ({ bookingId, isTyping }) => {
    socket.to(`booking_${bookingId}`).emit('typing', {
      bookingId,
      isTyping,
      userName: user.name,
    })
  })
}

module.exports = initChatSocket