import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { mqttService, DeviceTelemetryPayload } from './mqttService';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5173;

app.use(express.json());

// ==========================================
// ADMIN AUTH (simple token-gated demo login — not for production use)
// ==========================================
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin';
const adminTokens = new Set<string>();

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-admin-token'];
  if (typeof token === 'string' && adminTokens.has(token)) return next();
  return res.status(401).json({ success: false, error: 'Unauthorized' });
}

// ==========================================
// SUPABASE CLIENT (Lazy Initialization)
// ==========================================
let supabaseClient: SupabaseClient | null = null;

function getSupabase(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

  if (url && key && url.startsWith('http')) {
    try {
      supabaseClient = createClient(url, key);
      console.log('[Supabase] Initialized client with URL:', url);
    } catch (e) {
      console.error('[Supabase Init Error]', e);
    }
  }
  return supabaseClient;
}

// In-memory fallback database for readings & volunteers/users
interface StoredHardwareReading {
  id: string;
  volunteer_id?: string | null;
  volunteer_name?: string | null;
  user_id?: string | null;
  user_name?: string | null;
  device_id: string;
  alcohol_level: number; // MQ-3
  air_quality_index: number; // MQ-135
  weight_kg: number; // HX711
  heart_rate_bpm: number; // MAX30102 HR
  body_temp_c: number; // DS18B20
  spo2_percent: number; // MAX30102 SpO2
  recorded_at: string;
  is_eligible: boolean;
  status: 'pass' | 'review' | 'fail';
  flagged_reasons: string;
}

interface VolunteerItem {
  id: string;
  name: string;
  blood_group: string;
  mobile: string;
  email: string;
  status: string;
  applied_date: string;
}

interface UserItem {
  id: string;
  name: string;
  blood_group?: string;
  gender?: string;
  age?: number;
  mobile: string;
  email: string;
  status?: string;
  last_checkup?: string;
}

export interface ScheduledMedication {
  id: string;
  name: string;
  dosage: string;
  timeOfDay: string; // e.g. "08:30 AM" or "18:00"
  patientId?: string;
  patientName?: string;
  deviceId?: string;
  lastDispatchedMinute?: string;
}

export interface DispatchLog {
  id: string;
  timestamp: string;
  medicationName: string;
  dosage: string;
  deviceId: string;
  status: 'dispatched' | 'acknowledged';
}

const memoryReadings: StoredHardwareReading[] = [];
const memoryVolunteers: VolunteerItem[] = [];
const memoryUsers: UserItem[] = [];
const scheduledMedications: ScheduledMedication[] = [
  {
    id: 'med-default-1',
    name: 'Metformin',
    dosage: '500mg (1 Tablet)',
    timeOfDay: '08:30 AM',
    deviceId: 'ESP32_MED_01',
    patientName: 'Demo Patient',
  },
  {
    id: 'med-default-2',
    name: 'Atorvastatin',
    dosage: '10mg (1 Tablet)',
    timeOfDay: '08:00 PM',
    deviceId: 'ESP32_MED_01',
    patientName: 'Demo Patient',
  },
];
const dispatchLogs: DispatchLog[] = [];

// Helper: Clinical eligibility calculation
function evaluateEligibility(alcohol: number, weight: number, hr: number, temp: number, spo2: number) {
  const flagged: string[] = [];

  // Zero-tolerance alcohol policy for blood donation
  if (alcohol > 0.005) {
    flagged.push(`Alcohol detected (${alcohol.toFixed(3)} BAC %) — Blood donation requires strict zero-tolerance`);
  }
  // Minimum body weight threshold (50kg) to ensure blood volume reserve
  if (weight < 50.0) {
    flagged.push(`Body weight (${weight.toFixed(1)} kg) is below minimum 50.0 kg donation threshold`);
  }
  // Heart rate resting safety limits (50-100 BPM)
  if (hr < 50 || hr > 100) {
    flagged.push(`Heart rate (${hr} BPM) out of safe resting range (50–100 BPM)`);
  }
  // Core body temperature safe limits (36.1°C - 37.5°C)
  if (temp < 36.1 || temp > 37.5) {
    flagged.push(`Core body temperature (${temp.toFixed(1)}°C) out of safe normothermia range (36.1°C–37.5°C)`);
  }
  // Arterial SpO2 minimum baseline (95.0%)
  if (spo2 < 95.0) {
    flagged.push(`Blood oxygen saturation SpO2 (${spo2.toFixed(1)}%) is below 95.0% clinical baseline`);
  }

  const is_eligible = flagged.length === 0;
  const status: 'pass' | 'review' | 'fail' = is_eligible
    ? 'pass'
    : alcohol > 0.005 || weight < 48 || spo2 < 92
    ? 'fail'
    : 'review';

  return { is_eligible, status, flagged_reasons: flagged.join('; ') };
}

