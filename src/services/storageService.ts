import { supabase } from './supabaseClient'

async function uploadFile(bucket: string, file: File) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not logged in', path: null, url: null }

  const filePath = `${user.id}/${Date.now()}_${file.name}`
  const { error } = await supabase.storage.from(bucket).upload(filePath, file)
  if (error) return { success: false, message: error.message, path: null, url: null }

  if (bucket === 'avatars') {
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath)
    return { success: true, path: filePath, url: urlData.publicUrl }
  }
  return { success: true, path: filePath, url: null }
}

export async function uploadAvatar(file: File) {
  const result = await uploadFile('avatars', file)
  if (result.success && result.url) {
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('profiles').update({ avatar_url: result.url }).eq('id', user!.id)
  }
  return result
}

export async function uploadIdProof(file: File) {
  return uploadFile('id-proofs', file)
}

export async function uploadMedicalReport(file: File) {
  return uploadFile('medical-reports', file)
}

export async function getSignedUrl(bucket: 'id-proofs' | 'medical-reports', path: string) {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600)
  if (error) return { success: false, url: null }
  return { success: true, url: data.signedUrl }
}
