import React, { useState } from 'react';
import {
  Pill,
  Clock,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Calendar,
  Sparkles,
  CheckCircle2,
  Bell,
  Utensils,
  Edit3,
} from 'lucide-react';
import { MedicationItem, RouteKey } from '../../types';
import { StepperHeader, StepItem } from '../common/StepperHeader';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { CustomTimePicker, to24Hour, to12Hour } from '../common/CustomTimePicker';
import { addMedication, addMedicationSchedule } from '../../services/medicationService';

interface MediReminderStep2Props {
  medications: MedicationItem[];
  onSaveMedications: (items: MedicationItem[]) => void;
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const MediReminderStep2: React.FC<MediReminderStep2Props> = ({
  medications,
  onSaveMedications,
  onNavigate,
  id,
}) => {
  const [items, setItems] = useState<MedicationItem[]>(medications);
  const [frequencyPreset, setFrequencyPreset] = useState<'once' | 'twice' | 'three' | 'four'>('twice');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    timeOfDay: '08:00 AM',
    mealRelation: 'after' as 'before' | 'after' | 'with',
    repeatDaily: true,
    startDate: new Date().toISOString().split('T')[0],
    isOngoing: true,
    category: 'General',
  });

  const steps: StepItem[] = [
    { number: 1, title: 'Basic Information', subtitle: 'Personal & Clinical Profile' },
    { number: 2, title: 'Medication Schedule', subtitle: 'Frequency & Timings' },
    { number: 3, title: 'Dashboard', subtitle: 'Adherence & Analytics' },
  ];

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMed.name.trim()) return;

    const created: MedicationItem = {
      id: 'med-' + Date.now(),
      name: newMed.name.trim(),
      dosage: newMed.dosage || '1 tablet',
      timeOfDay: newMed.timeOfDay || '08:00 AM',
      mealRelation: newMed.mealRelation,
      repeatDaily: newMed.repeatDaily,
      startDate: newMed.startDate,
      isOngoing: newMed.isOngoing,
      takenToday: false,
      category: newMed.category || 'Prescription',
    };

    const updated = [...items, created];
    setItems(updated);
    setNewMed({
      name: '',
      dosage: '',
      timeOfDay: '12:30 PM',
      mealRelation: 'after',
      repeatDaily: true,
      startDate: new Date().toISOString().split('T')[0],
      isOngoing: true,
      category: 'General',
    });
  };

  const handleUpdateItemTime = (idToUpdate: string, newTime12: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === idToUpdate ? { ...item, timeOfDay: newTime12 } : item))
    );
  };

  const handleDeleteItem = (idToDelete: string) => {
    setItems(items.filter((i) => i.id !== idToDelete));
  };

  const handleApplyPreset = (preset: 'once' | 'twice' | 'three' | 'four') => {
    setFrequencyPreset(preset);
  };

  const handleFinish = async () => {
    if (items.length === 0) {
      setSaveError('Add at least one medication before continuing.');
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    try {
      const timesPerDay = { once: 1, twice: 2, three: 3, four: 4 }[frequencyPreset];
      for (const item of items) {
        const medicationResult = await addMedication(item.name, item.dosage, timesPerDay);
        if (!medicationResult.success || !medicationResult.medication) {
          throw new Error(medicationResult.message || `Could not save ${item.name}.`);
        }

        const scheduleResult = await addMedicationSchedule(medicationResult.medication.id, [to24Hour(item.timeOfDay)]);
        if (!scheduleResult.success) {
          throw new Error(scheduleResult.message || `Could not save the schedule for ${item.name}.`);
        }
      }
      onSaveMedications(items);
      onNavigate('medi-reminder-dashboard');
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Could not save your medication schedule.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id={id || 'medi-reminder-step2'} className="max-w-6xl mx-auto space-y-7">
      <StepperHeader
        steps={steps}
        currentStep={2}
        onStepClick={(s) => {
          if (s === 1) onNavigate('medi-reminder-step1');
          if (s === 3) onNavigate('medi-reminder-dashboard');
        }}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Left Column: Schedule Builder & Medication List */}
        <div className="lg:col-span-8 space-y-7">
          {/* Frequency Preset Strip */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-[#0F1D3D] flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#2563EB]" /> Daily Intake Frequency Template
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Select your primary prescription dosage frequency for rapid slot configuration.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
              {[
                { id: 'once', label: 'Once Daily', times: '08:00 AM (Morning)' },
                { id: 'twice', label: 'Twice Daily', times: '08:00 AM / 08:00 PM' },
                { id: 'three', label: '3x Daily', times: 'Morning / Lunch / Dinner' },
                { id: 'four', label: '4x+ / Custom', times: 'Q4H / Q6H Spaced' },
              ].map((p) => {
                const isSelected = frequencyPreset === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => handleApplyPreset(p.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? 'bg-[#EFF4FF] border-[#2563EB] ring-2 ring-[#2563EB]/20 text-[#0F1D3D]'
                        : 'bg-[#F4F7FC] border-[#E5EAF3] hover:bg-gray-100/70 text-gray-700'
                    }`}
                  >
                    <p className="text-sm font-bold">{p.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{p.times}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Current Medication Schedule Table */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0F1D3D]">
                  Active Prescriptions ({items.length})
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Review and customize exact timings and meal coordination for each medication.
                </p>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm border-collapse">
                <thead className="bg-[#F4F7FC] text-[#0F1D3D] font-bold border-b border-[#E5EAF3]">
                  <tr>
                    <th className="py-3.5 px-4 font-bold text-sm">Target Time</th>
                    <th className="py-3.5 px-4 font-bold text-sm">Medication & Dosage</th>
                    <th className="py-3.5 px-4 font-bold text-sm">Meal Relation</th>
                    <th className="py-3.5 px-4 font-bold text-sm">Frequency</th>
                    <th className="py-3.5 px-4 font-bold text-sm">Start Date</th>
                    <th className="py-3.5 px-4 text-right font-bold text-sm">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-blue-50/20 transition-colors">
                      <td className="py-4 px-4 whitespace-nowrap">
                        {/* Interactive Custom Time Picker for Existing Items */}
                        <div className="flex items-center gap-2.5">
                          <input
                            type="time"
                            aria-label={`Target time for ${item.name}`}
                            value={to24Hour(item.timeOfDay)}
                            onChange={(e) => {
                              if (e.target.value) {
                                handleUpdateItemTime(item.id, to12Hour(e.target.value));
                              }
                            }}
                            className="bg-[#EFF4FF] border border-blue-200 text-[#2563EB] font-bold text-sm rounded-xl px-2.5 py-1.5 focus:ring-2 focus:ring-blue-400 focus:outline-none cursor-pointer"
                            title="Click to edit custom time"
                          />
                          <span className="font-mono text-sm font-extrabold text-[#0F1D3D] bg-gray-50 border border-gray-200 px-2.5 py-1.5 rounded-lg">
                            {item.timeOfDay}
                          </span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="font-bold text-[#0F1D3D] text-sm sm:text-base">{item.name}</p>
                        <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{item.dosage}</p>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-full capitalize">
                          <Utensils className="w-3.5 h-3.5" />
                          {item.mealRelation} Meal
                        </span>
                      </td>
                      <td className="py-4 px-4 text-gray-700 font-medium text-sm">
                        {item.repeatDaily ? 'Daily' : 'Specific Days'}
                      </td>
                      <td className="py-4 px-4 text-gray-600 font-mono text-xs sm:text-sm">
                        {item.startDate}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                          title="Delete medication"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {items.length === 0 && (
                <div className="text-center py-10 text-sm text-gray-500">
                  No medications scheduled yet. Add your first medication below.
                </div>
              )}
            </div>

            {/* Inline Add Another Medication Card with Custom Time Picker */}
            <form onSubmit={handleAddItem} className="mt-6 pt-5 border-t border-gray-100 bg-[#F4F7FC]/70 rounded-2xl p-5 sm:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-base sm:text-lg font-bold text-[#0F1D3D] flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#2563EB]" /> Add Another Medication
                </h4>
                <span className="text-xs sm:text-sm text-gray-500 font-medium">
                  Custom hour & minute precision with quick meal presets
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                <div className="sm:col-span-5">
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Medication Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lisinopril, Metformin"
                    value={newMed.name}
                    onChange={(e) => setNewMed({ ...newMed, name: e.target.value })}
                    className="w-full bg-white border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  />
                </div>

                <div className="sm:col-span-3">
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">Dosage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 10mg, 1 tablet"
                    value={newMed.dosage}
                    onChange={(e) => setNewMed({ ...newMed, dosage: e.target.value })}
                    className="w-full bg-white border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  />
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-sm font-bold text-gray-800 mb-1.5">
                    Meal Relation
                  </label>
                  <select
                    value={newMed.mealRelation}
                    onChange={(e) => setNewMed({ ...newMed, mealRelation: e.target.value as any })}
                    className="w-full bg-white border border-[#E5EAF3] text-sm sm:text-base rounded-xl px-3.5 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30"
                  >
                    <option value="after">After Meal (Postprandial)</option>
                    <option value="before">Before Meal (Empty Stomach)</option>
                    <option value="with">With Food / During Meal</option>
                  </select>
                </div>

                {/* Custom Time Picker Component with Quick-Select Shortcuts */}
                <div className="sm:col-span-12 bg-white p-4 sm:p-5 rounded-2xl border border-[#E5EAF3]">
                  <label className="block text-sm font-bold text-gray-800 mb-2">
                    Target Time (Custom Hour & Minute)
                  </label>
                  <CustomTimePicker
                    id="new-med-custom-time"
                    value={newMed.timeOfDay}
                    onChange={(formattedTime) => setNewMed({ ...newMed, timeOfDay: formattedTime })}
                    showQuickPresets={true}
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-sm sm:text-base font-bold flex items-center gap-2 transition shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert Schedule Item</span>
                </button>
              </div>
            </form>
          </div>

          {/* Navigation Controls */}
          {saveError && <p className="text-sm font-semibold text-red-600">{saveError}</p>}
          <div className="flex items-center justify-between pt-3">
            <button
              type="button"
              onClick={() => onNavigate('medi-reminder-step1')}
              className="px-6 py-3 bg-white border border-[#E5EAF3] hover:bg-gray-50 text-gray-700 text-sm font-bold rounded-xl flex items-center gap-2 transition"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              <span>Back to Step 1</span>
            </button>

            <button
              type="button"
              onClick={handleFinish}
              disabled={isSaving}
              className="px-7 py-3.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-60 text-white font-bold text-base rounded-xl shadow-md flex items-center gap-2.5 transition active:scale-98"
            >
              <span>{isSaving ? 'Saving…' : 'Save & Launch Dashboard'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Right Column: Live Schedule Preview */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-[#0F1D3D]">Live Reminder Preview</h4>
                  <p className="text-xs text-gray-500">Chronological Timeline</p>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {items.length} Active
              </span>
            </div>

            {items.length > 0 ? (
              <div className="mt-5 space-y-3.5">
                {items.map((m, idx) => (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-2xl bg-[#F4F7FC] border border-[#E5EAF3] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-xl bg-white text-[#2563EB] border border-blue-100 font-mono text-xs font-bold flex items-center justify-center shrink-0">
                        0{idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#0F1D3D] truncate">{m.name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {m.dosage} • {m.mealRelation} meal
                        </p>
                      </div>
                    </div>
                    <span className="font-mono text-sm font-bold text-[#2563EB] shrink-0">
                      {m.timeOfDay}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-5 py-9 px-4 text-center space-y-2 bg-[#F4F7FC]/60 rounded-2xl border border-dashed border-[#E5EAF3]">
                <Pill className="w-7 h-7 text-gray-400 mx-auto" />
                <p className="text-sm font-bold text-[#0F1D3D]">No Reminders Scheduled</p>
                <p className="text-xs text-gray-500">
                  Add prescriptions using the form on the left to generate your interactive timeline.
                </p>
              </div>
            )}

            <div className="mt-6 p-4 bg-emerald-50 rounded-2xl border border-emerald-200 text-emerald-950">
              <p className="text-sm font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
                <span>Smart Pillbox Sync Ready</span>
              </p>
              <p className="text-xs sm:text-sm text-emerald-800 mt-1.5 leading-relaxed">
                Timings automatically broadcast to your connected hardware dispenser or smartphone.
              </p>
            </div>
          </div>
        </div>
      </div>

      <ReassuranceBar />
    </div>
  );
};
