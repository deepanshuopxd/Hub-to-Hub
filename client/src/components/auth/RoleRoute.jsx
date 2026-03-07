import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Loader from '../ui/Loader'

// role: 'vendor' | 'customer'
const RoleRoute = ({ children, role }) => {
  const { isLoggedIn, isVendor, isCustomer, loading } = useAuth()

  if (loading) return <Loader fullScreen />

  if (!isLoggedIn) return <Navigate to="/login" replace />

  if (role === 'vendor'   && !isVendor)   return <Navigate to="/dashboard" replace />
  if (role === 'customer' && !isCustomer) return <Navigate to="/vendor"    replace />

  return children
}

export default RoleRoute