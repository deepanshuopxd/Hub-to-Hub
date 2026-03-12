import axios from 'axios'

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || 'http://10.179.204.104:5000/api',
//   timeout: 15000,
//   headers: { 'Content-Type': 'application/json' },
// })

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 
           `http://${window.location.hostname}:5000/api`,
})

// ── Request interceptor: attach JWT ──────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('hubdrive_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor: handle 401 ─────────────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('hubdrive_token')
      // Redirect to login only if not already there
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api