import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react'
import { loginUser } from '../store/slices/authSlice'
import { validateLoginForm, hasErrors } from '../utils/validators'
import toast from 'react-hot-toast'

const Login = () => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const location  = useLocation()
  const from      = location.state?.from?.pathname || null

  const [form, setForm]       = useState({ email: '', password: '' })
  const [errors, setErrors]   = useState({})
  const [showPass, setShowPass]= useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = { email: form.email.trim(), password: form.password }
    const errs    = validateLoginForm(trimmed)
    if (hasErrors(errs)) { setErrors(errs); return }

    setLoading(true)
    try {
      const result = await dispatch(loginUser(trimmed)).unwrap()
      toast.success('Welcome back!')
      const redirect = from || (result.user.role === 'center_admin' ? '/vendor' : '/dashboard')
      navigate(redirect, { replace: true })
    } catch (err) {
      toast.error(err || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-slate border-r border-white/8 p-12">
        <Link to="/" className="font-display text-3xl text-brand-amber tracking-wider">
          HUB<span className="text-brand-cream">DRIVE</span>
        </Link>

        <div>
          {/* Animated grid */}
          <div className="relative w-full h-64 mb-12 overflow-hidden border border-white/8">
            <div className="absolute inset-0 bg-grid opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="font-display text-8xl text-brand-amber/10 select-none">HUB</span>
            </div>
            {/* Hub dots */}
            {[
              { x: '20%', y: '40%' }, { x: '50%', y: '65%' },
              { x: '75%', y: '35%' }, { x: '88%', y: '60%' },
            ].map((pos, i) => (
              <div key={i} className="absolute" style={{ left: pos.x, top: pos.y }}>
                <div className="w-3 h-3 bg-brand-amber rounded-full animate-pulse-ring" />
              </div>
            ))}
            {/* Lines */}
            <svg className="absolute inset-0 w-full h-full" style={{ opacity: 0.2 }}>
              <line x1="20%" y1="40%" x2="50%" y2="65%" stroke="#E8A020" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="50%" y1="65%" x2="75%" y2="35%" stroke="#E8A020" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="75%" y1="35%" x2="88%" y2="60%" stroke="#E8A020" strokeWidth="1" strokeDasharray="4 4" />
            </svg>
          </div>

          <blockquote className="font-display text-4xl text-brand-cream leading-tight mb-4">
            Every journey<br />
            starts at a <span className="text-brand-amber">hub.</span>
          </blockquote>
          <p className="font-body text-brand-muted text-sm leading-relaxed">
            Sign in to access your dashboard, manage bookings, and track your fleet in real time.
          </p>
        </div>

        <p className="font-mono text-xs text-brand-muted tracking-wider">
          © 2024 HubDrive — Decentralized Rentals
        </p>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="lg:hidden font-display text-2xl text-brand-amber tracking-wider block mb-8">
            HUB<span className="text-brand-cream">DRIVE</span>
          </Link>

          <span className="section-eyebrow">Welcome back</span>
          <h1 className="font-display text-5xl text-brand-cream mb-2">Sign In</h1>
          <p className="text-brand-muted text-sm mb-8">
            New here?{' '}
            <Link to="/register" className="text-brand-amber hover:underline">Create an account</Link>
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email" name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'border-brand-red/50 focus:border-brand-red' : ''}`}
                autoComplete="email"
              />
              {errors.email && (
                <p className="flex items-center gap-1 mt-1.5 font-mono text-xs text-brand-red">
                  <AlertCircle size={11} />{errors.email}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <label className="input-label">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  className={`input-field pr-12 ${errors.password ? 'border-brand-red/50' : ''}`}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-amber transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="flex items-center gap-1 mt-1.5 font-mono text-xs text-brand-red">
                  <AlertCircle size={11} />{errors.password}
                </p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-3 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
              ) : (
                <>Sign In <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/8" />
            <span className="font-mono text-xs text-brand-muted">OR</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* Demo accounts */}
          <div className="space-y-2">
            <p className="font-mono text-xs text-brand-muted tracking-wider text-center mb-3">
              Demo Accounts
            </p>
            {[
              { label: 'Customer', email: 'customer@demo.com', password: 'demo123' },
              { label: 'Vendor',   email: 'vendor@demo.com',   password: 'demo123' },
            ].map(({ label, email, password }) => (
              <button
                key={label}
                type="button"
                onClick={() => setForm({ email, password })}
                className="w-full btn-outline text-left flex items-center justify-between"
              >
                <span>{label} Demo</span>
                <span className="text-brand-muted text-xs">{email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login