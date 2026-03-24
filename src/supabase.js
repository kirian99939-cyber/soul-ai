import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !key) {
  console.warn('⚠️  Supabase env vars missing — falling back to localStorage')
}

export const supabase = (url && key) ? createClient(url, key) : null

// ── Thin storage layer: Supabase → localStorage fallback ──

export async function loadData(key) {
  if (supabase) {
    const { data, error } = await supabase
      .from('soul_store')
      .select('value')
      .eq('key', key)
      .maybeSingle()
    if (!error && data) return JSON.parse(data.value)
    return null
  }
  // fallback
  const raw = localStorage.getItem(key)
  return raw ? JSON.parse(raw) : null
}

export async function saveData(key, value) {
  const json = JSON.stringify(value)
  if (supabase) {
    await supabase
      .from('soul_store')
      .upsert({ key, value: json }, { onConflict: 'key' })
    return
  }
  localStorage.setItem(key, json)
}

export async function saveReferencePhotos(personaId, photos) {
  return saveData(`ref_photos_${personaId}`, photos);
}

export async function loadReferencePhotos(personaId) {
  return loadData(`ref_photos_${personaId}`);
}
