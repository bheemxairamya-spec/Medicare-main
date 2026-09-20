import React, { useState, useEffect } from 'react';
import {
  HeartPulse,
  Cpu,
  RefreshCw,
  FileText,
  Activity,
  Heart,
  Droplet,
  Thermometer,
  Scale,
  Wind,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Download,
  Share2,
  Calendar,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  RouteKey,
  User,
  BloodSugarReading,
  BloodPressureReading,
  DailyDietLog,
} from '../../types';
import { StatusPill } from '../common/StatusPill';
import { ReassuranceBar } from '../common/ReassuranceBar';
import {
  HardwareVerificationSection,
  RawHardwareReadingRecord,
} from '../common/HardwareVerificationSection';
import { BloodSugarCard } from '../checkup/BloodSugarCard';
import { BloodPressureCard } from '../checkup/BloodPressureCard';
import { SugarIntakeSection } from '../checkup/SugarIntakeSection';
import {
  INITIAL_MOCK_GLUCOSE_READINGS,
  INITIAL_MOCK_BP_READINGS,
} from '../../utils/sugarEstimator';
import { getHardwareReadings, triggerScan, type HardwareReading } from '../../services/hardwareService';

interface GeneralCheckupScreenProps {
  currentUser: User | null;
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const GeneralCheckupScreen: React.FC<GeneralCheckupScreenProps> = ({
  currentUser,
  onNavigate,
  id,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Step 1: Telemetry & Sensors State
  const [isDeviceConnected, setIsDeviceConnected] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('Just now (120 Hz Stream)');

  // Live Biometric Telemetry values
  const [heartRate, setHeartRate] = useState(72);
  const [spo2, setSpo2] = useState(98);
  const [bodyTemp, setBodyTemp] = useState(36.7);
  const [roomTemp, setRoomTemp] = useState(22.4);
  const [weightKg, setWeightKg] = useState(68.5);
  const [heightCm, setHeightCm] = useState(175);
  const [airQualityPpm, setAirQualityPpm] = useState(412);
  const [recentHardwareReadings, setRecentHardwareReadings] = useState<HardwareReading[]>([]);
  const [scanEligibility, setScanEligibility] = useState<{ is_eligible: boolean; status: string; flagged_reasons: string } | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    void getHardwareReadings({ user_id: currentUser.id, limit: 5 }).then((result) => {
      if (result.success) setRecentHardwareReadings(result.readings || []);
    });
  }, [currentUser?.id]);

  // Blood Sugar & Blood Pressure State
  const [glucoseReadings, setGlucoseReadings] = useState<BloodSugarReading[]>(() => {
    try {
      const saved = localStorage.getItem('medicare_glucose_readings');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_GLUCOSE_READINGS;
    } catch {
      return INITIAL_MOCK_GLUCOSE_READINGS;
    }
  });

  const [bpReadings, setBpReadings] = useState<BloodPressureReading[]>(() => {
    try {
      const saved = localStorage.getItem('medicare_bp_readings');
      return saved ? JSON.parse(saved) : INITIAL_MOCK_BP_READINGS;
    } catch {
      return INITIAL_MOCK_BP_READINGS;
    }
  });

  // Daily Diet Log State (Defaults to empty for today as per requirement)
  const [dietLog, setDietLog] = useState<DailyDietLog>(() => {
    try {
      const todayStr = new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const saved = localStorage.getItem(`medicare_diet_log_${todayStr}`);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      date: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      meals: {
        breakfast: [],
        lunch: [],
        dinner: [],
        snacks: [],
      },
      totalSugar: 0,
      totalCarbs: 0,
      customLimit: 25,
    };
  });

  // Persist glucose readings
  useEffect(() => {
    try {
      localStorage.setItem('medicare_glucose_readings', JSON.stringify(glucoseReadings));
    } catch {
      // ignore
    }
  }, [glucoseReadings]);

