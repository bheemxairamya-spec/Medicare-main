import React, { useState, useEffect, useRef } from 'react';
import {
  Search,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Wine,
  Wind,
  Scale,
  Heart,
  Thermometer,
  Activity,
  UserCheck,
  Clock,
  Radio,
  XCircle,
  Sparkles,
  ShieldCheck,
  Check,
  Save,
  RotateCcw,
  Loader2,
  AlertCircle,
  FileCode2,
} from 'lucide-react';
import { StatusPill } from './StatusPill';
import { IoTDeviceFirmwareModal } from './IoTDeviceFirmwareModal';

export interface UserSearchResult {
  id: string;
  name: string;
  blood_group?: string;
  mobile?: string;
  email?: string;
  status?: string;
  applied_date?: string;
  role?: string;
}

export type VolunteerSearchResult = UserSearchResult;

export interface RawHardwareReadingRecord {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  volunteer_id?: string | null;
  volunteer_name?: string | null;
  device_id: string;
  alcohol_level: number;
  air_quality_index: number;
  weight_kg: number;
  heart_rate_bpm: number;
  body_temp_c: number;
  spo2_percent: number;
  recorded_at: string;
  is_eligible: boolean;
  status: 'pass' | 'review' | 'fail';
  flagged_reasons: string;
}

interface HardwareVerificationSectionProps {
  initialUserName?: string;
  initialUserId?: string;
  initialVolunteerName?: string;
  onUserSelected?: (user: UserSearchResult) => void;
  onVolunteerSelected?: (volunteer: UserSearchResult) => void;
  onReadingsAcquired?: (readings: RawHardwareReadingRecord) => void;
  onReadingsSaved?: (readings: RawHardwareReadingRecord) => void;
  id?: string;
  contextTitle?: string;
}

const FALLBACK_USERS: UserSearchResult[] = [];

