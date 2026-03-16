import { useRef, useCallback, useState } from 'react'
import {
  RiBold, RiItalic, RiUnderline, RiStrikethrough,
  RiListUnordered, RiListOrdered,
  RiAlignLeft, RiAlignCenter, RiAlignRight, RiAlignJustify,
  RiImageAddLine, RiSubtractLine, RiAddLine
} from 'react-icons/ri'
import styles from './RichEditor.module.css'

// execCommand fontSize uses 1-7. We map to px for display.
const SIZE_MAP = [
  { display: 10, cmd: '1' },
  { display: 12, cmd: '2' },
  { display: 14, cmd: '3' }, // default
  { display: 16, cmd: '4' },
  { display: 18, cmd: '5' },
  { display: 24, cmd: '6' },
  { display: 32, cmd: '7' },
]
const DEFAULT_SIZE_IDX = 2 // 14px

export default function RichEditor({ value, onChange, photos }) {
  const editorRef = useRef(null)
  const initialized = useRef(false)
  const [sizeIdx, setSizeIdx] = useState(DEFAULT_SIZE_IDX)

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
    const html = `<div class="inline-photo-block" data-photo-key="${key}"><img src="${photo.url}" alt="${photo.caption || ''}" style="max-width:100%;border-radius:2px;" />${photo.caption ? `<div class="inline-photo-caption">${photo.caption}</div>` : ''}</div><p><br></p>`
    document.execCommand('insertHTML', false, html)
    syncContent()
  }

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
    { icon: <RiAlignLeft size={15} />, cmd: 'justifyLeft', title: 'Align left' },
    { icon: <RiAlignCenter size={15} />, cmd: 'justifyCenter', title: 'Align center' },
    { icon: <RiAlignRight size={15} />, cmd: 'justifyRight', title: 'Align right' },
    { icon: <RiAlignJustify size={15} />, cmd: 'justifyFull', title: 'Justify' },
  ]

  return (
    <div className={styles.wrapper}>
      <div className={styles.toolbar}>
        {/* Format */}
        {formatTools.map((t, i) => (
          <button key={i} type="button" title={t.title} className={styles.toolBtn}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd) }}>
            {t.icon}
          </button>
        ))}

        <div className={styles.sep} />

        {/* Font size spinner */}
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

        {/* Lists */}
        {listTools.map((t, i) => (
          <button key={i} type="button" title={t.title} className={styles.toolBtn}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd) }}>
            {t.icon}
          </button>
        ))}

        <div className={styles.sep} />

        {/* Align */}
        {alignTools.map((t, i) => (
          <button key={i} type="button" title={t.title} className={styles.toolBtn}
            onMouseDown={e => { e.preventDefault(); exec(t.cmd) }}>
            {t.icon}
          </button>
        ))}

        {/* Insert photos */}
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
        data-placeholder="what's on your mind today..."
      />
    </div>
  )
}
