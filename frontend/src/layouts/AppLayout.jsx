import { useState, useEffect } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Sidebar from '../components/Sidebar'
import Footer from '../components/Footer'

export default function AppLayout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const doLogout = () => { 
    logout(); 
    navigate('/login', { replace: true }) 
  }

  return (
    <div className="app" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* Top Navbar: Only Brand, User & Logout */}
      <header className="topbar" style={{ justifyContent: 'space-between' }}>
        <strong className="brand">LeadFlow CRM</strong>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span className="who">{user?.name}</span>
          <button className="btn" onClick={doLogout}>Logout</button>
        </div>
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