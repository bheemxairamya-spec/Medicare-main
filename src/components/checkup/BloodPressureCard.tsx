import React, { useState } from 'react';
import {
  Activity,
  Plus,
  Heart,
  History,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { BloodPressureReading, BPStatus } from '../../types';

interface BloodPressureCardProps {
  readings: BloodPressureReading[];
  onAddReading: (reading: BloodPressureReading) => void;
  onDeleteReading?: (id: string) => void;
}

export const BloodPressureCard: React.FC<BloodPressureCardProps> = ({
  readings,
  onAddReading,
  onDeleteReading,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Form State
  const [systolic, setSystolic] = useState('118');
  const [diastolic, setDiastolic] = useState('78');
  const [pulse, setPulse] = useState('72');
  const [notes, setNotes] = useState('');

  const latestReading: BloodPressureReading | undefined = readings[0];

  const classifyBP = (sys: number, dia: number): BPStatus => {
    if (sys < 120 && dia < 80) return 'normal';
    if (sys <= 129 && dia < 80) return 'elevated';
    if ((sys >= 130 && sys <= 139) || (dia >= 80 && dia <= 89)) return 'stage1';
    return 'stage2';
  };

  const handleSaveReading = (e: React.FormEvent) => {
    e.preventDefault();
    const sys = parseInt(systolic);
    const dia = parseInt(diastolic);
    const p = pulse ? parseInt(pulse) : undefined;
    if (isNaN(sys) || isNaN(dia)) return;

    const status = classifyBP(sys, dia);
    const now = new Date();
    const newReading: BloodPressureReading = {
      id: `bp-${Date.now()}`,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      systolic: sys,
      diastolic: dia,
      pulse: p,
      status,
      notes: notes.trim() || undefined,
    };

    onAddReading(newReading);
    setIsModalOpen(false);
    setNotes('');
  };

  const getStatusBadge = (status: BPStatus) => {
    switch (status) {
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Normal (Optimal)
          </span>
        );
      case 'elevated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Elevated Systolic
          </span>
        );
      case 'stage1':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Stage 1 Range
          </span>
        );
      case 'stage2':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Stage 2 Range
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm space-y-5 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Hemodynamic Vital
              </span>
            </div>
            <h3 className="text-lg font-black text-[#0F1D3D]">Blood Pressure (BP)</h3>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs sm:text-sm font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Reading</span>
        </button>
      </div>

      {/* Main Metric Display */}
      {latestReading ? (
        <div className="p-5 bg-gradient-to-br from-[#EFF6FF] to-[#EBF3FE] rounded-2xl border border-blue-100 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-blue-900/80 bg-white/80 px-2.5 py-1 rounded-lg border border-blue-200/60">
              Systolic / Diastolic
            </span>
            {getStatusBadge(latestReading.status)}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black font-mono text-[#0F1D3D]">
              {latestReading.systolic}/{latestReading.diastolic}
            </span>
            <span className="text-base font-bold text-gray-500">mmHg</span>
            {latestReading.pulse && (
              <span className="text-xs font-bold text-blue-700 bg-white/80 px-2 py-1 rounded-lg border border-blue-200/60 ml-2">
                Pulse: {latestReading.pulse} BPM
              </span>
            )}
            <span className="text-xs text-gray-400 font-mono ml-auto">
              {latestReading.date} • {latestReading.time}
            </span>
          </div>

          {latestReading.notes && (
            <p className="text-xs text-gray-600 bg-white/70 p-2.5 rounded-xl border border-blue-100/80">
              Note: {latestReading.notes}
            </p>
          )}

          {/* Reference Targets Guide */}
          <div className="pt-3 border-t border-blue-200/50 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-white/60 rounded-xl">
              <span className="block text-gray-400 text-[11px] font-medium">Normal BP</span>
              <span className="font-mono font-bold text-emerald-700">&lt; 120/80</span>
            </div>
            <div className="p-2 bg-white/60 rounded-xl">
              <span className="block text-gray-400 text-[11px] font-medium">Elevated</span>
              <span className="font-mono font-bold text-amber-700">120-129 / &lt;80</span>
            </div>
            <div className="p-2 bg-white/60 rounded-xl">
              <span className="block text-gray-400 text-[11px] font-medium">Stage 1</span>
              <span className="font-mono font-bold text-orange-700">130-139 / 80-89</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
          <p className="text-sm font-bold text-gray-600">No Blood Pressure Readings Logged Yet</p>
          <p className="text-xs text-gray-400">Click "Log Reading" above to record systolic and diastolic values.</p>
        </div>
      )}

      {/* Toggle History */}
      {readings.length > 0 && (
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full py-2 px-3 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-xl flex items-center justify-between transition"
          >
            <span className="flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-gray-500" />
              Recent Readings ({readings.length} total)
            </span>
            {showHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showHistory && (
            <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
              {readings.slice(0, 6).map((r) => (
                <div
                  key={r.id}
                  className="p-3 bg-[#F8FAFC] rounded-xl border border-gray-100 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#0F1D3D]">{r.systolic}/{r.diastolic} mmHg</span>
                      {r.pulse && <span className="text-gray-400">({r.pulse} bpm)</span>}
                    </div>
                    <span className="text-[11px] text-gray-400">{r.date} at {r.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(r.status)}
                    {onDeleteReading && (
                      <button
                        onClick={() => onDeleteReading(r.id)}
                        className="text-gray-400 hover:text-rose-600 p-1"
                        title="Delete reading"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Log BP Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Heart className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#0F1D3D]">Record Blood Pressure</h4>
                  <p className="text-xs text-gray-500">Oscillometric or manual cuff</p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveReading} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Systolic (mmHg)
                  </label>
                  <input
                    type="number"
                    min="60"
                    max="260"
                    required
                    value={systolic}
                    onChange={(e) => setSystolic(e.target.value)}
                    className="w-full p-3.5 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl font-mono text-xl font-bold text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Upper number</span>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Diastolic (mmHg)
                  </label>
                  <input
                    type="number"
                    min="40"
                    max="160"
                    required
                    value={diastolic}
                    onChange={(e) => setDiastolic(e.target.value)}
                    className="w-full p-3.5 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl font-mono text-xl font-bold text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">Lower number</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Resting Pulse (BPM) (Optional)
                </label>
                <input
                  type="number"
                  min="40"
                  max="200"
                  value={pulse}
                  onChange={(e) => setPulse(e.target.value)}
                  className="w-full p-3 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-sm font-bold text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Measurement Context / Notes (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Seated 5 mins, left arm, post coffee..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-sm text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition"
                >
                  Save Reading
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
