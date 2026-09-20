import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  LogOut,
  CheckCircle2,
  XCircle,
  Clock,
  Heart,
  Activity,
  Scale,
  Thermometer,
  Wine,
  Wind,
  Loader2,
  Lock,
  AlertCircle,
} from 'lucide-react';
import { StatusPill } from '../common/StatusPill';

const TOKEN_KEY = 'medicare_admin_token';

interface LatestReading {
  id: string;
  heart_rate_bpm: number;
  spo2_percent: number;
  weight_kg: number;
  body_temp_c: number;
  alcohol_level: number;
  air_quality_index: number;
  is_eligible: boolean;
  status: 'pass' | 'review' | 'fail';
  flagged_reasons: string;
  recorded_at: string;
}

interface AdminVolunteer {
  id: string;
  name: string;
  blood_group?: string;
  mobile?: string;
  email?: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at?: string;
  latest_reading: LatestReading | null;
}

type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

async function adminFetch(path: string, token: string, init?: RequestInit) {
  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      'x-admin-token': token,
    },
  });
  return res.json();
}

export const AdminPanel: React.FC = () => {
  const [token, setToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [volunteers, setVolunteers] = useState<AdminVolunteer[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [decidingId, setDecidingId] = useState<string | null>(null);

  const fetchVolunteers = async (activeToken: string, status: StatusFilter) => {
    setIsLoadingList(true);
    setListError(null);
    try {
      const data = await adminFetch(`/api/admin/volunteers?status=${status}`, activeToken);
      if (data.success) {
        setVolunteers(data.volunteers || []);
      } else {
        if (data.error === 'Unauthorized') {
          sessionStorage.removeItem(TOKEN_KEY);
          setToken(null);
        }
        setListError(data.error || 'Could not load applications.');
      }
    } catch {
      setListError('Could not reach the server.');
    } finally {
      setIsLoadingList(false);
    }
  };

  useEffect(() => {
    if (token) fetchVolunteers(token, statusFilter);
  }, [token, statusFilter]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (data.success && data.token) {
        sessionStorage.setItem(TOKEN_KEY, data.token);
        setToken(data.token);
      } else {
        setLoginError(data.error || 'Invalid credentials.');
      }
    } catch {
      setLoginError('Could not reach the server.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    if (token) {
      try {
        await adminFetch('/api/admin/logout', token, { method: 'POST' });
      } catch {
        // ignore
      }
    }
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
  };

  const handleDecision = async (id: string, status: 'approved' | 'rejected') => {
    if (!token) return;
    setDecidingId(id);
    try {
      const data = await adminFetch(`/api/admin/volunteers/${encodeURIComponent(id)}/status`, token, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (data.success) {
        setVolunteers((prev) => prev.filter((v) => v.id !== id));
      }
    } finally {
      setDecidingId(null);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-[#0F1D3D] flex items-center justify-center p-4">
        <form
          onSubmit={handleLogin}
          className="bg-white rounded-3xl shadow-xl max-w-sm w-full p-8 space-y-5"
        >
          <div className="flex flex-col items-center text-center gap-2">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100 flex items-center justify-center">
              <Lock className="w-7 h-7" />
            </div>
            <h1 className="text-xl font-bold text-[#0F1D3D]">Medicare Admin</h1>
            <p className="text-xs text-gray-500">Sign in to review blood donor verifications.</p>
          </div>

          {loginError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {loginError}
            </div>
          )}

          <div className="space-y-3">
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoFocus
              className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-medium"
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#F4F7FC] border border-[#E5EAF3] text-sm rounded-xl px-4 py-3 text-[#0F1D3D] focus:outline-none focus:ring-2 focus:ring-purple-600/30 font-medium"
            />
          </div>

          <button
            type="submit"
            disabled={isLoggingIn || !username || !password}
            className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 text-white text-sm font-bold transition cursor-pointer disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoggingIn ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            <span>Sign In</span>
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F7FC]">
      <div className="bg-[#0F1D3D] text-white px-5 sm:px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-bold">Medicare Admin</h1>
            <p className="text-xs text-white/60">Blood Donor Verification</p>
          </div>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          Logout
        </button>
      </div>

      <div className="max-w-5xl mx-auto p-5 sm:p-8 space-y-6">
        <div className="flex items-center gap-2 flex-wrap">
          {(['pending', 'approved', 'rejected', 'all'] as StatusFilter[]).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                statusFilter === s
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white text-gray-600 border border-[#E5EAF3] hover:bg-gray-50'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {isLoadingList && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading applications...
          </div>
        )}

        {listError && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-semibold">
            {listError}
          </div>
        )}

        {!isLoadingList && !listError && volunteers.length === 0 && (
          <div className="p-8 rounded-2xl bg-white border border-dashed border-[#E5EAF3] text-center text-sm text-gray-500">
            No {statusFilter !== 'all' ? statusFilter : ''} volunteer applications.
          </div>
        )}

        <div className="space-y-4">
          {volunteers.map((v) => {
            const r = v.latest_reading;
            return (
              <div key={v.id} className="bg-white rounded-2xl border border-[#E5EAF3] shadow-2xs p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
                      {v.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-[#0F1D3D]">{v.name}</h3>
                        {v.blood_group && (
                          <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded">
                            {v.blood_group}
                          </span>
                        )}
                        <StatusPill
                          variant={v.status === 'approved' ? 'pass' : v.status === 'rejected' ? 'fail' : 'pending'}
                          label={v.status}
                          size="sm"
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                        {v.mobile && <span>{v.mobile}</span>}
                        {v.email && <span>{v.email}</span>}
                        {v.created_at && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(v.created_at).toLocaleDateString()}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {v.status === 'pending' && (
                    <div className="flex items-center gap-2 self-start sm:self-auto">
                      <button
                        type="button"
                        onClick={() => handleDecision(v.id, 'rejected')}
                        disabled={decidingId === v.id}
                        className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecision(v.id, 'approved')}
                        disabled={decidingId === v.id}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50"
                      >
                        {decidingId === v.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        )}
                        Accept
                      </button>
                    </div>
                  )}
                </div>

                {r ? (
                  <div className="pt-3 border-t border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Linked Hardware Reading</p>
                      <StatusPill variant={r.is_eligible ? 'pass' : 'fail'} label={r.is_eligible ? 'Eligible' : 'Ineligible'} size="sm" />
                    </div>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
                      <div className="rounded-xl bg-[#F4F7FC] p-2">
                        <Heart className="w-3.5 h-3.5 mx-auto text-rose-500 mb-1" />
                        <p className="text-sm font-black text-[#0F1D3D]">{r.heart_rate_bpm || '--'}</p>
                        <p className="text-[9px] text-gray-500">BPM</p>
                      </div>
                      <div className="rounded-xl bg-[#F4F7FC] p-2">
                        <Activity className="w-3.5 h-3.5 mx-auto text-sky-500 mb-1" />
                        <p className="text-sm font-black text-[#0F1D3D]">{r.spo2_percent || '--'}</p>
                        <p className="text-[9px] text-gray-500">SpO2 %</p>
                      </div>
                      <div className="rounded-xl bg-[#F4F7FC] p-2">
                        <Scale className="w-3.5 h-3.5 mx-auto text-amber-500 mb-1" />
                        <p className="text-sm font-black text-[#0F1D3D]">{r.weight_kg.toFixed(1)}</p>
                        <p className="text-[9px] text-gray-500">kg</p>
                      </div>
                      <div className="rounded-xl bg-[#F4F7FC] p-2">
                        <Thermometer className="w-3.5 h-3.5 mx-auto text-orange-500 mb-1" />
                        <p className="text-sm font-black text-[#0F1D3D]">{r.body_temp_c.toFixed(1)}</p>
                        <p className="text-[9px] text-gray-500">&deg;C</p>
                      </div>
                      <div className="rounded-xl bg-[#F4F7FC] p-2">
                        <Wine className="w-3.5 h-3.5 mx-auto text-red-500 mb-1" />
                        <p className="text-sm font-black text-[#0F1D3D]">{r.alcohol_level.toFixed(3)}</p>
                        <p className="text-[9px] text-gray-500">BAC</p>
                      </div>
                      <div className="rounded-xl bg-[#F4F7FC] p-2">
                        <Wind className="w-3.5 h-3.5 mx-auto text-emerald-500 mb-1" />
                        <p className="text-sm font-black text-[#0F1D3D]">{r.air_quality_index.toFixed(0)}</p>
                        <p className="text-[9px] text-gray-500">AQI</p>
                      </div>
                    </div>
                    {!r.is_eligible && r.flagged_reasons && (
                      <p className="text-xs text-rose-700 mt-2 font-semibold">{r.flagged_reasons}</p>
                    )}
                  </div>
                ) : (
                  <div className="pt-3 border-t border-gray-100 text-xs text-gray-400 italic">
                    No hardware reading linked to this application yet.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
