const router = require('express').Router()
const { protect } = require('../middleware/auth.middleware')
const {
  createOrder, verifyPayment,
  saveBankDetails, withdrawToBank,
} = require('../controllers/payment.controller')

// Top-up (customers only)
router.post('/create-order', protect, createOrder)
router.post('/verify',       protect, verifyPayment)

// Withdrawal (both customers and vendors)
router.post('/save-bank',  protect, saveBankDetails)
router.post('/withdraw',   protect, withdrawToBank)

module.exports = router