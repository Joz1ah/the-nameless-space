import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PhotoUpload from './PhotoUpload'
import RichEditor from './RichEditor'
import { RiSaveLine, RiArrowLeftLine, RiDraftLine, RiDeleteBinLine } from 'react-icons/ri'
import styles from './EntryEditor.module.css'

export const CATEGORIES = [
  { key: 'food',   label: 'Food',       emoji: '🍽️' },
  { key: 'travel', label: 'Adventure',  emoji: '🌍' },
  { key: 'daily',  label: 'Daily',      emoji: '📅' },
]

const FOOD_TYPES = [
  'Chinese Cuisine', 'Japanese Cuisine', 'Korean Cuisine', 'Thai Cuisine',
  'Vietnamese Cuisine', 'Indian Cuisine', 'Italian Cuisine', 'French Cuisine',
  'Mexican Cuisine', 'American Cuisine', 'Mediterranean Cuisine', 'Greek Cuisine',
  'Spanish Cuisine', 'Middle Eastern Cuisine', 'Filipino Cuisine', 'Brazilian Cuisine',
  'Fusion', 'Fast Food', 'Street Food', 'Fine Dining',
]

const ADVENTURE_TYPES = [
  'Hiking', 'Camping', 'Road Trip', 'Beach Vacation', 'City Exploration',
  'International Travel', 'Day Trip', 'Backpacking', 'Skiing', 'Scuba Diving',
  'Cycling Tour', 'Staycation', 'Food Tour', 'Cultural Trip',
]

export const MOODS = [
  { emoji: '😊', label: 'happy' },
  { emoji: '😌', label: 'calm' },
  { emoji: '🥰', label: 'loved' },
  { emoji: '✨', label: 'inspired' },
  { emoji: '🎉', label: 'excited' },
  { emoji: '🤔', label: 'reflective' },
  { emoji: '😔', label: 'sad' },
  { emoji: '😴', label: 'tired' },
  { emoji: '😤', label: 'frustrated' },
  { emoji: '🌧', label: 'melancholic' },
]

