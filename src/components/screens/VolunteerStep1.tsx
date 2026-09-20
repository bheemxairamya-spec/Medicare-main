import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Upload,
  Calendar,
  Clock,
  FileCheck,
  CheckCircle2,
  Search,
  Wine,
  Wind,
  Scale,
  Heart,
  Thermometer,
  Activity,
  X,
  AlertCircle,
  Check,
  RotateCcw,
} from 'lucide-react';
import { HardwareReading, HardwareStatus, RouteKey, User, VolunteerProfile } from '../../types';
import { StepperHeader, StepItem } from '../common/StepperHeader';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { PhoneInput } from '../common/PhoneInput';
import { StatusPill } from '../common/StatusPill';
import { registerVolunteer, getMyVolunteerStatus } from '../../services/volunteerService';
import { uploadIdProof } from '../../services/storageService';
import { supabase } from '../../services/supabaseClient';
import { getHardwareReadings, assignReading, HardwareReading as RawHardwareReading } from '../../services/hardwareService';

const statusFor = (ok: boolean): HardwareStatus => (ok ? 'pass' : 'fail');

const mapRawReadingToCards = (r: RawHardwareReading): HardwareReading[] => [
  {
    id: `hw-${r.id}-mq3`,
    sensorCode: 'MQ3',
    sensorName: 'MQ-3 Gas Sensor',
    metricName: 'Alcohol Level',
    value: r.alcohol_level.toFixed(3),
    unit: 'BAC %',
    referenceRange: '0.00% (Strict Zero-Tolerance)',
    status: statusFor(r.alcohol_level <= 0.005),
    description: 'Semiconductor gas detection verifying breath ethanol content meets clinical safety standards.',
  },
  {
    id: `hw-${r.id}-mq135`,
    sensorCode: 'MQ135',
    sensorName: 'MQ-135 Air Quality Sensor',
    metricName: 'Air Quality Index',
    value: r.air_quality_index.toFixed(1),
    unit: 'AQI',
    referenceRange: '< 50 AQI (Good Clean Air)',
    status: statusFor(r.air_quality_index < 50),
    description: 'Monitors environmental airborne contaminants in testing room.',
  },
  {
    id: `hw-${r.id}-hx711`,
    sensorCode: 'HX711',
    sensorName: 'HX711 + Load Cell',
    metricName: 'Weight',
    value: r.weight_kg.toFixed(1),
    unit: 'kg',
    referenceRange: '≥ 50.0 kg (Minimum Standard)',
    status: statusFor(r.weight_kg >= 50.0),
    description: 'Verifying sufficient blood volume reserve to prevent vasovagal reaction.',
  },
  {
    id: `hw-${r.id}-hr`,
    sensorCode: 'MAX30102_HR',
    sensorName: 'MAX30102 Pulse Sensor',
    metricName: 'Heart Rate',
    value: r.heart_rate_bpm,
    unit: 'BPM',
    referenceRange: '50 – 100 BPM (Resting Norm)',
    status: statusFor(r.heart_rate_bpm >= 50 && r.heart_rate_bpm <= 100),
    description: 'Optical pulse cadence monitoring arterial cardiac cadence.',
  },
  {
    id: `hw-${r.id}-temp`,
    sensorCode: 'DS18B20',
    sensorName: 'DS18B20 Dallas Probe',
    metricName: 'Core Body Temperature',
    value: r.body_temp_c.toFixed(1),
    unit: '°C',
    referenceRange: '36.1°C – 37.5°C (Normothermia)',
    status: statusFor(r.body_temp_c >= 36.1 && r.body_temp_c <= 37.5),
    description: 'Dallas 1-Wire waterproof digital probe screening against fever or infection.',
  },
  {
    id: `hw-${r.id}-spo2`,
    sensorCode: 'MAX30102_SPO2',
    sensorName: 'MAX30102 Pulse Oximeter',
    metricName: 'SpO2',
    value: r.spo2_percent.toFixed(1),
    unit: '%',
    referenceRange: '≥ 95.0% (Clinical Baseline)',
    status: statusFor(r.spo2_percent >= 95.0),
    description: 'Dual-wavelength arterial oxygen saturation monitoring.',
  },
];

