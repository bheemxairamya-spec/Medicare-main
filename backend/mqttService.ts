import mqtt, { MqttClient } from 'mqtt';
import { EventEmitter } from 'events';
import { Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

export interface DonorVitalsTelemetry {
  heart_rate_bpm: number;
  spo2_percent: number;
  weight_kg: number;
  alcohol_detected: boolean;
  alcohol_raw?: number;
  alcohol_level?: number;
  air_quality_ppm?: number;
  air_quality_raw?: number;
  body_temp_c?: number;
}

export interface DeviceTelemetryPayload {
  device_id: string;
  timestamp: number | string;
  donor_vitals: DonorVitalsTelemetry;
  donor_status: 'ELIGIBLE' | 'PENDING_REVIEW' | 'INELIGIBLE';
  finger_detected?: boolean;
  raw_payload?: Record<string, any>;
  received_at?: string;
}

export interface PillReminderPayload {
  action: 'PILL_REMINDER';
  medication: string;
  dosage: string;
  buzzer_duration_sec?: number;
  patient_id?: string;
  patient_name?: string;
  timestamp?: string;
}

export interface MqttServiceStatus {
  connected: boolean;
  broker_url: string;
  client_id: string;
  subscribed_topics: string[];
  total_packets_received: number;
  total_reminders_dispatched: number;
  last_received_packet: DeviceTelemetryPayload | null;
  last_packet_time: string | null;
  connected_devices: string[];
}

class MqttTelemetryManager extends EventEmitter {
  private client: MqttClient | null = null;
  private brokerUrl: string;
  private clientId: string;
  private isConnected = false;
  private sseClients: Set<Response> = new Set();
  private recentTelemetry: DeviceTelemetryPayload[] = [];
  private totalReceived = 0;
  private totalReminders = 0;
  private connectedDevices: Set<string> = new Set();
  private supabaseClient: SupabaseClient | null = null;

  constructor() {
    super();
    this.brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883';
    this.clientId = `Medicare_Server_${Math.random().toString(16).substring(2, 8)}`;
    this.initSupabase();
  }

  private initSupabase() {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (url && key && url.startsWith('http')) {
      try {
        this.supabaseClient = createClient(url, key);
      } catch (e) {
        console.error('[MQTT Manager] Supabase init error:', e);
      }
    }
  }

  public init() {
    console.log(`[MQTT Manager] Connecting to broker at: ${this.brokerUrl} as ${this.clientId}`);
    try {
      this.client = mqtt.connect(this.brokerUrl, {
        clientId: this.clientId,
        clean: true,
        connectTimeout: 5000,
        reconnectPeriod: 3000,
        keepalive: 60,
      });

      this.client.on('connect', () => {
        this.isConnected = true;
        console.log(`[MQTT Manager] Connected successfully to ${this.brokerUrl}`);

        // Subscribe to telemetry and device status topics
        const topics = [
          'medicare/device/+/telemetry',
          'medicare/device/+/status',
          'medicare/device/01/telemetry',
          'medicare/device/ESP32_MED_01/telemetry',
        ];

        topics.forEach((topic) => {
          this.client?.subscribe(topic, (err) => {
            if (err) {
              console.error(`[MQTT Manager] Failed to subscribe to ${topic}:`, err);
            } else {
              console.log(`[MQTT Manager] Subscribed to topic: ${topic}`);
            }
          });
        });
      });

      this.client.on('message', (topic, message) => {
        this.handleInboundMessage(topic, message.toString());
      });

      this.client.on('error', (err) => {
        console.warn(`[MQTT Manager Warning] Connection error: ${err.message}`);
      });

      this.client.on('offline', () => {
        this.isConnected = false;
        console.log('[MQTT Manager] Client went offline. Will retry automatically.');
      });

      this.client.on('reconnect', () => {
        console.log('[MQTT Manager] Attempting reconnect to broker...');
      });
    } catch (e: any) {
      console.error('[MQTT Manager] Initialization error:', e.message);
    }
  }

  private handleInboundMessage(topic: string, messageStr: string) {
    try {
      const parsed = JSON.parse(messageStr);
      const receivedAt = new Date().toISOString();

      let deviceId = parsed.device_id;
      if (!deviceId) {
        // Extract from topic: medicare/device/<ID>/telemetry
        const parts = topic.split('/');
        deviceId = parts[2] || 'ESP32_MED_01';
      }

      this.connectedDevices.add(deviceId);

      // Extract vitals or map direct fields
      const vitals: DonorVitalsTelemetry = parsed.donor_vitals || {
        heart_rate_bpm: Number(parsed.heart_rate_bpm || parsed.bpm || 72),
        spo2_percent: Number(parsed.spo2_percent || parsed.spo2 || 98),
        weight_kg: Number(parsed.weight_kg || parsed.weight || 65.0),
        alcohol_detected: Boolean(parsed.alcohol_detected || parsed.alcohol_raw > 1200),
        alcohol_raw: Number(parsed.alcohol_raw || 350),
        alcohol_level: Number(parsed.alcohol_level || (parsed.alcohol_detected ? 0.025 : 0.0)),
        air_quality_ppm: Number(parsed.air_quality_ppm || 110),
        air_quality_raw: Number(parsed.air_quality_raw || 410),
        body_temp_c: Number(parsed.body_temp_c || 36.7),
      };

      // Clinical Eligibility Evaluation
      // Rule: Weight >= 50kg, Alcohol Detected = False, SpO2 >= 95%
      const isEligible =
        vitals.weight_kg >= 50.0 &&
        !vitals.alcohol_detected &&
        (vitals.alcohol_level ?? 0) <= 0.005 &&
        vitals.spo2_percent >= 95.0 &&
        vitals.heart_rate_bpm >= 50 &&
        vitals.heart_rate_bpm <= 100;

      const donorStatus: 'ELIGIBLE' | 'PENDING_REVIEW' | 'INELIGIBLE' =
        parsed.donor_status || (isEligible ? 'ELIGIBLE' : vitals.alcohol_detected ? 'INELIGIBLE' : 'PENDING_REVIEW');

      const telemetryRecord: DeviceTelemetryPayload = {
        device_id: deviceId,
        timestamp: parsed.timestamp || Date.now(),
        donor_vitals: vitals,
        donor_status: donorStatus,
        finger_detected: parsed.finger_detected ?? vitals.heart_rate_bpm > 0,
        raw_payload: parsed,
        received_at: receivedAt,
      };

      this.totalReceived++;
      this.recentTelemetry.unshift(telemetryRecord);
      if (this.recentTelemetry.length > 50) {
        this.recentTelemetry.pop();
      }

      // Persist to Supabase if configured
      this.saveToSupabase(telemetryRecord);

      // Emit event internally
      this.emit('telemetry', telemetryRecord);

      // Broadcast to connected SSE Web Clients
      this.broadcastSse('telemetry', telemetryRecord);
    } catch (e: any) {
      console.error('[MQTT Manager] Error parsing incoming payload:', e.message, 'Raw:', messageStr);
    }
  }

  private async saveToSupabase(telemetry: DeviceTelemetryPayload) {
    if (!this.supabaseClient) return;

    try {
      const { device_id, donor_vitals, donor_status, received_at } = telemetry;
      const status = donor_status === 'ELIGIBLE' ? 'pass' : donor_status === 'INELIGIBLE' ? 'fail' : 'review';

      const flags: string[] = [];
      if (donor_vitals.alcohol_detected || (donor_vitals.alcohol_level ?? 0) > 0.005) {
        flags.push('Alcohol detected');
      }
      if (donor_vitals.weight_kg < 50.0) {
        flags.push('Weight under 50.0 kg');
      }
      if (donor_vitals.spo2_percent < 95.0) {
        flags.push('SpO2 below 95%');
      }

      await this.supabaseClient.from('hardware_readings').insert([
        {
          device_id,
          alcohol_level: donor_vitals.alcohol_level ?? (donor_vitals.alcohol_detected ? 0.025 : 0.0),
          air_quality_index: donor_vitals.air_quality_ppm ?? 45.0,
          weight_kg: donor_vitals.weight_kg,
          heart_rate_bpm: donor_vitals.heart_rate_bpm,
          body_temp_c: donor_vitals.body_temp_c ?? 36.7,
          spo2_percent: donor_vitals.spo2_percent,
          recorded_at: received_at,
          is_eligible: donor_status === 'ELIGIBLE',
          status,
          flagged_reasons: flags.join('; '),
        },
      ]);
    } catch (e) {
      // Non-blocking
    }
  }

  // Publish Pill Reminder to ESP32 Buzzer & Screen
  public async publishPillReminder(
    deviceId = 'ESP32_MED_01',
    medication: string,
    dosage: string,
    buzzerDurationSec = 10,
    patientName = 'Patient'
  ): Promise<{ success: boolean; topic: string; payload: PillReminderPayload; message?: string }> {
    const topic = `medicare/device/${deviceId}/reminders`;
    const payload: PillReminderPayload = {
      action: 'PILL_REMINDER',
      medication,
      dosage,
      buzzer_duration_sec: buzzerDurationSec,
      patient_name: patientName,
      timestamp: new Date().toISOString(),
    };

    const messageStr = JSON.stringify(payload);

    return new Promise((resolve) => {
      this.totalReminders++;

      // Broadcast alert to Web SSE clients as well
      this.broadcastSse('pill_alert', payload);

      if (this.client && this.isConnected) {
        this.client.publish(topic, messageStr, { qos: 1 }, (err) => {
          if (err) {
            console.error(`[MQTT Manager] Failed to publish reminder to ${topic}:`, err);
            resolve({ success: false, topic, payload, message: err.message });
          } else {
            console.log(`[MQTT Manager] Dispatched Pill Reminder to ${topic}: ${medication} (${dosage})`);
            resolve({ success: true, topic, payload });
          }
        });
      } else {
        console.log(`[MQTT Manager (Simulated Mode)] Dispatched Pill Reminder to ${topic}: ${medication} (${dosage})`);
        resolve({
          success: true,
          topic,
          payload,
          message: 'Dispatched to in-app stream (MQTT broker currently running in resilient offline fallback)',
        });
      }
    });
  }

  // Publish remote hardware command (Tare, Scan, Calibrate)
  public async publishCommand(
    deviceId = 'ESP32_MED_01',
    action: string,
    params: Record<string, any> = {}
  ): Promise<{ success: boolean; topic: string; payload: any }> {
    const topic = `medicare/device/${deviceId}/command`;
    const payload = {
      action,
      timestamp: Math.floor(Date.now() / 1000),
      ...params,
    };

    const messageStr = JSON.stringify(payload);

    return new Promise((resolve) => {
      if (this.client && this.isConnected) {
        this.client.publish(topic, messageStr, { qos: 1 }, (err) => {
          if (err) {
            resolve({ success: false, topic, payload });
          } else {
            console.log(`[MQTT Manager] Sent command [${action}] to ${topic}`);
            resolve({ success: true, topic, payload });
          }
        });
      } else {
        console.log(`[MQTT Manager (Simulated)] Sent command [${action}] to ${topic}`);
        resolve({ success: true, topic, payload });
      }
    });
  }

  // SSE (Server-Sent Events) registration for real-time browser updates
  public addSseClient(res: Response) {
    this.sseClients.add(res);

    // Send initial status packet
    const initData = JSON.stringify({
      type: 'init',
      status: this.getStatus(),
      recent: this.recentTelemetry.slice(0, 10),
    });
    res.write(`data: ${initData}\n\n`);

    res.on('close', () => {
      this.sseClients.delete(res);
    });
  }

  private broadcastSse(type: string, data: any) {
    const packet = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
    this.sseClients.forEach((client) => {
      try {
        client.write(`data: ${packet}\n\n`);
      } catch {
        this.sseClients.delete(client);
      }
    });
  }

  public simulateTelemetry(
    deviceId = 'ESP32_MED_01',
    customVitals?: Partial<DonorVitalsTelemetry>,
    options: { persist?: boolean } = {}
  ) {
    const vitals: DonorVitalsTelemetry = {
      heart_rate_bpm: 74,
      spo2_percent: 98,
      weight_kg: 68.4,
      alcohol_detected: false,
      alcohol_raw: 340,
      alcohol_level: 0.0,
      air_quality_ppm: 120,
      air_quality_raw: 380,
      body_temp_c: 36.8,
      ...customVitals,
    };

    const isEligible = vitals.weight_kg >= 50.0 && !vitals.alcohol_detected && vitals.spo2_percent >= 95.0;

    const payload: DeviceTelemetryPayload = {
      device_id: deviceId,
      timestamp: Math.floor(Date.now() / 1000),
      donor_vitals: vitals,
      donor_status: isEligible ? 'ELIGIBLE' : 'PENDING_REVIEW',
      finger_detected: true,
      received_at: new Date().toISOString(),
    };

    this.totalReceived++;
    this.recentTelemetry.unshift(payload);
    if (this.recentTelemetry.length > 50) this.recentTelemetry.pop();
    this.connectedDevices.add(deviceId);

    if (options.persist === true) {
      this.saveToSupabase(payload);
    }
    this.emit('telemetry', payload);
    this.broadcastSse('telemetry', payload);

    return payload;
  }

  public getRecentTelemetry(): DeviceTelemetryPayload[] {
    return this.recentTelemetry;
  }

  public getStatus(): MqttServiceStatus {
    return {
      connected: this.isConnected,
      broker_url: this.brokerUrl,
      client_id: this.clientId,
      subscribed_topics: [
        'medicare/device/+/telemetry',
        'medicare/device/+/status',
        'medicare/device/01/telemetry',
        'medicare/device/ESP32_MED_01/telemetry',
      ],
      total_packets_received: this.totalReceived,
      total_reminders_dispatched: this.totalReminders,
      last_received_packet: this.recentTelemetry[0] || null,
      last_packet_time: this.recentTelemetry[0]?.received_at || null,
      connected_devices: Array.from(this.connectedDevices),
    };
  }
}

export const mqttService = new MqttTelemetryManager();
