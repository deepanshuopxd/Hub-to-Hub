import { CheckCircle, AlertCircle, Loader2, RefreshCw, User, Calendar, CreditCard, FileText } from 'lucide-react'

/**
 * OCRPreview — shows the extracted fields from Tesseract OCR result
 *
 * Props:
 *  - result      { name, dob, docNum, rawText } | null
 *  - processing  boolean
 *  - progress    number  0–100
 *  - docType     'dl' | 'aadhaar'
 *  - onRetry     () => void
 */
const OCRPreview = ({ result = null, processing = false, progress = 0, docType = 'dl', onRetry }) => {
  if (processing) {
    return (
      <div className="border border-brand-amber/20 bg-brand-amber/3 p-5">
        <div className="flex items-center gap-3 mb-4">
          <Loader2 size={18} className="text-brand-amber animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-brand-cream">Scanning document…</p>
            <p className="font-mono text-xs text-brand-muted mt-0.5">Tesseract OCR engine processing</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="space-y-1.5">
          <div className="w-full h-1 bg-brand-mid overflow-hidden">
            <div
              className="h-full bg-brand-amber transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-xs text-brand-muted">Recognising text</span>
            <span className="font-mono text-xs text-brand-amber">{progress}%</span>
          </div>
        </div>

        {/* OCR stages */}
        <div className="mt-4 space-y-1.5">
          {[
            { label: 'Load engine',       done: progress > 10  },
            { label: 'Process image',     done: progress > 30  },
            { label: 'Recognise text',    done: progress > 70  },
            { label: 'Extract fields',    done: progress >= 100 },
          ].map(({ label, done }) => (
            <div key={label} className="flex items-center gap-2">
              {done
                ? <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                : <div className="w-3 h-3 rounded-full border border-brand-muted/40 flex-shrink-0" />
              }
              <span className={`font-mono text-xs ${done ? 'text-brand-muted' : 'text-brand-muted/40'}`}>
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (!result) return null

  const fields = docType === 'dl'
    ? [
        { icon: User,        key: 'name',   label: 'Full Name'   },
        { icon: Calendar,    key: 'dob',    label: 'Date of Birth' },
        { icon: CreditCard,  key: 'docNum', label: 'DL Number'   },
      ]
    : [
        { icon: User,        key: 'name',   label: 'Full Name'   },
        { icon: Calendar,    key: 'dob',    label: 'Date of Birth' },
        { icon: CreditCard,  key: 'docNum', label: 'Aadhaar Number' },
      ]

  const allExtracted = fields.every(f => !!result[f.key])
  const someExtracted= fields.some(f => !!result[f.key])

  return (
    <div className={`border p-5 space-y-4 ${
      allExtracted
        ? 'border-green-500/20 bg-green-500/3'
        : someExtracted
          ? 'border-brand-amber/20 bg-brand-amber/3'
          : 'border-brand-red/20 bg-brand-red/3'
    }`}>
      {/* Status header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {allExtracted
            ? <CheckCircle size={16} className="text-green-400" />
            : someExtracted
              ? <AlertCircle size={16} className="text-brand-amber" />
              : <AlertCircle size={16} className="text-brand-red" />
          }
          <div>
            <p className={`text-sm font-medium ${
              allExtracted ? 'text-green-400' : someExtracted ? 'text-brand-amber' : 'text-brand-red'
            }`}>
              {allExtracted
                ? 'All fields extracted'
                : someExtracted
                  ? 'Partial extraction — verify below'
                  : 'Extraction failed — enter manually'
              }
            </p>
            <p className="font-mono text-xs text-brand-muted mt-0.5">
              {docType === 'dl' ? 'Driving License' : 'Aadhaar Card'} · OCR result
            </p>
          </div>
        </div>
        {onRetry && (
          <button type="button" onClick={onRetry}
            className="flex items-center gap-1 font-mono text-xs text-brand-muted hover:text-brand-amber transition-colors">
            <RefreshCw size={12} /> Retry
          </button>
        )}
      </div>

      {/* Extracted fields */}
      <div className="space-y-2">
        {fields.map(({ icon: Icon, key, label }) => {
          const value = result[key]
          return (
            <div key={key} className="flex items-center gap-3 p-2.5 bg-brand-black/30">
              <Icon size={14} className={value ? 'text-brand-amber' : 'text-brand-muted'} />
              <span className="font-mono text-xs text-brand-muted w-28 flex-shrink-0">{label}</span>
              {value ? (
                <span className="text-sm text-brand-cream font-medium">{value}</span>
              ) : (
                <span className="font-mono text-xs text-brand-muted italic">Not detected</span>
              )}
              {value
                ? <CheckCircle size={12} className="text-green-400 ml-auto flex-shrink-0" />
                : <AlertCircle size={12} className="text-brand-muted ml-auto flex-shrink-0" />
              }
            </div>
          )
        })}
      </div>

      {/* Raw text toggle */}
      {result.rawText && (
        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer font-mono text-xs text-brand-muted
                              hover:text-brand-amber transition-colors list-none">
            <FileText size={12} />
            <span>Raw OCR text</span>
          </summary>
          <div className="mt-2 p-3 bg-brand-black/40 border border-white/8 max-h-28 overflow-y-auto">
            <pre className="font-mono text-[10px] text-brand-muted whitespace-pre-wrap break-all leading-relaxed">
              {result.rawText}
            </pre>
          </div>
        </details>
      )}

      {!allExtracted && (
        <p className="font-mono text-xs text-brand-muted leading-relaxed">
          Tip: For better results, ensure the document is well-lit, flat, and all text is clearly visible.
          Our reviewers will manually verify any missing fields.
        </p>
      )}
    </div>
  )
}

export default OCRPreview