require('dotenv').config()
const express    = require('express')
const http       = require('http')
const path       = require('path')
const { Server } = require('socket.io')
const cors       = require('cors')
const helmet     = require('helmet')
const morgan     = require('morgan')
const rateLimit  = require('express-rate-limit')

const connectDB      = require('./config/db')
const { setupPassport } = require('./config/passport.config')
const { initFirebase }  = require('./config/firebase.config')
const passport          = require('passport')
const authRoutes     = require('./routes/auth.routes')
const vehicleRoutes  = require('./routes/vehicle.routes')
const bookingRoutes  = require('./routes/booking.routes')
const kycRoutes      = require('./routes/kyc.routes')
const chatRoutes     = require('./routes/chat.routes')
const paymentRoutes  = require('./routes/payment.routes')
const vendorRoutes   = require('./routes/vendor.routes')

connectDB()
setupPassport()
initFirebase()

const app    = express()
const server = http.createServer(app)

// ── Socket.io ─────────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin:      '*',
    methods:     ['GET', 'POST'],
    credentials: false,
  },
  pingTimeout: 60000,
})
app.set('io', io)

const jwt  = require('jsonwebtoken')
const User = require('./models/User.model')

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Auth required'))
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user    = await User.findById(decoded.id).select('-password')
    if (!user || !user.isActive) return next(new Error('User not found'))
    socket.user = user
    next()
  } catch {
    next(new Error('Invalid token'))
  }
})

io.on('connection', (socket) => {
  const user = socket.user
  console.log(`[Socket] ${user.name} (${user.role}) connected`)

  // Every user gets a personal room for notifications
  socket.join(`user_${user._id}`)

  // Vendors get a vendor room for booking requests
  if (user.role === 'center_admin') {
    socket.join(`vendor_${user._id}`)

    // Also join all active booking chat rooms where this vendor is a party
    // So endVendor receives messages even before explicitly joining
    const Booking = require('./models/Booking.model')
    Booking.find({
      $or: [{ startVendor: user._id }, { endVendor: user._id }],
      status: { $in: ['pending', 'active', 'in_transit'] },
    }).select('chatRoomId').lean().then(bookings => {
      bookings.forEach(b => {
        if (b.chatRoomId) socket.join(b.chatRoomId)
      })
    }).catch(() => {})
  }

  require('./sockets/chat.socket')(io, socket)
  require('./sockets/tracking.socket')(io, socket)
  socket.on('disconnect', () => console.log(`[Socket] ${user.name} disconnected`))
})

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// ── Security Middleware ───────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(cors({ origin: '*', credentials: false }))
app.use(passport.initialize())
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'))

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (_, res) => res.json({
  status: 'OK', platform: 'HubDrive', tagline: 'Pick up here. Drop off anywhere.',
}))

// ── API Routes ────────────────────────────────────────────────────────────────
app.use('/api/auth',     authRoutes)
app.use('/api/vehicles', vehicleRoutes)
app.use('/api/bookings', bookingRoutes)
app.use('/api/kyc',      kycRoutes)
app.use('/api/chat',     chatRoutes)
app.use('/api/payment',  paymentRoutes)
app.use('/api/vendors',  vendorRoutes)

// ── 404 ───────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }))

// ── Global Error Handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  let status  = err.statusCode || res.statusCode || 500
  let message = err.message    || 'Internal server error'
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'field'
    message = `${field} already exists`; status = 409
  }
  if (err.name === 'ValidationError') {
    message = Object.values(err.errors).map(e => e.message).join('. '); status = 400
  }
  if (err.name === 'CastError')         { message = `Invalid ID: ${err.value}`; status = 400 }
  if (err.name === 'JsonWebTokenError') { message = 'Invalid token';            status = 401 }
  if (err.name === 'TokenExpiredError') { message = 'Token expired';            status = 401 }
  if (err.code === 'LIMIT_FILE_SIZE')   { message = 'File too large — max 5MB'; status = 400 }
  if (process.env.NODE_ENV === 'development') console.error(`[ERR] ${status} — ${message}`)
  res.status(status).json({ success: false, message })
})

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║   HubDrive API — Port ${PORT}               ║
  ║   USP: Pick up here. Drop off anywhere.  ║
  ╚══════════════════════════════════════════╝`)
})

module.exports = { app, server, io }