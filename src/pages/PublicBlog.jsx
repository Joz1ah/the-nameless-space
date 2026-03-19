import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/client'
import { RiHeartFill, RiMailLine, RiGlobalLine, RiInstagramLine, RiTwitterXLine, RiQrCodeLine, RiCloseLine, RiMoonLine, RiSunLine } from 'react-icons/ri'
import styles from './PublicBlog.module.css'

function stripHTML(html) {
  if (!html) return ''
  return html.replace(/<div[^>]*class="inline-photo-block"[^>]*>[\s\S]*?<\/div>/gi, ' ')
             .replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}
function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

export default function PublicBlog() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [notFound, setNotFound] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [readerTheme, setReaderTheme] = useState(() => localStorage.getItem('reader-theme') || 'light')

  // Override the owner's html data-theme while on public pages, restore on leave
  useEffect(() => {
    const prev = document.documentElement.getAttribute('data-theme')
    document.documentElement.setAttribute('data-theme', readerTheme)
    return () => { if (prev) document.documentElement.setAttribute('data-theme', prev) }
  }, [readerTheme])

  const toggleReaderTheme = () => setReaderTheme(t => {
    const next = t === 'light' ? 'dark' : 'light'
    localStorage.setItem('reader-theme', next)
    return next
  })

  useEffect(() => { load() }, [slug])

  const load = async () => {
    setLoading(true)
    const { data: prof } = await supabase.from('profiles').select('*').eq('slug', slug).single()
    if (!prof) { setNotFound(true); setLoading(false); return }
    setProfile(prof)
    const { data: ents } = await supabase
      .from('entries').select('*, entry_photos(*)')
      .eq('user_id', prof.id).eq('is_draft', false).eq('is_locked', false)
      .order('created_at', { ascending: true })
    setEntries((ents || []).map(e => ({ ...e, entry_photos: (e.entry_photos || []).sort((a, b) => (a.position||0)-(b.position||0)) })))
    setLoading(false)
  }

  if (loading) return <div className={styles.loading}><div className={styles.dot} /></div>
  if (notFound) return (
    <div className={styles.notFound}><h2>this space doesn't exist</h2><button onClick={() => navigate('/')}>← go home</button></div>
  )

  const filtered = filter === 'favorites' ? entries.filter(e => e.is_favorite) : entries

  return (
    <div className={styles.page}>
      <div className={styles.bg}><div className={styles.blob1} /><div className={styles.blob2} /></div>

      {/* QR modal */}
      {showQR && profile.qr_url && (
        <div className={styles.qrOverlay} onClick={() => setShowQR(false)}>
          <div className={styles.qrCard} onClick={e => e.stopPropagation()}>
            <button className={styles.qrClose} onClick={() => setShowQR(false)}><RiCloseLine size={20} /></button>
            <h3 className={styles.qrTitle}>buy me a coffee ☕</h3>
            <p className={styles.qrSub}>scan the QR code to support {profile.nickname || profile.full_name}</p>
            <img src={profile.qr_url} alt="Buy me a coffee QR" className={styles.qrImage} />
          </div>
        </div>
      )}

      {/* Sticky nav */}
      <nav className={styles.nav}>
        <a href="/" className={styles.navBrand}>the nameless space</a>
        <button className={styles.themeToggle} onClick={toggleReaderTheme} title="Toggle theme">
          {readerTheme === 'light' ? <RiMoonLine size={17} /> : <RiSunLine size={17} />}
        </button>
      </nav>

      {/* Profile header */}
      <header className={styles.header}>
        <div className={styles.profileCard}>
          {profile.avatar_url
            ? <img src={profile.avatar_url} alt={profile.full_name} className={styles.avatar} />
            : <div className={styles.avatarPlaceholder}>{(profile.full_name || profile.nickname || '?')[0]?.toUpperCase()}</div>
          }
          <div className={styles.profileInfo}>
            <h1 className={styles.profileName}>{profile.full_name || profile.nickname}</h1>
            {profile.nickname && <p className={styles.profileNick}>@{profile.nickname}</p>}
            {profile.bio && <p className={styles.profileBio}>{profile.bio}</p>}
            <div className={styles.contacts}>
              {profile.email_contact && <a href={`mailto:${profile.email_contact}`} className={styles.contact}><RiMailLine size={14} />{profile.email_contact}</a>}
              {profile.qr_url && (
                <button className={`${styles.contact} ${styles.coffeeBtn}`} onClick={() => setShowQR(true)}>
                  <RiQrCodeLine size={14} /> buy me a coffee
                </button>
              )}
              {profile.website && <a href={profile.website} target="_blank" rel="noreferrer" className={styles.contact}><RiGlobalLine size={14} />{profile.website.replace(/^https?:\/\//, '')}</a>}
              {profile.instagram && <a href={`https://instagram.com/${profile.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className={styles.contact}><RiInstagramLine size={14} />{profile.instagram}</a>}
              {profile.twitter && <a href={`https://twitter.com/${profile.twitter.replace('@', '')}`} target="_blank" rel="noreferrer" className={styles.contact}><RiTwitterXLine size={14} />{profile.twitter}</a>}
            </div>
          </div>
        </div>
      </header>

      <div className={styles.tabs}>
        <button className={`${styles.tab} ${filter === 'all' ? styles.tabActive : ''}`} onClick={() => setFilter('all')}>all entries</button>
        <button className={`${styles.tab} ${filter === 'favorites' ? styles.tabActive : ''}`} onClick={() => setFilter('favorites')}>♥ favorites</button>
      </div>

      <div className={styles.entriesWrap}>
        {filtered.length === 0 ? (
          <p className={styles.empty}>{filter === 'favorites' ? 'no favorites yet' : 'no entries yet'}</p>
        ) : (
          <div className={styles.entries}>
            {filtered.map(entry => {
              const highlight = entry.entry_photos?.find(p => p.is_highlight)
              const preview = stripHTML(entry.body)
              return (
                <div key={entry.id} className={styles.card} onClick={() => navigate(`/u/${slug}/entry/${entry.id}`)}>
                  {entry.is_favorite && <div className={styles.heartBadge}><RiHeartFill size={16} /></div>}
                  <div className={styles.cardInner}>
                    {highlight && (
                      <div className={styles.cardPhoto}>
                        <img src={highlight.url} alt={highlight.caption || ''} />
                      </div>
                    )}
                    <div className={styles.cardBody}>
                      <span className={styles.cardDate}>{formatDate(entry.created_at)}</span>
                      {entry.mood && <span className={styles.cardMood}>{entry.mood}</span>}
                      {entry.title && <h3 className={styles.cardTitle}>{entry.title}</h3>}
                      <p className={styles.cardPreview}>{preview.length > 200 ? preview.slice(0, 200) + '…' : preview}</p>
                      <span className={styles.readMore}>read →</span>
                    </div>
                  </div>
                  <div className={styles.cardCorner} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <footer className={styles.footer}>
        <span>powered by <a href="/" className={styles.footerLink}>the nameless space</a></span>
      </footer>
    </div>
  )
}
