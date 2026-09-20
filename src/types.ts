export type RouteKey =
  | 'landing'
  | 'login'
  | 'home'
  | 'medi-reminder'
  | 'reminder'
  | 'medi-reminder-step1'
  | 'medi-reminder-step2'
  | 'medi-reminder-dashboard'
  | 'volunteer-step1'
  | 'volunteer-step2'
  | 'volunteer-step3'
  | 'volunteer-step4'
  | 'volunteer-status'
  | 'donor-viewer'
  | 'iot-health'
  | 'iot-checkup'
  | 'general-checkup'
  | 'general-checkup-step1'
  | 'general-checkup-step2'
  | 'general-checkup-step3'
  | 'good-habits'
  | 'natural-wellness'
  | 'first-aid'
  | 'appointments'
  | 'profile';

export type UserPurpose = 'medi-reminder' | 'volunteer' | 'general' | 'find-donor';

export type PortalType = 'medi-reminder' | 'blood-donation' | 'general-checkup' | 'find-donors';

export type BloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  isPhoneVerified: boolean;
  avatar: string;
  avatar_url?: string;
  bloodGroup: string;
  role: 'patient' | 'volunteer' | 'admin';
  selectedPurpose?: UserPurpose;
  portalType?: PortalType;
}

export type HardwareStatus = 'pass' | 'review' | 'fail';

export interface HardwareReading {
  id: string;
  sensorCode: 'DS18B20' | 'HX711' | 'MAX30102_HR' | 'MAX30102_SPO2' | 'MQ135' | 'MQ3' | 'MPX5050DP';
  sensorName: string;
  metricName: string;
  value: number | string;
  unit: string;
  referenceRange: string;
  minNormal?: number;
  maxNormal?: number;
  status: HardwareStatus;
  description: string;
  notes?: string;
}

export interface HardwareReport {
  id: string;
  title: string;
  timestamp: string;
  deviceId: string;
  readings: HardwareReading[];
  overallStatus: HardwareStatus;
  summary: string;
  recommendation: string;
}

export interface MedicationItem {
  id: string;
  name: string;
  dosage: string;
  timeOfDay: string; // e.g. "08:00 AM"
  mealRelation: 'before' | 'after' | 'with';
  repeatDaily: boolean;
  startDate: string;
  endDate?: string;
  isOngoing: boolean;
  takenToday: boolean;
  category: string;
  notes?: string;
}

export interface MedicationProfile {
  name: string;
  age: number | string;
  gender: string;
  mobile: string;
  emergencyContact: string;
  medicalCondition?: string;
  doctorOrHospital?: string;
  currentMedications?: string;
  allergies?: string;
  notes?: string;
  reminderChannels: {
    push: boolean;
    sms: boolean;
    dashboard: boolean;
  };
}

export interface VolunteerProfile {
  volunteerId?: string;
  // Step 1
  name: string;
  dob: string;
  gender: string;
  bloodGroup: string;
  mobile: string;
  email: string;
  location: string;
  emergencyContact: string;
  preferredDonationLocation: string;
  availableDays: string[];
  availableTime: string;
  idDocumentUploaded: boolean;
  idDocumentName?: string;
  id_proof_url?: string;

  // Step 2 (Hardware & Medical Test Report)
  hardwareReadings: HardwareReading[];
  hardwareReport?: HardwareReport;
  externalLabReportUploaded: boolean;
  externalLabReportName?: string;
  medical_report_url?: string;

  // Step 3 (Habits)
  habits: {
    sleepSchedule: string;
    exerciseFrequency: string;
    waterIntake: string;
    smoking: string;
    alcoholConsumption: string;
    recentMedicationUsage: string;
    recentIllness: string;
    previousBloodDonation: string;
    physicalActivityLevel: string;
    notes?: string;
  };
  lifestyleScore: number;

  // Step 4 (Declaration)
  declaration: {
    confirmedAge: boolean;
    confirmedWeight: boolean;
    confirmedHealth: boolean;
    confirmedNoRecentTattoos: boolean;
    consentGiven: boolean;
  };