function ComboInput({ value, onChange, options, placeholder, maxLength }) {
  const [open, setOpen] = useState(false)
  const [filtered, setFiltered] = useState(options)
  const wrapRef = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleChange = (e) => {
    const v = e.target.value.slice(0, maxLength)
    onChange(v)
    setFiltered(options.filter(o => o.toLowerCase().includes(v.toLowerCase())))
    setOpen(true)
  }

  const handleSelect = (opt) => {
    onChange(opt)
    setOpen(false)
  }

  return (
    <div className={styles.comboWrap} ref={wrapRef}>
      <input
        className={styles.metaInput}
        value={value}
        onChange={handleChange}
        onFocus={() => { setFiltered(value ? options.filter(o => o.toLowerCase().includes(value.toLowerCase())) : options); setOpen(true) }}
        placeholder={placeholder}
        maxLength={maxLength}
        autoComplete="off"
      />
      <span className={styles.comboChevron} onClick={() => setOpen(o => !o)}>▾</span>
      {open && filtered.length > 0 && (
        <div className={styles.comboDropdown}>
          {filtered.map(opt => (
            <button
              key={opt}
              type="button"
              className={styles.comboOption}
              onMouseDown={() => handleSelect(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

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
  const [mood, setMood] = useState(initial?.mood || null)
  const [category, setCategory] = useState(initial?.category || null)
  const [meta, setMeta] = useState({
    food_name: initial?.meta?.food_name || '',
    food_type: initial?.meta?.food_type || '',
    location: initial?.meta?.location || '',
    adventure_type: initial?.meta?.adventure_type || '',
    daily_goal: initial?.meta?.daily_goal || '',
  })
  const [editorKey] = useState(0)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showBackConfirm, setShowBackConfirm] = useState(false)

  const isDraft = initial?.is_draft || false
  const isEdit = !!initial

  const hasContent = () => {
    const stripped = body.replace(/<[^>]+>/g, '').trim()
    return stripped.length > 0 || body.includes('<img')
  }

  const hasUnsavedChanges = () => {
    if (!isEdit) {
      return title.trim() !== '' || hasContent() || photos.length > 0 ||
        mood !== null || category !== null || Object.values(meta).some(v => v.trim() !== '')
    }
    return (
      title !== (initial?.title || '') ||
      body !== (initial?.body || '') ||
      mood !== (initial?.mood || null) ||
      category !== (initial?.category || null) ||
      photos.length !== (initial?.entry_photos?.length || 0) ||
      JSON.stringify(meta) !== JSON.stringify({
        food_name: initial?.meta?.food_name || '',
        food_type: initial?.meta?.food_type || '',
        location: initial?.meta?.location || '',
        adventure_type: initial?.meta?.adventure_type || '',
        daily_goal: initial?.meta?.daily_goal || '',
      })
    )
  }

  const handleBackClick = () => {
    if (hasUnsavedChanges()) setShowBackConfirm(true)
    else navigate(-1)
  }

  const handleCategoryClick = (key) => {
    if (category === key) { setCategory(null); return }
    setCategory(key)
  }

  const updateMeta = (field, value) => setMeta(m => ({ ...m, [field]: value }))

  const relevantMeta = () => {
    if (category === 'food') return { food_name: meta.food_name, food_type: meta.food_type }
    if (category === 'travel') return { location: meta.location, adventure_type: meta.adventure_type }
    if (category === 'daily') return { daily_goal: meta.daily_goal }
    return null
  }

  const cleanBody = (html) => html ? html.replace(/&nbsp;/g, ' ') : html

  const handleSave = async (asDraft = false) => {
    if (!hasContent()) return
    setShowBackConfirm(false)
    await onSave({ title, body: cleanBody(body), photos, is_draft: asDraft, mood, category, meta: relevantMeta() })
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
      {showBackConfirm && (
        <div className={styles.confirmOverlay} onClick={() => setShowBackConfirm(false)}>
          <div className={styles.confirmCard} onClick={e => e.stopPropagation()}>
            <h3 className={styles.confirmTitle}>{isEdit ? 'unsaved changes' : 'leave page?'}</h3>
            <p className={styles.confirmSub}>
              {isEdit
                ? 'you have unsaved changes. what would you like to do?'
                : 'you have content that hasn\'t been saved yet.'}
            </p>
            <div className={styles.backConfirmActions}>
              <button className={styles.saveBtn} style={{ justifyContent: 'center' }}
                onClick={() => handleSave(isEdit ? false : true)}>
                <RiSaveLine size={15} />
                {isEdit ? 'save changes' : 'save as draft'}
              </button>
              <button className={styles.confirmDelete} onClick={() => navigate(-1)}>
                discard &amp; leave
              </button>
              <button className={styles.confirmCancel} onClick={() => setShowBackConfirm(false)}>
                continue writing
              </button>
            </div>
          </div>
        </div>
      )}

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
            <button className={styles.backBtn} onClick={handleBackClick}>
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

          {/* Template / Category picker */}
          <div className={styles.categoryRow}>
            <span className={styles.categoryLabel}>template</span>
            <div className={styles.categoryPicker}>
              <button
                type="button"
                className={`${styles.categoryBtn} ${!category ? styles.categoryBtnActive : ''}`}
                onClick={() => setCategory(null)}
              >
                📝 No Template
              </button>
              {CATEGORIES.map(c => (
                <button
                  key={c.key}
                  type="button"
                  className={`${styles.categoryBtn} ${category === c.key ? styles.categoryBtnActive : ''}`}
                  onClick={() => handleCategoryClick(c.key)}
                >
                  {c.emoji} {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Food-specific fields */}
          {category === 'food' && (
            <div className={styles.metaFields}>
              <div className={styles.metaFieldRow}>
                <input
                  className={styles.metaInput}
                  placeholder="dish name..."
                  value={meta.food_name}
                  onChange={e => updateMeta('food_name', e.target.value)}
                  maxLength={80}
                />
                <ComboInput
                  value={meta.food_type}
                  onChange={v => updateMeta('food_type', v)}
                  options={FOOD_TYPES}
                  placeholder="type of cuisine..."
                  maxLength={60}
                />
              </div>
            </div>
          )}

          {/* Adventure-specific fields */}
          {category === 'travel' && (
            <div className={styles.metaFields}>
              <div className={styles.metaFieldRow}>
                <input
                  className={styles.metaInput}
                  placeholder="where did you go?..."
                  value={meta.location}
                  onChange={e => updateMeta('location', e.target.value)}
                  maxLength={100}
                />
                <ComboInput
                  value={meta.adventure_type}
                  onChange={v => updateMeta('adventure_type', v)}
                  options={ADVENTURE_TYPES}
                  placeholder="type of adventure..."
                  maxLength={60}
                />
              </div>
            </div>
          )}

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

          {/* Daily goal — shown below title as subtitle */}
          {category === 'daily' && (
            <input
              className={styles.dailyGoalInput}
              placeholder="what's on your mind?... (optional)"
              value={meta.daily_goal}
              onChange={e => updateMeta('daily_goal', e.target.value)}
              maxLength={150}
            />
          )}

          <RichEditor key={editorKey} value={body} onChange={setBody} photos={photos} />

          <div className={styles.photoSection}>
            <p className={styles.photoLabel}>
              📎 photos
              <span className={styles.photoHint}> — ★ to set/remove highlight · all photos insertable inline above</span>
            </p>
            <PhotoUpload photos={photos} onChange={setPhotos} />
          </div>

          <div className={styles.moodRow}>
            <span className={styles.moodLabel}>mood</span>
            <div className={styles.moodPicker}>
              {MOODS.map(m => (
                <button
                  key={m.emoji}
                  type="button"
                  title={m.label}
                  className={`${styles.moodBtn} ${mood === m.emoji ? styles.moodBtnActive : ''}`}
                  onClick={() => setMood(prev => prev === m.emoji ? null : m.emoji)}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          <div className={styles.footer}>
            <span className={styles.wordCount}>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
            <div className={styles.footerActions}>
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
                {saving ? 'saving...' : isEdit ? 'save changes' : 'publish'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
