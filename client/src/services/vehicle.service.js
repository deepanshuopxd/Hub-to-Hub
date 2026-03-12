

import api from './api'

/**
 * vehicle.service.js
 * Direct service wrappers — use these for non-Redux calls or custom queries.
 */

// GET /api/vehicles?hub=...&category=...&minPrice=...&maxPrice=...
export const fetchVehiclesService = async (filters = {}) => {
  const params = {}
  if (filters.hub)      params.hub      = filters.hub
  if (filters.category) params.category = filters.category
  if (filters.minPrice) params.minPrice = filters.minPrice
  if (filters.maxPrice) params.maxPrice = filters.maxPrice
  const { data } = await api.get('/vehicles', { params })
  return data   // { vehicles: Vehicle[] }
}

// GET /api/vehicles/:id
export const fetchVehicleByIdService = async (id) => {
  const { data } = await api.get(`/vehicles/${id}`)
  return data   // { vehicle }
}

// GET /api/vehicles/vendor/my-fleet
export const fetchVendorFleetService = async () => {
  const { data } = await api.get('/vehicles/vendor/my-fleet')
  return data   // { vehicles }
}

// POST /api/vehicles  (multipart/form-data)
export const addVehicleService = async (formData) => {
  const { data } = await api.post('/vehicles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data   // { vehicle, message }
}

// PUT /api/vehicles/:id
export const updateVehicleService = async (id, payload) => {
  const { data } = await api.put(`/vehicles/${id}`, payload)
  return data   // { vehicle, message }
}

// PATCH /api/vehicles/:id/availability
export const toggleAvailabilityService = async (id, isAvailable) => {
  const { data } = await api.patch(`/vehicles/${id}/availability`, { isAvailable })
  return data
}

// DELETE /api/vehicles/:id
export const deleteVehicleService = async (id) => {
  const { data } = await api.delete(`/vehicles/${id}`)
  return data   // { message }
}

// GET /api/vehicles/hubs  — list all distinct hub names
export const fetchHubsService = async () => {
  const { data } = await api.get('/vehicles/hubs')
  return data   // { hubs: string[] }
}