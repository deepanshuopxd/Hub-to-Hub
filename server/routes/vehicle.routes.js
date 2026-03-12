// const router = require('express').Router()
// const { protect }           = require('../middleware/auth.middleware')
// const { vendorOnly }        = require('../middleware/role.middleware')
// const { uploadVehicleImages, handleMulter } = require('../middleware/upload.middleware')
// const {
//   getAllVehicles, getVendorFleet, getAvailableHubs,
//   getVehicleById, createVehicle, updateVehicle,
//   toggleAvailability, deleteVehicle,
// } = require('../controllers/vehicle.controller')

// // Public
// router.get('/',                 getAllVehicles)
// router.get('/hubs',             getAvailableHubs)

// // Vendor-protected (order matters — specific before :id)
// router.get   ('/vendor/my-fleet', protect, vendorOnly, getVendorFleet)
// router.post  ('/',                protect, vendorOnly, handleMulter(uploadVehicleImages.array('images', 5)), createVehicle)

// // Public by ID
// router.get('/:id', getVehicleById)

// // Vendor-protected by ID
// router.put   ('/:id',             protect, vendorOnly, updateVehicle)
// router.patch ('/:id/availability',protect, vendorOnly, toggleAvailability)
// router.delete('/:id',             protect, vendorOnly, deleteVehicle)

// module.exports = router


const router = require('express').Router()
const { protect }           = require('../middleware/auth.middleware')
const { vendorOnly }        = require('../middleware/role.middleware')
const { uploadVehicleImages, handleMulter } = require('../middleware/upload.middleware')
const {
  getAllVehicles, getVendorFleet, getAvailableHubs,
  getVehicleById, createVehicle, updateVehicle,
  toggleAvailability, deleteVehicle,
} = require('../controllers/vehicle.controller')

// ── Static routes FIRST (before any /:id routes) ─────────────────────────────
router.get('/hubs',              getAvailableHubs)
router.get('/vendor/my-fleet',   protect, vendorOnly, getVendorFleet)

// ── Collection routes ─────────────────────────────────────────────────────────
router.get ('/', getAllVehicles)
router.post('/', protect, vendorOnly, handleMulter(uploadVehicleImages.array('images', 5)), createVehicle)

// ── Dynamic :id routes LAST ───────────────────────────────────────────────────
router.get   ('/:id',              getVehicleById)
router.put   ('/:id',              protect, vendorOnly, updateVehicle)
router.patch ('/:id/availability', protect, vendorOnly, toggleAvailability)
router.delete('/:id',              protect, vendorOnly, deleteVehicle)

module.exports = router
