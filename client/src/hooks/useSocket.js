import { useEffect, useRef, useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { io } from 'socket.io-client'
import { setSocket, setConnected, addMessage, setTyping, initRoom } from '../store/slices/chatSlice'
import { liveUpdateBooking } from '../store/slices/bookingSlice'
import { selectToken } from '../store/slices/authSlice'

// const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 
                   `http://${window.location.hostname}:5000`


export const useSocket = () => {
  const dispatch = useDispatch()
  const token    = useSelector(selectToken)
  const socketRef= useRef(null)

  useEffect(() => {
    if (!token) return

    const socket = io(SOCKET_URL, {
      auth:         { token },
      transports:   ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay:    1000,
    })

    socketRef.current = socket
    dispatch(setSocket(socket))

    socket.on('connect', () => {
      dispatch(setConnected(true))
      console.info('[Socket] Connected:', socket.id)
    })

    socket.on('disconnect', () => {
      dispatch(setConnected(false))
      console.info('[Socket] Disconnected')
    })

    socket.on('receive_message', ({ bookingId, message }) => {
      dispatch(addMessage({ bookingId, message }))
    })

    socket.on('typing', ({ bookingId, isTyping }) => {
      dispatch(setTyping({ bookingId, isTyping }))
    })

    socket.on('room_history', ({ bookingId, messages }) => {
      dispatch(initRoom({ bookingId, messages }))
    })

    socket.on('booking_update', (booking) => {
      dispatch(liveUpdateBooking(booking))
    })

    return () => {
      socket.disconnect()
      dispatch(setSocket(null))
      dispatch(setConnected(false))
    }
  }, [token, dispatch])

  // ── Emit helpers ──────────────────────────────────────────────────────────

  const joinRoom = useCallback((bookingId) => {
    socketRef.current?.emit('join_room', { bookingId })
  }, [])

  const leaveRoom = useCallback((bookingId) => {
    socketRef.current?.emit('leave_room', { bookingId })
  }, [])

  const sendMessage = useCallback((bookingId, content) => {
    socketRef.current?.emit('send_message', { bookingId, content })
  }, [])

  const emitTyping = useCallback((bookingId, isTyping) => {
    socketRef.current?.emit('typing', { bookingId, isTyping })
  }, [])

  return { joinRoom, leaveRoom, sendMessage, emitTyping, socket: socketRef.current }
}