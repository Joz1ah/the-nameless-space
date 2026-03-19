import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase/client'
import { RiArrowLeftLine, RiCloseLine, RiHeartFill, RiMoonLine, RiSunLine } from 'react-icons/ri'
import styles from './PublicEntryView.module.css'

function formatDate(d) { return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) }
function formatTime(d) { return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) }
function isHTML(str) { return str && /<[a-z][\s\S]*>/i.test(str) }

export default function PublicEntryView() {
  const { slug, id } = useParams()
  const navigate = useNavigate()
  const [entry, setEntry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lightbox, setLightbox] = useState(null)
  const [readerTheme, setReaderTheme] = useState(() => localStorage.getItem('reader-theme') || 'light')
  const richBodyRef = useRef(null)

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

  useEffect(() => { load() }, [id])

  const load = async () => {
    setLoading(true)
    const { data: ent } = await supabase
      .from('entries').select('*, entry_photos(*)')
      .eq('id', id).eq('is_draft', false).eq('is_locked', false).single()
    if (ent) {
      setEntry({ ...ent, entry_photos: (ent.entry_photos || []).sort((a, b) => (a.position || 0) - (b.position || 0)) })
    }
    setLoading(false)
  }

  useEffect(() => {
    if (!richBodyRef.current || !entry) return
    const photos = entry.entry_photos || []
    richBodyRef.current.querySelectorAll('.inline-photo-block').forEach(block => {
      const key = block.getAttribute('data-photo-key')
      const photo = photos.find(p => p.inline_key === key || String(p.id) === key)
      const img = block.querySelector('img')
      block.style.cursor = 'zoom-in'
      block.onclick = () => setLightbox(photo ? { url: photo.url, caption: photo.caption } : img ? { url: img.src, caption: '' } : null)
    })
    richBodyRef.current.querySelectorAll('img').forEach(img => {
      if (img.closest('.inline-photo-block')) return
      img.style.cursor = 'zoom-in'
      img.onclick = e => { e.stopPropagation(); setLightbox({ url: img.src, caption: img.alt || '' }) }
    })
  }, [entry])

  if (loading) return <div className={styles.loading}><div className={styles.dot} /></div>
  if (!entry) return (
    <div className={styles.notFound}>
      <p>this entry is private or doesn't exist</p>
      <button onClick={() => navigate(`/u/${slug}`)}>← back to blog</button>
    </div>
  )

  const photos = entry.entry_photos || []
  const highlightPhoto = photos.find(p => p.is_highlight)
  const bodyIsHTML = isHTML(entry.body)

  return (
    <div className={styles.shell}>
      {lightbox && (
        <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
          <button className={styles.lightboxClose} onClick={() => setLightbox(null)}><RiCloseLine size={22} /></button>
          <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
            <img src={lightbox.url} alt={lightbox.caption || ''} />
            {lightbox.caption && <p className={styles.lightboxCaption}>{lightbox.caption}</p>}
          </div>
        </div>
      )}

      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(`/u/${slug}`)}>
          <RiArrowLeftLine size={18} /><span>Back</span>
        </button>
        <button className={styles.themeToggle} onClick={toggleReaderTheme} title="Toggle theme">
          {readerTheme === 'light' ? <RiMoonLine size={17} /> : <RiSunLine size={17} />}
        </button>
      </div>

      <div className={styles.pageWrap}>
        <div className={styles.page}>
          <div className={styles.margin} />
          <div className={styles.content}>
            {entry.is_favorite && <div className={styles.heartBadge}><RiHeartFill size={15} /></div>}
            <div className={styles.headerRow}>
              <div className={styles.headerLeft}>
                <div className={styles.meta}>
                  <span className={styles.date}>{formatDate(entry.created_at)}</span>
                  <span className={styles.time}>{formatTime(entry.created_at)}</span>
                </div>
                {entry.title && <h1 className={styles.title}>{entry.title}</h1>}
              </div>
              {highlightPhoto && (
                <div className={styles.highlightWrap} onClick={() => setLightbox({ url: highlightPhoto.url, caption: highlightPhoto.caption })}>
                  <img src={highlightPhoto.url} alt={highlightPhoto.caption || ''} />
                  {highlightPhoto.caption && <span className={styles.highlightCaption}>{highlightPhoto.caption}</span>}
                </div>
              )}
            </div>
            {bodyIsHTML
              ? <div ref={richBodyRef} className={`${styles.body} ${styles.richBody}`} dangerouslySetInnerHTML={{ __html: entry.body }} />
              : <div className={styles.body}>{entry.body.split('\n').map((l, i) => <p key={i}>{l || <br />}</p>)}</div>
            }
          </div>
          <div className={styles.corner} />
        </div>
      </div>
    </div>
  )
}
