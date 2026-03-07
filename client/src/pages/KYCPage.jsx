import { useState, useRef } from 'react'
import { useDispatch } from 'react-redux'
import { Upload, ShieldCheck, AlertCircle, CheckCircle, FileText, Eye, Loader2 } from 'lucide-react'
import { createWorker } from 'tesseract.js'
import api from '../services/api'
import { updateKycStatus } from '../store/slices/authSlice'
import { useAuth } from '../hooks/useAuth'
import { kycLabel } from '../utils/formatters'
import toast from 'react-hot-toast'

// ── OCR Document uploader ─────────────────────────────────────────────────────
const DocUploader = ({ label, docType, onExtracted }) => {
  const [file,       setFile]       = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [processing, setProcessing] = useState(false)
  const [progress,   setProgress]   = useState(0)
  const [extracted,  setExtracted]  = useState(null)
  const [uploaded,   setUploaded]   = useState(false)
  const inputRef = useRef()

  const handleFile = async (e) => {
    const f = e.target.files[0]
    if (!f) return

    // Preview
    const url = URL.createObjectURL(f)
    setFile(f)
    setPreview(url)
    setProcessing(true)
    setProgress(0)
    setExtracted(null)

    try {
      // ── Tesseract OCR ──
      const worker = await createWorker('eng', 1, {
        logger: (m) => {
          if (m.status === 'recognizing text') setProgress(Math.round(m.progress * 100))
        },
      })
      const { data: { text } } = await worker.recognize(f)
      await worker.terminate()

      // Simple extraction heuristics
      const nameMatch  = text.match(/Name[:\s]+([A-Z][a-z]+(?: [A-Z][a-z]+)+)/i)
      const dobMatch   = text.match(/(?:DOB|Date of Birth|D\.O\.B)[:\s]+(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i)
      const numMatch   = docType === 'dl'
        ? text.match(/DL(?:No|Number|\.)[:\s]*([A-Z]{2}\d{13,14})/i)
        : text.match(/\b(\d{4}\s?\d{4}\s?\d{4})\b/)

      const result = {
        rawText: text.trim(),
        name:    nameMatch?.[1]  || null,
        dob:     dobMatch?.[1]   || null,
        docNum:  numMatch?.[1]?.replace(/\s/g,'') || null,
      }

      setExtracted(result)
      onExtracted?.({ ...result, file: f })
      toast.success('OCR extraction complete')
    } catch (err) {
      console.error('OCR error:', err)
      toast.error('OCR failed — you can still upload manually')
      onExtracted?.({ file: f, rawText: '', name: null, dob: null, docNum: null })
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="card p-6 border border-white/8">
      <div className="flex items-center gap-3 mb-4">
        <FileText size={20} className="text-brand-amber" />
        <h3 className="font-mono text-xs tracking-widest uppercase text-brand-cream">{label}</h3>
        {uploaded && <CheckCircle size={16} className="text-green-400 ml-auto" />}
      </div>

      {!preview ? (
        <button
          onClick={() => inputRef.current?.click()}
          className="w-full border-2 border-dashed border-white/15 hover:border-brand-amber/40
                     p-8 flex flex-col items-center gap-3 transition-colors group"
        >
          <Upload size={28} className="text-brand-muted group-hover:text-brand-amber transition-colors" />
          <p className="text-sm text-brand-muted group-hover:text-brand-cream transition-colors">
            Click to upload or drag & drop
          </p>
          <p className="font-mono text-xs text-brand-muted">JPG, PNG, PDF · Max 5MB</p>
        </button>
      ) : (
        <div className="space-y-4">
          {/* Image preview */}
          <div className="relative w-full h-40 bg-brand-mid overflow-hidden">
            <img src={preview} alt="doc" className="w-full h-full object-contain" />
            {processing && (
              <div className="absolute inset-0 bg-brand-black/70 flex flex-col items-center justify-center gap-3">
                <Loader2 size={24} className="text-brand-amber animate-spin" />
                <div className="w-32 h-1 bg-brand-mid overflow-hidden">
                  <div
                    className="h-full bg-brand-amber transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="font-mono text-xs text-brand-amber">{progress}% — OCR scanning</span>
              </div>
            )}
          </div>

          {/* Extracted data */}
          {extracted && !processing && (
            <div className="space-y-2 p-3 bg-brand-mid/40 border border-white/8">
              <p className="font-mono text-xs tracking-widest uppercase text-brand-amber mb-2">Extracted Data</p>
              {[
                { label: 'Name',   value: extracted.name   },
                { label: 'DOB',    value: extracted.dob    },
                { label: 'Doc No', value: extracted.docNum },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  {value
                    ? <CheckCircle size={12} className="text-green-400 flex-shrink-0" />
                    : <AlertCircle size={12} className="text-brand-muted flex-shrink-0" />
                  }
                  <span className="font-mono text-xs text-brand-muted w-14">{label}:</span>
                  <span className="text-sm text-brand-cream">{value || '—'}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => { setFile(null); setPreview(null); setExtracted(null); setUploaded(false) }}
              className="btn-ghost flex-1 text-xs"
            >
              Re-upload
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFile}
        className="hidden"
      />
    </div>
  )
}

// ── Main KYC Page ─────────────────────────────────────────────────────────────
const KYCPage = () => {
  const dispatch = useDispatch()
  const { user } = useAuth()

  const [dlData,      setDlData]      = useState(null)
  const [aadhaarData, setAadhaarData] = useState(null)
  const [submitting,  setSubmitting]  = useState(false)

  const kycStatus  = user?.kyc?.status || 'pending'
  const isVerified = kycStatus === 'verified'
  const isSubmitted= kycStatus === 'submitted'

  const handleSubmit = async () => {
    if (!dlData?.file || !aadhaarData?.file) {
      toast.error('Please upload both documents')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('dl',      dlData.file)
      formData.append('aadhaar', aadhaarData.file)
      formData.append('extractedName', dlData.name || '')
      formData.append('extractedDOB',  dlData.dob  || '')

      const { data } = await api.post('/kyc/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      dispatch(updateKycStatus(data.kyc))
      toast.success('KYC documents submitted for review!')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8 animate-[fadeUp_0.5s_ease_forwards]">
      {/* Header */}
      <div>
        <span className="section-eyebrow">Identity Verification</span>
        <h1 className="font-display text-5xl text-brand-cream">
          KYC <span className="text-brand-amber">Verification</span>
        </h1>
        <p className="text-brand-muted text-sm mt-2">
          Upload your Driving License and Aadhaar Card. Our system will use OCR to auto-extract your details.
        </p>
      </div>

      {/* Status banner */}
      <div className={`p-4 border flex items-center gap-3 ${
        isVerified  ? 'border-green-400/30 bg-green-400/5' :
        isSubmitted ? 'border-brand-amber/30 bg-brand-amber/5' :
                     'border-white/8 bg-brand-slate'
      }`}>
        <ShieldCheck size={20} className={
          isVerified ? 'text-green-400' : isSubmitted ? 'text-brand-amber' : 'text-brand-muted'
        } />
        <div>
          <p className="text-sm font-medium text-brand-cream">
            Status: <span className={isVerified ? 'text-green-400' : 'text-brand-amber'}>
              {kycLabel(kycStatus)}
            </span>
          </p>
          <p className="font-mono text-xs text-brand-muted mt-0.5">
            {isVerified  ? 'Your identity is verified. You can now book vehicles.' :
             isSubmitted ? 'Documents under review. Usually takes 24–48 hours.' :
             'Upload your documents below to begin verification.'}
          </p>
        </div>
      </div>

      {!isVerified && !isSubmitted && (
        <>
          {/* How it works */}
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { step: '01', label: 'Upload DL & Aadhaar' },
              { step: '02', label: 'OCR auto-extracts data' },
              { step: '03', label: 'Manual review & approval' },
            ].map(({ step, label }) => (
              <div key={step} className="p-4 bg-brand-slate border border-white/8">
                <div className="font-display text-3xl text-brand-amber/20 mb-1">{step}</div>
                <p className="font-mono text-xs text-brand-muted">{label}</p>
              </div>
            ))}
          </div>

          {/* Uploaders */}
          <DocUploader
            label="Driving License (DL)"
            docType="dl"
            onExtracted={setDlData}
          />
          <DocUploader
            label="Aadhaar Card"
            docType="aadhaar"
            onExtracted={setAadhaarData}
          />

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!dlData?.file || !aadhaarData?.file || submitting}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <><Loader2 size={16} className="animate-spin" /> Submitting…</>
            ) : (
              <><ShieldCheck size={16} /> Submit for Verification</>
            )}
          </button>

          <p className="font-mono text-xs text-brand-muted text-center">
            Your documents are encrypted and stored securely. Only used for identity verification.
          </p>
        </>
      )}

      {/* Verified state */}
      {isVerified && (
        <div className="card p-8 border border-green-400/20 bg-green-400/3 text-center">
          <CheckCircle size={48} className="text-green-400 mx-auto mb-4" />
          <h2 className="font-display text-3xl text-brand-cream mb-2">Identity Verified!</h2>
          <p className="text-brand-muted text-sm">
            Your account is fully verified. You can now book any available vehicle.
          </p>
        </div>
      )}
    </div>
  )
}

export default KYCPage