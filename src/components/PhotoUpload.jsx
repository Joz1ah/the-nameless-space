import { useState, useRef } from 'react'
import { supabase } from '../supabase/client'
import { RiImageAddLine, RiCloseLine, RiUploadLine, RiStarFill, RiStarLine } from 'react-icons/ri'
import styles from './PhotoUpload.module.css'

async function compressImage(file, maxWidth = 1400, quality = 0.82) {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        if (width > maxWidth) { height = (height * maxWidth) / width; width = maxWidth }
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob(resolve, 'image/jpeg', quality)
      }
      img.src = e.target.result
    }
    reader.readAsDataURL(file)
  })
}

export default function PhotoUpload({ photos, onChange }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const handleFiles = async (files) => {
    setUploading(true)
    try {
      const uploaded = []
      for (const file of files) {
        const compressed = await compressImage(file)
        const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`
        const { error } = await supabase.storage.from('photos').upload(path, compressed, { contentType: 'image/jpeg' })
        if (error) throw error
        const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
        uploaded.push({
          url: publicUrl,
          caption: '',
          is_highlight: false,
          inline_key: `${Date.now()}-${Math.random().toString(36).slice(2)}`
        })
      }
      onChange([...photos, ...uploaded])
    } catch (err) {
      alert('Photo upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    if (files.length) handleFiles(files)
  }

  const updateCaption = (index, caption) =>
    onChange(photos.map((p, i) => i === index ? { ...p, caption } : p))

  // Toggle: if already highlighted → unhighlight. If not → set as highlight (clear others).
  const toggleHighlight = (index) => {
    if (photos[index].is_highlight) {
      // unhighlight — no highlight on any photo
      onChange(photos.map(p => ({ ...p, is_highlight: false })))
    } else {
      // set this one as highlight, clear others
      onChange(photos.map((p, i) => ({ ...p, is_highlight: i === index })))
    }
  }

  const removePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index)
    // if removed was highlighted, just leave no highlight — don't auto-promote
    onChange(updated)
  }

  return (
    <div className={styles.container}>
      <div className={styles.dropzone}
        onDrop={handleDrop} onDragOver={e => e.preventDefault()}
        onClick={() => fileRef.current.click()}
      >
        <input ref={fileRef} type="file" accept="image/*" multiple hidden
          onChange={e => handleFiles(Array.from(e.target.files))} />
        {uploading
          ? <span className={styles.uploading}><RiUploadLine size={16} /> uploading...</span>
          : <span><RiImageAddLine size={16} /> add photos — drag & drop or click</span>
        }
      </div>

      {photos.length > 0 && (
        <div className={styles.grid}>
          {photos.map((photo, i) => (
            <div key={i}
              className={`${styles.photoItem} ${photo.is_highlight ? styles.highlighted : ''}`}
              style={{ '--rotate': i % 2 === 0 ? '-1.5deg' : '1.2deg' }}>
              <div className={styles.actions}>
                <button
                  className={`${styles.starBtn} ${photo.is_highlight ? styles.starred : ''}`}
                  onClick={() => toggleHighlight(i)}
                  title={photo.is_highlight ? 'Remove highlight' : 'Set as highlight photo'}
                  type="button"
                >
                  {photo.is_highlight ? <RiStarFill size={13} /> : <RiStarLine size={13} />}
                </button>
                <button className={styles.removeBtn} onClick={() => removePhoto(i)} type="button">
                  <RiCloseLine size={13} />
                </button>
              </div>
              <img src={photo.url} alt="entry" />
              <input
                className={styles.caption}
                placeholder="caption..."
                value={photo.caption}
                onChange={e => updateCaption(i, e.target.value)}
              />
              {photo.is_highlight && <div className={styles.highlightBadge}>★ highlight</div>}
            </div>
          ))}
        </div>
      )}

      {photos.length > 0 && (
        <p className={styles.hint}>
          ★ tap to set/remove highlight photo (shown upper-right on card) · all photos can be inserted inline in the editor above
        </p>
      )}
    </div>
  )
}
