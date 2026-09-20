/**
 * ============================================================================
 * MEDICARE IoT HEALTH CHECKUP & BLOOD DONOR SYSTEM
 * ESP32 Production Firmware (Dual Mode: SoftAP + Cloud Vercel/Supabase/MQTT)
 * ============================================================================
 * 
 * HARDWARE CONNECTIONS (Exact Tested Mapping):
 * ----------------------------------------------------------------------------
 * 1. OLED Display (SSD1306 0.96" 128x64):
 *    - SDA -> GPIO 26 | SCL -> GPIO 27 | Addr: 0x3C
 * 2. MAX30102 Pulse Oximeter & Heart Rate:
 *    - SDA -> GPIO 26 | SCL -> GPIO 27 | Addr: 0x57
 * 3. DS18B20 Digital Temperature Sensor:
 *    - DATA -> GPIO 4 (with 4.7kΩ pull-up resistor to 3.3V)
 * 4. HX711 Load Cell Amplifier (10kg Scale):
 *    - DT -> GPIO 12 | SCK -> GPIO 13
 * 5. MQ-3 Breath Alcohol Sensor:
 *    - AO -> GPIO 34 (ADC1_CH6) | External 5V Heater VCC
 * 6. MQ-135 Air Quality Sensor:
 *    - AO -> GPIO 35 (ADC1_CH7) | External 5V Heater VCC
 * 7. Piezo Buzzer:
 *    - (+) -> GPIO 25 | (-) -> GND
 * 
 * ============================================================================
 * COMMUNICATION MODES:
 * 1. SoftAP Direct Wi-Fi (Field Clinics without Internet):
 *    - Creates Hotspot SSID: "MediCare" | Password: "medicare1234"
 *    - Web Server IP: 192.168.4.1 (Embedded REST API)
 * 
 * 2. Cloud Station Wi-Fi (Vercel & Supabase Sync):
 *    - Connects to your Wi-Fi router or mobile hotspot.
 *    - Automatically pushes telemetry to your Vercel endpoint:
 *      POST https://<your-project>.vercel.app/api/esp32/readings
 *    - Simultaneously publishes to MQTT: broker.hivemq.com
 * ============================================================================
 */

#include <WiFi.h>
#include <WebServer.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <Wire.h>

#include <Adafruit_GFX.h>
#include <Adafruit_SSD1306.h>

#include <MAX30105.h>
#include "heartRate.h"
#include "spo2_algorithm.h"

#include <OneWire.h>
#include <DallasTemperature.h>

#include "HX711.h"
#include <ArduinoJson.h>

// ============================================================
// CONFIGURATION: Access Point, Station Wi-Fi & Cloud Sync
// ============================================================
// 1. SoftAP Mode Settings (Connect Laptop to this Wi-Fi hotspot)
const char* AP_SSID       = "MediCare";
const char* AP_PASS       = "medicare1234";

// 2. Station Wi-Fi Settings (Enter your Home / Mobile hotspot Wi-Fi to sync with Cloud)
const char* STA_SSID      = "Meradhil"; // e.g., "MyPhoneHotspot"
const char* STA_PASS      = "87654321"; // e.g., "myPassword"

// 2b. Static IP Configuration (Assigns fixed IP on Windows Mobile Hotspot / Local Network)
const bool  USE_STATIC_IP = false;                 // Set true to lock fixed IP
IPAddress   STATIC_IP(192, 168, 137, 133);        // Fixed IP for ESP32
IPAddress   GATEWAY(192, 168, 137, 1);            // Windows Hotspot Gateway
IPAddress   SUBNET(255, 255, 255, 0);             // Subnet Mask
IPAddress   PRIMARY_DNS(8, 8, 8, 8);              // DNS Server

// 3. Direct Supabase Cloud Database Configuration
// When connected to Wi-Fi, the ESP32 pushes live telemetry directly into your Supabase PostgreSQL table!
const char* SUPABASE_URL      = "https://xcthoaxwzlenryycrrxs.supabase.co";
// The Supabase key must not be stored in firmware (it ships in plaintext on the device); leave empty.
const char* SUPABASE_ANON_KEY = "";
const char* SUPABASE_TABLE    = "hardware_readings";

