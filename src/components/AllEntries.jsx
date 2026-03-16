import { useState } from 'react'
import { RiCloseLine, RiHeartFill, RiDraftLine, RiEyeOffLine } from 'react-icons/ri'
import styles from './AllEntries.module.css'

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
}

const TABS = [
  { key: 'published', label: 'all entries' },
  { key: 'favorites', label: '♥ favorites' },
  { key: 'hidden',    label: '🔒 hidden' },
  { key: 'drafts',    label: '✎ drafts' },
]

export default function AllEntries({ entries, onClose, onSelect, onSelectEntry }) {
  const [tab, setTab] = useState('published')

  const filtered = entries.filter(e => {
    if (tab === 'published') return !e.is_draft && !e.is_locked
    if (tab === 'favorites') return e.is_favorite && !e.is_draft
    if (tab === 'hidden')    return e.is_locked && !e.is_draft
    if (tab === 'drafts')    return e.is_draft
    return true
  })

  const publishedEntries = entries.filter(e => !e.is_draft)

  const emptyMsg = {
    published: 'no entries yet',
    favorites: 'no favorites yet — heart an entry to save it here',
    hidden: 'no hidden entries — use the ⋯ menu on any entry to hide it from visitors',
    drafts: 'no drafts',
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.drawer} onClick={e => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>entries</h2>
          <button className={styles.closeBtn} onClick={onClose}><RiCloseLine size={20} /></button>
        </div>

        <div className={styles.tabs}>
          {TABS.map(t => (
            <button key={t.key}
              className={`${styles.tab} ${tab === t.key ? styles.tabActive : ''}`}
              onClick={() => setTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        <div className={styles.list}>
          {filtered.length === 0 && (
            <p className={styles.empty}>{emptyMsg[tab]}</p>
          )}
          {filtered.map((entry) => {
            const pubIdx = publishedEntries.findIndex(e => e.id === entry.id)
            return (
              <button key={entry.id} className={styles.item}
                onClick={() => {
                  if (entry.is_draft || pubIdx < 0) { onClose(); onSelectEntry?.(entry.id) }
                  else { onSelect(pubIdx) }
                }}>
                <div className={styles.itemLeft}>
                  <span className={styles.num}>
                    {pubIdx >= 0 ? String(pubIdx + 1).padStart(2, '0') : '—'}
                  </span>
                  <div className={styles.itemBody}>
                    <span className={styles.itemTitle}>
                      {entry.is_draft   && <RiDraftLine   size={12} style={{ marginRight: 4, opacity: 0.6 }} />}
                      {entry.is_locked  && <RiEyeOffLine  size={12} style={{ marginRight: 4, opacity: 0.6 }} />}
                      {entry.title || '(untitled)'}
                    </span>
                    <span className={styles.itemDate}>{formatDate(entry.created_at)}</span>
                  </div>
                </div>
                <div className={styles.itemRight}>
                  {entry.is_favorite && <RiHeartFill size={13} className={styles.heartIcon} />}
                  {entry.entry_photos?.find(p => p.is_highlight) && (
                    <img className={styles.thumb}
                      src={entry.entry_photos.find(p => p.is_highlight).url} alt="thumb" />
                  )}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
