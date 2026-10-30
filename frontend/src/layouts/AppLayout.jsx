import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const doLogout = () => { logout(); navigate('/login', { replace: true }) }
  const link = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header className="topbar">
        <strong className="brand">LeadFlow CRM</strong>
        <button className="btn menu-btn" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>☰</button>
        <nav className={open ? 'nav open' : 'nav'} onClick={() => setOpen(false)}>
          <NavLink to="/" end className={link}>Dashboard</NavLink>
          <NavLink to="/leads" className={link}>Leads</NavLink>
          <NavLink to="/follow-ups" className={link}>Follow-ups</NavLink>
          <span className="spacer" />
          <span className="who">{user?.name}</span>
          <button className="btn" onClick={doLogout}>Logout</button>
        </nav>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <main className="content" style={{ flex: 1 }}>
            <Outlet />
          </main>
          <Footer />
        </div>
      </div>
    </div>
  )
  
}
