// // import { Routes, Route, Navigate } from 'react-router-dom'
// // import { useAuth } from './hooks/useAuth'
// // import { useSocket } from './hooks/useSocket'
// // import ProtectedRoute from './components/auth/ProtectedRoute'
// // import RoleRoute      from './components/auth/RoleRoute'
// // import Navbar         from './components/ui/Navbar'
// // import Loader         from './components/ui/Loader'

// // // ── Pages ────────────────────────────────────────────────────────────────────
// // import Landing      from './pages/Landing'
// // import Login        from './pages/Login'
// // import Register     from './pages/Register'
// // import Dashboard    from './pages/Dashboard'
// // import VendorPanel  from './pages/VendorPanel'
// // import VehiclesPage from './pages/VehiclesPage'
// // import BookingPage  from './pages/BookingPage'
// // import BookingsPage from './pages/BookingsPage'
// // import KYCPage      from './pages/KYCPage'
// // import TrackingPage from './pages/TrackingPage'
// // import ChatPage     from './pages/ChatPage'

// // // ── Dashboard Layout wrapper ──────────────────────────────────────────────────
// // const DashboardLayout = ({ children }) => (
// //   <div className="page-container">
// //     <Navbar />
// //     <main className="ml-64 min-h-screen p-8 transition-all duration-300">
// //       {children}
// //     </main>
// //   </div>
// // )

// // // ── App Root ──────────────────────────────────────────────────────────────────
// // const App = () => {
// //   const { isLoggedIn, isVendor, loading } = useAuth()

// //   // Initialize socket connection when logged in
// //   useSocket()

// //   if (loading) return <Loader fullScreen />

// //   return (
// //     <Routes>
// //       {/* ── Public ── */}
// //       <Route path="/"        element={<Landing />} />
// //       <Route
// //         path="/login"
// //         element={isLoggedIn
// //           ? <Navigate to={isVendor ? '/vendor' : '/dashboard'} replace />
// //           : <Login />}
// //       />
// //       <Route
// //         path="/register"
// //         element={isLoggedIn
// //           ? <Navigate to={isVendor ? '/vendor' : '/dashboard'} replace />
// //           : <Register />}
// //       />

// //       {/* ── Customer protected ── */}
// //       <Route path="/dashboard" element={
// //         <ProtectedRoute>
// //           <RoleRoute role="customer">
// //             <DashboardLayout><Dashboard /></DashboardLayout>
// //           </RoleRoute>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/vehicles" element={
// //         <ProtectedRoute>
// //           <RoleRoute role="customer">
// //             <DashboardLayout><VehiclesPage /></DashboardLayout>
// //           </RoleRoute>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/vehicles/:id/book" element={
// //         <ProtectedRoute>
// //           <RoleRoute role="customer">
// //             <DashboardLayout><BookingPage /></DashboardLayout>
// //           </RoleRoute>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/bookings" element={
// //         <ProtectedRoute>
// //           <RoleRoute role="customer">
// //             <DashboardLayout><BookingsPage /></DashboardLayout>
// //           </RoleRoute>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/kyc" element={
// //         <ProtectedRoute>
// //           <RoleRoute role="customer">
// //             <DashboardLayout><KYCPage /></DashboardLayout>
// //           </RoleRoute>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/tracking" element={
// //         <ProtectedRoute>
// //           <DashboardLayout><TrackingPage /></DashboardLayout>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/tracking/:bookingId" element={
// //         <ProtectedRoute>
// //           <DashboardLayout><TrackingPage /></DashboardLayout>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/chat" element={
// //         <ProtectedRoute>
// //           <DashboardLayout><ChatPage /></DashboardLayout>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/chat/:bookingId" element={
// //         <ProtectedRoute>
// //           <DashboardLayout><ChatPage /></DashboardLayout>
// //         </ProtectedRoute>
// //       } />

// //       {/* ── Vendor protected ── */}
// //       <Route path="/vendor" element={
// //         <ProtectedRoute>
// //           <RoleRoute role="vendor">
// //             <DashboardLayout><VendorPanel /></DashboardLayout>
// //           </RoleRoute>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/vendor/fleet" element={
// //         <ProtectedRoute>
// //           <RoleRoute role="vendor">
// //             <DashboardLayout><VehiclesPage vendor /></DashboardLayout>
// //           </RoleRoute>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/vendor/bookings" element={
// //         <ProtectedRoute>
// //           <RoleRoute role="vendor">
// //             <DashboardLayout><BookingsPage vendor /></DashboardLayout>
// //           </RoleRoute>
// //         </ProtectedRoute>
// //       } />

// //       <Route path="/vendor/chat" element={
// //         <ProtectedRoute>
// //           <RoleRoute role="vendor">
// //             <DashboardLayout><ChatPage /></DashboardLayout>
// //           </RoleRoute>
// //         </ProtectedRoute>
// //       } />

