import { createSlice } from '@reduxjs/toolkit'

// ── Slice ─────────────────────────────────────────────────────────────────────
// Chat messages are managed via Socket.io; this slice stores the local state.

const chatSlice = createSlice({
  name: 'chat',
  initialState: {
    rooms:          {},      // { [bookingId]: Message[] }
    activeRoom:     null,    // current bookingId
    socket:         null,    // Socket.io instance (non-serializable, excluded from checks)
    connected:      false,
    typing:         {},      // { [bookingId]: { isTyping, userName, role } }
    unreadCounts:   {},      // { [bookingId]: number }
  },
  reducers: {
    setSocket: (state, action) => {
      state.socket    = action.payload
      state.connected = !!action.payload
    },
    setConnected: (state, action) => {
      state.connected = action.payload
    },
    setActiveRoom: (state, action) => {
      state.activeRoom = action.payload
      // Clear unread when entering room
      if (action.payload) {
        state.unreadCounts[action.payload] = 0
      }
    },
    initRoom: (state, action) => {
      const { bookingId, messages } = action.payload
      state.rooms[bookingId] = messages || []
    },
    addMessage: (state, action) => {
      const { bookingId, message } = action.payload
      if (!state.rooms[bookingId]) state.rooms[bookingId] = []
      // Avoid duplicate messages
      const exists = state.rooms[bookingId].some(m => m._id === message._id)
      if (!exists) {
        state.rooms[bookingId].push(message)
        // Increment unread if not in active room
        if (state.activeRoom !== bookingId) {
          state.unreadCounts[bookingId] = (state.unreadCounts[bookingId] || 0) + 1
        }
      }
    },
    setTyping: (state, action) => {
      const { bookingId, isTyping, userName, role } = action.payload
      state.typing[bookingId] = { isTyping, userName, role }
    },
    clearRoom: (state, action) => {
      delete state.rooms[action.payload]
    },
    resetChat: (state) => {
      state.rooms        = {}
      state.activeRoom   = null
      state.connected    = false
      state.typing       = {}
      state.unreadCounts = {}
    },
  },
})

export const {
  setSocket, setConnected, setActiveRoom,
  initRoom, addMessage, setTyping,
  clearRoom, resetChat,
} = chatSlice.actions

// Selectors
export const selectRoomMessages  = (bookingId) => (state) => state.chat.rooms[bookingId] || []
export const selectActiveRoom    = (state) => state.chat.activeRoom
export const selectChatConnected = (state) => state.chat.connected
export const selectTyping        = (bookingId) => (state) => state.chat.typing[bookingId] || { isTyping: false }
export const selectUnreadCount   = (bookingId) => (state) => state.chat.unreadCounts[bookingId] || 0
export const selectTotalUnread   = (state) =>
  Object.values(state.chat.unreadCounts).reduce((a, b) => a + b, 0)

export default chatSlice.reducer