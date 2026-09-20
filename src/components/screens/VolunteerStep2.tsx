import React, { useState } from 'react';
import { RouteKey, VolunteerProfile, HardwareReading, HardwareReport } from '../../types';
import { ArrowRight, Cpu, CheckCircle2, HeartPulse, Upload, FileCheck, Loader2, AlertCircle } from 'lucide-react';
import { StepperHeader, StepItem } from '../common/StepperHeader';
import { triggerScan, type HardwareReading as ApiHardwareReading } from '../../services/hardwareService';
import { uploadMedicalReport } from '../../services/storageService';
import { supabase } from '../../services/supabaseClient';

interface VolunteerStep2Props {
  volunteerProfile: VolunteerProfile;
  onSaveStep2: (readings: HardwareReading[], report: HardwareReport, extra?: Partial<VolunteerProfile>) => void;
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const VolunteerStep2: React.FC<VolunteerStep2Props> = ({
  volunteerProfile,
  onSaveStep2,
  onNavigate,
  id,
}) => {
  const [reading, setReading] = useState<ApiHardwareReading | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Medical Test Report Upload State
  const [medicalReportPath, setMedicalReportPath] = useState<string | null>(
    volunteerProfile.medical_report_url || null
  );
  const [medicalReportName, setMedicalReportName] = useState<string>(
    volunteerProfile.externalLabReportName || (volunteerProfile.medical_report_url ? 'Medical_Report_Uploaded.pdf' : '')
  );
  const [isUploadingReport, setIsUploadingReport] = useState(false);
  const [reportUploadError, setReportUploadError] = useState<string | null>(null);
  const [reportUploadSuccess, setReportUploadSuccess] = useState<string | null>(null);

  const handleMedicalReportSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingReport(true);
    setReportUploadError(null);
    setReportUploadSuccess(null);

    try {
      const uploadRes = await uploadMedicalReport(file);
      if (uploadRes.success && uploadRes.path) {
        setMedicalReportPath(uploadRes.path);
        setMedicalReportName(file.name);
        setReportUploadSuccess('Medical report uploaded successfully!');

        if (volunteerProfile.volunteerId) {
          await supabase
            .from('volunteers')
            .update({ medical_report_url: uploadRes.path })
            .eq('id', volunteerProfile.volunteerId);
        }
      } else {
        setReportUploadError(uploadRes.message || 'Failed to upload medical report.');
      }
    } catch {
      setReportUploadError('Error uploading medical report.');
    } finally {
      setIsUploadingReport(false);
    }
  };

  const handleScan = async () => {
    if (!volunteerProfile.volunteerId) return setError('Complete volunteer registration before the eligibility scan.');
    setIsScanning(true); setError(null);
    try {
      const result = await triggerScan({ volunteer_id: volunteerProfile.volunteerId, volunteer_name: volunteerProfile.name });
      if (!result.success || !result.reading) throw new Error(result.error || 'Hardware scan failed.');
      setReading(result.reading);
    } catch (scanError) {
      setError(scanError instanceof Error ? scanError.message : 'Hardware scan failed.');
    } finally { setIsScanning(false); }
  };

  const handleContinue = async () => {
    if (!reading?.is_eligible) return;

    if (medicalReportPath && volunteerProfile.volunteerId) {
      await supabase
        .from('volunteers')
        .update({ medical_report_url: medicalReportPath })
        .eq('id', volunteerProfile.volunteerId);
    }

    onSaveStep2(
      [],
      {
        id: reading.id,
        title: 'ESP32 eligibility scan',
        timestamp: reading.recorded_at,
        deviceId: reading.device_id,
        readings: [],
        overallStatus: reading.status,
        summary: reading.flagged_reasons || 'Eligible for the next review step.',
        recommendation: 'Continue to daily habits.',
      },
      {
        medical_report_url: medicalReportPath || undefined,
        externalLabReportUploaded: Boolean(medicalReportPath),
        externalLabReportName: medicalReportName,
      }
    );
    onNavigate('volunteer-step3');
  };

  const steps: StepItem[] = [
    { number: 1, title: 'Personal Details', subtitle: 'ID & Verification' },
    { number: 2, title: 'Biomedical Scan', subtitle: 'ESP32 Vital Check' },
    { number: 3, title: 'Daily Habits', subtitle: 'Lifestyle Index' },
    { number: 4, title: 'Declaration', subtitle: 'Legal Consent' },
  ];

