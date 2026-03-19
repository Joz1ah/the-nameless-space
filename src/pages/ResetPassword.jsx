import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/client'
import styles from './Auth.module.css'

const validatePassword = (pw) => {
  if (pw.length < 8) return 'Password must be at least 8 characters'
  if (!/[A-Z]/.test(pw)) return 'Password must include at least one capital letter'
  if (!/[0-9]/.test(pw)) return 'Password must include at least one number'
  return null
}

export default function ResetPassword() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    const pwError = validatePassword(form.password)
    if (pwError) { setError(pwError); return }
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: form.password })
      if (error) throw error
      navigate('/login')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.blob1} /><div className={styles.blob2} />
      <div className={styles.card}>
        <h1 className={styles.title}>new password</h1>
        <p className={styles.sub}>choose something you'll remember</p>

        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.label}>new password <span className={styles.hint}>(8+ chars, one capital, one number)</span></label>
          <input className={styles.input} name="password" type="password" value={form.password} onChange={handle} required placeholder="••••••••" />
          <label className={styles.label}>confirm password</label>
          <input className={styles.input} name="confirm" type="password" value={form.confirm} onChange={handle} required placeholder="••••••••" />
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'saving...' : 'save new password →'}
          </button>
        </form>
      </div>
    </div>
  )
}
