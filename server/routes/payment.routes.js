const router = require('express').Router()
const { protect }      = require('../middleware/auth.middleware')
const { customerOnly } = require('../middleware/role.middleware')
const { createOrder, verifyPayment } = require('../controllers/payment.controller')

router.post('/create-order', protect, customerOnly, createOrder)
router.post('/verify',       protect, customerOnly, verifyPayment)

module.exports = router