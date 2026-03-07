import { useSelector, useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import {
  selectUser, selectToken, selectIsLoggedIn,
  selectAuthLoading, selectAuthError,
  selectIsVendor, selectIsCustomer, selectKycStatus,
  logout, clearError, fetchProfile,
} from '../store/slices/authSlice'

export const useAuth = () => {
  const dispatch  = useDispatch()
  const navigate  = useNavigate()
  const user      = useSelector(selectUser)
  const token     = useSelector(selectToken)
  const isLoggedIn= useSelector(selectIsLoggedIn)
  const loading   = useSelector(selectAuthLoading)
  const error     = useSelector(selectAuthError)
  const isVendor  = useSelector(selectIsVendor)
  const isCustomer= useSelector(selectIsCustomer)
  const kycStatus = useSelector(selectKycStatus)

  // Hydrate profile if token exists but user not loaded
  useEffect(() => {
    if (token && !user) {
      dispatch(fetchProfile())
    }
  }, [token, user, dispatch])

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const dismissError = () => dispatch(clearError())

  const isKycVerified = kycStatus === 'verified'

  return {
    user,
    token,
    isLoggedIn,
    loading,
    error,
    isVendor,
    isCustomer,
    kycStatus,
    isKycVerified,
    handleLogout,
    dismissError,
  }
}