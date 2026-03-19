import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../App'
import { useAuthContext } from '../App'
import { supabase } from '../supabase/client'
import { RiMoonLine, RiSunLine, RiAddLine, RiListCheck2, RiUserLine, RiMoreLine, RiShareLine, RiFileCopyLine, RiCheckLine } from 'react-icons/ri'
import styles from './Header.module.css'

export default function Header({ onRandomPage, hasEntries, onShowAll }) {
  const { theme, toggleTheme } = useTheme()
  const { profile, updateProfile } = useAuthContext()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const [shareOpen, setShareOpen] = useState(false)
  const [slugDraft, setSlugDraft] = useState('')
  const [slugError, setSlugError] = useState('')
  const [copied, setCopied] = useState(false)
  const menuRef = useRef(null)

  // Sync slug draft when profile loads
  useEffect(() => { setSlugDraft(profile?.slug || '') }, [profile?.slug])

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = e => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
      // Use data-share attribute so both desktop + mobile containers are covered
      if (!e.target.closest('[data-share]')) { setShareOpen(false); setSlugError('') }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const origin = window.location.origin
  const shareUrl = profile?.slug ? `${origin}/u/${profile.slug}` : null

  const copyUrl = () => {
    const slug = slugDraft.trim() || profile?.slug
    if (!slug) return
    navigator.clipboard.writeText(`${origin}/u/${slug}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const saveSlug = async () => {
    const val = slugDraft.trim()
    if (!val || val === profile?.slug) return
    setSlugError('')
    try {
      const { data } = await supabase.from('profiles').select('id').eq('slug', val).neq('id', profile.id)
      if (data?.length > 0) { setSlugError('already taken'); return }
      await updateProfile({ slug: val })
    } catch { setSlugError('could not save') }
  }

  const handleSlugKey = e => {
    if (e.key === 'Enter') { e.target.blur(); saveSlug() }
  }

  const menuItems = [
    hasEntries && onShowAll && { icon: <RiListCheck2 size={15} />, label: 'all entries', action: () => { onShowAll(); setMenuOpen(false) } },
    { icon: <RiUserLine size={15} />, label: 'profile', action: () => { navigate('/profile'); setMenuOpen(false) } },
    shareUrl && { icon: <RiShareLine size={15} />, label: 'share blog', action: () => { setMenuOpen(false); setShareOpen(o => !o) } },
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
            <div className={styles.shareWrap} data-share>
              <button
                className={`${styles.iconBtn} ${shareOpen ? styles.iconBtnActive : ''}`}
                onClick={() => { setShareOpen(o => !o); setSlugError('') }}
                title="Share blog">
                <RiShareLine size={18} />
              </button>
              {shareOpen && (
                <div className={styles.shareDropdown}>
                  <SlugRow
                    origin={origin}
                    slug={slugDraft}
                    onSlugChange={v => { setSlugDraft(v.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugError('') }}
                    onBlur={saveSlug}
                    onKeyDown={handleSlugKey}
                    onCopy={copyUrl}
                    copied={copied}
                    error={slugError}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Mobile: menu + share panel */}
        <div className={styles.mobileIcons}>
          {shareUrl && (
            <div className={styles.shareWrap} data-share>
              {shareOpen && (
                <div className={`${styles.shareDropdown} ${styles.shareDropdownMobile}`}>
                  <SlugRow
                    origin={origin}
                    slug={slugDraft}
                    onSlugChange={v => { setSlugDraft(v.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugError('') }}
                    onBlur={saveSlug}
                    onKeyDown={handleSlugKey}
                    onCopy={copyUrl}
                    copied={copied}
                    error={slugError}
                  />
                </div>
              )}
            </div>
          )}
          <div className={styles.menuWrap} ref={menuRef}>
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

function SlugRow({ origin, slug, onSlugChange, onBlur, onKeyDown, onCopy, copied, error }) {
  return (
    <div className={styles.slugRow}>
      <div className={styles.slugField}>
        <span className={styles.slugOrigin}>{origin}/u/</span>
        <input
          className={styles.slugInput}
          value={slug}
          onChange={e => onSlugChange(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          spellCheck={false}
        />
      </div>
      <button className={`${styles.copyBtn} ${copied ? styles.copyBtnDone : ''}`} onClick={onCopy} title="Copy link">
        {copied ? <RiCheckLine size={15} /> : <RiFileCopyLine size={15} />}
      </button>
      {error && <p className={styles.slugErr}>{error}</p>}
    </div>
  )
}
