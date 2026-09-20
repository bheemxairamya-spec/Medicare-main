import {
  HardwareReading,
  HardwareReport,
  MedicationItem,
  MedicationProfile,
  VolunteerProfile,
  Donor,
  BloodRequest,
  HealthTrendPoint,
  HabitItem,
  WellnessRemedy,
  FirstAidItem,
  AppointmentItem,
  Doctor,
  User,
} from '../types';

// ==========================================
// 1. HARDWARE SENSOR MOCK GENERATOR & REPORTS
// ==========================================

export function generateHardwareReport(
  readings: HardwareReading[],
  title = 'Hardware Diagnostic & Eligibility Report'
): HardwareReport {
  const hasFail = readings.some((r) => r.status === 'fail');
  const hasReview = readings.some((r) => r.status === 'review');

  const overallStatus = hasFail ? 'fail' : hasReview ? 'review' : 'pass';

  let summary = 'All connected IoT sensors returned values within standard clinical thresholds.';
  let recommendation = 'Blood donor is eligible from a physical vital standpoint. Ready for standard protocol.';

  if (hasFail) {
    summary = 'One or more critical biomedical parameters exceeded allowable clinical thresholds.';
    recommendation = 'Donation or high-intensity activity is currently NOT recommended. Consult physician.';
  } else if (hasReview) {
    summary = 'Biomedical indicators are borderline. Secondary inspection or 15-minute rest test suggested.';
    recommendation = 'Monitor hydration and rest before re-testing.';
  }

  return {
    id: 'RPT-' + Math.floor(100000 + Math.random() * 900000),
    title,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' today',
    deviceId: 'ESP32-MEDICARE-NODE-01',
    readings,
    overallStatus,
    summary,
    recommendation,
  };
}

export function getMockVolunteerSensorReadings(_randomize = false): HardwareReading[] {
  return [];
}

// ==========================================
// 2. USER & AUTH
// ==========================================

export const mockCurrentUser: User | null = null;

// ==========================================
// 3. MEDICATION REMINDERS SERVICE
// ==========================================

export const mockMedications: MedicationItem[] = [];

export const mockMedicationProfile: MedicationProfile = {
  name: '',
  age: 0,
  gender: 'Female',
  mobile: '',
  emergencyContact: '',
  medicalCondition: '',
  doctorOrHospital: '',
  currentMedications: '',
  allergies: '',
  notes: '',
  reminderChannels: {
    push: true,
    sms: false,
    dashboard: true,
  },
};

// ==========================================
// 4. BLOOD DONATION & EMERGENCY SEARCH
// ==========================================

export const mockDonors: Donor[] = [];

export const BLOOD_COMPATIBILITY_MAP: Record<string, string[]> = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'O+': ['O+', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'O-': ['O-'],
  'B-': ['B-', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
};

export const mockBloodRequests: BloodRequest[] = [];

// ==========================================
// 5. VOLUNTEER PROFILES
// ==========================================

export const mockVolunteerProfile: VolunteerProfile = {
  name: '',
  dob: '',
  gender: 'Female',
  bloodGroup: 'O+',
  mobile: '',
  email: '',
  location: '',
  emergencyContact: '',
  preferredDonationLocation: '',
  availableDays: [],
  availableTime: '09:00 AM – 02:00 PM',
  idDocumentUploaded: false,
  idDocumentName: '',

  hardwareReadings: [],
  hardwareReport: null,
  externalLabReportUploaded: false,
  externalLabReportName: '',

  habits: {
    sleepSchedule: '',
    exerciseFrequency: '',
    waterIntake: '',
    smoking: '',
    alcoholConsumption: '',
    recentMedicationUsage: '',
    recentIllness: '',
    previousBloodDonation: '',
    physicalActivityLevel: '',
    notes: '',
  },
  lifestyleScore: 0,

  declaration: {
    confirmedAge: false,
    confirmedWeight: false,
    confirmedHealth: false,
    confirmedNoRecentTattoos: false,
    consentGiven: false,
  },

  verificationStatus: 'verification_required',
  isVerified: false,
  inPersonInspected: false,
  memberSince: '',
  totalDonations: 0,
  lastDonationDate: '',
  availabilityToggle: false,
};

// ==========================================
// 6. HABITS, REMEDIES, FIRST AID & DOCTORS
// ==========================================

export const mockHabits: HabitItem[] = [];

export const mockRemedies: WellnessRemedy[] = [];

export const mockFirstAid: FirstAidItem[] = [];

export const mockDoctors: Doctor[] = [];

export const mockAppointments: AppointmentItem[] = [];
