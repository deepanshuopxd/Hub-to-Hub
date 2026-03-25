import { useState, useRef } from 'react'
import { AlertTriangle, Camera, Upload, X, CheckCircle, IndianRupee } from 'lucide-react'
import api from '../../services/api'
import { formatINR } from '../../utils/formatters'
import toast from 'react-hot-toast'

const DamageReport = ({ booking, onReported }) => {
  const [open,        setOpen]        = useState(false)
  const [description, setDescription] = useState('')
  const [amount,      setAmount]      = useState('')
  const [files,       setFiles]       = useState([])
  const [submitting,  setSubmitting]  = useState(false)
  const fileRef = useRef()

  const maxDeduct = booking.depositAmount || 0
  const existing  = booking.damageReport

  // Already reported — show summary
  if (existing) {
    return (
      <div className={"p-4 border space-y-2 " +
        (existing.resolved
          ? 'bg-green-500/5 border-green-500/20'
          : 'bg-brand-red/5 border-brand-red/20')}>
        <div className="flex items-center gap-2">
          {existing.resolved
            ? <CheckCircle size={16} className="text-green-400" />
            : <AlertTriangle size={16} className="text-brand-red" />
          }
          <p className="font-mono text-xs tracking-widest uppercase text-brand-cream">
            {existing.resolved ? 'Damage Report — Resolved' : 'Damage Report — Pending'}
          </p>
        </div>
        <p className="text-sm text-brand-cream">{existing.description}</p>
        <div className="flex gap-4 font-mono text-xs text-brand-muted">
          <span>Deducted: <span className="text-brand-red">{formatINR(existing.damageAmount)}</span></span>
          <span>Refunded: <span className="text-green-400">{formatINR(existing.refundAmount)}</span></span>
        </div>
        {!existing.resolved && (
          <button
            onClick={async () => {
              try {
                await api.patch(`/bookings/${booking._id}/damage-report/resolve`)
                toast.success('Damage report resolved')
                onReported?.()
              } catch { toast.error('Failed to resolve') }
            }}
            className="font-mono text-xs text-brand-amber hover:underline"
          >
            Mark as resolved →
          </button>
        )}
      </div>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 font-mono text-xs text-brand-red hover:text-brand-red/80 transition-colors border border-brand-red/20 px-3 py-2 hover:bg-brand-red/5"
      >
        <AlertTriangle size={14} /> Report Damage
      </button>
    )
  }

  const handleSubmit = async () => {
    if (!description.trim()) return toast.error('Describe the damage')
    const amt = Number(amount)
    if (isNaN(amt) || amt < 0) return toast.error('Enter a valid amount')
    if (amt > maxDeduct) return toast.error(`Cannot deduct more than deposit (${formatINR(maxDeduct)})`)

    setSubmitting(true)
    try {
      const fd = new FormData()
      fd.append('description', description.trim())
      fd.append('damageAmount', amt)
      files.forEach(f => fd.append('media', f))

      const { data } = await api.post(
        `/bookings/${booking._id}/damage-report`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      toast.success(`Damage report submitted. ₹${data.deducted} deducted from deposit.`)
      setOpen(false)
      onReported?.(data)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 border border-brand-red/20 bg-brand-red/5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertTriangle size={16} className="text-brand-red" />
          <p className="font-mono text-xs tracking-widest uppercase text-brand-red">Report Damage</p>
        </div>
        <button onClick={() => setOpen(false)} className="text-brand-muted hover:text-brand-cream">
          <X size={16} />
        </button>
      </div>

      <div className="p-3 bg-brand-amber/5 border border-brand-amber/20">
        <p className="font-mono text-xs text-brand-amber">
          Security deposit held: {formatINR(maxDeduct)}
        </p>
        <p className="font-mono text-[10px] text-brand-muted mt-0.5">
          You can deduct up to this amount for verified damage.
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="input-label">Damage Description <span className="text-brand-red">*</span></label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Describe the damage in detail (e.g. dent on front bumper, cracked windshield)"
          rows={3}
          className="input-field resize-none text-sm"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="input-label">Deduction Amount (₹)</label>
        <div className="relative">
          <IndianRupee size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-muted" />
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder={`0 – ${maxDeduct}`}
            min="0"
            max={maxDeduct}
            className="input-field pl-8"
          />
        </div>
        <p className="font-mono text-[10px] text-brand-muted mt-1">
          Enter 0 to report damage without deducting from deposit.
        </p>
      </div>

      {/* Evidence photos */}
      <div>
        <label className="input-label">Evidence Photos</label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={e => setFiles(Array.from(e.target.files).slice(0, 5))}
          className="hidden"
        />
        {files.length > 0 ? (
          <div className="flex flex-wrap gap-2 mb-2">
            {files.map((f, i) => (
              <div key={i} className="relative w-16 h-16 bg-brand-mid border border-white/10 overflow-hidden group">
                <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                <button
                  onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}
                  className="absolute inset-0 bg-brand-black/50 hidden group-hover:flex items-center justify-center"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ))}
          </div>
        ) : null}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-ghost text-xs flex items-center gap-2 py-2"
        >
          <Camera size={14} /> Add Evidence Photos
        </button>
      </div>

      {/* Comparison hint */}
      <p className="font-mono text-[10px] text-brand-muted leading-relaxed">
        Compare with pickup photos to verify damage. Customer will be notified and amount deducted from their deposit immediately.
      </p>

      <div className="flex gap-2">
        <button
          onClick={() => setOpen(false)}
          className="btn-outline flex-1 text-xs py-2"
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={submitting || !description.trim()}
          className="btn-danger flex-1 text-xs py-2 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {submitting
            ? <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            : <><Upload size={14} /> Submit Report</>
          }
        </button>
      </div>
    </div>
  )
}

export default DamageReport