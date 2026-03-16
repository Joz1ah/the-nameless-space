import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthContext } from '../App'
import styles from './Auth.module.css'

export default function Login() {
  const { signIn } = useAuthContext()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await signIn(form)
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
        <h1 className={styles.title}>welcome back</h1>
        <p className={styles.sub}>sign in to your space</p>
        {error && <div className={styles.error}>{error}</div>}
        <form onSubmit={submit} className={styles.form}>
          <label className={styles.label}>email</label>
          <input className={styles.input} name="email" type="email" value={form.email} onChange={handle} required placeholder="your@email.com" />
          <label className={styles.label}>password</label>
          <input className={styles.input} name="password" type="password" value={form.password} onChange={handle} required placeholder="••••••••" />
          <button className={styles.btn} type="submit" disabled={loading}>
            {loading ? 'signing in...' : 'sign in →'}
          </button>
        </form>
        <p className={styles.switch}>don't have a space? <Link to="/signup" className={styles.switchLink}>sign up</Link></p>
      </div>
    </div>
  )
}
