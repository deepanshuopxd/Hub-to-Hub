import { useState, useRef, useCallback } from 'react'
import { Upload, File, X, CheckCircle, AlertCircle, Eye } from 'lucide-react'
import { formatBytes } from '../../utils/formatters'

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
const MAX_SIZE_MB    = 5
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024

/**
 * DocumentUpload
 * Props:
 *  - label       string   e.g. "Driving License"
 *  - accept      string   MIME types  (default: image/*, pdf)
 *  - onFile      (File) => void
 *  - onRemove    () => void
 *  - currentFile File | null
 *  - previewUrl  string | null  (existing cloudinary URL for edit mode)
 *  - error       string | null
 *  - disabled    boolean
 */
const DocumentUpload = ({
  label      = 'Document',
  onFile,
  onRemove,
  currentFile= null,
  previewUrl = null,
  error      = null,
  disabled   = false,
}) => {
  const inputRef      = useRef(null)
  const [dragging,  setDragging]  = useState(false)
  const [localError,setLocalError]= useState(null)
  const [preview,   setPreview]   = useState(previewUrl || null)

  const validate = (file) => {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      return 'Only JPG, PNG, WEBP or PDF files are allowed'
    }
    if (file.size > MAX_SIZE_BYTES) {
      return `File must be under ${MAX_SIZE_MB}MB (current: ${formatBytes(file.size)})`
    }
    return null
  }

  const processFile = useCallback((file) => {
    const err = validate(file)
    if (err) { setLocalError(err); return }
    setLocalError(null)

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreview(url)
    } else {
      setPreview(null)
    }

    onFile?.(file)
  }, [onFile])

  // ── Drop handlers ──────────────────────────────────────────────────────────
  const onDragOver  = (e) => { e.preventDefault(); setDragging(true) }
  const onDragLeave = ()  => setDragging(false)
  const onDrop      = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const onInputChange = (e) => {
    const file = e.target.files[0]
    if (file) processFile(file)
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  const handleRemove = () => {
    if (preview && !previewUrl) URL.revokeObjectURL(preview)
    setPreview(previewUrl || null)
    setLocalError(null)
    onRemove?.()
  }

  const displayError = localError || error
  const hasFile = currentFile || (previewUrl && !onRemove)

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center justify-between">
        <label className="input-label mb-0">{label}</label>
        {currentFile && (
          <span className="flex items-center gap-1 font-mono text-xs text-green-400">
            <CheckCircle size={11} /> Uploaded
          </span>
        )}
      </div>

      {/* Drop zone / preview */}
      {!currentFile ? (
        <div
          onDragOver={!disabled ? onDragOver : undefined}
          onDragLeave={!disabled ? onDragLeave : undefined}
          onDrop={!disabled ? onDrop : undefined}
          onClick={!disabled ? () => inputRef.current?.click() : undefined}
          className={`
            relative border-2 border-dashed transition-all duration-200 cursor-pointer
            ${dragging
              ? 'border-brand-amber bg-brand-amber/8 scale-[1.01]'
              : displayError
                ? 'border-brand-red/40 bg-brand-red/3'
                : 'border-white/15 bg-brand-slate hover:border-brand-amber/40 hover:bg-brand-amber/3'
            }
            ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
          `}
        >
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className={`w-12 h-12 border mb-3 flex items-center justify-center transition-colors
              ${dragging ? 'border-brand-amber/50 bg-brand-amber/10' : 'border-white/10 bg-brand-mid'}`}>
              <Upload size={20} className={dragging ? 'text-brand-amber' : 'text-brand-muted'} />
            </div>
            <p className={`text-sm mb-1 transition-colors ${dragging ? 'text-brand-cream' : 'text-brand-muted'}`}>
              {dragging ? 'Drop it here!' : 'Click or drag & drop to upload'}
            </p>
            <p className="font-mono text-xs text-brand-muted">
              JPG, PNG, PDF · Max {MAX_SIZE_MB}MB
            </p>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            onChange={onInputChange}
            disabled={disabled}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border border-white/10 bg-brand-slate overflow-hidden">
          {/* Preview */}
          {preview ? (
            <div className="relative group">
              <img
                src={preview}
                alt={label}
                className="w-full h-44 object-contain bg-brand-mid"
              />
              {/* View full */}
              <a
                href={preview}
                target="_blank"
                rel="noreferrer"
                className="absolute top-2 right-2 p-1.5 bg-brand-black/60 text-white opacity-0
                           group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
              >
                <Eye size={14} />
              </a>
            </div>
          ) : (
            <div className="h-28 bg-brand-mid flex items-center justify-center gap-3">
              <File size={28} className="text-brand-amber" />
              <span className="font-mono text-xs text-brand-muted">PDF Document</span>
            </div>
          )}

          {/* File info + remove */}
          <div className="flex items-center justify-between px-4 py-3 bg-brand-mid/40">
            <div>
              <p className="text-sm text-brand-cream truncate max-w-[200px]">{currentFile.name}</p>
              <p className="font-mono text-xs text-brand-muted">{formatBytes(currentFile.size)}</p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="p-1.5 text-brand-muted hover:text-brand-red transition-colors flex-shrink-0"
              title="Remove"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {displayError && (
        <p className="flex items-center gap-1.5 font-mono text-xs text-brand-red">
          <AlertCircle size={11} className="flex-shrink-0" />
          {displayError}
        </p>
      )}
    </div>
  )
}

export default DocumentUpload