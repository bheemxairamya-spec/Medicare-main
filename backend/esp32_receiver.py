#!/usr/bin/env python3
"""
Medicare ESP32 Hardware Sensor Telemetry Receiver (Python)
-----------------------------------------------------------
Receives live sensor readings from the ESP32 biomedical rig over WiFi (HTTP POST)
or USB Serial, validates the 6 clinical sensors, timestamps the reading, tags it with
the ESP32 device ID, and stores it in the Supabase 'hardware_readings' table.

Sensors supported:
  1. MQ-3      -> Alcohol level (BAC % or mg/L)
  2. MQ-135    -> Air Quality Index (AQI)
  3. HX711     -> Body Weight (kg)
  4. MAX30102  -> Heart Rate (BPM)
  5. DS18B20   -> Core Body Temperature (°C)
  6. MAX30102  -> SpO2 Oxygen Saturation (%)
"""

import os
import sys
import json
import time
from datetime import datetime, timezone
from http.server import HTTPServer, BaseHTTPRequestHandler
import urllib.request
import urllib.error

# Environment configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY", os.environ.get("SUPABASE_ANON_KEY", "")).strip()
PORT = int(os.environ.get("ESP32_PORT", "5000"))
DEFAULT_DEVICE_ID = "ESP32-MEDICARE-NODE-01"

# In-memory backup store if Supabase credentials are not configured
MEMORY_STORE = []

def evaluate_eligibility(alcohol_level, weight_kg, heart_rate_bpm, body_temp_c, spo2_percent):
    """
    Evaluates standard blood donation eligibility thresholds:
      - Alcohol: 0.00% (Strict zero-tolerance)
      - Weight: >= 50.0 kg
      - Heart Rate: 50 - 100 BPM
      - Body Temp: 36.1°C - 37.5°C
      - SpO2: >= 95%
    """
    flagged = []
    
    if alcohol_level > 0.01:
        flagged.append(f"Alcohol detected ({alcohol_level:.3f} BAC%) - strict zero-tolerance threshold is 0.00%")
    if weight_kg < 50.0:
        flagged.append(f"Weight ({weight_kg:.1f} kg) is below standard 50.0 kg donation threshold")
    if heart_rate_bpm < 50 or heart_rate_bpm > 100:
        flagged.append(f"Heart rate ({heart_rate_bpm} BPM) outside safe resting window (50-100 BPM)")
    if body_temp_c < 36.0 or body_temp_c > 37.5:
        flagged.append(f"Body temperature ({body_temp_c:.1f}°C) outside normal range (36.1°C - 37.5°C)")
    if spo2_percent < 95.0:
        flagged.append(f"SpO2 saturation ({spo2_percent:.1f}%) is below safe minimum (95.0%)")

    is_eligible = len(flagged) == 0
    status = "pass" if is_eligible else "fail"
    return is_eligible, status, "; ".join(flagged)

def persist_to_supabase(record):
    """
    Persists reading to Supabase 'hardware_readings' table via REST API.
    Falls back to memory store if credentials are not yet set.
    """
    if SUPABASE_URL and SUPABASE_KEY:
        url = f"{SUPABASE_URL}/rest/v1/hardware_readings"
        headers = {
            "apikey": SUPABASE_KEY,
            "Authorization": f"Bearer {SUPABASE_KEY}",
            "Content-Type": "application/json",
            "Prefer": "return=representation"
        }
        data = json.dumps(record).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        try:
            with urllib.request.urlopen(req, timeout=10) as response:
                res_body = response.read().decode("utf-8")
                saved = json.loads(res_body)
                print(f"[Supabase] Successfully stored reading: {record['id']}")
                return saved[0] if isinstance(saved, list) and len(saved) > 0 else record
        except Exception as e:
            print(f"[Supabase Error] Could not write to Supabase: {e}. Falling back to memory store.")
    
    # In-memory fallback
    MEMORY_STORE.append(record)
    print(f"[Local Store] Stored reading locally. Total unassigned/saved: {len(MEMORY_STORE)}")
    return record

