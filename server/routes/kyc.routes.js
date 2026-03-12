const router = require('express').Router()
const { protect }         = require('../middleware/auth.middleware')
const { customerOnly, vendorOnly } = require('../middleware/role.middleware')
const { uploadKYCDocs, handleMulter } = require('../middleware/upload.middleware')
const {
  submitKYC, getKYCStatus,
  verifyKYC, rejectKYC, getPendingKYC,
} = require('../controllers/kyc.controller')

// Customer submits their own KYC
router.post('/submit', protect, customerOnly,
  handleMulter(uploadKYCDocs.fields([
    { name: 'dl',      maxCount: 1 },
    { name: 'aadhaar', maxCount: 1 },
  ])),
  submitKYC
)
router.get('/status', protect, getKYCStatus)

// Vendor/admin review
router.get   ('/pending',         protect, vendorOnly, getPendingKYC)
router.patch ('/:userId/verify',  protect, vendorOnly, verifyKYC)
router.patch ('/:userId/reject',  protect, vendorOnly, rejectKYC)

module.exports = router