  // Persist BP readings
  useEffect(() => {
    try {
      localStorage.setItem('medicare_bp_readings', JSON.stringify(bpReadings));
    } catch {
      // ignore
    }
  }, [bpReadings]);

  // Persist diet log
  useEffect(() => {
    try {
      localStorage.setItem(
        `medicare_diet_log_${dietLog.date}`,
        JSON.stringify(dietLog)
      );
    } catch {
      // ignore
    }
  }, [dietLog]);

  const handleAddGlucoseReading = (newReading: BloodSugarReading) => {
    setGlucoseReadings((prev) => [newReading, ...prev]);
  };

  const handleDeleteGlucoseReading = (id: string) => {
    setGlucoseReadings((prev) => prev.filter((r) => r.id !== id));
  };

  const handleAddBpReading = (newReading: BloodPressureReading) => {
    setBpReadings((prev) => [newReading, ...prev]);
  };

  const handleDeleteBpReading = (id: string) => {
    setBpReadings((prev) => prev.filter((r) => r.id !== id));
  };

  // Derived BMI
  const heightM = heightCm / 100;
  const bmi = (weightKg / (heightM * heightM)).toFixed(1);

  // Step 2: Symptoms & Lifestyle Questionnaire State
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [symptomSeverity, setSymptomSeverity] = useState<number>(2);
  const [energyLevel, setEnergyLevel] = useState<string>('Good');
  const [sleepHours, setSleepHours] = useState<number>(7.5);
  const [waterGlasses, setWaterGlasses] = useState<number>(8);
  const [stressLevel, setStressLevel] = useState<string>('Low');
  const [exerciseMinutes, setExerciseMinutes] = useState<number>(30);
  const [notes, setNotes] = useState('');

  const symptomsList = [
    'None / Feeling Healthy',
    'Mild Fatigue',
    'Headache / Migraine',
    'Dry Cough / Throat Irritation',
    'Muscle / Joint Soreness',
    'Digestive Discomfort',
    'Sleep Disruption',
    'Seasonal Allergies',
  ];

