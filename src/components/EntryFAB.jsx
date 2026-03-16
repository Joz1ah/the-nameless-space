import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  RiMoreFill, RiCloseLine,
  RiHome4Line,
  RiArrowLeftSLine, RiArrowRightSLine, RiAddLine,
  RiArrowUpLine, RiArrowDownLine
} from 'react-icons/ri'
import styles from './EntryFAB.module.css'

export default function EntryFAB({ entryId, prevEntry, nextEntry, lightboxOpen }) {
  const [open, setOpen] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [maxScroll, setMaxScroll] = useState(0)
  const navigate = useNavigate()

  useEffect(() => {
    const measure = () => {
      setScrollY(window.scrollY)
      setMaxScroll(Math.max(0, document.body.scrollHeight - window.innerHeight))
    }
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    measure()
    const t1 = setTimeout(measure, 200)
    const t2 = setTimeout(measure, 800)
    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [entryId])

  useEffect(() => { if (lightboxOpen) setOpen(false) }, [lightboxOpen])

  if (lightboxOpen) return null

  const isLong = maxScroll > 100
  const scrolledDown = scrollY > 60
  const showUp = isLong && scrolledDown && !open
  const showDown = isLong && !scrolledDown && !open

  const actions = [
    prevEntry && { icon: <RiArrowLeftSLine size={18} />, label: 'prev entry', onClick: () => navigate(`/entry/${prevEntry.id}`) },
    nextEntry && { icon: <RiArrowRightSLine size={18} />, label: 'next entry', onClick: () => navigate(`/entry/${nextEntry.id}`) },
    { icon: <RiHome4Line size={18} />, label: 'home', onClick: () => navigate('/notebook') },
    { icon: <RiAddLine size={18} />, label: 'new entry', onClick: () => navigate('/new') },
  ].filter(Boolean)

  return (
    <div className={styles.wrap}>
      {showDown && (
        <button className={styles.chevron}
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          title="Scroll to bottom">
          <RiArrowDownLine size={16} />
        </button>
      )}
      {showUp && (
        <button className={styles.chevron}
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          title="Back to top">
          <RiArrowUpLine size={16} />
        </button>
      )}

      {open && (
        <div className={styles.actions}>
          {actions.map((a, i) => (
            <button key={i}
              className={styles.action}
              onClick={() => { setOpen(false); a.onClick() }}
              title={a.label}
              style={{ animationDelay: `${i * 28}ms` }}>
              {a.icon}
              <span className={styles.actionLabel}>{a.label}</span>
            </button>
          ))}
        </div>
      )}

      <button
        className={`${styles.main} ${open ? styles.mainOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Actions">
        {open ? <RiCloseLine size={22} /> : <RiMoreFill size={22} />}
      </button>

      {open && <div className={styles.backdrop} onClick={() => setOpen(false)} />}
    </div>
  )
}
