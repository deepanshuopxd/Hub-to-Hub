// import { useEffect, useRef, useState } from 'react'
// import { Link } from 'react-router-dom'
// import {
//   ArrowRight, MapPin, Shield, Zap, Users,
//   Car, CheckCircle, ChevronDown,
// } from 'lucide-react'

// // ── Animated counter ──────────────────────────────────────────────────────────
// const Counter = ({ end, suffix = '', duration = 2000 }) => {
//   const [count, setCount] = useState(0)
//   const ref = useRef(null)
//   const started = useRef(false)

//   useEffect(() => {
//     const observer = new IntersectionObserver(([entry]) => {
//       if (entry.isIntersecting && !started.current) {
//         started.current = true
//         const startTime = performance.now()
//         const animate = (now) => {
//           const elapsed = now - startTime
//           const progress = Math.min(elapsed / duration, 1)
//           const eased = 1 - Math.pow(1 - progress, 3)
//           setCount(Math.round(eased * end))
//           if (progress < 1) requestAnimationFrame(animate)
//         }
//         requestAnimationFrame(animate)
//       }
//     }, { threshold: 0.3 })
//     if (ref.current) observer.observe(ref.current)
//     return () => observer.disconnect()
//   }, [end, duration])

//   return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
// }

// // ── Reveal wrapper ─────────────────────────────────────────────────────────────
// const Reveal = ({ children, delay = 0, className = '' }) => {
//   const ref = useRef(null)
//   const [visible, setVisible] = useState(false)

//   useEffect(() => {
//     const observer = new IntersectionObserver(
//       ([entry]) => { if (entry.isIntersecting) setVisible(true) },
//       { threshold: 0.1 }
//     )
//     if (ref.current) observer.observe(ref.current)
//     return () => observer.disconnect()
//   }, [])

//   return (
//     <div
//       ref={ref}
//       className={className}
//       style={{
//         opacity:    visible ? 1 : 0,
//         transform:  visible ? 'translateY(0)' : 'translateY(40px)',
//         transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
//       }}
//     >
//       {children}
//     </div>
//   )
// }

// // ── Hub network SVG animation ─────────────────────────────────────────────────
// const HubNetwork = () => {
//   const nodes = [
//     { id: 'MUM', label: 'Mumbai',    x: 18,  y: 55, primary: true },
//     { id: 'PUN', label: 'Pune',      x: 28,  y: 70, primary: true },
//     { id: 'LON', label: 'Lonavala',  x: 24,  y: 61, primary: false },
//     { id: 'BLR', label: 'Bangalore', x: 55,  y: 80, primary: true },
//     { id: 'HYD', label: 'Hyderabad', x: 52,  y: 55, primary: true },
//     { id: 'GOA', label: 'Goa',       x: 33,  y: 78, primary: true },
//     { id: 'DEL', label: 'Delhi',     x: 52,  y: 18, primary: true },
//     { id: 'CHN', label: 'Chennai',   x: 68,  y: 82, primary: true },
//   ]
//   const edges = [
//     ['MUM','PUN'],['MUM','LON'],['LON','PUN'],['MUM','DEL'],
//     ['HYD','BLR'],['BLR','CHN'],['HYD','CHN'],['PUN','GOA'],
//     ['HYD','MUM'],['DEL','HYD'],
//   ]
//   const [activeCar, setActiveCar] = useState(0)
//   const cars = edges.slice(0, 5)

//   useEffect(() => {
//     const t = setInterval(() => setActiveCar(a => (a + 1) % cars.length), 2200)
//     return () => clearInterval(t)
//   }, [])

//   const getNode = (id) => nodes.find(n => n.id === id)

//   return (
//     <div className="relative w-full h-full">
//       <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
//         <defs>
//           <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
//             <stop offset="0%" stopColor="#E8A020" stopOpacity="0.4"/>
//             <stop offset="100%" stopColor="#E8A020" stopOpacity="0"/>
//           </radialGradient>
//         </defs>

//         {/* Edges */}
//         {edges.map(([a, b], i) => {
//           const na = getNode(a), nb = getNode(b)
//           if (!na || !nb) return null
//           const isActive = cars[activeCar] && cars[activeCar][0] === a && cars[activeCar][1] === b
//           return (
//             <line key={i}
//               x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
//               stroke={isActive ? '#E8A020' : 'rgba(232,160,32,0.15)'}
//               strokeWidth={isActive ? 0.4 : 0.2}
//               strokeDasharray={isActive ? 'none' : '1 2'}
//               style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }}
//             />
//           )
//         })}

//         {/* Animated car dot */}
//         {cars[activeCar] && (() => {
//           const [a, b] = cars[activeCar]
//           const na = getNode(a), nb = getNode(b)
//           if (!na || !nb) return null
//           return (
//             <circle r="1.2" fill="#C93030"
//               style={{ filter: 'drop-shadow(0 0 2px #C93030)' }}>
//               <animateMotion dur="2.2s" repeatCount="indefinite"
//                 path={`M${na.x},${na.y} L${nb.x},${nb.y}`} />
//             </circle>
//           )
//         })()}

//         {/* Nodes */}
//         {nodes.map(n => (
//           <g key={n.id}>
//             <circle cx={n.x} cy={n.y} r={n.primary ? 3 : 2}
//               fill="rgba(232,160,32,0.08)" stroke="rgba(232,160,32,0.3)" strokeWidth="0.3">
//               <animate attributeName="r" values={`${n.primary?3:2};${n.primary?4:3};${n.primary?3:2}`}
//                 dur="3s" repeatCount="indefinite" begin={`${Math.random()*2}s`} />
//             </circle>
//             <circle cx={n.x} cy={n.y} r={n.primary ? 1.5 : 1} fill="#E8A020" />
//             <text x={n.x} y={n.y - 3} textAnchor="middle"
//               fontSize="2.8" fill="rgba(244,240,232,0.6)" fontFamily="Space Mono, monospace">
//               {n.label}
//             </text>
//           </g>
//         ))}
//       </svg>
//     </div>
//   )
// }

// // ── Main Landing Page ─────────────────────────────────────────────────────────
// const Landing = () => {
//   const [scrolled, setScrolled] = useState(false)
//   const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 })
//   const [cursorBig, setCursorBig] = useState(false)

