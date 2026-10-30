import { Navigate, Route, Routes } from 'react-router-dom'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './layouts/AppLayout'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadForm from './pages/LeadForm'
import LeadDetail from './pages/LeadDetail'
import FollowUps from './pages/FollowUps'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/leads/new" element={<LeadForm />} />
          <Route path="/leads/:id" element={<LeadDetail />} />
          <Route path="/leads/:id/edit" element={<LeadForm />} />
          <Route path="/follow-ups" element={<FollowUps />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
