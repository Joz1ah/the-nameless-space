import { useState, useRef, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../App'
import { useAuthContext } from '../App'
import { RiMoonLine, RiSunLine, RiAddLine, RiListCheck2, RiUserLine, RiMoreLine, RiShareLine, RiCheckLine } from 'react-icons/ri'
import styles from './Header.module.css'

export default function Header({ onRandomPage, hasEntries, onShowAll }) {
  const { theme, toggleTheme } = useTheme()
  const { profile } = useAuthContext()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const menuRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const shareUrl = profile?.slug ? `${window.location.origin}/u/${profile.slug}` : null

  const menuItems = [
    hasEntries && onRandomPage && { icon: '✦', label: 'random page', action: () => { onRandomPage(); setMenuOpen(false) } },
    hasEntries && onShowAll && { icon: <RiListCheck2 size={15} />, label: 'all entries', action: () => { onShowAll(); setMenuOpen(false) } },
    { icon: <RiUserLine size={15} />, label: 'profile', action: () => { navigate('/profile'); setMenuOpen(false) } },
    shareUrl && { icon: <RiShareLine size={15} />, label: 'share blog', action: () => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000); setMenuOpen(false) } },
    { icon: theme === 'light' ? <RiMoonLine size={15} /> : <RiSunLine size={15} />, label: theme === 'light' ? 'dark mode' : 'light mode', action: () => { toggleTheme(); setMenuOpen(false) } },
  ].filter(Boolean)

  return (
    <header className={styles.header}>
      <div className={styles.left} />

      <div className={styles.center} onClick={() => { if (window.location.pathname === '/notebook') window.location.reload(); else navigate('/notebook') }}>
        <h1 className={styles.title}>the nameless space</h1>
        <p className={styles.subtitle}>a quiet place for thoughts</p>
      </div>

      <div className={styles.right}>
        {/* Desktop icons */}
        <div className={styles.desktopIcons}>
          {hasEntries && onRandomPage && (
            <button className={styles.iconBtn} onClick={onRandomPage} title="Random page">
              <span className={styles.diceIcon}>✦</span>
            </button>
          )}
          {hasEntries && onShowAll && (
            <button className={styles.iconBtn} onClick={onShowAll} title="All entries">
              <RiListCheck2 size={18} />
            </button>
          )}
          <button className={styles.iconBtn} onClick={toggleTheme} title="Toggle theme">
            {theme === 'light' ? <RiMoonLine size={18} /> : <RiSunLine size={18} />}
          </button>
          <button className={styles.iconBtn} onClick={() => navigate('/profile')} title="Profile">
            <RiUserLine size={18} />
          </button>
          {shareUrl && (
            <button
              className={`${styles.iconBtn} ${copied ? styles.copied : ''}`}
              onClick={() => { navigator.clipboard.writeText(shareUrl); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
              title="Copy share link">
              <span className={styles.shareIcon}>
                {copied ? <RiCheckLine size={18} /> : <RiShareLine size={18} />}
              </span>
            </button>
          )}
        </div>

        {/* Mobile: new entry + menu */}
        <div className={styles.mobileIcons} ref={menuRef}>
          <div className={styles.menuWrap}>
            <button className={styles.iconBtn} onClick={() => setMenuOpen(o => !o)} title="Menu">
              <RiMoreLine size={20} />
            </button>
            {menuOpen && (
              <div className={styles.dropdown}>
                {menuItems.map((item, i) => (
                  <button key={i} className={styles.dropdownItem} onClick={item.action}>
                    <span className={styles.dropdownIcon}>{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button className={styles.newBtn} onClick={() => navigate('/new')}>
          <RiAddLine size={16} />
          <span>new entry</span>
        </button>
      </div>
    </header>
  )
}
