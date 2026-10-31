import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/services'
import { useApi } from '../hooks/useApi'
import { ErrorBanner, Loading } from '../components/States'
import { useAuth } from '../context/AuthContext'

const CARDS = [
  { key: 'totalLeads', label: 'Total leads', icon: '👥', color: '#e0e7ff', textColor: '#3730a3' },
  { key: 'activeLeads', label: 'Active leads', icon: '🔥', color: '#ffedd5', textColor: '#9a3412' },
  { key: 'wonLeads', label: 'Won leads', icon: '🏆', color: '#dcfce7', textColor: '#166534' },
  { key: 'pendingFollowUps', label: 'Pending follow-ups', icon: '⏳', color: '#fef3c7', textColor: '#92400e' },
  { key: 'overdueFollowUps', label: 'Overdue follow-ups', icon: '⚠️', color: '#fee2e2', textColor: '#991b1b' },
]

export default function Dashboard() {
  const { user } = useAuth()
  const { data, loading, error, reload } = useApi(dashboardApi.summary)

  // Greeting Logic
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  const firstName = user?.name ? user.name.split(' ')[0] : 'User'

  return (
    <>
      <div className="page-head" style={{ marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '4px' }}>
            {greeting}, {firstName} 👋
          </h2>
          <p className="muted" style={{ margin: 0 }}>Here's what's happening with your leads today.</p>
        </div>
        <Link className="btn primary" to="/leads">+ New lead</Link>
      </div>

      <ErrorBanner message={error} onRetry={reload} />
      {loading && <Loading />}

      {data && (
        <>
          {/* 5 Colored Metric Cards */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '32px' }}>
            {CARDS.map(({ key, label, icon, color, textColor }) => (
              <div 
                key={key} 
                style={{ 
                  flex: '1 1 180px', 
                  minWidth: '180px', 
                  background: color, 
                  color: textColor,
                  padding: '20px', 
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '1.8rem', fontWeight: 'bold' }}>{data[key]}</span>
                  <span style={{ fontSize: '1.5rem' }}>{icon}</span>
                </div>
                <span style={{ fontSize: '0.85rem', fontWeight: '600', opacity: 0.8 }}>{label}</span>
              </div>
            ))}
          </div>

          {/* Recent Leads & Upcoming Follow-ups */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
             
             {/* Recent Leads Card */}
             <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0 }}>Recent Leads</h3>
                  <Link to="/leads" style={{ fontSize: '0.85rem', fontWeight: '500' }}>View all</Link>
                </div>
                {data.recentLeads?.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {data.recentLeads.map((lead) => (
                      <li key={lead.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <Link to={`/leads/${lead.id}`} style={{ fontWeight: '500', display: 'block' }}>{lead.name}</Link>
                        <span className="muted" style={{ fontSize: '0.8rem' }}>
                          {lead.company || 'No company'} • {lead.stage}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No recent leads found.</p>
                )}
             </div>

             {/* Upcoming Follow-ups Card */}
             <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ margin: 0 }}>Upcoming Follow-ups</h3>
                  <Link to="/follow-ups" style={{ fontSize: '0.85rem', fontWeight: '500' }}>View all</Link>
                </div>
                {data.upcomingFollowups?.length > 0 ? (
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {data.upcomingFollowups.map((f) => (
                      <li key={f.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: '500' }}>{f.title}</span>
                          {f.isOverdue && (
                            <span className="badge overdue" style={{ fontSize: '0.7rem', padding: '2px 6px' }}>Overdue</span>
                          )}
                        </div>
                        <span className="muted" style={{ fontSize: '0.8rem' }}>
                          {f.leadName} • {new Date(f.dueAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="muted">No upcoming follow-ups.</p>
                )}
             </div>

          </div>
        </>
      )}
    </>
  )
}