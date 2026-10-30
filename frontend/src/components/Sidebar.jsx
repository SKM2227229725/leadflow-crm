import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user } = useAuth();
  const linkClass = ({ isActive }) => (isActive ? 'sidebar-link active' : 'sidebar-link');

  return (
    <aside className="sidebar">
      <div className="sidebar-profile">
        <div className="avatar">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <h3>{user?.name || 'Admin'}</h3>
        <p>Administrator</p>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/" end className={linkClass}>Dashboard</NavLink>
        <NavLink to="/leads" className={linkClass}>Leads</NavLink>
        <NavLink to="/follow-ups" className={linkClass}>Follow-ups</NavLink>
      </nav>

      <div className="sidebar-help">
        <h4>Need Help?</h4>
        <p>Reach out to our team.</p>
        <a href="mailto:support@leadflow.com">support@leadflow.com</a>
      </div>
    </aside>
  );
}