import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { Eye, EyeOff, ArrowRight, AlertCircle, Car, User } from 'lucide-react'
import { registerUser } from '../store/slices/authSlice'
import { validateRegisterForm, hasErrors } from '../utils/validators'
import toast from 'react-hot-toast'

const Register = () => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()

  const [form, setForm]       = useState({
    name: '', email: '', phone: '', password: '', role: 'customer',
  })
  const [errors, setErrors]   = useState({})
  const [showPass, setShowPass]= useState(false)
  const [loading, setLoading] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(f => ({ ...f, [name]: value }))
    if (errors[name]) setErrors(er => ({ ...er, [name]: null }))
  }

  const setRole = (role) => {
    setForm(f => ({ ...f, role }))
    if (errors.role) setErrors(er => ({ ...er, role: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const trimmed = {
      name:     form.name.trim(),
      email:    form.email.trim().toLowerCase(),
      phone:    form.phone.trim(),
      password: form.password,
      role:     form.role,
    }
    const errs = validateRegisterForm(trimmed)
    if (hasErrors(errs)) { setErrors(errs); return }

    setLoading(true)
    try {
      const result = await dispatch(registerUser(trimmed)).unwrap()
      toast.success('Account created! Welcome to HubDrive.')
      navigate(result.user.role === 'center_admin' ? '/vendor' : '/dashboard', { replace: true })
    } catch (err) {
      toast.error(err || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-black flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex flex-col justify-between w-5/12 bg-brand-slate border-r border-white/8 p-12">
        <Link to="/" className="font-display text-3xl text-brand-amber tracking-wider">
          HUB<span className="text-brand-cream">DRIVE</span>
        </Link>

        <div>
          <span className="section-eyebrow">Join the network</span>
          <h2 className="font-display text-5xl text-brand-cream leading-none mb-6">
            Move vehicles.<br/>
            Move <span className="text-brand-amber">forward.</span>
          </h2>

          {/* Feature list */}
          {[
            { icon: '🗺️', text: 'Hub-to-Hub rentals across India' },
            { icon: '📋', text: 'OCR-powered instant KYC verification' },
            { icon: '📍', text: 'Live GPS tracking via Socket.io' },
            { icon: '💬', text: 'Real-time vendor–customer chat' },
            { icon: '💳', text: 'Secure wallet & deposits' },
          ].map(({ icon, text }) => (
            <div key={text} className="flex items-center gap-3 mb-3">
              <span className="text-lg">{icon}</span>
              <span className="text-brand-muted text-sm">{text}</span>
            </div>
          ))}
        </div>

        <p className="font-mono text-xs text-brand-muted tracking-wider">
          © 2024 HubDrive — Decentralized Rentals
        </p>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          <Link to="/" className="lg:hidden font-display text-2xl text-brand-amber tracking-wider block mb-8">
            HUB<span className="text-brand-cream">DRIVE</span>
          </Link>

          <span className="section-eyebrow">Get started</span>
          <h1 className="font-display text-5xl text-brand-cream mb-2">Create Account</h1>
          <p className="text-brand-muted text-sm mb-8">
            Already have one?{' '}
            <Link to="/login" className="text-brand-amber hover:underline">Sign in</Link>
          </p>

          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Role selector */}
            <div>
              <label className="input-label">I want to</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'customer',     icon: User, label: 'Rent Vehicles',  sub: 'Customer' },
                  { value: 'center_admin', icon: Car,  label: 'List My Fleet',  sub: 'Vendor'   },
                ].map(({ value, icon: Icon, label, sub }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRole(value)}
                    className={`
                      flex items-center gap-3 p-4 border text-left transition-all duration-200
                      ${form.role === value
                        ? 'border-brand-amber bg-brand-amber/8 text-brand-cream'
                        : 'border-white/10 bg-brand-mid/40 text-brand-muted hover:border-white/25'}
                    `}
                  >
                    <Icon size={20} className={form.role === value ? 'text-brand-amber' : ''} />
                    <div>
                      <div className="text-sm font-medium">{label}</div>
                      <div className="font-mono text-xs opacity-60">{sub}</div>
                    </div>
                  </button>
                ))}
              </div>
              {errors.role && (
                <p className="flex items-center gap-1 mt-1.5 font-mono text-xs text-brand-red">
                  <AlertCircle size={11} />{errors.role}
                </p>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="input-label">Full Name</label>
              <input
                type="text" name="name"
                value={form.name} onChange={handleChange}
                placeholder="Arjun Sharma"
                className={`input-field ${errors.name ? 'border-brand-red/50' : ''}`}
                autoComplete="name"
              />
              {errors.name && (
                <p className="flex items-center gap-1 mt-1.5 font-mono text-xs text-brand-red">
                  <AlertCircle size={11} />{errors.name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="input-label">Email Address</label>
              <input
                type="email" name="email"
                value={form.email} onChange={handleChange}
                placeholder="you@example.com"
                className={`input-field ${errors.email ? 'border-brand-red/50' : ''}`}
                autoComplete="email"
              />
              {errors.email && (
                <p className="flex items-center gap-1 mt-1.5 font-mono text-xs text-brand-red">
                  <AlertCircle size={11} />{errors.email}
                </p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="input-label">Mobile Number</label>
              <div className="flex">
                <span className="input-field w-16 flex-shrink-0 flex items-center justify-center text-brand-muted border-r-0 font-mono text-xs">
                  +91
                </span>
                <input
                  type="tel" name="phone"
                  value={form.phone} onChange={handleChange}
                  placeholder="9876543210"
                  maxLength={10}
                  className={`input-field flex-1 ${errors.phone ? 'border-brand-red/50' : ''}`}
                  autoComplete="tel"
                />
              </div>
              {errors.phone && (
                <p className="flex items-center gap-1 mt-1.5 font-mono text-xs text-brand-red">
                  <AlertCircle size={11} />{errors.phone}
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
                  value={form.password} onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  className={`input-field pr-12 ${errors.password ? 'border-brand-red/50' : ''}`}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(s => !s)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-amber transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Strength indicator */}
              {form.password && (
                <div className="flex gap-1 mt-2">
                  {[1,2,3,4].map(i => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 transition-colors ${
                        form.password.length >= i * 3
                          ? i <= 2 ? 'bg-brand-red' : i === 3 ? 'bg-brand-amber' : 'bg-green-500'
                          : 'bg-white/10'
                      }`}
                    />
                  ))}
                </div>
              )}
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
                <>Create Account <ArrowRight size={16} /></>
              )}
            </button>

            <p className="font-mono text-xs text-brand-muted text-center leading-relaxed">
              By registering, you agree to our Terms of Service and Privacy Policy.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

export default Register