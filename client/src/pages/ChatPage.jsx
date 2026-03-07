import { useEffect, useState, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { Send, MessageSquare, Car } from 'lucide-react'
import { useSocket } from '../hooks/useSocket'
import { useAuth } from '../hooks/useAuth'
import { selectRoomMessages, selectTyping } from '../store/slices/chatSlice'
import { selectMyBookings, selectVendorBookings } from '../store/slices/bookingSlice'
import { formatRelative, initials } from '../utils/formatters'

// ── Message bubble ────────────────────────────────────────────────────────────
const MessageBubble = ({ msg, isOwn }) => (
  <div className={`flex items-end gap-2 mb-3 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}>
    <div className={`w-7 h-7 rounded-sm flex items-center justify-center flex-shrink-0 font-display text-xs
      ${isOwn ? 'bg-brand-amber/20 text-brand-amber' : 'bg-brand-mid text-brand-cream'}`}>
      {initials(msg.senderName || '?')}
    </div>
    <div className={`max-w-[70%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
      <div className={`px-4 py-2.5 text-sm leading-relaxed
        ${isOwn
          ? 'bg-brand-amber text-brand-black'
          : 'bg-brand-mid text-brand-cream border border-white/8'
        }`}>
        {msg.content}
      </div>
      <span className="font-mono text-[10px] text-brand-muted px-1">
        {formatRelative(msg.createdAt || new Date())}
      </span>
    </div>
  </div>
)

// ── Chat room ─────────────────────────────────────────────────────────────────
const ChatRoom = ({ bookingId }) => {
  const { user }     = useAuth()
  const { sendMessage, joinRoom, leaveRoom, emitTyping } = useSocket()
  const messages = useSelector(selectRoomMessages(bookingId))
  const isTyping = useSelector(selectTyping(bookingId))

  const [text,      setText]      = useState('')
  const bottomRef  = useRef(null)
  const typingTimer= useRef(null)

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
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-5 space-y-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center gap-3">
            <MessageSquare size={36} className="text-brand-muted/40" />
            <p className="font-mono text-xs text-brand-muted">No messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble key={msg._id || i} msg={msg} isOwn={msg.senderId === user?._id} />
          ))
        )}
        {isTyping && (
          <div className="flex items-center gap-2">
            <div className="flex gap-1 px-4 py-2.5 bg-brand-mid border border-white/8">
              {[0,1,2].map(i => (
                <div key={i} className="w-1.5 h-1.5 bg-brand-muted rounded-full animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="flex gap-2 p-4 border-t border-white/8">
        <input
          value={text}
          onChange={handleTyping}
          placeholder="Type a message..."
          className="input-field flex-1"
          autoFocus
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="btn-primary px-4 py-3 flex-shrink-0 disabled:opacity-40"
        >
          <Send size={16} />
        </button>
      </form>
    </div>
  )
}

// ── Main Chat Page ────────────────────────────────────────────────────────────
const ChatPage = () => {
  const { bookingId } = useParams()
  const { isVendor }  = useAuth()
  const myBookings    = useSelector(selectMyBookings)
  const vendorBooks   = useSelector(selectVendorBookings)
  const allBookings   = isVendor ? vendorBooks : myBookings
  const [selected, setSelected] = useState(bookingId || null)

  const activeBookings = allBookings.filter(b =>
    b.status === 'active' || b.status === 'pending' || b.status === 'in_transit'
  )

  return (
    <div className="h-[calc(100vh-8rem)] flex border border-white/8 overflow-hidden animate-[fadeUp_0.5s_ease_forwards]">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-white/8 flex flex-col bg-brand-slate">
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
            activeBookings.map(b => (
              <button
                key={b._id}
                onClick={() => setSelected(b._id)}
                className={`w-full text-left p-4 border-b border-white/6 transition-all
                  ${selected === b._id ? 'bg-brand-amber/5 border-l-2 border-l-brand-amber' : 'hover:bg-brand-mid/40'}`}
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
                      {b.startHub?.name} → {b.endHub?.name}
                    </p>
                    {isVendor && (
                      <p className="font-mono text-[10px] text-brand-amber truncate">{b.user?.name}</p>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col bg-brand-black">
        {selected ? (
          <>
            {/* Header */}
            {(() => {
              const b = allBookings.find(x => x._id === selected)
              return b ? (
                <div className="p-4 border-b border-white/8 flex items-center gap-3">
                  <Car size={16} className="text-brand-amber" />
                  <div>
                    <p className="text-sm font-medium text-brand-cream">{b.vehicle?.make} {b.vehicle?.model}</p>
                    <p className="font-mono text-xs text-brand-muted">{b.startHub?.name} → {b.endHub?.name}</p>
                  </div>
                </div>
              ) : null
            })()}
            <ChatRoom bookingId={selected} />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
            <MessageSquare size={48} className="text-brand-muted/30" />
            <div>
              <p className="font-display text-2xl text-brand-muted">Select a conversation</p>
              <p className="font-mono text-xs text-brand-muted mt-2">Pick a booking from the left to start messaging</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ChatPage