// // import { useState } from 'react'
// // import { Link, useLocation } from 'react-router-dom'
// // import {
// //   LayoutDashboard, Car, BookOpen, Map,
// //   ShieldCheck, MessageSquare, TrendingUp,
// //   LogOut, ChevronRight, Bell, Wallet,
// // } from 'lucide-react'
// // import { useAuth } from '../../hooks/useAuth'
// // import { formatINR, initials } from '../../utils/formatters'
// // import { useSelector } from 'react-redux'
// // import { selectTotalUnread } from '../../store/slices/chatSlice'

// // // ── Sidebar nav items ────────────────────────────────────────────────────────

// // const customerNav = [
// //   { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'  },
// //   { to: '/vehicles',   icon: Car,             label: 'Browse Cars' },
// //   { to: '/bookings',   icon: BookOpen,        label: 'My Bookings' },
// //   { to: '/tracking',   icon: Map,             label: 'Live Track'  },
// //   { to: '/kyc',        icon: ShieldCheck,     label: 'KYC Verify'  },
// //   { to: '/chat',       icon: MessageSquare,   label: 'Messages'    },
// // ]

// // const vendorNav = [
// //   { to: '/vendor',         icon: TrendingUp,   label: 'Overview'    },
// //   { to: '/vendor/fleet',   icon: Car,          label: 'My Fleet'    },
// //   { to: '/vendor/bookings',icon: BookOpen,     label: 'Bookings'    },
// //   { to: '/vendor/chat',    icon: MessageSquare,label: 'Messages'    },
// // ]

// // // ── Component ─────────────────────────────────────────────────────────────────

// // const Navbar = () => {
// //   const { user, isVendor, handleLogout } = useAuth()
// //   const location   = useLocation()
// //   const unread     = useSelector(selectTotalUnread)
// //   const [collapsed, setCollapsed] = useState(false)

// //   const navItems = isVendor ? vendorNav : customerNav

// //   return (
// //     <aside
// //       className={`
// //         fixed left-0 top-0 h-screen bg-brand-slate border-r border-white/8
// //         flex flex-col z-40 transition-all duration-300
// //         ${collapsed ? 'w-16' : 'w-64'}
// //       `}
// //     >
// //       {/* Logo */}
// //       <div className="flex items-center justify-between px-4 py-5 border-b border-white/8">
// //         {!collapsed && (
// //           <Link to={isVendor ? '/vendor' : '/dashboard'} className="flex items-center gap-2">
// //             <span className="font-display text-2xl text-brand-amber tracking-wider">
// //               HUB<span className="text-brand-cream">DRIVE</span>
// //             </span>
// //           </Link>
// //         )}
// //         <button
// //           onClick={() => setCollapsed(!collapsed)}
// //           className="p-1.5 text-brand-muted hover:text-brand-amber transition-colors"
// //         >
// //           <ChevronRight
// //             size={16}
// //             className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
// //           />
// //         </button>
// //       </div>

// //       {/* Nav items */}
// //       <nav className="flex-1 py-4 overflow-y-auto">
// //         {navItems.map(({ to, icon: Icon, label }) => {
// //           const active = location.pathname === to ||
// //                          (to !== '/dashboard' && to !== '/vendor' && location.pathname.startsWith(to))
// //           const isChat = label === 'Messages'

// //           return (
// //             <Link
// //               key={to}
// //               to={to}
// //               className={`nav-item ${active ? 'active' : ''}`}
// //               title={collapsed ? label : ''}
// //             >
// //               <div className="relative flex-shrink-0">
// //                 <Icon size={18} />
// //                 {isChat && unread > 0 && (
// //                   <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-red rounded-full
// //                                    flex items-center justify-center font-mono text-[8px] text-white">
// //                     {unread > 9 ? '9+' : unread}
// //                   </span>
// //                 )}
// //               </div>
// //               {!collapsed && <span className="text-sm">{label}</span>}
// //             </Link>
// //           )
// //         })}
// //       </nav>

// //       {/* User section */}
// //       <div className="border-t border-white/8 p-4">
// //         {!collapsed ? (
// //           <>
// //             {/* Wallet (customers only) */}
// //             {!isVendor && user?.wallet && (
// //               <div className="flex items-center gap-2 px-2 py-2 mb-3 bg-brand-mid/40 border border-white/8">
// //                 <Wallet size={14} className="text-brand-amber flex-shrink-0" />
// //                 <div>
// //                   <div className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">Wallet</div>
// //                   <div className="font-mono text-xs text-brand-cream">{formatINR(user.wallet.balance)}</div>
// //                 </div>
// //               </div>
// //             )}

