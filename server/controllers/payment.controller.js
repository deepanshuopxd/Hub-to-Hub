const Razorpay = require('razorpay')
const crypto   = require('crypto')
const User     = require('../models/User.model')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// ── Lazy Razorpay init ────────────────────────────────────────────────────────
const getRazorpay = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys missing — add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to .env')
  }
  return new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  })
}

// ── POST /api/payment/create-order ───────────────────────────────────────────
const createOrder = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount)
  if (!amount || amount < 100 || amount > 100000) {
    return res.status(400).json({ message: 'Enter a valid amount between ₹100 and ₹1,00,000' })
  }

  const razorpay = getRazorpay()
  const order    = await razorpay.orders.create({
    amount:   amount * 100,
    currency: 'INR',
    receipt:  `wallet_${req.user._id}_${Date.now()}`,
    notes:    { userId: req.user._id.toString(), purpose: 'HubDrive Wallet Top-up' },
  })

  res.status(200).json({
    orderId:  order.id,
    amount:   order.amount,
    currency: order.currency,
    keyId:    process.env.RAZORPAY_KEY_ID,
  })
})

// ── POST /api/payment/verify ─────────────────────────────────────────────────
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, amount } = req.body

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing payment verification fields' })
  }

  const body     = razorpay_order_id + '|' + razorpay_payment_id
  const expected = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(body).digest('hex')

  if (expected !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed — invalid signature' })
  }

  const creditAmount = Math.floor(Number(amount) / 100)
  const user         = await User.findById(req.user._id)
  user.wallet.balance += creditAmount
  await user.save()

  res.status(200).json({
    message:   `₹${creditAmount.toLocaleString('en-IN')} added to your wallet!`,
    wallet:    user.wallet,
    paymentId: razorpay_payment_id,
  })
})

// ── POST /api/payment/save-bank-details ──────────────────────────────────────
// Save UPI ID or bank account for withdrawals
const saveBankDetails = asyncHandler(async (req, res) => {
  const { upiId, accountName, accountNo, ifsc } = req.body

  if (!upiId && !accountNo) {
    return res.status(400).json({ message: 'Provide either UPI ID or bank account details' })
  }

  // Validate UPI ID format
  if (upiId && !/^[\w.\-_]{3,}@[a-zA-Z]{3,}$/.test(upiId)) {
    return res.status(400).json({ message: 'Invalid UPI ID format (e.g. name@upi)' })
  }

  // Validate IFSC if bank account provided
  if (accountNo && ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(ifsc.toUpperCase())) {
    return res.status(400).json({ message: 'Invalid IFSC code format' })
  }

  const user = await User.findById(req.user._id)
  user.bankDetails = {
    upiId:       upiId?.trim()       || user.bankDetails?.upiId       || null,
    accountName: accountName?.trim() || user.bankDetails?.accountName || null,
    accountNo:   accountNo?.trim()   || user.bankDetails?.accountNo   || null,
    ifsc:        ifsc?.trim().toUpperCase() || user.bankDetails?.ifsc || null,
  }
  await user.save()

  res.status(200).json({
    message:     'Bank details saved',
    bankDetails: user.bankDetails,
  })
})

// ── POST /api/payment/withdraw ───────────────────────────────────────────────
// Withdraw wallet balance to bank via Razorpay Payout API
// NOTE: Razorpay Payouts requires:
//   1. Razorpay Route / Payouts enabled on your account (dashboard.razorpay.com → Payouts)
//   2. Add RAZORPAY_ACCOUNT_NUMBER to .env (your Razorpay banking account number)
//   3. Fund your Razorpay account with money to disburse

const withdrawToBank = asyncHandler(async (req, res) => {
  const { amount, method = 'upi' } = req.body   // method: 'upi' | 'bank'
  const withdrawAmount = Number(amount)

  if (!withdrawAmount || withdrawAmount < 100) {
    return res.status(400).json({ message: 'Minimum withdrawal is ₹100' })
  }

  const user = await User.findById(req.user._id)

  if (user.wallet.balance < withdrawAmount) {
    return res.status(400).json({
      message:       `Insufficient balance. Available: ₹${user.wallet.balance}`,
      walletBalance: user.wallet.balance,
    })
  }

  // Check bank details saved
  const bank = user.bankDetails
  if (method === 'upi' && !bank?.upiId) {
    return res.status(400).json({ message: 'Save your UPI ID before withdrawing' })
  }
  if (method === 'bank' && (!bank?.accountNo || !bank?.ifsc)) {
    return res.status(400).json({ message: 'Save your bank account details before withdrawing' })
  }

  // Check Razorpay Payouts config
  if (!process.env.RAZORPAY_ACCOUNT_NUMBER) {
    // Fallback: manual payout mode — just deduct from wallet and mark pending
    user.wallet.balance -= withdrawAmount
    await user.save()

    return res.status(200).json({
      message: `Withdrawal of ₹${withdrawAmount} requested. Will be processed within 24 hours to your ${method === 'upi' ? `UPI (${bank.upiId})` : 'bank account'}.`,
      wallet:  user.wallet,
      mode:    'manual',
    })
  }

  // ── Razorpay Payout API ───────────────────────────────────────────────────
  try {
    const razorpay = getRazorpay()

    // Step 1: Create or fetch contact
    let contactId = user.razorpayContactId
    if (!contactId) {
      const contact = await razorpay.contacts.create({
        name:         user.name,
        email:        user.email,
        contact:      user.phone ? `+91${user.phone}` : undefined,
        type:         'customer',
        reference_id: user._id.toString(),
      })
      contactId = contact.id
      user.razorpayContactId = contactId
    }

    // Step 2: Create fund account (UPI or bank)
    let fundAccountDetails
    if (method === 'upi') {
      fundAccountDetails = {
        contact_id:   contactId,
        account_type: 'vpa',
        vpa:          { address: bank.upiId },
      }
    } else {
      fundAccountDetails = {
        contact_id:    contactId,
        account_type:  'bank_account',
        bank_account: {
          name:           bank.accountName || user.name,
          ifsc:           bank.ifsc,
          account_number: bank.accountNo,
        },
      }
    }

    const fundAccount = await razorpay.fundAccount.create(fundAccountDetails)

    // Step 3: Create payout
    const payout = await razorpay.payouts.create({
      account_number: process.env.RAZORPAY_ACCOUNT_NUMBER,
      fund_account_id:fundAccount.id,
      amount:         withdrawAmount * 100,   // paise
      currency:       'INR',
      mode:           method === 'upi' ? 'UPI' : 'NEFT',
      purpose:        'payout',
      queue_if_low_balance: false,
      reference_id:   `withdraw_${user._id}_${Date.now()}`,
      narration:      'HubDrive Wallet Withdrawal',
    })

    // Deduct from wallet only after payout created successfully
    user.wallet.balance -= withdrawAmount
    await user.save()

    res.status(200).json({
      message:   `₹${withdrawAmount} withdrawal initiated successfully!`,
      payoutId:  payout.id,
      status:    payout.status,
      wallet:    user.wallet,
      mode:      'razorpay',
      eta:       method === 'upi' ? 'Instant (UPI)' : '1-3 business days (NEFT)',
    })
  } catch (err) {
    console.error('[Payout Error]', err?.error || err?.message || err)
    res.status(500).json({
      message: err?.error?.description || 'Payout failed. Please try again or contact support.',
    })
  }
})

module.exports = { createOrder, verifyPayment, saveBankDetails, withdrawToBank }