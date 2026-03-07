import { useState } from 'react'
import { MapPin, ArrowRight, Search, CheckCircle } from 'lucide-react'
import { HUBS } from '../../utils/formatters'

/**
 * HubSelector
 * Props:
 *  - value        { name, lat, lng } | null
 *  - onChange     (hub) => void
 *  - label        string
 *  - exclude      string   hub name to exclude (prevents same start/end)
 *  - error        string | null
 *  - variant      'pickup' | 'dropoff'
 */
const HubSelector = ({ value, onChange, label = 'Hub', exclude = '', error = null, variant = 'pickup' }) => {
  const [open,   setOpen]   = useState(false)
  const [search, setSearch] = useState('')

  const filtered = HUBS.filter(h =>
    h.name !== exclude &&
    (h.name.toLowerCase().includes(search.toLowerCase()) ||
     h.city.toLowerCase().includes(search.toLowerCase()))
  )

  const dotColor = variant === 'pickup' ? 'bg-brand-amber' : 'bg-brand-red'
  const borderActive = variant === 'pickup' ? 'border-brand-amber/50' : 'border-brand-red/50'

  return (
    <div className="relative">
      <label className="input-label flex items-center gap-1.5">
        <MapPin size={11} />
        {label}
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`
          w-full input-field text-left flex items-center gap-3
          ${open ? borderActive : ''}
          ${error ? 'border-brand-red/50' : ''}
        `}
      >
        <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${value ? dotColor : 'bg-brand-muted/30'}`} />
        <span className={value ? 'text-brand-cream' : 'text-brand-muted'}>
          {value?.name || `Select ${label.toLowerCase()}…`}
        </span>
        {value && (
          <CheckCircle size={14} className={variant === 'pickup' ? 'text-brand-amber ml-auto' : 'text-brand-red ml-auto'} />
        )}
      </button>

      {/* Error */}
      {error && (
        <p className="font-mono text-xs text-brand-red mt-1.5">{error}</p>
      )}

      {/* Dropdown */}
      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />

          <div className="absolute top-full left-0 right-0 mt-1 z-20 bg-brand-slate border border-white/15
                          shadow-2xl shadow-black/60 overflow-hidden max-h-72 flex flex-col">
            {/* Search */}
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-white/8">
              <Search size={13} className="text-brand-muted flex-shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search hubs…"
                className="flex-1 bg-transparent text-sm text-brand-cream placeholder:text-brand-muted focus:outline-none font-body"
              />
            </div>

            {/* Options */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 ? (
                <p className="text-center py-6 font-mono text-xs text-brand-muted">No hubs match</p>
              ) : (
                filtered.map(hub => {
                  const isSelected = value?.name === hub.name
                  return (
                    <button
                      key={hub.name}
                      type="button"
                      onClick={() => { onChange(hub); setOpen(false); setSearch('') }}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 text-left
                        hover:bg-brand-mid/60 transition-colors
                        ${isSelected ? 'bg-brand-mid/40' : ''}
                      `}
                    >
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                      <div className="min-w-0">
                        <p className="text-sm text-brand-cream truncate">{hub.name}</p>
                        <p className="font-mono text-xs text-brand-muted">{hub.city}</p>
                      </div>
                      {isSelected && <CheckCircle size={14} className={`ml-auto flex-shrink-0 ${variant === 'pickup' ? 'text-brand-amber' : 'text-brand-red'}`} />}
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

// ── Route display (pair of selectors) ────────────────────────────────────────
export const HubRoutePicker = ({ startHub, endHub, onStartChange, onEndChange, errors = {} }) => (
  <div className="space-y-3">
    <HubSelector
      label="Pickup Hub"
      value={startHub}
      onChange={onStartChange}
      exclude={endHub?.name}
      error={errors.startHub}
      variant="pickup"
    />

    {/* Visual connector */}
    <div className="flex items-center gap-3 py-1 pl-1">
      <div className="flex flex-col items-center gap-1 ml-0.5">
        <div className="w-px h-3 bg-brand-amber/40" />
        <ArrowRight size={14} className="text-brand-amber" />
        <div className="w-px h-3 bg-brand-red/40" />
      </div>
      {startHub && endHub && (
        <span className="font-mono text-xs text-brand-muted">
          Route selected ✓
        </span>
      )}
    </div>

    <HubSelector
      label="Drop-off Hub"
      value={endHub}
      onChange={onEndChange}
      exclude={startHub?.name}
      error={errors.endHub}
      variant="dropoff"
    />
  </div>
)

export default HubSelector