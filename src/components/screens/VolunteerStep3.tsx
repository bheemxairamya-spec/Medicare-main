import React, { useState } from 'react';
import {
  HeartHandshake,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Activity,
  Moon,
  Droplets,
  Flame,
  Pill,
} from 'lucide-react';
import { RouteKey, VolunteerProfile } from '../../types';
import { StepperHeader, StepItem } from '../common/StepperHeader';
import { ProgressRing } from '../common/ProgressRing';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { addVolunteerHabits } from '../../services/volunteerService';

interface VolunteerStep3Props {
  volunteerProfile: VolunteerProfile;
  onSaveStep3: (habits: VolunteerProfile['habits'], score: number) => void;
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const VolunteerStep3: React.FC<VolunteerStep3Props> = ({
  volunteerProfile,
  onSaveStep3,
  onNavigate,
  id,
}) => {
  const [habits, setHabits] = useState(
    volunteerProfile.habits || {
      sleepSchedule: '7-8 hours restful sleep',
      exerciseFrequency: '3-4 times a week (Moderate cardio)',
      waterIntake: '2.5 to 3 Liters daily',
      smoking: 'Never smoked / Non-smoker',
      alcoholConsumption: 'Occasional / None within last 48 hrs',
      recentMedicationUsage: 'Standard daily multivitamins only',
      recentIllness: 'No fever or illness in past 30 days',
      previousBloodDonation: 'Donated 3+ times previously',
      physicalActivityLevel: 'Active / Regular fitness',
      notes: 'Well-hydrated and ready for emergency donor callout.',
    }
  );

  const steps: StepItem[] = [
    { number: 1, title: 'Personal Details', subtitle: 'ID & Verification' },
    { number: 2, title: 'Biomedical Scan', subtitle: 'ESP32 Vital Check' },
    { number: 3, title: 'Daily Habits', subtitle: 'Lifestyle Index' },
    { number: 4, title: 'Declaration', subtitle: 'Legal Consent' },
  ];

  // Dynamic score calculator
  const calculateScore = () => {
    let score = 50;
    if (habits.sleepSchedule.includes('7-8')) score += 10;
    if (habits.exerciseFrequency.includes('3-4') || habits.exerciseFrequency.includes('Daily')) score += 10;
    if (habits.waterIntake.includes('2.5') || habits.waterIntake.includes('3')) score += 8;
    if (habits.smoking.includes('Non-smoker')) score += 10;
    if (habits.alcoholConsumption.includes('None') || habits.alcoholConsumption.includes('Occasional')) score += 5;
    if (habits.recentIllness.includes('No fever')) score += 7;
    return Math.min(100, score);
  };

  const currentScore = calculateScore();

  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleProceed = async () => {
    if (!volunteerProfile.volunteerId) {
      setSaveError('Complete basic volunteer registration before saving habits.');
      return;
    }
    setIsSaving(true);
    setSaveError(null);
    const result = await addVolunteerHabits(volunteerProfile.volunteerId, habits, habits.notes || '');
    if (!result.success) {
      setSaveError(result.message || 'Could not save daily habits.');
      setIsSaving(false);
      return;
    }
    onSaveStep3(habits, currentScore);
    setIsSaving(false);
    onNavigate('volunteer-step4');
  };

  return (
    <div id={id || 'volunteer-step3'} className="max-w-6xl mx-auto space-y-7">
      <StepperHeader
        steps={steps}
        currentStep={3}
        onStepClick={(s) => {
          if (s === 1) onNavigate('volunteer-step1');
          if (s === 2) onNavigate('volunteer-step2');
          if (s === 4) onNavigate('volunteer-step4');
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Lifestyle Questions */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-gray-100 pb-4">
            <h2 className="text-xl sm:text-2xl font-bold text-[#0F1D3D] flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-purple-600" /> Lifestyle & Daily Health Index
            </h2>
            <p className="text-sm sm:text-base text-[#4B5563] mt-1.5 leading-relaxed">
              Step 3 of 5: Evaluate your resting recovery, hydration habits, and metabolic background.
            </p>
          </div>

          <div className="space-y-5">
            {/* Question 1: Sleep */}
            <div className="p-5 bg-[#F4F7FC]/70 rounded-2xl border border-[#E5EAF3] space-y-2.5">
              <label className="block text-sm font-bold text-[#0F1D3D] flex items-center gap-2">
                <Moon className="w-4 h-4 text-indigo-600" /> Average Daily Sleep Duration
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  '7-8 hours restful sleep',
                  '6-7 hours moderate',
                  'Under 6 hours (Disturbed)',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHabits({ ...habits, sleepSchedule: opt })}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      habits.sleepSchedule === opt
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 2: Hydration */}
            <div className="p-5 bg-[#F4F7FC]/70 rounded-2xl border border-[#E5EAF3] space-y-2.5">
              <label className="block text-sm font-bold text-[#0F1D3D] flex items-center gap-2">
                <Droplets className="w-4 h-4 text-blue-600" /> Daily Water Intake
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  '2.5 to 3 Liters daily',
                  '1.5 to 2 Liters daily',
                  'Under 1.5 Liters daily',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHabits({ ...habits, waterIntake: opt })}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      habits.waterIntake === opt
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 3: Exercise */}
            <div className="p-5 bg-[#F4F7FC]/70 rounded-2xl border border-[#E5EAF3] space-y-2.5">
              <label className="block text-sm font-bold text-[#0F1D3D] flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" /> Exercise Frequency
              </label>
              <div className="flex flex-wrap gap-2.5">
                {[
                  '3-4 times a week (Moderate cardio)',
                  'Daily intense training',
                  '1-2 times weekly',
                  'Sedentary / Rare',
                ].map((opt) => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setHabits({ ...habits, exerciseFrequency: opt })}
                    className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
                      habits.exerciseFrequency === opt
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
            </div>

            {/* Question 4: Smoking & Alcohol */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 bg-[#F4F7FC]/70 rounded-2xl border border-[#E5EAF3] space-y-2.5">
                <label className="block text-sm font-bold text-[#0F1D3D]">Smoking History</label>
                <div className="flex flex-col gap-2">
                  {[
                    'Never smoked / Non-smoker',
                    'Quit over 12 months ago',
                    'Occasional / Regular smoker',
                  ].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setHabits({ ...habits, smoking: opt })}
                      className={`px-4 py-2.5 text-left rounded-xl text-sm font-bold transition-all ${
                        habits.smoking === opt
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-5 bg-[#F4F7FC]/70 rounded-2xl border border-[#E5EAF3] space-y-2.5">
                <label className="block text-sm font-bold text-[#0F1D3D]">Alcohol Consumption</label>
                <div className="flex flex-col gap-2">
                  {[
                    'Occasional / None within last 48 hrs',
                    'Strict Non-drinker',
                    'Regular social consumption',
                  ].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setHabits({ ...habits, alcoholConsumption: opt })}
                      className={`px-4 py-2.5 text-left rounded-xl text-sm font-bold transition-all ${
                        habits.alcoholConsumption === opt
                          ? 'bg-purple-600 text-white'
                          : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-100'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Question 5: Recent Illness & Donations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="p-5 bg-[#F4F7FC]/70 rounded-2xl border border-[#E5EAF3] space-y-2.5">
                <label className="block text-sm font-bold text-[#0F1D3D]">Recent Illness History</label>
                <select
                  value={habits.recentIllness}
                  onChange={(e) => setHabits({ ...habits, recentIllness: e.target.value })}
                  className="w-full bg-white border border-gray-200 text-sm sm:text-base rounded-xl px-3.5 py-3 text-[#0F1D3D] font-medium"
                >
                  <option value="No fever or illness in past 30 days">
                    No fever or illness in past 30 days
                  </option>
                  <option value="Mild cold recovered > 14 days ago">
                    Mild cold recovered &gt; 14 days ago
                  </option>
                  <option value="Recent antibiotic course completed">
                    Recent antibiotic course completed
                  </option>
                </select>
              </div>

              <div className="p-5 bg-[#F4F7FC]/70 rounded-2xl border border-[#E5EAF3] space-y-2.5">
                <label className="block text-sm font-bold text-[#0F1D3D]">Previous Donations</label>
                <select
                  value={habits.previousBloodDonation}
                  onChange={(e) => setHabits({ ...habits, previousBloodDonation: e.target.value })}
                  className="w-full bg-white border border-gray-200 text-sm sm:text-base rounded-xl px-3.5 py-3 text-[#0F1D3D] font-medium"
                >
                  <option value="Donated 3+ times previously">Donated 3+ times previously</option>
                  <option value="Donated 1-2 times before">Donated 1-2 times before</option>
                  <option value="First-time blood donor">First-time blood donor</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-bold text-[#0F1D3D] mb-1.5">
                Additional Lifestyle & Nutritional Notes
              </label>
              <textarea
                rows={2}
                value={habits.notes}
                onChange={(e) => setHabits({ ...habits, notes: e.target.value })}
                className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl p-3.5 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            {saveError && <p className="text-sm font-semibold text-red-600">{saveError}</p>}
            <button
              type="button"
              onClick={() => onNavigate('volunteer-step1')}
              className="px-6 py-3 bg-white border border-[#E5EAF3] hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Basic Details</span>
            </button>

            <button
              type="button"
              onClick={handleProceed}
              disabled={isSaving}
              className="px-7 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md flex items-center gap-2 transition active:scale-98"
            >
              <span>{isSaving ? 'Saving…' : 'Continue to Declaration'}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Right Column: Lifestyle Score Ring */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm text-center">
            <h3 className="text-base sm:text-lg font-bold text-[#0F1D3D]">Calculated Lifestyle Score</h3>
            <p className="text-sm text-gray-500 mt-1">Biocompatibility Readiness</p>

            <div className="my-6 flex justify-center">
              <ProgressRing
                percentage={currentScore}
                size={120}
                strokeWidth={10}
                color="#9333EA"
                label="Readiness"
                sublabel="Score"
              />
            </div>

            <p className="text-sm text-purple-950 font-bold bg-purple-50 p-3 rounded-2xl border border-purple-200 leading-relaxed">
              Optimal Readiness: Eligible for whole blood & platelet apheresis.
            </p>
          </div>
        </div>
      </div>

      <ReassuranceBar />
    </div>
  );
};