// //             {/* Profile */}
// //             <div className="flex items-center gap-3 px-2 py-2 mb-2">
// //               <div className="w-8 h-8 bg-brand-amber/20 border border-brand-amber/30 flex items-center justify-center flex-shrink-0">
// //                 <span className="font-display text-sm text-brand-amber">{initials(user?.name)}</span>
// //               </div>
// //               <div className="min-w-0">
// //                 <div className="text-sm text-brand-cream truncate font-medium">{user?.name}</div>
// //                 <div className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
// //                   {isVendor ? 'Vendor' : 'Customer'}
// //                 </div>
// //               </div>
// //             </div>

// //             <button
// //               onClick={handleLogout}
// //               className="w-full nav-item text-brand-red/70 hover:text-brand-red hover:bg-brand-red/5 hover:border-l-brand-red"
// //             >
// //               <LogOut size={16} />
// //               <span className="text-sm">Sign Out</span>
// //             </button>
// //           </>
// //         ) : (
// //           <button
// //             onClick={handleLogout}
// //             className="w-full flex items-center justify-center p-2 text-brand-muted hover:text-brand-red transition-colors"
// //             title="Sign Out"
// //           >
// //             <LogOut size={18} />
// //           </button>
// //         )}
// //       </div>
// //     </aside>
// //   )
// // }

// // export default Navbar

// import { useState } from 'react'
// import { Link, useLocation } from 'react-router-dom'
// import {
//   LayoutDashboard, Car, BookOpen, Map,
//   ShieldCheck, MessageSquare, TrendingUp,
//   LogOut, ChevronRight, Wallet, Menu, X,
// } from 'lucide-react'
// import { useAuth } from '../../hooks/useAuth'
// import { formatINR, initials } from '../../utils/formatters'
// import { useSelector } from 'react-redux'
// import { selectTotalUnread } from '../../store/slices/chatSlice'

// const customerNav = [
//   { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'   },
//   { to: '/vehicles',   icon: Car,             label: 'Browse Cars' },
//   { to: '/bookings',   icon: BookOpen,        label: 'Bookings'    },
//   { to: '/tracking',   icon: Map,             label: 'Track'       },
//   { to: '/kyc',        icon: ShieldCheck,     label: 'KYC'         },
//   { to: '/chat',       icon: MessageSquare,   label: 'Messages'    },
// ]

// const vendorNav = [
//   { to: '/vendor',          icon: TrendingUp,    label: 'Overview'  },
//   { to: '/vendor/fleet',    icon: Car,           label: 'Fleet'     },
//   { to: '/vendor/bookings', icon: BookOpen,      label: 'Bookings'  },
//   { to: '/vendor/chat',     icon: MessageSquare, label: 'Messages'  },
// ]

// const Navbar = () => {
//   const { user, isVendor, handleLogout } = useAuth()
//   const location   = useLocation()
//   const unread     = useSelector(selectTotalUnread)
//   const [collapsed, setCollapsed] = useState(false)
//   const [mobileOpen, setMobileOpen] = useState(false)

//   const navItems = isVendor ? vendorNav : customerNav

//   const isActive = (to) =>
//     location.pathname === to ||
//     (to !== '/dashboard' && to !== '/vendor' && location.pathname.startsWith(to))

//   // ── Desktop Sidebar ──────────────────────────────────────────────────────
//   const DesktopSidebar = () => (
//     <aside className={`
//       hidden md:flex fixed left-0 top-0 h-screen bg-brand-slate border-r border-white/8
//       flex-col z-40 transition-all duration-300
//       ${collapsed ? 'w-16' : 'w-64'}
//     `}>
//       {/* Logo */}
//       <div className="flex items-center justify-between px-4 py-5 border-b border-white/8">
//         {!collapsed && (
//           <Link to={isVendor ? '/vendor' : '/dashboard'} className="flex items-center gap-2">
//             <span className="font-display text-2xl text-brand-amber tracking-wider">
//               HUB<span className="text-brand-cream">DRIVE</span>
//             </span>
//           </Link>
//         )}
//         <button
//           onClick={() => setCollapsed(!collapsed)}
//           className="p-1.5 text-brand-muted hover:text-brand-amber transition-colors ml-auto"
//         >
//           <ChevronRight
//             size={16}
//             className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
//           />
//         </button>
//       </div>

