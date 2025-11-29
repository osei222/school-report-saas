import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../state/AuthContext'

export default function ProtectedRoute({ children, roles }) {
  const { token, user } = useAuth()
  const location = useLocation()

  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (roles && roles.length && user && !roles.includes(user.role)) {
    // Not authorized for this route; send to dashboard
    return <Navigate to="/dashboard" replace />
  }

  return children
}