//   useEffect(() => {
//     const onScroll = () => setScrolled(window.scrollY > 60)
//     const onMouse  = (e) => setCursorPos({ x: e.clientX, y: e.clientY })
//     window.addEventListener('scroll', onScroll)
//     window.addEventListener('mousemove', onMouse)
//     return () => {
//       window.removeEventListener('scroll', onScroll)
//       window.removeEventListener('mousemove', onMouse)
//     }
//   }, [])

//   const hoverBig   = () => setCursorBig(true)
//   const hoverSmall = () => setCursorBig(false)

//   return (
//     <div className="bg-brand-black text-brand-cream min-h-screen overflow-x-hidden" style={{ cursor: 'none' }}>
//       {/* Custom cursor */}
//       <div
//         className="fixed z-[9999] rounded-full pointer-events-none transition-[width,height] duration-200"
//         style={{
//           width:      cursorBig ? 40 : 12,
//           height:     cursorBig ? 40 : 12,
//           background: '#E8A020',
//           left:       cursorPos.x,
//           top:        cursorPos.y,
//           transform:  'translate(-50%,-50%)',
//           mixBlendMode: 'difference',
//         }}
//       />

//       {/* Noise overlay */}
//       <div className="fixed inset-0 pointer-events-none z-[999] opacity-30"
//         style={{
//           backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
//         }}
//       />

//       {/* ── NAV ── */}
//       <nav className={`fixed top-0 w-full z-50 flex items-center justify-between px-8 py-5 transition-all duration-400
//         ${scrolled ? 'bg-brand-black/90 backdrop-blur-md border-b border-white/8' : ''}`}>
//         <span className="font-display text-2xl text-brand-amber tracking-wider">
//           HUB<span className="text-brand-cream">DRIVE</span>
//         </span>
//         <div className="hidden md:flex items-center gap-8">
//           {['How it Works', 'For Vendors', 'Features'].map(item => (
//             <a key={item} href={`#${item.toLowerCase().replace(/ /g,'-')}`}
//               className="font-mono text-xs tracking-widest uppercase text-brand-muted hover:text-brand-amber transition-colors"
//               onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
//               {item}
//             </a>
//           ))}
//         </div>
//         <div className="flex items-center gap-3">
//           <Link to="/login"
//             className="font-mono text-xs tracking-widest uppercase text-brand-muted hover:text-brand-amber transition-colors px-4 py-2"
//             onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
//             Sign In
//           </Link>
//           <Link to="/register"
//             className="btn-primary py-2 px-5 text-xs"
//             onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
//             Get Started
//           </Link>
//         </div>
//       </nav>

//       {/* ── HERO ── */}
//       <section className="relative min-h-screen flex items-end pb-20 px-8 overflow-hidden">
//         {/* Animated grid */}
//         <div className="absolute inset-0 bg-grid opacity-60" />

//         {/* Radial glow */}
//         <div className="absolute inset-0"
//           style={{
//             background: 'radial-gradient(ellipse 70% 60% at 65% 35%, rgba(232,160,32,0.06) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 70%, rgba(201,48,48,0.04) 0%, transparent 60%)',
//           }}
//         />

//         {/* Giant background text */}
//         <div className="absolute top-12 right-0 font-display text-[22vw] text-brand-amber/[0.03] leading-none pointer-events-none select-none">
//           HUB
//         </div>

//         {/* Map visualization */}
//         <div className="absolute right-0 top-0 w-1/2 h-full opacity-40">
//           <HubNetwork />
//         </div>

//         <div className="relative z-10 max-w-3xl">
//           <div
//             style={{ animation: 'fadeUp 0.8s 0.2s both' }}
//             className="opacity-0"
//           >
//             <span className="font-mono text-xs tracking-[0.3em] uppercase text-brand-amber mb-5 block">
//               ✦ Decentralized Vehicle Rentals ✦
//             </span>
//           </div>

//           <div style={{ animation: 'fadeUp 0.8s 0.4s both' }} className="opacity-0">
//             <h1 className="font-display leading-[0.88] mb-6"
//               style={{ fontSize: 'clamp(5rem, 12vw, 12rem)' }}>
//               FROM<br/>
//               <span className="text-brand-amber">HUB</span><br/>
//               <span style={{ WebkitTextStroke: '1px rgba(244,240,232,0.4)', color: 'transparent' }}>
//                 TO HUB.
//               </span>
//             </h1>
//           </div>

//           <div style={{ animation: 'fadeUp 0.8s 0.6s both' }} className="opacity-0">
//             <p className="text-brand-muted text-lg leading-relaxed max-w-xl mb-10">
//               India's first decentralized vehicle rental network. Pick up at one hub,
//               drop off at another. Vendors earn from movement. Customers gain freedom.
//             </p>
//           </div>

//           <div style={{ animation: 'fadeUp 0.8s 0.8s both' }} className="opacity-0 flex flex-wrap gap-4 items-center">
//             <Link to="/register"
//               className="btn-primary flex items-center gap-3 text-sm px-8 py-4"
//               onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
//               Start for Free <ArrowRight size={18} />
//             </Link>
//             <Link to="/login"
//               className="btn-outline flex items-center gap-3 text-sm px-8 py-4"
//               onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
//               Sign In
//             </Link>
//           </div>
//         </div>

//         {/* Stats */}
//         <div style={{ animation: 'fadeUp 0.8s 1s both' }}
//           className="opacity-0 absolute right-8 bottom-20 flex flex-col gap-5 text-right  lg:flex">
//           {[
//             { num: 8,   suffix: '+',  label: 'Hub Cities'   },
//             { num: 500, suffix: '+',  label: 'Vehicles'     },
//             { num: 24,  suffix: '/7', label: 'Support'      },
//           ].map(({ num, suffix, label }) => (
//             <div key={label}>
//               <div className="font-display text-4xl text-brand-amber leading-none">
//                 <Counter end={num} suffix={suffix} />
//               </div>
//               <div className="font-mono text-xs tracking-widest uppercase text-brand-muted">{label}</div>
//             </div>
//           ))}
//         </div>

//         {/* Scroll hint */}
//         <div style={{ animation: 'fadeUp 1s 1.4s both' }}
//           className="opacity-0 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
//           <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-brand-muted">Scroll</span>
//           <div className="w-px h-10 bg-gradient-to-b from-brand-amber to-transparent animate-pulse" />
//         </div>
//       </section>