//       {/* Nav items */}
//       <nav className="flex-1 py-4 overflow-y-auto">
//         {navItems.map(({ to, icon: Icon, label }) => (
//           <Link
//             key={to}
//             to={to}
//             className={`nav-item ${isActive(to) ? 'active' : ''}`}
//             title={collapsed ? label : ''}
//           >
//             <div className="relative flex-shrink-0">
//               <Icon size={18} />
//               {label === 'Messages' && unread > 0 && (
//                 <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-red rounded-full
//                                  flex items-center justify-center font-mono text-[8px] text-white">
//                   {unread > 9 ? '9+' : unread}
//                 </span>
//               )}
//             </div>
//             {!collapsed && <span className="text-sm">{label}</span>}
//           </Link>
//         ))}
//       </nav>

//       {/* User section */}
//       <div className="border-t border-white/8 p-4">
//         {!collapsed ? (
//           <>
//             {!isVendor && user?.wallet && (
//               <div className="flex items-center gap-2 px-2 py-2 mb-3 bg-brand-mid/40 border border-white/8">
//                 <Wallet size={14} className="text-brand-amber flex-shrink-0" />
//                 <div className="min-w-0">
//                   <div className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">Wallet</div>
//                   <div className="font-mono text-xs text-brand-cream">{formatINR(user.wallet.balance)}</div>
//                 </div>
//               </div>
//             )}
//             <div className="flex items-center gap-3 px-2 py-2 mb-2">
//               <div className="w-8 h-8 bg-brand-amber/20 border border-brand-amber/30 flex items-center justify-center flex-shrink-0">
//                 <span className="font-display text-sm text-brand-amber">{initials(user?.name)}</span>
//               </div>
//               <div className="min-w-0">
//                 <div className="text-sm text-brand-cream truncate font-medium">{user?.name}</div>
//                 <div className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">
//                   {isVendor ? 'Vendor' : 'Customer'}
//                 </div>
//               </div>
//             </div>
//             <button
//               onClick={handleLogout}
//               className="w-full nav-item text-brand-red/70 hover:text-brand-red hover:bg-brand-red/5"
//             >
//               <LogOut size={16} />
//               <span className="text-sm">Sign Out</span>
//             </button>
//           </>
//         ) : (
//           <button
//             onClick={handleLogout}
//             className="w-full flex items-center justify-center p-2 text-brand-muted hover:text-brand-red transition-colors"
//             title="Sign Out"
//           >
//             <LogOut size={18} />
//           </button>
//         )}
//       </div>
//     </aside>
//   )

//   // ── Mobile Top Bar ────────────────────────────────────────────────────────
//   const MobileTopBar = () => (
//     <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-brand-slate border-b border-white/8 flex items-center justify-between px-4 z-50">
//       <Link to={isVendor ? '/vendor' : '/dashboard'}>
//         <span className="font-display text-xl text-brand-amber tracking-wider">
//           HUB<span className="text-brand-cream">DRIVE</span>
//         </span>
//       </Link>

//       <div className="flex items-center gap-3">
//         {/* Wallet badge */}
//         {!isVendor && user?.wallet && (
//           <div className="flex items-center gap-1 px-2 py-1 bg-brand-mid/60 border border-white/8">
//             <Wallet size={12} className="text-brand-amber" />
//             <span className="font-mono text-xs text-brand-cream">{formatINR(user.wallet.balance)}</span>
//           </div>
//         )}
//         {/* Unread badge */}
//         {unread > 0 && (
//           <span className="w-5 h-5 bg-brand-red rounded-full flex items-center justify-center font-mono text-[9px] text-white">
//             {unread > 9 ? '9+' : unread}
//           </span>
//         )}
//         <button
//           onClick={() => setMobileOpen(!mobileOpen)}
//           className="p-1.5 text-brand-muted hover:text-brand-amber"
//         >
//           {mobileOpen ? <X size={20} /> : <Menu size={20} />}
//         </button>
//       </div>

//       {/* Dropdown menu */}
//       {mobileOpen && (
//         <div className="absolute top-14 left-0 right-0 bg-brand-slate border-b border-white/8 shadow-xl">
//           <nav className="py-2">
//             {navItems.map(({ to, icon: Icon, label }) => (
//               <Link
//                 key={to}
//                 to={to}
//                 onClick={() => setMobileOpen(false)}
//                 className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors
//                   ${isActive(to)
//                     ? 'text-brand-amber bg-brand-amber/5 border-l-2 border-brand-amber'
//                     : 'text-brand-muted hover:text-brand-cream hover:bg-white/4'
//                   }`}
//               >
//                 <Icon size={18} />
//                 <span>{label}</span>
//                 {label === 'Messages' && unread > 0 && (
//                   <span className="ml-auto w-5 h-5 bg-brand-red rounded-full flex items-center justify-center font-mono text-[9px] text-white">
//                     {unread > 9 ? '9+' : unread}
//                   </span>
//                 )}
//               </Link>
//             ))}
//           </nav>

