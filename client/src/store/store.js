import { configureStore } from '@reduxjs/toolkit'
import authReducer     from './slices/authSlice'
import vehicleReducer  from './slices/vehicleSlice'
import bookingReducer  from './slices/bookingSlice'
import chatReducer     from './slices/chatSlice'

export const store = configureStore({
  reducer: {
    auth:     authReducer,
    vehicles: vehicleReducer,
    bookings: bookingReducer,
    chat:     chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore socket instances stored in chat
        ignoredActions: ['chat/setSocket'],
        ignoredPaths:   ['chat.socket'],
      },
    }),
})

export default store