// The Node backend already saves every MQTT telemetry packet to Supabase; keep this off to avoid duplicate rows.
const bool ENABLE_DIRECT_SUPABASE_PUSH = false;

// 4. Vercel Cloud Endpoint (Alternative: auto-syncs live data via Vercel Express API)
const char* CLOUD_API_URL = "https://your-medicare-app.vercel.app/api/esp32/readings";

// 5. MQTT Broker Settings
const char* MQTT_BROKER   = "broker.hivemq.com";
const int   MQTT_PORT     = 1883;
const char* DEVICE_ID     = "ESP32_MED_01";
const char* MQTT_SUB_REMINDERS = "medicare/device/ESP32_MED_01/reminders";
const char* MQTT_SUB_COMMAND   = "medicare/device/ESP32_MED_01/command";
const char* MQTT_PUB_TELEMETRY = "medicare/device/ESP32_MED_01/telemetry";

// ============================================================
// PIN DEFINITIONS
// ============================================================
#define SDA_PIN 26
#define SCL_PIN 27
#define TEMP_PIN 4
#define HX711_DT  12
#define HX711_SCK 13
#define MQ3_PIN   34
#define MQ135_PIN 35
#define BUZZER_PIN 25

#define SCREEN_WIDTH 128
#define SCREEN_HEIGHT 64
#define OLED_RESET -1
#define OLED_ADDRESS 0x3C
Adafruit_SSD1306 display(SCREEN_WIDTH, SCREEN_HEIGHT, &Wire, OLED_RESET);

MAX30105 particleSensor;
OneWire oneWire(TEMP_PIN);
DallasTemperature tempSensor(&oneWire);
HX711 scale;

WebServer server(80);
WiFiClient espClient;
PubSubClient mqttClient(espClient);

// ============================================================
// SENSOR DATA VARIABLES & BUFFERS
// ============================================================
float temperatureC = 36.8;
float calibrationFactor = -2280.0;
float weightKg = 0.0;

int mq3Value = 0;
float alcoholLevel = 0.000;
bool alcoholDetected = false;
int mq135Value = 0;
int airQualityPpm = 45;

long irValue = 0;
long redValue = 0;
float heartRate = 0.0;
float averageHeartRate = 0.0;
int spo2 = 0;
bool validHeartRate = false;
bool validSpO2 = false;

const byte RATE_SIZE = 8;
byte rates[RATE_SIZE];
byte rateSpot = 0;
long lastBeat = 0;

#define BUFFER_SIZE 100
uint32_t irBuffer[BUFFER_SIZE];
uint32_t redBuffer[BUFFER_SIZE];
int bufferIndex = 0;
bool spo2Ready = false;

bool isEligible = false;
String donorStatus = "PENDING_REVIEW";

bool buzzerState = false;
bool reminderActive = false;
unsigned long buzzerStopMillis = 0;
String activePillName = "";
String activePillDose = "";

// Timers
unsigned long lastTempRead = 0;
unsigned long lastWeightRead = 0;
unsigned long lastMQRead = 0;
unsigned long lastOLEDUpdate = 0;
unsigned long lastCloudSync = 0;
unsigned long lastMqttPublish = 0;

const unsigned long TEMP_INTERVAL = 1000;
const unsigned long WEIGHT_INTERVAL = 400;
const unsigned long MQ_INTERVAL = 400;
const unsigned long OLED_INTERVAL = 400;
const unsigned long CLOUD_SYNC_INTERVAL = 4000; // Push to Vercel/Supabase every 4s
const unsigned long MQTT_INTERVAL = 3000;

// ============================================================
// BUZZER HELPERS
// ============================================================
void buzzerOn() {
  digitalWrite(BUZZER_PIN, HIGH);
  buzzerState = true;
}

void buzzerOff() {
  digitalWrite(BUZZER_PIN, LOW);
  buzzerState = false;
}

void beep(int durationMs = 120) {
  buzzerOn();
  delay(durationMs);
  buzzerOff();
}

