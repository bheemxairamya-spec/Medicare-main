import React from 'react';
import {
  Pill,
  CheckCircle2,
  Clock,
  Plus,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Bell,
  Utensils,
  ChevronRight,
  HeartPulse,
  Trash2,
} from 'lucide-react';
import { MedicationItem, MedicationProfile, RouteKey } from '../../types';
import { StatusPill } from '../common/StatusPill';
import { ProgressRing } from '../common/ProgressRing';
import { InfoCard } from '../common/InfoCard';
import { ReassuranceBar } from '../common/ReassuranceBar';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';
import {
  deleteMedication,
  getMyMedications,
  markDoseTaken,
  type MedicationRecord,
} from '../../services/medicationService';

type DashboardMedication = MedicationItem & { medicationId: string; scheduleId?: string };

interface MediReminderDashboardProps {
  medications: MedicationItem[];
  profile: MedicationProfile;
  onToggleTaken: (id: string) => void;
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const MediReminderDashboard: React.FC<MediReminderDashboardProps> = ({
  medications,
  profile,
  onToggleTaken,
  onNavigate,
  id,
}) => {
  const [databaseMedications, setDatabaseMedications] = React.useState<MedicationRecord[] | null>(null);
  const [databaseError, setDatabaseError] = React.useState<string | null>(null);

  const refreshMedications = async () => {
    const result = await getMyMedications();
    if (!result.success) {
      setDatabaseError(result.message || 'Could not load medications.');
      return;
    }
    setDatabaseError(null);
    setDatabaseMedications(result.medications);
  };

  React.useEffect(() => {
    void refreshMedications();
  }, []);

  const displayedMedications: DashboardMedication[] = databaseMedications === null
    ? medications.map((medication) => ({ ...medication, medicationId: medication.id }))
    : databaseMedications.flatMap((medication) =>
        medication.medication_schedule.length > 0
          ? medication.medication_schedule.map((schedule) => ({
              id: schedule.id,
              medicationId: medication.id,
              scheduleId: schedule.id,
              name: medication.med_name,
              dosage: medication.dosage,
              timeOfDay: schedule.reminder_time,
              mealRelation: 'after',
              repeatDaily: true,
              startDate: medication.created_at.slice(0, 10),
              isOngoing: true,
              takenToday: Boolean(schedule.taken_status && schedule.taken_date === new Date().toISOString().split('T')[0]),
              category: 'Prescription',
            }))
          : [{
              id: medication.id,
              medicationId: medication.id,
              name: medication.med_name,
              dosage: medication.dosage,
              timeOfDay: '--:--',
              mealRelation: 'after',
              repeatDaily: true,
              startDate: medication.created_at.slice(0, 10),
              isOngoing: true,
              takenToday: false,
              category: 'Prescription',
            }]
      );

  const handleDoseTaken = async (item: DashboardMedication) => {
    if (!item.scheduleId) return onToggleTaken(item.id);
    const result = await markDoseTaken(item.scheduleId, !item.takenToday);
    if (!result.success) return setDatabaseError(result.message || 'Could not update this dose.');
    await refreshMedications();
  };

  const handleDeleteMedication = async (medicationId: string) => {
    const result = await deleteMedication(medicationId);
    if (!result.success) return setDatabaseError(result.message || 'Could not delete this medication.');
    await refreshMedications();
  };

  const takenCount = displayedMedications.filter((m) => m.takenToday).length;
  const totalCount = displayedMedications.length;
  const progressPercent = totalCount > 0 ? (takenCount / totalCount) * 100 : 0;
  const pendingMed = displayedMedications.find((m) => !m.takenToday);

  const weeklyAdherenceData = [
    { day: 'Mon', rate: totalCount > 0 ? 0 : 0 },
    { day: 'Tue', rate: totalCount > 0 ? 0 : 0 },
    { day: 'Wed', rate: totalCount > 0 ? 0 : 0 },
    { day: 'Thu', rate: totalCount > 0 ? 0 : 0 },
    { day: 'Fri', rate: totalCount > 0 ? 0 : 0 },
    { day: 'Sat', rate: totalCount > 0 ? 0 : 0 },
    { day: 'Sun (Today)', rate: Math.round(progressPercent) },
  ];

  return (
    <div id={id || 'medi-reminder-dashboard'} className="max-w-7xl mx-auto space-y-7">
      {/* Top Welcome / Header Banner */}
      <div className="bg-gradient-to-r from-[#0F1D3D] via-[#1E3A8A] to-[#2563EB] rounded-3xl p-7 sm:p-9 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-full bg-white/5 skew-x-12 pointer-events-none" />

        <div className="space-y-2.5 relative z-10">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="text-xs sm:text-sm font-bold text-blue-200 bg-white/10 px-3 py-1 rounded-full border border-white/15">
              Personal Regimen
            </span>
            {totalCount > 0 ? (
              <StatusPill
                variant={progressPercent === 100 ? 'pass' : 'info'}
                label={progressPercent === 100 ? 'All Completed' : `${takenCount}/${totalCount} Doses Taken`}
              />
            ) : (
              <span className="text-xs sm:text-sm font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full border border-white/15">
                0 Active Medications
              </span>
            )}
          </div>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight">
            {profile.name ? `Good Morning, ${profile.name}` : 'Medication Reminders'}
          </h2>
          <p className="text-sm sm:text-base text-blue-100/90 max-w-xl leading-relaxed">
            {totalCount > 0
              ? `You have ${totalCount - takenCount} pending medication reminders scheduled for today. Regular timing maximizes pharmacological efficacy.`
              : 'No medication reminders scheduled yet. Add your daily prescriptions to automate reminders and compliance tracking.'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 relative z-10">
          <button
            onClick={() => onNavigate(totalCount > 0 ? 'medi-reminder-step2' : 'medi-reminder-step1')}
            className="px-5 py-3 bg-white text-[#0F1D3D] hover:bg-gray-100 font-bold text-sm sm:text-base rounded-xl shadow-sm flex items-center gap-2 transition"
          >
            <Plus className="w-4.5 h-4.5 text-[#2563EB]" />
            <span>{totalCount > 0 ? 'Edit Schedule' : 'Add Medication'}</span>
          </button>
          <button
            onClick={() => onNavigate('medi-reminder-step1')}
            className="px-5 py-3 bg-blue-600/40 hover:bg-blue-600/60 border border-blue-300/30 text-white font-semibold text-sm sm:text-base rounded-xl transition"
          >
            Clinical Profile
          </button>
        </div>
      </div>

      {databaseError && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {databaseError}
        </div>
      )}

      {/* 4 Stat & Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Today's Adherence Ring */}
        <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">
              Today's Adherence
            </span>
            <p className="text-2xl sm:text-3xl font-extrabold text-[#0F1D3D] mt-1.5">
              {takenCount} of {totalCount}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              {totalCount > 0 ? 'Doses confirmed taken' : 'No medications active'}
            </p>
          </div>
          <ProgressRing
            percentage={progressPercent}
            size={80}
            strokeWidth={8}
            color={progressPercent === 100 && totalCount > 0 ? '#16A34A' : '#2563EB'}
          />
        </div>

        {/* Card 2: Next Dose Alarm */}
        <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Next Dose Due
            </span>
            {pendingMed && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                Scheduled
              </span>
            )}
          </div>
          <p className="text-base sm:text-lg font-bold text-[#0F1D3D] mt-2.5 truncate">
            {pendingMed ? pendingMed.name : totalCount > 0 ? 'All doses complete!' : 'None scheduled'}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-500 font-mono">
            <Clock className="w-4 h-4 text-[#2563EB]" />
            <span className="font-semibold">{pendingMed ? pendingMed.timeOfDay : '--:-- --'}</span>
          </div>
        </div>

        {/* Card 3: Upcoming Appointment */}
        <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Consultation
            </span>
            <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2.5 py-0.5 rounded-md">
              Telehealth
            </span>
          </div>
          <p className="text-base sm:text-lg font-bold text-[#0F1D3D] mt-2.5 truncate">
            {profile.doctorOrHospital || 'No Doctor Linked'}
          </p>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="w-4 h-4 text-purple-600" />
            <span>{profile.doctorOrHospital ? 'Linked in Profile' : 'Not linked'}</span>
          </div>
        </div>

        {/* Card 4: Clinical Health Tip */}
        <div className="bg-gradient-to-br from-emerald-50 to-white rounded-3xl border border-emerald-200/80 p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-bold text-emerald-900">Health Tip</span>
          </div>
          <p className="text-xs sm:text-sm text-emerald-950 mt-2 leading-relaxed">
            Take oral medications with a full glass of water unless specifically directed otherwise by your pharmacist.
          </p>
        </div>
      </div>

      {/* Main Grid: Today's Schedule Timeline & Adherence History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Today's Schedule Timeline with Mark as Taken */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100">
            <div>
              <h3 className="text-lg sm:text-xl font-bold text-[#0F1D3D] flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#2563EB]" /> Today's Scheduled Doses
              </h3>
              <p className="text-sm sm:text-base text-gray-500 mt-1">
                Click "Mark as Taken" as you take each medication to update your clinical compliance
                index.
              </p>
            </div>
            {totalCount > 0 && (
              <button
                onClick={() => onNavigate('medi-reminder-step2')}
                className="text-sm font-bold text-[#2563EB] hover:underline flex items-center gap-1"
              >
                <span>Manage List</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {totalCount > 0 ? (
            <div className="space-y-4">
              {displayedMedications.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    item.takenToday
                      ? 'bg-emerald-50/40 border-emerald-200/70'
                      : 'bg-[#F4F7FC]/70 border-[#E5EAF3] hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold shrink-0 mt-0.5 ${
                        item.takenToday
                          ? 'bg-[#16A34A] text-white shadow-xs'
                          : 'bg-[#EFF4FF] text-[#2563EB] border border-blue-200'
                      }`}
                    >
                      {item.takenToday ? (
                        <CheckCircle2 className="w-6 h-6" />
                      ) : (
                        <Pill className="w-6 h-6" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4
                          className={`text-base sm:text-[17px] font-bold ${
                            item.takenToday ? 'text-emerald-950 line-through' : 'text-[#0F1D3D]'
                          }`}
                        >
                          {item.name}
                        </h4>
                        <span className="text-xs sm:text-sm font-semibold text-gray-600 bg-white px-2.5 py-0.5 rounded-md border border-gray-200">
                          {item.dosage}
                        </span>
                        <span className="text-xs font-semibold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200 flex items-center gap-1">
                          <Utensils className="w-3 h-3" /> {item.mealRelation} meal
                        </span>
                      </div>

                      <p className="text-xs sm:text-sm text-gray-500 mt-1.5 flex items-center gap-2.5">
                        <span className="font-mono font-bold text-[#2563EB] flex items-center gap-1.5 text-sm">
                          <Clock className="w-3.5 h-3.5" /> {item.timeOfDay}
                        </span>
                        {item.notes && <span>• {item.notes}</span>}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={() => void handleDoseTaken(item)}
                      className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 shadow-2xs ${
                        item.takenToday
                          ? 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                          : 'bg-[#2563EB] hover:bg-blue-700 text-white shadow-xs'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{item.takenToday ? 'Completed (Undo)' : 'Mark as Taken'}</span>
                    </button>
                    <button
                      onClick={() => void handleDeleteMedication(item.medicationId)}
                      className="p-2.5 text-gray-500 hover:bg-red-50 hover:text-red-600 rounded-xl transition"
                      title={`Delete ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-14 px-5 text-center rounded-2xl bg-[#F4F7FC]/70 border border-dashed border-[#CBD5E1] space-y-4">
              <Pill className="w-12 h-12 text-gray-400 mx-auto" />
              <div>
                <h4 className="text-lg font-bold text-[#0F1D3D]">No medications added yet</h4>
                <p className="text-sm sm:text-base text-gray-500 max-w-sm mx-auto mt-1 leading-relaxed">
                  Create your first medication reminder to receive daily scheduled notifications and keep track of your doses.
                </p>
              </div>
              <button
                onClick={() => onNavigate('medi-reminder-step1')}
                className="inline-flex items-center gap-2 px-5 py-3 bg-[#2563EB] hover:bg-blue-700 text-white text-sm sm:text-base font-bold rounded-xl transition shadow-xs"
              >
                <Plus className="w-4.5 h-4.5" />
                <span>Set Up First Reminder</span>
              </button>
            </div>
          )}

          {/* Quick Actions Strip */}
          <div className="pt-5 border-t border-gray-100">
            <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">
              Quick Actions
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <button
                onClick={() => onNavigate('medi-reminder-step2')}
                className="p-4 bg-[#F4F7FC] hover:bg-blue-50 border border-[#E5EAF3] hover:border-blue-300 rounded-2xl text-left transition"
              >
                <Pill className="w-5 h-5 text-[#2563EB] mb-1.5" />
                <p className="text-sm font-bold text-[#0F1D3D]">Add Medication</p>
                <p className="text-xs text-gray-500 mt-0.5">Insert new schedule</p>
              </button>

              <button
                onClick={() => onNavigate('appointments')}
                className="p-4 bg-[#F4F7FC] hover:bg-blue-50 border border-[#E5EAF3] hover:border-blue-300 rounded-2xl text-left transition"
              >
                <Calendar className="w-5 h-5 text-purple-600 mb-1.5" />
                <p className="text-sm font-bold text-[#0F1D3D]">Book Doctor</p>
                <p className="text-xs text-gray-500 mt-0.5">Appointment sync</p>
              </button>

              <button
                onClick={() => alert('Pharmacy refill request service ready.')}
                className="p-4 bg-[#F4F7FC] hover:bg-blue-50 border border-[#E5EAF3] hover:border-blue-300 rounded-2xl text-left transition"
              >
                <RefreshCw className="w-5 h-5 text-emerald-600 mb-1.5" />
                <p className="text-sm font-bold text-[#0F1D3D]">Pharmacy Refill</p>
                <p className="text-xs text-gray-500 mt-0.5">1-click order</p>
              </button>

              <button
                onClick={() => alert('Exporting monthly medication compliance report in PDF format.')}
                className="p-4 bg-[#F4F7FC] hover:bg-blue-50 border border-[#E5EAF3] hover:border-blue-300 rounded-2xl text-left transition"
              >
                <ShieldCheck className="w-5 h-5 text-indigo-600 mb-1.5" />
                <p className="text-sm font-bold text-[#0F1D3D]">Export Dossier</p>
                <p className="text-xs text-gray-500 mt-0.5">Doctor PDF summary</p>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Weekly Adherence Chart & Reliability */}
        <div className="lg:col-span-4 space-y-6">
          {/* Adherence Chart */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-3.5 border-b border-gray-100">
              <div>
                <h4 className="text-sm sm:text-base font-bold text-[#0F1D3D]">7-Day Adherence Rate</h4>
                <p className="text-xs text-gray-400 mt-0.5">Compliance Benchmark</p>
              </div>
              <span className="text-xs sm:text-sm font-extrabold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                {totalCount > 0 ? `${Math.round(progressPercent)}% Today` : '0%'}
              </span>
            </div>

            {totalCount > 0 ? (
              <div className="h-48 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyAdherenceData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6B7280' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#6B7280' }} domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F1D3D',
                        borderColor: '#1E3A8A',
                        color: '#fff',
                        borderRadius: '8px',
                        fontSize: '13px',
                      }}
                      formatter={(val: any) => [`${val}% Adherence`, 'Taken']}
                    />
                    <Bar dataKey="rate" radius={[4, 4, 0, 0]}>
                      {weeklyAdherenceData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.rate >= 90 ? '#2563EB' : entry.rate >= 70 ? '#60A5FA' : '#CBD5E1'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="py-9 text-center text-sm text-gray-500">
                <p className="font-bold text-gray-700">No adherence history</p>
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                  Adherence tracking begins once you confirm your scheduled doses.
                </p>
              </div>
            )}

            <p className="text-xs text-gray-500 mt-3 text-center">
              Target adherence threshold is 85%+ for optimal therapeutic efficacy.
            </p>
          </div>

          {/* Connected Channels Pill */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 shadow-sm space-y-3.5">
            <h4 className="text-sm sm:text-base font-bold text-[#0F1D3D]">Active Alert Channels</h4>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700 font-medium">Push Notifications</span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                  Enabled
                </span>
              </div>
              <div className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700 font-medium">Direct SMS Gateway</span>
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md">
                  {profile.mobile || 'Not set'}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm p-2.5 rounded-xl bg-gray-50">
                <span className="text-gray-700 font-medium">Caregiver Contact</span>
                <span className="text-xs font-semibold text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-md">
                  {profile.emergencyContact || 'Not set'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ReassuranceBar />
    </div>
  );
};
