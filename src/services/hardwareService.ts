export interface HardwareReading {
  id: string;
  user_id?: string | null;
  user_name?: string | null;
  volunteer_id?: string | null;
  volunteer_name?: string | null;
  device_id: string;
  heart_rate_bpm: number;
  spo2_percent: number;
  body_temp_c: number;
  weight_kg: number;
  air_quality_index: number;
  alcohol_level: number;
  is_eligible: boolean;
  status: 'pass' | 'review' | 'fail';
  flagged_reasons: string;
  recorded_at: string;
}

export async function triggerScan(params: {
  user_id?: string;
  user_name?: string;
  volunteer_id?: string;
  volunteer_name?: string;
  device_id?: string;
  simulate?: boolean;
  simulate_ineligible?: boolean;
}) {
  const res = await fetch('/api/hardware-readings/trigger-scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  return res.json();
}

export async function getHardwareReadings(params: { user_id?: string; volunteer_id?: string; unassigned?: boolean; search?: string; limit?: number }) {
  const query = new URLSearchParams();
  if (params.user_id) query.set('user_id', params.user_id);
  if (params.volunteer_id) query.set('volunteer_id', params.volunteer_id);
  if (params.unassigned) query.set('unassigned', 'true');
  if (params.search) query.set('search', params.search);
  if (params.limit) query.set('limit', String(params.limit));
  const res = await fetch(`/api/hardware-readings?${query.toString()}`);
  return res.json();
}

export async function assignReading(readingId: string, params: { user_id?: string; user_name?: string; volunteer_id?: string; volunteer_name?: string; reading_data?: any }) {
  const res = await fetch(`/api/hardware-readings/${readingId}/assign`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(params) });
  return res.json();
}

export async function checkBackendHealth() {
  const res = await fetch('/api/health');
  return res.json();
}