// ============================================================
// SENSOR ACQUISITION ROUTINES
// ============================================================
void readMAX30102() {
  if (!particleSensor.available()) {
    particleSensor.check();
  }
  if (!particleSensor.available()) return;

  redValue = particleSensor.getRed();
  irValue  = particleSensor.getIR();
  particleSensor.nextSample();

  if (irValue < 5000) {
    validHeartRate = false;
    heartRate = 0;
    averageHeartRate = 0;
    spo2 = 0;
    validSpO2 = false;
    bufferIndex = 0;
    rateSpot = 0;
    lastBeat = 0;
    return;
  }

  if (checkForBeat(irValue)) {
    long currentBeat = millis();
    long delta = currentBeat - lastBeat;
    lastBeat = currentBeat;

    if (delta > 300 && delta < 1500) {
      float bpm = 60000.0 / delta;
      if (bpm > 40 && bpm < 180) {
        heartRate = bpm;
        rates[rateSpot++] = (byte)bpm;
        rateSpot %= RATE_SIZE;

        float total = 0;
        byte count = 0;
        for (byte i = 0; i < RATE_SIZE; i++) {
          if (rates[i] > 0) {
            total += rates[i];
            count++;
          }
        }
        if (count > 0) {
          averageHeartRate = total / count;
          validHeartRate = true;
        }
      }
    }
  }

  if (bufferIndex < BUFFER_SIZE) {
    irBuffer[bufferIndex] = irValue;
    redBuffer[bufferIndex] = redValue;
    bufferIndex++;
  }

  if (bufferIndex >= BUFFER_SIZE) {
    spo2Ready = true;
    bufferIndex = 0;
  }
}

void updateSpO2() {
  int32_t calculatedSpO2;
  int8_t  calculatedSpO2Valid;
  int32_t calculatedHeartRate;
  int8_t  calculatedHeartRateValid;

  maxim_heart_rate_and_oxygen_saturation(
    irBuffer,
    BUFFER_SIZE,
    redBuffer,
    &calculatedSpO2,
    &calculatedSpO2Valid,
    &calculatedHeartRate,
    &calculatedHeartRateValid
  );

  if (calculatedSpO2Valid && calculatedSpO2 > 70 && calculatedSpO2 <= 100) {
    spo2 = calculatedSpO2;
    validSpO2 = true;
  }

  if (calculatedHeartRateValid && calculatedHeartRate > 40 && calculatedHeartRate < 180) {
    if (!validHeartRate) {
      heartRate = calculatedHeartRate;
      averageHeartRate = calculatedHeartRate;
      validHeartRate = true;
    }
  }
}

void readTemperature() {
  if (tempSensor.getDeviceCount() == 0) return;
  tempSensor.requestTemperatures();
  float newTemp = tempSensor.getTempCByIndex(0);
  if (newTemp != DEVICE_DISCONNECTED_C && newTemp > 20.0 && newTemp < 50.0) {
    temperatureC = newTemp;
  }
}

void readWeight() {
  if (!scale.is_ready()) {
    Serial.println("[Weight Calib] HX711 not ready — check wiring: DT->GPIO12, SCK->GPIO13, VCC/GND");
    return;
  }
  float newWeight = scale.get_units(5);
  Serial.printf("[Weight Calib] Raw reading: %.3f kg (calibrationFactor=%.1f)\n", newWeight, calibrationFactor);
  if (newWeight < 0.05 && newWeight > -0.5) newWeight = 0.0;
  if (newWeight < 0) {
    weightKg = 0.0;
  } else {
    weightKg = ((float)((int)(newWeight * 10.0))) / 10.0;
  }
}

void readMQSensors() {
  mq3Value   = analogRead(MQ3_PIN);
  mq135Value = analogRead(MQ135_PIN);
  alcoholDetected = (mq3Value > 1200);
  alcoholLevel = alcoholDetected ? ((float)(mq3Value - 1200) / 10000.0) : 0.000;
  airQualityPpm = map(mq135Value, 0, 4095, 20, 500);
}

void evaluateEligibility() {
  bool weightOk = (weightKg >= 50.0);
  bool alcoholOk = (!alcoholDetected);
  bool oximeterOk = (!validHeartRate && !validSpO2) || (spo2 >= 95 && averageHeartRate >= 50 && averageHeartRate <= 100);

  isEligible = weightOk && alcoholOk && oximeterOk;

  if (alcoholDetected) {
    donorStatus = "INELIGIBLE_ALCOHOL";
  } else if (weightKg > 0.0 && weightKg < 50.0) {
    donorStatus = "INELIGIBLE_WEIGHT";
  } else if (isEligible) {
    donorStatus = "ELIGIBLE";
  } else {
    donorStatus = "PENDING_REVIEW";
  }
}

