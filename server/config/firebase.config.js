const admin = require('firebase-admin')

// ── Initialize Firebase Admin SDK ─────────────────────────────────────────────
// Download your service account JSON from:
// Firebase Console → Project Settings → Service Accounts → Generate new private key
// Save it as server/config/firebase-service-account.json
// NEVER commit this file to git — add it to .gitignore

let firebaseApp

const initFirebase = () => {
  if (firebaseApp) return firebaseApp

  try {
    const serviceAccount = require('./firebase-service-account.json')

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    })

    console.log('[Firebase] Admin SDK initialized')
  } catch (err) {
    console.warn('[Firebase] Service account not found — OTP features disabled')
    console.warn('[Firebase] Add firebase-service-account.json to server/config/')
  }

  return firebaseApp
}

// ── Verify a Firebase ID token sent from client ───────────────────────────────
// Client sends this after user completes phone OTP via Firebase SDK
const verifyFirebaseToken = async (idToken) => {
  if (!admin.apps.length) throw new Error('Firebase not initialized')
  const decoded = await admin.auth().verifyIdToken(idToken)
  return decoded   // { uid, phone_number, email, ... }
}

module.exports = { initFirebase, verifyFirebaseToken }