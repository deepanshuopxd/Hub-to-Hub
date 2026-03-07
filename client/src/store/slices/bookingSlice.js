import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const createBooking = createAsyncThunk(
  'bookings/create',
  async (bookingData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/bookings', bookingData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Booking failed')
    }
  }
)

export const fetchMyBookings = createAsyncThunk(
  'bookings/fetchMine',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/bookings/my')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load bookings')
    }
  }
)

export const fetchVendorBookings = createAsyncThunk(
  'bookings/fetchVendor',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/bookings/vendor')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to load bookings')
    }
  }
)

export const fetchBookingById = createAsyncThunk(
  'bookings/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/bookings/${id}`)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Booking not found')
    }
  }
)

export const updateBookingStatus = createAsyncThunk(
  'bookings/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/bookings/${id}/status`, { status })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Status update failed')
    }
  }
)

export const cancelBooking = createAsyncThunk(
  'bookings/cancel',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.patch(`/bookings/${id}/cancel`)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Cancellation failed')
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────────

const bookingSlice = createSlice({
  name: 'bookings',
  initialState: {
    myBookings:     [],
    vendorBookings: [],
    selected:       null,
    loading:        false,
    creating:       false,
    error:          null,
  },
  reducers: {
    clearError:    (state) => { state.error    = null },
    clearSelected: (state) => { state.selected = null },
    // Live update from socket
    liveUpdateBooking: (state, action) => {
      const updated = action.payload
      const idx = state.myBookings.findIndex(b => b._id === updated._id)
      if (idx !== -1) state.myBookings[idx] = updated
      const vidx = state.vendorBookings.findIndex(b => b._id === updated._id)
      if (vidx !== -1) state.vendorBookings[vidx] = updated
      if (state.selected?._id === updated._id) state.selected = updated
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createBooking.pending,   (state) => { state.creating = true;  state.error = null })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.creating = false
        state.myBookings.unshift(action.payload.booking)
      })
      .addCase(createBooking.rejected,  (state, action) => { state.creating = false; state.error = action.payload })

      .addCase(fetchMyBookings.pending,   (state) => { state.loading = true })
      .addCase(fetchMyBookings.fulfilled, (state, action) => {
        state.loading    = false
        state.myBookings = action.payload.bookings
      })
      .addCase(fetchMyBookings.rejected,  (state) => { state.loading = false })

      .addCase(fetchVendorBookings.pending,   (state) => { state.loading = true })
      .addCase(fetchVendorBookings.fulfilled, (state, action) => {
        state.loading        = false
        state.vendorBookings = action.payload.bookings
      })
      .addCase(fetchVendorBookings.rejected,  (state) => { state.loading = false })

      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.selected = action.payload.booking
      })

      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        const b = action.payload.booking
        const idx = state.vendorBookings.findIndex(x => x._id === b._id)
        if (idx !== -1) state.vendorBookings[idx] = b
        if (state.selected?._id === b._id) state.selected = b
      })

      .addCase(cancelBooking.fulfilled, (state, action) => {
        const b = action.payload.booking
        const idx = state.myBookings.findIndex(x => x._id === b._id)
        if (idx !== -1) state.myBookings[idx] = b
      })
  },
})

export const { clearError, clearSelected, liveUpdateBooking } = bookingSlice.actions

// Selectors
export const selectMyBookings     = (state) => state.bookings.myBookings
export const selectVendorBookings = (state) => state.bookings.vendorBookings
export const selectSelectedBooking= (state) => state.bookings.selected
export const selectBookingLoading = (state) => state.bookings.loading
export const selectBookingCreating= (state) => state.bookings.creating
export const selectBookingError   = (state) => state.bookings.error

export default bookingSlice.reducer