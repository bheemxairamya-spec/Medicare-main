import React, { useState } from 'react';
import {
  Droplet,
  Plus,
  TrendingUp,
  Clock,
  History,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { BloodSugarReading, BloodSugarTestType, GlucoseStatus } from '../../types';
import { classifyGlucose } from '../../utils/sugarEstimator';

interface BloodSugarCardProps {
  readings: BloodSugarReading[];
  onAddReading: (reading: BloodSugarReading) => void;
  onDeleteReading?: (id: string) => void;
}

export const BloodSugarCard: React.FC<BloodSugarCardProps> = ({
  readings,
  onAddReading,
  onDeleteReading,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Form State
  const [inputValue, setInputValue] = useState('98');
  const [testType, setTestType] = useState<BloodSugarTestType>('fasting');
  const [notes, setNotes] = useState('');
  const [unit, setUnit] = useState<'mg/dL' | '%'>('mg/dL');

  const latestReading: BloodSugarReading | undefined = readings[0];

  const handleSaveReading = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputValue);
    if (isNaN(val) || val <= 0) return;

    const status: GlucoseStatus = classifyGlucose(val, testType);
    const now = new Date();
    const newReading: BloodSugarReading = {
      id: `gl-${Date.now()}`,
      timestamp: now.toISOString(),
      date: now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      value: val,
      unit: testType === 'hba1c' ? '%' : 'mg/dL',
      testType,
      status,
      notes: notes.trim() || undefined,
    };

    onAddReading(newReading);
    setIsModalOpen(false);
    setNotes('');
  };

  const getStatusBadge = (status: GlucoseStatus) => {
    switch (status) {
      case 'normal':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Normal Range
          </span>
        );
      case 'elevated':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Elevated
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            High (Above Target)
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Low Glucose
          </span>
        );
    }
  };

  const formatTestTypeName = (type: BloodSugarTestType) => {
    switch (type) {
      case 'fasting':
        return 'Fasting Plasma Glucose (FPG)';
      case 'post_prandial':
        return 'Post-Prandial (2h Post Meal)';
      case 'random':
        return 'Random Glucose';
      case 'hba1c':
        return 'HbA1c Glycated Hemoglobin';
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm space-y-5 hover:shadow-md transition">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
            <Droplet className="w-6 h-6 fill-rose-500/20" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-gray-400 uppercase tracking-wider">
                Biochemical Marker
              </span>
            </div>
            <h3 className="text-lg font-black text-[#0F1D3D]">Blood Sugar (Glucose)</h3>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs sm:text-sm font-bold rounded-xl border border-rose-200 flex items-center gap-1.5 transition"
        >
          <Plus className="w-4 h-4" />
          <span>Log Reading</span>
        </button>
      </div>

      {/* Main Metric Display */}
      {latestReading ? (
        <div className="p-5 bg-gradient-to-br from-[#FFF5F5] to-[#FFF0F0] rounded-2xl border border-rose-100 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <span className="text-xs font-bold text-rose-900/80 bg-white/80 px-2.5 py-1 rounded-lg border border-rose-200/60">
              Latest: {formatTestTypeName(latestReading.testType)}
            </span>
            {getStatusBadge(latestReading.status)}
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-4xl sm:text-5xl font-black font-mono text-[#0F1D3D]">
              {latestReading.value}
            </span>
            <span className="text-base font-bold text-gray-500">{latestReading.unit}</span>
            <span className="text-xs text-gray-400 font-mono ml-auto">
              {latestReading.date} • {latestReading.time}
            </span>
          </div>

          {latestReading.notes && (
            <p className="text-xs text-gray-600 bg-white/70 p-2.5 rounded-xl border border-rose-100/80">
              Note: {latestReading.notes}
            </p>
          )}

          {/* Reference Targets Guide */}
          <div className="pt-3 border-t border-rose-200/50 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 bg-white/60 rounded-xl">
              <span className="block text-gray-400 text-[11px] font-medium">Fasting Target</span>
              <span className="font-mono font-bold text-emerald-700">70 – 99 mg/dL</span>
            </div>
            <div className="p-2 bg-white/60 rounded-xl">
              <span className="block text-gray-400 text-[11px] font-medium">Post-Meal Target</span>
              <span className="font-mono font-bold text-emerald-700">&lt; 140 mg/dL</span>
            </div>
            <div className="p-2 bg-white/60 rounded-xl">
              <span className="block text-gray-400 text-[11px] font-medium">HbA1c Target</span>
              <span className="font-mono font-bold text-emerald-700">&lt; 5.7%</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center space-y-2">
          <p className="text-sm font-bold text-gray-600">No Blood Sugar Readings Logged Yet</p>
          <p className="text-xs text-gray-400">Click "Log Reading" above to record your first measurement.</p>
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
                      <span className="font-bold text-[#0F1D3D]">{r.value} {r.unit}</span>
                      <span className="text-gray-400 capitalize">({r.testType.replace('_', ' ')})</span>
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

      {/* Log Reading Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-gray-100 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Droplet className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-[#0F1D3D]">Record Blood Glucose</h4>
                  <p className="text-xs text-gray-500">Add test value & condition</p>
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
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Test Type & Condition
                </label>
                <select
                  value={testType}
                  onChange={(e) => {
                    const newType = e.target.value as BloodSugarTestType;
                    setTestType(newType);
                    if (newType === 'hba1c') {
                      setUnit('%');
                      setInputValue('5.6');
                    } else {
                      setUnit('mg/dL');
                      if (inputValue === '5.6') setInputValue('98');
                    }
                  }}
                  className="w-full p-3 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-sm font-bold text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                >
                  <option value="fasting">Fasting Blood Sugar (FPG)</option>
                  <option value="post_prandial">Post-Prandial (2 hrs post-meal)</option>
                  <option value="random">Random Glucose Check</option>
                  <option value="hba1c">HbA1c (% Glycated Hemoglobin)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Measured Value ({testType === 'hba1c' ? '%' : 'mg/dL'})
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step={testType === 'hba1c' ? '0.1' : '1'}
                    min={testType === 'hba1c' ? '3' : '30'}
                    max={testType === 'hba1c' ? '18' : '600'}
                    required
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    className="w-full p-3.5 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl font-mono text-xl font-bold text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                  />
                  <span className="absolute right-3.5 top-3.5 text-sm font-bold text-gray-400">
                    {testType === 'hba1c' ? '%' : 'mg/dL'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                  Clinical Notes / Context (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Before breakfast, felt dizzy, post-workout..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-3 bg-[#F4F7FC] border border-[#E5EAF3] rounded-xl text-sm text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-rose-500/20"
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
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl shadow-md transition"
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
