import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { leadsApi } from '../api/services'
import Field from '../components/Field'
import { ErrorBanner, Loading } from '../components/States'
import { SERVICES, SOURCES, STAGES } from '../utils/constants'
import { parseApiError } from '../utils/errors'

const EMPTY = { name: '', company: '', email: '', phone: '', serviceInterest: '', source: '', budget: '', stage: 'New' }

export default function LeadForm() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY)
  const [loading, setLoading] = useState(editing)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  useEffect(() => {
    if (!editing) return
    leadsApi.get(id)
      .then((l) => setForm({ ...EMPTY, ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, l[k] ?? ''])) }))
      .catch((e) => setError(parseApiError(e).message))
      .finally(() => setLoading(false))
  }, [id, editing])

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setFieldErrors({})
    const local = {}
    if (!form.name.trim()) local.name = 'Name is required.'
    if (!form.email.trim() && !form.phone.trim()) local.email = 'Provide at least one of email or phone.'
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) local.email = 'Enter a valid email.'
    if (form.budget !== '' && Number(form.budget) < 0) local.budget = 'Budget cannot be negative.'
    if (Object.keys(local).length) return setFieldErrors(local)

    const body = { ...form, budget: form.budget === '' ? null : form.budget }
    setBusy(true)
    try {
      const saved = editing ? await leadsApi.update(id, body) : await leadsApi.create(body)
      navigate(`/leads/${saved.id}`)
    } catch (err) {
      const p = parseApiError(err)
      setError(p.message); setFieldErrors(p.fields)
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loading />
  return (
    <>
      <div className="page-head"><h2>{editing ? 'Edit lead' : 'New lead'}</h2></div>
      <form className="card form-grid" onSubmit={submit} noValidate>
        <ErrorBanner message={error} />
        <Field label="Name *" error={fieldErrors.name}><input value={form.name} onChange={set('name')} /></Field>
        <Field label="Company" error={fieldErrors.company}><input value={form.company} onChange={set('company')} /></Field>
        <Field label="Email" error={fieldErrors.email}><input type="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Phone" error={fieldErrors.phone}><input value={form.phone} onChange={set('phone')} /></Field>
        <Field label="Service interest" error={fieldErrors.serviceInterest}>
          <select value={form.serviceInterest} onChange={set('serviceInterest')}><option value="">—</option>{SERVICES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Source" error={fieldErrors.source}>
          <select value={form.source} onChange={set('source')}><option value="">—</option>{SOURCES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <Field label="Budget (₹)" error={fieldErrors.budget}><input type="number" step="0.01" min="0" value={form.budget} onChange={set('budget')} /></Field>
        <Field label="Stage" error={fieldErrors.stage}>
          <select value={form.stage} onChange={set('stage')}>{STAGES.map((s) => <option key={s}>{s}</option>)}</select>
        </Field>
        <div className="row end full">
          <Link className="btn" to={editing ? `/leads/${id}` : '/leads'}>Cancel</Link>
          <button className="btn primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create lead'}</button>
        </div>
      </form>
    </>
  )
}
