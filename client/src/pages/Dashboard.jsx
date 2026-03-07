import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Car, BookOpen, ShieldCheck, Map, ArrowRight, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { fetchMyBookings, selectMyBookings, selectBookingLoading } from '../store/slices/bookingSlice'
import { useAuth } from '../hooks/useAuth'
import { formatINR, formatDate, statusClass, statusLabel, kycLabel } from '../utils/formatters'
import Loader from '../components/ui/Loader'

const StatCard = ({ icon: Icon, label, value, sub, color = 'amber' }) => {
  const colors = {
    amber: 'text-brand-amber border-brand-amber/20 bg-brand-amber/5',
    red:   'text-brand-red   border-brand-red/20   bg-brand-red/5',
    green: 'text-green-400   border-green-400/20   bg-green-400/5',
    blue:  'text-blue-400    border-blue-400/20    bg-blue-400/5',
  }
  return (
    <div className={`card p-5 border ${colors[color]}`}>
      <div className="flex items-start justify-between mb-3">
        <Icon size={20} />
        {sub && <span className={`font-mono text-xs tracking-wider ${colors[color].split(' ')[0]}`}>{sub}</span>}
      </div>
      <div className={`font-display text-4xl mb-1 ${colors[color].split(' ')[0]}`}>{value}</div>
      <div className="font-mono text-xs tracking-widest uppercase text-brand-muted">{label}</div>
    </div>
  )
}

const Dashboard = () => {
  const dispatch   = useDispatch()
  const { user, kycStatus } = useAuth()
  const bookings   = useSelector(selectMyBookings)
  const loading    = useSelector(selectBookingLoading)

  useEffect(() => { dispatch(fetchMyBookings()) }, [dispatch])

  const active    = bookings.filter(b => b.status === 'active' || b.status === 'in_transit')
  const completed = bookings.filter(b => b.status === 'completed')
  const totalSpent= completed.reduce((sum, b) => sum + b.totalPrice, 0)
  const recent    = [...bookings].sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).slice(0, 5)

  return (
    <div className="space-y-8 animate-[fadeUp_0.5s_ease_forwards]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="section-eyebrow">Customer Dashboard</span>
          <h1 className="font-display text-5xl text-brand-cream">
            Hello, <span className="text-brand-amber">{user?.name?.split(' ')[0]}</span>
          </h1>
          <p className="text-brand-muted text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Link to="/vehicles" className="btn-primary flex items-center gap-2">
          Browse Cars <ArrowRight size={16} />
        </Link>
      </div>

      {/* KYC Banner */}
      {kycStatus !== 'verified' && (
        <div className="border border-brand-amber/30 bg-brand-amber/5 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-brand-amber flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-brand-cream">
                KYC Status: <span className="text-brand-amber">{kycLabel(kycStatus)}</span>
              </p>
              <p className="font-mono text-xs text-brand-muted mt-0.5">
                Complete KYC verification to unlock vehicle bookings
              </p>
            </div>
          </div>
          <Link to="/kyc" className="btn-outline py-2 px-4 text-xs flex-shrink-0">
            Verify Now <ArrowRight size={12} className="inline ml-1" />
          </Link>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={BookOpen}   label="Total Bookings" value={bookings.length}  color="amber" />
        <StatCard icon={Car}        label="Active Rides"   value={active.length}    color="green" />
        <StatCard icon={CheckCircle}label="Completed"      value={completed.length} color="blue"  />
        <StatCard icon={TrendingUp} label="Total Spent"    value={formatINR(totalSpent)} color="red" />
      </div>

      {/* Wallet */}
      {user?.wallet && (
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 border border-brand-amber/15">
            <p className="font-mono text-xs tracking-widest uppercase text-brand-muted mb-2">Available Balance</p>
            <p className="font-display text-4xl text-brand-amber">{formatINR(user.wallet.balance)}</p>
          </div>
          <div className="card p-5 border border-white/8">
            <p className="font-mono text-xs tracking-widest uppercase text-brand-muted mb-2">Locked (Deposits)</p>
            <p className="font-display text-4xl text-brand-cream">{formatINR(user.wallet.locked)}</p>
          </div>
        </div>
      )}

      {/* Recent Bookings */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-2xl text-brand-cream">Recent Bookings</h2>
          <Link to="/bookings" className="btn-ghost text-xs flex items-center gap-1">
            View All <ArrowRight size={12} />
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader label="Loading bookings..." /></div>
        ) : recent.length === 0 ? (
          <div className="card p-12 text-center border border-white/8">
            <Car size={40} className="text-brand-muted mx-auto mb-4" />
            <p className="text-brand-muted text-sm">No bookings yet.</p>
            <Link to="/vehicles" className="btn-primary inline-flex items-center gap-2 mt-4">
              Browse Vehicles <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {recent.map(booking => (
              <div key={booking._id} className="card p-4 border border-white/8 flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-brand-mid flex items-center justify-center flex-shrink-0">
                    <Car size={18} className="text-brand-amber" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-brand-cream">
                      {booking.vehicle?.make} {booking.vehicle?.model}
                    </p>
                    <p className="font-mono text-xs text-brand-muted mt-0.5">
                      {booking.startHub?.name} → {booking.endHub?.name}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <span className={statusClass(booking.status)}>{statusLabel(booking.status)}</span>
                  <p className="font-mono text-xs text-brand-muted mt-1">{formatDate(booking.startDate)}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-display text-xl text-brand-amber">{formatINR(booking.totalPrice)}</p>
                </div>
                {(booking.status === 'active' || booking.status === 'in_transit') && (
                  <Link to={`/tracking/${booking._id}`} className="btn-ghost flex items-center gap-1 text-xs py-2">
                    <Map size={14} /> Track
                  </Link>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { to: '/vehicles', icon: Car,        label: 'Browse Fleet',    sub: 'Find your ride'  },
          { to: '/kyc',      icon: ShieldCheck, label: 'KYC Verify',     sub: 'Unlock bookings' },
          { to: '/tracking', icon: Map,         label: 'Live Tracking',   sub: 'Follow your car' },
        ].map(({ to, icon: Icon, label, sub }) => (
          <Link key={to} to={to} className="card p-5 border border-white/8 hover:border-brand-amber/30 group transition-all">
            <Icon size={22} className="text-brand-amber mb-3" />
            <p className="font-medium text-sm text-brand-cream">{label}</p>
            <p className="font-mono text-xs text-brand-muted mt-0.5">{sub}</p>
            <ArrowRight size={14} className="text-brand-muted mt-3 group-hover:text-brand-amber group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Dashboard