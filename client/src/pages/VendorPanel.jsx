import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Car, BookOpen, TrendingUp, Users, ArrowRight, CheckCircle, Clock, Plus } from 'lucide-react'
import { fetchVendorVehicles, selectVendorFleet } from '../store/slices/vehicleSlice'
import { fetchVendorBookings, selectVendorBookings, updateBookingStatus } from '../store/slices/bookingSlice'
import { useAuth } from '../hooks/useAuth'
import { formatINR, formatDate, statusClass, statusLabel } from '../utils/formatters'
import toast from 'react-hot-toast'

const VendorPanel = () => {
  const dispatch  = useDispatch()
  const { user }  = useAuth()
  const fleet     = useSelector(selectVendorFleet)
  const bookings  = useSelector(selectVendorBookings)

  useEffect(() => {
    dispatch(fetchVendorVehicles())
    dispatch(fetchVendorBookings())
  }, [dispatch])

  // ── Revenue by month ──────────────────────────────────────────────────────
  const monthlyRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((acc, b) => {
      const month = new Date(b.createdAt).toLocaleString('en-IN', { month: 'short' })
      acc[month] = (acc[month] || 0) + b.totalPrice
      return acc
    }, {})

  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const chartData = months.map(m => ({ month: m, revenue: monthlyRevenue[m] || 0 }))
  const maxRevenue= Math.max(...chartData.map(d => d.revenue), 1)

  const totalRevenue = bookings
    .filter(b => b.status === 'completed')
    .reduce((sum, b) => sum + b.totalPrice, 0)

  const pending   = bookings.filter(b => b.status === 'pending')
  const active    = bookings.filter(b => b.status === 'active' || b.status === 'in_transit')
  const available = fleet.filter(v => v.isAvailable).length

  const handleStatusUpdate = async (id, status) => {
    try {
      await dispatch(updateBookingStatus({ id, status })).unwrap()
      toast.success(`Booking ${status}`)
    } catch (err) {
      toast.error(err || 'Failed to update')
    }
  }

  return (
    <div className="space-y-8 animate-[fadeUp_0.5s_ease_forwards]">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <span className="section-eyebrow">Vendor Dashboard</span>
          <h1 className="font-display text-5xl text-brand-cream">
            Fleet <span className="text-brand-amber">Overview</span>
          </h1>
          <p className="text-brand-muted text-sm mt-1">Welcome back, {user?.name}</p>
        </div>
        <Link to="/vendor/fleet" className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Add Vehicle
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: 'Total Revenue',    value: formatINR(totalRevenue), color: 'text-brand-amber', border: 'border-brand-amber/20', bg: 'bg-brand-amber/5' },
          { icon: Car,        label: 'Fleet Size',       value: fleet.length,            color: 'text-blue-400',    border: 'border-blue-400/20',    bg: 'bg-blue-400/5'    },
          { icon: BookOpen,   label: 'Active Bookings',  value: active.length,           color: 'text-green-400',   border: 'border-green-400/20',   bg: 'bg-green-400/5'   },
          { icon: Clock,      label: 'Pending Requests', value: pending.length,          color: 'text-brand-red',   border: 'border-brand-red/20',   bg: 'bg-brand-red/5'   },
        ].map(({ icon: Icon, label, value, color, border, bg }) => (
          <div key={label} className={`card p-5 border ${border} ${bg}`}>
            <Icon size={20} className={`${color} mb-3`} />
            <div className={`font-display text-4xl mb-1 ${color}`}>{value}</div>
            <div className="font-mono text-xs tracking-widest uppercase text-brand-muted">{label}</div>
          </div>
        ))}
      </div>

      {/* Revenue Chart */}
      <div className="card p-6 border border-white/8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-2xl text-brand-cream">Monthly Revenue</h2>
          <span className="font-display text-3xl text-brand-amber">{formatINR(totalRevenue)}</span>
        </div>
        <div className="flex items-end gap-2 h-40">
          {chartData.map(({ month, revenue }) => (
            <div key={month} className="flex-1 flex flex-col items-center gap-1">
              <div
                className="w-full bg-brand-amber/80 hover:bg-brand-amber transition-colors cursor-default min-h-[2px]"
                style={{ height: `${(revenue / maxRevenue) * 100}%` }}
                title={`${month}: ${formatINR(revenue)}`}
              />
              <span className="font-mono text-[9px] text-brand-muted">{month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Pending Requests */}
        <div className="card p-6 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-brand-cream">Pending Requests</h2>
            <span className="badge-pending">{pending.length}</span>
          </div>
          {pending.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle size={32} className="text-brand-muted mx-auto mb-2" />
              <p className="text-brand-muted text-sm">All caught up!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pending.slice(0, 5).map(booking => (
                <div key={booking._id} className="p-3 bg-brand-mid/40 border border-white/6">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-brand-cream">
                        {booking.vehicle?.make} {booking.vehicle?.model}
                      </p>
                      <p className="font-mono text-xs text-brand-muted mt-0.5">
                        {booking.user?.name} · {formatDate(booking.startDate)}
                      </p>
                      <p className="font-mono text-xs text-brand-muted">
                        {booking.startHub?.name} → {booking.endHub?.name}
                      </p>
                    </div>
                    <p className="font-display text-xl text-brand-amber">{formatINR(booking.totalPrice)}</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleStatusUpdate(booking._id, 'active')}
                      className="btn-primary py-1.5 px-3 text-xs flex-1"
                    >
                      Accept
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(booking._id, 'cancelled')}
                      className="btn-danger py-1.5 px-3 text-xs flex-1"
                    >
                      Decline
                    </button>
                  </div>
                </div>
              ))}
              {pending.length > 5 && (
                <Link to="/vendor/bookings" className="btn-ghost w-full text-center text-xs">
                  +{pending.length - 5} more
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Fleet status */}
        <div className="card p-6 border border-white/8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-2xl text-brand-cream">Fleet Status</h2>
            <Link to="/vendor/fleet" className="btn-ghost text-xs flex items-center gap-1">
              Manage <ArrowRight size={12} />
            </Link>
          </div>
          {fleet.length === 0 ? (
            <div className="text-center py-8">
              <Car size={32} className="text-brand-muted mx-auto mb-2" />
              <p className="text-brand-muted text-sm mb-4">No vehicles listed yet.</p>
              <Link to="/vendor/fleet" className="btn-primary inline-flex items-center gap-2">
                <Plus size={14} /> Add First Vehicle
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {fleet.slice(0, 6).map(vehicle => (
                <div key={vehicle._id} className="flex items-center justify-between p-3 bg-brand-mid/40 border border-white/6">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${vehicle.isAvailable ? 'bg-green-400' : 'bg-brand-red'}`} />
                    <div>
                      <p className="text-sm font-medium text-brand-cream">
                        {vehicle.make} {vehicle.model} <span className="text-brand-muted">({vehicle.year})</span>
                      </p>
                      <p className="font-mono text-xs text-brand-muted">{vehicle.plateNumber} · {vehicle.currentHub?.name}</p>
                    </div>
                  </div>
                  <p className="font-display text-xl text-brand-amber">{formatINR(vehicle.pricePerDay)}<span className="font-mono text-xs text-brand-muted">/day</span></p>
                </div>
              ))}
              {fleet.length > 6 && (
                <Link to="/vendor/fleet" className="btn-ghost w-full text-center text-xs">
                  +{fleet.length - 6} more vehicles
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VendorPanel