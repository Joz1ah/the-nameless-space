import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/client'
import styles from './Auth.module.css'

export default function ForgotPassword() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async e => {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message)
    } finally { setLoading(false) }
  }

  return (
    <div className={styles.page}>
      <div className={styles.blob1} /><div className={styles.blob2} />
      <div className={styles.card}>
        <button className={styles.backLink} onClick={() => navigate('/login')}>← back to sign in</button>
        <h1 className={styles.title}>reset password</h1>
        <p className={styles.sub}>we'll send a reset link to your email</p>

        {sent ? (
          <div className={styles.successBox}>
            <p>check your inbox — a reset link is on its way.</p>
            <p style={{ marginTop: 8, fontSize: '0.8rem', opacity: 0.75 }}>didn't get it? check your spam folder.</p>
          </div>
        ) : (
          <>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={submit} className={styles.form}>
              <label className={styles.label}>email</label>
              <input
                className={styles.input}
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
              <button className={styles.btn} type="submit" disabled={loading}>
                {loading ? 'sending...' : 'send reset link →'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
