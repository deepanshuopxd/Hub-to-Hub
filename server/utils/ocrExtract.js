/**
 * ocrExtract.js
 * Server-side sanitisation and validation of Tesseract OCR output
 * sent from the client (KYC flow).
 */

const sanitiseOCRFields = (raw = {}) => {
  const {
    extractedName   = '',
    extractedDOB    = '',
    dlNumber        = '',
    aadhaarNumber   = '',
  } = raw

  const cleanName = extractedName
    .replace(/[^a-zA-Z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 100)

  const cleanDOB   = extractedDOB.trim().substring(0, 20)
  const dobValid   = (() => {
    if (!cleanDOB) return false
    const d   = new Date(cleanDOB)
    if (isNaN(d)) return false
    const age = (Date.now() - d) / (1000 * 60 * 60 * 24 * 365.25)
    return age >= 18 && age <= 100
  })()

  const cleanDL      = dlNumber.replace(/\s/g, '').toUpperCase().substring(0, 20)
  const dlValid      = cleanDL.length >= 8

  const cleanAadhaar = aadhaarNumber.replace(/\D/g, '').substring(0, 12)
  const aadhaarValid = cleanAadhaar.length === 12
  const maskedAadhaar= aadhaarValid ? `XXXX XXXX ${cleanAadhaar.slice(8)}` : null

  const score = [!!cleanName, dobValid, dlValid, aadhaarValid].filter(Boolean).length

  return {
    extractedName:  cleanName   || null,
    extractedDOB:   cleanDOB    || null,
    dlNumber:       cleanDL     || null,
    aadhaarNumber:  maskedAadhaar,
    validation: {
      nameExtracted:    !!cleanName,
      dobExtracted:     !!cleanDOB,
      dobValid,
      dlExtracted:      !!cleanDL,
      dlValid,
      aadhaarExtracted: !!cleanAadhaar,
      aadhaarValid,
      score,              // 0–4; higher = better extraction quality
    },
  }
}

const isAutoApprovable = (validation) =>
  validation.nameExtracted &&
  validation.dobValid      &&
  (validation.dlValid || validation.aadhaarValid) &&
  validation.score >= 3

const formatOCRSummary = (kycData) =>
  [
    kycData.extractedName  && `Name: ${kycData.extractedName}`,
    kycData.extractedDOB   && `DOB: ${kycData.extractedDOB}`,
    kycData.dlNumber       && `DL: ${kycData.dlNumber}`,
    kycData.aadhaarNumber  && `Aadhaar: ${kycData.aadhaarNumber}`,
  ]
    .filter(Boolean)
    .join(' | ') || 'No OCR data'

module.exports = { sanitiseOCRFields, isAutoApprovable, formatOCRSummary }