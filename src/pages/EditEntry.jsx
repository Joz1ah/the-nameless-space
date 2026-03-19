import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { useAuthContext } from '../App'
import EntryEditor from '../components/EntryEditor'

export default function EditEntry() {
  const { id } = useParams()
  const { user } = useAuthContext()
  const { entries, updateEntry, deleteEntry } = useEntries(user?.id)
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const entry = entries.find(e => e.id === id)

  if (!entry) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--ink-muted)', fontStyle:'italic' }}>
      entry not found
    </div>
  )

  const handleSave = async ({ title, body, photos, is_draft, mood, category, meta }) => {
    setSaving(true)
    try {
      await updateEntry(id, { title, body, photos, is_draft: is_draft !== undefined ? is_draft : entry.is_draft, mood, category, meta })
      navigate(`/entry/${id}`)
    } catch (err) {
      alert('Failed to update: ' + err.message)
    } finally { setSaving(false) }
  }

  const handleDelete = async () => {
    await deleteEntry(id)
    navigate('/notebook')
  }

  return <EntryEditor initial={entry} onSave={handleSave} onDelete={handleDelete} saving={saving} />
}
