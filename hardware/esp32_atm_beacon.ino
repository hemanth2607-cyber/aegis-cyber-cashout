/*
  =============================================================================
  AegisCashout: Hardware-In-The-Loop (HITL) Physical ATM Lock Beacon
  Target Microcontroller: ESP32-WROOM-32 / NodeMCU-32S / ESP32-S3
  Framework: Arduino C++
  
  Description:
  Connects over 2.4GHz WiFi to the AegisCashout Backend WebSocket
  (ws://<HOST_IP>:8000/ws/hardware/beacon).
  
  When a Section 106 BNSS statutory friction order is executed against a 
  terminating cash-out mule account, this hardware beacon physically activates:
    1. High-intensity Red Alert Strobe (GPIO 22)
    2. 110dB / 2400Hz Piezo Deterrent Siren (GPIO 23)
    3. Physical Solenoid Dispenser Shutter Relay (GPIO 21)
  
  While preserving the Green "Kiosk Active for Public" indicator (GPIO 19)
  demonstrating zero collateral downtime for legitimate citizens.

  Hardware Wiring Diagram:
  ------------------------------------------------------------------
  ESP32 GPIO Pin    Hardware Component             Description
  ------------------------------------------------------------------
  GPIO 22 --------> Red Strobe LED / MOSFET -----> 12V Red Strobe Array
  GPIO 23 --------> Piezo Buzzer / Transistor ---> 2.4kHz Alarm Siren
  GPIO 19 --------> Green LED (330 Ohm) ---------> Public Kiosk Active
  GPIO 21 --------> 5V Relay Module -------------> Solenoid Lock Shutter
  GPIO 2  --------> Onboard Blue LED ------------> WiFi Link Indicator
  GND     --------> Common Ground                Ground rail
  =============================================================================
*/

#include <WiFi.h>
#include <WebSocketsClient.h>
#include <ArduinoJson.h>

// ==========================================
// CONFIGURATION & NETWORK SETTINGS
// ==========================================
const char* WIFI_SSID     = "Aegis_Tactical_AP";      // Enter presentation WiFi SSID
const char* WIFI_PASSWORD = "AegisDefense2026";       // Enter WiFi Password
const char* WS_HOST       = "192.168.1.100";          // Aegis Backend Server IP
const int   WS_PORT       = 8000;
const char* WS_PATH       = "/ws/hardware/beacon";

// GPIO Pin Definitions
const int PIN_STROBE_RED    = 22;
const int PIN_BUZZER_PWM    = 23;
const int PIN_STATUS_GREEN  = 19;
const int PIN_RELAY_LOCK    = 21;
const int PIN_WIFI_STATUS   = 2;

// PWM Audio Channel for ESP32 DAC/LEDC
const int PWM_CHANNEL       = 0;
const int PWM_RESOLUTION    = 8;

WebSocketsClient webSocket;

// State Machine Variables
bool isAlarmActive          = false;
unsigned long alarmStartTime = 0;
unsigned long alarmDurationMs = 15000;
int alarmToneFreq           = 2400;
unsigned long lastStrobeToggle = 0;
bool strobeState            = false;
unsigned long lastHeartbeat = 0;

// Function Prototypes
void setupHardwarePins();
void connectWiFi();
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length);
void handleSessionLockEvent(JsonObject& doc);
void updateAlarmState();
void sendHeartbeat();

// ==========================================
// ARDUINO SETUP
// ==========================================
void setup() {
  Serial.begin(115200);
  delay(500);

  Serial.println();
  Serial.println("=================================================");
  Serial.println("  AEGIS HITL PHYSICAL ATM BEACON INITIALIZING   ");
  Serial.println("  Section 106 BNSS Hardware Interdiction Unit    ");
  Serial.println("=================================================");

  setupHardwarePins();
  connectWiFi();

  // Initialize WebSocket Client
  webSocket.begin(WS_HOST, WS_PORT, WS_PATH);
  webSocket.onEvent(webSocketEvent);
  webSocket.setReconnectInterval(2000);
  webSocket.enableHeartbeat(15000, 3000, 2);

  Serial.printf("[+] Connecting to Aegis WebSocket: ws://%s:%d%s\n", WS_HOST, WS_PORT, WS_PATH);
}

