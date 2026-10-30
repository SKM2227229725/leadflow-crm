import { Link } from 'react-router-dom'
import { dashboardApi } from '../api/services'
import { useApi } from '../hooks/useApi'
import { ErrorBanner, Loading } from '../components/States'

const CARDS = [
  ['totalLeads', 'Total leads'],
  ['activeLeads', 'Active leads'],
  ['wonLeads', 'Won leads'],
  ['pendingFollowUps', 'Pending follow-ups'],
  ['overdueFollowUps', 'Overdue follow-ups'],
]

export default function Dashboard() {
  const { data, loading, error, reload } = useApi(dashboardApi.summary)
  
  return (
    <>
      <div className="page-head">
        <h2>Dashboard</h2>
        <Link className="btn primary" to="/leads">Go to leads</Link>
      </div>
      
      <ErrorBanner message={error} onRetry={reload} />
      
      {loading && <Loading />}
      
      {data && (
        <div 
          className="metrics" 
          style={{ 
            display: 'flex', 
            flexDirection: 'row', 
            flexWrap: 'wrap', 
            gap: '16px', 
            width: '100%' 
          }}
        >
          {CARDS.map(([key, label]) => (
            <div 
              key={key} 
              className={`card metric ${key === 'overdueFollowUps' && data[key] > 0 ? 'danger-text' : ''}`}
              style={{ 
                flex: '1 1 180px', // Minimum 180px lega, phir bacha hua space share karega
                textAlign: 'center', 
                padding: '20px',
                minWidth: '180px'
              }}
            >
              <div className="metric-value" data-testid={key}>{data[key]}</div>
              <div className="muted">{label}</div>
            </div>
          ))}
        </div>
      )}
    </>
  )
}