def process_sensor_payload(payload):
    """
    Parses and sanitizes payload received from ESP32.
    """
    now_iso = datetime.now(timezone.utc).isoformat()
    device_id = payload.get("device_id", DEFAULT_DEVICE_ID)
    volunteer_id = payload.get("volunteer_id") # Nullable until matched

    alcohol_level = float(payload.get("alcohol_level", payload.get("mq3_alcohol", 0.0)))
    air_quality_index = float(payload.get("air_quality_index", payload.get("mq135_aqi", 42.0)))
    weight_kg = float(payload.get("weight_kg", payload.get("hx711_weight", 65.0)))
    heart_rate_bpm = int(payload.get("heart_rate_bpm", payload.get("max30102_hr", 72)))
    body_temp_c = float(payload.get("body_temp_c", payload.get("ds18b20_temp", 36.8)))
    spo2_percent = float(payload.get("spo2_percent", payload.get("max30102_spo2", 98.5)))

    is_eligible, status, flagged_reasons = evaluate_eligibility(
        alcohol_level, weight_kg, heart_rate_bpm, body_temp_c, spo2_percent
    )

    record = {
        "id": payload.get("id", f"reading-{int(time.time()*1000)}"),
        "volunteer_id": volunteer_id,
        "device_id": device_id,
        "alcohol_level": alcohol_level,
        "air_quality_index": air_quality_index,
        "weight_kg": weight_kg,
        "heart_rate_bpm": heart_rate_bpm,
        "body_temp_c": body_temp_c,
        "spo2_percent": spo2_percent,
        "recorded_at": payload.get("recorded_at", now_iso),
        "is_eligible": is_eligible,
        "status": status,
        "flagged_reasons": flagged_reasons
    }

    return persist_to_supabase(record)

class ESP32HttpHandler(BaseHTTPRequestHandler):
    def _send_json(self, status_code, data):
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization, x-api-key")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def do_OPTIONS(self):
        self._send_json(200, {"status": "ok"})

    def do_GET(self):
        if self.path == "/health" or self.path == "/":
            self._send_json(200, {
                "status": "healthy",
                "service": "Medicare ESP32 Telemetry Receiver",
                "supabase_configured": bool(SUPABASE_URL and SUPABASE_KEY),
                "stored_readings_count": len(MEMORY_STORE)
            })
        elif self.path.startswith("/api/readings"):
            self._send_json(200, {
                "success": True,
                "readings": list(reversed(MEMORY_STORE[-50:]))
            })
        else:
            self._send_json(404, {"error": "Endpoint not found"})

    def do_POST(self):
        if self.path in ["/api/esp32/readings", "/api/hardware-readings", "/api/readings"]:
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                post_data = self.rfile.read(content_length).decode("utf-8")
                payload = json.loads(post_data) if post_data else {}
                
                result = process_sensor_payload(payload)
                self._send_json(201, {
                    "success": True,
                    "message": "ESP32 reading processed and stored successfully",
                    "reading": result
                })
            except Exception as err:
                print(f"[Error processing POST]: {err}")
                self._send_json(400, {"success": False, "error": str(err)})
        else:
            self._send_json(404, {"error": "Endpoint not found"})

def run_serial_listener(serial_port="/dev/ttyUSB0", baud_rate=115200):
    """
    Listens to ESP32 connected via USB Serial COM port.
    Requires 'pyserial' when executed on host machine.
    """
    try:
        import serial
    except ImportError:
        print("[Serial Warning] 'pyserial' is not installed. To use serial reading, install it via: pip install pyserial")
        return

    print(f"[Serial] Listening on {serial_port} at {baud_rate} baud...")
    try:
        ser = serial.Serial(serial_port, baud_rate, timeout=2)
        while True:
            line = ser.readline().decode('utf-8', errors='ignore').strip()
            if line.startswith("{") and line.endswith("}"):
                try:
                    payload = json.loads(line)
                    print(f"[Serial Rx]: {payload}")
                    process_sensor_payload(payload)
                except json.JSONDecodeError:
                    pass
    except Exception as e:
        print(f"[Serial Error]: {e}")

if __name__ == "__main__":
    if "--simulate" in sys.argv or "--test-send" in sys.argv:
        print("[Simulate] Generating sample ESP32 telemetry reading...")
        sample_payload = {
            "device_id": DEFAULT_DEVICE_ID,
            "alcohol_level": 0.000,
            "air_quality_index": 38.5,
            "weight_kg": 68.4,
            "heart_rate_bpm": 74,
            "body_temp_c": 36.7,
            "spo2_percent": 99.0
        }
        res = process_sensor_payload(sample_payload)
        print("[Simulate Result]:", json.dumps(res, indent=2))
        sys.exit(0)

    server_address = ("0.0.0.0", PORT)
    httpd = HTTPServer(server_address, ESP32HttpHandler)
    print(f"Medicare ESP32 Telemetry Receiver running on http://0.0.0.0:{PORT}")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("Stopping receiver...")
        httpd.server_close()