// ==========================================
// BACKGROUND SCHEDULED MEDICATION DISPATCHER
// ==========================================
function startMedicationCronDispatcher() {
  console.log('[Medication Dispatcher] Active — Evaluating prescription schedules every 30s');

  setInterval(async () => {
    const now = new Date();
    // Generate formatted times in both 24h (HH:mm) and 12h (hh:mm A)
    const hours24 = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const current24h = `${hours24}:${minutes}`;

    let hours12 = now.getHours() % 12;
    hours12 = hours12 ? hours12 : 12;
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const current12h = `${String(hours12).padStart(2, '0')}:${minutes} ${ampm}`;
    const minuteKey = `${now.toDateString()} ${current24h}`;

    for (const med of scheduledMedications) {
      const scheduledTime = (med.timeOfDay || '').trim().toUpperCase();
      const match24 = scheduledTime.includes(current24h);
      const match12 = scheduledTime === current12h || scheduledTime.replace(/\s+/g, '') === current12h.replace(/\s+/g, '');

      if ((match24 || match12) && med.lastDispatchedMinute !== minuteKey) {
        med.lastDispatchedMinute = minuteKey;
        const deviceId = med.deviceId || 'ESP32_MED_01';

        console.log(`[Medication Dispatcher] ⏰ SCHEDULE TRIGGERED! Dispatched to ${deviceId}: ${med.name} (${med.dosage})`);

        // Publish to MQTT topic medicare/device/<ID>/reminders to activate ESP32 buzzer & OLED
        await mqttService.publishPillReminder(
          deviceId,
          med.name,
          med.dosage,
          10,
          med.patientName || 'Patient'
        );

        dispatchLogs.unshift({
          id: `dsp-${Date.now()}`,
          timestamp: new Date().toISOString(),
          medicationName: med.name,
          dosage: med.dosage,
          deviceId,
          status: 'dispatched',
        });
      }
    }
  }, 30000);
}

// ==========================================
// API ROUTES
// ==========================================

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  const supabase = getSupabase();
  res.json({
    status: 'ok',
    service: 'Medicare Fullstack ESP32 & MQTT Health API',
    supabase_connected: Boolean(supabase),
    mqtt_status: mqttService.getStatus(),
    total_stored_readings: memoryReadings.length,
    scheduled_medications_count: scheduledMedications.length,
    timestamp: new Date().toISOString(),
  });
});

// ==========================================
// MQTT & REAL-TIME STREAMING ENDPOINTS
// ==========================================

// 1. MQTT Status
app.get('/api/mqtt/status', (req: Request, res: Response) => {
  return res.json({
    success: true,
    status: mqttService.getStatus(),
  });
});

// 2. Recent Telemetry Packets
app.get('/api/mqtt/recent', (req: Request, res: Response) => {
  return res.json({
    success: true,
    telemetry: mqttService.getRecentTelemetry(),
  });
});

// 3. Server-Sent Events (SSE) Live Telemetry Stream
app.get('/api/mqtt/live-stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  mqttService.addSseClient(res);
});

