// const jwt  = require('jsonwebtoken')
// const User = require('../models/User.model')

// // ── Verify JWT ────────────────────────────────────────────────────────────────
// const protect = async (req, res, next) => {
//   try {
//     const header = req.headers.authorization
//     if (!header || !header.startsWith('Bearer ')) {
//       return res.status(401).json({ message: 'Not authorised — no token provided' })
//     }

//     const token = header.split(' ')[1]
//     let decoded
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET)
//     } catch (err) {
//       const msg = err.name === 'TokenExpiredError'
//         ? 'Session expired — please log in again'
//         : 'Invalid token'
//       return res.status(401).json({ message: msg })
//     }

//     const user = await User.findById(decoded.id).select('-password')
//     if (!user)          return res.status(401).json({ message: 'User no longer exists' })
//     if (!user.isActive) return res.status(403).json({ message: 'Account has been deactivated' })

//     req.user = user
//     next()
//   } catch (err) {
//     next(err)
//   }
// }

// // ── Role guard ────────────────────────────────────────────────────────────────
// const requireRole = (...roles) => (req, res, next) => {
//   if (!roles.includes(req.user?.role)) {
//     return res.status(403).json({
//       message: `Access denied — required role: ${roles.join(' or ')}`,
//     })
//   }
//   next()
// }

// // ── KYC guard — blocks booking unless customer is verified ───────────────────
// // This is part of the USP trust layer: only verified drivers can rent
// const requireKYC = (req, res, next) => {
//   if (req.user?.role === 'center_admin') return next()   // vendors skip KYC
//   if (req.user?.kyc?.status !== 'verified') {
//     return res.status(403).json({
//       message: 'KYC verification required before booking',
//       kycStatus: req.user?.kyc?.status || 'pending',
//     })
//   }
//   next()
// }

// module.exports = { protect, requireRole, requireKYC }




const jwt  = require('jsonwebtoken')
const User = require('../models/User.model')

const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorised — no token' })
    }

    const token = header.split(' ')[1]
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      return res.status(401).json({
        message: err.name === 'TokenExpiredError'
          ? 'Session expired — please log in again'
          : 'Invalid token',
      })
    }

    const user = await User.findById(decoded.id).select('-password')
    if (!user)          return res.status(401).json({ message: 'User not found' })
    if (!user.isActive) return res.status(403).json({ message: 'Account deactivated' })

    req.user = user
    next()
  } catch (err) {
    next(err)
  }
}

module.exports = { protect }