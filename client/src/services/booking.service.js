import api from './api'

/**
 * booking.service.js
 * Direct service wrappers for booking endpoints.
 */

// POST /api/bookings
export const createBookingService = async (payload) => {
  const { data } = await api.post('/bookings', {
    vehicleId:  payload.vehicleId,
    startHub:   payload.startHub,
    endHub:     payload.endHub,
    startDate:  payload.startDate,
    endDate:    payload.endDate,
    totalPrice: payload.totalPrice,
  })
  return data   // { booking, message }
}

// GET /api/bookings/my   (customer)
export const fetchMyBookingsService = async () => {
  const { data } = await api.get('/bookings/my')
  return data   // { bookings }
}

// GET /api/bookings/vendor   (vendor)
export const fetchVendorBookingsService = async () => {
  const { data } = await api.get('/bookings/vendor')
  return data   // { bookings }
}

// GET /api/bookings/:id
export const fetchBookingByIdService = async (id) => {
  const { data } = await api.get(`/bookings/${id}`)
  return data   // { booking }
}

// PATCH /api/bookings/:id/status
export const updateBookingStatusService = async (id, status) => {
  const { data } = await api.patch(`/bookings/${id}/status`, { status })
  return data   // { booking, message }
}

// PATCH /api/bookings/:id/cancel
export const cancelBookingService = async (id) => {
  const { data } = await api.patch(`/bookings/${id}/cancel`)
  return data   // { booking, message }
}

// GET /api/bookings/:id/chat-history
export const fetchChatHistoryService = async (bookingId) => {
  const { data } = await api.get(`/bookings/${bookingId}/chat-history`)
  return data   // { messages }
}

// POST /api/kyc/submit  (multipart)
export const submitKYCService = async ({ dlFile, aadhaarFile, extractedName, extractedDOB }) => {
  const fd = new FormData()
  fd.append('dl',            dlFile)
  fd.append('aadhaar',       aadhaarFile)
  fd.append('extractedName', extractedName || '')
  fd.append('extractedDOB',  extractedDOB  || '')
  const { data } = await api.post('/kyc/submit', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data   // { kyc, message }
}