  // Step 5 (Status)
  verificationStatus: 'under_review' | 'verification_required' | 'verified' | 'temporarily_unavailable';
  isVerified?: boolean;
  inPersonInspected: boolean;
  memberSince: string;
  totalDonations: number;
  lastDonationDate?: string;
  availabilityToggle: boolean;
}

export interface Donor {
  id: string;
  name: string;
  bloodGroup: string;
  distanceKm: number;
  location: string;
  isVerified: boolean;
  lastVerifiedDate: string;
  availableWindow: string;
  phone: string;
  unitsDonated: number;
  rating: number;
  lastHealthCheck: string;
}

export interface BloodRequest {
  id: string;
  patientName?: string;
  bloodGroup: string;
  unitsNeeded: number;
  hospital: string;
  location: string;
  urgency: 'critical' | 'urgent' | 'standard';
  requiredByTime: string;
  contactName?: string;
  contactPhone: string;
  status: 'active' | 'fulfilled' | 'in_progress';
  createdAt: string;
  notes?: string;
}

export interface HealthTrendPoint {
  time: string;
  heartRate: number;
  spO2: number;
  temperature: number;
  airQuality: number;
}

export interface HabitItem {
  id: string;
  title: string;
  category: string;
  target?: number;
  current?: number;
  targetTime?: string;
  description?: string;
  unit?: string;
  streakDays: number;
  completedToday: boolean;
  iconName?: string;
  color?: string;
}

export interface WellnessRemedy {
  id: string;
  title: string;
  category: string;
  benefits: string;
  ingredients: string[];
  instructions: string;
  precautions?: string;
}

export interface FirstAidItem {
  id: string;
  title: string;
  urgency: 'critical' | 'urgent' | 'common';
  summary: string;
  steps: string[];
  dos: string[];
  donts: string[];
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  hospital: string;
  experience: string;
  rating: number;
  consultationFee: string;
}

export interface AppointmentItem {
  id: string;
  doctorName: string;
  specialty: string;
  hospital: string;
  dateTime: string;
  type: 'in-person' | 'telehealth' | 'In-person' | 'Video Call' | 'Follow-up';
  status: 'confirmed' | 'completed' | 'upcoming' | 'cancelled';
  notes?: string;
}

export type Appointment = AppointmentItem;
export type FirstAidGuide = FirstAidItem;

// ==========================================
// GLUCOSE, BP & SUGAR DIET LOGGING TYPES
// ==========================================

export type BloodSugarTestType = 'fasting' | 'post_prandial' | 'random' | 'hba1c';
export type GlucoseStatus = 'normal' | 'elevated' | 'high' | 'low';

export interface BloodSugarReading {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  value: number;
  unit: 'mg/dL' | '%';
  testType: BloodSugarTestType;
  status: GlucoseStatus;
  notes?: string;
}

export type BPStatus = 'normal' | 'elevated' | 'stage1' | 'stage2';

export interface BloodPressureReading {
  id: string;
  timestamp: string;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse?: number;
  status: BPStatus;
  notes?: string;
}

export type FoodCategory =
  | 'rice_grains'
  | 'bread_roti'
  | 'fruits'
  | 'dairy_sweets'
  | 'beverages'
  | 'snacks_meals';

export interface FoodDatabaseItem {
  id: string;
  name: string;
  aliases: string[];
  category: FoodCategory;
  servingSize: string;
  sugarGrams: number;
  carbsGrams: number;
  calories?: number;
}

export interface LoggedFoodItem {
  id: string;
  name: string;
  quantity: number;
  servingText: string;
  sugarGrams: number;
  carbsGrams: number;
  isCustom?: boolean;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snacks';

export interface DailyDietLog {
  date: string;
  meals: {
    breakfast: LoggedFoodItem[];
    lunch: LoggedFoodItem[];
    dinner: LoggedFoodItem[];
    snacks: LoggedFoodItem[];
  };
  totalSugar: number;
  totalCarbs: number;
  customLimit?: number;
}

export interface SugarRiskInsight {
  level: 'optimal' | 'caution' | 'neutral' | 'advisory';
  title: string;
  message: string;
  badge: string;
  recommendedAction: string;
}
