import { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react'
import { format, addMonths, subMonths, startOfMonth, endOfMonth,
         eachDayOfInterval, isSameMonth, isSameDay, isAfter,
         isBefore, isToday, addDays } from 'date-fns'
import { calculateDays, formatINR } from '../../utils/formatters'

/**
 * DateRangePicker
 * Props:
 *  - startDate    string | null  ISO date string
 *  - endDate      string | null
 *  - onStartChange (dateStr) => void
 *  - onEndChange   (dateStr) => void
 *  - pricePerDay  number   used for inline cost display
 *  - errors       { startDate, endDate }
 */
const DateRangePicker = ({
  startDate, endDate,
  onStartChange, onEndChange,
  pricePerDay = 0,
  errors = {},
}) => {
  const today      = new Date()
  const [viewing,  setViewing]  = useState(startOfMonth(today))
  const [picking,  setPicking]  = useState('start')    // 'start' | 'end'
  const [hovered,  setHovered]  = useState(null)
  const [open,     setOpen]     = useState(false)

  const startD = startDate ? new Date(startDate) : null
  const endD   = endDate   ? new Date(endDate)   : null

  const days = eachDayOfInterval({
    start: startOfMonth(viewing),
    end:   endOfMonth(viewing),
  })

  // Leading blank cells
  const firstDow = startOfMonth(viewing).getDay()   // 0=Sun
  const blanks   = Array(firstDow).fill(null)

  const handleDayClick = (day) => {
    const ds = format(day, 'yyyy-MM-dd')
    if (picking === 'start' || (startD && isBefore(day, startD))) {
      onStartChange(ds)
      onEndChange('')
      setPicking('end')
    } else {
      onEndChange(ds)
      setPicking('start')
      setOpen(false)
    }
  }

  const isDayDisabled  = (day) => isBefore(day, today) && !isToday(day)
  const isDayStart     = (day) => startD && isSameDay(day, startD)
  const isDayEnd       = (day) => endD   && isSameDay(day, endD)
  const isDayInRange   = (day) => {
    const ref = hovered || endD
    if (!startD || !ref) return false
    return isAfter(day, startD) && isBefore(day, ref)
  }
  const isDayHoverEnd  = (day) => hovered && startD && isSameDay(day, hovered) && !endD

  const days_count  = startD && endD ? calculateDays(startD, endD) : 0
  const total_price = days_count * pricePerDay

  return (
    <div className="space-y-3">
      {/* Inputs row */}
      <div className="grid grid-cols-2 gap-3">
        {/* Start date button */}
        <div>
          <label className="input-label flex items-center gap-1.5">
            <Calendar size={11} /> Start Date
          </label>
          <button
            type="button"
            onClick={() => { setPicking('start'); setOpen(true) }}
            className={`input-field w-full text-left flex items-center gap-2
              ${open && picking === 'start' ? 'border-brand-amber/50' : ''}
              ${errors.startDate ? 'border-brand-red/50' : ''}
            `}
          >
            <Calendar size={14} className="text-brand-muted flex-shrink-0" />
            <span className={startDate ? 'text-brand-cream' : 'text-brand-muted'}>
              {startDate ? format(new Date(startDate), 'dd MMM yyyy') : 'Pick date'}
            </span>
          </button>
          {errors.startDate && (
            <p className="flex items-center gap-1 mt-1 font-mono text-xs text-brand-red">
              <AlertCircle size={10} />{errors.startDate}
            </p>
          )}
        </div>

        {/* End date button */}
        <div>
          <label className="input-label flex items-center gap-1.5">
            <Calendar size={11} /> End Date
          </label>
          <button
            type="button"
            onClick={() => { setPicking('end'); setOpen(true) }}
            disabled={!startDate}
            className={`input-field w-full text-left flex items-center gap-2
              disabled:opacity-40 disabled:cursor-not-allowed
              ${open && picking === 'end' ? 'border-brand-amber/50' : ''}
              ${errors.endDate ? 'border-brand-red/50' : ''}
            `}
          >
            <Calendar size={14} className="text-brand-muted flex-shrink-0" />
            <span className={endDate ? 'text-brand-cream' : 'text-brand-muted'}>
              {endDate ? format(new Date(endDate), 'dd MMM yyyy') : 'Pick date'}
            </span>
          </button>
          {errors.endDate && (
            <p className="flex items-center gap-1 mt-1 font-mono text-xs text-brand-red">
              <AlertCircle size={10} />{errors.endDate}
            </p>
          )}
        </div>
      </div>

      {/* Duration badge */}
      {days_count > 0 && (
        <div className="flex items-center gap-3 px-3 py-2 bg-brand-amber/8 border border-brand-amber/20">
          <span className="font-mono text-xs text-brand-amber">
            {days_count} day{days_count !== 1 ? 's' : ''} selected
          </span>
          {pricePerDay > 0 && (
            <span className="font-mono text-xs text-brand-muted ml-auto">
              {formatINR(pricePerDay)} × {days_count} = <span className="text-brand-amber">{formatINR(total_price)}</span>
            </span>
          )}
        </div>
      )}

      {/* Calendar dropdown */}
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="relative z-20 bg-brand-slate border border-white/15 p-4 shadow-2xl shadow-black/60">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-4">
              <button type="button" onClick={() => setViewing(subMonths(viewing, 1))}
                className="p-1.5 text-brand-muted hover:text-brand-amber transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="font-mono text-xs tracking-widest uppercase text-brand-cream">
                {format(viewing, 'MMMM yyyy')}
              </span>
              <button type="button" onClick={() => setViewing(addMonths(viewing, 1))}
                className="p-1.5 text-brand-muted hover:text-brand-amber transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>

            {/* Day labels */}
            <div className="grid grid-cols-7 mb-2">
              {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
                <div key={d} className="text-center font-mono text-[10px] text-brand-muted py-1">{d}</div>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-px">
              {blanks.map((_, i) => <div key={`b${i}`} />)}
              {days.map(day => {
                const disabled  = isDayDisabled(day)
                const isStart   = isDayStart(day)
                const isEnd     = isDayEnd(day)
                const inRange   = isDayInRange(day)
                const hoverEnd  = isDayHoverEnd(day)
                const todayDay  = isToday(day)

                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    disabled={disabled}
                    onClick={() => handleDayClick(day)}
                    onMouseEnter={() => !endD && startD && setHovered(day)}
                    onMouseLeave={() => setHovered(null)}
                    className={`
                      h-8 text-xs font-mono transition-all
                      disabled:text-brand-muted/30 disabled:cursor-not-allowed
                      ${isStart || isEnd
                        ? 'bg-brand-amber text-brand-black font-bold'
                        : inRange || hoverEnd
                          ? 'bg-brand-amber/20 text-brand-cream'
                          : todayDay
                            ? 'text-brand-amber border border-brand-amber/30'
                            : 'text-brand-muted hover:text-brand-cream hover:bg-brand-mid/60'
                      }
                    `}
                  >
                    {format(day, 'd')}
                  </button>
                )
              })}
            </div>

            {/* Instruction */}
            <p className="font-mono text-[10px] text-brand-muted text-center mt-3">
              {picking === 'start' ? 'Select start date' : 'Select end date'}
            </p>
          </div>
        </>
      )}
    </div>
  )
}

export default DateRangePicker