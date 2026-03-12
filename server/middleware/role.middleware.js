const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({
      message:  `Access denied — required: ${roles.join(' or ')}`,
      yourRole: req.user.role,
    })
  }
  next()
}

// Blocks booking if customer KYC is not verified
// Vendors skip this — they are the supply side
const requireKYC = (req, res, next) => {
  if (!req.user) return res.status(401).json({ message: 'Not authenticated' })
  if (req.user.role === 'center_admin') return next()
  if (req.user.kyc?.status !== 'verified') {
    return res.status(403).json({
      message:   'KYC verification required before booking',
      kycStatus: req.user.kyc?.status || 'pending',
    })
  }
  next()
}

const vendorOnly   = requireRole('center_admin')
const customerOnly = requireRole('customer')

module.exports = { requireRole, requireKYC, vendorOnly, customerOnly }