// ============================================================
// CLOUD SYNC: Push Telemetry Directly to Supabase & Vercel
// ============================================================
void syncToSupabaseAndCloud() {
  if (WiFi.status() != WL_CONNECTED) return;

  // 1. Direct Supabase REST API Push (HTTPS POST)
  if (ENABLE_DIRECT_SUPABASE_PUSH && strlen(SUPABASE_URL) > 0 && strlen(SUPABASE_ANON_KEY) > 0) {
    WiFiClientSecure secureClient;
    secureClient.setInsecure(); // Disable strict cert check for embedded HTTPS

    HTTPClient http;
    String supabaseRestUrl = String(SUPABASE_URL) + "/rest/v1/" + String(SUPABASE_TABLE);

    if (http.begin(secureClient, supabaseRestUrl)) {
      http.addHeader("Content-Type", "application/json");
      http.addHeader("apikey", SUPABASE_ANON_KEY);
      http.addHeader("Authorization", String("Bearer ") + SUPABASE_ANON_KEY);
      http.addHeader("Prefer", "return=minimal");

      StaticJsonDocument<384> doc;
      doc["id"] = String("esp32-") + String(millis()) + "-" + String(random(1000, 9999));
      doc["device_id"] = DEVICE_ID;
      doc["alcohol_level"] = alcoholLevel;
      doc["air_quality_index"] = airQualityPpm;
      doc["weight_kg"] = weightKg;
      doc["heart_rate_bpm"] = validHeartRate ? (int)averageHeartRate : 0;
      doc["body_temp_c"] = temperatureC;
      doc["spo2_percent"] = validSpO2 ? spo2 : 0.0;
      doc["is_eligible"] = isEligible;
      doc["status"] = isEligible ? "pass" : (alcoholDetected ? "fail" : "review");
      doc["flagged_reasons"] = isEligible ? "" : (alcoholDetected ? "Alcohol detected" : "Underweight");

      String payload;
      serializeJson(doc, payload);

      int httpCode = http.POST(payload);
      if (httpCode >= 200 && httpCode < 300) {
        Serial.printf("[Supabase Direct] Saved to PostgreSQL table '%s' (HTTP %d)\n", SUPABASE_TABLE, httpCode);
      } else {
        Serial.printf("[Supabase Direct Error] HTTP %d\n", httpCode);
      }
      http.end();
    }
  }

  // 2. Vercel API Push (If configured)
  if (strlen(CLOUD_API_URL) > 0 && strstr(CLOUD_API_URL, "your-medicare-app") == NULL) {
    HTTPClient vHttp;
    vHttp.begin(CLOUD_API_URL);
    vHttp.addHeader("Content-Type", "application/json");

    StaticJsonDocument<384> vDoc;
    vDoc["device_id"] = DEVICE_ID;
    vDoc["alcohol_level"] = alcoholLevel;
    vDoc["air_quality_index"] = airQualityPpm;
    vDoc["weight_kg"] = weightKg;
    vDoc["heart_rate_bpm"] = validHeartRate ? (int)averageHeartRate : 0;
    vDoc["body_temp_c"] = temperatureC;
    vDoc["spo2_percent"] = validSpO2 ? spo2 : 0.0;

    String vPayload;
    serializeJson(vDoc, vPayload);
    int vCode = vHttp.POST(vPayload);
    if (vCode > 0) {
      Serial.printf("[Vercel Sync] Telemetry dispatched (HTTP %d)\n", vCode);
    }
    vHttp.end();
  }
}

// ============================================================
// REST API ENDPOINTS (SoftAP Direct Web Access)
// ============================================================
void setCorsHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-requested-with");
}

void handleOptions() {
  setCorsHeaders();
  server.send(204);
}

