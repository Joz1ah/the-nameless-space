import { useNavigate } from 'react-router-dom'
import { RiHeartFill } from 'react-icons/ri'
import styles from './NotebookPage.module.css'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })
}
function formatTime(dateStr) {
  return new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function stripHTML(html) {
  if (!html) return ''
  const withoutBlocks = html.replace(/<div[^>]*class="inline-photo-block"[^>]*>[\s\S]*?<\/div>/gi, ' ')
  return withoutBlocks.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
}

export default function NotebookPage({ entry, index, total }) {
  const navigate = useNavigate()
  const photos = entry.entry_photos || []
  const highlightPhoto = photos.find(p => p.is_highlight) || null
  const previewPhotos = photos.filter(p => !p.is_highlight).slice(0, 2)

  const previewText = stripHTML(entry.body)
  const bodyPreview = previewText.length > 260 ? previewText.slice(0, 260) + '…' : previewText

  return (
    <div className={styles.page} onClick={() => navigate(`/entry/${entry.id}`)}>
      <div className={styles.inner}>
        {/* Highlight photo — right column */}
        {highlightPhoto && (
          <div className={styles.highlightWrap}>
            <img src={highlightPhoto.url} alt={highlightPhoto.caption || 'highlight'} className={styles.highlightImg} />
            {highlightPhoto.caption && <span className={styles.highlightCaption}>{highlightPhoto.caption}</span>}
          </div>
        )}

        <div className={styles.mainContent}>
          <div className={styles.meta}>
            <span className={styles.date}>{formatDate(entry.created_at)}</span>
            <span className={styles.time}>{formatTime(entry.created_at)}</span>
          </div>

          {entry.title && <h2 className={styles.title}>{entry.title}</h2>}

          <p className={styles.body}>{bodyPreview}</p>

          {previewPhotos.length > 0 && (
            <div className={styles.photoStrip}>
              {previewPhotos.map((photo) => (
                <div key={photo.id} className={styles.photoThumb}>
                  <img src={photo.url} alt={photo.caption || 'memory'} />
                </div>
              ))}
              {photos.filter(p => !p.is_highlight).length > 2 && (
                <div className={styles.morePhotos}>+{photos.filter(p => !p.is_highlight).length - 2} more</div>
              )}
            </div>
          )}

          <div className={styles.footer}>
            <span className={styles.readMore}>read more →</span>
            <span className={styles.pageNum}>{index + 1} / {total}</span>
          </div>
        </div>
      </div>

      {/* Favorite heart — top-right of card, above highlight photo */}
      {entry.is_favorite && (
        <div className={styles.heartBadge}>
          <RiHeartFill size={20} />
        </div>
      )}

      <div className={styles.corner} aria-hidden="true" />
    </div>
  )
}
