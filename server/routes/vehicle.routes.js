const router = require('express').Router()
const { protect }           = require('../middleware/auth.middleware')
const { vendorOnly }        = require('../middleware/role.middleware')
const { uploadVehicleImages, handleMulter } = require('../middleware/upload.middleware')
const {
  getAllVehicles, getVendorFleet, getAvailableHubs,
  getVehicleById, createVehicle, updateVehicle,
  toggleAvailability, deleteVehicle,
} = require('../controllers/vehicle.controller')

// ── Static routes FIRST ───────────────────────────────────────────────────────
router.get('/hubs',            getAvailableHubs)
router.get('/vendor/my-fleet', protect, vendorOnly, getVendorFleet)

// ── Collection ────────────────────────────────────────────────────────────────
router.get ('/', getAllVehicles)
router.post('/', protect, vendorOnly, handleMulter(uploadVehicleImages.array('images', 5)), createVehicle)

// ── Dynamic :id LAST ──────────────────────────────────────────────────────────
router.get   ('/:id',              getVehicleById)
router.put   ('/:id',              protect, vendorOnly, handleMulter(uploadVehicleImages.array('images', 5)), updateVehicle)
router.patch ('/:id/availability', protect, vendorOnly, toggleAvailability)
router.delete('/:id',              protect, vendorOnly, deleteVehicle)

module.exports = router