export const HardwareVerificationSection: React.FC<HardwareVerificationSectionProps> = ({
  initialUserName,
  initialUserId,
  initialVolunteerName,
  onUserSelected,
  onVolunteerSelected,
  onReadingsAcquired,
  onReadingsSaved,
  id,
  contextTitle,
}) => {
  const defaultDisplayName = (initialUserName || initialVolunteerName || '').trim();
  const [searchTerm, setSearchTerm] = useState(defaultDisplayName);
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVolunteer, setSelectedVolunteer] = useState<UserSearchResult | null>(
    defaultDisplayName
      ? {
          id: initialUserId || 'usr-active',
          name: defaultDisplayName,
          blood_group: '',
          status: 'active',
          role: 'patient',
        }
      : null
  );

  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [reading, setReading] = useState<RawHardwareReadingRecord | null>(null);
  const [assignedStatus, setAssignedStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null);
  const [isFirmwareModalOpen, setIsFirmwareModalOpen] = useState(false);

  // Live Hardware Feed (read-only, 1s poll, never saved to DB — mirrors the ESP32 OLED)
  interface LiveVitals {
    heart_rate_bpm: number;
    spo2_percent: number;
    weight_kg: number;
    body_temp_c: number;
    alcohol_level: number;
    air_quality_ppm: number;
    finger_detected: boolean;
  }
  const [liveVitals, setLiveVitals] = useState<LiveVitals | null>(null);
  const [liveOnline, setLiveOnline] = useState(false);

  // Save Readings: confirm/enter the name to save this reading under before it's committed
  const [isNamePromptOpen, setIsNamePromptOpen] = useState(false);
  const [namePromptValue, setNamePromptValue] = useState('');

  const searchContainerRef = useRef<HTMLDivElement>(null);
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-initialize user / patient
  useEffect(() => {
    if (!selectedVolunteer && defaultDisplayName) {
      const defaultName = defaultDisplayName;
      fetch(`/api/users?search=${encodeURIComponent(defaultName)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.users) && data.users.length > 0) {
            const match =
              data.users.find((u: UserSearchResult) => u.name.toLowerCase() === defaultName.toLowerCase()) ||
              data.users[0];
            setSelectedVolunteer(match);
            setSearchTerm(match.name);
          } else {
            return fetch(`/api/volunteers?search=${encodeURIComponent(defaultName)}`)
              .then((vRes) => vRes.json())
              .then((vData) => {
                if (vData.success && Array.isArray(vData.volunteers) && vData.volunteers.length > 0) {
                  const match =
                    vData.volunteers.find((v: UserSearchResult) => v.name.toLowerCase() === defaultName.toLowerCase()) ||
                    vData.volunteers[0];
                  setSelectedVolunteer(match);
                  setSearchTerm(match.name);
                } else if (defaultName) {
                  setSelectedVolunteer({
                    id: initialUserId || 'usr-active',
                    name: defaultName,
                    blood_group: '',
                    status: 'active',
                    role: 'patient',
                  });
                  setSearchTerm(defaultName);
                }
              });
          }
        })
        .catch(() => {
          if (defaultName) {
            setSelectedVolunteer({
              id: initialUserId || 'usr-active',
              name: defaultName,
              blood_group: '',
              status: 'active',
              role: 'patient',
            });
            setSearchTerm(defaultName);
          }
        });
    }
  }, [initialUserName, initialVolunteerName, initialUserId, defaultDisplayName]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Live Hardware Feed: poll the ESP32 directly every 1s (read-only, never saved to DB)
  // so the on-screen vitals mirror the OLED in real time before a scan is recorded.
  useEffect(() => {
    let cancelled = false;

    const pollLiveVitals = async () => {
      try {
        const res = await fetch(`/api/esp32/ap-stream?_=${Date.now()}`, { cache: 'no-store' });
        const data = await res.json();
        if (cancelled) return;
        if (data.success && data.telemetry?.donor_vitals) {
          const v = data.telemetry.donor_vitals;
          setLiveVitals({
            heart_rate_bpm: Number(v.heart_rate_bpm ?? 0),
            spo2_percent: Number(v.spo2_percent ?? 0),
            weight_kg: Number(v.weight_kg ?? 0),
            body_temp_c: Number(v.body_temp_c ?? 0),
            alcohol_level: Number(v.alcohol_level ?? 0),
            air_quality_ppm: Number(v.air_quality_ppm ?? 0),
            finger_detected: Boolean(data.telemetry.finger_detected),
          });
          setLiveOnline(true);
        } else {
          setLiveOnline(false);
        }
      } catch {
        if (!cancelled) setLiveOnline(false);
      }
    };

    pollLiveVitals();
    const liveInterval = setInterval(pollLiveVitals, 1000);
    return () => {
      cancelled = true;
      clearInterval(liveInterval);
    };
  }, []);

  // Debounced search against GET /api/users and fallback to /api/volunteers
  useEffect(() => {
    if (selectedVolunteer && searchTerm === selectedVolunteer.name) {
      return;
    }

    if (searchTerm.trim().length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        let results: UserSearchResult[] = [];
        // 1. Try users endpoint
        try {
          const res = await fetch(`/api/users?search=${encodeURIComponent(searchTerm.trim())}`);
          if (res.ok) {
            const data = await res.json();
            if (data.success && Array.isArray(data.users) && data.users.length > 0) {
              results = data.users;
            }
          }
        } catch {
          // ignore
        }

        // 2. Try volunteers endpoint
        if (results.length === 0) {
          try {
            const vRes = await fetch(`/api/volunteers?search=${encodeURIComponent(searchTerm.trim())}`);
            if (vRes.ok) {
              const vData = await vRes.json();
              if (vData.success && Array.isArray(vData.volunteers) && vData.volunteers.length > 0) {
                results = vData.volunteers;
              }
            }
          } catch {
            // ignore
          }
        }

        // 3. Match from fallbacks if still empty
        if (results.length === 0) {
          const q = searchTerm.toLowerCase();
          results = FALLBACK_USERS.filter(
            (u) =>
              u.name.toLowerCase().includes(q) ||
              (u.blood_group && u.blood_group.toLowerCase().includes(q)) ||
              (u.email && u.email.toLowerCase().includes(q))
          );
        }

        setSearchResults(results);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchTerm, selectedVolunteer]);

  // Handle selecting a user/volunteer from autocomplete
  const handleSelectVolunteer = (vol: UserSearchResult) => {
    setSelectedVolunteer(vol);
    setSearchTerm(vol.name);
    setIsDropdownOpen(false);
    setScanError(null);
    setSaveError(null);
    setSaveSuccessMessage(null);
    setIsSaved(false);
    if (onUserSelected) {
      onUserSelected(vol);
    }
    if (onVolunteerSelected) {
      onVolunteerSelected(vol);
    }
  };

  const handleClearSelected = () => {
    setSelectedVolunteer(null);
    setSearchTerm('');
    setSearchResults([]);
    setReading(null);
    setScanError(null);
    setSaveError(null);
    setSaveSuccessMessage(null);
    setAssignedStatus(null);
    setIsSaved(false);
  };

  // Trigger Scan against ESP32 (Retrieves live readings in pending unsaved state)
  const handleTriggerScan = async (simulate = false, simulateIneligible = false) => {
    let currentVol = selectedVolunteer;
    if (!currentVol) {
      currentVol = {
        id: initialUserId || 'usr-current',
        name: searchTerm.trim() || initialUserName || initialVolunteerName || 'Patient',
        blood_group: 'Pending',
        status: 'active',
      };
      setSelectedVolunteer(currentVol);
    }

    setIsScanning(true);
    setScanError(null);
    setSaveError(null);
    setSaveSuccessMessage(null);
    setIsSaved(false);
    setReading(null);
    setAssignedStatus(null);

    // 15-second timeout error handler
    if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
    scanTimeoutRef.current = setTimeout(() => {
      setIsScanning(false);
      setScanError('Scan timed out — ESP32 hardware not responding. Please check Wi-Fi connection.');
    }, 15000);

    try {
      // 1. Call POST /api/hardware-readings/trigger-scan
      // Keep in pending state: do NOT auto-save or auto-link to volunteer until "Save Readings" is clicked
      const response = await fetch('/api/hardware-readings/trigger-scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'ESP32_MED_01',
          esp32_ip: '192.168.137.133',
          simulate,
          simulate_ineligible: simulateIneligible,
          user_id: currentVol.id,
          user_name: currentVol.name,
          volunteer_id: currentVol.id,
          volunteer_name: currentVol.name,
        }),
      });

      const scanResult = await response.json();

      if (!response.ok || !scanResult.success) {
        throw new Error(scanResult.error || 'Failed to initiate trigger scan command');
      }

      const currentReading: RawHardwareReadingRecord = scanResult.reading;

      if (currentReading && currentReading.id) {
        if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
        console.log('[HardwareVerification] Telemetry scan acquired:', currentReading);
        // Display in unsaved pending state for staff verification before committing
        setReading(currentReading);
        setIsSaved(false);
        setIsScanning(false);
      } else {
        throw new Error('No reading returned from ESP32');
      }
    } catch (err: any) {
      console.error('Trigger scan error:', err);
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current);
      setIsScanning(false);
      setScanError(err.message || 'Scan failed — ESP32 device offline or unreachable.');
    }
  };

  // Opens the "confirm name" prompt before committing the reading
  const handleOpenSavePrompt = () => {
    if (!reading || isSaving || isSaved) return;
    setNamePromptValue(
      selectedVolunteer?.name || searchTerm.trim() || initialUserName || initialVolunteerName || ''
    );
    setIsNamePromptOpen(true);
  };

  // Explicit Save Readings: commits and links reading via PATCH /api/hardware-readings/:id/assign
  const handleSaveReadings = async (confirmedName: string) => {
    console.log('[HardwareVerification] handleSaveReadings clicked. Reading ID:', reading?.id, 'Person:', selectedVolunteer);

    if (!reading || isSaving || isSaved) {
      console.warn('[HardwareVerification] Save aborted: reading missing, in-progress, or already saved');
      return;
    }

    const targetId = selectedVolunteer?.id || initialUserId || `walkin-${Date.now()}`;
    const targetName = confirmedName.trim() || 'Patient';

    setIsSaving(true);
    setSaveError(null);

    console.log(`[HardwareVerification] Sending PATCH /api/hardware-readings/${reading.id}/assign with:`, {
      user_id: targetId,
      user_name: targetName,
      volunteer_id: targetId,
      volunteer_name: targetName,
    });

    try {
      const assignRes = await fetch(
        `/api/hardware-readings/${encodeURIComponent(reading.id)}/assign`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id: targetId,
            user_name: targetName,
            volunteer_id: targetId,
            volunteer_name: targetName,
            reading_data: reading,
          }),
        }
      );

      if (!assignRes.ok) {
        const errData = await assignRes.json().catch(() => ({}));
        const message = errData.error || `Server returned error (${assignRes.status})`;
        console.error('[HardwareVerification] Save API call failed with status:', assignRes.status, message);
        throw new Error(message);
      }

      const assignData = await assignRes.json();
      console.log('[HardwareVerification] Reading successfully saved and linked:', assignData);

      const updatedReading: RawHardwareReadingRecord = assignData.reading || {
        ...reading,
        user_id: targetId,
        user_name: targetName,
        volunteer_id: targetId,
        volunteer_name: targetName,
      };

      setReading(updatedReading);
      setIsSaved(true);
      setAssignedStatus(`Linked to ${targetName} (ID: ${targetId})`);
      setSaveSuccessMessage(`Readings saved and linked to ${targetName}`);

      if (onReadingsAcquired) {
        onReadingsAcquired(updatedReading);
      }
      if (onReadingsSaved) {
        onReadingsSaved(updatedReading);
      }
    } catch (err: any) {
      console.error('[HardwareVerification] Save readings error caught:', err);
      console.log('[HardwareVerification] Error message to display:', err.message);
      setSaveError(err.message || 'Failed to save readings to database. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  // Discard & Re-scan: discards pending readings and triggers a fresh scan
  const handleDiscardAndRescan = () => {
    setReading(null);
    setIsSaved(false);
    setSaveError(null);
    setSaveSuccessMessage(null);
    setAssignedStatus(null);
    handleTriggerScan(false);
  };

  // Detailed clinical flags evaluation based on blood donation medical thresholds
  const flaggedIssues = reading
    ? [
        ...(reading.alcohol_level > 0.005
          ? [
              {
                code: 'alcohol',
                sensorCode: 'MQ-3',
                metric: 'Alcohol Level',
                value: `${reading.alcohol_level.toFixed(3)} BAC %`,
                expected: '0.00% (Strict Zero-Tolerance)',
                reason:
                  'Alcohol detected in bloodstream. Blood donation guidelines mandate strict zero-tolerance.',
              },
            ]
          : []),
        ...(reading.weight_kg < 50.0
          ? [
              {
                code: 'weight',
                sensorCode: 'HX711',
                metric: 'Body Weight',
                value: `${reading.weight_kg.toFixed(1)} kg`,
                expected: '≥ 50.0 kg',
                reason:
                  'Weight is below the 50.0 kg minimum threshold required for safe blood extraction without vasovagal reaction.',
              },
            ]
          : []),
        ...(reading.heart_rate_bpm < 50 || reading.heart_rate_bpm > 100
          ? [
              {
                code: 'hr',
                sensorCode: 'MAX30102',
                metric: 'Heart Rate',
                value: `${reading.heart_rate_bpm} BPM`,
                expected: '50 – 100 BPM',
                reason:
                  reading.heart_rate_bpm < 50
                    ? 'Resting heart rate indicates sinus bradycardia (< 50 BPM).'
                    : 'Resting heart rate indicates resting tachycardia (> 100 BPM).',
              },
            ]
          : []),
        ...(reading.spo2_percent < 95.0
          ? [
              {
                code: 'spo2',
                sensorCode: 'MAX30102 (Red/IR)',
                metric: 'Blood Oxygen Saturation (SpO2)',
                value: `${reading.spo2_percent.toFixed(1)}%`,
                expected: '≥ 95.0%',
                reason: 'Arterial blood oxygen saturation is below the safe 95.0% clinical baseline.',
              },
            ]
          : []),
        ...(reading.body_temp_c < 36.1 || reading.body_temp_c > 37.5
          ? [
              {
                code: 'temp',
                sensorCode: 'DS18B20',
                metric: 'Core Body Temperature',
                value: `${reading.body_temp_c.toFixed(1)}°C`,
                expected: '36.1°C – 37.5°C',
                reason:
                  reading.body_temp_c < 36.1
                    ? 'Core temperature indicates hypothermic state (< 36.1°C).'
                    : 'Core temperature indicates fever or sub-febrile pyrexia (> 37.5°C).',
              },
            ]
          : []),
      ]
    : [];

  const isEligible = reading ? flaggedIssues.length === 0 : null;

  // Helper to map metric status
  const getMetricStatus = (key: string, value: number): 'pass' | 'review' | 'fail' => {
    switch (key) {
      case 'alcohol':
        return value <= 0.005 ? 'pass' : 'fail';
      case 'aqi':
        return value <= 50 ? 'pass' : value <= 100 ? 'review' : 'fail';
      case 'weight':
        return value >= 50.0 ? 'pass' : 'fail';
      case 'hr':
        return value >= 50 && value <= 100 ? 'pass' : 'fail';
      case 'temp':
        return value >= 36.1 && value <= 37.5 ? 'pass' : value <= 37.8 ? 'review' : 'fail';
      case 'spo2':
        return value >= 95.0 ? 'pass' : 'fail';
      default:
        return 'pass';
    }
  };

  const isMetricFlagged = (key: string) => flaggedIssues.some((f) => f.code === key);

  return (
    <div
      id={id || 'hardware-verification-section'}
      className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-8 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Cpu className="w-6 h-6 stroke-[2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg sm:text-xl font-bold text-[#0F1D3D]">
                Search &amp; Verify with Hardware
              </h3>
              <span className="text-[11px] font-bold bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full">
                ESP32 Biometric Rig
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              Search patient or user by name, lock session, and stream live 6-sensor biometric verification.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsFirmwareModalOpen(true)}
            className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3.5 py-1.5 rounded-full border border-indigo-200 transition cursor-pointer shadow-2xs"
            title="View ESP32 Pinout, SoftAP Credentials & Live MQTT"
          >
            <FileCode2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>ESP32 Firmware &amp; Pins</span>
          </button>
          <span
            className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${
              liveOnline
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-gray-100 text-gray-500 border-gray-200'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${liveOnline ? 'bg-emerald-500 animate-pulse' : 'bg-gray-400'}`} />
            {liveOnline ? 'ESP32 Node Ready' : 'ESP32 Node Offline'}
          </span>
        </div>
      </div>

      {/* Live Hardware Feed — read-only, refreshes every 1s, mirrors the OLED. Not a recorded reading. */}
      <div className="rounded-2xl border border-[#E5EAF3] bg-[#0F1D3D] p-4 sm:p-5 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${liveOnline ? 'bg-emerald-400 animate-pulse' : 'bg-gray-500'}`} />
            <h4 className="text-sm font-bold">Live Sensor Feed</h4>
            <span className="text-[10px] font-bold text-gray-400">(1s refresh · not yet recorded)</span>
          </div>
          {liveVitals && (
            <span className="text-[11px] font-bold text-purple-300">
              {liveVitals.finger_detected ? 'Finger Detected' : 'No Finger'}
            </span>
          )}
        </div>
        {liveVitals ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
            <div className="rounded-xl bg-white/5 p-2.5">
              <Heart className="w-4 h-4 mx-auto text-rose-400 mb-1" />
              <p className="text-base font-black">{liveVitals.heart_rate_bpm || '--'}</p>
              <p className="text-[10px] text-gray-400">BPM</p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5">
              <Activity className="w-4 h-4 mx-auto text-sky-400 mb-1" />
              <p className="text-base font-black">{liveVitals.spo2_percent || '--'}</p>
              <p className="text-[10px] text-gray-400">SpO2 %</p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5">
              <Scale className="w-4 h-4 mx-auto text-amber-400 mb-1" />
              <p className="text-base font-black">{liveVitals.weight_kg.toFixed(1)}</p>
              <p className="text-[10px] text-gray-400">kg</p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5">
              <Thermometer className="w-4 h-4 mx-auto text-orange-400 mb-1" />
              <p className="text-base font-black">{liveVitals.body_temp_c.toFixed(1)}</p>
              <p className="text-[10px] text-gray-400">&deg;C</p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5">
              <Wine className="w-4 h-4 mx-auto text-red-400 mb-1" />
              <p className="text-base font-black">{liveVitals.alcohol_level.toFixed(3)}</p>
              <p className="text-[10px] text-gray-400">BAC</p>
            </div>
            <div className="rounded-xl bg-white/5 p-2.5">
              <Wind className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
              <p className="text-base font-black">{liveVitals.air_quality_ppm}</p>
              <p className="text-[10px] text-gray-400">AQI</p>
            </div>
          </div>
        ) : (
          <p className="text-xs text-gray-400">
            {liveOnline ? 'Waiting for first reading...' : 'Searching for ESP32 on the network...'}
          </p>
        )}
      </div>

      {/* 1. Patient / User Autocomplete Search Field */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-[#0F1D3D]">
          Search Patient, Member, or Volunteer by Name
        </label>
        <div ref={searchContainerRef} className="relative">
          <div className="relative">
            <input
              type="text"
              id="applicant-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Type at least 2 characters (e.g. Devin, Sophia, Marcus, Sarah)..."
              className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm sm:text-base rounded-xl pl-11 pr-10 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-medium"
            />
            <Search className="w-5 h-5 text-gray-400 absolute left-3.5 top-3.5" />
            {isSearching && (
              <RefreshCw className="w-4 h-4 text-purple-600 animate-spin absolute right-3.5 top-4" />
            )}
            {selectedVolunteer && !isSearching && (
              <button
                type="button"
                onClick={handleClearSelected}
                className="text-xs font-bold text-gray-400 hover:text-red-500 absolute right-3 top-3.5 px-1.5 py-0.5 cursor-pointer"
                title="Clear selected person"
              >
                Clear
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown List */}
          {isDropdownOpen && searchResults.length > 0 && (
            <div
              id="volunteer-autocomplete-dropdown"
              className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#E5EAF3] shadow-lg max-h-60 overflow-y-auto divide-y divide-gray-100"
            >
              {searchResults.map((vol) => (
                <div
                  key={vol.id}
                  onClick={() => handleSelectVolunteer(vol)}
                  className="p-3.5 hover:bg-purple-50/60 cursor-pointer flex items-center justify-between transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-bold text-xs">
                      {vol.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#0F1D3D]">{vol.name}</p>
                      <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                        <span>Applied: <strong className="text-gray-700">{vol.applied_date || 'Recent'}</strong></span>
                        <span>•</span>
                        <span>Blood: <strong className="text-red-600">{vol.blood_group}</strong></span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 hover:bg-purple-600 hover:text-white transition">
                    Select
                  </span>
                </div>
              ))}
            </div>
          )}

          {isDropdownOpen && searchResults.length === 0 && !isSearching && searchTerm.trim().length >= 2 && (
            <div className="absolute z-30 left-0 right-0 mt-1.5 bg-white rounded-2xl border border-[#E5EAF3] shadow-lg p-4 text-center text-xs text-gray-500">
              No existing volunteer applications found matching "{searchTerm}".
            </div>
          )}
        </div>
      </div>

      {/* Selected Volunteer Card */}
      {selectedVolunteer ? (
        <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center font-black text-base shadow-xs">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-base font-bold text-[#0F1D3D]">{selectedVolunteer.name}</h4>
                <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                  {selectedVolunteer.blood_group}
                </span>
                <span className="text-[11px] font-bold bg-purple-200 text-purple-800 px-2 py-0.5 rounded">
                  Active Session
                </span>
              </div>
              <p className="text-xs text-gray-600 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
                <span>ID: <code className="font-mono font-bold text-purple-700">{selectedVolunteer.id}</code></span>
                <span>•</span>
                <span>Applied: <strong>{selectedVolunteer.applied_date || 'Recent'}</strong></span>
                <span>•</span>
                <span>Status: <strong className="capitalize text-emerald-700">{selectedVolunteer.status}</strong></span>
              </p>
            </div>
          </div>

          {/* Trigger Scan Action */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              id="btn-trigger-hardware-scan"
              onClick={() => handleTriggerScan(false, false)}
              disabled={isScanning}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white rounded-xl text-sm font-bold flex items-center gap-2 transition shadow-xs cursor-pointer disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning... please wait' : reading ? 'Re-Trigger Live Scan' : 'Live ESP32 Scan'}</span>
            </button>
            <button
              type="button"
              id="btn-simulate-demo-scan"
              onClick={() => handleTriggerScan(true, false)}
              disabled={isScanning}
              className="px-3.5 py-2.5 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 text-[#2563EB] border border-blue-200 disabled:text-gray-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
              title="Test telemetry without physical hardware"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Demo Test</span>
            </button>
            <button
              type="button"
              id="btn-simulate-ineligible-scan"
              onClick={() => handleTriggerScan(true, true)}
              disabled={isScanning}
              className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 disabled:bg-gray-100 text-rose-700 border border-rose-200 disabled:text-gray-400 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:cursor-not-allowed"
              title="Test threshold failure: alcohol positive, underweight, out-of-range HR"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Simulate Ineligible Flag</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F4F7FC]/80 border border-dashed border-[#E5EAF3] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-gray-500 text-xs sm:text-sm">
          <div className="flex items-center gap-2.5">
            <Radio className="w-5 h-5 text-gray-400 shrink-0" />
            <span>Click Trigger Scan to initialize live ESP32 telemetry check for the active applicant.</span>
          </div>
          <button
            type="button"
            id="btn-trigger-hardware-scan-fallback"
            onClick={() => handleTriggerScan(false)}
            disabled={isScanning}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 shrink-0 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning...' : 'Trigger Scan'}</span>
          </button>
        </div>
      )}

      {/* Scanning Feedback State */}
      {isScanning && (
        <div className="p-6 rounded-2xl bg-purple-50/50 border border-purple-200 flex flex-col items-center justify-center text-center space-y-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
            <RefreshCw className="w-6 h-6 animate-spin" />
          </div>
          <div>
            <h4 className="text-base font-bold text-[#0F1D3D]">
              Scanning... please wait
            </h4>
            <p className="text-xs text-gray-600 max-w-md mt-1">
              Communicating with ESP32 biomedical rig (<code className="font-mono text-purple-700">ESP32-MEDICARE-NODE-01</code>). Sampling load cell, optical SpO2/HR, Dallas temperature, and gas arrays.
            </p>
          </div>
          <div className="w-48 h-1.5 bg-purple-200 rounded-full overflow-hidden">
            <div className="h-full bg-purple-600 rounded-full animate-progress" />
          </div>
        </div>
      )}

      {/* Error Message with Retry */}
      {scanError && (
        <div
          id="hardware-scan-error-alert"
          className="p-5 rounded-2xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-red-800"
        >
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <h5 className="text-sm font-bold">{scanError}</h5>
              <p className="text-xs text-red-700 mt-0.5">
                Check serial cable or WiFi node connectivity to ESP32-MEDICARE-NODE-01, then click retry.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleTriggerScan}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition self-start sm:self-auto shrink-0 shadow-2xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry Scan</span>
          </button>
        </div>
      )}

      {/* Empty Telemetry State */}
      {!reading && !isScanning && (
        <div className="p-8 rounded-2xl border border-dashed border-[#E5EAF3] bg-[#F4F7FC]/50 text-center space-y-2">
          <Cpu className="w-8 h-8 text-purple-400 mx-auto" />
          <h4 className="text-sm sm:text-base font-bold text-[#0F1D3D]">No Hardware Telemetry Acquired Yet</h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
            No static readings loaded. Click <strong>Trigger Scan</strong> above to initialize biomedical telemetry from the connected ESP32 sensor node.
          </p>
        </div>
      )}

      {/* 3. Display Results in Card-Style UI for All 6 Sensors */}
      {reading && !isScanning && (
        <div id="hardware-reading-results" className="space-y-5 pt-2">
          {/* Header with Timestamp, Device ID, and Unsaved/Saved Status */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h4 className="text-sm sm:text-base font-bold text-[#0F1D3D]">
                Live ESP32 Telemetry Acquired
              </h4>
              <span className="text-xs font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                {reading.device_id}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex items-center gap-2.5 flex-wrap">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {new Date(reading.recorded_at).toLocaleTimeString()} ({new Date(reading.recorded_at).toLocaleDateString()})
              </span>

              {/* Quick Action Buttons in Header */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  id="btn-header-discard-rescan"
                  onClick={handleDiscardAndRescan}
                  disabled={isSaving || isScanning}
                  className="px-2.5 py-1 rounded-lg border border-gray-300 hover:bg-gray-100 text-gray-700 text-xs font-semibold flex items-center gap-1 transition cursor-pointer disabled:opacity-50"
                  title="Discard and re-scan"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden sm:inline">Discard &amp; Re-scan</span>
                </button>

                <button
                  type="button"
                  id="btn-header-save-readings"
                  onClick={handleOpenSavePrompt}
                  disabled={isSaved || isSaving || isScanning}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition shadow-2xs ${
                    isSaved
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:bg-purple-300'
                  }`}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : isSaved ? (
                    <>
                      <Check className="w-3 h-3 stroke-[2.5]" />
                      <span>Saved &#10003;</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3 h-3" />
                      <span>Save Readings</span>
                    </>
                  )}
                </button>
              </div>

              {isSaved ? (
                <span
                  id="status-reading-saved-pill"
                  className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1 shadow-2xs"
                >
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Saved &amp; Linked to {selectedVolunteer?.name}</span>
                </span>
              ) : (
                <span
                  id="status-reading-pending-pill"
                  className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1.5 shadow-2xs"
                >
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  <span>Pending Staff Verification (Unsaved)</span>
                </span>
              )}
            </div>
          </div>

          {/* Save Confirmation Toast / Banner */}
          {saveSuccessMessage && (
            <div
              id="hardware-save-success-banner"
              className="p-4 rounded-2xl bg-emerald-50/95 border-2 border-emerald-300 text-emerald-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs animate-in fade-in duration-200"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                  <Check className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                    {saveSuccessMessage}
                  </h5>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Hardware vitals permanently saved to database and linked to volunteer ID {selectedVolunteer?.id} (Scan ID: {reading.id}).
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs self-start sm:self-auto">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Verified &amp; Committed</span>
              </div>
            </div>
          )}

          {/* Save Error Alert Banner */}
          {saveError && (
            <div
              id="hardware-save-error-banner"
              className="p-4 rounded-2xl bg-rose-50 border-2 border-rose-300 text-rose-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5 stroke-[2]" />
                </div>
                <div>
                  <h5 className="text-sm font-bold text-rose-950">
                    Failed to Save Readings
                  </h5>
                  <p className="text-xs text-rose-800 mt-0.5">{saveError}</p>
                </div>
              </div>
              <button
                type="button"
                id="btn-retry-save-readings"
                onClick={() => handleSaveReadings(namePromptValue)}
                disabled={isSaving}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shrink-0 cursor-pointer shadow-2xs"
              >
                Retry Save
              </button>
            </div>
          )}

          {/* Phase 3: Prominent Eligibility Banners */}
          {isEligible ? (
            <div
              id="banner-eligibility-pass"
              className="p-5 sm:p-6 rounded-2xl bg-emerald-50/90 border-2 border-emerald-300 text-emerald-950 shadow-xs space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-black text-emerald-950 tracking-tight">
                        Eligible
                      </h4>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide bg-emerald-200/80 text-emerald-900 px-2.5 py-0.5 rounded-full">
                        All Clinical Thresholds Cleared
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-emerald-800 mt-0.5 font-medium">
                      All biomedical hardware vitals satisfy blood donation criteria (Zero alcohol, weight ≥ 50kg, safe SpO2, and resting pulse).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold bg-white text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 self-start sm:self-auto shadow-2xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Donor Safety Cleared</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2.5 border-t border-emerald-200/70 text-xs text-emerald-800">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                  <span>Zero alcohol verified (0.00% BAC)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                  <span>Donor mass ≥ 50.0 kg requirement</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 stroke-[2.5]" />
                  <span>Resting heart rate & SpO2 in safe range</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              id="banner-eligibility-fail"
              className="p-5 sm:p-6 rounded-2xl bg-rose-50/95 border-2 border-rose-400 text-rose-950 shadow-xs space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                    <AlertTriangle className="w-6 h-6 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-base sm:text-lg font-black text-rose-950 tracking-tight">
                        Not Eligible — see flagged readings
                      </h4>
                      <span className="text-[11px] font-extrabold uppercase tracking-wide bg-rose-200 text-rose-900 px-2.5 py-0.5 rounded-full">
                        {flaggedIssues.length} Parameter{flaggedIssues.length > 1 ? 's' : ''} Flagged
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-rose-800 mt-0.5 font-medium">
                      One or more vital indicators violate standard donor safety thresholds. The applicant cannot be approved for blood collection until values stabilize.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold bg-white text-rose-700 px-3 py-1.5 rounded-xl border border-rose-200 self-start sm:self-auto shadow-2xs">
                  <XCircle className="w-4 h-4 text-rose-600" />
                  <span>Donation Restricted</span>
                </div>
              </div>

              {/* Itemized flagged reasons */}
              <div className="space-y-2 pt-2 border-t border-rose-200/80">
                <p className="text-[11px] font-bold uppercase tracking-wider text-rose-900">
                  Flagged Safety Readings:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {flaggedIssues.map((flag, idx) => (
                    <div
                      key={idx}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-white/90 rounded-xl border border-rose-200 text-xs shadow-2xs"
                    >
                      <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
                          !
                        </span>
                        <div>
                          <span className="font-bold text-rose-950">{flag.metric}</span>
                          <span className="text-gray-500 font-mono ml-1.5">({flag.sensorCode})</span>
                          <p className="text-rose-800 mt-0.5 leading-snug">{flag.reason}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[11px] shrink-0 self-end sm:self-center">
                        <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                          Measured: {flag.value}
                        </span>
                        <span className="text-gray-500">
                          Standard: {flag.expected}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 6 Sensor Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. Alcohol Level (MQ-3) */}
            <div
              id="sensor-card-mq3-alcohol"
              className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-3.5 shadow-2xs ${
                isMetricFlagged('alcohol')
                  ? 'border-2 border-rose-400 bg-rose-50/50 ring-2 ring-rose-300'
                  : 'border-[#E5EAF3] bg-[#F4F7FC]/70 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      isMetricFlagged('alcohol')
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-rose-50 text-rose-600 border-rose-100'
                    }`}
                  >
                    <Wine className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-gray-500 block uppercase">
                      MQ-3
                    </span>
                    <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                      Alcohol Level
                    </h5>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill variant={getMetricStatus('alcohol', reading.alcohol_level)} size="sm" />
                  {isMetricFlagged('alcohol') && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Flagged Ineligible
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      isMetricFlagged('alcohol') ? 'text-rose-700' : 'text-[#0F1D3D]'
                    }`}
                  >
                    {reading.alcohol_level.toFixed(3)}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">BAC %</span>
                </div>
                <p
                  className={`text-xs mt-1 font-semibold ${
                    isMetricFlagged('alcohol') ? 'text-rose-700 font-bold' : 'text-gray-600'
                  }`}
                >
                  Ref: 0.00% (Strict Zero-Tolerance)
                </p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Semiconductor gas detection verifying breath ethanol content meets clinical safety standards.
              </p>
            </div>

            {/* 2. Air Quality Index (MQ-135) */}
            <div
              id="sensor-card-mq135-aqi"
              className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-3.5 shadow-2xs ${
                isMetricFlagged('aqi')
                  ? 'border-2 border-rose-400 bg-rose-50/50 ring-2 ring-rose-300'
                  : 'border-[#E5EAF3] bg-[#F4F7FC]/70 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 border border-teal-100 flex items-center justify-center">
                    <Wind className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-gray-500 block uppercase">
                      MQ-135
                    </span>
                    <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                      Air Quality Index
                    </h5>
                  </div>
                </div>
                <StatusPill variant={getMetricStatus('aqi', reading.air_quality_index)} size="sm" />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl sm:text-3xl font-black text-[#0F1D3D] font-mono">
                    {reading.air_quality_index.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">AQI</span>
                </div>
                <p className="text-xs text-gray-600 mt-1 font-semibold">
                  Ref: &lt; 50 AQI (Good Clean Air)
                </p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Monitors environmental airborne contaminants (NH3, NOx, benzene, CO2) in examination room.
              </p>
            </div>

            {/* 3. Body Weight (HX711 + Load Cell) */}
            <div
              id="sensor-card-hx711-weight"
              className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-3.5 shadow-2xs ${
                isMetricFlagged('weight')
                  ? 'border-2 border-rose-400 bg-rose-50/50 ring-2 ring-rose-300'
                  : 'border-[#E5EAF3] bg-[#F4F7FC]/70 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      isMetricFlagged('weight')
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}
                  >
                    <Scale className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-gray-500 block uppercase">
                      HX711 + Load Cell
                    </span>
                    <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                      Body Weight
                    </h5>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill variant={getMetricStatus('weight', reading.weight_kg)} size="sm" />
                  {isMetricFlagged('weight') && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Below 50kg Min
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      isMetricFlagged('weight') ? 'text-rose-700' : 'text-[#0F1D3D]'
                    }`}
                  >
                    {reading.weight_kg.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">kg</span>
                </div>
                <p
                  className={`text-xs mt-1 font-semibold ${
                    isMetricFlagged('weight') ? 'text-rose-700 font-bold' : 'text-gray-600'
                  }`}
                >
                  Ref: &ge; 50.0 kg (Minimum Standard)
                </p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                24-bit ADC platform verifying sufficient blood volume reserve to prevent vasovagal reaction.
              </p>
            </div>

            {/* 4. Heart Rate (MAX30102) */}
            <div
              id="sensor-card-max30102-hr"
              className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-3.5 shadow-2xs ${
                isMetricFlagged('hr')
                  ? 'border-2 border-rose-400 bg-rose-50/50 ring-2 ring-rose-300'
                  : 'border-[#E5EAF3] bg-[#F4F7FC]/70 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      isMetricFlagged('hr')
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-red-50 text-red-600 border border-red-100'
                    }`}
                  >
                    <Heart className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-gray-500 block uppercase">
                      MAX30102
                    </span>
                    <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                      Heart Rate
                    </h5>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill variant={getMetricStatus('hr', reading.heart_rate_bpm)} size="sm" />
                  {isMetricFlagged('hr') && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Out of Safe Range
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      isMetricFlagged('hr') ? 'text-rose-700' : 'text-[#0F1D3D]'
                    }`}
                  >
                    {reading.heart_rate_bpm}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">BPM</span>
                </div>
                <p
                  className={`text-xs mt-1 font-semibold ${
                    isMetricFlagged('hr') ? 'text-rose-700 font-bold' : 'text-gray-600'
                  }`}
                >
                  Ref: 50 &ndash; 100 BPM (Resting Norm)
                </p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                High-sensitivity optical pulse oximeter tracking arterial pulse rate and cardiac cadence.
              </p>
            </div>

            {/* 5. Core Body Temp (DS18B20) */}
            <div
              id="sensor-card-ds18b20-temp"
              className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-3.5 shadow-2xs ${
                isMetricFlagged('temp')
                  ? 'border-2 border-rose-400 bg-rose-50/50 ring-2 ring-rose-300'
                  : 'border-[#E5EAF3] bg-[#F4F7FC]/70 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      isMetricFlagged('temp')
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}
                  >
                    <Thermometer className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-gray-500 block uppercase">
                      DS18B20
                    </span>
                    <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                      Core Body Temperature
                    </h5>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill variant={getMetricStatus('temp', reading.body_temp_c)} size="sm" />
                  {isMetricFlagged('temp') && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Fever/Hypothermia Flag
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      isMetricFlagged('temp') ? 'text-rose-700' : 'text-[#0F1D3D]'
                    }`}
                  >
                    {reading.body_temp_c.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">&deg;C</span>
                </div>
                <p
                  className={`text-xs mt-1 font-semibold ${
                    isMetricFlagged('temp') ? 'text-rose-700 font-bold' : 'text-gray-600'
                  }`}
                >
                  Ref: 36.1&deg;C &ndash; 37.5&deg;C (Normothermia)
                </p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Dallas 1-Wire waterproof digital probe screening against fever, hypothermia, or pyrexia.
              </p>
            </div>

            {/* 6. Blood Oxygen SpO2 (MAX30102 Red/IR) */}
            <div
              id="sensor-card-max30102-spo2"
              className={`p-5 rounded-2xl border transition flex flex-col justify-between space-y-3.5 shadow-2xs ${
                isMetricFlagged('spo2')
                  ? 'border-2 border-rose-400 bg-rose-50/50 ring-2 ring-rose-300'
                  : 'border-[#E5EAF3] bg-[#F4F7FC]/70 hover:shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-xl border flex items-center justify-center ${
                      isMetricFlagged('spo2')
                        ? 'bg-rose-100 text-rose-700 border-rose-200'
                        : 'bg-indigo-50 text-indigo-600 border border-indigo-100'
                    }`}
                  >
                    <Activity className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[11px] font-mono font-bold text-gray-500 block uppercase">
                      MAX30102 (Red/IR)
                    </span>
                    <h5 className="text-sm font-bold text-[#0F1D3D] leading-tight">
                      Blood Oxygen Saturation (SpO2)
                    </h5>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusPill variant={getMetricStatus('spo2', reading.spo2_percent)} size="sm" />
                  {isMetricFlagged('spo2') && (
                    <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">
                      Below 95% Baseline
                    </span>
                  )}
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <span
                    className={`text-2xl sm:text-3xl font-black font-mono ${
                      isMetricFlagged('spo2') ? 'text-rose-700' : 'text-[#0F1D3D]'
                    }`}
                  >
                    {reading.spo2_percent.toFixed(1)}
                  </span>
                  <span className="text-sm font-semibold text-gray-500">%</span>
                </div>
                <p
                  className={`text-xs mt-1 font-semibold ${
                    isMetricFlagged('spo2') ? 'text-rose-700 font-bold' : 'text-gray-600'
                  }`}
                >
                  Ref: &ge; 95.0% (Clinical Baseline)
                </p>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Infrared photoplethysmography evaluating fractional hemoglobin oxygen saturation.
              </p>
            </div>
          </div>

          {/* 4. Action Bar: Save Readings & Discard/Re-scan */}
          <div
            id="hardware-readings-actions-bar"
            className="p-5 rounded-2xl bg-white border border-[#E5EAF3] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div
                className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                  isSaved
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-purple-50 text-purple-600 border border-purple-100'
                }`}
              >
                {isSaved ? (
                  <CheckCircle2 className="w-6 h-6 stroke-[2]" />
                ) : (
                  <Save className="w-6 h-6 stroke-[2]" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h5 className="text-sm sm:text-base font-bold text-[#0F1D3D]">
                    {isSaved ? 'Hardware Telemetry Verified & Saved' : 'Staff Telemetry Verification Required'}
                  </h5>
                  {isSaved ? (
                    <span className="text-[10px] font-extrabold uppercase tracking-wide bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                      Committed
                    </span>
                  ) : (
                    <span className="text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
                      Pending Save
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                  {isSaved
                    ? `All 6 sensor readings have been saved and assigned to ${selectedVolunteer?.name || 'the donor'}.`
                    : `Review sensor values above with donor. Click "Save Readings" to bind telemetry to ${selectedVolunteer?.name || 'the volunteer'}.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 self-end sm:self-center shrink-0 flex-wrap">
              {/* Discard & Re-scan Button */}
              <button
                type="button"
                id="btn-discard-rescan"
                onClick={handleDiscardAndRescan}
                disabled={isSaving || isScanning}
                className="px-4 py-2.5 rounded-xl border border-gray-300 hover:border-gray-400 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs active:scale-98"
              >
                <RotateCcw className="w-4 h-4 text-gray-500" />
                <span>Discard &amp; Re-scan</span>
              </button>

              {/* Save Readings Button */}
              <button
                type="button"
                id="btn-save-hardware-readings"
                onClick={handleOpenSavePrompt}
                disabled={isSaved || isSaving || isScanning}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition shadow-xs active:scale-98 ${
                  isSaved
                    ? 'bg-emerald-600 text-white cursor-default opacity-90'
                    : 'bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:bg-purple-300 disabled:cursor-not-allowed'
                }`}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Readings...</span>
                  </>
                ) : isSaved ? (
                  <>
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Saved &#10003;</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Readings</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IoT Device Firmware & Pinout Modal */}
      <IoTDeviceFirmwareModal
        isOpen={isFirmwareModalOpen}
        onClose={() => setIsFirmwareModalOpen(false)}
        defaultDeviceId="ESP32_MED_01"
      />

      {/* Save Readings: Confirm Name Modal */}
      {isNamePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1D3D]/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl border border-[#E5EAF3] shadow-xl max-w-sm w-full p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center shrink-0">
                <Save className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-base font-bold text-[#0F1D3D]">Save Readings As...</h4>
                <p className="text-xs text-gray-500">Enter the name this scan should be saved under.</p>
              </div>
            </div>
            <input
              type="text"
              id="input-save-readings-name"
              autoFocus
              value={namePromptValue}
              onChange={(e) => setNamePromptValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && namePromptValue.trim()) {
                  setIsNamePromptOpen(false);
                  handleSaveReadings(namePromptValue);
                }
              }}
              placeholder="e.g. Sarah Johnson"
              className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-medium"
            />
            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                id="btn-cancel-save-name"
                onClick={() => setIsNamePromptOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                id="btn-confirm-save-name"
                disabled={!namePromptValue.trim()}
                onClick={() => {
                  setIsNamePromptOpen(false);
                  handleSaveReadings(namePromptValue);
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-bold transition cursor-pointer disabled:cursor-not-allowed"
              >
                Confirm &amp; Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
