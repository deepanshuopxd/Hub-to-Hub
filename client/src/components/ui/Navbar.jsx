import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Car, BookOpen, Map,
  ShieldCheck, MessageSquare, TrendingUp,
  LogOut, ChevronRight, Bell, Wallet,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { formatINR, initials } from '../../utils/formatters'
import { useSelector } from 'react-redux'
import { selectTotalUnread } from '../../store/slices/chatSlice'

// ── Sidebar nav items ────────────────────────────────────────────────────────

const customerNav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
  { to: '/vehicles',   icon: Car,             label: 'Browse Cars' },
  { to: '/bookings',   icon: BookOpen,        label: 'My Bookings' },
  { to: '/tracking',   icon: Map,             label: 'Live Track'  },
  { to: '/kyc',        icon: ShieldCheck,     label: 'KYC Verify'  },
  { to: '/chat',       icon: MessageSquare,   label: 'Messages'    },
]

const vendorNav = [
  { to: '/vendor',         icon: TrendingUp,   label: 'Overview'    },
  { to: '/vendor/fleet',   icon: Car,          label: 'My Fleet'    },
  { to: '/vendor/bookings',icon: BookOpen,     label: 'Bookings'    },
  { to: '/vendor/chat',    icon: MessageSquare,label: 'Messages'    },
]

// ── Component ─────────────────────────────────────────────────────────────────

const Navbar = () => {
  const { user, isVendor, handleLogout } = useAuth()
  const location   = useLocation()
  const unread     = useSelector(selectTotalUnread)
  const [collapsed, setCollapsed] = useState(false)

  const navItems = isVendor ? vendorNav : customerNav

  return (
    <aside
      className={`
        fixed left-0 top-0 h-screen bg-brand-slate border-r border-white/8
        flex flex-col z-40 transition-all duration-300
        ${collapsed ? 'w-16' : 'w-64'}
      `}
    >
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-white/8">
        {!collapsed && (
          <Link to={isVendor ? '/vendor' : '/dashboard'} className="flex items-center gap-2">
            <span className="font-display text-2xl text-brand-amber tracking-wider">
              HUB<span className="text-brand-cream">DRIVE</span>
            </span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 text-brand-muted hover:text-brand-amber transition-colors"
        >
          <ChevronRight
            size={16}
            className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = location.pathname === to ||
                         (to !== '/dashboard' && to !== '/vendor' && location.pathname.startsWith(to))
          const isChat = label === 'Messages'

          return (
            <Link
              key={to}
              to={to}
              className={`nav-item ${active ? 'active' : ''}`}
              title={collapsed ? label : ''}
            >
              <div className="relative flex-shrink-0">
                <Icon size={18} />
                {isChat && unread > 0 && (
                  <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-red rounded-full
                                   flex items-center justify-center font-mono text-[8px] text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </div>
              {!collapsed && <span className="text-sm">{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t border-white/8 p-4">
        {!collapsed ? (
          <>
            {/* Wallet (customers only) */}
            {!isVendor && user?.wallet && (
              <div className="flex items-center gap-2 px-2 py-2 mb-3 bg-brand-mid/40 border border-white/8">
                <Wallet size={14} className="text-brand-amber flex-shrink-0" />
                <div>
                  <div className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">Wallet</div>
                  <div className="font-mono text-xs text-brand-cream">{formatINR(user.wallet.balance)}</div>
                </div>
              </div>
            )}

            {/* Profile */}
            <div className="flex items-center gap-3 px-2 py-2 mb-2">
              <div className="w-8 h-8 bg-brand-amber/20 border border-brand-amber/30 flex items-center justify-center flex-shrink-0">
                <span className="font-display text-sm text-brand-amber">{initials(user?.name)}</span>
              </div>
              <div className="min-w-0">
                <div className="text-sm text-brand-cream truncate font-medium">{user?.name}</div>
                <div className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
                  {isVendor ? 'Vendor' : 'Customer'}
                </div>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="w-full nav-item text-brand-red/70 hover:text-brand-red hover:bg-brand-red/5 hover:border-l-brand-red"
            >
              <LogOut size={16} />
              <span className="text-sm">Sign Out</span>
            </button>
          </>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center p-2 text-brand-muted hover:text-brand-red transition-colors"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        )}
      </div>
    </aside>
  )
}

export default Navbar