import { useCallback, useState } from 'react'
import { Link } from 'react-router-dom'
import { activitiesApi } from '../api/services'
import { useApi } from '../hooks/useApi'
import { EmptyState, ErrorBanner, Loading } from '../components/States'
import { formatDateTime } from '../utils/format'
import { parseApiError } from '../utils/errors'

export default function FollowUps() {
  const [status, setStatus] = useState('')
  const [actError, setActError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const fetchActs = useCallback(() => activitiesApi.list({ status: status || undefined }), [status])
  const { data, loading, error, reload } = useApi(fetchActs)

  const complete = async (a) => {
    setActError(''); setBusyId(a.id)
    try {
      await activitiesApi.update(a.id, { status: 'Completed' })
      reload()
    } catch (e) {
      setActError(parseApiError(e).message)
    } finally {
      setBusyId(null)
    }
  }

  return (
    <>
      <div className="page-head"><h2>Follow-ups</h2></div>
      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
          <option value="">All</option><option>Pending</option><option>Completed</option>
        </select>
      </div>
      <ErrorBanner message={error || actError} onRetry={error ? reload : undefined} />
      {loading && <Loading />}
      {!loading && !error && data?.length === 0 && (
        <EmptyState title="No follow-ups found">Open a lead and add a follow-up from its page.</EmptyState>
      )}
      {!loading && data?.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>Lead</th><th>Title</th><th>Type</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {data.map((a) => (
                <tr key={a.id} className={a.isOverdue ? 'row-overdue' : ''}>
                  <td data-label="Lead"><Link to={`/leads/${a.leadId}`}>{a.leadName}</Link></td>
                  <td data-label="Title">{a.title}</td>
                  <td data-label="Type">{a.type}</td>
                  <td data-label="Due">{formatDateTime(a.dueAt)}</td>
                  <td data-label="Status">
                    <span className={`badge ${a.status === 'Completed' ? 'stage-won' : 'stage-new'}`}>{a.status}</span>{' '}
                    {a.isOverdue && <span className="badge overdue">Overdue</span>}
                  </td>
                  <td data-label="Action">
                    {a.status === 'Pending'
                      ? <button className="btn small primary" disabled={busyId === a.id} onClick={() => complete(a)}>{busyId === a.id ? 'Saving…' : 'Mark complete'}</button>
                      : <span className="muted">Done {formatDateTime(a.completedAt)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
