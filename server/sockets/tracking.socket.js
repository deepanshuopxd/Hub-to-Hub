// const Booking = require('../models/Booking.model')
// const Vehicle = require('../models/Vehicle.model')

// // ── Tracking Socket ───────────────────────────────────────────────────────────
// // USP Feature: vehicles stream their GPS in real time as they move hub-to-hub.
// // Customers watch their rented car travel on the Mapbox map.
// // Vendors see their entire fleet's live positions.

// const initTrackingSocket = (io, socket) => {
//   const user = socket.user

//   // ── Subscribe to a booking's live tracking ────────────────────────────────
//   socket.on('track_booking', async ({ bookingId }) => {
//     try {
//       const booking = await Booking.findById(bookingId)
//         .populate('vehicle', 'owner lastKnownPosition currentHub')
//       if (!booking) return

//       const isCustomer = booking.user.toString()          === user._id.toString()
//       const isVendor   = booking.vehicle?.owner?.toString() === user._id.toString()
//       if (!isCustomer && !isVendor) return

//       const trackRoom = `track_${bookingId}`
//       socket.join(trackRoom)

//       // Send current position immediately
//       if (booking.vehicle?.lastKnownPosition?.lat) {
//         socket.emit('position_update', {
//           bookingId,
//           lat:        booking.vehicle.lastKnownPosition.lat,
//           lng:        booking.vehicle.lastKnownPosition.lng,
//           updatedAt:  booking.vehicle.lastKnownPosition.updatedAt,
//           status:     booking.status,
//           startHub:   booking.startHub,
//           endHub:     booking.endHub,
//         })
//       }
//     } catch (err) {
//       socket.emit('error', { message: 'Failed to subscribe to tracking' })
//     }
//   })

//   // ── Vendor / driver pushes GPS update ────────────────────────────────────
//   // In production this would come from a mobile app
//   // For demo: client simulates movement with requestAnimationFrame
//   socket.on('push_location', async ({ bookingId, lat, lng }) => {
//     try {
//       if (!lat || !lng) return

//       const booking = await Booking.findById(bookingId)
//         .populate('vehicle', 'owner')
//       if (!booking) return

//       const isVendor = booking.vehicle?.owner?.toString() === user._id.toString()
//       if (!isVendor) return

//       // Update live position in booking
//       booking.livePosition = { lat, lng, updatedAt: new Date() }
//       await booking.save()

//       // Update vehicle's last known position
//       await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
//         lastKnownPosition: { lat, lng, updatedAt: new Date() },
//       })

//       // Broadcast to all subscribers of this booking's track room
//       io.to(`track_${bookingId}`).emit('position_update', {
//         bookingId,
//         lat,
//         lng,
//         updatedAt: new Date(),
//         status:    booking.status,
//       })
//     } catch (err) {
//       // Silent fail — GPS updates are high frequency
//     }
//   })

//   // ── Stop tracking ─────────────────────────────────────────────────────────
//   socket.on('stop_tracking', ({ bookingId }) => {
//     socket.leave(`track_${bookingId}`)
//   })

//   // ── Vendor: subscribe to all fleet positions ──────────────────────────────
//   // USP: vendor sees every vehicle in the network on the map
//   socket.on('track_fleet', async () => {
//     if (user.role !== 'center_admin') return

//     try {
//       const vehicles = await Vehicle.find({ owner: user._id, isActive: true })
//         .select('_id make model plateNumber currentHub lastKnownPosition isAvailable')

//       socket.emit('fleet_positions', { vehicles })

//       // Join vendor's fleet room for live updates
//       socket.join(`fleet_${user._id}`)
//     } catch (err) {
//       socket.emit('error', { message: 'Failed to load fleet positions' })
//     }
//   })
// }

// module.exports = initTrackingSocket






const Booking = require('../models/Booking.model')
const Vehicle = require('../models/Vehicle.model')

// USP Feature: live GPS streaming as vehicle moves hub-to-hub
const initTrackingSocket = (io, socket) => {
  const user = socket.user

  // Customer subscribes to a booking's live location
  socket.on('track_booking', async ({ bookingId }) => {
    try {
      const booking = await Booking.findById(bookingId)
        .populate('vehicle', 'owner lastKnownPosition')
      if (!booking) return

      const isCustomer = booking.user.toString()           === user._id.toString()
      const isVendor   = booking.vehicle?.owner?.toString()=== user._id.toString()
      if (!isCustomer && !isVendor) return

      socket.join(`track_${bookingId}`)

      // Send last known position immediately
      if (booking.vehicle?.lastKnownPosition?.lat) {
        socket.emit('position_update', {
          bookingId,
          lat:       booking.vehicle.lastKnownPosition.lat,
          lng:       booking.vehicle.lastKnownPosition.lng,
          updatedAt: booking.vehicle.lastKnownPosition.updatedAt,
          status:    booking.status,
          startHub:  booking.startHub,
          endHub:    booking.endHub,
        })
      }
    } catch {
      socket.emit('error', { message: 'Failed to start tracking' })
    }
  })

  // Vendor / driver pushes GPS position (from mobile in production, simulated on web)
  socket.on('push_location', async ({ bookingId, lat, lng }) => {
    try {
      if (!lat || !lng) return

      const booking = await Booking.findById(bookingId).populate('vehicle', 'owner')
      if (!booking) return

      const isVendor = booking.vehicle?.owner?.toString() === user._id.toString()
      if (!isVendor) return

      // Persist to booking + vehicle
      booking.livePosition = { lat, lng, updatedAt: new Date() }
      await booking.save()

      await Vehicle.findByIdAndUpdate(booking.vehicle._id, {
        lastKnownPosition: { lat, lng, updatedAt: new Date() },
      })

      // Broadcast to all subscribers of this trip
      io.to(`track_${bookingId}`).emit('position_update', {
        bookingId,
        lat,
        lng,
        updatedAt: new Date(),
        status:    booking.status,
      })
    } catch {
      // High-frequency event — fail silently
    }
  })

  // Stop tracking
  socket.on('stop_tracking', ({ bookingId }) => {
    socket.leave(`track_${bookingId}`)
  })

  // Vendor: view all fleet positions
  socket.on('track_fleet', async () => {
    if (user.role !== 'center_admin') return
    try {
      const vehicles = await Vehicle.find({ owner: user._id, isActive: true })
        .select('make model plateNumber currentHub lastKnownPosition isAvailable')
      socket.emit('fleet_positions', { vehicles })
      socket.join(`fleet_${user._id}`)
    } catch {
      socket.emit('error', { message: 'Failed to load fleet' })
    }
  })
}

module.exports = initTrackingSocket