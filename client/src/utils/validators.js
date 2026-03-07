// ── Regex Patterns ────────────────────────────────────────────────────────────
const EMAIL_REGEX  = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_REGEX  = /^[6-9]\d{9}$/           // Indian mobile numbers
const PLATE_REGEX  = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/  // MH01AB1234
const NAME_REGEX   = /^[a-zA-Z\s'-]{2,50}$/
const PASSWORD_MIN = 6

// ── Individual Validators ─────────────────────────────────────────────────────

export const validateEmail = (email) => {
  const v = email?.trim() ?? ''
  if (!v) return 'Email is required'
  if (!EMAIL_REGEX.test(v)) return 'Enter a valid email address'
  return null
}

export const validatePhone = (phone) => {
  const v = phone?.trim() ?? ''
  if (!v) return 'Phone number is required'
  if (!PHONE_REGEX.test(v)) return 'Enter a valid 10-digit Indian mobile number'
  return null
}

export const validatePassword = (password) => {
  if (!password) return 'Password is required'
  if (password.length < PASSWORD_MIN) return `Password must be at least ${PASSWORD_MIN} characters`
  return null
}

export const validateName = (name) => {
  const v = name?.trim() ?? ''
  if (!v) return 'Name is required'
  if (!NAME_REGEX.test(v)) return 'Name must be 2–50 letters only'
  return null
}

export const validatePlate = (plate) => {
  const v = plate?.trim().toUpperCase() ?? ''
  if (!v) return 'Plate number is required'
  if (!PLATE_REGEX.test(v)) return 'Enter valid plate (e.g. MH01AB1234)'
  return null
}

export const validateRequired = (value, fieldName = 'Field') => {
  const v = typeof value === 'string' ? value.trim() : value
  if (!v && v !== 0) return `${fieldName} is required`
  return null
}

export const validatePrice = (price) => {
  const n = Number(price)
  if (isNaN(n) || n <= 0) return 'Enter a valid price greater than 0'
  return null
}

export const validateYear = (year) => {
  const n = Number(year)
  const currentYear = new Date().getFullYear()
  if (isNaN(n) || n < 2000 || n > currentYear + 1) return `Year must be between 2000 and ${currentYear + 1}`
  return null
}

// ── Form-level Validators ─────────────────────────────────────────────────────

export const validateRegisterForm = ({ name, email, phone, password, role }) => {
  const errors = {}
  const ne = validateName(name);     if (ne) errors.name     = ne
  const ee = validateEmail(email);   if (ee) errors.email    = ee
  const pe = validatePhone(phone);   if (pe) errors.phone    = pe
  const pw = validatePassword(password); if (pw) errors.password = pw
  if (!role) errors.role = 'Please select a role'
  return errors
}

export const validateLoginForm = ({ email, password }) => {
  const errors = {}
  const ee = validateEmail(email);     if (ee) errors.email    = ee
  const pe = validatePassword(password); if (pe) errors.password = pe
  return errors
}

export const validateVehicleForm = ({ make, model, year, plateNumber, pricePerDay, currentHub }) => {
  const errors = {}
  if (!make?.trim())         errors.make        = 'Make is required'
  if (!model?.trim())        errors.model       = 'Model is required'
  const ye = validateYear(year);       if (ye) errors.year       = ye
  const ple = validatePlate(plateNumber); if (ple) errors.plateNumber = ple
  const pre = validatePrice(pricePerDay); if (pre) errors.pricePerDay = pre
  if (!currentHub?.name?.trim()) errors.currentHub = 'Hub location is required'
  return errors
}

export const validateBookingForm = ({ startHub, endHub, startDate, endDate }) => {
  const errors = {}
  if (!startHub?.name)  errors.startHub  = 'Select a pickup hub'
  if (!endHub?.name)    errors.endHub    = 'Select a drop-off hub'
  if (!startDate)       errors.startDate = 'Select start date'
  if (!endDate)         errors.endDate   = 'Select end date'
  if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
    errors.endDate = 'End date must be after start date'
  }
  if (startDate && new Date(startDate) < new Date(new Date().toDateString())) {
    errors.startDate = 'Start date cannot be in the past'
  }
  return errors
}

// Returns true if errors object has no keys
export const hasErrors = (errors) => Object.keys(errors).length > 0