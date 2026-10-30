import { useState } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const doLogout = () => { logout(); navigate('/login', { replace: true }) }
  const link = ({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')

  return (
    <div className="app">
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
      <main className="content"><Outlet /></main>
    </div>
  )
}
