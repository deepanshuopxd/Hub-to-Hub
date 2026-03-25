import { format, formatDistanceToNow, differenceInDays } from 'date-fns'

// ── Currency ──────────────────────────────────────────────────────────────────
export const formatINR = (amount) =>
  new Intl.NumberFormat('en-IN', {
    style:    'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount || 0)

// ── Dates ─────────────────────────────────────────────────────────────────────
export const formatDate = (date) =>
  format(new Date(date), 'dd MMM yyyy')

export const formatDateTime = (date) =>
  format(new Date(date), 'dd MMM yyyy, h:mm a')

export const formatRelative = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true })

export const formatShortDate = (date) =>
  format(new Date(date), 'MMM d')

export const calculateDays = (start, end) =>
  Math.max(1, differenceInDays(new Date(end), new Date(start)))

export const calculateTotalPrice = (pricePerDay, startDate, endDate) =>
  pricePerDay * calculateDays(startDate, endDate)

// ── Text ──────────────────────────────────────────────────────────────────────
export const capitalize = (str) =>
  str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : ''

export const truncate = (str, len = 40) =>
  str && str.length > len ? str.slice(0, len) + '…' : str

export const initials = (name) =>
  name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(w => w[0].toUpperCase())
    .join('') || '?'

// ── Status helpers ────────────────────────────────────────────────────────────
export const statusLabel = (status) => ({
  pending:    'Pending',
  active:     'Active',
  in_transit: 'In Transit',
  completed:  'Completed',
  cancelled:  'Cancelled',
}[status] || capitalize(status))

export const statusClass = (status) => ({
  pending:    'badge-pending',
  active:     'badge-active',
  in_transit: 'badge-transit',
  completed:  'badge-completed',
  cancelled:  'badge-cancelled',
  verified:   'badge-verified',
}[status] || 'badge-pending')

export const kycLabel = (status) => ({
  pending:   'KYC Pending',
  submitted: 'Under Review',
  verified:  'Verified',
  rejected:  'Rejected',
}[status] || 'Unknown')

// ── Plate formatting ──────────────────────────────────────────────────────────
export const formatPlate = (plate) =>
  plate?.toUpperCase().replace(/\s/g, '') || ''

// ── File size ─────────────────────────────────────────────────────────────────
export const formatBytes = (bytes) => {
  if (!bytes) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

// ── Hub display ───────────────────────────────────────────────────────────────
// HUBS are now dynamic — fetched from /api/vendors/cities-with-vehicles
// Keeping a small fallback list for forms that haven't migrated yet
export const HUBS = [
  { name: 'Mumbai Central Hub',    city: 'Mumbai',    lat: 18.9696, lng: 72.8196 },
  { name: 'Pune Station Hub',      city: 'Pune',      lat: 18.5204, lng: 73.8567 },
  { name: 'Bangalore MG Road Hub', city: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  { name: 'Delhi CP Hub',          city: 'Delhi',     lat: 28.6315, lng: 77.2167 },
  { name: 'Hyderabad HITEC Hub',   city: 'Hyderabad', lat: 17.4435, lng: 78.3772 },
  { name: 'Chennai Anna Hub',      city: 'Chennai',   lat: 13.0827, lng: 80.2707 },
  { name: 'Lonavala Hill Hub',     city: 'Lonavala',  lat: 18.7481, lng: 73.4072 },
  { name: 'Goa Panaji Hub',        city: 'Goa',       lat: 15.4909, lng: 73.8278 },
  { name: 'Varanasi Ghats Hub',    city: 'Varanasi',  lat: 25.3176, lng: 82.9739 },
  { name: 'Ayodhya Hub',           city: 'Ayodhya',   lat: 26.7922, lng: 82.1998 },
  { name: 'Jaipur Pink Hub',       city: 'Jaipur',    lat: 26.9124, lng: 75.7873 },
  { name: 'Agra Taj Hub',          city: 'Agra',      lat: 27.1767, lng: 78.0081 },
]

// Format duration for display
export const formatDuration = (hours) => {
  if (!hours) return '—'
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  const rem  = hours % 24
  return rem > 0 ? `${days}d ${rem}h` : `${days}d`
}

// Calculate hours between two datetimes
export const calculateHours = (start, end) => {
  const ms = new Date(end) - new Date(start)
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60)))
}

// Calculate days (ceil) between two datetimes
export const calculateDaysFromDateTime = (start, end) => {
  const hours = calculateHours(start, end)
  return Math.max(1, Math.ceil(hours / 24))
}