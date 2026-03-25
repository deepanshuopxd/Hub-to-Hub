import { useState, useRef } from 'react'
import { Camera, Video, Upload, X, Eye, CheckCircle } from 'lucide-react'
import api from '../../services/api'
import toast from 'react-hot-toast'

// ── Media thumbnail ───────────────────────────────────────────────────────────
const MediaThumb = ({ item, onRemove }) => {
  const isVideo = item.type === 'video' || item.file?.type?.startsWith('video/')
  const src     = item.url || (item.file ? URL.createObjectURL(item.file) : null)

  return (
    <div className="relative w-20 h-20 bg-brand-mid border border-white/10 overflow-hidden group">
      {isVideo ? (
        <div className="w-full h-full flex items-center justify-center">
          <Video size={24} className="text-brand-amber" />
        </div>
      ) : (
        <img src={src} alt="media" className="w-full h-full object-cover" />
      )}
      {onRemove && (
        <button
          onClick={onRemove}
          className="absolute top-0.5 right-0.5 w-5 h-5 bg-brand-red/80 flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X size={10} className="text-white" />
        </button>
      )}
      {item.uploadedAt && (
        <div className="absolute bottom-0 left-0 right-0 bg-brand-black/60 py-0.5 px-1">
          <p className="font-mono text-[8px] text-brand-muted truncate">
            {item.role === 'center_admin' ? 'Vendor' : 'Customer'}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────
const HandoverUpload = ({ bookingId, type, existingMedia = [], onUploaded }) => {
  // type = 'pickup' | 'dropoff'
  const [files,    setFiles]    = useState([])
  const [note,     setNote]     = useState('')
  const [uploading,setUploading]= useState(false)
  const [done,     setDone]     = useState(false)
  const fileRef = useRef()

  const label = type === 'pickup' ? 'Pickup Condition' : 'Dropoff Condition'
  const endpoint = type === 'pickup' ? 'pickup-media' : 'dropoff-media'

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files)
    const valid    = selected.filter(f => {
      const isImg   = f.type.startsWith('image/')
      const isVideo = f.type.startsWith('video/')
      if (!isImg && !isVideo) { toast.error(`${f.name} — unsupported format`); return false }
      if (isVideo && f.size > 100 * 1024 * 1024) { toast.error(`${f.name} — video too large (max 100MB)`); return false }
      if (isImg   && f.size >  10 * 1024 * 1024) { toast.error(`${f.name} — image too large (max 10MB)`);  return false }
      return true
    })
    setFiles(prev => [...prev, ...valid].slice(0, 10))
  }

  const removeFile = (idx) => setFiles(f => f.filter((_, i) => i !== idx))

  const handleUpload = async () => {
    if (!files.length) return toast.error('Select at least one photo or video')
    setUploading(true)
    try {
      const fd = new FormData()
      files.forEach(f => fd.append('media', f))
      if (note.trim()) fd.append('note', note.trim())

      const { data } = await api.post(
        `/bookings/${bookingId}/${endpoint}`,
        fd,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )

      toast.success(`${files.length} file(s) uploaded`)
      setFiles([])
      setNote('')
      setDone(true)
      onUploaded?.(data)
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-mono text-xs tracking-widest uppercase text-brand-amber">{label}</h3>
        {done && (
          <div className="flex items-center gap-1 font-mono text-xs text-green-400">
            <CheckCircle size={12} /> Uploaded
          </div>
        )}
      </div>

      {/* Existing media */}
      {existingMedia.length > 0 && (
        <div>
          <p className="font-mono text-[10px] text-brand-muted mb-2">
            {existingMedia.length} file(s) already uploaded
          </p>
          <div className="flex flex-wrap gap-2">
            {existingMedia.map((item, i) => (
              <MediaThumb key={i} item={item} />
            ))}
          </div>
        </div>
      )}

      {/* New files to upload */}
      {files.length > 0 && (
        <div>
          <p className="font-mono text-[10px] text-brand-muted mb-2">Selected ({files.length})</p>
          <div className="flex flex-wrap gap-2">
            {files.map((f, i) => (
              <MediaThumb key={i} item={{ file: f }} onRemove={() => removeFile(i)} />
            ))}
          </div>
        </div>
      )}

      {/* Note */}
      <input
        value={note}
        onChange={e => setNote(e.target.value)}
        placeholder="Add a note (optional)"
        className="input-field text-sm"
      />

      {/* Actions */}
      <div className="flex gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,video/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="btn-ghost flex items-center gap-2 text-xs py-2 flex-1"
        >
          <Camera size={14} /> Add Photos/Video
        </button>
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading || !files.length}
          className="btn-primary flex items-center gap-2 text-xs py-2 flex-1 disabled:opacity-40"
        >
          {uploading
            ? <span className="w-3 h-3 border-2 border-brand-black/30 border-t-brand-black rounded-full animate-spin" />
            : <><Upload size={14} /> Upload</>
          }
        </button>
      </div>

      <p className="font-mono text-[10px] text-brand-muted">
        Supported: JPG, PNG, WEBP (max 10MB) · MP4, MOV, AVI, WEBM (max 100MB) · Up to 10 files
      </p>
    </div>
  )
}

export default HandoverUpload