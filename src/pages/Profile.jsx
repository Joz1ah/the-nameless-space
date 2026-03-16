import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthContext } from '../App'
import { supabase } from '../supabase/client'
import { RiArrowLeftLine, RiCameraLine, RiFileCopyLine, RiShareLine, RiLogoutBoxLine, RiQrCodeLine } from 'react-icons/ri'
import styles from './Profile.module.css'

export default function Profile() {
  const { user, profile, updateProfile, signOut } = useAuthContext()
  const navigate = useNavigate()
  const fileRef = useRef()
  const qrRef = useRef()
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    nickname: profile?.nickname || '',
    slug: profile?.slug || '',
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
  const [slugError, setSlugError] = useState('')

  const handle = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  const handleSlug = e => { setForm(f => ({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })); setSlugError('') }

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
    setSaving(true); setError(''); setSlugError('')
    try {
      if (form.slug !== profile?.slug) {
        const { data } = await supabase.from('profiles').select('id').eq('slug', form.slug).neq('id', user.id)
        if (data?.length > 0) { setSlugError('That URL is already taken'); setSaving(false); return }
      }
      await updateProfile(form)
      setSaved(true)
      window.scrollTo({ top: 0, behavior: 'smooth' })
      setTimeout(() => setSaved(false), 2500)
    } catch (err) { setError(err.message) }
    finally { setSaving(false) }
  }

  const shareUrl = profile?.slug ? `${window.location.origin}/u/${profile.slug}` : ''

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

        {shareUrl && (
          <div className={styles.shareCard}>
            <RiShareLine size={16} />
            <span className={styles.shareLabel}>your public blog</span>
            <a href={shareUrl} target="_blank" rel="noreferrer" className={styles.shareUrl}>{shareUrl}</a>
            <button className={styles.copyBtn} onClick={() => navigator.clipboard.writeText(shareUrl)}>
              <RiFileCopyLine size={14} /> copy
            </button>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}
        {saved && <div className={styles.success}>✓ profile saved</div>}

        <form onSubmit={save} className={styles.form}>
          <div className={styles.section}>personal</div>
          <label className={styles.label}>full name</label>
          <input className={styles.input} name="full_name" value={form.full_name} onChange={handle} placeholder="your full name" />
          <label className={styles.label}>nickname</label>
          <input className={styles.input} name="nickname" value={form.nickname} onChange={handle} placeholder="@nickname" />
          <label className={styles.label}>bio</label>
          <textarea className={`${styles.input} ${styles.textarea}`} name="bio" value={form.bio} onChange={handle} placeholder="a little about you..." rows={3} />

          <div className={styles.section}>your public link</div>
          <label className={styles.label}>URL slug</label>
          <div className={styles.slugWrap}>
            <span className={styles.slugPrefix}>/u/</span>
            <input className={styles.slugInput} name="slug" value={form.slug} onChange={handleSlug} placeholder="yourname" />
          </div>
          {slugError && <p className={styles.fieldError}>{slugError}</p>}

          <div className={styles.section}>contact & links</div>
          <label className={styles.label}>email (shown to visitors)</label>
          <input className={styles.input} name="email_contact" type="email" value={form.email_contact} onChange={handle} placeholder="contact@email.com" />
          <label className={styles.label}>website</label>
          <input className={styles.input} name="website" value={form.website} onChange={handle} placeholder="https://yoursite.com" />
          <label className={styles.label}>instagram</label>
          <input className={styles.input} name="instagram" value={form.instagram} onChange={handle} placeholder="@handle" />
          <label className={styles.label}>twitter / x</label>
          <input className={styles.input} name="twitter" value={form.twitter} onChange={handle} placeholder="@handle" />

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
