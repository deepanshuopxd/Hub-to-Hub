const router   = require('express').Router()
const passport = require('passport')
const { protect } = require('../middleware/auth.middleware')
const {
  register, login, googleCallback,
  getMe, updateProfile, changePassword, topUpWallet,
} = require('../controllers/auth.controller')
const { verifyPhone, linkPhone, registerWithPhone } = require('../controllers/otp.controller')

// ── Standard auth ─────────────────────────────────────────────────────────────
router.post  ('/register',              register)
router.post  ('/login',                 login)
router.get   ('/me',                    protect, getMe)
router.put   ('/profile',               protect, updateProfile)
router.post  ('/change-password',       protect, changePassword)
router.patch ('/wallet',                protect, topUpWallet)

// ── Google OAuth ──────────────────────────────────────────────────────────────
// Step 1: redirect user to Google
router.get('/google',
  passport.authenticate('google', { scope: ['profile', 'email'] })
)
// Step 2: Google redirects back here with auth code
router.get('/google/callback',
  passport.authenticate('google', { failureRedirect: '/login?error=oauth_failed', session: false }),
  googleCallback
)

// ── Firebase Phone OTP ────────────────────────────────────────────────────────
// OTP is handled entirely on the frontend via Firebase SDK
// Backend just verifies the resulting Firebase ID token
router.post('/verify-phone',          verifyPhone)           // login with phone
router.post('/link-phone',            protect, linkPhone)    // add phone to existing account
router.post('/register-with-phone',   registerWithPhone)     // register with phone OTP

module.exports = router