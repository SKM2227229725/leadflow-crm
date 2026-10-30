import { useCallback, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { activitiesApi, leadsApi } from '../api/services'
import { useApi } from '../hooks/useApi'
import Field from '../components/Field'
import ConfirmDialog from '../components/ConfirmDialog'
import StageBadge from '../components/StageBadge'
import { EmptyState, ErrorBanner, Loading } from '../components/States'
import { ACTIVITY_TYPES, STAGES } from '../utils/constants'
import { formatDateTime, formatMoney, localInputToIso } from '../utils/format'
import { parseApiError } from '../utils/errors'

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const fetchLead = useCallback(() => leadsApi.get(id), [id])
  const fetchActs = useCallback(() => activitiesApi.list({ leadId: id }), [id])
  const lead = useApi(fetchLead)
  const acts = useApi(fetchActs)

  const [stageBusy, setStageBusy] = useState(false)
  const [stageMsg, setStageMsg] = useState({ type: '', text: '' })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [fu, setFu] = useState({ title: '', dueAt: '', type: 'Call' })
  const [fuBusy, setFuBusy] = useState(false)
  const [fuError, setFuError] = useState('')
  const [fuFields, setFuFields] = useState({})
  const [actError, setActError] = useState('')

  const changeStage = async (e) => {
    const stage = e.target.value
    setStageBusy(true); setStageMsg({ type: '', text: '' })
    try {
      const updated = await leadsApi.update(id, { stage })  // persisted via the real API
      lead.setData(updated)
      setStageMsg({ type: 'ok', text: `Stage saved: ${updated.stage}` })
    } catch (err) {
      setStageMsg({ type: 'error', text: parseApiError(err).message })  // dropdown stays on server value
    } finally {
      setStageBusy(false)
    }
  }

  const addFollowUp = async (e) => {
    e.preventDefault()
    setFuError(''); setFuFields({})
    const local = {}
    if (!fu.title.trim()) local.title = 'Title is required.'
    if (!fu.dueAt) local.dueAt = 'Due date/time is required.'
    if (Object.keys(local).length) return setFuFields(local)
    setFuBusy(true)
    try {
      await activitiesApi.create({ leadId: Number(id), title: fu.title, type: fu.type, dueAt: localInputToIso(fu.dueAt) })
      setFu({ title: '', dueAt: '', type: 'Call' })
      acts.reload()
    } catch (err) {
      const p = parseApiError(err)
      setFuError(p.message); setFuFields(p.fields)
    } finally {
      setFuBusy(false)
    }
  }

  const complete = async (a) => {
    setActError('')
    try {
      await activitiesApi.update(a.id, { status: 'Completed' })
      acts.reload()
    } catch (err) {
      setActError(parseApiError(err).message)
    }
  }

  const doDelete = async () => {
    setDeleting(true)
    try {
      await leadsApi.remove(id)
      navigate('/leads', { replace: true })
    } catch (err) {
      setDeleteError(parseApiError(err).message)
      setConfirmDelete(false)
      setDeleting(false)
    }
  }

  if (lead.loading && !lead.data) return <Loading />
  if (lead.error) return <><ErrorBanner message={lead.error} onRetry={lead.reload} /><Link to="/leads">← Back to leads</Link></>
  const l = lead.data

  return (
    <>
      <div className="page-head">
        <h2>{l.name} <StageBadge stage={l.stage} /></h2>
        <div className="row">
          <Link className="btn" to={`/leads/${id}/edit`}>Edit</Link>
          <button className="btn danger" onClick={() => setConfirmDelete(true)}>Delete</button>
        </div>
      </div>
      <ErrorBanner message={deleteError} />

      <div className="card">
        <dl className="details">
          <div><dt>Company</dt><dd>{l.company || '—'}</dd></div>
          <div><dt>Email</dt><dd>{l.email || '—'}</dd></div>
          <div><dt>Phone</dt><dd>{l.phone || '—'}</dd></div>
          <div><dt>Service</dt><dd>{l.serviceInterest || '—'}</dd></div>
          <div><dt>Source</dt><dd>{l.source || '—'}</dd></div>
          <div><dt>Budget</dt><dd>{formatMoney(l.budget)}</dd></div>
          <div><dt>Created</dt><dd>{formatDateTime(l.createdAt)}</dd></div>
          <div><dt>Updated</dt><dd>{formatDateTime(l.updatedAt)}</dd></div>
        </dl>
        <div className="stage-row">
          <label htmlFor="stage-select"><strong>Pipeline stage</strong></label>
          <select id="stage-select" value={l.stage} onChange={changeStage} disabled={stageBusy}>
            {STAGES.map((s) => <option key={s}>{s}</option>)}
          </select>
          {stageBusy && <span className="muted">Saving…</span>}
          {stageMsg.text && <span className={stageMsg.type === 'error' ? 'field-error' : 'ok-text'} role={stageMsg.type === 'error' ? 'alert' : 'status'}>{stageMsg.text}</span>}
        </div>
      </div>

      <h3>Follow-ups</h3>
      <form className="card form-grid" onSubmit={addFollowUp} noValidate>
        <ErrorBanner message={fuError} />
        <Field label="Title *" error={fuFields.title}><input value={fu.title} onChange={(e) => setFu({ ...fu, title: e.target.value })} /></Field>
        <Field label="Due *" error={fuFields.dueAt}><input type="datetime-local" value={fu.dueAt} onChange={(e) => setFu({ ...fu, dueAt: e.target.value })} /></Field>
        <Field label="Type" error={fuFields.type}>
          <select value={fu.type} onChange={(e) => setFu({ ...fu, type: e.target.value })}>{ACTIVITY_TYPES.map((t) => <option key={t}>{t}</option>)}</select>
        </Field>
        <div className="row end full"><button className="btn primary" disabled={fuBusy}>{fuBusy ? 'Adding…' : 'Add follow-up'}</button></div>
      </form>

      <ErrorBanner message={acts.error || actError} onRetry={acts.error ? acts.reload : undefined} />
      {acts.loading && !acts.data && <Loading />}
      {acts.data?.length === 0 && <EmptyState title="No follow-ups yet">Use the form above to schedule one.</EmptyState>}
      {acts.data?.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>Title</th><th>Type</th><th>Due</th><th>Status</th><th>Action</th></tr></thead>
            <tbody>
              {acts.data.map((a) => (
                <tr key={a.id}>
                  <td data-label="Title">{a.title}</td>
                  <td data-label="Type">{a.type}</td>
                  <td data-label="Due">{formatDateTime(a.dueAt)}</td>
                  <td data-label="Status">
                    <span className={`badge ${a.status === 'Completed' ? 'stage-won' : 'stage-new'}`}>{a.status}</span>{' '}
                    {a.isOverdue && <span className="badge overdue">Overdue</span>}
                  </td>
                  <td data-label="Action">
                    {a.status === 'Pending' ? <button className="btn small primary" onClick={() => complete(a)}>Mark complete</button> : <span className="muted">Done {formatDateTime(a.completedAt)}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {confirmDelete && (
        <ConfirmDialog title="Delete lead?" message={`“${l.name}” and all of its follow-ups will be permanently deleted.`}
          busy={deleting} onConfirm={doDelete} onCancel={() => setConfirmDelete(false)} />
      )}
    </>
  )
}
