import { useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Field from '../components/Field'
import { ErrorBanner } from '../components/States'
import { parseApiError } from '../utils/errors'

export default function AuthShell({ mode }) {
  const isRegister = mode === 'register'
  const { user, login, register } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  if (user) return <Navigate to="/" replace />
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value })

  const submit = async (e) => {
    e.preventDefault()
    setError(''); setFieldErrors({})
    const local = {}
    if (isRegister && !form.name.trim()) local.name = 'Name is required.'
    if (!/^\S+@\S+\.\S+$/.test(form.email)) local.email = 'Enter a valid email.'
    if (!form.password) local.password = 'Password is required.'
    else if (isRegister && form.password.length < 8) local.password = 'Use at least 8 characters.'
    if (Object.keys(local).length) return setFieldErrors(local)

    setBusy(true)
    try {
      if (isRegister) await register(form)
      else await login({ email: form.email, password: form.password })
      navigate(location.state?.from?.pathname || '/', { replace: true })
    } catch (err) {
      const p = parseApiError(err)
      setError(p.message); setFieldErrors(p.fields)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth-wrap">
      <form className="card auth-card" onSubmit={submit} noValidate>
        <h1>LeadFlow CRM</h1>
        <p className="muted">{isRegister ? 'Create your account' : 'Sign in to continue'}</p>
        <ErrorBanner message={error} />
        {isRegister && (
          <Field label="Name" error={fieldErrors.name}>
            <input value={form.name} onChange={set('name')} autoComplete="name" />
          </Field>
        )}
        <Field label="Email" error={fieldErrors.email}>
          <input type="email" value={form.email} onChange={set('email')} autoComplete="email" />
        </Field>
        <Field label="Password" error={fieldErrors.password}>
          <input type="password" value={form.password} onChange={set('password')} autoComplete={isRegister ? 'new-password' : 'current-password'} />
        </Field>
        <button className="btn primary block" disabled={busy}>{busy ? 'Please wait…' : isRegister ? 'Register' : 'Log in'}</button>
        <p className="muted center">
          {isRegister ? <>Already registered? <Link to="/login">Log in</Link></> : <>New here? <Link to="/register">Create an account</Link></>}
        </p>
      </form>
    </div>
  )
}
