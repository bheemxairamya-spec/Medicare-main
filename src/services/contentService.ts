import { supabase } from './supabaseClient'

export async function getGoodHabits(category?: string) {
  let query = supabase.from('good_habits').select('*')
  if (category) query = query.eq('category', category)
  const { data, error } = await query
  if (error) return { success: false, message: error.message, habits: [] }
  return { success: true, habits: data ?? [] }
}

export async function getFirstAidInfo() {
  const { data, error } = await supabase.from('first_aid_info').select('*')
  if (error) return { success: false, message: error.message, firstAid: [] }
  return { success: true, firstAid: data ?? [] }
}

export async function getDosAndDonts(diseaseName?: string) {
  let query = supabase.from('disease_dos_donts').select('*')
  if (diseaseName) query = query.ilike('disease_name', `%${diseaseName}%`)
  const { data, error } = await query
  if (error) return { success: false, message: error.message, items: [] }
  return { success: true, items: data ?? [] }
}
