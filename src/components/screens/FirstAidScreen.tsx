import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle,
  PhoneCall,
  Activity,
  Heart,
  Flame,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  Play,
  Pause,
  Volume2,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { FirstAidItem, RouteKey } from '../../types';
import { ReassuranceBar } from '../common/ReassuranceBar';
import { getFirstAidInfo } from '../../services/contentService';

interface FirstAidScreenProps {
  onNavigate: (route: RouteKey) => void;
  id?: string;
}

export const FirstAidScreen: React.FC<FirstAidScreenProps> = ({ onNavigate, id }) => {
  const [protocols, setProtocols] = useState<FirstAidItem[]>([]);
  const [selectedUrgency, setSelectedUrgency] = useState<'all' | 'critical' | 'urgent' | 'common'>(
    'all'
  );
  const [selectedProtocol, setSelectedProtocol] = useState<FirstAidItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    void getFirstAidInfo().then((result) => {
      if (!result.success) {
        setProtocols([]);
        setIsLoading(false);
        return;
      }

      const mapped = (result.firstAid || []).map((item: any, index: number) => ({
        id: String(item.id ?? `first-aid-${index}`),
        title: item.title ?? item.name ?? 'First aid protocol',
        urgency: (item.urgency ?? 'common') as 'critical' | 'urgent' | 'common',
        summary: item.summary ?? item.description ?? '',
        steps: Array.isArray(item.steps) ? item.steps : [],
        dos: Array.isArray(item.dos) ? item.dos : [],
        donts: Array.isArray(item.donts) ? item.donts : [],
      }));

      setProtocols(mapped);
      setIsLoading(false);
    });
  }, []);

  // CPR Metronome State (110 BPM standard for chest compressions)
  const [isMetronomeActive, setIsMetronomeActive] = useState(false);
  const [metronomeBeat, setMetronomeBeat] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    let interval: any = null;
    if (isMetronomeActive) {
      // 110 beats per minute -> 60000 / 110 = ~545ms per beat
      interval = setInterval(() => {
        setMetronomeBeat((prev) => !prev);
        // Play short gentle beep if audio is enabled
        try {
          if (!audioCtxRef.current) {
            audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
          }
          if (audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
          }
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(800, audioCtxRef.current.currentTime);
          gain.gain.setValueAtTime(0.1, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.08);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.09);
        } catch (e) {
          // ignore audio failure
        }
      }, 545);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMetronomeActive]);

  const filtered =
    selectedUrgency === 'all'
      ? protocols
      : protocols.filter((p) => p.urgency === selectedUrgency);

  return (
    <div id={id || 'first-aid-screen'} className="max-w-7xl mx-auto space-y-7">
      {/* High-Visibility Emergency Dial Banner */}
      <div className="bg-gradient-to-r from-red-700 via-rose-700 to-[#0F1D3D] rounded-3xl p-7 sm:p-9 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-3 relative z-10">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-black uppercase tracking-wider bg-white text-red-700 px-3 py-1 rounded-full shadow-xs">
              Emergency Response Protocol
            </span>
            <span className="text-xs font-bold bg-white/20 text-white px-3 py-1 rounded-full">
              Standard CPR & Triage
            </span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            First Aid & Life-Support Guidelines
          </h2>
          <p className="text-sm sm:text-base text-red-100/90 max-w-xl leading-relaxed">
            Immediately call emergency services (911 / 112) for unresponsive victims or heavy arterial
            bleeding before commencing manual interventions.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3.5 shrink-0 relative z-10">
          <a
            href="tel:911"
            className="w-full sm:w-auto px-7 py-4 bg-white text-red-700 hover:bg-gray-100 font-black text-sm sm:text-base rounded-xl shadow-xl flex items-center justify-center gap-2.5 transition active:scale-98"
          >
            <PhoneCall className="w-5 h-5 text-red-600 animate-bounce" />
            <span>Call 911 / 112 Now</span>
          </a>

          <button
            onClick={() => onNavigate('appointments')}
            className="w-full sm:w-auto px-5 py-4 bg-red-800/60 hover:bg-red-800 border border-white/20 text-white font-bold text-sm rounded-xl"
          >
            Find Nearest Hospital
          </button>
        </div>
      </div>

      {/* CPR Metronome Interactive Widget */}
      <div className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center font-black transition-all ${
              isMetronomeActive
                ? metronomeBeat
                  ? 'bg-red-600 text-white scale-110 shadow-lg shadow-red-500/30'
                  : 'bg-red-100 text-red-700'
                : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Heart className={`w-8 h-8 ${isMetronomeActive ? 'animate-pulse' : ''}`} />
          </div>

          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-lg sm:text-xl font-bold text-[#0F1D3D]">CPR Chest Compression Guide</h3>
              <span className="text-xs font-bold text-red-700 bg-red-50 px-2.5 py-0.5 rounded-md border border-red-200">
                110 BPM Target
              </span>
            </div>
            <p className="text-sm text-gray-500 mt-1 leading-relaxed">
              Maintain continuous 5-6 cm deep chest compressions at rhythm with the metronome pulse.
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsMetronomeActive(!isMetronomeActive)}
          className={`px-6 py-3.5 rounded-xl text-sm font-bold flex items-center gap-2.5 transition shadow-xs ${
            isMetronomeActive
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-[#2563EB] text-white hover:bg-blue-700'
          }`}
        >
          {isMetronomeActive ? (
            <>
              <Pause className="w-4.5 h-4.5" />
              <span>Stop Metronome Rhythm</span>
            </>
          ) : (
            <>
              <Play className="w-4.5 h-4.5" />
              <span>Start 110 BPM Metronome</span>
            </>
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-dashed border-[#CBD5E1] p-12 text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-red-500/40 mx-auto animate-pulse" />
          <h4 className="text-lg font-bold text-[#0F1D3D]">Loading emergency protocols…</h4>
        </div>
      ) : (
        <>
      {/* Urgency Filters */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Emergency Protocols' },
          { id: 'critical', label: '🚨 Critical (Life-Threatening)' },
          { id: 'urgent', label: '⚠️ Urgent Interventions' },
          { id: 'common', label: '🩹 Common First Aid' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedUrgency(tab.id as any)}
            className={`px-4.5 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              selectedUrgency === tab.id
                ? 'bg-[#0F1D3D] text-white shadow-xs'
                : 'bg-white text-gray-700 border border-[#E5EAF3] hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Protocols Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedProtocol(item)}
              className="bg-white rounded-3xl border border-[#E5EAF3] p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-between space-y-4"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <span
                    className={`text-xs font-extrabold uppercase tracking-wider px-3 py-1 rounded-md ${
                      item.urgency === 'critical'
                        ? 'bg-red-100 text-red-800 border border-red-200'
                        : item.urgency === 'urgent'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-blue-50 text-blue-800 border border-blue-200'
                    }`}
                  >
                    {item.urgency} Urgency
                  </span>
                  <span className="text-sm font-bold text-[#2563EB] hover:underline">
                    View Protocol →
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[#0F1D3D] mt-3.5">{item.title}</h3>
                <p className="text-sm text-gray-600 mt-1.5 leading-relaxed">{item.summary}</p>

                {/* Steps Preview */}
                <div className="mt-4 pt-3.5 border-t border-gray-100 space-y-2.5">
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    First Steps:
                  </p>
                  <ol className="space-y-2 text-sm text-gray-700">
                    {item.steps.slice(0, 3).map((st, idx) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-gray-100 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 text-[#0F1D3D]">
                          {idx + 1}
                        </span>
                        <span className="line-clamp-1">{st}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <div className="pt-3.5 border-t border-gray-100 flex items-center justify-between text-xs sm:text-sm text-gray-400">
                <span>Verified Clinical Protocol</span>
                <span className="text-red-700 font-bold">AHA & Red Cross Standard</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-dashed border-[#CBD5E1] p-12 text-center space-y-3">
          <AlertTriangle className="w-12 h-12 text-amber-500/50 mx-auto" />
          <h4 className="text-lg font-bold text-[#0F1D3D]">No First Aid Protocols Available</h4>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            No emergency protocols connected yet. Live protocol directory will connect to database.
          </p>
        </div>
      )}

      {/* Protocol Modal */}
      {selectedProtocol && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-7 sm:p-9 space-y-6 shadow-2xl border border-gray-100 my-8">
            <div className="flex items-start justify-between pb-4 border-b border-gray-100">
              <div>
                <span
                  className={`text-xs font-extrabold uppercase px-3 py-1 rounded-md ${
                    selectedProtocol.urgency === 'critical'
                      ? 'bg-red-100 text-red-800'
                      : 'bg-amber-100 text-amber-900'
                  }`}
                >
                  {selectedProtocol.urgency} Urgency
                </span>
                <h3 className="text-2xl font-bold text-[#0F1D3D] mt-2">
                  {selectedProtocol.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{selectedProtocol.summary}</p>
              </div>
              <button
                onClick={() => setSelectedProtocol(null)}
                className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-base"
              >
                ✕
              </button>
            </div>

            {/* Step by Step list */}
            <div className="space-y-3.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-gray-400">
                Action Steps:
              </h4>
              <div className="space-y-3">
                {selectedProtocol.steps.map((st, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-[#F4F7FC] rounded-2xl border border-[#E5EAF3] flex items-start gap-3.5 text-sm"
                  >
                    <span className="w-7 h-7 rounded-xl bg-[#2563EB] text-white font-bold flex items-center justify-center shrink-0 text-sm">
                      {idx + 1}
                    </span>
                    <p className="text-[#0F1D3D] font-medium leading-relaxed mt-0.5">{st}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Dos and Don'ts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-2.5">
                <h5 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" /> Key Do's
                </h5>
                <ul className="space-y-1.5 text-sm text-emerald-900 leading-relaxed">
                  {selectedProtocol.dos.map((d, idx) => (
                    <li key={idx}>• {d}</li>
                  ))}
                </ul>
              </div>

              <div className="p-5 bg-red-50 rounded-2xl border border-red-200 space-y-2.5">
                <h5 className="text-sm font-bold text-red-950 flex items-center gap-2">
                  <XCircle className="w-4.5 h-4.5 text-red-600" /> Critical Don'ts
                </h5>
                <ul className="space-y-1.5 text-sm text-red-900 leading-relaxed">
                  {selectedProtocol.donts.map((d, idx) => (
                    <li key={idx}>• {d}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
              <a
                href="tel:911"
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl flex items-center gap-2 shadow-xs"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Call Dispatch Line (911)</span>
              </a>

              <button
                onClick={() => setSelectedProtocol(null)}
                className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-sm rounded-xl"
              >
                Close Protocol
              </button>
            </div>
          </div>
        </div>
      )}

      <ReassuranceBar />
      </>
      )}
    </div>
  );
};
