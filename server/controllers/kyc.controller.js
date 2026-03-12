// const User = require('../models/User.model')
// const { asyncHandler, sendSuccess, sendError } = require('../utils/helpers')

// // ── POST /api/kyc/submit ──────────────────────────────────────────────────────
// // Customer submits DL + Aadhaar (already OCR'd client-side via Tesseract.js)
// const submitKYC = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id)

//   if (user.kyc.status === 'verified') {
//     return sendError(res, 400, 'KYC already verified')
//   }

//   // Files uploaded via Cloudinary multer
//   const dlFile      = req.files?.find(f => f.fieldname === 'dl')
//   const aadhaarFile = req.files?.find(f => f.fieldname === 'aadhaar')

//   if (!dlFile || !aadhaarFile) {
//     return sendError(res, 400, 'Both Driving License and Aadhaar Card are required')
//   }

//   // Update KYC fields
//   user.kyc.dlUrl         = dlFile.path          // Cloudinary URL
//   user.kyc.aadhaarUrl    = aadhaarFile.path
//   user.kyc.extractedName = req.body.extractedName?.trim() || null
//   user.kyc.extractedDOB  = req.body.extractedDOB?.trim()  || null
//   user.kyc.status        = 'submitted'
//   user.kyc.submittedAt   = new Date()
//   user.kyc.rejectedReason= null

//   await user.save()

//   // Notify admins (if admin room exists)
//   const io = req.app.get('io')
//   io?.to('admin_room').emit('kyc_submitted', {
//     userId:   user._id,
//     userName: user.name,
//     email:    user.email,
//   })

//   sendSuccess(res, 200, {
//     message: 'KYC documents submitted for review',
//     kyc:     user.kyc,
//   })
// })

// // ── GET /api/kyc/status ───────────────────────────────────────────────────────
// const getKYCStatus = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.user._id).select('kyc name')
//   sendSuccess(res, 200, { kyc: user.kyc })
// })

// // ── PATCH /api/kyc/:userId/verify ─────────────────────────────────────────────
// // Admin manually verifies KYC after reviewing documents
// const verifyKYC = asyncHandler(async (req, res) => {
//   const user = await User.findById(req.params.userId)
//   if (!user) return sendError(res, 404, 'User not found')

//   if (user.kyc.status !== 'submitted') {
//     return sendError(res, 400, 'No pending KYC submission found')
//   }

//   user.kyc.status     = 'verified'
//   user.kyc.verifiedAt = new Date()
//   await user.save()

//   // Notify user
//   const io = req.app.get('io')
//   io?.to(`user_${user._id}`).emit('kyc_verified', {
//     message: 'Your KYC has been verified! You can now book vehicles.',
//   })

//   sendSuccess(res, 200, {
//     message: `KYC verified for ${user.name}`,
//     kyc:     user.kyc,
//   })
// })

// // ── PATCH /api/kyc/:userId/reject ─────────────────────────────────────────────
// const rejectKYC = asyncHandler(async (req, res) => {
//   const { reason } = req.body
//   const user = await User.findById(req.params.userId)
//   if (!user) return sendError(res, 404, 'User not found')

//   user.kyc.status         = 'rejected'
//   user.kyc.rejectedReason = reason || 'Documents unclear or invalid'
//   await user.save()

//   const io = req.app.get('io')
//   io?.to(`user_${user._id}`).emit('kyc_rejected', {
//     message: `KYC rejected: ${user.kyc.rejectedReason}. Please resubmit.`,
//   })

//   sendSuccess(res, 200, { message: 'KYC rejected', kyc: user.kyc })
// })

// // ── GET /api/kyc/pending ──────────────────────────────────────────────────────
// // Admin: list all pending KYC submissions
// const getPendingKYC = asyncHandler(async (req, res) => {
//   const users = await User.find({ 'kyc.status': 'submitted' })
//     .select('name email phone kyc createdAt')
//     .sort({ 'kyc.submittedAt': 1 })

//   sendSuccess(res, 200, { count: users.length, users })
// })