void handleApiTelemetry() {
  setCorsHeaders();
  readTemperature();
  readWeight();
  readMQSensors();
  evaluateEligibility();

  StaticJsonDocument<512> doc;
  doc["device_id"] = DEVICE_ID;
  doc["mode"] = "AP_DIRECT";
  doc["ap_ssid"] = AP_SSID;
  doc["ip"] = WiFi.softAPIP().toString();
  doc["timestamp"] = (unsigned long)(millis() / 1000);

  JsonObject vitals = doc.createNestedObject("donor_vitals");
  vitals["heart_rate_bpm"] = validHeartRate ? (int)averageHeartRate : 0;
  vitals["spo2_percent"] = validSpO2 ? spo2 : 0;
  vitals["weight_kg"] = weightKg;
  vitals["alcohol_detected"] = alcoholDetected;
  vitals["alcohol_raw"] = mq3Value;
  vitals["alcohol_level"] = alcoholLevel;
  vitals["air_quality_ppm"] = airQualityPpm;
  vitals["air_quality_raw"] = mq135Value;
  vitals["body_temp_c"] = temperatureC;

  doc["donor_status"] = donorStatus;
  doc["finger_detected"] = (irValue >= 5000);
  doc["is_eligible"] = isEligible;

  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleApiTare() {
  setCorsHeaders();
  scale.tare(15);
  weightKg = 0.0;
  StaticJsonDocument<128> doc;
  doc["success"] = true;
  doc["message"] = "Scale tared to 0.00 kg";
  doc["weight_kg"] = 0.0;
  String output;
  serializeJson(doc, output);
  server.send(200, "application/json", output);
}

void handleApiReminder() {
  setCorsHeaders();
  String body = server.arg("plain");
  String med = "Prescription";
  String dosage = "1 Dose";
  int durationSec = 10;

  if (body.length() > 0) {
    StaticJsonDocument<256> doc;
    if (!deserializeJson(doc, body)) {
      med = doc["medication"] | "Prescription";
      dosage = doc["dosage"] | "1 Dose";
      durationSec = doc["buzzer_duration_sec"] | 10;
    }
  }

  activePillName = med;
  activePillDose = dosage;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);
  display.setCursor(0, 0);
  display.setTextSize(1);
  display.println(">> MEDICATION ALERT <<");
  display.println("Take Prescription:");
  display.setTextSize(2);
  display.println(activePillName.substring(0, 10));
  display.setTextSize(1);
  display.println(activePillDose);
  display.display();

  buzzerOn();
  buzzerStopMillis = millis() + (durationSec * 1000UL);
  reminderActive = true;

  StaticJsonDocument<128> resp;
  resp["success"] = true;
  resp["message"] = "Buzzer alert triggered on ESP32 (GPIO 25)";
  resp["duration_sec"] = durationSec;
  String out;
  serializeJson(resp, out);
  server.send(200, "application/json", out);
}

