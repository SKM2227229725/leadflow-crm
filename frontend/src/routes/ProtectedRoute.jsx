import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loading } from '../components/States'

export default function ProtectedRoute() {
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <Loading label="Restoring session…" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}
