import { useRef, useCallback, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import {
  RiBold, RiItalic, RiUnderline, RiStrikethrough,
  RiListUnordered, RiListOrdered,
  RiAlignLeft, RiAlignCenter, RiAlignRight, RiAlignJustify,
  RiImageAddLine, RiSubtractLine, RiAddLine
} from 'react-icons/ri'
import styles from './RichEditor.module.css'

const SIZE_MAP = [
  { display: 10, cmd: '1' },
  { display: 12, cmd: '2' },
  { display: 14, cmd: '3' },
  { display: 16, cmd: '4' },
  { display: 18, cmd: '5' },
  { display: 24, cmd: '6' },
  { display: 32, cmd: '7' },
]
const DEFAULT_SIZE_IDX = 2

export default function RichEditor({ value, onChange, photos }) {
  const editorRef = useRef(null)
  const initialized = useRef(false)
  const [sizeIdx, setSizeIdx] = useState(DEFAULT_SIZE_IDX)
  const [selectedImg, setSelectedImg] = useState(null)
  const [overlayRect, setOverlayRect] = useState(null)

  const syncContent = useCallback(() => {
    if (editorRef.current) onChange(editorRef.current.innerHTML)
  }, [onChange])

  const exec = useCallback((cmd, val = null) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    syncContent()
  }, [syncContent])

  const handleRef = (el) => {
    editorRef.current = el
    if (el && !initialized.current) {
      el.innerHTML = value || ''
      el.querySelectorAll('.inline-photo-block').forEach(b => { b.contentEditable = 'false' })
      initialized.current = true
    }
  }

  const decreaseSize = () => {
    const next = Math.max(0, sizeIdx - 1)
    setSizeIdx(next)
    editorRef.current?.focus()
    document.execCommand('fontSize', false, SIZE_MAP[next].cmd)
    syncContent()
  }

  const increaseSize = () => {
    const next = Math.min(SIZE_MAP.length - 1, sizeIdx + 1)
    setSizeIdx(next)
    editorRef.current?.focus()
    document.execCommand('fontSize', false, SIZE_MAP[next].cmd)
    syncContent()
  }

  const insertPhotoBlock = (photo) => {
    editorRef.current?.focus()
    const key = photo.inline_key
    const caption = photo.caption ? `<div class="inline-photo-caption">${photo.caption}</div>` : ''
    const html = `<div class="inline-photo-block" data-photo-key="${key}" contenteditable="false"><img src="${photo.url}" alt="${photo.caption || ''}" style="max-width:100%;border-radius:2px;" />${caption}</div><p><br></p>`
    document.execCommand('insertHTML', false, html)
    syncContent()
  }

  // ── Image selection & overlay ─────────────────────────────────────────────

  const updateOverlay = useCallback((imgEl) => {
    if (!imgEl) { setOverlayRect(null); return }
    const r = imgEl.getBoundingClientRect()
    setOverlayRect({ top: r.top, left: r.left, width: r.width, height: r.height })
  }, [])

  const deselect = useCallback(() => {
    setSelectedImg(null)
    setOverlayRect(null)
  }, [])

  const selectImg = useCallback((imgEl) => {
    setSelectedImg(imgEl)
    updateOverlay(imgEl)
  }, [updateOverlay])

  useEffect(() => {
    if (!selectedImg) return
    const update = () => updateOverlay(selectedImg)
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [selectedImg, updateOverlay])

  useEffect(() => {
    if (!selectedImg) return
    const onDown = (e) => {
      if (editorRef.current?.contains(e.target)) return
      if (e.target.closest('[data-img-overlay]')) return
      deselect()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [selectedImg, deselect])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') deselect() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [deselect])

  const handleEditorClick = useCallback((e) => {
    const block = e.target.closest('.inline-photo-block')
    if (block) {
      const img = block.querySelector('img')
      if (img) { selectImg(img); return }
    }
    deselect()
  }, [selectImg, deselect])

  // ── Resize ────────────────────────────────────────────────────────────────

  const handleResizeDrag = useCallback((e) => {
    e.preventDefault()
    if (!selectedImg) return
    const startX = e.clientX
    const startWidth = selectedImg.getBoundingClientRect().width
    const editorW = (editorRef.current?.getBoundingClientRect().width || 600) - 40
    const onMove = (mv) => {
      const newW = Math.max(60, Math.min(editorW, startWidth + mv.clientX - startX))
      selectedImg.style.width = newW + 'px'
      selectedImg.style.maxWidth = '100%'
      updateOverlay(selectedImg)
    }
    const onUp = () => {
      syncContent()
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }, [selectedImg, updateOverlay, syncContent])

  const handleResizeTouchDrag = useCallback((e) => {
    e.preventDefault()
    if (!selectedImg || !e.touches[0]) return
    const startX = e.touches[0].clientX
    const startWidth = selectedImg.getBoundingClientRect().width
    const editorW = (editorRef.current?.getBoundingClientRect().width || 600) - 40
    const onMove = (mv) => {
      if (!mv.touches[0]) return
      const newW = Math.max(60, Math.min(editorW, startWidth + mv.touches[0].clientX - startX))
      selectedImg.style.width = newW + 'px'
      selectedImg.style.maxWidth = '100%'
      updateOverlay(selectedImg)
    }
    const onEnd = () => {
      syncContent()
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onEnd)
  }, [selectedImg, updateOverlay, syncContent])

  const applySize = useCallback((pct) => {
    if (!selectedImg) return
    const editorW = (editorRef.current?.getBoundingClientRect().width || 600) - 36
    selectedImg.style.width = Math.round(editorW * pct / 100) + 'px'
    selectedImg.style.maxWidth = '100%'
    syncContent()
    requestAnimationFrame(() => updateOverlay(selectedImg))
  }, [selectedImg, syncContent, updateOverlay])

  const formatTools = [
    { icon: <RiBold size={15} />, cmd: 'bold', title: 'Bold' },
    { icon: <RiItalic size={15} />, cmd: 'italic', title: 'Italic' },
    { icon: <RiUnderline size={15} />, cmd: 'underline', title: 'Underline' },
    { icon: <RiStrikethrough size={15} />, cmd: 'strikeThrough', title: 'Strikethrough' },
  ]
  const listTools = [
    { icon: <RiListUnordered size={15} />, cmd: 'insertUnorderedList', title: 'Bullet list' },
    { icon: <RiListOrdered size={15} />, cmd: 'insertOrderedList', title: 'Numbered list' },
  ]
  const alignTools = [
    { icon: <RiAlignLeft size={15} />,    cmd: 'justifyLeft',   title: 'Align left' },
    { icon: <RiAlignCenter size={15} />,  cmd: 'justifyCenter', title: 'Align center' },
    { icon: <RiAlignRight size={15} />,   cmd: 'justifyRight',  title: 'Align right' },
    { icon: <RiAlignJustify size={15} />, cmd: 'justifyFull',   title: 'Justify' },
  ]

  const sizeBarAbove = overlayRect ? overlayRect.top > 60 : true

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {formatTools.map((t, i) => (
          <button key={i} type="button" title={t.title} className={styles.toolBtn}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd) }}>
            {t.icon}
          </button>
        ))}

        <div className={styles.sep} />

        <div className={styles.sizeSpinner}>
          <button type="button" className={styles.sizeStep} title="Decrease font size"
            onMouseDown={e => { e.preventDefault(); decreaseSize() }}
            disabled={sizeIdx === 0}>
            <RiSubtractLine size={11} />
          </button>
          <span className={styles.sizeDisplay}>{SIZE_MAP[sizeIdx].display}</span>
          <button type="button" className={styles.sizeStep} title="Increase font size"
            onMouseDown={e => { e.preventDefault(); increaseSize() }}
            disabled={sizeIdx === SIZE_MAP.length - 1}>
            <RiAddLine size={11} />
          </button>
        </div>

        <div className={styles.sep} />

        {listTools.map((t, i) => (
          <button key={i} type="button" title={t.title} className={styles.toolBtn}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd) }}>
            {t.icon}
          </button>
        ))}

        <div className={styles.sep} />

        {alignTools.map((t, i) => (
          <button key={i} type="button" title={t.title} className={styles.toolBtn}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd) }}>
            {t.icon}
          </button>
        ))}

        {photos.length > 0 && (
          <>
            <div className={styles.sep} />
            <span className={styles.insertLabel}><RiImageAddLine size={13} /> insert:</span>
            {photos.map((p, i) => (
              <button key={i} type="button" title={`Insert: ${p.caption || 'photo ' + (i + 1)}`}
                className={styles.photoThumbBtn}
                onMouseDown={e => { e.preventDefault(); insertPhotoBlock(p) }}>
                <img src={p.url} alt="" />
              </button>
            ))}
          </>
        )}
      </div>

      <div
        ref={handleRef}
        className={styles.editor}
        contentEditable
        suppressContentEditableWarning
        onInput={syncContent}
        onClick={handleEditorClick}
        data-placeholder="what's on your mind today..."
      />

      {selectedImg && overlayRect && createPortal(
        <div
          data-img-overlay=""
          className={styles.imgOverlay}
          style={{ top: overlayRect.top, left: overlayRect.left, width: overlayRect.width, height: overlayRect.height }}
        >
          <div className={`${styles.sizeBar} ${sizeBarAbove ? styles.sizeBarAbove : styles.sizeBarBelow}`}>
            {[['S', 25], ['M', 50], ['L', 75], ['Full', 100]].map(([label, pct]) => (
              <button key={label} className={styles.sizePreset}
                onMouseDown={e => { e.preventDefault(); applySize(pct) }}>
                {label}
              </button>
            ))}
          </div>
          <div
            className={styles.resizeHandle}
            onMouseDown={handleResizeDrag}
            onTouchStart={handleResizeTouchDrag}
            title="Drag to resize"
          />
        </div>,
        document.body
      )}
    </div>
  )
}