// ==========================================
// ARDUINO MAIN LOOP
// ==========================================
void loop() {
  webSocket.loop();
  updateAlarmState();

  // Send periodic telemetry heartbeat every 5 seconds
  if (millis() - lastHeartbeat > 5000) {
    sendHeartbeat();
    lastHeartbeat = millis();
  }
}

// ==========================================
// HARDWARE PIN SETUP & INITIAL STATE
// ==========================================
void setupHardwarePins() {
  pinMode(PIN_STROBE_RED, OUTPUT);
  pinMode(PIN_STATUS_GREEN, OUTPUT);
  pinMode(PIN_RELAY_LOCK, OUTPUT);
  pinMode(PIN_WIFI_STATUS, OUTPUT);

  // Configure ESP32 LEDC PWM channel for Piezo Siren
  ledcSetup(PWM_CHANNEL, 2400, PWM_RESOLUTION);
  ledcAttachPin(PIN_BUZZER_PWM, PWM_CHANNEL);
  ledcWrite(PWM_CHANNEL, 0); // Silence buzzer initially

  // Normal Baseline: Green Public Active LED ON, Relays & Strobes OFF
  digitalWrite(PIN_STROBE_RED, LOW);
  digitalWrite(PIN_RELAY_LOCK, LOW);
  digitalWrite(PIN_STATUS_GREEN, HIGH);
  digitalWrite(PIN_WIFI_STATUS, LOW);

  Serial.println("[+] Hardware GPIO Pins configured.");
  Serial.println("[+] Default State: GREEN [PUBLIC OPERATIONAL] Active.");
}

// ==========================================
// WIFI CONNECTION MANAGEMENT
// ==========================================
void connectWiFi() {
  Serial.printf("[+] Connecting to WiFi SSID: %s ", WIFI_SSID);
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 25) {
    delay(400);
    Serial.print(".");
    digitalWrite(PIN_WIFI_STATUS, !digitalRead(PIN_WIFI_STATUS));
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    digitalWrite(PIN_WIFI_STATUS, HIGH);
    Serial.println("\n[✓] WiFi Connected!");
    Serial.printf("[✓] IP Address: %s | RSSI: %d dBm\n", WiFi.localIP().toString().c_str(), WiFi.RSSI());
  } else {
    Serial.println("\n[!] WiFi connection timed out. Retrying in background...");
  }
}

// ==========================================
// WEBSOCKET EVENT DISPATCHER
// ==========================================
void webSocketEvent(WStype_t type, uint8_t * payload, size_t length) {
  switch (type) {
    case WStype_DISCONNECTED:
      Serial.println("[-] WebSocket Disconnected from Aegis Engine.");
      digitalWrite(PIN_WIFI_STATUS, LOW);
      break;

    case WStype_CONNECTED:
      Serial.println("[✓] WebSocket Connected! Hardware Beacon Ready for Live Friction.");
      digitalWrite(PIN_WIFI_STATUS, HIGH);
      break;

    case WStype_TEXT: {
      StaticJsonDocument<512> doc;
      DeserializationError error = deserializeJson(doc, payload);
      if (error) {
        Serial.printf("[!] JSON Parse Error: %s\n", error.c_str());
        return;
      }

      const char* eventType = doc["event"] | "";
      if (strcmp(eventType, "ATM_SESSION_LOCKED") == 0) {
        JsonObject obj = doc.as<JsonObject>();
        handleSessionLockEvent(obj);
      } else if (strcmp(eventType, "BEACON_REGISTERED") == 0) {
        Serial.println("[+] Server Handshake Confirmed: Beacon Registered Successfully.");
      }
      break;
    }

    default:
      break;
  }
}

