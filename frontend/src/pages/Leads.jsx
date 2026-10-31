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

  const fetchLeads = useCallback(
    () => leadsApi.list({ search: debounced || undefined, stage: stage || undefined }),
    [debounced, stage]
  )
  const { data: leads, loading, error, reload } = useApi(fetchLeads)

  const confirmDelete = async () => {
    setDeleting(true)
    setActionError('')
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

  // Naya Feature: CSV Export (Frontend level par simple export)
  const exportCSV = () => {
    if (!leads || leads.length === 0) return
    const headers = ['Name', 'Company', 'Email', 'Phone', 'Budget', 'Stage']
    const rows = leads.map((l) => [
      `"${l.name || ''}"`,
      `"${l.company || ''}"`,
      `"${l.email || ''}"`,
      `"${l.phone || ''}"`,
      l.budget || 0,
      `"${l.stage || ''}"`,
    ])
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `leads_export_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const filtered = debounced || stage

  return (
    <>
      <div className="page-head">
        <h2>Leads</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          {leads?.length > 0 && (
            <button className="btn" onClick={exportCSV}>
              📥 Export CSV
            </button>
          )}
          <Link className="btn primary" to="/leads/new">+ New lead</Link>
        </div>
      </div>

      <div className="toolbar">
        <input
          placeholder="Search by name or company…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search leads"
        />
        <select value={stage} onChange={(e) => setStage(e.target.value)} aria-label="Filter by stage">
          <option value="">All stages</option>
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </div>

      <ErrorBanner message={error || actionError} onRetry={error ? reload : undefined} />
      {loading && <Loading />}

      {!loading && !error && leads?.length === 0 && (
        <EmptyState title={filtered ? 'No leads match your filters' : 'No leads yet'}>
          {filtered ? (
            'Try a different search or stage.'
          ) : (
            <Link to="/leads/new">Create your first lead</Link>
          )}
        </EmptyState>
      )}

      {!loading && leads?.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead>
              <tr>
                <th>Name</th>
                <th>Company</th>
                <th>Contact</th>
                <th>Budget</th>
                <th>Stage</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((l) => (
                <tr key={l.id}>
                  <td data-label="Name">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: '700',
                          fontSize: '0.85rem',
                          flexShrink: 0,
                        }}
                      >
                        {l.name ? l.name.charAt(0).toUpperCase() : 'U'}
                      </div>
                      <Link to={`/leads/${l.id}`} style={{ fontWeight: '500' }}>{l.name}</Link>
                    </div>
                  </td>
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