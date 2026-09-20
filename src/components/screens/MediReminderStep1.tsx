import React, { useState } from 'react';
import {
  Pill,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { MedicationProfile, RouteKey, User } from '../../types';
import { StepperHeader, StepItem } from '../common/StepperHeader';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { PhoneInput } from '../common/PhoneInput';

interface MediReminderStep1Props {
  profile: MedicationProfile;
  onSaveProfile: (profile: Partial<MedicationProfile>) => void;
  onNavigate: (route: RouteKey) => void;
  currentUser: User | null;
  id?: string;
}

export const MediReminderStep1: React.FC<MediReminderStep1Props> = ({
  profile,
  onSaveProfile,
  onNavigate,
  currentUser,
  id,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: profile.name || currentUser?.name || '',
    age: profile.age && Number(profile.age) >= 18 ? profile.age : ('' as any),
    gender: profile.gender || 'Female',
    mobile: profile.mobile || currentUser?.phone || '',
    emergencyContact: profile.emergencyContact || '',
    reminderChannels: {
      push: profile.reminderChannels?.push ?? true,
      sms: profile.reminderChannels?.sms ?? true,
      dashboard: profile.reminderChannels?.dashboard ?? true,
    },
  });

  const steps: StepItem[] = [
    { number: 1, title: 'Basic Information', subtitle: 'Personal & Contact Details' },
    { number: 2, title: 'Medication Schedule', subtitle: 'Frequency & Timings' },
    { number: 3, title: 'Dashboard', subtitle: 'Adherence & Analytics' },
  ];

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. Age validation: Must be 18+
    const numAge = parseInt(String(formData.age), 10);
    if (!formData.age || isNaN(numAge) || numAge < 18) {
      setErrorMessage('Age criteria not met: Patient must be at least 18 years of age (under 18 is prohibited).');
      return;
    }

    // 2. Mobile validation: Must be 10 digits, cannot start with 0
    const rawMobile = formData.mobile.replace(/\D/g, '');
    const cleanMobile = rawMobile.startsWith('91') && rawMobile.length > 10 ? rawMobile.slice(2) : rawMobile;
    if (cleanMobile.length !== 10 || cleanMobile.startsWith('0')) {
      setErrorMessage('Please enter a valid 10-digit Indian mobile number (cannot start with 0).');
      return;
    }

    // 3. Emergency Contact validation
    if (formData.emergencyContact) {
      const rawEmerg = formData.emergencyContact.replace(/\D/g, '');
      const cleanEmerg = rawEmerg.startsWith('91') && rawEmerg.length > 10 ? rawEmerg.slice(2) : rawEmerg;
      if (cleanEmerg.length !== 10 || cleanEmerg.startsWith('0')) {
        setErrorMessage('Emergency contact number must be a valid 10-digit number (cannot start with 0).');
        return;
      }
    }

    onSaveProfile({
      ...formData,
      age: numAge,
      mobile: `+91 ${cleanMobile.slice(0, 5)} ${cleanMobile.slice(5)}`,
    });
    onNavigate('medi-reminder-step2');
  };

  return (
    <div id={id || 'medi-reminder-step1'} className="max-w-6xl mx-auto space-y-7">
      <StepperHeader
        steps={steps}
        currentStep={1}
        onStepClick={(s) => {
          if (s === 2) onNavigate('medi-reminder-step2');
          if (s === 3) onNavigate('medi-reminder-dashboard');
        }}
      />

      <form onSubmit={handleNext} className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Form: Personal & Contact Information */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-8 shadow-sm space-y-7">
          <div className="border-b border-gray-100 pb-5">
            <h2 className="text-xl sm:text-2xl font-black text-[#0F1D3D] flex items-center gap-2.5">
              <Pill className="w-6 h-6 text-[#2563EB]" /> Personal & Contact Details
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] mt-1.5 leading-relaxed">
              Enter your basic contact information so Medicare can schedule dosage timing and dispatch timely reminders to you and your emergency contact.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-sm font-semibold flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                  Full Legal Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Full Legal Name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (errorMessage) setErrorMessage(null);
                  }}
                  className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                    Age (18+)
                  </label>
                  <input
                    type="number"
                    required
                    min={18}
                    max={120}
                    placeholder="25"
                    value={formData.age}
                    onChange={(e) => {
                      setFormData({ ...formData, age: e.target.value });
                      if (errorMessage) setErrorMessage(null);
                    }}
                    className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  />
                </div>
                <div>
                  <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-3.5 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB]"
                  >
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                  Mobile Phone (for SMS)
                </label>
                <PhoneInput
                  id="med-profile-mobile"
                  required
                  value={formData.mobile}
                  onChange={(val) => {
                    setFormData({ ...formData, mobile: val });
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </div>

              <div>
                <label className="block text-sm sm:text-[15px] font-bold text-[#0F1D3D] mb-1.5">
                  Emergency Contact Phone
                </label>
                <PhoneInput
                  id="med-profile-emergency"
                  placeholder="98765 43210 (Doctor / Family)"
                  value={formData.emergencyContact}
                  onChange={(val) => {
                    setFormData({ ...formData, emergencyContact: val });
                    if (errorMessage) setErrorMessage(null);
                  }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="submit"
              className="px-7 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-base rounded-xl shadow-md flex items-center gap-2.5 transition active:scale-98 cursor-pointer"
            >
              <span>Continue to Medication Schedule</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Panel: Benefits & Care Guidance */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm">
            <div className="w-11 h-11 rounded-2xl bg-[#EFF4FF] text-[#2563EB] flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-[#0F1D3D]">
              Personalized Care Starts Here
            </h3>
            <p className="text-sm sm:text-base text-[#4B5563] mt-2 leading-relaxed">
              Clinical studies demonstrate that structured meal-synchronized reminders improve
              therapeutic medication adherence by over 42%.
            </p>

            <div className="mt-6 space-y-4 pt-5 border-t border-gray-100">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm sm:text-[15px] text-gray-700 leading-relaxed">
                  <strong className="text-[#0F1D3D]">Interference Prevention:</strong> Flag potential
                  interactions between your active prescriptions.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm sm:text-[15px] text-gray-700 leading-relaxed">
                  <strong className="text-[#0F1D3D]">Caregiver Sync:</strong> Missed doses can trigger
                  a designated SMS to your emergency contact.
                </p>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-sm sm:text-[15px] text-gray-700 leading-relaxed">
                  <strong className="text-[#0F1D3D]">Pharmacy Refill Alerts:</strong> Automated 7-day
                  low-supply warnings.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#0F1D3D] to-slate-800 text-white rounded-3xl p-6 shadow-sm">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
              Clinical Security
            </span>
            <h4 className="text-base sm:text-lg font-bold mt-1.5">Encrypted Health Dossier</h4>
            <p className="text-sm text-slate-300 mt-1.5 leading-relaxed">
              All clinical records are encrypted end-to-end. Your data is never sold or shared with
              third-party advertisers.
            </p>
          </div>
        </div>
      </form>

      <ReassuranceBar />
    </div>
  );
};
