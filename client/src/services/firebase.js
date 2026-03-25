import { initializeApp } from 'firebase/app'
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'

// ── Firebase config ───────────────────────────────────────────────────────────
// Get these from Firebase Console → Project Settings → Your Apps → Web App
// Add to client/.env:
//   VITE_FIREBASE_API_KEY=...
//   VITE_FIREBASE_AUTH_DOMAIN=...
//   VITE_FIREBASE_PROJECT_ID=...
//   VITE_FIREBASE_APP_ID=...

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
}

const app  = initializeApp(firebaseConfig)
const auth = getAuth(app)

// ── Send OTP to phone ─────────────────────────────────────────────────────────
// elementId = DOM id of the invisible recaptcha container
// phone     = E.164 format e.g. +919876543210
export const sendPhoneOTP = async (phone, elementId = 'recaptcha-container') => {
  // Setup invisible reCAPTCHA (required by Firebase)
  const verifier = new RecaptchaVerifier(auth, elementId, {
    size: 'invisible',
    callback: () => {},
  })

  const e164Phone = phone.startsWith('+') ? phone : `+91${phone}`
  const result    = await signInWithPhoneNumber(auth, e164Phone, verifier)
  return result   // confirmationResult — call .confirm(otp) with user's OTP
}

// ── Confirm OTP + get ID token ────────────────────────────────────────────────
// confirmationResult = returned from sendPhoneOTP
// otp = 6-digit code entered by user
export const confirmPhoneOTP = async (confirmationResult, otp) => {
  const credential  = await confirmationResult.confirm(otp)
  const idToken     = await credential.user.getIdToken()
  return idToken    // send this to backend /api/auth/verify-phone
}

export { auth }
export default app