import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase/client'

export function useEntries(userId = null) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchEntries = useCallback(async () => {
    setLoading(true)
    try {
      let query = supabase.from('entries').select(`*, entry_photos(*)`)
      if (userId) query = query.eq('user_id', userId)
      query = query.order('created_at', { ascending: true })
      const { data, error } = await query
      if (error) throw error
      const withSorted = (data || []).map(entry => ({
        ...entry,
        entry_photos: (entry.entry_photos || []).sort((a, b) => (a.position || 0) - (b.position || 0))
      }))
      setEntries(withSorted)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchEntries() }, [fetchEntries])

  const createEntry = async ({ title, body, photos, is_draft = false, mood, category, meta }) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: entry, error: entryError } = await supabase
      .from('entries')
      .insert([{ title: title || null, body, is_draft, user_id: user.id, mood: mood || null, category: category || null, meta: meta && Object.values(meta).some(v => v) ? meta : null }])
      .select().single()
    if (entryError) throw entryError
    if (photos?.length > 0) {
      await supabase.from('entry_photos').insert(
        photos.map((p, i) => ({ entry_id: entry.id, url: p.url, caption: p.caption || null, position: i, is_highlight: p.is_highlight || false, inline_key: p.inline_key || null }))
      )
    }
    await fetchEntries()
    return entry
  }

  const updateEntry = async (id, { title, body, photos, is_draft, is_locked, mood, category, meta }) => {
    const updateData = { title: title || null, body, updated_at: new Date().toISOString() }
    if (is_draft !== undefined) updateData.is_draft = is_draft
    if (is_locked !== undefined) updateData.is_locked = is_locked
    if (mood !== undefined) updateData.mood = mood
    if (category !== undefined) updateData.category = category
    if (meta !== undefined) updateData.meta = meta && Object.values(meta).some(v => v) ? meta : null
    const { error } = await supabase.from('entries').update(updateData).eq('id', id)
    if (error) throw error
    await supabase.from('entry_photos').delete().eq('entry_id', id)
    if (photos?.length > 0) {
      await supabase.from('entry_photos').insert(
        photos.map((p, i) => ({ entry_id: id, url: p.url, caption: p.caption || null, position: i, is_highlight: p.is_highlight || false, inline_key: p.inline_key || null }))
      )
    }
    await fetchEntries()
  }

  const deleteEntry = async (id) => {
    const entry = entries.find(e => e.id === id)
    if (entry?.entry_photos?.length > 0) {
      const paths = entry.entry_photos.map(p => p.url.split('/photos/')[1]).filter(Boolean)
      if (paths.length > 0) await supabase.storage.from('photos').remove(paths)
    }
    await supabase.from('entries').delete().eq('id', id)
    await fetchEntries()
  }

  const toggleFavorite = async (id) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    await supabase.from('entries').update({ is_favorite: !entry.is_favorite }).eq('id', id)
    await fetchEntries()
  }

  const toggleLocked = async (id) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    await supabase.from('entries').update({ is_locked: !entry.is_locked }).eq('id', id)
    await fetchEntries()
  }

  const getRandomEntry = () => {
    const published = entries.filter(e => !e.is_draft)
    if (!published.length) return null
    return published[Math.floor(Math.random() * published.length)]
  }

  return { entries, loading, error, createEntry, updateEntry, deleteEntry, toggleFavorite, toggleLocked, getRandomEntry, refetch: fetchEntries }
}
