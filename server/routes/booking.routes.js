const router = require('express').Router()
const { protect }              = require('../middleware/auth.middleware')
const { requireKYC, vendorOnly, customerOnly } = require('../middleware/role.middleware')
const {
  createBooking, getMyBookings, getVendorBookings,
  getBookingById, updateBookingStatus, cancelBooking,
  getNetworkStats, getChatHistory,
} = require('../controllers/booking.controller')

// Public — USP stats on landing page
router.get('/network-stats', getNetworkStats)

// Customer
router.post  ('/',           protect, requireKYC, createBooking)
router.get   ('/my',         protect, customerOnly, getMyBookings)
router.patch ('/:id/cancel', protect, cancelBooking)

// Vendor
router.get   ('/vendor',     protect, vendorOnly, getVendorBookings)
router.patch ('/:id/status', protect, updateBookingStatus)

// Both parties
router.get('/:id',              protect, getBookingById)
router.get('/:id/chat-history', protect, getChatHistory)

module.exports = router