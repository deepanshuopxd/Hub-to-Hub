import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Mail, Lock, Phone, ArrowRight, Chrome } from 'lucide-react'
import {
  loginUser, loginWithPhone, handleGoogleCallback,
  clearError, selectAuthLoading, selectAuthError,
} from '../store/slices/authSlice'
import { sendPhoneOTP, confirmPhoneOTP } from '../services/firebase'
import toast from 'react-hot-toast'

const TABS = ['email', 'phone']

const Login = () => {
  const dispatch     = useDispatch()
  const navigate     = useNavigate()
  const [params]     = useSearchParams()
  const loading      = useSelector(selectAuthLoading)
  const error        = useSelector(selectAuthError)

  const [tab,         setTab]         = useState('email')
  const [email,       setEmail]       = useState('')
  const [password,    setPassword]    = useState('')
  const [phone,       setPhone]       = useState('')
  const [otp,         setOtp]         = useState('')
  const [otpSent,     setOtpSent]     = useState(false)
  const [confirmation,setConfirmation]= useState(null)
  const [otpLoading,  setOtpLoading]  = useState(false)

  // ── Handle Google OAuth redirect ──────────────────────────────────────────
  useEffect(() => {
    const token = params.get('token')
    const err   = params.get('error')
    if (err) {
      toast.error('Google login failed. Please try again.')
      return
    }
    if (token) {
      dispatch(handleGoogleCallback(token)).then((res) => {
        if (res.meta.requestStatus === 'fulfilled') {
          const user = res.payload.user
          navigate(user.role === 'center_admin' ? '/vendor' : '/dashboard', { replace: true })
        }
      })
    }
  }, [params, dispatch, navigate])

  useEffect(() => {
    dispatch(clearError())
  }, [tab, dispatch])

  // ── Email login ───────────────────────────────────────────────────────────
  const handleEmailLogin = async (e) => {
    e.preventDefault()
    const res = await dispatch(loginUser({ email, password }))
    if (res.meta.requestStatus === 'fulfilled') {
      const user = res.payload.user
      navigate(user.role === 'center_admin' ? '/vendor' : '/dashboard', { replace: true })
    }
  }

  // ── Send phone OTP ────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (phone.length !== 10) return toast.error('Enter a valid 10-digit phone number')
    setOtpLoading(true)
    try {
      const result = await sendPhoneOTP(phone)
      setConfirmation(result)
      setOtpSent(true)
      toast.success('OTP sent to +91' + phone)
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Verify OTP + login ────────────────────────────────────────────────────
  const handleVerifyOTP = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP')
    setOtpLoading(true)
    try {
      const firebaseToken = await confirmPhoneOTP(confirmation, otp)
      const res = await dispatch(loginWithPhone({ firebaseToken, phone }))
      if (res.meta.requestStatus === 'fulfilled') {
        const user = res.payload.user
        navigate(user.role === 'center_admin' ? '/vendor' : '/dashboard', { replace: true })
      }
    } catch (err) {
      toast.error(err.message || 'Invalid OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Google login redirect ─────────────────────────────────────────────────
  const handleGoogleLogin = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
                    `http://${window.location.hostname}:5000`
    window.location.href = `${apiBase}/api/auth/google`
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      {/* Invisible reCAPTCHA container for Firebase */}
      <div id="recaptcha-container" />

      <div className="w-full max-w-md animate-[fadeUp_0.4s_ease_forwards]">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/">
            <span className="font-display text-4xl text-brand-amber tracking-wider">
              HUB<span className="text-brand-cream">DRIVE</span>
            </span>
          </Link>
          <p className="font-mono text-xs text-brand-muted mt-2 tracking-widest uppercase">
            Pick up here. Drop off anywhere.
          </p>
        </div>

        <div className="card p-8 border border-white/10">
          <h1 className="font-display text-3xl text-brand-cream mb-6">Sign In</h1>

          {/* Tab switcher */}
          <div className="flex mb-6 bg-brand-mid/40 p-1">
            {TABS.map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setOtpSent(false) }}
                className={`flex-1 py-2 font-mono text-xs tracking-widest uppercase transition-colors
                  ${tab === t
                    ? 'bg-brand-amber text-brand-black'
                    : 'text-brand-muted hover:text-brand-cream'
                  }`}
              >
                {t === 'email' ? '📧 Email' : '📱 Phone OTP'}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-brand-red/10 border border-brand-red/20 font-mono text-xs text-brand-red">
              {error}
            </div>
          )}

          {/* ── Email/Password tab ─────────────────────────────────────────── */}
          {tab === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="input-label">Email</label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="email" value={email} onChange={e => setEmail(e.target.value)}
                    placeholder="you@email.com" required
                    className="input-field pl-9"
                  />
                </div>
              </div>
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••" required
                    className="input-field pl-9"
                  />
                </div>
              </div>
              <button type="submit" disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {loading
                  ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                  : <><ArrowRight size={16} /> Sign In</>
                }
              </button>
            </form>
          )}

          {/* ── Phone OTP tab ──────────────────────────────────────────────── */}
          {tab === 'phone' && (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <label className="input-label">Mobile Number</label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 bg-brand-mid border border-white/10 font-mono text-sm text-brand-muted">
                    +91
                  </div>
                  <div className="relative flex-1">
                    <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input
                      type="tel" value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="9876543210" maxLength={10}
                      className="input-field pl-9"
                      disabled={otpSent}
                    />
                  </div>
                </div>
              </div>

              {!otpSent ? (
                <button type="button" onClick={handleSendOTP}
                  disabled={otpLoading || phone.length !== 10}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                  {otpLoading
                    ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                    : 'Send OTP'
                  }
                </button>
              ) : (
                <>
                  <div>
                    <label className="input-label">Enter OTP</label>
                    <input
                      type="tel" value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="6-digit OTP" maxLength={6}
                      className="input-field text-center tracking-[0.5em] text-xl font-mono"
                      autoFocus
                    />
                    <button type="button" onClick={() => { setOtpSent(false); setOtp('') }}
                      className="font-mono text-xs text-brand-muted hover:text-brand-amber mt-1 transition-colors">
                      ← Change number
                    </button>
                  </div>
                  <button type="submit" disabled={otpLoading || otp.length !== 6}
                    className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                    {otpLoading
                      ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                      : <><ArrowRight size={16} /> Verify & Sign In</>
                    }
                  </button>
                </>
              )}
            </form>
          )}

          {/* ── Divider ────────────────────────────────────────────────────── */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-mono text-xs text-brand-muted">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* ── Google button ──────────────────────────────────────────────── */}
          <button onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 border border-white/10
                       bg-white/5 hover:bg-white/10 transition-colors font-mono text-sm text-brand-cream">
            <svg width="18" height="18" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          {/* Footer */}
          <p className="text-center font-mono text-xs text-brand-muted mt-6">
            No account?{' '}
            <Link to="/register" className="text-brand-amber hover:underline">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login