//           {/* User row */}
//           <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
//             <div className="flex items-center gap-3">
//               <div className="w-8 h-8 bg-brand-amber/20 border border-brand-amber/30 flex items-center justify-center">
//                 <span className="font-display text-sm text-brand-amber">{initials(user?.name)}</span>
//               </div>
//               <div>
//                 <div className="text-sm text-brand-cream font-medium">{user?.name}</div>
//                 <div className="font-mono text-[10px] text-brand-muted uppercase">{isVendor ? 'Vendor' : 'Customer'}</div>
//               </div>
//             </div>
//             <button
//               onClick={() => { handleLogout(); setMobileOpen(false) }}
//               className="flex items-center gap-1.5 text-brand-red/70 hover:text-brand-red text-sm"
//             >
//               <LogOut size={14} /> Sign Out
//             </button>
//           </div>
//         </div>
//       )}
//     </header>
//   )

//   // ── Mobile Bottom Nav ─────────────────────────────────────────────────────
//   const MobileBottomNav = () => (
//     <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-slate border-t border-white/8 z-40 flex">
//       {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
//         <Link
//           key={to}
//           to={to}
//           className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative
//             ${isActive(to) ? 'text-brand-amber' : 'text-brand-muted hover:text-brand-cream'}`}
//         >
//           <div className="relative">
//             <Icon size={20} />
//             {label === 'Messages' && unread > 0 && (
//               <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-red rounded-full
//                                flex items-center justify-center font-mono text-[8px] text-white">
//                 {unread > 9 ? '9+' : unread}
//               </span>
//             )}
//           </div>
//           <span className="text-[9px] font-mono tracking-wide">{label}</span>
//           {isActive(to) && (
//             <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brand-amber" />
//           )}
//         </Link>
//       ))}
//     </nav>
//   )

//   return (
//     <>
//       <DesktopSidebar />
//       <MobileTopBar />
//       <MobileBottomNav />
//     </>
//   )
// }

// export default Navbar














































import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Car, BookOpen, Map,
  ShieldCheck, MessageSquare, TrendingUp,
  LogOut, ChevronRight, Wallet, Menu, X,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { formatINR, initials } from '../../utils/formatters'
import { useSelector } from 'react-redux'
import { selectTotalUnread } from '../../store/slices/chatSlice'

const customerNav = [
  { to: '/dashboard',  icon: LayoutDashboard, label: 'Dashboard'   },
  { to: '/vehicles',   icon: Car,             label: 'Browse Cars' },
  { to: '/bookings',   icon: BookOpen,        label: 'Bookings'    },
  { to: '/tracking',   icon: Map,             label: 'Track'       },
  { to: '/kyc',        icon: ShieldCheck,     label: 'KYC'         },
  { to: '/chat',       icon: MessageSquare,   label: 'Messages'    },
  { to: '/wallet',     icon: Wallet,          label: 'Wallet'      },
]

const vendorNav = [
  { to: '/vendor',          icon: TrendingUp,    label: 'Overview'  },
  { to: '/vendor/fleet',    icon: Car,           label: 'Fleet'     },
  { to: '/vendor/bookings', icon: BookOpen,      label: 'Bookings'  },
  { to: '/vendor/chat',     icon: MessageSquare, label: 'Messages'  },
]

