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
  
  // Link function for mobile menu
  const link = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Top Navbar */}
      <header className="topbar" style={{ justifyContent: 'space-between' }}>
        <strong className="brand">LeadFlow CRM</strong>
        
        {/* Mobile Menu Button (Hidden on Desktop) */}
        <button className="btn menu-btn" aria-label="Toggle menu" aria-expanded={open} onClick={() => setOpen((o) => !o)}>☰</button>
        
        {/* Desktop Right Side (User + Logout) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span className="who">{user?.name}</span>
          <button className="btn" onClick={doLogout}>Logout</button>
        </div>

        {/* Mobile Dropdown Menu (Only shows when hamburger is clicked) */}
        <nav className={open ? 'nav open' : 'nav'} onClick={() => setOpen(false)}>
          <NavLink to="/" end className={link}>Dashboard</NavLink>
          <NavLink to="/leads" className={link}>Leads</NavLink>
          <NavLink to="/follow-ups" className={link}>Follow-ups</NavLink>
        </nav>
      </header>

      {/* Main Layout: Sidebar + Content */}
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