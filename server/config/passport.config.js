const passport      = require('passport')
const GoogleStrategy= require('passport-google-oauth20').Strategy
const User          = require('../models/User.model')

// ── Google OAuth Strategy ─────────────────────────────────────────────────────
// Setup in Google Cloud Console:
// 1. console.cloud.google.com → APIs & Services → Credentials
// 2. Create OAuth 2.0 Client ID (Web Application)
// 3. Add Authorized redirect URI: http://localhost:5000/api/auth/google/callback
// 4. Copy Client ID and Secret to .env

const setupPassport = () => {
  passport.use(
    new GoogleStrategy(
      {
        clientID:     process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL:  process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
        scope:        ['profile', 'email'],
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          const email     = profile.emails?.[0]?.value?.toLowerCase()
          const googleId  = profile.id
          const name      = profile.displayName

          if (!email) return done(new Error('No email from Google'), null)

          // Check if user already exists (by googleId or email)
          let user = await User.findOne({ $or: [{ googleId }, { email }] })

          if (user) {
            // Existing user — link Google if not already linked
            if (!user.googleId) {
              user.googleId     = googleId
              user.authProvider = 'google'
              user.isEmailVerified = true
              await user.save({ validateBeforeSave: false })
            }
          } else {
            // New user via Google — create account
            user = await User.create({
              name,
              email,
              googleId,
              authProvider:    'google',
              isEmailVerified: true,
              role:            'customer',   // Google login always creates customer
              // Phone will be asked separately after OAuth
              phone:           `google_${googleId}`,   // placeholder until verified
              wallet:          { balance: 0, locked: 0 },
            })
          }

          user.lastLogin = new Date()
          await user.save({ validateBeforeSave: false })

          return done(null, user)
        } catch (err) {
          return done(err, null)
        }
      }
    )
  )

  // Not using sessions — JWT based, so minimal serialize/deserialize
  passport.serializeUser((user, done) => done(null, user._id))
  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id)
      done(null, user)
    } catch (err) {
      done(err, null)
    }
  })
}

module.exports = { setupPassport }