const Navbar = () => {
  const { user, isVendor, handleLogout } = useAuth()
  const location   = useLocation()
  const unread     = useSelector(selectTotalUnread)
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = isVendor ? vendorNav : customerNav

  const isActive = (to) =>
    location.pathname === to ||
    (to !== '/dashboard' && to !== '/vendor' && location.pathname.startsWith(to))

  // ── Desktop Sidebar ──────────────────────────────────────────────────────
  const DesktopSidebar = () => (
    <aside className={`
      hidden md:flex fixed left-0 top-0 h-screen bg-brand-slate border-r border-white/8
      flex-col z-40 transition-all duration-300
      ${collapsed ? 'w-16' : 'w-64'}
    `}>
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
          className="p-1.5 text-brand-muted hover:text-brand-amber transition-colors ml-auto"
        >
          <ChevronRight
            size={16}
            className={`transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`}
          />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <Link
            key={to}
            to={to}
            className={`nav-item ${isActive(to) ? 'active' : ''}`}
            title={collapsed ? label : ''}
          >
            <div className="relative flex-shrink-0">
              <Icon size={18} />
              {label === 'Messages' && unread > 0 && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-red rounded-full
                                 flex items-center justify-center font-mono text-[8px] text-white">
                  {unread > 9 ? '9+' : unread}
                </span>
              )}
            </div>
            {!collapsed && <span className="text-sm">{label}</span>}
          </Link>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-white/8 p-4">
        {!collapsed ? (
          <>
            {!isVendor && user?.wallet && (
              <div className="flex items-center gap-2 px-2 py-2 mb-3 bg-brand-mid/40 border border-white/8">
                <Wallet size={14} className="text-brand-amber flex-shrink-0" />
                <div className="min-w-0">
                  <div className="font-mono text-[10px] tracking-wider text-brand-muted uppercase">Wallet</div>
                  <div className="font-mono text-xs text-brand-cream">{formatINR(user.wallet.balance)}</div>
                </div>
              </div>
            )}
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
              className="w-full nav-item text-brand-red/70 hover:text-brand-red hover:bg-brand-red/5"
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

  // ── Mobile Top Bar ────────────────────────────────────────────────────────
  const MobileTopBar = () => (
    <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-brand-slate border-b border-white/8 flex items-center justify-between px-4 z-50">
      <Link to={isVendor ? '/vendor' : '/dashboard'}>
        <span className="font-display text-xl text-brand-amber tracking-wider">
          HUB<span className="text-brand-cream">DRIVE</span>
        </span>
      </Link>

      <div className="flex items-center gap-3">
        {/* Wallet badge */}
        {!isVendor && user?.wallet && (
          <div className="flex items-center gap-1 px-2 py-1 bg-brand-mid/60 border border-white/8">
            <Wallet size={12} className="text-brand-amber" />
            <span className="font-mono text-xs text-brand-cream">{formatINR(user.wallet.balance)}</span>
          </div>
        )}
        {/* Unread badge */}
        {unread > 0 && (
          <span className="w-5 h-5 bg-brand-red rounded-full flex items-center justify-center font-mono text-[9px] text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-1.5 text-brand-muted hover:text-brand-amber"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Dropdown menu */}
      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 bg-brand-slate border-b border-white/8 shadow-xl">
          <nav className="py-2">
            {navItems.map(({ to, icon: Icon, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 text-sm transition-colors
                  ${isActive(to)
                    ? 'text-brand-amber bg-brand-amber/5 border-l-2 border-brand-amber'
                    : 'text-brand-muted hover:text-brand-cream hover:bg-white/4'
                  }`}
              >
                <Icon size={18} />
                <span>{label}</span>
                {label === 'Messages' && unread > 0 && (
                  <span className="ml-auto w-5 h-5 bg-brand-red rounded-full flex items-center justify-center font-mono text-[9px] text-white">
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
              </Link>
            ))}
          </nav>

          {/* User row */}
          <div className="px-4 py-3 border-t border-white/8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-brand-amber/20 border border-brand-amber/30 flex items-center justify-center">
                <span className="font-display text-sm text-brand-amber">{initials(user?.name)}</span>
              </div>
              <div>
                <div className="text-sm text-brand-cream font-medium">{user?.name}</div>
                <div className="font-mono text-[10px] text-brand-muted uppercase">{isVendor ? 'Vendor' : 'Customer'}</div>
              </div>
            </div>
            <button
              onClick={() => { handleLogout(); setMobileOpen(false) }}
              className="flex items-center gap-1.5 text-brand-red/70 hover:text-brand-red text-sm"
            >
              <LogOut size={14} /> Sign Out
            </button>
          </div>
        </div>
      )}
    </header>
  )

  // ── Mobile Bottom Nav ─────────────────────────────────────────────────────
  const MobileBottomNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-brand-slate border-t border-white/8 z-40 flex">
      {navItems.slice(0, 5).map(({ to, icon: Icon, label }) => (
        <Link
          key={to}
          to={to}
          className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors relative
            ${isActive(to) ? 'text-brand-amber' : 'text-brand-muted hover:text-brand-cream'}`}
        >
          <div className="relative">
            <Icon size={20} />
            {label === 'Messages' && unread > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-brand-red rounded-full
                               flex items-center justify-center font-mono text-[8px] text-white">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </div>
          <span className="text-[9px] font-mono tracking-wide">{label}</span>
          {isActive(to) && (
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-brand-amber" />
          )}
        </Link>
      ))}
    </nav>
  )

  return (
    <>
      <DesktopSidebar />
      <MobileTopBar />
      <MobileBottomNav />
    </>
  )
}

export default Navbar