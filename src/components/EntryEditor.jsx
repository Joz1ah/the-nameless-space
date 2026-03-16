import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PhotoUpload from './PhotoUpload'
import RichEditor from './RichEditor'
import { RiSaveLine, RiArrowLeftLine, RiDraftLine, RiDeleteBinLine } from 'react-icons/ri'
import styles from './EntryEditor.module.css'

export default function EntryEditor({ initial, onSave, onDelete, saving }) {
  const navigate = useNavigate()
  const [title, setTitle] = useState(initial?.title || '')
  const [body, setBody] = useState(initial?.body || '')
  const [photos, setPhotos] = useState(
    initial?.entry_photos?.map(p => ({
      url: p.url,
      caption: p.caption || '',
      is_highlight: p.is_highlight || false,
      inline_key: p.inline_key || String(p.id || Math.random()),
    })) || []
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const isDraft = initial?.is_draft || false
  const isEdit = !!initial

  const hasContent = () => {
    const stripped = body.replace(/<[^>]+>/g, '').trim()
    return stripped.length > 0 || body.includes('<img')
  }

  const handleSave = async (asDraft = false) => {
    if (!hasContent()) return
    await onSave({ title, body, photos, is_draft: asDraft })
  }

  const handleDelete = async () => {
    if (!onDelete) return
    setDeleting(true)
    try { await onDelete() } 
    finally { setDeleting(false); setConfirmDelete(false) }
  }

  const highlightPhoto = photos.find(p => p.is_highlight)
  const wordCount = body
    ? body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().split(' ').filter(Boolean).length
    : 0

  return (
    <div className={styles.wrapper}>
      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className={styles.confirmOverlay} onClick={() => setConfirmDelete(false)}>
          <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>delete this entry?</h3>
            <p className={styles.confirmSub}>this cannot be undone. your words will be gone forever.</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setConfirmDelete(false)}>cancel</button>
              <button className={styles.confirmDelete} onClick={handleDelete} disabled={deleting}>
                {deleting ? <span className={styles.spinner} /> : null}
                {deleting ? 'deleting...' : 'yes, delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.page}>
        <div className={styles.margin} aria-hidden="true" />
        <div className={styles.inner}>
          <div className={styles.topBar}>
            <button className={styles.backBtn} onClick={() => navigate(-1)}>
              <RiArrowLeftLine size={16} /><span>back</span>
            </button>
            <div className={styles.topRight}>
              {isDraft && <span className={styles.draftTag}>✎ draft</span>}
              <div className={styles.datestamp}>
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </div>
            </div>
          </div>

          {highlightPhoto && (
            <div className={styles.highlightPreview}>
              <img src={highlightPhoto.url} alt="highlight" />
              <span>★ highlight — shown upper-right on card</span>
            </div>
          )}

          <input
            className={styles.titleInput}
            placeholder="give this page a title... (optional)"
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          <RichEditor value={body} onChange={setBody} photos={photos} />

          <div className={styles.photoSection}>
            <p className={styles.photoLabel}>
              📎 photos
              <span className={styles.photoHint}> — ★ to set/remove highlight · all photos insertable inline above</span>
            </p>
            <PhotoUpload photos={photos} onChange={setPhotos} />
          </div>

          <div className={styles.footer}>
            <span className={styles.wordCount}>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
            <div className={styles.footerActions}>
              {/* Delete — only shown when editing an existing entry */}
              {isEdit && onDelete && (
                <button className={styles.deleteBtn} onClick={() => setConfirmDelete(true)} disabled={saving || deleting} title="Delete entry">
                  <RiDeleteBinLine size={15} />
                  delete
                </button>
              )}
              <button className={styles.draftBtn} onClick={() => handleSave(true)} disabled={saving || !hasContent()}>
                {saving ? <span className={styles.spinner} /> : <RiDraftLine size={15} />}
                {saving ? 'saving...' : 'save draft'}
              </button>
              <button className={styles.saveBtn} onClick={() => handleSave(false)} disabled={saving || !hasContent()}>
                {saving ? <span className={styles.spinner} /> : <RiSaveLine size={15} />}
                {saving ? 'saving...' : 'publish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
