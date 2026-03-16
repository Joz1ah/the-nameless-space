import { useParams, useNavigate } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { useAuthContext } from '../App'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { RiArrowLeftLine, RiCloseLine, RiHeartLine, RiHeartFill, RiEditLine, RiEyeOffLine, RiEyeLine } from 'react-icons/ri'
import EntryFAB from '../components/EntryFAB'
import styles from './EntryView.module.css'

function formatDate(d) {
  return new Date(d).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}
function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}
function isHTML(str) { return str && /<[a-z][\s\S]*>/i.test(str) }

function renderLegacyBody(body, allPhotos, onPhotoClick) {
  const parts = body.split(/(\[photo:[^\]]+\])/g)
  return parts.map((part, i) => {
    const match = part.match(/^\[photo:([^\]]+)\]$/)
    if (match) {
      const key = match[1]
      const photo = allPhotos.find(p => p.inline_key === key || String(p.id) === key)
      if (!photo) return null
      return (
        <div key={i} className={styles.inlinePhoto}>
          <div className={styles.inlinePhotoInner} style={{ '--rotate': `${(i % 3 - 1) * 1.5}deg` }}
            onClick={() => onPhotoClick({ url: photo.url, caption: photo.caption })}>
            <img src={photo.url} alt={photo.caption || 'photo'} />
            {photo.caption && <span className={styles.inlineCaption}>{photo.caption}</span>}
          </div>
        </div>
      )
    }
    if (!part.trim() && !part.includes('\n')) return null
    return (
      <div key={i} className={styles.textBlock}>
        {part.split('\n').map((line, j) => <p key={j}>{line || <br />}</p>)}
      </div>
    )
  })
}