  return (
    <div id={id || 'volunteer-step2'} className="max-w-4xl mx-auto space-y-7">
      <StepperHeader
        steps={steps}
        currentStep={2}
        onStepClick={(s) => {
          if (s === 1) onNavigate('volunteer-step1');
          if (s === 3) onNavigate('volunteer-step3');
          if (s === 4) onNavigate('volunteer-step4');
        }}
      />

      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center mx-auto shadow-xs">
          <HeartPulse className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#0F1D3D]">
            Blood Donation Hardware Eligibility &amp; Clinical Scan
          </h3>
          <p className="text-sm text-gray-500 mt-1.5 max-w-lg mx-auto">
            Run the live ESP32 vital check and attach any recent medical or external lab reports for verified clinical records.
          </p>
        </div>
      </div>

      {/* Hardware Scan Section */}
      <div className="bg-white rounded-2xl border border-[#E5EAF3] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-base font-bold text-[#0F1D3D] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-600" /> Live ESP32 Vital Check
            </h4>
            <p className="text-xs text-gray-500 mt-0.5">
              Evaluates Heart Rate, SpO₂, Temperature, Weight, and Alcohol Level.
            </p>
          </div>
          <button
            onClick={() => void handleScan()}
            disabled={isScanning}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-xs transition cursor-pointer"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Scanning…</span>
              </>
            ) : (
              <>
                <span>Run Scan</span>
                <Cpu className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {reading && (
          <div
            className={`p-3.5 rounded-xl border text-xs sm:text-sm font-semibold flex items-center gap-2 ${
              reading.is_eligible
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-red-50 text-red-800 border-red-200'
            }`}
          >
            <CheckCircle2
              className={`w-4 h-4 shrink-0 ${reading.is_eligible ? 'text-emerald-600' : 'text-red-600'}`}
            />
            <span>
              {reading.is_eligible
                ? 'Eligible to proceed with blood donation.'
                : `Not eligible: ${reading.flagged_reasons || reading.status}`}
            </span>
          </div>
        )}

        {error && (
          <div className="p-3.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Medical Test Report / Lab Results Upload Card */}
      <div className="bg-white rounded-2xl border border-[#E5EAF3] p-6 shadow-sm space-y-4">
        <div>
          <h4 className="text-base font-bold text-[#0F1D3D] flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-purple-600" /> Medical Test Report / Lab Clearance (Optional)
          </h4>
          <p className="text-xs text-gray-500 mt-0.5">
            Attach official hemoglobin, CBC, or blood-borne pathogen test reports.
          </p>
        </div>

        {medicalReportPath ? (
          <div className="p-3.5 bg-[#F4F7FC] border border-dashed border-purple-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <FileCheck className="w-5 h-5 text-purple-600 shrink-0" />
              <div className="min-w-0">
                <span className="text-xs sm:text-sm text-gray-800 font-bold truncate block">
                  {medicalReportName || 'Medical_Test_Report.pdf'}
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Encrypted &amp; Uploaded
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setMedicalReportPath(null);
                setMedicalReportName('');
                setReportUploadSuccess(null);
              }}
              className="text-xs font-bold text-red-600 hover:underline shrink-0 ml-2"
            >
              Remove
            </button>
          </div>
        ) : (
          <label className="p-4 bg-[#F4F7FC] hover:bg-purple-50/50 border border-dashed border-[#E5EAF3] hover:border-purple-300 rounded-xl flex items-center justify-between cursor-pointer transition">
            <div className="flex items-center gap-2.5 min-w-0">
              <Upload className="w-5 h-5 text-purple-600 shrink-0" />
              <div>
                <span className="text-xs sm:text-sm text-gray-700 font-medium block">
                  {isUploadingReport ? 'Uploading Medical Report...' : 'Attach Lab Test Report (PDF, JPG, PNG)'}
                </span>
                <span className="text-[11px] text-gray-400">Stored in encrypted private bucket</span>
              </div>
            </div>
            <span className="text-xs font-bold text-purple-700 bg-purple-100 px-3 py-1.5 rounded-lg shrink-0 ml-2">
              {isUploadingReport ? 'Uploading...' : 'Browse Report'}
            </span>
            <input
              type="file"
              className="hidden"
              disabled={isUploadingReport}
              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleMedicalReportSelect}
            />
          </label>
        )}

        {reportUploadSuccess && (
          <p className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {reportUploadSuccess}
          </p>
        )}

        {reportUploadError && (
          <p className="text-xs font-bold text-red-600 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-red-600" />
            {reportUploadError}
          </p>
        )}
      </div>

      {/* Navigation Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          onClick={() => onNavigate('volunteer-step1')}
          className="px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold transition"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!reading?.is_eligible}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-sm font-bold inline-flex items-center gap-2 shadow-sm transition"
        >
          <span>Continue to Daily Habits</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