void handleRoot() {
  setCorsHeaders();
  readTemperature();
  readWeight();
  readMQSensors();
  evaluateEligibility();

  String html = "<!DOCTYPE html><html><head><meta charset='utf-8'><title>Medicare IoT System</title>";
  html += "<meta name='viewport' content='width=device-width, initial-scale=1'>";
  html += "<style>body{font-family:sans-serif;background:#0f172a;color:#f8fafc;padding:20px;text-align:center}";
  html += ".card{background:#1e293b;border-radius:16px;padding:20px;margin:15px auto;max-width:440px;box-shadow:0 10px 15px -3px rgba(0,0,0,0.4)}";
  html += ".val{font-size:20px;font-weight:bold;color:#38bdf8;margin:8px 0;text-align:left;display:flex;justify-content:space-between}";
  html += ".badge{display:inline-block;padding:6px 14px;border-radius:999px;font-size:13px;font-weight:bold;margin-top:10px}";
  html += ".pass{background:#166534;color:#86efac}.fail{background:#991b1b;color:#fca5a5}";
  html += "button{background:#2563eb;color:white;border:none;padding:10px 16px;border-radius:8px;font-weight:bold;cursor:pointer;margin:6px}";
  html += "</style></head><body>";
  html += "<h2>🏥 Medicare ESP32 IoT Rig</h2>";
  html += "<div class='card'>";
  html += "<div style='font-size:13px;color:#94a3b8'>Wi-Fi: <strong style='color:#fff'>" + String(AP_SSID) + "</strong> | IP: <strong style='color:#38bdf8'>" + WiFi.softAPIP().toString() + "</strong></div>";
  html += "<hr style='border-color:#334155;margin:14px 0'>";
  html += "<div class='val'><span>Body Weight:</span> <span>" + String(weightKg, 2) + " kg</span></div>";
  html += "<div class='val'><span>Heart Rate:</span> <span>" + String(validHeartRate ? (int)averageHeartRate : 0) + " BPM</span></div>";
  html += "<div class='val'><span>Oxygen (SpO2):</span> <span>" + String(validSpO2 ? spo2 : 0) + " %</span></div>";
  html += "<div class='val'><span>DS18B20 Temp:</span> <span>" + String(temperatureC, 1) + " &deg;C</span></div>";
  html += "<div class='val'><span>MQ-3 Alcohol:</span> <span>" + String(mq3Value) + " (" + (alcoholDetected ? "<span style='color:#f87171'>POSITIVE</span>" : "<span style='color:#4ade80'>CLEAN</span>") + ")</span></div>";
  html += "<div class='val'><span>MQ-135 Air Quality:</span> <span>" + String(airQualityPpm) + " ppm</span></div>";
  html += "<div><span class='badge " + String(isEligible ? "pass" : "fail") + "'>" + donorStatus + "</span></div>";
  html += "<div style='margin-top:16px'>";
  html += "<button onclick='fetch(\"/api/tare\").then(()=>location.reload())'>Tare Scale (0 kg)</button>";
  html += "<button onclick='fetch(\"/api/reminder\",{method:\"POST\",body:JSON.stringify({medication:\"Aspirin\",dosage:\"100mg\"})}).then(()=>alert(\"Buzzer Beeped!\"))'>Test Buzzer</button>";
  html += "</div>";
  html += "</div>";
  html += "<p style='color:#64748b;font-size:12px'>REST API Endpoint: <a style='color:#38bdf8' href='/api/telemetry'>/api/telemetry</a></p>";
  html += "</body></html>";

  server.send(200, "text/html", html);
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, payload, length)) return;

  const char* action = doc["action"];
  if (action && strcmp(action, "PILL_REMINDER") == 0) {
    const char* med = doc["medication"] | "Scheduled Dose";
    const char* dosage = doc["dosage"] | "1 Tablet";
    int durationSec = doc["buzzer_duration_sec"] | 10;

    activePillName = String(med);
    activePillDose = String(dosage);

    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setCursor(0, 0);
    display.setTextSize(1);
    display.println(">> MEDICATION ALERT <<");
    display.println("Take Prescription:");
    display.setTextSize(2);
    display.println(activePillName.substring(0, 10));
    display.setTextSize(1);
    display.println(activePillDose);
    display.display();

    buzzerOn();
    buzzerStopMillis = millis() + (durationSec * 1000UL);
    reminderActive = true;
  } else if (action && strcmp(action, "TARE_SCALE") == 0) {
    scale.tare(15);
    weightKg = 0.0;
  }
}

void reconnectMQTT() {
  if (WiFi.status() != WL_CONNECTED) return;
  int retries = 0;
  while (!mqttClient.connected() && retries < 2) {
    String clientId = "ESP32_Medicare_" + String(random(0xffff), HEX);
    if (mqttClient.connect(clientId.c_str())) {
      mqttClient.subscribe(MQTT_SUB_REMINDERS);
      mqttClient.subscribe(MQTT_SUB_COMMAND);
      break;
    }
    delay(500);
    retries++;
  }
}

