import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../App'
import { supabase } from '../supabase/client'
import { RiArrowLeftLine, RiCameraLine, RiFileCopyLine, RiCheckLine, RiShareLine, RiLogoutBoxLine, RiQrCodeLine } from 'react-icons/ri'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuthContext()
  const navigate = useNavigate()
  const fileRef = useRef()
  const qrRef = useRef()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    nickname: profile?.nickname || '',
    bio: profile?.bio || '',
    email_contact: profile?.email_contact || '',
    website: profile?.website || '',
    instagram: profile?.instagram || '',
    twitter: profile?.twitter || '',
  })
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [uploadingQR, setUploadingQR] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [formErrors, setFormErrors] = useState({})

  // Slug editing
  const [slugDraft, setSlugDraft] = useState(profile?.slug || '')
  const [slugError, setSlugError] = useState('')
  const [slugCopied, setSlugCopied] = useState(false)

  const LIMITS = { full_name: 60, nickname: 30, bio: 200, email_contact: 100, website: 100, instagram: 30, twitter: 15 }
  const SLUG_MAX = 30

  useEffect(() => { setSlugDraft(profile?.slug || '') }, [profile?.slug])

  const handle = e => {
    const { name, value } = e.target
    const max = LIMITS[name]
    if (max && value.length > max) return
    setFormErrors(f => ({ ...f, [name]: '' }))
    setForm(f => ({ ...f, [name]: value }))
  }

  const validate = () => {
    const errs = {}
    if (form.website && !/^https?:\/\/.+\..+/.test(form.website.trim()))
      errs.website = 'enter a valid URL (e.g. https://yoursite.com)'
    if (form.email_contact && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email_contact.trim()))
      errs.email_contact = 'enter a valid email (e.g. you@example.com)'
    if (form.instagram && !/^@?[\w.]{1,30}$/.test(form.instagram.trim()))
      errs.instagram = 'enter a valid handle (e.g. @username)'
    if (form.twitter && !/^@?[\w]{1,15}$/.test(form.twitter.trim()))
      errs.twitter = 'enter a valid handle (e.g. @username)'
    return errs
  }

  const handleAvatar = async e => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingAvatar(true)
    try {
      const path = `avatars/${user.id}.jpg`
      const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
      await updateProfile({ avatar_url: publicUrl + '?t=' + Date.now() })
    } catch (err) { setError('Avatar upload failed: ' + err.message) }
    finally { setUploadingAvatar(false) }
  }

  const handleQR = async e => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingQR(true)
    try {
      const path = `qr/${user.id}.jpg`
      const { error } = await supabase.storage.from('photos').upload(path, file, { upsert: true, contentType: file.type })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(path)
      await updateProfile({ qr_url: publicUrl + '?t=' + Date.now() })
    } catch (err) { setError('QR upload failed: ' + err.message) }
    finally { setUploadingQR(false) }
  }

  const save = async e => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setFormErrors(errs); return }
    setSaving(true); setError('')
    try {
      await updateProfile(form)
      setSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setSaved(false), 2500)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
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

  const copyShareUrl = () => {
    const slug = slugDraft.trim() || profile?.slug
    if (!slug) return
    navigator.clipboard.writeText(`${window.location.origin}/u/${slug}`)
    setSlugCopied(true)
    setTimeout(() => setSlugCopied(false), 2000)
  }

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate('/notebook')}>
          <RiArrowLeftLine size={18} /><span>notebook</span>
        </button>
        <button className={styles.signOutBtn} onClick={async () => { await signOut(); navigate('/') }}>
          <RiLogoutBoxLine size={16} /> sign out
        </button>
      </div>

      <div className={styles.wrap}>
        {/* Avatar */}
        <div className={styles.avatarSection}>
          <div className={styles.avatarWrap} onClick={() => fileRef.current.click()}>
            {profile?.avatar_url
              ? <img src={profile.avatar_url} alt="avatar" className={styles.avatar} />
              : <div className={styles.avatarPlaceholder}>{(form.full_name || form.nickname || '?')[0].toUpperCase()}</div>
            }
            <div className={styles.avatarOverlay}>{uploadingAvatar ? <span className={styles.spinnerDark} /> : <RiCameraLine size={20} />}</div>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatar} />
          </div>
          <div>
            <h2 className={styles.name}>{form.full_name || 'your name'}</h2>
            <p className={styles.nickSlug}>@{form.nickname || 'nickname'}</p>
          </div>
        </div>

        {/* Public blog link — editable slug + copy */}
        {profile?.slug && (
          <div className={styles.shareCard}>
            <div className={styles.shareCardHeader}>
              <RiShareLine size={15} />
              <span className={styles.shareLabel}>your public blog</span>
            </div>
            <div className={styles.slugRow}>
              <div className={styles.slugField}>
                <span className={styles.slugOrigin}>{window.location.origin}/u/</span>
                <input
                  className={styles.slugInput}
                  value={slugDraft}
                  onChange={e => {
                    const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')
                    if (v.length > SLUG_MAX) return
                    setSlugDraft(v); setSlugError('')
                  }}
                  onBlur={saveSlug}
                  onKeyDown={e => { if (e.key === 'Enter') { e.target.blur(); saveSlug() } }}
                  spellCheck={false}
                />
              </div>
              <button className={`${styles.copyBtn} ${slugCopied ? styles.copyBtnDone : ''}`} onClick={copyShareUrl} title="Copy link">
                {slugCopied ? <RiCheckLine size={15} /> : <RiFileCopyLine size={15} />}
              </button>
            </div>
            <div className={styles.slugMeta}>
              {slugError && <p className={styles.slugErr}>{slugError}</p>}
              <span className={styles.charCount}>{slugDraft.length}/{SLUG_MAX}</span>
            </div>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}
        {saved && <div className={styles.success}>✓ profile saved</div>}

        <form onSubmit={save} className={styles.form}>
          <div className={styles.section}>personal</div>
          <label className={styles.label}>full name</label>
          <input className={styles.input} name="full_name" value={form.full_name} onChange={handle} placeholder="your full name" />
          <div className={styles.fieldMeta}><span className={styles.charCount}>{form.full_name.length}/{LIMITS.full_name}</span></div>

          <label className={styles.label}>nickname</label>
          <input className={styles.input} name="nickname" value={form.nickname} onChange={handle} placeholder="@nickname" />
          <div className={styles.fieldMeta}><span className={styles.charCount}>{form.nickname.length}/{LIMITS.nickname}</span></div>

          <label className={styles.label}>bio</label>
          <textarea className={`${styles.input} ${styles.textarea}`} name="bio" value={form.bio} onChange={handle} placeholder="a little about you..." rows={3} />
          <div className={styles.fieldMeta}><span className={styles.charCount}>{form.bio.length}/{LIMITS.bio}</span></div>

          <div className={styles.section}>contact & links</div>
          <label className={styles.label}>email (shown to readers)</label>
          <input className={`${styles.input} ${formErrors.email_contact ? styles.inputError : ''}`} name="email_contact" value={form.email_contact} onChange={handle} placeholder="contact@email.com" />
          {formErrors.email_contact && <p className={styles.fieldErr}>{formErrors.email_contact}</p>}

          <label className={styles.label}>website</label>
          <input className={`${styles.input} ${formErrors.website ? styles.inputError : ''}`} name="website" value={form.website} onChange={handle} placeholder="https://yoursite.com" />
          {formErrors.website && <p className={styles.fieldErr}>{formErrors.website}</p>}

          <label className={styles.label}>instagram</label>
          <input className={`${styles.input} ${formErrors.instagram ? styles.inputError : ''}`} name="instagram" value={form.instagram} onChange={handle} placeholder="@handle" />
          {formErrors.instagram && <p className={styles.fieldErr}>{formErrors.instagram}</p>}

          <label className={styles.label}>twitter / x</label>
          <input className={`${styles.input} ${formErrors.twitter ? styles.inputError : ''}`} name="twitter" value={form.twitter} onChange={handle} placeholder="@handle" />
          {formErrors.twitter && <p className={styles.fieldErr}>{formErrors.twitter}</p>}

          <div className={styles.section}>buy me a coffee</div>
          <label className={styles.label}>QR code image <span className={styles.hint}>(shown to visitors as a modal)</span></label>
          <div className={styles.qrRow}>
            {profile?.qr_url && <img src={profile.qr_url} alt="QR" className={styles.qrThumb} />}
            <button type="button" className={styles.qrUploadBtn} onClick={() => qrRef.current.click()} disabled={uploadingQR}>
              <RiQrCodeLine size={15} />
              {uploadingQR ? 'uploading...' : profile?.qr_url ? 'replace QR code' : 'upload QR code'}
            </button>
            <input ref={qrRef} type="file" accept="image/*" hidden onChange={handleQR} />
          </div>

          <button className={styles.saveBtn} type="submit" disabled={saving}>
            {saving ? <><span className={styles.spinner} />saving...</> : 'save profile'}
          </button>
        </form>
      </div>
    </div>
  )
}
