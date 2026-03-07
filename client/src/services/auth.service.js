import api from './api'

/**
 * auth.service.js
 * Direct API call wrappers for auth endpoints.
 * Use these inside components or thunks when you need raw responses.
 */

// POST /api/auth/register
export const registerService = async (payload) => {
  const { data } = await api.post('/auth/register', {
    name:     payload.name.trim(),
    email:    payload.email.trim().toLowerCase(),
    phone:    payload.phone.trim(),
    password: payload.password,
    role:     payload.role,
  })
  return data   // { user, token, message }
}

// POST /api/auth/login
export const loginService = async ({ email, password }) => {
  const { data } = await api.post('/auth/login', {
    email:    email.trim().toLowerCase(),
    password,
  })
  return data   // { user, token, message }
}

// GET /api/auth/me
export const getMeService = async () => {
  const { data } = await api.get('/auth/me')
  return data   // { user }
}

// PATCH /api/auth/wallet
export const topUpWalletService = async (amount) => {
  const { data } = await api.patch('/auth/wallet', { amount: Number(amount) })
  return data   // { wallet, message }
}

// PUT /api/auth/profile
export const updateProfileService = async (payload) => {
  const { data } = await api.put('/auth/profile', {
    name:  payload.name?.trim(),
    phone: payload.phone?.trim(),
  })
  return data   // { user, message }
}

// POST /api/auth/change-password
export const changePasswordService = async ({ currentPassword, newPassword }) => {
  const { data } = await api.post('/auth/change-password', {
    currentPassword,
    newPassword,
  })
  return data
}