//       {/* ── MARQUEE ── */}
//       <div className="border-y border-brand-amber/15 py-3 overflow-hidden bg-brand-amber/[0.02]">
//         <div className="flex whitespace-nowrap" style={{ animation: 'marquee 28s linear infinite' }}>
//           {['React.js + Vite','✦','Node.js Express','✦','MongoDB Atlas','✦','Socket.io Live','✦','Mapbox GL','✦','Redux Toolkit','✦','JWT Auth','✦','Tesseract OCR','✦','Tailwind CSS','✦','Cloudinary','✦',
//             'React.js + Vite','✦','Node.js Express','✦','MongoDB Atlas','✦','Socket.io Live','✦','Mapbox GL','✦','Redux Toolkit','✦','JWT Auth','✦','Tesseract OCR','✦','Tailwind CSS','✦','Cloudinary','✦',
//           ].map((item, i) => (
//             <span key={i}
//               className={`px-6 font-mono text-xs tracking-wider ${item === '✦' ? 'text-brand-amber' : 'text-brand-muted'}`}>
//               {item}
//             </span>
//           ))}
//         </div>
//       </div>

//       {/* ── HOW IT WORKS ── */}
//       <section id="how-it-works" className="py-28 px-8">
//         <div className="max-w-6xl mx-auto">
//           <Reveal>
//             <span className="font-mono text-xs tracking-[0.25em] uppercase text-brand-amber mb-3 block">The Concept</span>
//             <div className="flex items-end justify-between border-b border-brand-amber/15 pb-8 mb-16 flex-wrap gap-6">
//               <h2 className="font-display text-6xl md:text-8xl text-brand-cream leading-none">
//                 How It<br/>Works
//               </h2>
//               <p className="max-w-sm text-brand-muted text-sm leading-relaxed">
//                 Vehicles don't return to a single depot. They flow freely through a network of
//                 physical hubs — pick up in Mumbai, drop off in Pune.
//               </p>
//             </div>
//           </Reveal>

//           <div className="grid grid-cols-1 md:grid-cols-4 border border-brand-amber/15">
//             {[
//               {
//                 num: '01', icon: Shield,
//                 title: 'Register & Verify',
//                 desc: 'Create your account and upload your Driving License + Aadhaar. Tesseract.js OCR auto-extracts and verifies your identity in seconds.',
//               },
//               {
//                 num: '02', icon: MapPin,
//                 title: 'Choose Your Route',
//                 desc: 'Select a Source Hub and Destination Hub on the interactive Mapbox map. See available vehicles at your nearest hub in real time.',
//               },
//               {
//                 num: '03', icon: Car,
//                 title: 'Book & Deposit',
//                 desc: 'Confirm your travel dates. Total price is calculated automatically. A refundable security deposit is held in your wallet.',
//               },
//               {
//                 num: '04', icon: Zap,
//                 title: 'Drive & Track',
//                 desc: 'Your vehicle GPS streams live via Socket.io. Watch it move on the map. On arrival, the booking completes and deposit returns.',
//               },
//             ].map(({ num, icon: Icon, title, desc }, i) => (
//               <Reveal key={num} delay={i * 120}
//                 className="p-8 border-r border-brand-amber/15 last:border-r-0 hover:bg-brand-amber/[0.02] transition-colors group">
//                 <div className="font-display text-6xl text-brand-amber/10 leading-none mb-6 group-hover:text-brand-amber/20 transition-colors">
//                   {num}
//                 </div>
//                 <Icon size={28} className="text-brand-amber mb-4" />
//                 <h3 className="font-medium text-brand-cream text-base mb-3">{title}</h3>
//                 <p className="text-brand-muted text-sm leading-relaxed">{desc}</p>
//               </Reveal>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── LIVE MAP DEMO ── */}
//       <section className="py-20 px-8 bg-brand-slate">
//         <div className="max-w-6xl mx-auto">
//           <Reveal>
//             <span className="font-mono text-xs tracking-[0.25em] uppercase text-brand-amber mb-3 block">Live Tracking</span>
//             <h2 className="font-display text-6xl md:text-8xl text-brand-cream leading-none mb-12">
//               Hub Network
//             </h2>
//           </Reveal>

//           <Reveal delay={150}>
//             <div className="border border-brand-amber/15 bg-brand-black p-6" style={{ height: 420 }}>
//               <HubNetwork />
//             </div>
//             <div className="flex gap-8 mt-4 font-mono text-xs text-brand-muted">
//               <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-amber mr-2 align-middle"/>Hub Node</span>
//               <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-red mr-2 align-middle"/>Active Vehicle</span>
//               <span><span className="inline-block w-6 h-px bg-brand-amber mr-2 align-middle"/>Route</span>
//             </div>
//           </Reveal>
//         </div>
//       </section>

//       {/* ── FEATURES ── */}
//       <section id="features" className="py-28 px-8">
//         <div className="max-w-6xl mx-auto">
//           <Reveal>
//             <span className="font-mono text-xs tracking-[0.25em] uppercase text-brand-amber mb-3 block">Platform</span>
//             <h2 className="font-display text-6xl md:text-8xl text-brand-cream leading-none mb-16">Features</h2>
//           </Reveal>

