import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { User, Mail, Lock, Phone, Building, MapPin, ArrowRight } from 'lucide-react'
import {
  registerUser, registerWithPhone,
  clearError, selectAuthLoading, selectAuthError,
} from '../store/slices/authSlice'
import { sendPhoneOTP, confirmPhoneOTP } from '../services/firebase'
import toast from 'react-hot-toast'

const Register = () => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const loading   = useSelector(selectAuthLoading)
  const error     = useSelector(selectAuthError)

  const [role,         setRole]         = useState('customer')
  const [authMethod,   setAuthMethod]   = useState('email')  // 'email' | 'phone'
  const [step,         setStep]         = useState(1)        // 1=form, 2=otp

  // Form fields
  const [name,     setName]     = useState('')
  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [phone,    setPhone]    = useState('')

  // Vendor fields
  const [serviceName,    setServiceName]    = useState('')
  const [serviceCity,    setServiceCity]    = useState('')
  const [serviceAddress, setServiceAddress] = useState('')

  // OTP state
  const [otp,          setOtp]          = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [otpLoading,   setOtpLoading]   = useState(false)

  useEffect(() => { dispatch(clearError()) }, [role, authMethod, dispatch])

  // ── Email registration ────────────────────────────────────────────────────
  const handleEmailRegister = async (e) => {
    e.preventDefault()
    const payload = {
      name, email, phone, password, role,
      ...(role === 'center_admin' && {
        rentalService: { name: serviceName, city: serviceCity, address: serviceAddress },
      }),
    }
    const res = await dispatch(registerUser(payload))
    if (res.meta.requestStatus === 'fulfilled') {
      toast.success('Account created!')
      navigate(role === 'center_admin' ? '/vendor' : '/dashboard', { replace: true })
    }
  }

  // ── Send OTP ──────────────────────────────────────────────────────────────
  const handleSendOTP = async () => {
    if (!name.trim())     return toast.error('Enter your name')
    if (!email.trim())    return toast.error('Enter your email')
    if (phone.length !== 10) return toast.error('Enter a valid 10-digit phone number')
    if (role === 'center_admin' && (!serviceName || !serviceCity)) {
      return toast.error('Enter your rental service name and city')
    }

    setOtpLoading(true)
    try {
      const result = await sendPhoneOTP(phone)
      setConfirmation(result)
      setStep(2)
      toast.success('OTP sent to +91' + phone)
    } catch (err) {
      toast.error(err.message || 'Failed to send OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  // ── Verify OTP + register ─────────────────────────────────────────────────
  const handleVerifyAndRegister = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP')
    setOtpLoading(true)
    try {
      const firebaseToken = await confirmPhoneOTP(confirmation, otp)
      const payload = {
        name, email, password, role, firebaseToken,
        ...(role === 'center_admin' && {
          rentalService: { name: serviceName, city: serviceCity, address: serviceAddress },
        }),
      }
      const res = await dispatch(registerWithPhone(payload))
      if (res.meta.requestStatus === 'fulfilled') {
        toast.success('Account created with verified phone!')
        navigate(role === 'center_admin' ? '/vendor' : '/dashboard', { replace: true })
      }
    } catch (err) {
      toast.error(err.message || 'OTP verification failed')
    } finally {
      setOtpLoading(false)
    }
  }

  const handleGoogleRegister = () => {
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') ||
                    `http://${window.location.hostname}:5000`
    window.location.href = `${apiBase}/api/auth/google`
  }

  // ── OTP step ──────────────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
        <div id="recaptcha-container" />
        <div className="w-full max-w-md animate-[fadeUp_0.4s_ease_forwards]">
          <div className="text-center mb-8">
            <span className="font-display text-4xl text-brand-amber">HUB<span className="text-brand-cream">DRIVE</span></span>
          </div>
          <div className="card p-8 border border-white/10">
            <h1 className="font-display text-3xl text-brand-cream mb-2">Verify Phone</h1>
            <p className="font-mono text-xs text-brand-muted mb-6">
              OTP sent to <span className="text-brand-amber">+91{phone}</span>
            </p>

            {error && (
              <div className="mb-4 p-3 bg-brand-red/10 border border-brand-red/20 font-mono text-xs text-brand-red">{error}</div>
            )}

            <form onSubmit={handleVerifyAndRegister} className="space-y-4">
              <input
                type="tel" value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g,'').slice(0,6))}
                placeholder="6-digit OTP" maxLength={6} autoFocus
                className="input-field text-center tracking-[0.5em] text-2xl font-mono"
              />
              <button type="submit" disabled={otpLoading || otp.length !== 6}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3">
                {otpLoading
                  ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                  : <><ArrowRight size={16} /> Create Account</>
                }
              </button>
              <button type="button" onClick={() => { setStep(1); setOtp('') }}
                className="w-full font-mono text-xs text-brand-muted hover:text-brand-amber transition-colors">
                ← Go back
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  // ── Main form ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div id="recaptcha-container" />
      <div className="w-full max-w-lg animate-[fadeUp_0.4s_ease_forwards]">
        <div className="text-center mb-8">
          <Link to="/">
            <span className="font-display text-4xl text-brand-amber tracking-wider">
              HUB<span className="text-brand-cream">DRIVE</span>
            </span>
          </Link>
          <p className="font-mono text-xs text-brand-muted mt-2 tracking-widest uppercase">
            Create your account
          </p>
        </div>

        <div className="card p-8 border border-white/10">
          {/* Role toggle */}
          <div className="flex mb-6 bg-brand-mid/40 p-1">
            {[['customer','🧑 Customer'], ['center_admin','🏪 Vendor']].map(([r, label]) => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 py-2 font-mono text-xs tracking-widest uppercase transition-colors
                  ${role === r ? 'bg-brand-amber text-brand-black' : 'text-brand-muted hover:text-brand-cream'}`}>
                {label}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 p-3 bg-brand-red/10 border border-brand-red/20 font-mono text-xs text-brand-red">{error}</div>
          )}

          {/* Auth method toggle */}
          <div className="flex gap-2 mb-5">
            {[['email','Email'], ['phone','Phone OTP']].map(([m, label]) => (
              <button key={m} onClick={() => setAuthMethod(m)}
                className={`px-3 py-1.5 font-mono text-xs border transition-colors
                  ${authMethod === m
                    ? 'border-brand-amber text-brand-amber bg-brand-amber/10'
                    : 'border-white/10 text-brand-muted hover:border-white/30'
                  }`}>
                {label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {/* Common fields */}
            <div>
              <label className="input-label">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Your full name" className="input-field pl-9" />
              </div>
            </div>

            <div>
              <label className="input-label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@email.com" className="input-field pl-9" />
              </div>
            </div>

            <div>
              <label className="input-label">Mobile Number</label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-brand-mid border border-white/10 font-mono text-sm text-brand-muted">+91</div>
                <div className="relative flex-1">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="tel" value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g,'').slice(0,10))}
                    placeholder="9876543210" maxLength={10} className="input-field pl-9" />
                </div>
              </div>
            </div>

            {authMethod === 'email' && (
              <div>
                <label className="input-label">Password</label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="Min 6 characters" className="input-field pl-9" />
                </div>
              </div>
            )}

            {/* Vendor rental service fields */}
            {role === 'center_admin' && (
              <div className="space-y-3 pt-2 border-t border-white/8">
                <p className="font-mono text-xs text-brand-amber tracking-widest uppercase">Rental Service Details</p>
                <div>
                  <label className="input-label">Business Name</label>
                  <div className="relative">
                    <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                    <input value={serviceName} onChange={e => setServiceName(e.target.value)}
                      placeholder="e.g. Varanasi Rides" className="input-field pl-9" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="input-label">City</label>
                    <div className="relative">
                      <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                      <input value={serviceCity} onChange={e => setServiceCity(e.target.value)}
                        placeholder="Varanasi" className="input-field pl-9" />
                    </div>
                  </div>
                  <div>
                    <label className="input-label">Address <span className="text-brand-muted">(optional)</span></label>
                    <input value={serviceAddress} onChange={e => setServiceAddress(e.target.value)}
                      placeholder="Hub address" className="input-field" />
                  </div>
                </div>
              </div>
            )}

            {/* Submit */}
            {authMethod === 'email' ? (
              <button
                onClick={handleEmailRegister}
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              >
                {loading
                  ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                  : <><ArrowRight size={16} /> Create Account</>
                }
              </button>
            ) : (
              <button
                onClick={handleSendOTP}
                disabled={otpLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3 mt-2"
              >
                {otpLoading
                  ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                  : 'Send OTP to Verify Phone'
                }
              </button>
            )}
          </div>

          {/* Divider + Google */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-white/10" />
            <span className="font-mono text-xs text-brand-muted">OR</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          <button onClick={handleGoogleRegister}
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

          <p className="text-center font-mono text-xs text-brand-muted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-amber hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register