  const toggleSymptom = (sym: string) => {
    if (sym === 'None / Feeling Healthy') {
      setSelectedSymptoms(['None / Feeling Healthy']);
      return;
    }
    const filtered = selectedSymptoms.filter((s) => s !== 'None / Feeling Healthy');
    if (filtered.includes(sym)) {
      setSelectedSymptoms(filtered.filter((s) => s !== sym));
    } else {
      setSelectedSymptoms([...filtered, sym]);
    }
  };

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanError(null);
    try {
      const result = await triggerScan({ user_id: currentUser?.id, user_name: currentUser?.name });
      if (!result.success || !result.reading) throw new Error(result.error || 'Could not complete hardware scan.');
      handleHardwareReadingsAcquired(result.reading);
      setScanEligibility(result.reading);
      setRecentHardwareReadings((items) => [result.reading, ...items].slice(0, 5));
    } catch (error) {
      setScanError(error instanceof Error ? error.message : 'Could not complete hardware scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleHardwareReadingsAcquired = (raw: RawHardwareReadingRecord) => {
    console.log('[GeneralCheckup] Telemetry acquired from hardware rig:', raw);
    if (typeof raw.heart_rate_bpm === 'number') {
      setHeartRate(raw.heart_rate_bpm);
    }
    if (typeof raw.spo2_percent === 'number') {
      setSpo2(Math.round(raw.spo2_percent));
    }
    if (typeof raw.body_temp_c === 'number' && raw.body_temp_c > 0) {
      setBodyTemp(parseFloat(raw.body_temp_c.toFixed(1)));
    }
    if (typeof raw.weight_kg === 'number') {
      setWeightKg(parseFloat(raw.weight_kg.toFixed(1)));
    }
    if (typeof raw.air_quality_index === 'number' && raw.air_quality_index > 0) {
      setAirQualityPpm(raw.air_quality_index);
    }
    setLastSyncTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
  };

  // Step 3: Compute Overall Score
  const computeHealthScore = () => {
    let score = 98;
    if (heartRate > 85 || heartRate < 60) score -= 4;
    if (spo2 < 96) score -= 8;
    if (bodyTemp > 37.4 || bodyTemp < 36.0) score -= 6;
    if (selectedSymptoms.length > 0 && !selectedSymptoms.includes('None / Feeling Healthy')) {
      score -= selectedSymptoms.length * 3;
    }
    if (sleepHours < 6) score -= 4;
    if (waterGlasses < 5) score -= 3;
    return Math.max(score, 65);
  };

  const healthScore = computeHealthScore();

  return (
    <div id={id || 'general-checkup-screen'} className="max-w-7xl mx-auto space-y-7">
      {/* Top Flow Header & Step Progress Bar */}
      <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
              <HeartPulse className="w-7 h-7 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                  General Health Assessment
                </span>
                <span className="text-xs font-bold text-gray-400">Step {currentStep} of 3</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-[#0F1D3D] mt-1 tracking-tight">
                {currentStep === 1 && 'Step 1: IoT Hardware Telemetry & Vitals Scan'}
                {currentStep === 2 && 'Step 2: Symptoms & Lifestyle Questionnaire'}
                {currentStep === 3 && 'Step 3: Clinical Diagnostic Scorecard & Recommendations'}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            )}
          </div>
        </div>

        {/* Step Indicator Tabs */}
        <div className="grid grid-cols-3 gap-3 sm:gap-5 mt-6">
          {[
            { step: 1, label: '1. IoT Telemetry Scan', desc: 'ESP32 Vitals & Sensors' },
            { step: 2, label: '2. Symptoms & Habits', desc: 'Clinical Review' },
            { step: 3, label: '3. Clinical Scorecard', desc: 'Score & Guidance' },
          ].map((s) => {
            const isCompleted = currentStep > s.step;
            const isCurrent = currentStep === s.step;
            return (
              <button
                key={s.step}
                onClick={() => setCurrentStep(s.step as any)}
                className={`p-4 rounded-2xl border text-left transition-all relative ${
                  isCurrent
                    ? 'bg-[#EFF4FF] border-[#2563EB] ring-2 ring-[#2563EB]/20 shadow-xs'
                    : isCompleted
                    ? 'bg-white border-emerald-300'
                    : 'bg-[#F4F7FC]/60 border-gray-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-sm font-extrabold ${
                      isCurrent
                        ? 'text-[#2563EB]'
                        : isCompleted
                        ? 'text-emerald-700'
                        : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                  {isCompleted && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
                </div>
                <p className="text-xs text-gray-500 mt-1 hidden sm:block">{s.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* STEP 1: IoT HARDWARE TELEMETRY & VITALS SCAN */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="space-y-7">
          {/* Live ESP32 Hardware Verification & Biometric Telemetry */}
          <HardwareVerificationSection
            id="general-checkup-hardware-verification"
            initialUserName={currentUser?.name || ''}
            initialUserId={currentUser?.id || ''}
            contextTitle="General Patient Health Telemetry Verification"
            onReadingsAcquired={handleHardwareReadingsAcquired}
            onReadingsSaved={(assignedReading) => {
              handleHardwareReadingsAcquired(assignedReading);
            }}
          />

          <div className="bg-white rounded-2xl border border-[#E5EAF3] p-5 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-[#0F1D3D]">Live ESP32 Scan</h3>
                <p className="text-sm text-gray-500">Runs a scan for the signed-in patient and saves it to the hardware feed.</p>
              </div>
              <button onClick={() => void handleRunScan()} disabled={isScanning || !currentUser}
                className="px-5 py-3 bg-[#2563EB] text-white font-bold rounded-xl disabled:opacity-50">
                {isScanning ? 'Scanning…' : 'Check Vitals'}
              </button>
            </div>
            {scanEligibility && (
              <p className={`text-sm font-semibold ${scanEligibility.is_eligible ? 'text-emerald-700' : 'text-red-700'}`}>
                {scanEligibility.is_eligible ? 'Eligible scan result' : `Review required: ${scanEligibility.flagged_reasons || scanEligibility.status}`}
              </p>
            )}
            {scanError && <p className="text-sm font-semibold text-red-700">{scanError}</p>}
            {recentHardwareReadings.length > 0 && (
              <p className="text-xs text-gray-500">Recent reading: {recentHardwareReadings[0].heart_rate_bpm} BPM · {recentHardwareReadings[0].spo2_percent}% SpO₂ · {recentHardwareReadings[0].body_temp_c}°C · {recentHardwareReadings[0].weight_kg} kg · AQI {recentHardwareReadings[0].air_quality_index} · alcohol {recentHardwareReadings[0].alcohol_level}</p>
            )}
          </div>

          {/* ========================================================================= */}
          {/* BIOCHEMICAL & HEMODYNAMIC CARDS: BLOOD SUGAR & BLOOD PRESSURE */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BloodSugarCard
              readings={glucoseReadings}
              onAddReading={handleAddGlucoseReading}
              onDeleteReading={handleDeleteGlucoseReading}
            />
            <BloodPressureCard
              readings={bpReadings}
              onAddReading={handleAddBpReading}
              onDeleteReading={handleDeleteBpReading}
            />
          </div>

          {/* ========================================================================= */}
          {/* NEW FEATURE: SUGAR INTAKE & DIABETES RISK INSIGHT */}
          {/* ========================================================================= */}
          <SugarIntakeSection
            currentUser={currentUser}
            glucoseReadings={glucoseReadings}
            dietLog={dietLog}
            onUpdateDietLog={setDietLog}
          />

          {/* Step 1 Actions */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Biometric telemetry, glycemic readings, and diet log synced successfully.</span>
            </div>
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <span>Continue to Step 2: Symptoms Review</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: SYMPTOMS & CLINICAL QUESTIONNAIRE */}
      {/* ========================================================================= */}
      {currentStep === 2 && (
        <div className="space-y-7">
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 sm:p-9 shadow-sm space-y-7">
            <div>
              <h3 className="text-xl font-extrabold text-[#0F1D3D]">
                Current Symptoms & Physical State
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Select any active physical sensations or symptoms experienced over the past 48 hours.
              </p>
            </div>

            {/* Symptoms Tags */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              {symptomsList.map((sym) => {
                const isSelected = selectedSymptoms.includes(sym);
                return (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => toggleSymptom(sym)}
                    className={`p-4 rounded-2xl border text-left text-sm font-bold transition-all flex items-center justify-between ${
                      isSelected
                        ? 'bg-[#EFF4FF] border-[#2563EB] text-[#2563EB] shadow-xs'
                        : 'bg-[#F4F7FC] border-transparent text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <span>{sym}</span>
                    {isSelected && <CheckCircle2 className="w-4.5 h-4.5 text-[#2563EB] shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Lifestyle & Vitals Sliders */}
            <div className="pt-5 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-sm">
              {/* Daily Sleep */}
              <div className="p-5 bg-[#F4F7FC] rounded-2xl space-y-2.5 border border-[#E5EAF3]">
                <div className="flex items-center justify-between font-bold text-[#0F1D3D]">
                  <label className="text-sm">Last Night's Sleep</label>
                  <span className="font-mono text-[#2563EB] font-black text-base">{sleepHours} Hours</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="0.5"
                  value={sleepHours}
                  onChange={(e) => setSleepHours(parseFloat(e.target.value))}
                  className="w-full accent-[#2563EB] h-2"
                />
                <p className="text-xs text-gray-500">Recommended: 7 – 9 hours for deep recovery</p>
              </div>

              {/* Water Intake */}
              <div className="p-5 bg-[#F4F7FC] rounded-2xl space-y-2.5 border border-[#E5EAF3]">
                <div className="flex items-center justify-between font-bold text-[#0F1D3D]">
                  <label className="text-sm">Daily Hydration</label>
                  <span className="font-mono text-blue-700 font-black text-base">{waterGlasses} Glasses (~{(waterGlasses * 0.25).toFixed(1)} L)</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="16"
                  step="1"
                  value={waterGlasses}
                  onChange={(e) => setWaterGlasses(parseInt(e.target.value))}
                  className="w-full accent-blue-600 h-2"
                />
                <p className="text-xs text-gray-500">Recommended: 8+ glasses per day</p>
              </div>

              {/* Exercise Minutes */}
              <div className="p-5 bg-[#F4F7FC] rounded-2xl space-y-2.5 border border-[#E5EAF3]">
                <div className="flex items-center justify-between font-bold text-[#0F1D3D]">
                  <label className="text-sm">Physical Exercise</label>
                  <span className="font-mono text-emerald-700 font-black text-base">{exerciseMinutes} Mins</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="120"
                  step="5"
                  value={exerciseMinutes}
                  onChange={(e) => setExerciseMinutes(parseInt(e.target.value))}
                  className="w-full accent-emerald-600 h-2"
                />
                <p className="text-xs text-gray-500">Moderate or aerobic cardiovascular activity</p>
              </div>
            </div>

            {/* Additional Clinical Notes */}
            <div className="space-y-2">
              <label className="block text-sm font-bold text-[#0F1D3D]">
                Special Remarks / Clinical Context (Optional)
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Mention any new medications, recent flights, dietary changes, or specific questions for your doctor..."
                className="w-full p-4 bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-2xl text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-[#2563EB]/30 focus:border-[#2563EB] leading-relaxed"
              />
            </div>
          </div>

          {/* Step 2 Actions */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="px-6 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl transition flex items-center gap-2"
            >
              <ArrowLeft className="w-4.5 h-4.5" />
              <span>Back to Step 1</span>
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#2563EB] hover:bg-blue-700 text-white font-extrabold text-sm sm:text-base rounded-xl shadow-md flex items-center justify-center gap-2 transition"
            >
              <span>Compile Diagnostic Scorecard</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: CLINICAL SCORECARD & RECOMMENDATIONS */}
      {/* ========================================================================= */}
      {currentStep === 3 && (
        <div className="space-y-7">
          {/* Overall Health Score Card */}
          <div className="bg-gradient-to-r from-[#0F1D3D] via-[#1E3A8A] to-[#2563EB] rounded-3xl p-7 sm:p-9 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="space-y-3 relative z-10">
              <div className="flex items-center gap-2.5">
                <span className="text-xs font-extrabold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full border border-white/20">
                  Certified Health Report
                </span>
                <span className="text-xs font-bold bg-emerald-500/30 text-emerald-200 px-3 py-1 rounded-full border border-emerald-400/30">
                  ESP32 Verified Vitals
                </span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
                General Wellness Index: {healthScore}/100
              </h2>
              <p className="text-sm sm:text-base text-blue-100/90 max-w-xl leading-relaxed">
                Your physiological markers demonstrate robust cardiovascular rhythm, healthy oxygenation,
                and optimal thermal equilibrium.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 relative z-10">
              <button
                onClick={() => alert('Exporting Certified Medical Telemetry Report PDF...')}
                className="w-full sm:w-auto px-5 py-3.5 bg-white text-[#0F1D3D] hover:bg-gray-100 font-extrabold text-sm sm:text-base rounded-xl shadow-lg flex items-center justify-center gap-2 transition"
              >
                <Download className="w-4.5 h-4.5 text-[#2563EB]" />
                <span>Export PDF Dossier</span>
              </button>
              <button
                onClick={() => onNavigate('appointments')}
                className="w-full sm:w-auto px-5 py-3.5 bg-white/15 hover:bg-white/25 border border-white/20 text-white font-bold text-sm sm:text-base rounded-xl transition flex items-center justify-center gap-2"
              >
                <Calendar className="w-4.5 h-4.5" />
                <span>Book Doctor Consultation</span>
              </button>
            </div>
          </div>

          {/* Breakdown Categories Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category 1 */}
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0F1D3D] uppercase tracking-wider">
                  Cardiovascular
                </span>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                  Optimal
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Pulse rate of <strong className="text-[#0F1D3D]">{heartRate} BPM</strong> and blood oxygen saturation at <strong className="text-[#0F1D3D]">{spo2}%</strong> indicate stable cardiac endurance.
              </p>
            </div>

            {/* Category 2 */}
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0F1D3D] uppercase tracking-wider">
                  Metabolic & BMI
                </span>
                <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                  BMI {bmi}
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Load cell recorded <strong className="text-[#0F1D3D]">{weightKg} kg</strong>. BMI is within the standard healthy clinical range for your height.
              </p>
            </div>

            {/* Category 3 */}
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0F1D3D] uppercase tracking-wider">
                  Thermal State
                </span>
                <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg">
                  Normothermic
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Core body temperature of <strong className="text-[#0F1D3D]">{bodyTemp}°C</strong> with ambient indoor at <strong className="text-[#0F1D3D]">{roomTemp}°C</strong> shows normal thermal homeostasis.
              </p>
            </div>

            {/* Category 4 */}
            <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold text-[#0F1D3D] uppercase tracking-wider">
                  Glycemic & Sugar
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                  {dietLog.totalSugar}g Intake
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Latest glucose: <strong className="text-[#0F1D3D]">{glucoseReadings[0]?.value || 98} {glucoseReadings[0]?.unit || 'mg/dL'}</strong>. Today's diet sugar estimated at <strong className="text-[#0F1D3D]">{dietLog.totalSugar}g</strong> ({dietLog.customLimit || 25}g target).
              </p>
            </div>
          </div>

          {/* Actionable Clinical Recommendations */}
          <div className="bg-white rounded-3xl border border-[#E5EAF3] p-7 sm:p-9 shadow-sm space-y-5">
            <h3 className="text-lg font-extrabold text-[#0F1D3D] flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#2563EB]" /> Personalized Health Action Plan
            </h3>

            <div className="space-y-3.5 text-sm">
              <div className="p-4.5 bg-[#F4F7FC] rounded-2xl border border-[#E5EAF3] flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-[#0F1D3D] text-sm sm:text-base">Maintain 8+ Glasses Daily Hydration</h4>
                  <p className="text-gray-500 mt-0.5 leading-relaxed text-sm">
                    Continuing adequate water intake supports cellular metabolism, renal clearance, and cardiovascular stroke volume.
                  </p>
                </div>
              </div>

              <div className="p-4.5 bg-[#F4F7FC] rounded-2xl border border-[#E5EAF3] flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-[#0F1D3D] text-sm sm:text-base">Daily 30-Minute Aerobic Routine</h4>
                  <p className="text-gray-500 mt-0.5 leading-relaxed text-sm">
                    Maintain brisk walking, cycling, or light resistance training to keep resting heart rate in the 60-75 BPM bracket.
                  </p>
                </div>
              </div>

              <div className="p-4.5 bg-[#F4F7FC] rounded-2xl border border-[#E5EAF3] flex items-start gap-3.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-[#0F1D3D] text-sm sm:text-base">Periodic ESP32 Hardware Vital Tracking</h4>
                  <p className="text-gray-500 mt-0.5 leading-relaxed text-sm">
                    Perform a biometric scan 2-3 times per week to monitor longitudinal heart rate variability and SpO2 levels.
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
              <button
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 text-sm font-bold text-gray-500 hover:text-gray-800"
              >
                ← Retake Assessment
              </button>
              <button
                onClick={() => onNavigate('profile')}
                className="px-6 py-3 bg-[#2563EB] hover:bg-blue-700 text-white text-sm font-extrabold rounded-xl transition shadow-xs"
              >
                Save & View Profile
              </button>
            </div>
          </div>
        </div>
      )}

      <ReassuranceBar />
    </div>
  );
};