//           <div className="grid grid-cols-1 md:grid-cols-3 border border-brand-amber/15"
//             style={{ background: 'rgba(232,160,32,0.05)' }}>
//             {[
//               { icon: '🔐', num: 'F—01', title: 'JWT Authentication',      tech: 'JWT · Redux authSlice',    desc: 'Role-based login with automatic redirection. Vendors land on /vendor, customers on /dashboard. Token refresh interceptors built in.' },
//               { icon: '🚗', num: 'F—02', title: 'Fleet Management',         tech: 'Vendor Dashboard',         desc: 'List vehicles with photos, pricing, and hub location. Track monthly revenue via animated bar charts. Accept or decline bookings live.' },
//               { icon: '🗺️', num: 'F—03', title: 'Live Mapbox Tracking',     tech: 'Mapbox GL · Socket.io',    desc: 'Interactive dark-theme map shows real-time GPS. Animated vehicle marker streams coordinates every second via Socket.io rooms.' },
//               { icon: '📋', num: 'F—04', title: 'OCR KYC Verification',     tech: 'Tesseract.js · Cloudinary', desc: 'Upload DL and Aadhaar. Client-side OCR extracts name, DOB, document number. KYC status gates vehicle booking access.' },
//               { icon: '💬', num: 'F—05', title: 'Real-Time Chat',           tech: 'Socket.io · chatSlice',    desc: 'Booking-scoped messaging rooms. Messages persist to MongoDB. Typing indicators, unread counts, and read receipts.' },
//               { icon: '💳', num: 'F—06', title: 'Wallet & Deposits',        tech: 'User.wallet model',        desc: 'In-app wallet holds security deposits on booking creation. Auto-released on trip completion. Full audit trail.' },
//             ].map(({ icon, num, title, tech, desc }, i) => (
//               <Reveal key={num} delay={i * 80}
//                 className="bg-brand-black p-8 border-r border-b border-brand-amber/10 hover:bg-brand-amber/[0.02] transition-colors group relative overflow-hidden">
//                 <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-amber scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
//                 <div className="font-mono text-xs text-brand-muted mb-3">{num}</div>
//                 <div className="text-2xl mb-3">{icon}</div>
//                 <h3 className="font-medium text-brand-cream mb-2">{title}</h3>
//                 <p className="text-brand-muted text-sm leading-relaxed mb-4">{desc}</p>
//                 <div className="font-mono text-xs text-brand-amber">{tech}</div>
//               </Reveal>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── FOR VENDORS ── */}
//       <section id="for-vendors" className="py-28 px-8 bg-brand-slate">
//         <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
//           <Reveal>
//             <span className="font-mono text-xs tracking-[0.25em] uppercase text-brand-amber mb-3 block">For Vendors</span>
//             <h2 className="font-display text-6xl md:text-8xl text-brand-cream leading-none mb-6">
//               List &<br/><span className="text-brand-amber">Earn.</span>
//             </h2>
//             <p className="text-brand-muted text-base leading-relaxed mb-8">
//               Register as a center admin, list your fleet with pricing and hub locations,
//               then watch the bookings come in. Real-time revenue tracking included.
//             </p>
//             <div className="space-y-3 mb-8">
//               {[
//                 'Add unlimited vehicles with photos',
//                 'Set per-day pricing per vehicle',
//                 'Accept or decline rental requests',
//                 'Monthly revenue analytics dashboard',
//                 'Real-time chat with customers',
//                 'Live fleet tracking on map',
//               ].map(item => (
//                 <div key={item} className="flex items-center gap-3">
//                   <CheckCircle size={16} className="text-brand-amber flex-shrink-0" />
//                   <span className="text-brand-muted text-sm">{item}</span>
//                 </div>
//               ))}
//             </div>
//             <Link to="/register" className="btn-primary inline-flex items-center gap-2"
//               onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
//               Register as Vendor <ArrowRight size={16} />
//             </Link>
//           </Reveal>

//           {/* Mock vendor dashboard */}
//           <Reveal delay={200}>
//             <div className="border border-brand-amber/20 bg-brand-black overflow-hidden">
//               {/* Fake titlebar */}
//               <div className="flex items-center gap-2 px-4 py-3 bg-brand-mid border-b border-white/8">
//                 <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
//                 <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
//                 <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
//                 <span className="font-mono text-xs text-brand-muted ml-2">vendor-dashboard</span>
//               </div>
//               <div className="p-6 space-y-4">
//                 {/* Stats row */}
//                 <div className="grid grid-cols-3 gap-3">
//                   {[
//                     { label: 'Revenue', val: '₹1,24,500', color: 'text-brand-amber' },
//                     { label: 'Fleet',   val: '12 Cars',   color: 'text-blue-400'    },
//                     { label: 'Active',  val: '4 Rides',   color: 'text-green-400'   },
//                   ].map(({ label, val, color }) => (
//                     <div key={label} className="bg-brand-slate border border-white/8 p-3 text-center">
//                       <div className={`font-display text-xl ${color}`}>{val}</div>
//                       <div className="font-mono text-[10px] text-brand-muted uppercase tracking-wider mt-0.5">{label}</div>
//                     </div>
//                   ))}
//                 </div>
//                 {/* Mini bar chart */}
//                 <div className="bg-brand-slate border border-white/8 p-4">
//                   <div className="font-mono text-xs text-brand-muted mb-3">Monthly Revenue</div>
//                   <div className="flex items-end gap-1.5 h-16">
//                     {[30,55,40,70,85,60,90,75,95,65,80,100].map((h, i) => (
//                       <div key={i} className="flex-1 bg-brand-amber/70 hover:bg-brand-amber transition-colors"
//                         style={{ height: `${h}%` }} />
//                     ))}
//                   </div>
//                   <div className="flex justify-between font-mono text-[9px] text-brand-muted mt-1">
//                     <span>Jan</span><span>Jun</span><span>Dec</span>
//                   </div>
//                 </div>
//                 {/* Booking request */}
//                 <div className="bg-brand-slate border border-brand-amber/20 p-4">
//                   <div className="flex items-center justify-between mb-2">
//                     <span className="font-mono text-xs text-brand-amber">New Request</span>
//                     <span className="badge-pending">Pending</span>
//                   </div>
//                   <p className="text-sm text-brand-cream">Honda City · MH01AB1234</p>
//                   <p className="font-mono text-xs text-brand-muted mt-1">Mumbai Hub → Pune Hub · 3 days</p>
//                   <div className="flex gap-2 mt-3">
//                     <div className="flex-1 text-center py-1.5 bg-brand-amber text-brand-black font-mono text-xs font-bold">Accept</div>
//                     <div className="flex-1 text-center py-1.5 bg-brand-red/20 text-brand-red font-mono text-xs border border-brand-red/30">Decline</div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </Reveal>
//         </div>
//       </section>

//       {/* ── TECH STACK ── */}
//       <section className="py-28 px-8">
//         <div className="max-w-6xl mx-auto">
//           <Reveal>
//             <span className="font-mono text-xs tracking-[0.25em] uppercase text-brand-amber mb-3 block">Built With</span>
//             <h2 className="font-display text-6xl md:text-8xl text-brand-cream leading-none mb-16">
//               Tech<br/>Stack
//             </h2>
//           </Reveal>

