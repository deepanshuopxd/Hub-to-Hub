import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const registerUser = createAsyncThunk(
  'auth/register',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/register', formData)
      localStorage.setItem('hubdrive_token', data.token)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Registration failed')
    }
  }
)

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', credentials)
      localStorage.setItem('hubdrive_token', data.token)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Login failed')
    }
  }
)

export const fetchProfile = createAsyncThunk(
  'auth/profile',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/auth/me')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch profile')
    }
  }
)

export const updateWallet = createAsyncThunk(
  'auth/wallet',
  async (amount, { rejectWithValue }) => {
    try {
      const { data } = await api.patch('/auth/wallet', { amount })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Wallet update failed')
    }
  }
)

// ── Initial State ─────────────────────────────────────────────────────────────

const token = localStorage.getItem('hubdrive_token')

const initialState = {
  user:        null,
  token:       token || null,
  isLoggedIn:  !!token,
  loading:     false,
  profileLoading: false,
  error:       null,
}

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout: (state) => {
      state.user       = null
      state.token      = null
      state.isLoggedIn = false
      state.error      = null
      localStorage.removeItem('hubdrive_token')
    },
    clearError: (state) => {
      state.error = null
    },
    updateKycStatus: (state, action) => {
      if (state.user) {
        state.user.kyc = { ...state.user.kyc, ...action.payload }
      }
    },
  },
  extraReducers: (builder) => {
    // ── Register ──
    builder
      .addCase(registerUser.pending,  (state) => { state.loading = true;  state.error = null })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading    = false
        state.user       = action.payload.user
        state.token      = action.payload.token
        state.isLoggedIn = true
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

    // ── Login ──
      .addCase(loginUser.pending,  (state) => { state.loading = true;  state.error = null })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading    = false
        state.user       = action.payload.user
        state.token      = action.payload.token
        state.isLoggedIn = true
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false
        state.error   = action.payload
      })

    // ── Profile ──
      .addCase(fetchProfile.pending,  (state) => { state.profileLoading = true })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.profileLoading = false
        state.user           = action.payload.user
      })
      .addCase(fetchProfile.rejected, (state) => {
        state.profileLoading = false
      })

    // ── Wallet ──
      .addCase(updateWallet.fulfilled, (state, action) => {
        if (state.user) state.user.wallet = action.payload.wallet
      })
  },
})

export const { logout, clearError, updateKycStatus } = authSlice.actions

// ── Selectors ─────────────────────────────────────────────────────────────────
export const selectUser       = (state) => state.auth.user
export const selectToken      = (state) => state.auth.token
export const selectIsLoggedIn = (state) => state.auth.isLoggedIn
export const selectAuthLoading= (state) => state.auth.loading
export const selectAuthError  = (state) => state.auth.error
export const selectIsVendor   = (state) => state.auth.user?.role === 'center_admin'
export const selectIsCustomer = (state) => state.auth.user?.role === 'customer'
export const selectKycStatus  = (state) => state.auth.user?.kyc?.status

export default authSlice.reducer