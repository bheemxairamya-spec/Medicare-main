import { supabase } from './supabaseClient'

export interface RegisterVolunteerOptions {
  dateOfBirth?: string
  location?: string
  emergencyContactName?: string
  emergencyContactPhone?: string
  preferredDonationCenter?: string
  availableDays?: string[]
}

export async function registerVolunteer(
  name: string,
  bloodGroup: string,
  mobile: string,
  email: string,
  extra?: RegisterVolunteerOptions
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not logged in' }

  const { data: existingRecord } = await supabase
    .from('volunteers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingRecord) {
    return { success: true, volunteer: existingRecord }
  }

  const payload: Record<string, any> = {
    user_id: user.id,
    name,
    blood_group: bloodGroup,
    mobile,
    email,
    status: 'pending',
  }

  if (extra?.dateOfBirth) {
    payload.date_of_birth = extra.dateOfBirth
  }
  if (extra?.location) {
    payload.location = extra.location
  }
  if (extra?.emergencyContactName) {
    payload.emergency_contact_name = extra.emergencyContactName
  }
  if (extra?.emergencyContactPhone) {
    payload.emergency_contact_phone = extra.emergencyContactPhone
  }
  if (extra?.preferredDonationCenter) {
    payload.preferred_donation_center = extra.preferredDonationCenter
  }
  if (extra?.availableDays) {
    payload.available_days = extra.availableDays
  }

  const { data, error } = await supabase.from('volunteers').insert([payload]).select()
  if (error) return { success: false, message: error.message }
  return { success: true, volunteer: data[0] }
}

export async function addVolunteerHabits(volunteerId: string, habits: Record<string, any>, medicalNotes: string) {
  const { data, error } = await supabase.from('volunteer_habits')
    .insert([{ volunteer_id: volunteerId, habits, medical_notes: medicalNotes }]).select()
  if (error) return { success: false, message: error.message }
  return { success: true, data: data[0] }
}

export async function updateVolunteerAvailability(volunteerId: string, availableTime: string) {
  const { error } = await supabase.from('volunteers').update({ available_time: availableTime }).eq('id', volunteerId)
  if (error) return { success: false, message: error.message }
  return { success: true }
}

export async function getMyVolunteerStatus() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not logged in', volunteer: null }
  const { data, error } = await supabase.from('volunteers').select('*, volunteer_habits(*)')
    .eq('user_id', user.id).maybeSingle()
  if (error) return { success: false, message: error.message, volunteer: null }
  return { success: true, volunteer: data }
}

export async function findDonorsByBloodGroup(bloodGroup: string) {
  let query = supabase.from('volunteers').select('*').eq('status', 'approved')
  if (bloodGroup && bloodGroup !== 'all') query = query.eq('blood_group', bloodGroup)
  const { data, error } = await query
  if (error) return { success: false, message: error.message, donors: [] }
  return { success: true, donors: data }
}
