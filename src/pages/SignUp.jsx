import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../App'
import styles from './Auth.module.css'

export default function SignUp() {
  const { signUp } = useAuthContext()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', nickname: '', email: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) { setError('Passwords do not match'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }
    if (!form.nickname.trim()) { setError('Nickname is required'); return }
    setLoading(true)
    try {
      await signUp({ email: form.email, password: form.password, fullName: form.fullName, nickname: form.nickname })
      navigate('/notebook')
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.blob1} /><div className={styles.blob2} />
      <div className={styles.card}>
        <button className={styles.backLink} onClick={() => navigate('/')}>← back</button>
        <h1 className={styles.title}>create your space</h1>
        <p className={styles.sub}>a notebook that's entirely yours</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.label}>full name</label>
          <input className={styles.input} name="fullName" type="text" value={form.fullName} onChange={handle} required placeholder="your full name" />
          <label className={styles.label}>nickname <span className={styles.hint}>(used in your public link)</span></label>
          <input className={styles.input} name="nickname" type="text" value={form.nickname} onChange={handle} required placeholder="e.g. josie" />
          <label className={styles.label}>email</label>
          <input className={styles.input} name="email" type="email" value={form.email} onChange={handle} required placeholder="your@email.com" />
          <label className={styles.label}>password <span className={styles.hint}>(min. 6 characters)</span></label>
          <input className={styles.input} name="password" type="password" value={form.password} onChange={handle} required placeholder="••••••••" />
          <label className={styles.label}>confirm password</label>
          <input className={styles.input} name="confirm" type="password" value={form.confirm} onChange={handle} required placeholder="••••••••" />
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'creating...' : 'create my space →'}
          </button>
        </form>
        <p className={styles.switch}>already have a space? <Link to="/login" className={styles.switchLink}>sign in</Link></p>
      </div>
    </div>
  )
}