void updateOLED() {
  if (reminderActive) return;

  display.clearDisplay();
  display.setTextColor(SSD1306_WHITE);

  // --- Header Row (Y: 0) ---
  display.setTextSize(1);
  display.setCursor(0, 0);
  display.print("MEDICARE");
  display.setCursor(76, 0);
  if (isEligible) {
    display.print("[PASS]");
  } else if (alcoholDetected) {
    display.print("[FAIL]");
  } else {
    display.print("[CHECK]");
  }
  display.drawLine(0, 9, 127, 9, SSD1306_WHITE);

  // --- Vitals Row 1: Heart Rate & SpO2 (Y: 13) ---
  display.setCursor(0, 13);
  display.print("HR: ");
  if (validHeartRate) {
    display.print((int)averageHeartRate);
    display.print(" BPM");
  } else {
    display.print("-- BPM");
  }

  display.setCursor(68, 13);
  display.print("SpO2: ");
  if (validSpO2) {
    display.print(spo2);
    display.print("%");
  } else {
    display.print("--%");
  }

  // --- Vitals Row 2: Temperature & Weight (Y: 25) ---
  display.setCursor(0, 25);
  display.print("Temp: ");
  display.print(temperatureC, 1);
  display.print("C");

  display.setCursor(68, 25);
  display.print("Wt: ");
  display.print(weightKg, 1);
  display.print("kg");

  // --- Vitals Row 3: Alcohol & Air Quality (Y: 37) ---
  display.setCursor(0, 37);
  display.print("Alc: ");
  display.print(alcoholDetected ? "ALERT" : "0.00%");

  display.setCursor(68, 37);
  display.print("AQI: ");
  display.print(airQualityPpm);
  display.print("ppm");

  // --- Bottom Divider Line (Y: 48) ---
  display.drawLine(0, 48, 127, 48, SSD1306_WHITE);

  // --- Bottom Status Bar (Y: 52) - No IP Address ---
  display.setCursor(0, 52);
  if (alcoholDetected) {
    display.print("FAIL: ALCOHOL DETECTED");
  } else if (weightKg > 0.0 && weightKg < 50.0) {
    display.print("FAIL: UNDERWEIGHT <50k");
  } else if (isEligible) {
    display.print("STATUS: DONOR ELIGIBLE");
  } else {
    display.print("STATUS: SENSORS READY");
  }

  display.display();
}

void setup() {
  Serial.begin(115200);
  delay(500);

  pinMode(BUZZER_PIN, OUTPUT);
  buzzerOff();

  analogReadResolution(12);
  pinMode(MQ3_PIN, INPUT);
  pinMode(MQ135_PIN, INPUT);

  Wire.begin(SDA_PIN, SCL_PIN);

  if (display.begin(SSD1306_SWITCHCAPVCC, OLED_ADDRESS)) {
    display.clearDisplay();
    display.setTextColor(SSD1306_WHITE);
    display.setTextSize(1);
    display.setCursor(16, 6);
    display.println("MEDICARE HEALTH");
    display.drawLine(0, 18, 127, 18, SSD1306_WHITE);
    display.setCursor(8, 28);
    display.println("IoT Telemetry Station");
    display.setCursor(8, 44);
    display.println("Calibrating Sensors...");
    display.display();
  }

  tempSensor.begin();

  scale.begin(HX711_DT, HX711_SCK);
  scale.set_scale(calibrationFactor);
  if (scale.is_ready()) {
    scale.tare(20);
  }

  if (particleSensor.begin(Wire, I2C_SPEED_FAST)) {
    byte ledBrightness = 25;
    byte sampleAverage = 4;
    byte ledMode = 2;
    int sampleRate = 100;
    int pulseWidth = 411;
    int adcRange = 16384;
    particleSensor.setup(ledBrightness, sampleAverage, ledMode, sampleRate, pulseWidth, adcRange);
    particleSensor.setPulseAmplitudeGreen(0);
  }

  // Start in Dual Wi-Fi Mode (SoftAP Hotspot + Station Client)
  WiFi.mode(WIFI_AP_STA);
  WiFi.softAP(AP_SSID, AP_PASS);

  if (strlen(STA_SSID) > 0) {
    if (USE_STATIC_IP) {
      WiFi.config(STATIC_IP, GATEWAY, SUBNET, PRIMARY_DNS);
      Serial.printf("[Wi-Fi Static IP] Configured: %s\n", STATIC_IP.toString().c_str());
    }
    Serial.printf("[Wi-Fi Station] Connecting to %s...\n", STA_SSID);
    WiFi.begin(STA_SSID, STA_PASS);
    mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
    mqttClient.setCallback(mqttCallback);
    mqttClient.setBufferSize(512);
  }

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/telemetry", HTTP_GET, handleApiTelemetry);
  server.on("/api/tare", HTTP_GET, handleApiTare);
  server.on("/api/tare", HTTP_POST, handleApiTare);
  server.on("/api/reminder", HTTP_GET, handleApiReminder);
  server.on("/api/reminder", HTTP_POST, handleApiReminder);
  server.on("/api/telemetry", HTTP_OPTIONS, handleOptions);
  server.on("/api/tare", HTTP_OPTIONS, handleOptions);
  server.on("/api/reminder", HTTP_OPTIONS, handleOptions);

  server.begin();

  beep(120);
  delay(100);
  beep(120);

  updateOLED();
}

