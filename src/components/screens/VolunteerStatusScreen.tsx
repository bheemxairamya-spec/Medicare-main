import React, { useState } from 'react';
import {
  HeartHandshake,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Cpu,
  RefreshCw,
  PhoneCall,
  UserCheck,
  ChevronRight,
  Sparkles,
  FileText,
  ExternalLink,
  Loader2,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { BloodRequest, RouteKey, VolunteerProfile } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { ProgressRing } from '../common/ProgressRing';
import { ToggleSwitch } from '../common/ToggleSwitch';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { getMyVolunteerStatus } from '../../services/volunteerService';
import { getSignedUrl } from '../../services/storageService';

interface VolunteerStatusScreenProps {
  volunteerProfile: VolunteerProfile;
  bloodRequests: BloodRequest[];
  onToggleInspection: () => void;
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const VolunteerStatusScreen: React.FC<VolunteerStatusScreenProps> = ({
  volunteerProfile,
  bloodRequests,
  onToggleInspection,
  onNavigate,
  id,
}) => {
  const [storedVolunteer, setStoredVolunteer] = useState<any>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [openingIdProof, setOpeningIdProof] = useState(false);
  const [openingMedicalReport, setOpeningMedicalReport] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);

  React.useEffect(() => {
    void getMyVolunteerStatus().then((result) => {
      if (!result.success) setStatusError(result.message || 'Could not load volunteer status.');
      else setStoredVolunteer(result.volunteer);
    });
  }, []);
  const [isAvailable, setIsAvailable] = useState(volunteerProfile.availabilityToggle ?? true);

  const idProofPath = storedVolunteer?.id_proof_url || volunteerProfile.id_proof_url;
  const medicalReportPath = storedVolunteer?.medical_report_url || volunteerProfile.medical_report_url;

  const handleViewIdProof = async () => {
    if (!idProofPath) return;
    setOpeningIdProof(true);
    setDocumentError(null);
    try {
      const res = await getSignedUrl('id-proofs', idProofPath);
      if (res.success && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        setDocumentError('Could not generate secure link for ID Proof.');
      }
    } catch {
      setDocumentError('Failed to access ID Proof.');
    } finally {
      setOpeningIdProof(false);
    }
  };

  const handleViewMedicalReport = async () => {
    if (!medicalReportPath) return;
    setOpeningMedicalReport(true);
    setDocumentError(null);
    try {
      const res = await getSignedUrl('medical-reports', medicalReportPath);
      if (res.success && res.url) {
        window.open(res.url, '_blank', 'noopener,noreferrer');
      } else {
        setDocumentError('Could not generate secure link for Medical Report.');
      }
    } catch {
      setDocumentError('Failed to access Medical Report.');
    } finally {
      setOpeningMedicalReport(false);
    }
  };

  const statusVariant = volunteerProfile.inPersonInspected
    ? 'verified'
    : 'pending';

  const isRegistered = Boolean(storedVolunteer || volunteerProfile.name);
  const displayName = storedVolunteer?.name || volunteerProfile.name;
  const displayBloodGroup = storedVolunteer?.blood_group || volunteerProfile.bloodGroup;
  const displayStatus = storedVolunteer?.status || (volunteerProfile.inPersonInspected ? 'approved' : 'pending');

  return (
    <div id={id || 'volunteer-status-screen'} className="max-w-7xl mx-auto space-y-7">
      {statusError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{statusError}</div>}
      {/* Unregistered Alert Banner if empty */}
      {!isRegistered && (
        <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-[#0F1D3D] rounded-3xl p-7 text-white shadow-md flex flex-col sm:flex-row items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center text-purple-300 shrink-0">
              <HeartHandshake className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-bold">Blood Donor Profile Not Registered Yet</h3>
              <p className="text-sm text-purple-200 mt-1">
                Complete your biomedical hardware telemetry check and verification to join the active donor corps.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('volunteer-step1')}
            className="px-6 py-3 bg-white text-purple-900 hover:bg-purple-50 font-bold text-sm rounded-xl shrink-0 shadow-sm transition"
          >
            Start Registration →
          </button>
        </div>
      )}

      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-9 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-5">
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-3xl flex items-center justify-center shadow-md shrink-0">
              {displayName ? displayName.charAt(0).toUpperCase() : '?'}
            </div>

            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0F1D3D]">
                  {displayName || 'New Blood Donor Candidate'}
                </h2>
                {displayBloodGroup && (
                  <div className="w-9 h-9 rounded-xl bg-red-600 text-white font-black text-sm flex items-center justify-center">
                    {displayBloodGroup}
                  </div>
                )}
                <StatusPill
                  variant={isRegistered ? statusVariant : 'neutral'}
                  label={
                    !isRegistered
                      ? 'Registration Incomplete'
                      : `Volunteer Status: ${displayStatus}`
                  }
                />
              </div>

              <p className="text-sm text-gray-500 mt-2 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 text-purple-600" />
                  {volunteerProfile.location || 'Location not set'}
                </span>
                <span>•</span>
                <span className="font-medium">Member Since: {volunteerProfile.memberSince || 'Just now'}</span>
                <span>•</span>
                <span className="text-purple-700 font-bold">
                  {volunteerProfile.totalDonations || 0} Lifesaving Donations
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            {/* Interactive Admin Simulation Toggle */}
            {isRegistered && (
              <button
                onClick={onToggleInspection}
                className="px-4 py-2.5 rounded-xl text-sm font-bold bg-[#EFF4FF] hover:bg-blue-100 text-[#2563EB] border border-blue-200 flex items-center gap-2 transition shadow-2xs"
                title="Demonstrate 2-stage verification: Digital Registration vs Physical Clinic Inspection"
              >
                <RefreshCw className="w-4 h-4" />
                <span>
                  {volunteerProfile.inPersonInspected ? 'Set to Pending Check' : 'Simulate Clinical Inspection'}
                </span>
              </button>
            )}

            <button
              onClick={() => onNavigate('volunteer-step1')}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm rounded-xl shadow-xs transition"
            >
              {isRegistered ? 'Update Registration' : 'Register as Blood Donor'}
            </button>
          </div>
        </div>

        {/* Status Chip Row */}
        <div className="mt-7 pt-6 border-t border-gray-100 flex items-center gap-3 overflow-x-auto pb-1 text-sm">
          <span className="text-gray-400 font-bold uppercase tracking-wider text-xs mr-1 shrink-0">
            Registration Pipeline:
          </span>
          <span className={`px-3.5 py-1.5 font-bold text-xs sm:text-sm rounded-xl border flex items-center gap-1.5 shrink-0 ${
            isRegistered ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            <CheckCircle2 className={`w-4 h-4 ${isRegistered ? 'text-emerald-600' : 'text-gray-400'}`} /> 1. Digital Submission
          </span>
          <span className={`px-3.5 py-1.5 font-bold text-xs sm:text-sm rounded-xl border flex items-center gap-1.5 shrink-0 ${
            volunteerProfile.habits ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            <CheckCircle2 className={`w-4 h-4 ${volunteerProfile.habits ? 'text-emerald-600' : 'text-gray-400'}`} /> 2. Daily Habits Index
          </span>
          <span className={`px-3.5 py-1.5 font-bold text-xs sm:text-sm rounded-xl border flex items-center gap-1.5 shrink-0 ${
            volunteerProfile.declaration?.consentGiven ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'
          }`}>
            <CheckCircle2 className={`w-4 h-4 ${volunteerProfile.declaration?.consentGiven ? 'text-emerald-600' : 'text-gray-400'}`} /> 3. Legal Declaration
          </span>
          <span
            className={`px-3.5 py-1.5 font-bold text-xs sm:text-sm rounded-xl border flex items-center gap-1.5 shrink-0 ${
              volunteerProfile.inPersonInspected
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : isRegistered
                ? 'bg-amber-50 text-amber-800 border-amber-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
          >
            {volunteerProfile.inPersonInspected ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <Clock className="w-4 h-4 text-amber-600" />
            )}
            4. Clinical In-Person Check
          </span>
        </div>
      </div>

      {/* Main Grid: Status Cards & Live Donation Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Volunteer Stats & Verification Details */}
        <div className="lg:col-span-8 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Card 1: Availability Switch */}
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 shadow-sm space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Emergency Availability</span>
                <span
                  className={`w-3 h-3 rounded-full ${
                    isAvailable ? 'bg-emerald-500 animate-ping' : 'bg-gray-300'
                  }`}
                />
              </div>
              <p className="text-xl font-bold text-[#0F1D3D]">
                {isAvailable ? 'On-Call Ready' : 'Paused / Offline'}
              </p>
              <ToggleSwitch
                checked={isAvailable}
                onChange={setIsAvailable}
                label="Dispatch Ready"
                sublabel="Accept emergency blood alerts"
              />
            </div>

            {/* Card 2: General Checkup Telemetry */}
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 shadow-sm space-y-2.5">
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">IoT Diagnostic Rig</span>
              <p className="text-xl font-bold text-[#0F1D3D] flex items-center gap-2">
                <Cpu className="w-5 h-5 text-purple-600" /> General Checkup
              </p>
              <button
                onClick={() => onNavigate('general-checkup')}
                className="text-xs sm:text-sm text-purple-600 font-bold hover:underline flex items-center gap-1"
              >
                <span>Open Hardware Scan</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Card 3: Profile Completion */}
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Dossier Status</span>
                <p className="text-2xl font-bold text-[#0F1D3D] mt-1">
                  {!isRegistered ? '0% Started' : volunteerProfile.inPersonInspected ? '100% Ready' : '85% Complete'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {!isRegistered ? 'Draft Profile' : volunteerProfile.inPersonInspected ? 'Full Access' : 'Awaiting Clinic'}
                </p>
              </div>
              <ProgressRing
                percentage={!isRegistered ? 0 : volunteerProfile.inPersonInspected ? 100 : 85}
                size={76}
                strokeWidth={8}
                color={!isRegistered ? '#D1D5DB' : volunteerProfile.inPersonInspected ? '#16A34A' : '#9333EA'}
              />
            </div>
          </div>

          {/* Schedule Window & Preferred Centers */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm space-y-4">
            <h3 className="text-lg font-bold text-[#0F1D3D]">
              Preferred Dispatch Schedule & Location
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="p-4 bg-[#F4F7FC] rounded-2xl border border-[#E5EAF3] space-y-1.5">
                <p className="font-bold text-gray-400 uppercase text-xs">Active Days</p>
                <p className="text-base font-bold text-[#0F1D3D]">
                  {volunteerProfile.availableDays && volunteerProfile.availableDays.length > 0
                    ? volunteerProfile.availableDays.join(', ')
                    : 'No days configured yet'}
                </p>
                <p className="text-sm text-gray-500">Available Window: {volunteerProfile.availableTime || 'Not set'}</p>
              </div>

              <div className="p-4 bg-[#F4F7FC] rounded-2xl border border-[#E5EAF3] space-y-1.5">
                <p className="font-bold text-gray-400 uppercase text-xs">Primary Partner Center</p>
                <p className="text-base font-bold text-[#0F1D3D]">
                  {volunteerProfile.preferredDonationLocation || 'No partner center selected'}
                </p>
                <p className="text-sm text-gray-500">Geo-fenced within 10 km radius</p>
              </div>
            </div>
          </div>

          {/* Uploaded Clinical & ID Documents Card */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#0F1D3D] flex items-center gap-2">
                  <FileCheck className="w-5 h-5 text-purple-600" />
                  Uploaded Verification &amp; Clinical Documents
                </h3>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  Secure documents stored in encrypted Supabase storage buckets.
                </p>
              </div>
            </div>

            {documentError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{documentError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              {/* ID Proof */}
              <div className="p-4 bg-[#F4F7FC] rounded-2xl border border-[#E5EAF3] flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-400 uppercase text-[11px]">Government ID Proof</span>
                    {idProofPath && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Attached
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#0F1D3D] truncate">
                    {idProofPath ? idProofPath.split('/').pop() || 'ID_Document.pdf' : 'No ID Proof Uploaded'}
                  </p>
                  <p className="text-xs text-gray-500">Private Bucket: id-proofs</p>
                </div>

                {idProofPath ? (
                  <button
                    type="button"
                    disabled={openingIdProof}
                    onClick={handleViewIdProof}
                    className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {openingIdProof ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Link…</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>View ID Proof</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('volunteer-step1')}
                    className="w-full py-2.5 px-3 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-600 text-xs font-bold rounded-xl border border-gray-200 transition"
                  >
                    Upload in Step 1 →
                  </button>
                )}
              </div>

              {/* Medical Test Report */}
              <div className="p-4 bg-[#F4F7FC] rounded-2xl border border-[#E5EAF3] flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-400 uppercase text-[11px]">Medical / Lab Report</span>
                    {medicalReportPath && (
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        Attached
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-[#0F1D3D] truncate">
                    {medicalReportPath ? medicalReportPath.split('/').pop() || 'Medical_Report.pdf' : 'No Lab Report Uploaded'}
                  </p>
                  <p className="text-xs text-gray-500">Private Bucket: medical-reports</p>
                </div>

                {medicalReportPath ? (
                  <button
                    type="button"
                    disabled={openingMedicalReport}
                    onClick={handleViewMedicalReport}
                    className="w-full py-2.5 px-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-2xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    {openingMedicalReport ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Generating Link…</span>
                      </>
                    ) : (
                      <>
                        <FileText className="w-3.5 h-3.5" />
                        <span>View Medical Report</span>
                        <ExternalLink className="w-3 h-3 ml-0.5" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onNavigate('volunteer-step2')}
                    className="w-full py-2.5 px-3 bg-gray-100 hover:bg-purple-50 hover:text-purple-700 text-gray-600 text-xs font-bold rounded-xl border border-gray-200 transition"
                  >
                    Upload in Step 2 →
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Upcoming Nearby Blood Requests */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0F1D3D]">Active Emergency Requests</h4>
                <p className="text-xs text-gray-400 mt-0.5">Hospital ICU Dispatches</p>
              </div>
              <span className="text-xs font-bold text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-200">
                Live Broadcast
              </span>
            </div>

            {bloodRequests.length > 0 ? (
              <div className="space-y-3.5">
                {bloodRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl border border-[#E5EAF3] bg-[#F4F7FC] hover:bg-blue-50/40 hover:border-blue-300 transition-colors space-y-2.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-red-700 bg-red-100 px-2.5 py-1 rounded-md">
                        {req.bloodGroup} • {req.unitsNeeded} Units
                      </span>
                      <span className="text-xs text-gray-400">{req.createdAt}</span>
                    </div>

                    <div>
                      <h5 className="text-sm sm:text-base font-bold text-[#0F1D3D]">{req.hospital}</h5>
                      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{req.location}</p>
                    </div>

                    <div className="pt-2.5 border-t border-gray-200/60 flex items-center justify-between text-xs">
                      <span className="text-amber-800 font-bold text-xs">
                        Required: {req.requiredByTime}
                      </span>
                      <button
                        onClick={() =>
                          alert(
                            `Response broadcast to ${req.hospital} dispatch coordinator. They will call your verified number shortly.`
                          )
                        }
                        className="px-3.5 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg shadow-2xs"
                      >
                        Accept Callout
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 px-4 text-center space-y-3 bg-[#F4F7FC]/60 rounded-2xl border border-dashed border-[#E5EAF3]">
                <HeartHandshake className="w-8 h-8 text-purple-400 mx-auto" />
                <p className="text-sm font-bold text-[#0F1D3D]">No Emergency Dispatches Active</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Hospital partner blood banks in your sector have not broadcast urgent shortage alerts right now.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <ReassuranceBar />
    </div>
  );
};
