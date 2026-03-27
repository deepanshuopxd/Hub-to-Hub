import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import api from '../../services/api'

// ── Async Thunks ─────────────────────────────────────────────────────────────

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchAll',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/vehicles', { params })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch vehicles')
    }
  }
)

export const fetchVehicleById = createAsyncThunk(
  'vehicles/fetchOne',
  async (id, { rejectWithValue }) => {
    try {
      const { data } = await api.get(`/vehicles/${id}`)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Vehicle not found')
    }
  }
)

export const fetchVendorVehicles = createAsyncThunk(
  'vehicles/fetchVendor',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/vehicles/vendor/my-fleet')
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to fetch fleet')
    }
  }
)

export const addVehicle = createAsyncThunk(
  'vehicles/add',
  async (formData, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/vehicles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to add vehicle')
    }
  }
)

export const updateVehicle = createAsyncThunk(
  'vehicles/update',
  async ({ id, formData }, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/vehicles/${id}`, formData)
      return data
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to update vehicle')
    }
  }
)

export const deleteVehicle = createAsyncThunk(
  'vehicles/delete',
  async (id, { rejectWithValue }) => {
    try {
      await api.delete(`/vehicles/${id}`)
      return id
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || 'Failed to delete vehicle')
    }
  }
)

// ── Slice ─────────────────────────────────────────────────────────────────────

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState: {
    list:         [],
    vendorFleet:  [],
    selected:     null,
    loading:      false,
    fleetLoading: false,
    error:        null,
    filters: {
      hub:      '',
      category: '',
      minPrice: '',
      maxPrice: '',
    },
  },
  reducers: {
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    clearFilters: (state) => {
      state.filters = { hub: '', category: '', minPrice: '', maxPrice: '' }
    },
    clearSelected: (state) => {
      state.selected = null
    },
    clearError: (state) => {
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchAll
      .addCase(fetchVehicles.pending,   (state) => { state.loading = true;  state.error = null })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.loading = false
        state.list    = action.payload.vehicles
      })
      .addCase(fetchVehicles.rejected,  (state, action) => { state.loading = false; state.error = action.payload })

      // fetchOne
      .addCase(fetchVehicleById.fulfilled, (state, action) => {
        state.selected = action.payload.vehicle
      })

      // fetchVendor
      .addCase(fetchVendorVehicles.pending,   (state) => { state.fleetLoading = true })
      .addCase(fetchVendorVehicles.fulfilled, (state, action) => {
        state.fleetLoading = false
        state.vendorFleet  = action.payload.vehicles
      })
      .addCase(fetchVendorVehicles.rejected,  (state) => { state.fleetLoading = false })

      // add
      .addCase(addVehicle.fulfilled, (state, action) => {
        state.vendorFleet.push(action.payload.vehicle)
      })

      // update
      .addCase(updateVehicle.fulfilled, (state, action) => {
        const idx = state.vendorFleet.findIndex(v => v._id === action.payload.vehicle._id)
        if (idx !== -1) state.vendorFleet[idx] = action.payload.vehicle
      })

      // delete
      .addCase(deleteVehicle.fulfilled, (state, action) => {
        state.vendorFleet = state.vendorFleet.filter(v => v._id !== action.payload)
      })
  },
})

export const { setFilters, clearFilters, clearSelected, clearError } = vehicleSlice.actions

// Selectors
export const selectVehicles     = (state) => state.vehicles.list
export const selectVendorFleet  = (state) => state.vehicles.vendorFleet
export const selectSelectedVehicle = (state) => state.vehicles.selected
export const selectVehicleLoading  = (state) => state.vehicles.loading
export const selectFleetLoading    = (state) => state.vehicles.fleetLoading
export const selectVehicleFilters  = (state) => state.vehicles.filters


export default vehicleSlice.reducer