//           <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-brand-amber/10">
//             {[
//               { layer: 'Frontend',  items: ['React 18 + Vite 5', 'Tailwind CSS 3', 'Redux Toolkit', 'React Router 6'] },
//               { layer: 'Backend',   items: ['Node.js + Express', 'MongoDB + Mongoose', 'Socket.io 4', 'JWT + bcrypt'] },
//               { layer: 'Features',  items: ['Mapbox GL JS', 'Tesseract.js OCR', 'Cloudinary CDN', 'Multer upload'] },
//               { layer: 'Dev Tools', items: ['Vite HMR', 'ESLint + Prettier', 'dotenv', 'Nodemon'] },
//             ].map(({ layer, items }) => (
//               <Reveal key={layer} className="bg-brand-black p-6">
//                 <div className="font-mono text-xs tracking-widest uppercase text-brand-amber mb-4">{layer}</div>
//                 <div className="space-y-2.5">
//                   {items.map(item => (
//                     <div key={item} className="flex items-center gap-2 text-sm text-brand-muted">
//                       <div className="w-1 h-1 bg-brand-amber rounded-full flex-shrink-0" />
//                       {item}
//                     </div>
//                   ))}
//                 </div>
//               </Reveal>
//             ))}
//           </div>
//         </div>
//       </section>

//       {/* ── CTA ── */}
//       <section className="py-28 px-8 bg-brand-slate">
//         <div className="max-w-4xl mx-auto text-center">
//           <Reveal>
//             <div className="inline-block border border-brand-amber/20 px-4 py-1.5 mb-8">
//               <span className="font-mono text-xs tracking-widest uppercase text-brand-amber">
//                 Ready to Drive?
//               </span>
//             </div>
//             <h2 className="font-display leading-none text-brand-cream mb-6"
//               style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}>
//               JOIN THE<br/>
//               <span className="text-brand-amber">NETWORK.</span>
//             </h2>
//             <p className="text-brand-muted text-base mb-10 max-w-lg mx-auto leading-relaxed">
//               Whether you're renting for a weekend or listing your fleet,
//               HubDrive connects you to India's decentralized rental ecosystem.
//             </p>
//             <div className="flex gap-4 justify-center flex-wrap">
//               <Link to="/register?role=customer"
//                 className="btn-primary flex items-center gap-2 text-sm px-8 py-4"
//                 onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
//                 <Users size={18} /> Rent a Vehicle
//               </Link>
//               <Link to="/register?role=vendor"
//                 className="btn-outline flex items-center gap-2 text-sm px-8 py-4"
//                 onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
//                 <Car size={18} /> List Your Fleet
//               </Link>
//             </div>
//           </Reveal>
//         </div>
//       </section>

//       {/* ── FOOTER ── */}
//       <footer className="border-t border-white/8 px-8 py-8 flex items-center justify-between flex-wrap gap-4">
//         <span className="font-display text-2xl text-brand-amber tracking-wider">
//           HUB<span className="text-brand-muted">DRIVE</span>
//         </span>
//         <div className="flex gap-6">
//           {['How it Works', 'Features', 'For Vendors'].map(item => (
//             <a key={item} href={`#${item.toLowerCase().replace(/ /g,'-')}`}
//               className="font-mono text-xs tracking-wider uppercase text-brand-muted hover:text-brand-amber transition-colors">
//               {item}
//             </a>
//           ))}
//         </div>
//         <p className="font-mono text-xs text-brand-muted">© 2024 HubDrive</p>
//       </footer>

//       {/* Keyframes injected */}
//       <style>{`
//         @keyframes fadeUp {
//           from { opacity: 0; transform: translateY(30px); }
//           to   { opacity: 1; transform: translateY(0); }
//         }
//         @keyframes marquee {
//           0%   { transform: translateX(0); }
//           100% { transform: translateX(-50%); }
//         }
//       `}</style>
//     </div>
//   )
// }

// export default Landing







import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight, MapPin, Shield, Zap, Users,
  Car, CheckCircle, ChevronDown,
} from 'lucide-react'

// ── Animated counter ──────────────────────────────────────────────────────────
const Counter = ({ end, suffix = '', duration = 2000 }) => {
  const [count, setCount] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const startTime = performance.now()
        const animate = (now) => {
          const elapsed = now - startTime
          const progress = Math.min(elapsed / duration, 1)
          const eased = 1 - Math.pow(1 - progress, 3)
          setCount(Math.round(eased * end))
          if (progress < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }
    }, { threshold: 0.3 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration])

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>
}