// //       {/* ── Fallback ── */}
// //       <Route path="*" element={<Navigate to="/" replace />} />
// //     </Routes>
// //   )
// // }

// // export default App







// import { Routes, Route, Navigate } from 'react-router-dom'
// import { useAuth } from './hooks/useAuth'
// import { useSocket } from './hooks/useSocket'
// import ProtectedRoute from './components/auth/ProtectedRoute'
// import RoleRoute      from './components/auth/RoleRoute'
// import Navbar         from './components/ui/Navbar'
// import Loader         from './components/ui/Loader'

// // ── Pages ────────────────────────────────────────────────────────────────────
// import Landing      from './pages/Landing'
// import Login        from './pages/Login'
// import Register     from './pages/Register'
// import Dashboard    from './pages/Dashboard'
// import VendorPanel  from './pages/VendorPanel'
// import VehiclesPage from './pages/VehiclesPage'
// import BookingPage  from './pages/BookingPage'
// import BookingsPage from './pages/BookingsPage'
// import KYCPage      from './pages/KYCPage'
// import TrackingPage from './pages/TrackingPage'
// import ChatPage     from './pages/ChatPage'

// // ── Dashboard Layout wrapper ──────────────────────────────────────────────────
// const DashboardLayout = ({ children }) => (
//   <div className="page-container">
//     <Navbar />
//     <main className="md:ml-64 min-h-screen pt-14 pb-20 md:pt-0 md:pb-0 p-4 sm:p-6 md:p-8 transition-all duration-300">
//       {children}
//     </main>
//   </div>
// )

// // ── App Root ──────────────────────────────────────────────────────────────────
// const App = () => {
//   const { isLoggedIn, isVendor, loading } = useAuth()

//   // Initialize socket connection when logged in
//   useSocket()

//   if (loading) return <Loader fullScreen />

//   return (
//     <Routes>
//       {/* ── Public ── */}
//       <Route path="/"        element={<Landing />} />
//       <Route
//         path="/login"
//         element={isLoggedIn
//           ? <Navigate to={isVendor ? '/vendor' : '/dashboard'} replace />
//           : <Login />}
//       />
//       <Route
//         path="/register"
//         element={isLoggedIn
//           ? <Navigate to={isVendor ? '/vendor' : '/dashboard'} replace />
//           : <Register />}
//       />

//       {/* ── Customer protected ── */}
//       <Route path="/dashboard" element={
//         <ProtectedRoute>
//           <RoleRoute role="customer">
//             <DashboardLayout><Dashboard /></DashboardLayout>
//           </RoleRoute>
//         </ProtectedRoute>
//       } />

//       <Route path="/vehicles" element={
//         <ProtectedRoute>
//           <RoleRoute role="customer">
//             <DashboardLayout><VehiclesPage /></DashboardLayout>
//           </RoleRoute>
//         </ProtectedRoute>
//       } />

//       <Route path="/vehicles/:id/book" element={
//         <ProtectedRoute>
//           <RoleRoute role="customer">
//             <DashboardLayout><BookingPage /></DashboardLayout>
//           </RoleRoute>
//         </ProtectedRoute>
//       } />

//       <Route path="/bookings" element={
//         <ProtectedRoute>
//           <RoleRoute role="customer">
//             <DashboardLayout><BookingsPage /></DashboardLayout>
//           </RoleRoute>
//         </ProtectedRoute>
//       } />

//       <Route path="/kyc" element={
//         <ProtectedRoute>
//           <RoleRoute role="customer">
//             <DashboardLayout><KYCPage /></DashboardLayout>
//           </RoleRoute>
//         </ProtectedRoute>
//       } />

//       <Route path="/tracking" element={
//         <ProtectedRoute>
//           <DashboardLayout><TrackingPage /></DashboardLayout>
//         </ProtectedRoute>
//       } />

//       <Route path="/tracking/:bookingId" element={
//         <ProtectedRoute>
//           <DashboardLayout><TrackingPage /></DashboardLayout>
//         </ProtectedRoute>
//       } />

//       <Route path="/chat" element={
//         <ProtectedRoute>
//           <DashboardLayout><ChatPage /></DashboardLayout>
//         </ProtectedRoute>
//       } />

//       <Route path="/chat/:bookingId" element={
//         <ProtectedRoute>
//           <DashboardLayout><ChatPage /></DashboardLayout>
//         </ProtectedRoute>
//       } />

//       {/* ── Vendor protected ── */}
//       <Route path="/vendor" element={
//         <ProtectedRoute>
//           <RoleRoute role="vendor">
//             <DashboardLayout><VendorPanel /></DashboardLayout>
//           </RoleRoute>
//         </ProtectedRoute>
//       } />

//       <Route path="/vendor/fleet" element={
//         <ProtectedRoute>
//           <RoleRoute role="vendor">
//             <DashboardLayout><VehiclesPage vendor /></DashboardLayout>
//           </RoleRoute>
//         </ProtectedRoute>
//       } />

