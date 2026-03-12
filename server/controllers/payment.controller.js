const Razorpay = require('razorpay')
const crypto   = require('crypto')
const User     = require('../models/User.model')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// Create Razorpay instance lazily — only when a payment request comes in
// This prevents crash on startup if keys are not yet in .env
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys missing — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env')
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// POST /api/payment/create-order
const createOrder = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount)
  if (!amount || amount < 100 || amount > 100000) {
    return res.status(400).json({ message: 'Enter a valid amount between ₹100 and ₹1,00,000' })
  }

  const razorpay = getRazorpay()
  const order    = await razorpay.orders.create({
    amount:   amount * 100,   // paise
    currency: 'INR',
    receipt:  `wallet_${req.user._id}_${Date.now()}`,
    notes: {
      userId:  req.user._id.toString(),
      purpose: 'HubDrive Wallet Top-up',
    },
  })

  res.status(200).json({
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    keyId:    process.env.RAZORPAY_KEY_ID,
  })
})

// POST /api/payment/verify
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing payment verification fields' })
  }

  // Verify HMAC signature — critical security step
  const body     = razorpay_order_id + '|' + razorpay_payment_id
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex')

  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed — invalid signature' })
  }

  // Credit wallet
  const creditAmount = Math.floor(Number(amount) / 100)   // paise → INR
  const user         = await User.findById(req.user._id)
  user.wallet.balance += creditAmount
  await user.save()

  res.status(200).json({
    message:   `₹${creditAmount.toLocaleString('en-IN')} added to your wallet!`,
    wallet:    user.wallet,
    paymentId: razorpay_payment_id,
  })
})

module.exports = { createOrder, verifyPayment }