export default function EntryView() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthContext()
  const { entries, deleteEntry, toggleFavorite, toggleLocked } = useEntries(user?.id)

  const [lightbox, setLightbox] = useState(null)
  const [navDir, setNavDir] = useState(null)
  const [visible, setVisible] = useState(true)
  const richBodyRef = useRef(null)

  const entryIndex = entries.findIndex(e => e.id === id)
  const entry = entries[entryIndex]
  const publishedEntries = entries.filter(e => !e.is_draft)
  const publishedIndex = publishedEntries.findIndex(e => e.id === id)
  const prevEntry = publishedEntries[publishedIndex - 1] || null
  const nextEntry = publishedEntries[publishedIndex + 1] || null

  useEffect(() => { setVisible(true); setNavDir(null); window.scrollTo(0, 0) }, [id])

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
      img.onclick = e => { e.stopPropagation(); const ph = photos.find(p => p.url === img.src); setLightbox({ url: img.src, caption: ph?.caption || img.alt || '' }) }
    })
  }, [entry, id])

  const navigateTo = (targetId, dir) => { setNavDir(dir); setVisible(false); setTimeout(() => navigate(`/entry/${targetId}`), 280) }

  const handleDelete = async () => {
    if (!window.confirm('delete this entry? this cannot be undone.')) return
    await deleteEntry(id)
    navigate('/notebook')
  }

  if (!entry) return (
    <div className={styles.notFound}><p>entry not found</p><button onClick={() => navigate('/notebook')}>← go home</button></div>
  )

  const isDraft = entry.is_draft
  const photos = (entry.entry_photos || []).sort((a, b) => (a.position || 0) - (b.position || 0))
  const highlightPhoto = photos.find(p => p.is_highlight) || null
  const nonHighlightPhotos = photos.filter(p => !p.is_highlight)
  const allPhotosForLightbox = photos
  const lightboxIndex = lightbox ? allPhotosForLightbox.findIndex(p => p.url === lightbox.url) : -1
  const bodyIsHTML = isHTML(entry.body)
  const usedKeys = new Set()
  if (!bodyIsHTML) { (entry.body.match(/\[photo:([^\]]+)\]/g) || []).forEach(m => usedKeys.add(m.replace('[photo:', '').replace(']', ''))) }
  const gridPhotos = bodyIsHTML ? [] : nonHighlightPhotos.filter(p => !usedKeys.has(p.inline_key) && !usedKeys.has(String(p.id)))

  return (
    <>
      <div className={`${styles.shell} ${!visible ? (navDir === 'next' ? styles.exitLeft : styles.exitRight) : styles.enterAnim}`}>

        {lightbox && (
          <div className={styles.lightboxOverlay} onClick={() => setLightbox(null)}>
            <button className={styles.lightboxClose} onClick={() => setLightbox(null)}><RiCloseLine size={22} /></button>
            {lightboxIndex > 0 && (
              <button className={`${styles.lightboxNav} ${styles.lightboxPrev}`}
                onClick={e => { e.stopPropagation(); const p = allPhotosForLightbox[lightboxIndex - 1]; setLightbox({ url: p.url, caption: p.caption }) }}>‹</button>
            )}
            <div className={styles.lightboxContent} onClick={e => e.stopPropagation()}>
              <img src={lightbox.url} alt={lightbox.caption || 'photo'} />
              {lightbox.caption && <p className={styles.lightboxCaption}>{lightbox.caption}</p>}
            </div>
            {lightboxIndex !== -1 && lightboxIndex < allPhotosForLightbox.length - 1 && (
              <button className={`${styles.lightboxNav} ${styles.lightboxNext}`}
                onClick={e => { e.stopPropagation(); const p = allPhotosForLightbox[lightboxIndex + 1]; setLightbox({ url: p.url, caption: p.caption }) }}>›</button>
            )}
          </div>
        )}

        <div className={styles.topBar}>
          <button className={styles.backBtn} onClick={() => navigate('/notebook')}>
            <RiArrowLeftLine size={18} /><span>back to notebook</span>
          </button>
        </div>

        {isDraft && <div className={styles.draftBanner}>✎ draft — not shown in the main notebook</div>}
        {entry.is_locked && !isDraft && <div className={styles.lockedBanner}>🔒 hidden from your public blog</div>}

        <div className={styles.pageWrap}>
          <div className={styles.page}>
            <div className={styles.margin} aria-hidden="true" />

            {/* Corner stack — direct child of .page so it's never clipped by .content overflow */}
            <div className={styles.cornerStack}>
              {isDraft ? (
                <button className={styles.cornerBtn} onClick={() => navigate(`/edit/${id}`)} title="Edit draft">
                  <RiEditLine size={14} />
                </button>
              ) : (
                <>
                  <button
                    className={`${styles.cornerBtn} ${entry.is_favorite ? styles.heartActive : ''}`}
                    onClick={() => toggleFavorite(id)}
                    title={entry.is_favorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    {entry.is_favorite ? <RiHeartFill size={14} /> : <RiHeartLine size={14} />}
                  </button>
                  <button
                    className={`${styles.cornerBtn} ${entry.is_locked ? styles.lockActive : ''}`}
                    onClick={() => toggleLocked(id)}
                    title={entry.is_locked ? 'Unhide from visitors' : 'Hide from visitors'}
                  >
                    {entry.is_locked ? <RiEyeOffLine size={14} /> : <RiEyeLine size={14} />}
                  </button>
                  <button
                    className={styles.cornerBtn}
                    onClick={() => navigate(`/edit/${id}`)}
                    title="Edit entry"
                  >
                    <RiEditLine size={14} />
                  </button>
                </>
              )}
            </div>

            <div className={styles.content}>
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
                    <img src={highlightPhoto.url} alt={highlightPhoto.caption || 'highlight'} />
                    {highlightPhoto.caption && <span className={styles.highlightCaption}>{highlightPhoto.caption}</span>}
                  </div>
                )}
              </div>

              {bodyIsHTML
                ? <div ref={richBodyRef} className={`${styles.body} ${styles.richBody}`} dangerouslySetInnerHTML={{ __html: entry.body }} />
                : <div className={styles.body}>{renderLegacyBody(entry.body, nonHighlightPhotos, setLightbox)}</div>
              }

              {gridPhotos.length > 0 && (
                <div className={styles.photoGrid}>
                  {gridPhotos.map((photo, i) => (
                    <figure key={photo.id} className={styles.photoFigure} style={{ '--rotate': `${(i % 3 - 1) * 2.5}deg` }}
                      onClick={() => setLightbox({ url: photo.url, caption: photo.caption })}>
                      <img src={photo.url} alt={photo.caption || 'memory'} />
                      {photo.caption && <figcaption className={styles.caption}>{photo.caption}</figcaption>}
                    </figure>
                  ))}
                </div>
              )}
            </div>
            <div className={styles.corner} aria-hidden="true" />
          </div>

          {!isDraft && (
            <div className={styles.pageNav}>
              {prevEntry ? (
                <button className={styles.navBtn} onClick={() => navigateTo(prevEntry.id, 'prev')}>
                  <span className={styles.navArrow}>←</span>
                  <div><span className={styles.navLabel}>previous</span><span className={styles.navTitle}>{prevEntry.title || formatDate(prevEntry.created_at)}</span></div>
                </button>
              ) : <div />}
              {nextEntry ? (
                <button className={`${styles.navBtn} ${styles.navBtnRight}`} onClick={() => navigateTo(nextEntry.id, 'next')}>
                  <div><span className={styles.navLabel}>next</span><span className={styles.navTitle}>{nextEntry.title || formatDate(nextEntry.created_at)}</span></div>
                  <span className={styles.navArrow}>→</span>
                </button>
              ) : <div />}
            </div>
          )}
        </div>
      </div>

      {createPortal(
        <EntryFAB
          entryId={id}
          prevEntry={isDraft ? null : prevEntry}
          nextEntry={isDraft ? null : nextEntry}
          lightboxOpen={!!lightbox}
        />,
        document.body
      )}
    </>
  )
}
