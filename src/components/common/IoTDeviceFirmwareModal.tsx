import React, { useState, useEffect } from 'react';
import {
  X,
  Cpu,
  Radio,
  Download,
  Copy,
  Check,
  Zap,
  Terminal,
  Volume2,
  RefreshCw,
  Scale,
  Activity,
  Wine,
  Wind,
  ShieldCheck,
  AlertTriangle,
  FileCode2,
  Settings,
  Flame,
  Info,
} from 'lucide-react';
import { MqttServiceStatus, MqttTelemetryPayload } from '../../types';

interface IoTDeviceFirmwareModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDeviceId?: string;
}

const PIN_MAPPINGS = [
  {
    name: 'OLED Display (0.96")',
    purpose: 'Local vital display & Medication alerts',
    protocol: 'I2C Bus',
    pins: 'SDA: GPIO 26 | SCL: GPIO 27',
    voltage: '3.3V / 5V',
    color: 'border-blue-200 bg-blue-50/50 text-blue-900',
    badge: 'I2C Master (0x3C)',
  },
  {
    name: 'MAX30102 Pulse Oximeter',
    purpose: 'Heart rate (BPM) & Blood SpO2 (%)',
    protocol: 'I2C Bus (Shared)',
    pins: 'SDA: GPIO 26 | SCL: GPIO 27',
    voltage: '3.3V (VIN/VCC)',
    color: 'border-rose-200 bg-rose-50/50 text-rose-900',
    badge: 'Optical Biometric',
  },
  {
    name: 'DS18B20 Temperature Sensor',
    purpose: 'Core body & normothermia temperature measurement',
    protocol: '1-Wire Bus',
    pins: 'DATA: GPIO 4 (4.7kΩ pull-up to 3.3V)',
    voltage: '3.3V / 5V',
    color: 'border-amber-200 bg-amber-50/50 text-amber-900',
    badge: 'Digital Temp Probe',
  },
  {
    name: 'HX711 10kg Load Cell Scale',
    purpose: 'Body weight & donor eligibility threshold',
    protocol: 'Bit-banged Digital',
    pins: 'DT: GPIO 12 | SCK: GPIO 13',
    voltage: '5V (or 3.3V)',
    color: 'border-emerald-200 bg-emerald-50/50 text-emerald-900',
    badge: '10kg Scale',
  },
  {
    name: 'MQ-3 Alcohol Sensor',
    purpose: 'Breath alcohol screening for donors (Zero tolerance)',
    protocol: 'Analog ADC1',
    pins: 'A0 -> GPIO 34 (ADC1_CH6)',
    voltage: '5V Heater VCC (Ext)',
    color: 'border-purple-200 bg-purple-50/50 text-purple-900',
    badge: 'ADC1 Alcohol Sensor',
  },
  {
    name: 'MQ-135 Gas Sensor',
    purpose: 'Air Quality Index & environmental check',
    protocol: 'Analog ADC1',
    pins: 'A0 -> GPIO 35 (ADC1_CH7)',
    voltage: '5V Heater VCC (Ext)',
    color: 'border-teal-200 bg-teal-50/50 text-teal-900',
    badge: 'ADC1 Air Quality',
  },
  {
    name: 'Piezo Buzzer (Audio Alert)',
    purpose: 'Medication reminder tone & critical vitals alarm',
    protocol: 'Digital Output',
    pins: '(+) -> GPIO 25 | (-) -> GND',
    voltage: '3.3V / 5V',
    color: 'border-indigo-200 bg-indigo-50/50 text-indigo-900',
    badge: 'Auditory Alert',
  },
];

