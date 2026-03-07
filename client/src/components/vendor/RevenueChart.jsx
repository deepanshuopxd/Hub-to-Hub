import { useState, useRef, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { formatINR } from '../../utils/formatters'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

/**
 * RevenueChart
 * Props:
 *  - bookings  Booking[]   all vendor bookings (completed ones counted)
 *  - className string
 */
const RevenueChart = ({ bookings = [], className = '' }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null)
  const [animated,   setAnimated]   = useState(false)
  const chartRef = useRef(null)

  // Animate bars into view once
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { setAnimated(true); observer.disconnect() }
    }, { threshold: 0.3 })
    if (chartRef.current) observer.observe(chartRef.current)
    return () => observer.disconnect()
  }, [])

  // Build monthly data
  const monthlyData = MONTHS.map((month, idx) => {
    const monthBookings = bookings.filter(b => {
      if (b.status !== 'completed') return false
      const d = new Date(b.createdAt || b.startDate)
      return d.getMonth() === idx
    })
    return {
      month,
      revenue:  monthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0),
      count:    monthBookings.length,
    }
  })

  const maxRevenue   = Math.max(...monthlyData.map(d => d.revenue), 1)
  const totalRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0)
  const currentMonth = new Date().getMonth()
  const thisMonth    = monthlyData[currentMonth]
  const lastMonth    = monthlyData[currentMonth > 0 ? currentMonth - 1 : 11]

  const trend = thisMonth.revenue > lastMonth.revenue ? 'up'
              : thisMonth.revenue < lastMonth.revenue ? 'down'
              : 'flat'

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const trendColor = trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-brand-red' : 'text-brand-muted'

  return (
    <div className={`card p-6 border border-white/8 ${className}`} ref={chartRef}>
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="font-mono text-xs tracking-widest uppercase text-brand-muted mb-1">
            Monthly Revenue
          </h3>
          <p className="font-display text-4xl text-brand-amber">{formatINR(totalRevenue)}</p>
          <p className="font-mono text-xs text-brand-muted mt-1">Year to date</p>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-1 justify-end ${trendColor}`}>
            <TrendIcon size={14} />
            <span className="font-mono text-xs">
              {trend === 'up' ? '+' : trend === 'down' ? '' : ''}
              {thisMonth.revenue > 0 && lastMonth.revenue > 0
                ? `${Math.round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100)}%`
                : trend === 'flat' ? '0%' : '—'
              }
            </span>
          </div>
          <p className="font-mono text-xs text-brand-muted mt-0.5">vs last month</p>
        </div>
      </div>

      {/* Bar chart */}
      <div className="flex items-end gap-1.5 h-36 mb-2">
        {monthlyData.map(({ month, revenue, count }, idx) => {
          const pct         = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0
          const isCurrent   = idx === currentMonth
          const isHovered   = hoveredIdx === idx
          const barHeight   = animated ? `${Math.max(pct, revenue > 0 ? 2 : 0)}%` : '0%'

          return (
            <div
              key={month}
              className="flex-1 flex flex-col items-center gap-0.5 relative group"
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Tooltip */}
              {isHovered && revenue > 0 && (
                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-10 whitespace-nowrap
                                bg-brand-slate border border-brand-amber/30 px-3 py-2 pointer-events-none">
                  <p className="font-mono text-xs text-brand-amber">{formatINR(revenue)}</p>
                  <p className="font-mono text-[10px] text-brand-muted">{count} booking{count !== 1 ? 's' : ''}</p>
                </div>
              )}

              {/* Bar */}
              <div className="w-full flex flex-col justify-end" style={{ height: '100%' }}>
                <div
                  className={`w-full transition-all duration-700 ${
                    isCurrent
                      ? 'bg-brand-amber'
                      : isHovered
                        ? 'bg-brand-amber/70'
                        : 'bg-brand-amber/40'
                  }`}
                  style={{
                    height:           barHeight,
                    transitionDelay:  `${idx * 40}ms`,
                    minHeight:        revenue > 0 ? '2px' : '0',
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1.5">
        {monthlyData.map(({ month }, idx) => (
          <div key={month} className="flex-1 text-center">
            <span className={`font-mono text-[9px] ${
              idx === currentMonth ? 'text-brand-amber' : 'text-brand-muted'
            }`}>
              {month}
            </span>
          </div>
        ))}
      </div>

      {/* Best month callout */}
      {totalRevenue > 0 && (() => {
        const best = monthlyData.reduce((a, b) => a.revenue > b.revenue ? a : b)
        return (
          <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
            <div>
              <p className="font-mono text-xs text-brand-muted">Best month</p>
              <p className="font-mono text-xs text-brand-amber mt-0.5">{best.month} — {formatINR(best.revenue)}</p>
            </div>
            <div className="text-right">
              <p className="font-mono text-xs text-brand-muted">Avg / month</p>
              <p className="font-mono text-xs text-brand-amber mt-0.5">
                {formatINR(Math.round(totalRevenue / MONTHS.length))}
              </p>
            </div>
          </div>
        )
      })()}
    </div>
  )
}

export default RevenueChart