void loop() {
  unsigned long currentMillis = millis();

  // 0. Report Wi-Fi Station Connection Status Changes
  static bool wifiWasConnected = false;
  if (WiFi.status() == WL_CONNECTED) {
    if (!wifiWasConnected) {
      wifiWasConnected = true;
      Serial.print("[Wi-Fi Station] Connected! ESP32 IP: ");
      Serial.print(WiFi.localIP());
      Serial.print("  Gateway: ");
      Serial.println(WiFi.gatewayIP());
    }
  } else {
    if (wifiWasConnected) {
      wifiWasConnected = false;
      Serial.println("[Wi-Fi Station] Disconnected");
    }
  }

  // 1. Process Embedded Web Server Requests (SoftAP)
  server.handleClient();

  // 2. Process MQTT Client (Station Wi-Fi)
  if (WiFi.status() == WL_CONNECTED) {
    if (!mqttClient.connected()) reconnectMQTT();
    mqttClient.loop();
  }

  // 3. Buzzer Auto-Cutoff
  if (reminderActive && currentMillis > buzzerStopMillis) {
    buzzerOff();
    reminderActive = false;
  }

  // 4. Sensor Sampling
  readMAX30102();

  if (spo2Ready) {
    updateSpO2();
    spo2Ready = false;
  }

  if (currentMillis - lastTempRead >= TEMP_INTERVAL) {
    lastTempRead = currentMillis;
    readTemperature();
  }

  if (currentMillis - lastWeightRead >= WEIGHT_INTERVAL) {
    lastWeightRead = currentMillis;
    readWeight();
  }

  if (currentMillis - lastMQRead >= MQ_INTERVAL) {
    lastMQRead = currentMillis;
    readMQSensors();
    evaluateEligibility();
  }

  if (currentMillis - lastOLEDUpdate >= OLED_INTERVAL) {
    lastOLEDUpdate = currentMillis;
    updateOLED();
  }

  // 5. Periodic Cloud Push directly to Supabase & Vercel
  if (WiFi.status() == WL_CONNECTED && currentMillis - lastCloudSync >= CLOUD_SYNC_INTERVAL) {
    lastCloudSync = currentMillis;
    syncToSupabaseAndCloud();
  }

  // 6. Periodic MQTT Telemetry Publish
  if (WiFi.status() == WL_CONNECTED && mqttClient.connected() && currentMillis - lastMqttPublish >= MQTT_INTERVAL) {
    lastMqttPublish = currentMillis;

    StaticJsonDocument<384> payload;
    payload["device_id"] = DEVICE_ID;
    payload["timestamp"] = (unsigned long)(currentMillis / 1000);

    JsonObject vitals = payload.createNestedObject("donor_vitals");
    vitals["heart_rate_bpm"] = validHeartRate ? (int)averageHeartRate : 0;
    vitals["spo2_percent"] = validSpO2 ? spo2 : 0;
    vitals["weight_kg"] = weightKg;
    vitals["alcohol_detected"] = alcoholDetected;
    vitals["alcohol_raw"] = mq3Value;
    vitals["alcohol_level"] = alcoholLevel;
    vitals["air_quality_ppm"] = airQualityPpm;
    vitals["air_quality_raw"] = mq135Value;
    vitals["body_temp_c"] = temperatureC;

    payload["donor_status"] = donorStatus;
    payload["finger_detected"] = (irValue >= 5000);
    payload["is_eligible"] = isEligible;

    char buffer[400];
    serializeJson(payload, buffer);
    if (mqttClient.publish(MQTT_PUB_TELEMETRY, buffer)) {
      Serial.println("[MQTT] Telemetry published");
    } else {
      Serial.println("[MQTT] Publish failed");
    }
  }

  delay(2);
}