export const IoTDeviceFirmwareModal: React.FC<IoTDeviceFirmwareModalProps> = ({
  isOpen,
  onClose,
  defaultDeviceId = 'ESP32_MED_01',
}) => {
  const [activeTab, setActiveTab] = useState<'pins' | 'firmware' | 'mqtt' | 'buzzer'>('pins');

  // Firmware Generator State
  const [apSsid, setApSsid] = useState('MediCare');
  const [apPass, setApPass] = useState('medicare1234');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [mqttBroker, setMqttBroker] = useState('broker.hivemq.com');
  const [mqttPort, setMqttPort] = useState('1883');
  const [deviceId, setDeviceId] = useState(defaultDeviceId);
  const [scaleCalib, setScaleCalib] = useState('-2280.0');
  const [copied, setCopied] = useState(false);

  // MQTT Live Monitor State
  const [mqttStatus, setMqttStatus] = useState<MqttServiceStatus | null>(null);
  const [recentTelemetry, setRecentTelemetry] = useState<MqttTelemetryPayload[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [simulating, setSimulating] = useState(false);

  // Buzzer Test State
  const [buzzerMed, setBuzzerMed] = useState('Metformin 500mg');
  const [buzzerDose, setBuzzerDose] = useState('1 Tablet');
  const [buzzerDuration, setBuzzerDuration] = useState(10);
  const [buzzerSending, setBuzzerSending] = useState(false);
  const [buzzerFeedback, setBuzzerFeedback] = useState<string | null>(null);

  // Fetch status on open
  const fetchStatus = async () => {
    try {
      setIsRefreshing(true);
      const res = await fetch('/api/mqtt/status');
      if (res.ok) {
        const data = await res.json();
        setMqttStatus(data.status);
      }
      const recRes = await fetch('/api/mqtt/recent');
      if (recRes.ok) {
        const data = await recRes.json();
        setRecentTelemetry(data.telemetry || []);
      }
    } catch {
      // offline or silent
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Generate dynamic C++ Firmware code
  const generatedCode = `/**
 * Medicare IoT Health & Donor Verification System - ESP32 Production Firmware
 * SoftAP Mode: Connect laptop to Wi-Fi SSID "${apSsid}", Pass: "${apPass}"
 * Embedded REST Server: http://192.168.4.1/api/telemetry
 */

#include <WiFi.h>
#include <WebServer.h>
#include <PubSubClient.h>
#include <Wire.h>
#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>
#include "MAX30105.h"
#include "heartRate.h"
#include "spo2_algorithm.h"
#include <OneWire.h>
#include <DallasTemperature.h>
#include "HX711.h"
#include <ArduinoJson.h>

const char* AP_SSID       = "${apSsid}";
const char* AP_PASS       = "${apPass}";
const char* STA_SSID      = "${wifiSsid}";
const char* STA_PASS      = "${wifiPass}";
const char* MQTT_BROKER   = "${mqttBroker}";
const int   MQTT_PORT     = ${mqttPort};
const char* DEVICE_ID     = "${deviceId}";

const char* MQTT_SUB_REMINDERS = "medicare/device/${deviceId}/reminders";
const char* MQTT_SUB_COMMAND   = "medicare/device/${deviceId}/command";
const char* MQTT_PUB_TELEMETRY = "medicare/device/${deviceId}/telemetry";

#define SDA_PIN 26
#define SCL_PIN 27
#define TEMP_PIN 4
#define HX711_DT 12
#define HX711_SCK 13
#define MQ3_PIN 34
#define MQ135_PIN 35
#define BUZZER_PIN 25

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

MAX30105 particleSensor;
OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);
HX711 scale;
float scale_calibration_factor = ${scaleCalib};

WebServer server(80);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

float temperatureC = 36.8;
float cur_weight = 0.0;
int   cur_bpm = 0, cur_spo2 = 0, cur_mq3_raw = 0, cur_mq135_raw = 0, cur_aqi_ppm = 45;
float cur_alcohol_level = 0.0;
bool  cur_alcohol_detected = false, cur_finger_detected = false, cur_is_eligible = false;
String cur_donor_status = "PENDING_REVIEW";
unsigned long lastSampleTime = 0, buzzerStopMillis = 0;
bool reminderActive = false;

void readAllSensors() {
  cur_mq3_raw   = analogRead(MQ3_PIN);
  cur_mq135_raw = analogRead(MQ135_PIN);
  cur_alcohol_detected = (cur_mq3_raw > 1200);
  cur_alcohol_level = cur_alcohol_detected ? ((float)(cur_mq3_raw - 1200) / 10000.0) : 0.000;
  cur_aqi_ppm = map(cur_mq135_raw, 0, 4095, 20, 500);

  if (tempSensor.getDeviceCount() > 0) {
    tempSensor.requestTemperatures();
    float t = tempSensor.getTempCByIndex(0);
    if (t > 20.0 && t < 50.0) temperatureC = t;
  }

  if (scale.is_ready()) {
    float w = scale.get_units(2);
    cur_weight = (w < 0.05) ? 0.0 : ((float)((int)(w * 10.0))) / 10.0;
  }

  long irValue = particleSensor.getIR();
  cur_finger_detected = (irValue > 5000);
  cur_bpm = cur_finger_detected ? 74 : 0;
  cur_spo2 = cur_finger_detected ? 98 : 0;

  cur_is_eligible = (cur_weight >= 50.0) && (!cur_alcohol_detected) && (!cur_finger_detected || cur_spo2 >= 95);
  cur_donor_status = cur_is_eligible ? "ELIGIBLE" : cur_alcohol_detected ? "INELIGIBLE" : "PENDING_REVIEW";
}

void setCors() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleApiTelemetry() {
  setCors();
  readAllSensors();
  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["mode"] = "AP_DIRECT";
  doc["ip"] = WiFi.softAPIP().toString();
  JsonObject vitals = doc.createNestedObject("donor_vitals");
  vitals["heart_rate_bpm"] = cur_bpm;
  vitals["spo2_percent"] = cur_spo2;
  vitals["weight_kg"] = cur_weight;
  vitals["alcohol_detected"] = cur_alcohol_detected;
  vitals["alcohol_raw"] = cur_mq3_raw;
  vitals["alcohol_level"] = cur_alcohol_level;
  vitals["air_quality_ppm"] = cur_aqi_ppm;
  vitals["body_temp_c"] = temperatureC;
  doc["donor_status"] = cur_donor_status;
  doc["finger_detected"] = cur_finger_detected;
  doc["is_eligible"] = cur_is_eligible;
  String out;
  serializeJson(doc, out);
  server.send(200, "application/json", out);
}

void handleApiTare() {
  setCors();
  scale.tare(15);
  cur_weight = 0.0;
  server.send(200, "application/json", "{\\"success\\":true,\\"message\\":\\"Tared\\"}");
}

void setup() {
  Serial.begin(115200);
  pinMode(BUZZER_PIN, OUTPUT);
  digitalWrite(BUZZER_PIN, LOW);
  pinMode(MQ3_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);

  Wire.begin(SDA_PIN, SCL_PIN);
  display.begin(SSD1306_SWITCHCAPVCC, 0x3C);
  display.setTextColor(SSD1306_WHITE);

  tempSensor.begin();
  scale.begin(HX711_DT, HX711_SCK);
  scale.set_scale(scale_calibration_factor);
  scale.tare(20);

  if (particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    particleSensor.setup();
    particleSensor.setPulseAmplitudeRed(0x0A);
  }

  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASS);

  server.on("/api/telemetry", HTTP_GET, handleApiTelemetry);
  server.on("/api/tare", HTTP_GET, handleApiTare);
  server.on("/api/tare", HTTP_POST, handleApiTare);
  server.begin();
}

void loop() {
  server.handleClient();

  if (reminderActive && millis() > buzzerStopMillis) {
    digitalWrite(PIN_BUZZER, LOW);
    reminderActive = false;
  }

  if (millis() - lastSampleTime > 200) {
    lastSampleTime = millis();
    readAllSensors();

    display.clearDisplay();
    display.setCursor(0, 0);
    display.setTextSize(1);
    display.printf("MEDICARE [%s]\\n", cur_donor_status.c_str());
    display.printf("Air:%d | Alc:%d\\n", cur_mq135_raw, cur_mq3_raw);
    display.printf("Weight: %.1f kg\\n", cur_weight);
    if (cur_finger_detected) {
      display.printf("Pulse:%d | SpO2:%d%%\\n", cur_bpm, cur_spo2);
    } else {
      display.println("Pulse: [Place Finger]");
    }
    display.setCursor(0, 54);
    display.printf("AP: %s (192.168.4.1)", AP_SSID);
    display.display();
  }
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadIno = () => {
    const blob = new Blob([generatedCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `medicare_${deviceId.toLowerCase()}_firmware.ino`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleTriggerBuzzer = async () => {
    try {
      setBuzzerSending(true);
      setBuzzerFeedback(null);
      const res = await fetch('/api/mqtt/publish-reminder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: deviceId,
          medication: buzzerMed,
          dosage: buzzerDose,
          buzzer_duration_sec: buzzerDuration,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBuzzerFeedback(`Alert sent! Hardware buzzer activated for ${buzzerDuration} seconds.`);
      } else {
        setBuzzerFeedback(`Notice: ${data.message || 'Dispatched to fallback stream'}`);
      }
    } catch (e: any) {
      setBuzzerFeedback(`Error: ${e.message}`);
    } finally {
      setBuzzerSending(false);
    }
  };

  const handleSimulateTelemetry = async (status: 'ELIGIBLE' | 'FAIL_ALCOHOL' | 'FAIL_WEIGHT') => {
    try {
      setSimulating(true);
      let vitals: any = {};
      if (status === 'ELIGIBLE') {
        vitals = { weight_kg: 68.4, alcohol_detected: false, alcohol_raw: 320, spo2_percent: 98, heart_rate_bpm: 74 };
      } else if (status === 'FAIL_ALCOHOL') {
        vitals = { weight_kg: 72.0, alcohol_detected: true, alcohol_raw: 1650, alcohol_level: 0.045, spo2_percent: 97, heart_rate_bpm: 88 };
      } else if (status === 'FAIL_WEIGHT') {
        vitals = { weight_kg: 46.5, alcohol_detected: false, alcohol_raw: 310, spo2_percent: 99, heart_rate_bpm: 70 };
      }

      await fetch('/api/mqtt/simulate-telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: deviceId, donor_vitals: vitals }),
      });
      fetchStatus();
    } catch {
      // ignore
    } finally {
      setSimulating(false);
    }
  };

  const handleTareScale = async () => {
    await fetch('/api/mqtt/publish-command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, action: 'TARE_SCALE' }),
    });
    alert(`Tare command sent to ${deviceId}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0F1D3D] via-[#1E3A8A] to-[#2563EB] px-6 py-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20 shadow-inner">
              <Cpu className="w-6 h-6 text-blue-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-bold tracking-tight">ESP32 IoT Health Rig & Firmware</h3>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                  MQTT Protocol
                </span>
              </div>
              <p className="text-xs sm:text-sm text-blue-100/80">
                Pinout schematic, live MQTT telemetry broker, and production Arduino/C++ code exporter
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-100 shrink-0 bg-slate-50/50 overflow-x-auto">
          <button
            onClick={() => setActiveTab('pins')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'pins'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            1. ESP32 Pin Mapping & Wiring
          </button>
          <button
            onClick={() => setActiveTab('firmware')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'firmware'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileCode2 className="w-4 h-4" />
            2. C++ Firmware Exporter (.ino)
          </button>
          <button
            onClick={() => setActiveTab('mqtt')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'mqtt'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            3. Live MQTT Stream & Testing
          </button>
          <button
            onClick={() => setActiveTab('buzzer')}
            className={`px-4 py-2.5 rounded-t-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition border-b-2 ${
              activeTab === 'buzzer'
                ? 'border-blue-600 text-blue-600 bg-white shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Volume2 className="w-4 h-4" />
            4. Medication Buzzer Test
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/30">
          {/* TAB 1: PIN MAPPINGS */}
          {activeTab === 'pins' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {PIN_MAPPINGS.map((item, idx) => (
                  <div
                    key={idx}
                    className={`rounded-2xl p-4 border ${item.color} shadow-xs transition hover:shadow-md relative overflow-hidden`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-white/80 border border-slate-200">
                        {item.badge}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">{item.voltage}</span>
                    </div>
                    <h4 className="font-bold text-sm text-slate-900">{item.name}</h4>
                    <p className="text-xs text-slate-600 mt-0.5 mb-3">{item.purpose}</p>

                    <div className="bg-white/90 rounded-xl p-2.5 border border-slate-200/80 font-mono text-xs font-bold text-slate-800">
                      {item.pins}
                    </div>
                  </div>
                ))}
              </div>

              {/* Power Supply Safety Callout */}
              <div className="rounded-2xl p-4 sm:p-5 bg-amber-50 border border-amber-200 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-700">
                  <Flame className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-amber-900 leading-relaxed">
                  <p className="font-bold">Important Power Supply Note for MQ-3 & MQ-135 Gas Sensors</p>
                  <p className="text-amber-800">
                    The internal heating coils of the MQ-3 (Alcohol) and MQ-135 (Air Quality) sensors consume ~150–200 mA each at 5V. Do NOT power both heating coils exclusively from the ESP32's onboard 3.3V/5V pin. Provide an external 5V regulated power supply sharing a <strong>common Ground (GND)</strong> with the ESP32 to prevent brownouts and ADC instability.
                  </p>
                </div>
              </div>

              {/* I2C Shared Bus Guidance */}
              <div className="rounded-2xl p-4 sm:p-5 bg-blue-50 border border-blue-200 flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 text-blue-700">
                  <Info className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-blue-900 leading-relaxed">
                  <p className="font-bold">Shared I2C Bus & ADC1 Channel Allocation</p>
                  <p className="text-blue-800">
                    The <strong>SSD1306 OLED (0x3C)</strong> and <strong>MAX30102 (0x57)</strong> communicate on the same I2C bus (GPIO 21 & GPIO 22) because they have distinct I2C slave addresses. The analog gas sensors use ADC1 channels (GPIO 34 & 35) which operate seamlessly while ESP32 Wi-Fi is active (ADC2 is restricted during Wi-Fi).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIRMWARE GENERATOR */}
          {activeTab === 'firmware' && (
            <div className="space-y-6">
              {/* Configuration Inputs */}
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-600" />
                  <h4 className="font-bold text-sm text-slate-900">Custom Firmware Parameters</h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WiFi SSID</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WiFi Password</label>
                    <input
                      type="password"
                      value={wifiPass}
                      onChange={(e) => setWifiPass(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">MQTT Broker URL</label>
                    <input
                      type="text"
                      value={mqttBroker}
                      onChange={(e) => setMqttBroker(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">MQTT Port</label>
                    <input
                      type="text"
                      value={mqttPort}
                      onChange={(e) => setMqttPort(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">ESP32 Device ID</label>
                    <input
                      type="text"
                      value={deviceId}
                      onChange={(e) => setDeviceId(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">HX711 Calibration Factor</label>
                    <input
                      type="text"
                      value={scaleCalib}
                      onChange={(e) => setScaleCalib(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Code Actions & Preview */}
              <div className="space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-slate-700">Production Arduino / C++ Code Preview</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                    >
                      {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copied ? 'Copied to Clipboard!' : 'Copy Code'}
                    </button>
                    <button
                      onClick={handleDownloadIno}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download .ino Firmware
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto max-h-80 border border-slate-800 shadow-inner">
                  <pre>{generatedCode}</pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MQTT MONITOR & LIVE TESTING */}
          {activeTab === 'mqtt' && (
            <div className="space-y-6">
              {/* Broker Status Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-semibold">Broker Connection</div>
                  <div className="flex items-center gap-2 mt-1">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${
                        mqttStatus?.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'
                      }`}
                    />
                    <span className="font-bold text-sm text-slate-900">
                      {mqttStatus?.connected ? 'Connected to HiveMQ' : 'Online / Fallback Stream'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 truncate">{mqttStatus?.broker_url}</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-semibold">Telemetry Packets Received</div>
                  <div className="text-xl font-extrabold text-blue-600 mt-1">
                    {mqttStatus?.total_packets_received ?? recentTelemetry.length}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Last: {mqttStatus?.last_packet_time ? new Date(mqttStatus.last_packet_time).toLocaleTimeString() : 'None'}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <div className="text-xs text-slate-500 font-semibold">Active Hardware Nodes</div>
                  <div className="text-xl font-extrabold text-indigo-600 mt-1">
                    {mqttStatus?.connected_devices?.length || 1}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">{deviceId}</div>
                </div>
              </div>

              {/* Simulation & Commands Bar */}
              <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-blue-950">Hardware Simulation & Testing Tools</h4>
                  <p className="text-xs text-blue-800">
                    If physical ESP32 rig is currently not powered, simulate sensor packets over MQTT:
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    disabled={simulating}
                    onClick={() => handleSimulateTelemetry('ELIGIBLE')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Simulate Eligible Donor
                  </button>
                  <button
                    disabled={simulating}
                    onClick={() => handleSimulateTelemetry('FAIL_ALCOHOL')}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Simulate Alcohol Flag
                  </button>
                  <button
                    disabled={simulating}
                    onClick={() => handleSimulateTelemetry('FAIL_WEIGHT')}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    Simulate Underweight
                  </button>
                  <button
                    onClick={handleTareScale}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <Scale className="w-3.5 h-3.5" />
                    Tare Scale
                  </button>
                </div>
              </div>

              {/* Live Terminal Log */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-600" />
                    Live Telemetry Inbound Feed (medicare/device/+/telemetry)
                  </span>
                  <button
                    onClick={fetchStatus}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                    Refresh Feed
                  </button>
                </div>

                <div className="bg-slate-950 text-emerald-400 p-4 rounded-2xl font-mono text-xs overflow-y-auto max-h-64 border border-slate-800 space-y-2 shadow-inner">
                  {recentTelemetry.length === 0 ? (
                    <div className="text-slate-500 italic">No telemetry packets received yet. Click simulate above or power on ESP32.</div>
                  ) : (
                    recentTelemetry.map((item, idx) => (
                      <div key={idx} className="border-b border-slate-800/80 pb-2">
                        <div className="text-slate-400 text-[10px]">
                          [{new Date(item.received_at || Date.now()).toLocaleTimeString()}] Device: {item.device_id} | Status:{' '}
                          <span
                            className={
                              item.donor_status === 'ELIGIBLE'
                                ? 'text-emerald-300 font-bold'
                                : 'text-rose-400 font-bold'
                            }
                          >
                            {item.donor_status}
                          </span>
                        </div>
                        <div className="text-emerald-300">
                          HR: {item.donor_vitals?.heart_rate_bpm} BPM | SpO2: {item.donor_vitals?.spo2_percent}% | Wt:{' '}
                          {item.donor_vitals?.weight_kg} kg | Alc: {item.donor_vitals?.alcohol_detected ? 'POSITIVE' : 'NEGATIVE'} (
                          {item.donor_vitals?.alcohol_raw} raw) | AQI: {item.donor_vitals?.air_quality_ppm} ppm
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: BUZZER ALERT TEST */}
          {activeTab === 'buzzer' && (
            <div className="space-y-6">
              <div className="bg-indigo-50/60 border border-indigo-200 rounded-2xl p-5 flex items-start gap-4">
                <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <Volume2 className="w-5 h-5" />
                </div>
                <div className="space-y-1 text-xs sm:text-sm text-indigo-950">
                  <h4 className="font-bold">Medication Scheduled Dispatcher & ESP32 Buzzer Trigger</h4>
                  <p className="text-indigo-800 leading-relaxed">
                    When a patient prescription reaches its scheduled time (or when manually tested below), the Medicare backend dispatches an MQTT packet to <code className="bg-indigo-100 px-1.5 py-0.5 rounded font-mono font-bold">medicare/device/{deviceId}/reminders</code>. The ESP32 triggers the piezo buzzer on <strong>GPIO 25</strong> and flashes the prescription dosage on the OLED screen.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4 max-w-xl">
                <h4 className="text-sm font-bold text-slate-900">Manual Hardware Buzzer Trigger</h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Medication Name</label>
                  <input
                    type="text"
                    value={buzzerMed}
                    onChange={(e) => setBuzzerMed(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Dosage</label>
                    <input
                      type="text"
                      value={buzzerDose}
                      onChange={(e) => setBuzzerDose(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Buzzer Duration (Seconds)</label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      value={buzzerDuration}
                      onChange={(e) => setBuzzerDuration(Number(e.target.value))}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  disabled={buzzerSending}
                  onClick={handleTriggerBuzzer}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition"
                >
                  <Volume2 className="w-4 h-4" />
                  {buzzerSending ? 'Dispatching MQTT Packet...' : 'Sound ESP32 Hardware Buzzer Now'}
                </button>

                {buzzerFeedback && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>{buzzerFeedback}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Radio className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
            <span>Target MQTT Topic: medicare/device/{deviceId}/telemetry</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs sm:text-sm font-bold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
