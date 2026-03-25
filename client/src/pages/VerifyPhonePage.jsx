import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Phone, ArrowRight, CheckCircle } from 'lucide-react'
import { linkPhone, fetchProfile, selectUser, selectAuthLoading } from '../store/slices/authSlice'
import { sendPhoneOTP, confirmPhoneOTP } from '../services/firebase'
import toast from 'react-hot-toast'

const VerifyPhonePage = () => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const [params]  = useSearchParams()
  const user      = useSelector(selectUser)
  const loading   = useSelector(selectAuthLoading)

  const [phone,        setPhone]        = useState('')
  const [otp,          setOtp]          = useState('')
  const [otpSent,      setOtpSent]      = useState(false)
  const [confirmation, setConfirmation] = useState(null)
  const [otpLoading,   setOtpLoading]   = useState(false)
  const [verified,     setVerified]     = useState(false)

  // If user already has verified phone, skip
  useEffect(() => {
    if (user?.isPhoneVerified && !user?.phone?.startsWith('google_')) {
      navigate(user.role === 'center_admin' ? '/vendor' : '/dashboard', { replace: true })
    }
  }, [user, navigate])

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

  const handleVerify = async (e) => {
    e.preventDefault()
    if (otp.length !== 6) return toast.error('Enter the 6-digit OTP')
    setOtpLoading(true)
    try {
      const firebaseToken = await confirmPhoneOTP(confirmation, otp)
      const res = await dispatch(linkPhone(firebaseToken))
      if (res.meta.requestStatus === 'fulfilled') {
        await dispatch(fetchProfile())
        setVerified(true)
        toast.success('Phone verified!')
        setTimeout(() => {
          navigate(user?.role === 'center_admin' ? '/vendor' : '/dashboard', { replace: true })
        }, 1500)
      }
    } catch (err) {
      toast.error(err.message || 'Invalid OTP')
    } finally {
      setOtpLoading(false)
    }
  }

  if (verified) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
        <div className="text-center animate-[fadeUp_0.4s_ease_forwards]">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h1 className="font-display text-3xl text-brand-cream">Phone Verified!</h1>
          <p className="font-mono text-sm text-brand-muted mt-2">Redirecting to dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center p-4">
      <div id="recaptcha-container" />
      <div className="w-full max-w-md animate-[fadeUp_0.4s_ease_forwards]">
        <div className="text-center mb-8">
          <span className="font-display text-4xl text-brand-amber tracking-wider">
            HUB<span className="text-brand-cream">DRIVE</span>
          </span>
          <p className="font-mono text-xs text-brand-muted mt-2">Verify your phone number</p>
        </div>

        <div className="card p-8 border border-white/10">
          <h1 className="font-display text-3xl text-brand-cream mb-2">Add Phone Number</h1>
          <p className="font-mono text-xs text-brand-muted mb-6">
            Welcome, <span className="text-brand-amber">{user?.name}</span>! 
            Please verify your phone number to complete your account setup.
          </p>

          <div className="space-y-4">
            <div>
              <label className="input-label">Mobile Number</label>
              <div className="flex gap-2">
                <div className="flex items-center px-3 bg-brand-mid border border-white/10 font-mono text-sm text-brand-muted">
                  +91
                </div>
                <div className="relative flex-1">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="9876543210"
                    maxLength={10}
                    disabled={otpSent}
                    className="input-field pl-9"
                  />
                </div>
              </div>
            </div>

            {!otpSent ? (
              <button
                onClick={handleSendOTP}
                disabled={otpLoading || phone.length !== 10}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {otpLoading
                  ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                  : 'Send OTP'
                }
              </button>
            ) : (
              <form onSubmit={handleVerify} className="space-y-4">
                <div>
                  <label className="input-label">Enter OTP</label>
                  <input
                    type="tel"
                    value={otp}
                    onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="6-digit OTP"
                    maxLength={6}
                    autoFocus
                    className="input-field text-center tracking-[0.5em] text-xl font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => { setOtpSent(false); setOtp('') }}
                    className="font-mono text-xs text-brand-muted hover:text-brand-amber mt-1 transition-colors"
                  >
                    ← Change number
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={otpLoading || otp.length !== 6}
                  className="btn-primary w-full flex items-center justify-center gap-2 py-3"
                >
                  {otpLoading
                    ? <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
                    : <><ArrowRight size={16} /> Verify & Continue</>
                  }
                </button>
              </form>
            )}

            <button
              onClick={() => navigate(user?.role === 'center_admin' ? '/vendor' : '/dashboard')}
              className="w-full font-mono text-xs text-brand-muted hover:text-brand-cream transition-colors py-2"
            >
              Skip for now →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default VerifyPhonePage