interface VolunteerStep1Props {
  volunteerProfile: VolunteerProfile;
  onSaveStep1: (data: Partial<VolunteerProfile>) => void;
  onNavigate: (route: RouteKey) => void;
  currentUser: User | null;
  id?: string;
}

export const VolunteerStep1: React.FC<VolunteerStep1Props> = ({
  volunteerProfile,
  onSaveStep1,
  onNavigate,
  currentUser,
  id,
}) => {
  const [formData, setFormData] = useState({
    name: volunteerProfile.name || currentUser?.name || '',
    dob: volunteerProfile.dob || '',
    gender: volunteerProfile.gender || 'Female',
    bloodGroup: volunteerProfile.bloodGroup || 'O+',
    mobile: volunteerProfile.mobile || currentUser?.phone || '',
    email: volunteerProfile.email || currentUser?.email || '',
    location: volunteerProfile.location || '',
    emergencyContact: volunteerProfile.emergencyContact || '',
    preferredDonationLocation: volunteerProfile.preferredDonationLocation || '',
    availableDays: volunteerProfile.availableDays || [],
    availableTime: volunteerProfile.availableTime || '09:00 AM – 02:00 PM',
    idDocumentUploaded: volunteerProfile.idDocumentUploaded ?? Boolean(volunteerProfile.id_proof_url),
    idDocumentName: volunteerProfile.idDocumentName || (volunteerProfile.id_proof_url ? 'Govt_ID_Uploaded.pdf' : ''),
  });

  const [idFile, setIdFile] = useState<File | null>(null);
  const [idProofPath, setIdProofPath] = useState<string | null>(volunteerProfile.id_proof_url || null);
  const [isUploadingId, setIsUploadingId] = useState(false);
  const [idUploadError, setIdUploadError] = useState<string | null>(null);

  const [hardwareReadings, setHardwareReadings] = useState<HardwareReading[]>(
    volunteerProfile.hardwareReadings || []
  );

  // Upload / Fetch Hardware Readings state — searches real saved hardware_readings by name
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RawHardwareReading[]>([]);
  const [isSearchingReadings, setIsSearchingReadings] = useState(false);
  const [selectedReading, setSelectedReading] = useState<RawHardwareReading | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function checkExisting() {
      const res = await getMyVolunteerStatus();
      if (!mounted) return;
      if (res.success && res.volunteer) {
        const v = res.volunteer;
        const partial: Partial<VolunteerProfile> = {
          volunteerId: v.id,
          name: v.name,
          bloodGroup: v.blood_group,
          mobile: v.mobile,
          email: v.email,
          dob: v.date_of_birth,
          location: v.location,
          emergencyContact: v.emergency_contact_phone,
          preferredDonationLocation: v.preferred_donation_center,
          availableDays: v.available_days || [],
          availableTime: v.available_time,
          idDocumentUploaded: Boolean(v.id_proof_url),
          id_proof_url: v.id_proof_url,
        };
        onSaveStep1(partial);
        if (v.volunteer_habits && v.volunteer_habits.length > 0) {
          onNavigate('volunteer-status');
        } else {
          onNavigate('volunteer-step2');
        }
      }
    }
    if (!volunteerProfile.volunteerId && currentUser) {
      checkExisting();
    }
    return () => { mounted = false; };
  }, [volunteerProfile.volunteerId, currentUser, onSaveStep1, onNavigate]);

  useEffect(() => {
    const q = searchQuery.trim();
    if (!q || selectedReading) {
      setSearchResults([]);
      return;
    }
    setIsSearchingReadings(true);
    const timeoutId = setTimeout(async () => {
      try {
        const res = await getHardwareReadings({ search: q, limit: 8 });
        setSearchResults(res.success ? res.readings || [] : []);
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearchingReadings(false);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedReading]);

  const handleSelectReading = (r: RawHardwareReading) => {
    setSelectedReading(r);
    setSearchQuery(r.user_name || r.volunteer_name || 'Unnamed Scan');
    setShowSuggestions(false);
    setHardwareReadings(mapRawReadingToCards(r));
  };

  const handleClearPatient = () => {
    setSelectedReading(null);
    setSearchQuery('');
    setShowSuggestions(false);
    setHardwareReadings([]);
  };

  const handleAutofillFromPatient = () => {
    if (!selectedReading) return;
    const name = selectedReading.user_name || selectedReading.volunteer_name;
    if (!name) return;
    setFormData((prev) => ({ ...prev, name }));
  };

  const selectedReadingName = selectedReading
    ? selectedReading.user_name || selectedReading.volunteer_name || 'Unnamed Scan'
    : '';
  const selectedReadingHoursAgo = selectedReading
    ? (Date.now() - new Date(selectedReading.recorded_at).getTime()) / 3600000
    : 0;

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const steps: StepItem[] = [
    { number: 1, title: 'Personal Details', subtitle: 'ID & Verification' },
    { number: 2, title: 'Biomedical Scan', subtitle: 'ESP32 Vital Check' },
    { number: 3, title: 'Daily Habits', subtitle: 'Lifestyle Index' },
    { number: 4, title: 'Declaration', subtitle: 'Legal Consent' },
  ];

  const handleToggleDay = (day: string) => {
    const current = formData.availableDays;
    if (current.includes(day)) {
      setFormData({ ...formData, availableDays: current.filter((d) => d !== day) });
    } else {
      setFormData({ ...formData, availableDays: [...current, day] });
    }
  };

  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleIdFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIdFile(file);
    setIsUploadingId(true);
    setIdUploadError(null);

    try {
      const uploadRes = await uploadIdProof(file);
      if (uploadRes.success && uploadRes.path) {
        setIdProofPath(uploadRes.path);
        setFormData((prev) => ({
          ...prev,
          idDocumentUploaded: true,
          idDocumentName: file.name,
        }));
      } else {
        setIdUploadError(uploadRes.message || 'Failed to upload ID document.');
      }
    } catch {
      setIdUploadError('Error uploading ID document.');
    } finally {
      setIsUploadingId(false);
    }
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    // 1. Age Validation: Blood Donors MUST be 18+
    if (formData.dob) {
      const birthDate = new Date(formData.dob);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      if (age < 18) {
        setSubmitError('Age criteria not met: You must be at least 18 years old to register as a blood donor.');
        setIsSubmitting(false);
        return;
      }
    } else {
      setSubmitError('Please provide your Date of Birth to verify donor eligibility (18+).');
      setIsSubmitting(false);
      return;
    }

    // 2. Mobile validation: 10 digits, cannot start with 0
    const rawMobile = formData.mobile.replace(/\D/g, '');
    const cleanMobile = rawMobile.startsWith('91') && rawMobile.length > 10 ? rawMobile.slice(2) : rawMobile;
    if (cleanMobile.length !== 10 || cleanMobile.startsWith('0')) {
      setSubmitError('Please enter a valid 10-digit Indian mobile number (cannot start with 0).');
      setIsSubmitting(false);
      return;
    }

    let finalIdPath = idProofPath;
    if (idFile && !finalIdPath) {
      const uploadRes = await uploadIdProof(idFile);
      if (uploadRes.success && uploadRes.path) {
        finalIdPath = uploadRes.path;
      }
    }

    const result = await registerVolunteer(
      formData.name,
      formData.bloodGroup,
      `+91 ${cleanMobile.slice(0, 5)} ${cleanMobile.slice(5)}`,
      formData.email,
      {
        dateOfBirth: formData.dob || undefined,
        location: formData.location || undefined,
        emergencyContactPhone: formData.emergencyContact || undefined,
        preferredDonationCenter: formData.preferredDonationLocation || undefined,
        availableDays: formData.availableDays.length > 0 ? formData.availableDays : undefined,
      }
    );
    if (!result.success || !result.volunteer) {
      setSubmitError(result.message || 'Could not register volunteer.');
      setIsSubmitting(false);
      return;
    }

    if (finalIdPath) {
      await supabase
        .from('volunteers')
        .update({ id_proof_url: finalIdPath })
        .eq('id', result.volunteer.id);
    }

    // Link the selected hardware reading to this newly-created volunteer so it
    // shows up against their application in the admin Blood Verification queue.
    if (selectedReading) {
      await assignReading(selectedReading.id, {
        volunteer_id: result.volunteer.id,
        volunteer_name: formData.name,
        user_id: result.volunteer.id,
        user_name: formData.name,
      });
    }

    onSaveStep1({
      ...formData,
      hardwareReadings,
      volunteerId: result.volunteer.id,
      id_proof_url: finalIdPath || undefined,
    });
    setIsSubmitting(false);
    onNavigate('volunteer-step2');
  };

  return (
    <div id={id || 'volunteer-step1'} className="max-w-6xl mx-auto space-y-7">
      <StepperHeader
        steps={steps}
        currentStep={1}
        onStepClick={(s) => {
          if (s === 2) onNavigate('volunteer-step2');
          if (s === 3) onNavigate('volunteer-step3');
          if (s === 4) onNavigate('volunteer-step4');
        }}
      />

      <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Form: Demographics & Availability */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F1D3D] flex items-center gap-2.5">
                <HeartHandshake className="w-6 h-6 text-purple-600" /> Blood Donor Registration
              </h2>
              <p className="text-sm sm:text-base text-[#4B5563] mt-1 leading-relaxed">
                Step 1 of 4: Fill in your verified demographic information and preferred dispatch window.
              </p>
            </div>
            {volunteerProfile.declaration?.consentGiven && (
              <button
                type="button"
                onClick={() => onNavigate('volunteer-status')}
                className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl border border-purple-200 transition shrink-0"
              >
                View Donor Status →
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Full Legal Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  required
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-medium"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Blood Group</label>
                <select
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-3.5 py-3 text-[#0F1D3D] font-bold focus:outline-none focus:ring-2 focus:ring-purple-600/30"
                >
                  <option value="O+">O+ (Positive)</option>
                  <option value="O-">O- (Universal Donor)</option>
                  <option value="A+">A+ (Positive)</option>
                  <option value="A-">A- (Negative)</option>
                  <option value="B+">B+ (Positive)</option>
                  <option value="B-">B- (Negative)</option>
                  <option value="AB+">AB+ (Universal Recipient)</option>
                  <option value="AB-">AB- (Negative)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Mobile Contact</label>
              <PhoneInput
                id="vol-profile-mobile"
                required
                value={formData.mobile}
                onChange={(val) => setFormData({ ...formData, mobile: val })}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Emergency Contact Phone</label>
              <PhoneInput
                id="vol-profile-emergency"
                required
                placeholder="98765 43210 (Kin / Doctor)"
                value={formData.emergencyContact}
                onChange={(val) => setFormData({ ...formData, emergencyContact: val })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Email Address</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-medium"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Current Resident Location / Area</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Preferred Donation Center / Hospital</label>
              <input
                type="text"
                value={formData.preferredDonationLocation}
                onChange={(e) => setFormData({ ...formData, preferredDonationLocation: e.target.value })}
                className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-medium"
              />
            </div>
          </div>

          {/* Supplementary Section: Upload / Fetch Hardware Readings */}
          <div
            id="section-upload-hardware"
            className="rounded-2xl border border-[#E5EAF3] bg-[#F8FAFC] p-5 sm:p-6 space-y-4 transition-all"
          >
            {/* Header: Title, Description, and Upload Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                  <Upload className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-bold text-[#0F1D3D]">
                      Upload
                    </h3>
                    <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                      Fetch Hardware Readings
                    </span>
                    <span className="text-[11px] font-medium text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                      Optional
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-[#4B5563] mt-0.5">
                    Search and link recent biomedical hardware telemetry records from a General Checkup scan.
                  </p>
                </div>
              </div>

              {/* Upload Button that reveals the search input */}
              <button
                type="button"
                id="btn-toggle-upload"
                onClick={() => {
                  setIsUploadOpen((prev) => !prev);
                  if (!isUploadOpen) {
                    setShowSuggestions(true);
                  }
                }}
                className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer shrink-0 self-start sm:self-auto shadow-2xs ${
                  isUploadOpen
                    ? 'bg-purple-100 hover:bg-purple-200 text-purple-800 border border-purple-200'
                    : 'bg-purple-600 hover:bg-purple-700 text-white shadow-xs'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>{isUploadOpen ? 'Close Upload' : 'Upload'}</span>
              </button>
            </div>

            {/* Revealed Upload Search Content */}
            {isUploadOpen && (
              <div className="pt-4 border-t border-gray-200/80 space-y-4">
                {/* Search Input: Search Patient by Name */}
                <div className="space-y-2">
                  <label htmlFor="input-search-patient-name" className="block text-sm font-bold text-[#0F1D3D]">
                    Search Patient by Name
                  </label>
                  <div className="relative">
                    <div className="relative flex items-center">
                      <Search className="w-4.5 h-4.5 text-gray-400 absolute left-3.5 pointer-events-none" />
                      <input
                        id="input-search-patient-name"
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setShowSuggestions(true);
                        }}
                        onFocus={() => setShowSuggestions(true)}
                        placeholder="Search Patient by Name..."
                        className="w-full bg-white border border-[#E5EAF3] text-sm sm:text-base rounded-xl pl-10 pr-10 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 focus:border-purple-600 font-medium shadow-2xs"
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          onClick={handleClearPatient}
                          className="absolute right-3 p-1 text-gray-400 hover:text-gray-600 transition"
                          title="Clear search"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Autocomplete Suggestions Dropdown — real saved hardware_readings, matched by name */}
                    {showSuggestions && searchQuery.trim().length > 0 && searchResults.length > 0 && !selectedReading && (
                      <div className="absolute z-20 left-0 right-0 mt-1.5 bg-white border border-[#E5EAF3] rounded-2xl shadow-lg divide-y divide-gray-100 overflow-hidden max-h-60 overflow-y-auto">
                        {searchResults.map((r) => {
                          const displayName = r.user_name || r.volunteer_name || 'Unnamed Scan';
                          const hoursAgo = (Date.now() - new Date(r.recorded_at).getTime()) / 3600000;
                          return (
                            <div
                              key={r.id}
                              onClick={() => handleSelectReading(r)}
                              className="p-3.5 hover:bg-purple-50/70 cursor-pointer flex items-center justify-between transition"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                                  {displayName.charAt(0)}
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-[#0F1D3D]">{displayName}</p>
                                  <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                                    <span>Status: <strong className={r.is_eligible ? 'text-emerald-600' : 'text-rose-600'}>{r.is_eligible ? 'Eligible' : 'Ineligible'}</strong></span>
                                    <span>•</span>
                                    <span>Recorded: {hoursAgo < 1 ? 'Under 1 hour ago' : `${hoursAgo.toFixed(1)} hours ago`}</span>
                                  </p>
                                </div>
                              </div>
                              <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 hover:bg-purple-600 hover:text-white transition">
                                Select &amp; Fetch
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {isSearchingReadings && (
                    <div className="pt-1 text-xs text-gray-400 italic">Searching saved hardware readings...</div>
                  )}

                  {/* No Match Notice */}
                  {!isSearchingReadings && searchQuery.trim().length > 0 && searchResults.length === 0 && !selectedReading && (
                    <div className="p-4 bg-amber-50/90 border border-amber-200 rounded-xl text-amber-900 text-xs sm:text-sm flex items-start gap-2.5 animate-in fade-in duration-150">
                      <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-semibold">
                          No hardware readings found for this name — please complete a hardware scan and save it under this name first.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Display Real Saved Hardware Readings on Selecting a Name */}
                {selectedReading && (
                  <div className="space-y-4 pt-2">
                    {/* Selected Reading Bar with Recorded Label & Reset */}
                    <div className="p-4 bg-white rounded-2xl border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                          {selectedReadingName.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-[#0F1D3D]">{selectedReadingName}</h4>
                            <span className="text-xs font-mono font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {selectedReading.device_id}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1 flex-wrap">
                            <span className="flex items-center gap-1 font-semibold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded border border-purple-100">
                              <Clock className="w-3.5 h-3.5 text-purple-600" />
                              Recorded: {selectedReadingHoursAgo < 1 ? 'Under 1 hour ago' : `${selectedReadingHoursAgo.toFixed(1)} hours ago`}
                            </span>
                            <span>•</span>
                            <span>Telemetry Source: ESP32 Biomedical Rig</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <button
                          type="button"
                          onClick={handleAutofillFromPatient}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-bold transition cursor-pointer"
                          title="Copy name to registration form"
                        >
                          Fill Form Fields
                        </button>
                        <button
                          type="button"
                          onClick={handleClearPatient}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Change</span>
                        </button>
                      </div>
                    </div>

                    {/* Overall Eligibility Banner — reflects the reading's actual saved eligibility */}
                    {selectedReading.is_eligible ? (
                      <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                            <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                              <span>Hardware Telemetry Cleared</span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                                Pass / Eligible
                              </span>
                            </p>
                            <p className="text-xs text-emerald-800 mt-0.5">
                              All biomedical sensors pass clinical blood donation standards (Zero alcohol, weight ≥ 50kg, safe SpO2, and resting pulse).
                            </p>
                          </div>
                        </div>
                        <StatusPill variant="pass" label="Pass / Eligible" size="sm" />
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-rose-50/90 border border-rose-300 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-rose-950 flex items-center gap-2">
                              <span>Hardware Telemetry Flagged</span>
                              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-rose-200 text-rose-900 px-2 py-0.5 rounded">
                                Review / Ineligible
                              </span>
                            </p>
                            <p className="text-xs text-rose-800 mt-0.5">
                              {selectedReading.flagged_reasons || 'One or more biomedical sensors are outside the clinical donation threshold.'}
                            </p>
                          </div>
                        </div>
                        <StatusPill variant="fail" label="Review / Ineligible" size="sm" />
                      </div>
                    )}

                    {/* 6 Hardware Sensor Metric Cards — status reflects real per-sensor thresholds */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                      {/* 1. Alcohol Level */}
                      <div className="p-4 rounded-2xl border border-[#E5EAF3] bg-white shadow-2xs flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 border border-rose-100 flex items-center justify-center shrink-0">
                              <Wine className="w-5 h-5 stroke-[2]" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold text-gray-500 block uppercase">
                                MQ-3
                              </span>
                              <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                                Alcohol Level
                              </h5>
                            </div>
                          </div>
                          {selectedReading.alcohol_level <= 0.005 ? (
                            <StatusPill variant="pass" label="Pass / Eligible" size="sm" />
                          ) : (
                            <StatusPill variant="fail" label="Fail" size="sm" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black text-[#0F1D3D] font-mono">
                              {selectedReading.alcohol_level.toFixed(3)}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-500">BAC %</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 font-semibold">
                            Ref: 0.00% (Strict Zero-Tolerance)
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Semiconductor gas detection verifying breath ethanol content meets clinical standards.
                        </p>
                      </div>

                      {/* 2. Air Quality Index */}
                      <div className="p-4 rounded-2xl border border-[#E5EAF3] bg-white shadow-2xs flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center shrink-0">
                              <Wind className="w-5 h-5 stroke-[2]" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold text-gray-500 block uppercase">
                                MQ-135
                              </span>
                              <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                                Air Quality Index
                              </h5>
                            </div>
                          </div>
                          {selectedReading.air_quality_index < 50 ? (
                            <StatusPill variant="pass" label="Pass / Eligible" size="sm" />
                          ) : (
                            <StatusPill variant="review" label="Review" size="sm" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black text-[#0F1D3D] font-mono">
                              {selectedReading.air_quality_index.toFixed(1)}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-500">AQI</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 font-semibold">
                            Ref: &lt; 50 AQI (Good Clean Air)
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Monitors airborne room contaminants for clean testing environment.
                        </p>
                      </div>

                      {/* 3. Weight */}
                      <div className="p-4 rounded-2xl border border-[#E5EAF3] bg-white shadow-2xs flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
                              <Scale className="w-5 h-5 stroke-[2]" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold text-gray-500 block uppercase">
                                HX711 + Load Cell
                              </span>
                              <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                                Weight
                              </h5>
                            </div>
                          </div>
                          {selectedReading.weight_kg >= 50.0 ? (
                            <StatusPill variant="pass" label="Pass / Eligible" size="sm" />
                          ) : (
                            <StatusPill variant="fail" label="Below 50kg Min" size="sm" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black text-[#0F1D3D] font-mono">
                              {selectedReading.weight_kg.toFixed(1)}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-500">kg</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 font-semibold">
                            Ref: &ge; 50.0 kg (Minimum Standard)
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Verifying sufficient body mass reserve to prevent vasovagal reaction.
                        </p>
                      </div>

                      {/* 4. Heart Rate */}
                      <div className="p-4 rounded-2xl border border-[#E5EAF3] bg-white shadow-2xs flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                              <Heart className="w-5 h-5 stroke-[2]" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold text-gray-500 block uppercase">
                                MAX30102
                              </span>
                              <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                                Heart Rate
                              </h5>
                            </div>
                          </div>
                          {selectedReading.heart_rate_bpm >= 50 && selectedReading.heart_rate_bpm <= 100 ? (
                            <StatusPill variant="pass" label="Pass / Eligible" size="sm" />
                          ) : (
                            <StatusPill variant="fail" label="Out of Range" size="sm" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black text-[#0F1D3D] font-mono">
                              {selectedReading.heart_rate_bpm}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-500">BPM</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 font-semibold">
                            Ref: 50 – 100 BPM (Resting Norm)
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Optical photoplethysmography verifying resting cardiac cadence.
                        </p>
                      </div>

                      {/* 5. Core Body Temperature */}
                      <div className="p-4 rounded-2xl border border-[#E5EAF3] bg-white shadow-2xs flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center shrink-0">
                              <Thermometer className="w-5 h-5 stroke-[2]" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold text-gray-500 block uppercase">
                                DS18B20
                              </span>
                              <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                                Core Body Temperature
                              </h5>
                            </div>
                          </div>
                          {selectedReading.body_temp_c >= 36.1 && selectedReading.body_temp_c <= 37.5 ? (
                            <StatusPill variant="pass" label="Pass / Eligible" size="sm" />
                          ) : (
                            <StatusPill variant="fail" label="Out of Range" size="sm" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black text-[#0F1D3D] font-mono">
                              {selectedReading.body_temp_c.toFixed(1)}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-500">&deg;C</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 font-semibold">
                            Ref: 36.1&deg;C – 37.5&deg;C (Normothermia)
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Digital Dallas 1-Wire probe screening against fever or acute illness.
                        </p>
                      </div>

                      {/* 6. SpO2 */}
                      <div className="p-4 rounded-2xl border border-[#E5EAF3] bg-white shadow-2xs flex flex-col justify-between space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center shrink-0">
                              <Activity className="w-5 h-5 stroke-[2]" />
                            </div>
                            <div>
                              <span className="text-[10px] font-mono font-bold text-gray-500 block uppercase">
                                MAX30102 (Red/IR)
                              </span>
                              <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                                SpO2
                              </h5>
                            </div>
                          </div>
                          {selectedReading.spo2_percent >= 95.0 ? (
                            <StatusPill variant="pass" label="Pass / Eligible" size="sm" />
                          ) : (
                            <StatusPill variant="fail" label="Below 95% Min" size="sm" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl sm:text-3xl font-black text-[#0F1D3D] font-mono">
                              {selectedReading.spo2_percent.toFixed(1)}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-gray-500">%</span>
                          </div>
                          <p className="text-xs text-gray-600 mt-0.5 font-semibold">
                            Ref: &ge; 95.0% (Clinical Baseline)
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 leading-relaxed">
                          Dual-wavelength optical arterial oxygen saturation monitoring.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Available Days Chip Toggles */}
          <div>
            <label className="block text-sm font-bold text-[#0F1D3D] mb-2">
              Available Days for Emergency Call-Outs
            </label>
            <div className="flex flex-wrap gap-2.5">
              {daysOfWeek.map((day) => {
                const isSelected = formData.availableDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleToggleDay(day)}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-[#F4F7FC] text-gray-700 border border-[#E5EAF3] hover:bg-gray-100'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Available Time & Government ID Upload */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">Available Time Window</label>
              <input
                type="text"
                value={formData.availableTime}
                onChange={(e) => setFormData({ ...formData, availableTime: e.target.value })}
                placeholder="e.g. 09:00 AM – 02:00 PM or 24/7"
                className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-medium"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">
                Government ID Document (Verification)
              </label>
              {formData.idDocumentUploaded ? (
                <div className="p-3.5 bg-[#F4F7FC] border border-dashed border-[#E5EAF3] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileCheck className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="text-sm text-gray-700 font-semibold truncate">
                      {formData.idDocumentName || 'Govt_ID_Uploaded.pdf'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIdFile(null);
                      setIdProofPath(null);
                      setFormData({ ...formData, idDocumentUploaded: false, idDocumentName: '' });
                    }}
                    className="text-xs font-bold text-red-600 hover:underline shrink-0 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <label className="p-3.5 bg-[#F4F7FC] hover:bg-purple-50/50 border border-dashed border-[#E5EAF3] hover:border-purple-300 rounded-xl flex items-center justify-between cursor-pointer transition">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Upload className="w-5 h-5 text-purple-600 shrink-0" />
                    <span className="text-sm text-gray-600 font-medium truncate">
                      {isUploadingId ? 'Uploading ID Proof...' : 'Attach National ID / Passport'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md shrink-0 ml-2">
                    {isUploadingId ? 'Uploading...' : 'Browse'}
                  </span>
                  <input
                    type="file"
                    className="hidden"
                    disabled={isUploadingId}
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={handleIdFileSelect}
                  />
                </label>
              )}
              {idUploadError && (
                <p className="text-xs font-bold text-red-600 mt-1">{idUploadError}</p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-3">
            {submitError && <p className="text-sm font-semibold text-red-600">{submitError}</p>}
            <button
              type="submit"
              id="btn-volunteer-continue-step2"
              disabled={isSubmitting}
              className="px-7 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md flex items-center gap-2 transition active:scale-98 cursor-pointer"
            >
              <span>{isSubmitting ? 'Registering…' : 'Proceed to Daily Habits & Lifestyle'}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Verification Trust & Area Map Preview */}
        <div className="lg:col-span-4 space-y-6">
          {/* Trust Highlights */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#0F1D3D]">Verified Donor Network</h3>
            <p className="text-sm text-[#4B5563] mt-1.5 leading-relaxed">
              Every blood donor goes through a dual-gate screening process: encrypted digital verification
              plus biomedical hardware telemetry.
            </p>

            <div className="mt-5 space-y-3.5 pt-4 border-t border-gray-100">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <strong>Zero Spam Calls:</strong> Hospital coordinators contact you only for verified
                  emergency blood matches.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">
                  <strong>Hardware-Backed:</strong> DS18B20 and Load Cell vitals establish real physical
                  fitness before donation dispatch.
                </p>
              </div>
            </div>
          </div>

          {/* Approximate Dispatch Radius Map Box */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 shadow-sm space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-[#0F1D3D] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-purple-600" /> Dispatch Coverage Area
              </span>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200">
                10 km Radius
              </span>
            </div>

            {/* Visual SVG Map Representation */}
            <div className="h-44 w-full rounded-2xl bg-[#EFF4FF]/60 border border-blue-100 relative overflow-hidden flex items-center justify-center">
              {/* Radar pulse circles */}
              <div className="absolute w-36 h-36 rounded-full border border-purple-400/30 animate-ping" />
              <div className="absolute w-28 h-28 rounded-full border border-purple-400/50 bg-purple-100/30" />
              <div className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shadow-md z-10">
                You
              </div>

              {/* Hospital markers */}
              <div className="absolute top-4 left-5 text-xs bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-bold text-[#0F1D3D] shadow-2xs">
                🏥 Trauma ICU (1.4 km)
              </div>
              <div className="absolute bottom-4 right-5 text-xs bg-white px-2.5 py-1 rounded-lg border border-gray-200 font-bold text-[#0F1D3D] shadow-2xs">
                🏥 St. Mary (4.2 km)
              </div>
            </div>

            <p className="text-xs text-gray-500 leading-relaxed">
              Matches are geo-filtered to minimize transit time during critical bleeding emergencies.
            </p>
          </div>
        </div>
      </form>

      <ReassuranceBar />
    </div>
  );
};