// module.exports = { submitKYC, getKYCStatus, verifyKYC, rejectKYC, getPendingKYC }



const User                = require('../models/User.model')
const { sanitiseOCRFields, isAutoApprovable } = require('../utils/ocrExtract')

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next)

// POST /api/kyc/submit
const submitKYC = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
  if (user.kyc.status === 'verified') {
    return res.status(400).json({ message: 'KYC already verified' })
  }

  const dlFile      = req.files?.find(f => f.fieldname === 'dl')
  const aadhaarFile = req.files?.find(f => f.fieldname === 'aadhaar')

  if (!dlFile || !aadhaarFile) {
    return res.status(400).json({ message: 'Both Driving License and Aadhaar are required' })
  }

  // Sanitise OCR data from client (Tesseract.js)
  const ocrData = sanitiseOCRFields({
    extractedName:  req.body.extractedName,
    extractedDOB:   req.body.extractedDOB,
    dlNumber:       req.body.dlNumber,
    aadhaarNumber:  req.body.aadhaarNumber,
  })

  user.kyc.dlUrl         = dlFile.path          // Cloudinary URL
  user.kyc.aadhaarUrl    = aadhaarFile.path
  user.kyc.extractedName = ocrData.extractedName
  user.kyc.extractedDOB  = ocrData.extractedDOB
  user.kyc.dlNumber      = ocrData.dlNumber
  user.kyc.aadhaarNumber = ocrData.aadhaarNumber
  user.kyc.status        = 'submitted'
  user.kyc.submittedAt   = new Date()
  user.kyc.rejectedReason= null

  // Auto-approve if OCR quality is high enough
  if (isAutoApprovable(ocrData.validation)) {
    user.kyc.status    = 'verified'
    user.kyc.verifiedAt= new Date()
  }

  await user.save()

  // Notify admins if still needs manual review
  if (user.kyc.status === 'submitted') {
    const io = req.app.get('io')
    io?.to('admin_room').emit('kyc_submitted', { userId: user._id, name: user.name, email: user.email })
  }

  res.status(200).json({
    message:     user.kyc.status === 'verified' ? 'KYC auto-verified successfully!' : 'Documents submitted for review',
    kyc:         user.kyc,
    autoVerified:user.kyc.status === 'verified',
  })
})

// GET /api/kyc/status
const getKYCStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('kyc name')
  res.status(200).json({ kyc: user.kyc })
})

// PATCH /api/kyc/:userId/verify  (admin)
const verifyKYC = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })
  if (user.kyc.status !== 'submitted') {
    return res.status(400).json({ message: 'No pending KYC submission found' })
  }

  user.kyc.status    = 'verified'
  user.kyc.verifiedAt= new Date()
  await user.save()

  const io = req.app.get('io')
  io?.to(`user_${user._id}`).emit('kyc_verified', {
    message: '✅ KYC verified! You can now book vehicles.',
  })

  res.status(200).json({ message: `KYC verified for ${user.name}`, kyc: user.kyc })
})

// PATCH /api/kyc/:userId/reject  (admin)
const rejectKYC = asyncHandler(async (req, res) => {
  const { reason } = req.body
  const user = await User.findById(req.params.userId)
  if (!user) return res.status(404).json({ message: 'User not found' })

  user.kyc.status         = 'rejected'
  user.kyc.rejectedReason = reason || 'Documents unclear — please resubmit'
  await user.save()

  const io = req.app.get('io')
  io?.to(`user_${user._id}`).emit('kyc_rejected', {
    message: `KYC rejected: ${user.kyc.rejectedReason}`,
  })

  res.status(200).json({ message: 'KYC rejected', kyc: user.kyc })
})

// GET /api/kyc/pending  (admin)
const getPendingKYC = asyncHandler(async (req, res) => {
  const users = await User.find({ 'kyc.status': 'submitted' })
    .select('name email phone kyc createdAt')
    .sort({ 'kyc.submittedAt': 1 })

  res.status(200).json({ count: users.length, users })
})

module.exports = { submitKYC, getKYCStatus, verifyKYC, rejectKYC, getPendingKYC }