//       <Route path="/vendor/bookings" element={
//         <ProtectedRoute>
//           <RoleRoute role="vendor">
//             <DashboardLayout><BookingsPage vendor /></DashboardLayout>
//           </RoleRoute>
//         </ProtectedRoute>
//       } />

//       <Route path="/vendor/chat" element={
//         <ProtectedRoute>
//           <RoleRoute role="vendor">
//             <DashboardLayout><ChatPage /></DashboardLayout>
//           </RoleRoute>
//         </ProtectedRoute>
//       } />

//       {/* ── Fallback ── */}
//       <Route path="*" element={<Navigate to="/" replace />} />
//     </Routes>
//   )
// }

// export default App


















import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth }       from './hooks/useAuth'
import { useSocket }     from './hooks/useSocket'
import ProtectedRoute    from './components/auth/ProtectedRoute'
import RoleRoute         from './components/auth/RoleRoute'
import Navbar            from './components/ui/Navbar'
import Loader            from './components/ui/Loader'

// ── Pages ─────────────────────────────────────────────────────────────────────
import Landing      from './pages/Landing'
import Login        from './pages/Login'
import Register     from './pages/Register'
import Dashboard    from './pages/Dashboard'
import VendorPanel  from './pages/VendorPanel'
import VehiclesPage from './pages/VehiclesPage'
import BookingPage  from './pages/BookingPage'
import BookingsPage from './pages/BookingsPage'
import KYCPage      from './pages/KYCPage'
import WalletPage   from './pages/WalletPage'
import TrackingPage from './pages/TrackingPage'
import ChatPage     from './pages/ChatPage'

// ── Layout ────────────────────────────────────────────────────────────────────
const DashboardLayout = ({ children }) => (
  <div className="page-container">
    <Navbar />
    <main className="md:ml-64 min-h-screen pt-14 pb-20 md:pt-0 md:pb-0 p-4 sm:p-6 md:p-8 transition-all duration-300">
      {children}
    </main>
  </div>
)

// ── App ───────────────────────────────────────────────────────────────────────
const App = () => {
  const { isLoggedIn, isVendor, loading } = useAuth()
  useSocket()
  if (loading) return <Loader fullScreen />

  return (
    <Routes>

      {/* ── Public ─────────────────────────────────────────────────────────── */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={isLoggedIn
          ? <Navigate to={isVendor ? '/vendor' : '/dashboard'} replace />
          : <Login />}
      />
      <Route
        path="/register"
        element={isLoggedIn
          ? <Navigate to={isVendor ? '/vendor' : '/dashboard'} replace />
          : <Register />}
      />

      {/* ── Customer ───────────────────────────────────────────────────────── */}
      <Route path="/dashboard" element={
        <ProtectedRoute><RoleRoute role="customer">
          <DashboardLayout><Dashboard /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      <Route path="/vehicles" element={
        <ProtectedRoute><RoleRoute role="customer">
          <DashboardLayout><VehiclesPage /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      <Route path="/vehicles/:id/book" element={
        <ProtectedRoute><RoleRoute role="customer">
          <DashboardLayout><BookingPage /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      <Route path="/bookings" element={
        <ProtectedRoute><RoleRoute role="customer">
          <DashboardLayout><BookingsPage /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      <Route path="/kyc" element={
        <ProtectedRoute><RoleRoute role="customer">
          <DashboardLayout><KYCPage /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      <Route path="/wallet" element={
        <ProtectedRoute><RoleRoute role="customer">
          <DashboardLayout><WalletPage /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      <Route path="/tracking" element={
        <ProtectedRoute>
          <DashboardLayout><TrackingPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/tracking/:bookingId" element={
        <ProtectedRoute>
          <DashboardLayout><TrackingPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/chat" element={
        <ProtectedRoute>
          <DashboardLayout><ChatPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      <Route path="/chat/:bookingId" element={
        <ProtectedRoute>
          <DashboardLayout><ChatPage /></DashboardLayout>
        </ProtectedRoute>
      } />

      {/* ── Vendor ─────────────────────────────────────────────────────────── */}
      <Route path="/vendor" element={
        <ProtectedRoute><RoleRoute role="vendor">
          <DashboardLayout><VendorPanel /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      <Route path="/vendor/fleet" element={
        <ProtectedRoute><RoleRoute role="vendor">
          <DashboardLayout><VehiclesPage vendor /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      <Route path="/vendor/bookings" element={
        <ProtectedRoute><RoleRoute role="vendor">
          <DashboardLayout><BookingsPage vendor /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      <Route path="/vendor/chat" element={
        <ProtectedRoute><RoleRoute role="vendor">
          <DashboardLayout><ChatPage /></DashboardLayout>
        </RoleRoute></ProtectedRoute>
      } />

      {/* ── Fallback ───────────────────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  )
}

export default App