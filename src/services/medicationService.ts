import { supabase } from './supabaseClient'

export interface MedicationScheduleRecord {
  id: string
  medication_id: string
  user_id: string
  reminder_time: string
  taken_status: boolean | null
  taken_date: string | null
}

export interface MedicationRecord {
  id: string
  user_id: string
  med_name: string
  dosage: string
  times_per_day: number
  created_at: string
  medication_schedule: MedicationScheduleRecord[]
}

export interface AppointmentRecord {
  id: string
  user_id: string
  doctor_name: string
  appointment_date: string
  notes: string | null
  specialty?: string | null
  hospital_name?: string | null
  visit_type?: string | null
  appointment_time?: string | null
  created_at?: string
}

// Add a new medication for the logged-in user.
export async function addMedication(medName: string, dosage: string, timesPerDay: number) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not logged in' }

  const { data, error } = await supabase
    .from('medications')
    .insert([{ user_id: user.id, med_name: medName, dosage, times_per_day: timesPerDay }])
    .select()

  if (error) return { success: false, message: error.message }
  return { success: true, medication: data[0] }
}

export async function addMedicationSchedule(medicationId: string, reminderTimes: string[]) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not logged in' }

  const rows = reminderTimes.map((time) => ({
    medication_id: medicationId,
    user_id: user.id,
    reminder_time: time,
  }))

  const { data, error } = await supabase.from('medication_schedule').insert(rows).select()
  if (error) return { success: false, message: error.message }
  return { success: true, schedule: data }
}

export async function getMyMedications() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not logged in', medications: [] as MedicationRecord[] }

  const { data, error } = await supabase
    .from('medications')
    .select('*, medication_schedule(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { success: false, message: error.message, medications: [] as MedicationRecord[] }
  return { success: true, medications: (data ?? []) as MedicationRecord[] }
}

export async function markDoseTaken(scheduleId: string, taken: boolean) {
  const { error } = await supabase
    .from('medication_schedule')
    .update({ taken_status: taken, taken_date: new Date().toISOString().split('T')[0] })
    .eq('id', scheduleId)

  if (error) return { success: false, message: error.message }
  return { success: true }
}

export async function deleteMedication(medicationId: string) {
  const { error } = await supabase.from('medications').delete().eq('id', medicationId)
  if (error) return { success: false, message: error.message }
  return { success: true }
}

export interface AddAppointmentOptions {
  specialty?: string
  hospitalName?: string
  visitType?: string
  appointmentTime?: string
}

export async function addAppointment(
  doctorName: string,
  appointmentDate: string,
  notes: string,
  extra?: AddAppointmentOptions
) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not logged in' }

  const payload: Record<string, any> = {
    user_id: user.id,
    doctor_name: doctorName,
    appointment_date: appointmentDate,
    notes,
  }

  if (extra?.specialty) payload.specialty = extra.specialty
  if (extra?.hospitalName) payload.hospital_name = extra.hospitalName
  if (extra?.visitType) payload.visit_type = extra.visitType
  if (extra?.appointmentTime) payload.appointment_time = extra.appointmentTime

  const { data, error } = await supabase
    .from('appointments')
    .insert([payload])
    .select()

  if (error) return { success: false, message: error.message }
  return { success: true, appointment: data[0] }
}

export async function getMyAppointments() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, message: 'Not logged in', appointments: [] as AppointmentRecord[] }

  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', user.id)
    .order('appointment_date', { ascending: true })

  if (error) return { success: false, message: error.message, appointments: [] as AppointmentRecord[] }
  return { success: true, appointments: (data ?? []) as AppointmentRecord[] }
}