// ── Reveal wrapper ─────────────────────────────────────────────────────────────
const Reveal = ({ children, delay = 0, className = '' }) => {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity:    visible ? 1 : 0,
        transform:  visible ? 'translateY(0)' : 'translateY(40px)',
        transition: `opacity 0.7s ease ${delay}ms, transform 0.7s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

// ── Hub network SVG animation ─────────────────────────────────────────────────
const HubNetwork = () => {
  const nodes = [
    { id: 'MUM', label: 'Mumbai',    x: 18,  y: 55, primary: true },
    { id: 'PUN', label: 'Pune',      x: 28,  y: 70, primary: true },
    { id: 'LON', label: 'Lonavala',  x: 24,  y: 61, primary: false },
    { id: 'BLR', label: 'Bangalore', x: 55,  y: 80, primary: true },
    { id: 'HYD', label: 'Hyderabad', x: 52,  y: 55, primary: true },
    { id: 'GOA', label: 'Goa',       x: 33,  y: 78, primary: true },
    { id: 'DEL', label: 'Delhi',     x: 52,  y: 18, primary: true },
    { id: 'CHN', label: 'Chennai',   x: 68,  y: 82, primary: true },
  ]
  const edges = [
    ['MUM','PUN'],['MUM','LON'],['LON','PUN'],['MUM','DEL'],
    ['HYD','BLR'],['BLR','CHN'],['HYD','CHN'],['PUN','GOA'],
    ['HYD','MUM'],['DEL','HYD'],
  ]
  const [activeCar, setActiveCar] = useState(0)
  const cars = edges.slice(0, 5)

  useEffect(() => {
    const t = setInterval(() => setActiveCar(a => (a + 1) % cars.length), 2200)
    return () => clearInterval(t)
  }, [])

  const getNode = (id) => nodes.find(n => n.id === id)

  return (
    <div className="relative w-full h-full">
      <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="xMidYMid meet">
        <defs>
          <radialGradient id="nodeGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#E8A020" stopOpacity="0.4"/>
            <stop offset="100%" stopColor="#E8A020" stopOpacity="0"/>
          </radialGradient>
        </defs>

        {/* Edges */}
        {edges.map(([a, b], i) => {
          const na = getNode(a), nb = getNode(b)
          if (!na || !nb) return null
          const isActive = cars[activeCar] && cars[activeCar][0] === a && cars[activeCar][1] === b
          return (
            <line key={i}
              x1={na.x} y1={na.y} x2={nb.x} y2={nb.y}
              stroke={isActive ? '#E8A020' : 'rgba(232,160,32,0.15)'}
              strokeWidth={isActive ? 0.4 : 0.2}
              strokeDasharray={isActive ? 'none' : '1 2'}
              style={{ transition: 'stroke 0.5s, stroke-width 0.5s' }}
            />
          )
        })}

        {/* Animated car dot */}
        {cars[activeCar] && (() => {
          const [a, b] = cars[activeCar]
          const na = getNode(a), nb = getNode(b)
          if (!na || !nb) return null
          return (
            <circle r="1.2" fill="#C93030"
              style={{ filter: 'drop-shadow(0 0 2px #C93030)' }}>
              <animateMotion dur="2.2s" repeatCount="indefinite"
                path={`M${na.x},${na.y} L${nb.x},${nb.y}`} />
            </circle>
          )
        })()}

        {/* Nodes */}
        {nodes.map(n => (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r={n.primary ? 3 : 2}
              fill="rgba(232,160,32,0.08)" stroke="rgba(232,160,32,0.3)" strokeWidth="0.3">
              <animate attributeName="r" values={`${n.primary?3:2};${n.primary?4:3};${n.primary?3:2}`}
                dur="3s" repeatCount="indefinite" begin={`${Math.random()*2}s`} />
            </circle>
            <circle cx={n.x} cy={n.y} r={n.primary ? 1.5 : 1} fill="#E8A020" />
            <text x={n.x} y={n.y - 3} textAnchor="middle"
              fontSize="2.8" fill="rgba(244,240,232,0.6)" fontFamily="Space Mono, monospace">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  )
}

// ── Main Landing Page ─────────────────────────────────────────────────────────
const Landing = () => {
  const [scrolled, setScrolled] = useState(false)
  const [cursorPos, setCursorPos] = useState({ x: -100, y: -100 })
  const [cursorBig, setCursorBig] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    const onMouse  = (e) => setCursorPos({ x: e.clientX, y: e.clientY })
    window.addEventListener('scroll', onScroll)
    window.addEventListener('mousemove', onMouse)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('mousemove', onMouse)
    }
  }, [])

  const hoverBig   = () => setCursorBig(true)
  const hoverSmall = () => setCursorBig(false)

  return (
    <div className="bg-brand-black text-brand-cream min-h-screen overflow-x-hidden" style={{ cursor: 'none' }}>
      {/* Custom cursor */}
      <div
        className="fixed z-[9999] rounded-full pointer-events-none transition-[width,height] duration-200"
        style={{
          width:      cursorBig ? 40 : 12,
          height:     cursorBig ? 40 : 12,
          background: '#E8A020',
          left:       cursorPos.x,
          top:        cursorPos.y,
          transform:  'translate(-50%,-50%)',
          mixBlendMode: 'difference',
        }}
      />

      {/* Noise overlay */}
      <div className="fixed inset-0 pointer-events-none z-[999] opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
        }}
      />

      {/* ── NAV ── */}
      <nav className={`fixed top-0 w-full z-50 flex items-center justify-between px-8 py-5 transition-all duration-400
        ${scrolled ? 'bg-brand-black/90 backdrop-blur-md border-b border-white/8' : ''}`}>
        <span className="font-display text-2xl text-brand-amber tracking-wider">
          HUB<span className="text-brand-cream">DRIVE</span>
        </span>
        <div className="hidden md:flex items-center gap-8">
          {['How it Works', 'For Vendors', 'Features'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g,'-')}`}
              className="font-mono text-xs tracking-widest uppercase text-brand-muted hover:text-brand-amber transition-colors"
              onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
              {item}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <Link to="/login"
            className="font-mono text-xs tracking-widest uppercase text-brand-muted hover:text-brand-amber transition-colors px-4 py-2"
            onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
            Sign In
          </Link>
          <Link to="/register"
            className="btn-primary py-2 px-5 text-xs"
            onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
            Get Started
          </Link>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-end pb-20 px-8 overflow-hidden">
        {/* Animated grid */}
        <div className="absolute inset-0 bg-grid opacity-60" />

        {/* Radial glow */}
        <div className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse 70% 60% at 65% 35%, rgba(232,160,32,0.06) 0%, transparent 70%), radial-gradient(ellipse 40% 40% at 80% 70%, rgba(201,48,48,0.04) 0%, transparent 60%)',
          }}
        />

        {/* Giant background text */}
        <div className="absolute top-12 right-0 font-display text-[22vw] text-brand-amber/[0.03] leading-none pointer-events-none select-none">
          HUB
        </div>

        {/* Map visualization */}
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-40">
          <HubNetwork />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div
            style={{ animation: 'fadeUp 0.8s 0.2s both' }}
            className="opacity-0"
          >
            <span className="font-mono text-xs tracking-[0.3em] uppercase text-brand-amber mb-5 block">
              ✦ Decentralized Vehicle Rentals ✦
            </span>
          </div>

          <div style={{ animation: 'fadeUp 0.8s 0.4s both' }} className="opacity-0">
            <h1 className="font-display leading-[0.88] mb-6"
              style={{ fontSize: 'clamp(5rem, 12vw, 12rem)' }}>
              FROM<br/>
              <span className="text-brand-amber">HUB</span><br/>
              <span style={{ WebkitTextStroke: '1px rgba(244,240,232,0.4)', color: 'transparent' }}>
                TO HUB.
              </span>
            </h1>
          </div>

          <div style={{ animation: 'fadeUp 0.8s 0.6s both' }} className="opacity-0">
            <p className="text-brand-muted text-lg leading-relaxed max-w-xl mb-10">
              India's first decentralized vehicle rental network. Pick up at one hub,
              drop off at another. Vendors earn from movement. Customers gain freedom.
            </p>
          </div>

          <div style={{ animation: 'fadeUp 0.8s 0.8s both' }} className="opacity-0 flex flex-wrap gap-4 items-center">
            <Link to="/register"
              className="btn-primary flex items-center gap-3 text-sm px-8 py-4"
              onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
              Start for Free <ArrowRight size={18} />
            </Link>
            <Link to="/login"
              className="btn-outline flex items-center gap-3 text-sm px-8 py-4"
              onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
              Sign In
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ animation: 'fadeUp 0.8s 1s both' }}
          className="opacity-0 absolute right-8 bottom-20 flex flex-col gap-5 text-right  lg:flex">
          {[
            { num: 8,   suffix: '+',  label: 'Hub Cities'   },
            { num: 500, suffix: '+',  label: 'Vehicles'     },
            { num: 24,  suffix: '/7', label: 'Support'      },
          ].map(({ num, suffix, label }) => (
            <div key={label}>
              <div className="font-display text-4xl text-brand-amber leading-none">
                <Counter end={num} suffix={suffix} />
              </div>
              <div className="font-mono text-xs tracking-widest uppercase text-brand-muted">{label}</div>
            </div>
          ))}
        </div>

        {/* Scroll hint */}
        <div style={{ animation: 'fadeUp 1s 1.4s both' }}
          className="opacity-0 absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
          <span className="font-mono text-[10px] tracking-[0.25em] uppercase text-brand-muted">Scroll</span>
          <div className="w-px h-10 bg-gradient-to-b from-brand-amber to-transparent animate-pulse" />
        </div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="border-y border-brand-amber/15 py-3 overflow-hidden bg-brand-amber/[0.02]">
        <div className="flex whitespace-nowrap" style={{ animation: 'marquee 28s linear infinite' }}>
          {['Decentralized Hubs','✦','Live Vehicle Tracking','✦','Instant Verification','✦','Secure Deposits','✦','Real-Time Chat','✦','Flexible Drop-offs','✦','Vendor Analytics','✦',
            'Decentralized Hubs','✦','Live Vehicle Tracking','✦','Instant Verification','✦','Secure Deposits','✦','Real-Time Chat','✦','Flexible Drop-offs','✦','Vendor Analytics','✦',
          ].map((item, i) => (
            <span key={i}
              className={`px-6 font-mono text-xs tracking-wider ${item === '✦' ? 'text-brand-amber' : 'text-brand-muted'}`}>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* ── HOW IT WORKS ── */}
      <section id="how-it-works" className="py-28 px-8">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-brand-amber mb-3 block">The Concept</span>
            <div className="flex items-end justify-between border-b border-brand-amber/15 pb-8 mb-16 flex-wrap gap-6">
              <h2 className="font-display text-6xl md:text-8xl text-brand-cream leading-none">
                How It<br/>Works
              </h2>
              <p className="max-w-sm text-brand-muted text-sm leading-relaxed">
                Vehicles don't return to a single depot. They flow freely through a network of
                physical hubs — pick up in Mumbai, drop off in Pune.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-4 border border-brand-amber/15">
            {[
              {
                num: '01', icon: Shield,
                title: 'Register & Verify',
                desc: 'Create your account and upload your documents. Our secure system automatically extracts and verifies your identity in seconds.',
              },
              {
                num: '02', icon: MapPin,
                title: 'Choose Your Route',
                desc: 'Select a Source Hub and Destination Hub on the interactive map. See available vehicles at your nearest hub instantly.',
              },
              {
                num: '03', icon: Car,
                title: 'Book & Deposit',
                desc: 'Confirm your travel dates. The total price is calculated automatically, and a fully refundable security deposit is held safely in your wallet.',
              },
              {
                num: '04', icon: Zap,
                title: 'Drive & Track',
                desc: 'Your vehicle GPS updates live directly on your dashboard. On arrival at your destination, the booking completes and your deposit returns.',
              },
            ].map(({ num, icon: Icon, title, desc }, i) => (
              <Reveal key={num} delay={i * 120}
                className="p-8 border-r border-brand-amber/15 last:border-r-0 hover:bg-brand-amber/[0.02] transition-colors group">
                <div className="font-display text-6xl text-brand-amber/10 leading-none mb-6 group-hover:text-brand-amber/20 transition-colors">
                  {num}
                </div>
                <Icon size={28} className="text-brand-amber mb-4" />
                <h3 className="font-medium text-brand-cream text-base mb-3">{title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE MAP DEMO ── */}
      <section className="py-20 px-8 bg-brand-slate">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-brand-amber mb-3 block">Live Tracking</span>
            <h2 className="font-display text-6xl md:text-8xl text-brand-cream leading-none mb-12">
              Hub Network
            </h2>
          </Reveal>

          <Reveal delay={150}>
            <div className="border border-brand-amber/15 bg-brand-black p-6" style={{ height: 420 }}>
              <HubNetwork />
            </div>
            <div className="flex gap-8 mt-4 font-mono text-xs text-brand-muted">
              <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-amber mr-2 align-middle"/>Hub Node</span>
              <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-red mr-2 align-middle"/>Active Vehicle</span>
              <span><span className="inline-block w-6 h-px bg-brand-amber mr-2 align-middle"/>Route</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-28 px-8">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-brand-amber mb-3 block">Platform</span>
            <h2 className="font-display text-6xl md:text-8xl text-brand-cream leading-none mb-16">Features</h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-3 border border-brand-amber/15"
            style={{ background: 'rgba(232,160,32,0.05)' }}>
            {[
              { icon: '🔐', num: 'F—01', title: 'Secure Access',      desc: 'Role-based login system. Vendors seamlessly access their fleet dashboard, while customers land straight onto the booking map.' },
              { icon: '🚗', num: 'F—02', title: 'Fleet Management',   desc: 'List vehicles with photos, pricing, and their current hub location. Track monthly revenue visually and accept or decline bookings effortlessly.' },
              { icon: '🗺️', num: 'F—03', title: 'Live Map Tracking',  desc: 'Interactive dark-theme map shows real-time GPS locations. Watch your vehicle marker update instantly as it moves between hubs.' },
              { icon: '📋', num: 'F—04', title: 'Instant Verification',desc: 'Upload your documents for swift verification. Our automated system extracts key details so you can get approved and start driving faster.' },
              { icon: '💬', num: 'F—05', title: 'Real-Time Chat',     desc: 'Dedicated messaging system for every active booking. Stay in touch with your vendor or customer directly through the platform.' },
              { icon: '💳', num: 'F—06', title: 'Wallet & Deposits',  desc: 'Built-in digital wallet safely holds security deposits during your rental. Funds are automatically released back upon successful trip completion.' },
            ].map(({ icon, num, title, desc }, i) => (
              <Reveal key={num} delay={i * 80}
                className="bg-brand-black p-8 border-r border-b border-brand-amber/10 hover:bg-brand-amber/[0.02] transition-colors group relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-brand-amber scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left" />
                <div className="font-mono text-xs text-brand-muted mb-3">{num}</div>
                <div className="text-2xl mb-3">{icon}</div>
                <h3 className="font-medium text-brand-cream mb-2">{title}</h3>
                <p className="text-brand-muted text-sm leading-relaxed mb-4">{desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOR VENDORS ── */}
      <section id="for-vendors" className="py-28 px-8 bg-brand-slate">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <Reveal>
            <span className="font-mono text-xs tracking-[0.25em] uppercase text-brand-amber mb-3 block">For Vendors</span>
            <h2 className="font-display text-6xl md:text-8xl text-brand-cream leading-none mb-6">
              List &<br/><span className="text-brand-amber">Earn.</span>
            </h2>
            <p className="text-brand-muted text-base leading-relaxed mb-8">
              Register as a hub admin, list your fleet with pricing and starting locations,
              then watch the bookings come in. Track your fleet and earnings seamlessly.
            </p>
            <div className="space-y-3 mb-8">
              {[
                'Add unlimited vehicles with photos',
                'Set custom per-day pricing',
                'Accept or decline rental requests',
                'Visual revenue analytics dashboard',
                'Communicate instantly with customers',
                'Live fleet tracking on the map',
              ].map(item => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle size={16} className="text-brand-amber flex-shrink-0" />
                  <span className="text-brand-muted text-sm">{item}</span>
                </div>
              ))}
            </div>
            <Link to="/register" className="btn-primary inline-flex items-center gap-2"
              onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
              Register as Vendor <ArrowRight size={16} />
            </Link>
          </Reveal>

          {/* Mock vendor dashboard */}
          <Reveal delay={200}>
            <div className="border border-brand-amber/20 bg-brand-black overflow-hidden">
              {/* Fake titlebar */}
              <div className="flex items-center gap-2 px-4 py-3 bg-brand-mid border-b border-white/8">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500"/>
                <div className="w-2.5 h-2.5 rounded-full bg-green-500"/>
                <span className="font-mono text-xs text-brand-muted ml-2">vendor-dashboard</span>
              </div>
              <div className="p-6 space-y-4">
                {/* Stats row */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Revenue', val: '₹1,24,500', color: 'text-brand-amber' },
                    { label: 'Fleet',   val: '12 Cars',   color: 'text-blue-400'    },
                    { label: 'Active',  val: '4 Rides',   color: 'text-green-400'   },
                  ].map(({ label, val, color }) => (
                    <div key={label} className="bg-brand-slate border border-white/8 p-3 text-center">
                      <div className={`font-display text-xl ${color}`}>{val}</div>
                      <div className="font-mono text-[10px] text-brand-muted uppercase tracking-wider mt-0.5">{label}</div>
                    </div>
                  ))}
                </div>
                {/* Mini bar chart */}
                <div className="bg-brand-slate border border-white/8 p-4">
                  <div className="font-mono text-xs text-brand-muted mb-3">Monthly Revenue</div>
                  <div className="flex items-end gap-1.5 h-16">
                    {[30,55,40,70,85,60,90,75,95,65,80,100].map((h, i) => (
                      <div key={i} className="flex-1 bg-brand-amber/70 hover:bg-brand-amber transition-colors"
                        style={{ height: `${h}%` }} />
                    ))}
                  </div>
                  <div className="flex justify-between font-mono text-[9px] text-brand-muted mt-1">
                    <span>Jan</span><span>Jun</span><span>Dec</span>
                  </div>
                </div>
                {/* Booking request */}
                <div className="bg-brand-slate border border-brand-amber/20 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-xs text-brand-amber">New Request</span>
                    <span className="badge-pending">Pending</span>
                  </div>
                  <p className="text-sm text-brand-cream">Honda City · MH01AB1234</p>
                  <p className="font-mono text-xs text-brand-muted mt-1">Mumbai Hub → Pune Hub · 3 days</p>
                  <div className="flex gap-2 mt-3">
                    <div className="flex-1 text-center py-1.5 bg-brand-amber text-brand-black font-mono text-xs font-bold">Accept</div>
                    <div className="flex-1 text-center py-1.5 bg-brand-red/20 text-brand-red font-mono text-xs border border-brand-red/30">Decline</div>
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-28 px-8 bg-brand-slate">
        <div className="max-w-4xl mx-auto text-center">
          <Reveal>
            <div className="inline-block border border-brand-amber/20 px-4 py-1.5 mb-8">
              <span className="font-mono text-xs tracking-widest uppercase text-brand-amber">
                Ready to Drive?
              </span>
            </div>
            <h2 className="font-display leading-none text-brand-cream mb-6"
              style={{ fontSize: 'clamp(4rem, 10vw, 9rem)' }}>
              JOIN THE<br/>
              <span className="text-brand-amber">NETWORK.</span>
            </h2>
            <p className="text-brand-muted text-base mb-10 max-w-lg mx-auto leading-relaxed">
              Whether you're renting for a weekend or listing your fleet,
              HubDrive connects you to India's decentralized rental ecosystem.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link to="/register?role=customer"
                className="btn-primary flex items-center gap-2 text-sm px-8 py-4"
                onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
                <Users size={18} /> Rent a Vehicle
              </Link>
              <Link to="/register?role=vendor"
                className="btn-outline flex items-center gap-2 text-sm px-8 py-4"
                onMouseEnter={hoverBig} onMouseLeave={hoverSmall}>
                <Car size={18} /> List Your Fleet
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/8 px-8 py-8 flex items-center justify-between flex-wrap gap-4">
        <span className="font-display text-2xl text-brand-amber tracking-wider">
          HUB<span className="text-brand-muted">DRIVE</span>
        </span>
        <div className="flex gap-6">
          {['How it Works', 'Features', 'For Vendors'].map(item => (
            <a key={item} href={`#${item.toLowerCase().replace(/ /g,'-')}`}
              className="font-mono text-xs tracking-wider uppercase text-brand-muted hover:text-brand-amber transition-colors">
              {item}
            </a>
          ))}
        </div>
        <p className="font-mono text-xs text-brand-muted">© 2024 HubDrive</p>
      </footer>

      {/* Keyframes injected */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(30px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}

export default Landing