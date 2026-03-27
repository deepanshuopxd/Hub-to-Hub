const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const { requireKYC, vendorOnly, customerOnly } = require('../middleware/role.middleware')
const { uploadHandoverMedia, uploadDamageMedia, handleMulter } = require('../middleware/upload.middleware')
const {
  createBooking, getMyBookings, getVendorBookings,
  getBookingById, updateBookingStatus, cancelBooking,
  getNetworkStats, getChatHistory,
  startVendorAction, endVendorAction,
  markDropped, markReceived, releaseDeposit,
  submitRating,
} = require('../controllers/booking.controller')
const {
  uploadPickupMedia, uploadDropoffMedia,
  getMedia, raiseDamageReport, resolveDamageReport,
} = require('../controllers/handover.controller')

// ── Public ────────────────────────────────────────────────────────────────────
router.get('/network-stats', getNetworkStats)

// ── Customer ──────────────────────────────────────────────────────────────────
router.post  ('/',              protect, requireKYC, createBooking)
router.get   ('/my',            protect, customerOnly, getMyBookings)
router.patch ('/:id/cancel',    protect, cancelBooking)
router.patch ('/:id/status',    protect, updateBookingStatus)       // in_transit
router.patch ('/:id/mark-dropped', protect, customerOnly, markDropped)

// ── Vendor ────────────────────────────────────────────────────────────────────
router.get   ('/vendor',                   protect, vendorOnly, getVendorBookings)
router.patch ('/:id/start-vendor-action',  protect, vendorOnly, startVendorAction)
router.patch ('/:id/end-vendor-action',    protect, vendorOnly, endVendorAction)
router.patch ('/:id/mark-received',        protect, vendorOnly, markReceived)
router.patch ('/:id/release-deposit',      protect, vendorOnly, releaseDeposit)

// ── Handover media ────────────────────────────────────────────────────────────
router.get  ('/:id/media',         protect, getMedia)
router.post ('/:id/pickup-media',  protect, handleMulter(uploadHandoverMedia.array('media', 10)), uploadPickupMedia)
router.post ('/:id/dropoff-media', protect, handleMulter(uploadHandoverMedia.array('media', 10)), uploadDropoffMedia)

// ── Damage ────────────────────────────────────────────────────────────────────
router.post  ('/:id/damage-report',          protect, handleMulter(uploadDamageMedia.array('media', 5)), raiseDamageReport)
router.patch ('/:id/damage-report/resolve',  protect, resolveDamageReport)

// ── Rating ────────────────────────────────────────────────────────────────────
router.post('/:id/rate', protect, submitRating)

// ── Shared ────────────────────────────────────────────────────────────────────
router.get('/:id',              protect, getBookingById)
router.get('/:id/chat-history', protect, getChatHistory)

module.exports = router