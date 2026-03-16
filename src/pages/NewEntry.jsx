import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEntries } from '../hooks/useEntries'
import { useAuthContext } from '../App'
import EntryEditor from '../components/EntryEditor'

export default function NewEntry() {
  const { user } = useAuthContext()
  const { createEntry } = useEntries(user?.id)
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)

  const handleSave = async ({ title, body, photos, is_draft = false }) => {
    setSaving(true)
    try {
      await createEntry({ title, body, photos, is_draft })
      navigate('/notebook')
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally { setSaving(false) }
  }

  return <EntryEditor onSave={handleSave} saving={saving} />
}