// ==========================================
// SESSION LOCK & STROBE TRIGGER
// ==========================================
void handleSessionLockEvent(JsonObject& doc) {
  const char* terminalId = doc["terminal_id"] | "ATM-UNKNOWN";
  const char* account    = doc["target_account"] | "UNKNOWN";
  const char* statutory  = doc["statutory_power"] | "SEC_106_BNSS";
  alarmDurationMs        = doc["strobe_ms"] | 15000;
  alarmToneFreq          = doc["buzzer_freq"] | 2400;

  Serial.println();
  Serial.println("************************************************************");
  Serial.println(" [⚡] HITL EVENT: PHYSICAL ATM LOCK TRIGGERED!");
  Serial.printf (" [⚡] Terminal ID     : %s\n", terminalId);
  Serial.printf (" [⚡] Targeted Mule   : %s\n", account);
  Serial.printf (" [⚡] Statutory Power : %s\n", statutory);
  Serial.printf (" [⚡] Strobe Duration : %lu ms\n", alarmDurationMs);
  Serial.printf (" [⚡] Siren Frequency : %d Hz\n", alarmToneFreq);
  Serial.println("************************************************************");

  // Activate hardware alarm state
  isAlarmActive = true;
  alarmStartTime = millis();

  // Engage solenoid physical lock relay
  digitalWrite(PIN_RELAY_LOCK, HIGH);

  // Audible Siren PWM on
  ledcWriteTone(PWM_CHANNEL, alarmToneFreq);
}

// ==========================================
// ALARM STATE MACHINE (NON-BLOCKING)
// ==========================================
void updateAlarmState() {
  if (!isAlarmActive) return;

  unsigned long elapsed = millis() - alarmStartTime;

  if (elapsed < alarmDurationMs) {
    // Strobe flasher effect: toggle every 65ms (~7.7 Hz visual pulse)
    if (millis() - lastStrobeToggle > 65) {
      strobeState = !strobeState;
      digitalWrite(PIN_STROBE_RED, strobeState ? HIGH : LOW);
      digitalWrite(PIN_STATUS_GREEN, strobeState ? LOW : HIGH); // Alternating warning
      lastStrobeToggle = millis();
    }

    // Two-tone warble siren effect (alternate 2400Hz and 2800Hz every 250ms)
    if ((elapsed / 250) % 2 == 0) {
      ledcWriteTone(PWM_CHANNEL, alarmToneFreq);
    } else {
      ledcWriteTone(PWM_CHANNEL, alarmToneFreq + 400);
    }

  } else {
    // Alarm timeout complete: restore normal state
    isAlarmActive = false;
    ledcWrite(PWM_CHANNEL, 0);          // Silence buzzer
    digitalWrite(PIN_STROBE_RED, LOW);   // Red strobe off
    digitalWrite(PIN_RELAY_LOCK, LOW);   // Disengage solenoid lock
    digitalWrite(PIN_STATUS_GREEN, HIGH);// Steady green public operational

    Serial.println();
    Serial.println("[✓] Alarm Duration Expired.");
    Serial.println("[✓] Card session friction active at core switch.");
    Serial.println("[✓] Kiosk hardware returned to NORMAL PUBLIC OPERATIONAL state.");
  }
}

// ==========================================
// PERIODIC HEARTBEAT TELEMETRY
// ==========================================
void sendHeartbeat() {
  if (webSocket.isConnected()) {
    StaticJsonDocument<128> doc;
    doc["type"] = "HEARTBEAT";
    doc["rssi"] = WiFi.RSSI();
    doc["uptime_s"] = millis() / 1000;
    doc["alarm_state"] = isAlarmActive ? "ALARM_ACTIVE" : "STANDBY_IDLE";

    String msg;
    serializeJson(doc, msg);
    webSocket.sendTXT(msg);
  }
}