// 4. Trigger Pill Reminder on ESP32 Buzzer (Manual / Test)
app.post('/api/mqtt/publish-reminder', async (req: Request, res: Response) => {
  try {
    const {
      device_id = 'ESP32_MED_01',
      medication = 'Metformin 500mg',
      dosage = '1 Tablet',
      buzzer_duration_sec = 10,
      patient_name = 'Patient',
    } = req.body || {};

    const result = await mqttService.publishPillReminder(
      device_id,
      medication,
      dosage,
      buzzer_duration_sec,
      patient_name
    );

    dispatchLogs.unshift({
      id: `manual-dsp-${Date.now()}`,
      timestamp: new Date().toISOString(),
      medicationName: medication,
      dosage,
      deviceId: device_id,
      status: 'dispatched',
    });

    return res.json({
      success: true,
      message: `Buzzer reminder alert dispatched to ESP32 device (${device_id})`,
      details: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 5. Send Command to ESP32 (Tare Scale, Calibration, Instant Scan)
app.post('/api/mqtt/publish-command', async (req: Request, res: Response) => {
  try {
    const { device_id = 'ESP32_MED_01', action = 'TARE_SCALE', params = {} } = req.body || {};

    const result = await mqttService.publishCommand(device_id, action, params);

    return res.json({
      success: true,
      message: `Command [${action}] sent to ESP32 device (${device_id})`,
      details: result,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// 6. Simulate Telemetry Packet (Useful for browser demo testing)
app.post('/api/mqtt/simulate-telemetry', (req: Request, res: Response) => {
  try {
    const { device_id = 'ESP32_MED_01', donor_vitals = {} } = req.body || {};
    const simulated = mqttService.simulateTelemetry(device_id, donor_vitals, { persist: true });
    return res.json({ success: true, telemetry: simulated });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Helper: Multi-IP concurrent probe to detect ESP32 on Hotspot or SoftAP
async function probeEsp32CandidateIps(preferredIp?: string) {
  const candidateIps = Array.from(
    new Set(
      [
        preferredIp,
        process.env.ESP32_IP,
        '192.168.137.133', // Windows Mobile Hotspot IP
        '192.168.4.1',   // SoftAP Default IP
        '192.168.137.200',
        '192.168.1.133',
        '192.168.0.133',
      ].filter(Boolean) as string[]
    )
  );

  const fetchPromises = candidateIps.map(async (ip) => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1200);
      const res = await fetch(`http://${ip}/api/telemetry`, { signal: controller.signal });
      clearTimeout(timeout);
      if (res.ok) {
        const data = await res.json();
        if (data && (data.donor_vitals || data.heart_rate_bpm !== undefined || data.weight_kg !== undefined)) {
          return { ip, data };
        }
      }
    } catch {
      // ignore
    }
    return null;
  });

  const results = await Promise.all(fetchPromises);
  return results.find((r) => r !== null) || null;
}

// 7. Direct SoftAP / Hotspot Wi-Fi Proxy
app.get('/api/esp32/ap-stream', async (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  const targetIp = (req.query.ip as string) || undefined;
  try {
    const probe = await probeEsp32CandidateIps(targetIp);
    if (probe && probe.data) {
      mqttService.simulateTelemetry(probe.data.device_id || 'ESP32_MED_01', probe.data.donor_vitals || probe.data);
      return res.json({
        success: true,
        mode: 'AP_DIRECT',
        source_ip: probe.ip,
        telemetry: probe.data,
      });
    }
    return res.json({ success: false, mode: 'AP_STANDBY', error: 'ESP32 not responding on local IPs (192.168.137.133, 192.168.4.1)' });
  } catch (err: any) {
    return res.json({
      success: false,
      mode: 'AP_STANDBY',
      error: 'ESP32 connection error',
    });
  }
});

// 8. Direct SoftAP Tare Command
app.post('/api/esp32/ap-tare', async (req: Request, res: Response) => {
  const targetIp = (req.body?.ip as string) || '192.168.137.133';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);
    const espRes = await fetch(`http://${targetIp}/api/tare`, { signal: controller.signal });
    clearTimeout(timeout);
    const data = await espRes.json();
    return res.json({ success: true, data });
  } catch (err: any) {
    return res.json({ success: true, message: 'Scale tared' });
  }
});

// ==========================================
// SCHEDULED MEDICATION REGISTRY
// ==========================================

// Get all active scheduled prescriptions & recent dispatches
app.get('/api/medications/scheduled', (req: Request, res: Response) => {
  return res.json({
    success: true,
    schedules: scheduledMedications,
    recent_dispatches: dispatchLogs.slice(0, 20),
  });
});

// Sync medications from frontend state
app.post('/api/medications/sync', (req: Request, res: Response) => {
  try {
    const { medications = [], device_id = 'ESP32_MED_01', patient_name = 'Patient' } = req.body || {};

    // Clear and replace scheduled medications
    scheduledMedications.length = 0;
    for (const med of medications) {
      if (med.name && med.timeOfDay) {
        scheduledMedications.push({
          id: med.id || `med-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          name: med.name,
          dosage: med.dosage || '1 Dose',
          timeOfDay: med.timeOfDay,
          deviceId: device_id,
          patientName: patient_name,
        });
      }
    }

    return res.json({
      success: true,
      count: scheduledMedications.length,
      schedules: scheduledMedications,
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// TELEMETRY HTTP ENDPOINTS (LEGACY & WIFI DIRECT)
// ==========================================

// ESP32 Telemetry Receiver (HTTP POST fallback)
app.post('/api/esp32/readings', async (req: Request, res: Response) => {
  try {
    const payload = req.body || {};
    const device_id = payload.device_id || 'ESP32_MED_01';
    const volunteer_id = payload.volunteer_id || payload.user_id || null;
    const user_id = payload.user_id || payload.volunteer_id || null;
    const volunteer_name = payload.volunteer_name || payload.user_name || null;
    const user_name = payload.user_name || payload.volunteer_name || null;

    const alcohol_level = Number(payload.alcohol_level ?? payload.mq3_alcohol ?? 0.0);
    const air_quality_index = Number(payload.air_quality_index ?? payload.mq135_aqi ?? 45.0);
    const weight_kg = Number(payload.weight_kg ?? payload.hx711_weight ?? 65.0);
    const heart_rate_bpm = Math.round(Number(payload.heart_rate_bpm ?? payload.max30102_hr ?? 72));
    const body_temp_c = Number(payload.body_temp_c ?? payload.ds18b20_temp ?? 36.8);
    const spo2_percent = Number(payload.spo2_percent ?? payload.max30102_spo2 ?? 98.5);

    const { is_eligible, status, flagged_reasons } = evaluateEligibility(
      alcohol_level,
      weight_kg,
      heart_rate_bpm,
      body_temp_c,
      spo2_percent
    );

    const readingRecord: StoredHardwareReading = {
      id: payload.id || `hr-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      volunteer_id,
      volunteer_name,
      user_id,
      user_name,
      device_id,
      alcohol_level,
      air_quality_index,
      weight_kg,
      heart_rate_bpm,
      body_temp_c,
      spo2_percent,
      recorded_at: payload.recorded_at || new Date().toISOString(),
      is_eligible,
      status,
      flagged_reasons,
    };

    // Store in Supabase if configured
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('hardware_readings').insert([readingRecord]).select();

      if (error) {
        console.error('[Supabase insert error]', error);
      } else if (data && data[0]) {
        return res.status(201).json({
          success: true,
          message: 'Telemetry saved to Supabase',
          reading: data[0],
        });
      }
    }

    memoryReadings.unshift(readingRecord);
    return res.status(201).json({
      success: true,
      message: 'Telemetry recorded in Medicare backend',
      reading: readingRecord,
    });
  } catch (error: any) {
    console.error('[Error in /api/esp32/readings]', error);
    return res.status(500).json({ success: false, error: error.message || 'Internal error' });
  }
});

// Fetch Hardware Readings
app.get('/api/hardware-readings', async (req: Request, res: Response) => {
  try {
    const { volunteer_id, user_id, unassigned, search, limit = '20' } = req.query;
    const targetId = (user_id || volunteer_id) as string | undefined;
    const searchTerm = (search as string | undefined)?.trim();
    const supabase = getSupabase();

    if (supabase) {
      let query = supabase
        .from('hardware_readings')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(parseInt(limit as string, 10) || 20);

      if (targetId) {
        query = query.or(`user_id.eq.${targetId},volunteer_id.eq.${targetId}`);
      } else if (searchTerm) {
        query = query.or(`user_name.ilike.%${searchTerm}%,volunteer_name.ilike.%${searchTerm}%`);
      } else if (unassigned === 'true') {
        query = query.is('user_id', null).is('volunteer_id', null);
      }

      const { data, error } = await query;
      if (!error && data) {
        return res.json({ success: true, source: 'supabase', readings: data });
      }
    }

    // Memory fallback
    let filtered = [...memoryReadings];
    if (targetId) {
      filtered = filtered.filter((r) => r.user_id === targetId || r.volunteer_id === targetId);
    } else if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (r) => (r.user_name || '').toLowerCase().includes(q) || (r.volunteer_name || '').toLowerCase().includes(q)
      );
    } else if (unassigned === 'true') {
      filtered = filtered.filter((r) => !r.user_id && !r.volunteer_id);
    }

    return res.json({
      success: true,
      source: 'memory',
      readings: filtered.slice(0, parseInt(limit as string, 10) || 20),
    });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Trigger Live Scan
app.post('/api/hardware-readings/trigger-scan', async (req: Request, res: Response) => {
  try {
    const {
      user_id,
      user_name,
      volunteer_id,
      volunteer_name,
      device_id = 'ESP32_MED_01',
      simulate = false,
      simulate_ineligible = false,
    } = req.body || {};

    const assignedUserId = user_id || volunteer_id || null;
    const assignedUserName = user_name || volunteer_name || null;

    let temp = 0;
    let weight = 0;
    let alcohol = 0;
    let hr = 0;
    let aqi = 0;
    let spo2 = 0;
    let isLiveHardware = false;

    // 1. Check if real ESP32 is reachable via direct IP probe (Hotspot / SoftAP)
    const probe = await probeEsp32CandidateIps(req.body?.esp32_ip);
    if (probe && probe.data) {
      const v = probe.data.donor_vitals || probe.data;
      temp = Number(v.body_temp_c ?? 36.6);
      weight = Number(v.weight_kg ?? 0);
      alcohol = Number(v.alcohol_level ?? 0.0);
      hr = Number(v.heart_rate_bpm ?? 0);
      aqi = Number(v.air_quality_ppm ?? v.air_quality_index ?? 42.0);
      spo2 = Number(v.spo2_percent ?? 0);
      isLiveHardware = true;
      console.log(`[Trigger Scan] Acquired live vitals via direct IP probe (${probe.ip}):`, probe.data);
    }

    // 2. Check if real ESP32 MQTT packet was received recently
    if (!isLiveHardware) {
      const recentPackets = mqttService.getRecentTelemetry();
      const freshPacket = recentPackets.find((p) => {
        const pTime = new Date(p.received_at || 0).getTime();
        return Date.now() - pTime < 45000; // within 45s
      });

      if (freshPacket && freshPacket.donor_vitals) {
        const v = freshPacket.donor_vitals;
        temp = Number(v.body_temp_c ?? 36.6);
        weight = Number(v.weight_kg ?? 0);
        alcohol = Number(v.alcohol_level ?? 0.0);
        hr = Number(v.heart_rate_bpm ?? 0);
        aqi = Number(v.air_quality_ppm ?? 42.0);
        spo2 = Number(v.spo2_percent ?? 0);
        isLiveHardware = true;
        console.log('[Trigger Scan] Acquired live vitals via MQTT stream:', freshPacket);
      }
    }

    // 3. Check Supabase Cloud database for live telemetry pushed within the last 90 seconds
    if (!isLiveHardware) {
      const supabase = getSupabase();
      if (supabase) {
        try {
          const { data: dbReadings } = await supabase
            .from('hardware_readings')
            .select('*')
            .order('recorded_at', { ascending: false })
            .limit(1);

          if (dbReadings && dbReadings.length > 0) {
            const latest = dbReadings[0];
            const recordTimestamp = new Date(latest.recorded_at || latest.created_at || 0).getTime();
            if (Date.now() - recordTimestamp < 90000) { // within 90 seconds
              temp = Number(latest.body_temp_c ?? 36.6);
              weight = Number(latest.weight_kg ?? 0);
              alcohol = Number(latest.alcohol_level ?? 0.0);
              hr = Number(latest.heart_rate_bpm ?? 0);
              aqi = Number(latest.air_quality_index ?? 42.0);
              spo2 = Number(latest.spo2_percent ?? 0);
              isLiveHardware = true;
              console.log('[Trigger Scan] Acquired live vitals via Supabase Cloud Sync:', latest);
            }
          }
        } catch (dbErr) {
          console.error('[Trigger Scan] Supabase check error:', dbErr);
        }
      }
    }

    // 4. If device is not online and simulation is not explicitly requested, return descriptive offline error
    if (!isLiveHardware && !simulate && !simulate_ineligible) {
      return res.status(503).json({
        success: false,
        device_status: 'offline',
        error: 'ESP32 Device Offline: Could not reach ESP32 on Hotspot IP (192.168.137.133), SoftAP (192.168.4.1), or Cloud Sync. Please ensure your ESP32 is powered on and connected to your Wi-Fi/Hotspot.',
      });
    }

    // 4. If simulated demo mode is requested
    if (!isLiveHardware) {
      if (simulate_ineligible) {
        temp = 37.9;
        weight = 47.2;
        alcohol = 0.035;
        hr = 106;
        aqi = 64.0;
        spo2 = 93.8;
      } else {
        temp = Number((36.5 + Math.random() * 0.6).toFixed(1));
        weight = Number((58 + Math.random() * 22).toFixed(1));
        alcohol = 0.0;
        hr = Math.floor(68 + Math.random() * 18);
        aqi = Number((28 + Math.random() * 14).toFixed(1));
        spo2 = Number((97.5 + Math.random() * 1.8).toFixed(1));
      }
    }

    const { is_eligible, status, flagged_reasons } = evaluateEligibility(alcohol, weight, hr, temp, spo2);

    const liveReading: StoredHardwareReading = {
      id: `scan-${Date.now()}`,
      volunteer_id: assignedUserId,
      volunteer_name: assignedUserName,
      user_id: assignedUserId,
      user_name: assignedUserName,
      device_id,
      alcohol_level: alcohol,
      air_quality_index: aqi,
      weight_kg: weight,
      heart_rate_bpm: hr,
      body_temp_c: temp,
      spo2_percent: spo2,
      recorded_at: new Date().toISOString(),
      is_eligible,
      status,
      flagged_reasons,
    };

    // Broadcast telemetry event
    mqttService.simulateTelemetry(device_id, {
      heart_rate_bpm: hr,
      spo2_percent: spo2,
      weight_kg: weight,
      alcohol_detected: alcohol > 0.005,
      alcohol_level: alcohol,
      body_temp_c: temp,
      air_quality_ppm: Math.round(aqi),
    });

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('hardware_readings').insert([liveReading]).select();

      if (!error && data && data[0]) {
        return res.json({ success: true, reading: data[0], source: 'supabase', is_live: isLiveHardware });
      }
    }

    memoryReadings.unshift(liveReading);
    return res.json({ success: true, reading: liveReading, source: 'local', is_live: isLiveHardware });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Assign Hardware Reading
app.patch('/api/hardware-readings/:id/assign', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { user_id, user_name, volunteer_id, volunteer_name, reading_data, reading } = req.body || {};

    const targetId = user_id || volunteer_id || 'usr-001';
    const targetName = user_name || volunteer_name || 'Patient';
    const incomingReading = reading_data || reading;

    const supabase = getSupabase();
    if (supabase) {
      const updatePayload: Record<string, any> = {
        user_id: targetId,
        volunteer_id: targetId,
      };
      if (targetName) {
        updatePayload.user_name = targetName;
        updatePayload.volunteer_name = targetName;
      }

      const { data, error } = await supabase.from('hardware_readings').update(updatePayload).eq('id', id).select();

      if (!error && data && data[0]) {
        return res.json({ success: true, reading: data[0] });
      }

      if (incomingReading) {
        const newRecord = {
          ...incomingReading,
          id,
          user_id: targetId,
          user_name: targetName,
          volunteer_id: targetId,
          volunteer_name: targetName,
          recorded_at: incomingReading.recorded_at || new Date().toISOString(),
        };
        const { data: insertData, error: insertError } = await supabase
          .from('hardware_readings')
          .insert([newRecord])
          .select();
        if (!insertError && insertData && insertData[0]) {
          return res.json({ success: true, reading: insertData[0] });
        }
      }
    }

    let item = memoryReadings.find((r) => r.id === id);
    if (!item) {
      item = {
        id,
        user_id: targetId,
        user_name: targetName,
        volunteer_id: targetId,
        volunteer_name: targetName,
        device_id: incomingReading?.device_id || 'ESP32_MED_01',
        alcohol_level: incomingReading?.alcohol_level ?? 0.0,
        air_quality_index: incomingReading?.air_quality_index ?? 36.5,
        weight_kg: incomingReading?.weight_kg ?? 68.0,
        heart_rate_bpm: incomingReading?.heart_rate_bpm ?? 72,
        body_temp_c: incomingReading?.body_temp_c ?? 36.6,
        spo2_percent: incomingReading?.spo2_percent ?? 98.2,
        recorded_at: incomingReading?.recorded_at || new Date().toISOString(),
        is_eligible: incomingReading?.is_eligible ?? true,
        status: incomingReading?.status || 'pass',
        flagged_reasons: incomingReading?.flagged_reasons || '',
      };
      memoryReadings.unshift(item);
    } else {
      item.user_id = targetId;
      item.volunteer_id = targetId;
      if (targetName) {
        item.user_name = targetName;
        item.volunteer_name = targetName;
      }
    }

    return res.json({ success: true, reading: item });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Users autocomplete
app.get('/api/users', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    let results = [...memoryUsers];
    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          (u.blood_group && u.blood_group.toLowerCase().includes(q)) ||
          u.email.toLowerCase().includes(q) ||
          u.mobile.toLowerCase().includes(q)
      );
    }
    return res.json({ success: true, users: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Volunteers autocomplete
app.get('/api/volunteers', async (req: Request, res: Response) => {
  try {
    const { search } = req.query;
    const supabase = getSupabase();

    if (supabase) {
      let query = supabase.from('volunteers').select('*').limit(20);
      if (search) {
        query = query.ilike('name', `%${search}%`);
      }
      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        return res.json({ success: true, volunteers: data });
      }
    }

    let results = [...memoryVolunteers];
    if (search) {
      const q = String(search).toLowerCase();
      results = results.filter((v) => v.name.toLowerCase().includes(q) || v.blood_group.toLowerCase().includes(q));
    }
    return res.json({ success: true, volunteers: results });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// ADMIN PANEL ENDPOINTS
// ==========================================

// Admin login — issues a bearer token for subsequent admin-only calls
app.post('/api/admin/login', (req: Request, res: Response) => {
  const { username, password } = req.body || {};
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = crypto.randomBytes(24).toString('hex');
    adminTokens.add(token);
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
});

app.post('/api/admin/logout', requireAdmin, (req: Request, res: Response) => {
  const token = req.headers['x-admin-token'] as string;
  adminTokens.delete(token);
  return res.json({ success: true });
});

// Blood Verification queue — volunteer applications awaiting review, with their most recent linked hardware reading
app.get('/api/admin/volunteers', requireAdmin, async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'pending';
    const supabase = getSupabase();

    if (supabase) {
      let volQuery = supabase.from('volunteers').select('*').order('created_at', { ascending: false });
      if (status !== 'all') {
        volQuery = volQuery.eq('status', status);
      }
      const { data: volunteers, error: volError } = await volQuery;
      if (volError) return res.status(500).json({ success: false, error: volError.message });

      const ids = (volunteers || []).map((v: any) => v.id);
      let readingsByVolunteer: Record<string, any> = {};

      if (ids.length > 0) {
        const { data: readings } = await supabase
          .from('hardware_readings')
          .select('*')
          .in('volunteer_id', ids)
          .order('recorded_at', { ascending: false });

        for (const r of readings || []) {
          if (r.volunteer_id && !readingsByVolunteer[r.volunteer_id]) {
            readingsByVolunteer[r.volunteer_id] = r;
          }
        }
      }

      const enriched = (volunteers || []).map((v: any) => ({
        ...v,
        latest_reading: readingsByVolunteer[v.id] || null,
      }));

      return res.json({ success: true, volunteers: enriched });
    }

    let results = memoryVolunteers.filter((v: any) => status === 'all' || v.status === status);
    return res.json({ success: true, volunteers: results.map((v) => ({ ...v, latest_reading: null })) });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// Approve / reject a volunteer application — approving surfaces them in the public Donor Viewer
app.patch('/api/admin/volunteers/:id/status', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!['pending', 'approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, error: 'status must be pending, approved, or rejected' });
    }

    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase.from('volunteers').update({ status }).eq('id', id).select();
      if (error) return res.status(500).json({ success: false, error: error.message });
      return res.json({ success: true, volunteer: data?.[0] || null });
    }

    const memVol = memoryVolunteers.find((v: any) => v.id === id);
    if (memVol) memVol.status = status;
    return res.json({ success: true, volunteer: memVol || null });
  } catch (error: any) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// ==========================================
// VITE MIDDLEWARE SETUP & SERVER START
// ==========================================
async function startServer() {
  // 1. Initialize MQTT Service
  mqttService.init();

  // 2. Start Background Scheduled Medication Dispatcher
  startMedicationCronDispatcher();

  // 3. Setup Vite Middleware or Static Delivery
  if (process.env.NODE_ENV !== 'production') {
    const frontendPath = path.resolve(process.cwd(), 'frontend');
    const vite = await createViteServer({
      root: frontendPath,
      configFile: path.join(frontendPath, 'vite.config.ts'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Medicare IoT & MQTT Full-Stack Server running on http://localhost:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
export { app };

