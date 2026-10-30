import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { leadsApi } from '../api/services'
import { useApi } from '../hooks/useApi'
import { EmptyState, ErrorBanner, Loading } from '../components/States'
import StageBadge from '../components/StageBadge'
import ConfirmDialog from '../components/ConfirmDialog'
import { STAGES } from '../utils/constants'
import { formatMoney } from '../utils/format'
import { parseApiError } from '../utils/errors'

export default function Leads() {
  const [search, setSearch] = useState('')
  const [debounced, setDebounced] = useState('')
  const [stage, setStage] = useState('')
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 300)
    return () => clearTimeout(t)
  }, [search])

  const fetchLeads = useCallback(() => leadsApi.list({ search: debounced || undefined, stage: stage || undefined }), [debounced, stage])
  const { data: leads, loading, error, reload } = useApi(fetchLeads)

  const confirmDelete = async () => {
    setDeleting(true); setActionError('')
    try {
      await leadsApi.remove(toDelete.id)
      setToDelete(null)
      reload()
    } catch (e) {
      setActionError(parseApiError(e).message)
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }
  const filtered = debounced || stage

  return (
    <>
      <div className="page-head"><h2>Leads</h2><Link className="btn primary" to="/leads/new">+ New lead</Link></div>
      <div className="toolbar">
        <input placeholder="Search by name or company…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search leads" />
        <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Filter by stage">
          <option value="">All stages</option>
          {STAGES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      <ErrorBanner message={error || actionError} onRetry={error ? reload : undefined} />
      {loading && <Loading />}
      {!loading && !error && leads?.length === 0 && (
        <EmptyState title={filtered ? 'No leads match your filters' : 'No leads yet'}>
          {filtered ? 'Try a different search or stage.' : <Link to="/leads/new">Create your first lead</Link>}
        </EmptyState>
      )}
      {!loading && leads?.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>Name</th><th>Company</th><th>Contact</th><th>Budget</th><th>Stage</th><th>Actions</th></tr></thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td data-label="Name"><Link to={`/leads/${l.id}`}>{l.name}</Link></td>
                  <td data-label="Company">{l.company || '—'}</td>
                  <td data-label="Contact">{l.email || l.phone}</td>
                  <td data-label="Budget">{formatMoney(l.budget)}</td>
                  <td data-label="Stage"><StageBadge stage={l.stage} /></td>
                  <td data-label="Actions" className="actions">
                    <Link className="btn small" to={`/leads/${l.id}`}>View</Link>
                    <Link className="btn small" to={`/leads/${l.id}/edit`}>Edit</Link>
                    <button className="btn small danger" onClick={() => setToDelete(l)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toDelete && (
        <ConfirmDialog
          title="Delete lead?"
          message={`“${toDelete.name}” and all of its follow-ups will be permanently deleted.`}
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}
    </>
  )
}
