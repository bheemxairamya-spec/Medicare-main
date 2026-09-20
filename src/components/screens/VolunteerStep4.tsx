import React, { useState } from 'react';
import {
  HeartHandshake,
  CheckSquare,
  Square,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { RouteKey, VolunteerProfile } from '../../types';
import { StepperHeader, StepItem } from '../common/StepperHeader';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { updateVolunteerAvailability } from '../../services/volunteerService';

interface VolunteerStep4Props {
  volunteerProfile: VolunteerProfile;
  onSaveStep4: (declaration: VolunteerProfile['declaration']) => void;
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const VolunteerStep4: React.FC<VolunteerStep4Props> = ({
  volunteerProfile,
  onSaveStep4,
  onNavigate,
  id,
}) => {
  const [declaration, setDeclaration] = useState(
    volunteerProfile.declaration || {
      confirmedAge: false,
      confirmedWeight: false,
      confirmedHealth: false,
      confirmedNoRecentTattoos: false,
      consentGiven: false,
    }
  );

  const steps: StepItem[] = [
    { number: 1, title: 'Personal Details', subtitle: 'ID & Verification' },
    { number: 2, title: 'Biomedical Scan', subtitle: 'ESP32 Vital Check' },
    { number: 3, title: 'Daily Habits', subtitle: 'Lifestyle Index' },
    { number: 4, title: 'Declaration', subtitle: 'Legal Consent' },
  ];

  const allChecked =
    declaration.confirmedAge &&
    declaration.confirmedWeight &&
    declaration.confirmedHealth &&
    declaration.confirmedNoRecentTattoos &&
    declaration.consentGiven;

  const [submitError, setSubmitError] = useState<string | null>(null);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!allChecked) {
      alert('Please review and confirm all medical eligibility declarations.');
      return;
    }
    if (!volunteerProfile.volunteerId) {
      setSubmitError('Complete basic volunteer registration before submitting your declaration.');
      return;
    }
    const result = await updateVolunteerAvailability(volunteerProfile.volunteerId, volunteerProfile.availableTime);
    if (!result.success) {
      setSubmitError(result.message || 'Could not update availability.');
      return;
    }
    onSaveStep4(declaration);
    onNavigate('volunteer-status');
  };

  return (
    <div id={id || 'volunteer-step4'} className="max-w-4xl mx-auto space-y-7">
      <StepperHeader
        steps={steps}
        currentStep={4}
        onStepClick={(s) => {
          if (s === 1) onNavigate('volunteer-step1');
          if (s === 2) onNavigate('volunteer-step2');
          if (s === 3) onNavigate('volunteer-step3');
        }}
      />

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-9 shadow-sm space-y-7">
        <div className="border-b border-gray-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F1D3D]">
                Clinical & Legal Eligibility Declaration
              </h2>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                Step 3 of 4: Legally binding statement regarding donor safety and infectious exclusions.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {[
            {
              key: 'confirmedAge' as const,
              title: 'Age Requirement (18 – 65 Years)',
              desc: 'I confirm that I am within the lawful clinical age range for voluntary whole blood and apheresis donation.',
            },
            {
              key: 'confirmedWeight' as const,
              title: 'Weight Threshold (≥ 50 kg / 110 lbs)',
              desc: 'I confirm that my body weight satisfies the minimum physiological blood volume threshold as verified by the load cell rig.',
            },
            {
              key: 'confirmedHealth' as const,
              title: 'Good General Physical Health',
              desc: 'I am currently free from acute febrile episodes, heart disease, active viral hepatitis, or blood-borne pathogen treatments.',
            },
            {
              key: 'confirmedNoRecentTattoos' as const,
              title: 'No Recent Tattoos / Piercings (Past 6 Months)',
              desc: 'I have not undergone non-sterile tattoo, body piercing, acupuncture, or major dental surgeries in the past 6 months.',
            },
            {
              key: 'consentGiven' as const,
              title: 'Emergency Contact Consent & Protocol Authorization',
              desc: 'I consent to being notified via encrypted Medicare SMS/Push for emergency blood donation requests within my designated radius.',
            },
          ].map((item) => {
            const isChecked = declaration[item.key];
            return (
              <div
                key={item.key}
                onClick={() => setDeclaration({ ...declaration, [item.key]: !isChecked })}
                className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 ${
                  isChecked
                    ? 'bg-purple-50/60 border-purple-300'
                    : 'bg-[#F4F7FC]/70 border-[#E5EAF3] hover:border-gray-300'
                }`}
              >
                <div className="shrink-0 mt-0.5">
                  {isChecked ? (
                    <CheckSquare className="w-6 h-6 text-purple-600" />
                  ) : (
                    <Square className="w-6 h-6 text-gray-400" />
                  )}
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-[#0F1D3D]">{item.title}</h4>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>

        {submitError && <p className="text-sm font-semibold text-red-600">{submitError}</p>}
        <div className="pt-5 border-t border-gray-100 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onNavigate('volunteer-step3')}
            className="px-6 py-3 bg-white border border-[#E5EAF3] hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl flex items-center gap-2 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Daily Habits</span>
          </button>

          <button
            type="submit"
            disabled={!allChecked}
            className="px-7 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-base rounded-xl shadow-md flex items-center gap-2 transition active:scale-98 disabled:opacity-50"
          >
            <FileCheck className="w-5 h-5" />
            <span>Submit Declaration & Activate Profile</span>
          </button>
        </div>
      </form>

      <ReassuranceBar />
    </div>
  );
};
