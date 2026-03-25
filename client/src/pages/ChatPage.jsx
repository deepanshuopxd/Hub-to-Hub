import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { Send, MessageSquare, Car, Users, MapPin } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../hooks/useAuth'
import { selectRoomMessages, selectTyping, initRoom } from '../store/slices/chatSlice'
import { selectMyBookings, selectVendorBookings, fetchMyBookings, fetchVendorBookings } from '../store/slices/bookingSlice'
import { formatRelative, initials, formatDateTime } from '../utils/formatters'

// ── Role color map ────────────────────────────────────────────────────────────
const roleColor = (role) => ({
  customer:     'bg-blue-400/20 text-blue-400',
  center_admin: 'bg-brand-amber/20 text-brand-amber',
  start_vendor: 'bg-brand-amber/20 text-brand-amber',
  end_vendor:   'bg-green-400/20 text-green-400',
}[role] || 'bg-brand-mid text-brand-cream')

const roleLabel = (role) => ({
  customer:     'Customer',
  center_admin: 'Vendor',
  start_vendor: 'Pickup Vendor',
  end_vendor:   'Dropoff Vendor',
}[role] || role)

// ── Participants bar ──────────────────────────────────────────────────────────
const ParticipantsBar = ({ booking, currentUserId }) => {
  if (!booking) return null

  const participants = [
    booking.user     && { id: booking.user._id     || booking.user,     name: booking.user?.name     || 'Customer',      role: 'customer'     },
    booking.startVendor && { id: booking.startVendor._id || booking.startVendor, name: booking.startVendor?.rentalService?.name || booking.startVendor?.name || 'Pickup Vendor', role: 'start_vendor' },
    booking.endVendor   && { id: booking.endVendor._id   || booking.endVendor,   name: booking.endVendor?.rentalService?.name   || booking.endVendor?.name   || 'Dropoff Vendor', role: 'end_vendor'   },
  ].filter(Boolean)

  return (
    <div className="px-4 py-2 border-b border-white/8 bg-brand-mid/20 flex items-center gap-2 flex-wrap">
      <Users size={12} className="text-brand-muted shrink-0" />
      <span className="font-mono text-[10px] text-brand-muted uppercase tracking-wider">Participants:</span>
      {participants.map((p, i) => (
        <div key={i}
          className={"flex items-center gap-1 px-2 py-0.5 " + roleColor(p.role)}>
          <span className="font-mono text-[10px] font-medium truncate max-w-[120px]">{p.name}</span>
          <span className="font-mono text-[9px] opacity-70">({roleLabel(p.role)})</span>
          {p.id?.toString() === currentUserId && (
            <span className="font-mono text-[9px] opacity-70">· you</span>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isOwn }) => (
  <div className={"flex items-end gap-2 mb-3 " + (isOwn ? 'flex-row-reverse' : 'flex-row')}>
    <div className={"w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 font-display text-xs " +
      (isOwn
        ? 'bg-brand-amber/20 text-brand-amber'
        : msg.senderRole === 'center_admin'
          ? 'bg-green-400/20 text-green-400'
          : 'bg-brand-mid text-brand-cream'
      )}>
      {initials(msg.senderName || '?')}
    </div>
    <div className={"max-w-[70%] " + (isOwn ? 'items-end' : 'items-start') + " flex flex-col gap-1"}>
      {/* Sender name + role */}
      <span className="font-mono text-[9px] text-brand-muted px-1">
        {msg.senderName} · {roleLabel(msg.senderRole)}
      </span>
      <div className={"px-4 py-2.5 text-sm leading-relaxed " +
        (isOwn
          ? 'bg-brand-amber text-brand-black'
          : 'bg-brand-mid text-brand-cream border border-white/8'
        )}>
        {msg.content}
      </div>
      <span className="font-mono text-[10px] text-brand-muted px-1">
        {formatRelative(msg.createdAt || new Date())}
      </span>
    </div>
  </div>
)

// ── Chat room ─────────────────────────────────────────────────────────────────
const ChatRoom = ({ bookingId, booking }) => {
  const dispatch   = useDispatch()
  const { user }   = useAuth()
  const { sendMessage, joinRoom, leaveRoom, emitTyping } = useSocket()
  const messages   = useSelector(selectRoomMessages(bookingId))
  const typingInfo = useSelector(selectTyping(bookingId))

  const [text,       setText]       = useState('')
  const bottomRef    = useRef(null)
  const typingTimer  = useRef(null)

  useEffect(() => {
    joinRoom(bookingId)
    return () => leaveRoom(bookingId)
  }, [bookingId, joinRoom, leaveRoom])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    sendMessage(bookingId, text.trim())
    setText('')
    emitTyping(bookingId, false)
  }

  const handleTyping = (e) => {
    setText(e.target.value)
    emitTyping(bookingId, true)
    clearTimeout(typingTimer.current)
    typingTimer.current = setTimeout(() => emitTyping(bookingId, false), 1500)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Participants bar */}
      <ParticipantsBar booking={booking} currentUserId={user?._id} />

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <MessageSquare size={36} className="text-brand-muted/40" />
            <p className="font-mono text-xs text-brand-muted">
              No messages yet. All 3 parties can chat here.
            </p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg._id || i}
              msg={msg}
              isOwn={msg.senderId?.toString() === user?._id?.toString()}
            />
          ))
        )}

        {/* Typing indicator */}
        {typingInfo?.isTyping && (
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-brand-muted">{typingInfo.userName} is typing</span>
            <div className="flex gap-1">
              {[0,1,2].map(i => (
                <div key={i}
                  className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-3 sm:p-4 border-t border-white/8">
        <input
          value={text}
          onChange={handleTyping}
          placeholder="Message all parties..."
          className="input-field flex-1 text-sm"
          autoFocus
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn-primary px-4 py-2.5 flex-shrink-0 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

// ── Main ChatPage ─────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { bookingId }  = useParams()
  const dispatch       = useDispatch()
  const { user, isVendor } = useAuth()
  const myBookings     = useSelector(selectMyBookings)
  const vendorBooks    = useSelector(selectVendorBookings)

  // Combine — vendor may appear in bookings as startVendor OR endVendor
  const allBookings = isVendor ? vendorBooks : myBookings
  const [selected, setSelected] = useState(bookingId || null)

  useEffect(() => {
    if (isVendor) dispatch(fetchVendorBookings())
    else          dispatch(fetchMyBookings())
  }, [isVendor, dispatch])

  // Auto-select from URL param
  useEffect(() => {
    if (bookingId) setSelected(bookingId)
  }, [bookingId])

  const activeBookings = allBookings.filter(b =>
    ['pending', 'active', 'in_transit', 'completed'].includes(b.status)
  )

  const selectedBooking = allBookings.find(b => b._id === selected)

  return (
    <div className="h-[calc(100vh-8rem)] flex border border-white/8 overflow-hidden animate-[fadeUp_0.5s_ease_forwards]">

      {/* ── Sidebar ──────────────────────────────────────────────────────────── */}
      <div className="w-64 sm:w-72 flex-shrink-0 border-r border-white/8 flex flex-col bg-brand-slate">
        <div className="p-4 border-b border-white/8">
          <span className="section-eyebrow mb-0">Messages</span>
          <h2 className="font-display text-2xl text-brand-cream">Chat</h2>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeBookings.length === 0 ? (
            <div className="p-6 text-center">
              <Car size={28} className="text-brand-muted mx-auto mb-2" />
              <p className="font-mono text-xs text-brand-muted">No active bookings</p>
            </div>
          ) : (
            activeBookings.map(b => {
              const isEndVendor = b.endVendor?._id === user?._id || b.endVendor === user?._id
              const isStartVendor = b.startVendor?._id === user?._id || b.startVendor === user?._id

              return (
                <button
                  key={b._id}
                  onClick={() => setSelected(b._id)}
                  className={"w-full text-left p-3 sm:p-4 border-b border-white/6 transition-all " +
                    (selected === b._id
                      ? 'bg-brand-amber/5 border-l-2 border-l-brand-amber'
                      : 'hover:bg-brand-mid/40'
                    )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-brand-mid flex items-center justify-center flex-shrink-0">
                      <Car size={14} className="text-brand-amber" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-cream truncate">
                        {b.vehicle?.make} {b.vehicle?.model}
                      </p>
                      <p className="font-mono text-[10px] text-brand-muted truncate mt-0.5">
                        <MapPin size={9} className="inline mr-0.5" />
                        {b.startHub?.city || b.startHub?.name} → {b.endHub?.city || b.endHub?.name}
                      </p>
                      {/* Show who else is in this chat */}
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {isVendor && b.user?.name && (
                          <span className="font-mono text-[9px] bg-blue-400/10 text-blue-400 px-1">
                            {b.user.name}
                          </span>
                        )}
                        {isEndVendor && b.startVendor?.name && (
                          <span className="font-mono text-[9px] bg-brand-amber/10 text-brand-amber px-1">
                            {b.startVendor.rentalService?.name || b.startVendor.name}
                          </span>
                        )}
                        {isStartVendor && b.endVendor && (
                          <span className="font-mono text-[9px] bg-green-400/10 text-green-400 px-1">
                            {b.endVendor.rentalService?.name || b.endVendor.name || 'Dropoff Hub'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Chat area ────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col bg-brand-black min-w-0">
        {selected ? (
          <>
            {/* Header */}
            {selectedBooking && (
              <div className="p-3 sm:p-4 border-b border-white/8 flex items-center gap-3">
                <Car size={16} className="text-brand-amber shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-brand-cream truncate">
                    {selectedBooking.vehicle?.make} {selectedBooking.vehicle?.model}
                  </p>
                  <p className="font-mono text-xs text-brand-muted">
                    {selectedBooking.startHub?.city || selectedBooking.startHub?.name}
                    {' → '}
                    {selectedBooking.endHub?.city || selectedBooking.endHub?.name}
                  </p>
                </div>
              </div>
            )}
            <ChatRoom bookingId={selected} booking={selectedBooking} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4 p-8">
            <MessageSquare size={48} className="text-brand-muted/30" />
            <div>
              <p className="font-display text-2xl text-brand-muted">Select a conversation</p>
              <p className="font-mono text-xs text-brand-muted mt-2">
                Messages are shared between customer, pickup vendor and dropoff vendor
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage