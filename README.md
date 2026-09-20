# 🏥 MediCare - Connected IoT Health & Blood Donor Verification System

A full-stack, connected IoT healthcare platform integrating live **ESP32 biomedical sensor telemetry**, **blood donor verification & dispatch network**, **prescription adherence tracker**, and **preventive health modules**.

---

## 🌟 Key Features

1. **🏥 General Health Checkup & IoT Telemetry**:
   - Real-time ESP32 vitals acquisition: Heart Rate & SpO₂ (MAX30102), Core Body Temperature (DS18B20), Weight Scale (HX711), Alcohol Screening (MQ-3), and Air Quality (MQ-135).
   - Dynamic blood sugar & blood pressure trackers with clinical reference indicators.
   - Evidence-based diet & daily habit streak monitor.

2. **🩸 Verified Blood Donor Portal & Emergency Dispatch**:
   - Multi-step volunteer registration with biometric qualification screening.
   - Real-time emergency blood donor locator & hospital broadcast alerts.
   - Tamper-proof digital donor inspection card with QR verification.

3. **💊 Smart Medi Reminder**:
   - 3-step Rx scheduler and dosage reminder dispatcher.
   - Remote ESP32 piezo buzzer trigger & OLED display alerts via MQTT (`broker.hivemq.com`).
   - Daily compliance log and dose adherence tracking.

4. **⚡ Quad-Channel Telemetry Pipeline**:
   - **Direct Supabase REST API Push**: Direct HTTPS insertion from ESP32 to PostgreSQL.
   - **Real-Time MQTT Stream**: Sub-second dashboard broadcast and remote buzzer control.
   - **SoftAP Direct Embedded Web Server**: Field clinic access on `http://192.168.4.1/api/telemetry`.
   - **Multi-IP Auto-Detection**: Seamless sync over Windows Mobile Hotspot (`192.168.137.133`).

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Canvas Confetti
- **Backend**: Node.js, Express, TypeScript (`tsx`), MQTT (`mqtt`), Supabase Client (`@supabase/supabase-js`)
- **Database & Cloud Storage**: Supabase (PostgreSQL, Storage Buckets, Row-Level Security, Auth)
- **Firmware**: C++ Arduino ESP32 (`firmware/medicare_esp32_firmware.ino`) with Adafruit SSD1306, MAX30105, OneWire, DallasTemperature, HX711, PubSubClient, ArduinoJson

---

## 🚀 Getting Started

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/vishal007-hacker/MediCare.git
cd MediCare
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and fill in your Supabase credentials:
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"
```

### 3. Run Development Server
```bash
npm run dev
```
The full-stack application will start at `http://localhost:5173`.

### 4. Flash ESP32 Firmware
1. Open `firmware/medicare_esp32_firmware.ino` in Arduino IDE or VS Code PlatformIO.
2. Configure your Wi-Fi Hotspot name & password:
   ```cpp
   const char* STA_SSID = "MyPhoneHotspot";
   const char* STA_PASS = "myPassword";
   ```
3. Select board `ESP32 Dev Module` and flash to your device.
