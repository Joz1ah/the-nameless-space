import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../App'
import { useEffect } from 'react'
import styles from './Landing.module.css'

export default function Landing() {
  const { user, loading } = useAuthContext()
  const navigate = useNavigate()

  useEffect(() => {
    if (!loading && user) navigate('/notebook', { replace: true })
  }, [user, loading])

  if (loading) return null

  return (
    <div className={styles.page}>
      {/* Background texture */}
      <div className={styles.bg} aria-hidden="true">
        <div className={styles.blob1} />
        <div className={styles.blob2} />
        <div className={styles.blob3} />
      </div>

      <nav className={styles.nav}>
        <span className={styles.navTitle}>the nameless space</span>
        <div className={styles.navActions}>
          <button className={styles.navLink} onClick={() => navigate('/login')}>sign in</button>
          <button className={styles.navBtn} onClick={() => navigate('/signup')}>get started</button>
        </div>
      </nav>

      <main className={styles.main}>
        <div className={styles.hero}>
          <div className={styles.tag}>a quiet corner of the internet</div>
          <h1 className={styles.headline}>
            your thoughts<br />
            <em>deserve a home</em>
          </h1>
          <p className={styles.sub}>
            Not every thought needs an audience. But some do. The nameless space is your private notebook — 
            a soft, personal place to write reflections, dump random ideas, attach photos, and revisit memories. 
            No likes. No followers. Just you and your pages.
          </p>
          <div className={styles.cta}>
            <button className={styles.ctaPrimary} onClick={() => navigate('/signup')}>
              start writing →
            </button>
            <button className={styles.ctaSecondary} onClick={() => navigate('/login')}>
              i already have a space
            </button>
          </div>
        </div>

        {/* Feature cards */}
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📖</span>
            <h3>notebook feel</h3>
            <p>Pages that look and feel like a real journal. Flip through entries like turning physical pages.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>📸</span>
            <h3>photos & scrapbook</h3>
            <p>Drop photos anywhere inside your entries. They display like polaroids pinned to a diary page.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🔗</span>
            <h3>share selectively</h3>
            <p>Share your blog with a link. Lock private entries so only you can see them. You control what's visible.</p>
          </div>
          <div className={styles.featureCard}>
            <span className={styles.featureIcon}>🌙</span>
            <h3>quiet by design</h3>
            <p>No engagement metrics. No notifications. Dark mode. Just calm, focused writing.</p>
          </div>
        </div>

        {/* About */}
        <div className={styles.about}>
          <div className={styles.aboutInner}>
            <h2 className={styles.aboutTitle}>made for the overthinkers,<br /><em>the quiet documenters</em></h2>
            <p className={styles.aboutText}>
              Some days you have something profound to say. Some days you just need to type it out before it disappears. 
              The nameless space holds both — no judgment, no pressure, no algorithm deciding what matters.
            </p>
            <p className={styles.aboutText}>
              Think of it as your personal corner of the internet. A notebook that lives online, 
              looks beautiful, and is yours alone — unless you choose to share it.
            </p>
            <button className={styles.ctaPrimary} onClick={() => navigate('/signup')}>
              create your space
            </button>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>the nameless space · a quiet place for thoughts</span>
      </footer>
    </div>
  )
}
