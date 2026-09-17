// PosChair V3 Bench Test Sketch
// Board: ESP32 Dev Module
//
// Use this before the main firmware when wiring the hardware.
// It lets you test one BTS7960 + motor module at a time from Serial Monitor.
//
// Serial Monitor:
//   Baud: 115200
//   Line ending: Newline
//
// Commands:
//   help        Show commands
//   pins        Print wiring map
//   out 0       Extend module 0 for TEST_RUN_MS
//   in 0        Retract module 0 for TEST_RUN_MS
//   stop 0      Stop module 0
//   brake 0     Brake module 0 briefly
//   cycle 0     Extend then retract module 0
//   allout      Extend all modules for TEST_RUN_MS
//   allin       Retract all modules for TEST_RUN_MS
//   allstop     Stop all modules
//   allcycle    Cycle modules M0 through M5 one by one
//   battery     Print raw ADC and estimated battery millivolts

#include <Arduino.h>

#define NUM_MODULES 6

const uint8_t RPWM_PINS[NUM_MODULES] = {25, 27, 14, 17, 21, 23};
const uint8_t LPWM_PINS[NUM_MODULES] = {26, 16, 13, 18, 22, 19};

#define EN_PIN 5
#define BATTERY_ADC_PIN 34
#define BATTERY_R1_OHMS 120000.0f
#define BATTERY_R2_OHMS 27000.0f
#define BATTERY_DIVIDER_RATIO ((BATTERY_R1_OHMS + BATTERY_R2_OHMS) / BATTERY_R2_OHMS)
#define BATTERY_CALIBRATION_FACTOR 1.0f

#define PWM_FREQ 5000
#define PWM_RES 8
#define TEST_PWM 180
#define TEST_RUN_MS 700
#define BRAKE_MS 150

const char* LABELS[NUM_MODULES] = {
  "M0 Upper-Left",
  "M1 Upper-Right",
  "M2 Mid-Left",
  "M3 Mid-Right",
  "M4 Lower-Left",
  "M5 Lower-Right"
};

void driveOut(int idx, uint8_t pwm = TEST_PWM) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  ledcWrite(RPWM_PINS[idx], pwm);
  ledcWrite(LPWM_PINS[idx], 0);
}

void driveIn(int idx, uint8_t pwm = TEST_PWM) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], pwm);
}

void stopMotor(int idx) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  ledcWrite(RPWM_PINS[idx], 0);
  ledcWrite(LPWM_PINS[idx], 0);
}

void brakeMotor(int idx) {
  if (idx < 0 || idx >= NUM_MODULES) return;
  ledcWrite(RPWM_PINS[idx], 255);
  ledcWrite(LPWM_PINS[idx], 255);
}

void stopAll() {
  for (int i = 0; i < NUM_MODULES; i++) stopMotor(i);
}

uint16_t readBatteryMv() {
  const uint32_t adcMv = analogReadMilliVolts(BATTERY_ADC_PIN);
  return (uint16_t)(adcMv * BATTERY_DIVIDER_RATIO * BATTERY_CALIBRATION_FACTOR);
}

void printHelp() {
  Serial.println();
  Serial.println("PosChair V3 bench test commands:");
  Serial.println("  help        Show this help");
  Serial.println("  pins        Print wiring map");
  Serial.println("  out N       Extend module N for test duration");
  Serial.println("  in N        Retract module N for test duration");
  Serial.println("  stop N      Stop module N");
  Serial.println("  brake N     Brake module N briefly");
  Serial.println("  cycle N     Extend then retract module N");
  Serial.println("  allout      Extend all modules for test duration");
  Serial.println("  allin       Retract all modules for test duration");
  Serial.println("  allstop     Stop all modules");
  Serial.println("  allcycle    Cycle modules M0 through M5");
  Serial.println("  battery     Print battery ADC reading");
  Serial.println();
}

void printPins() {
  Serial.println();
  Serial.println("ESP32 DevKit V1 -> BTS7960 wiring:");
  Serial.println("Shared EN: GPIO5 -> all R_EN + L_EN");
  for (int i = 0; i < NUM_MODULES; i++) {
    Serial.printf("%s: RPWM=GPIO%d LPWM=GPIO%d\n", LABELS[i], RPWM_PINS[i], LPWM_PINS[i]);
  }
  Serial.println("Battery ADC: GPIO34 voltage divider midpoint");
  Serial.println("Common GND: ESP32 GND + all BTS7960 GND/B- + battery negative");
  Serial.println();
}

void timedOut(int idx) {
  Serial.printf("OUT: %s\n", LABELS[idx]);
  driveOut(idx);
  delay(TEST_RUN_MS);
  stopMotor(idx);
}

void timedIn(int idx) {
  Serial.printf("IN: %s\n", LABELS[idx]);
  driveIn(idx);
  delay(TEST_RUN_MS);
  stopMotor(idx);
}

void cycleModule(int idx) {
  if (idx < 0 || idx >= NUM_MODULES) {
    Serial.println("Invalid module index. Use 0 through 5.");
    return;
  }
  timedOut(idx);
  delay(300);
  timedIn(idx);
  delay(300);
}

void allOut() {
  Serial.println("OUT: all modules");
  for (int i = 0; i < NUM_MODULES; i++) driveOut(i);
  delay(TEST_RUN_MS);
  stopAll();
}

void allIn() {
  Serial.println("IN: all modules");
  for (int i = 0; i < NUM_MODULES; i++) driveIn(i);
  delay(TEST_RUN_MS);
  stopAll();
}

String readCommand() {
  String cmd = Serial.readStringUntil('\n');
  cmd.trim();
  cmd.toLowerCase();
  return cmd;
}

int commandIndex(const String& cmd) {
  int space = cmd.indexOf(' ');
  if (space < 0) return -1;
  return cmd.substring(space + 1).toInt();
}

void handleCommand(const String& cmd) {
  if (cmd.length() == 0) return;

  if (cmd == "help") {
    printHelp();
    return;
  }
  if (cmd == "pins") {
    printPins();
    return;
  }
  if (cmd == "battery") {
    int raw = analogRead(BATTERY_ADC_PIN);
    Serial.printf("Battery ADC raw=%d estimated=%dmV\n", raw, readBatteryMv());
    return;
  }
  if (cmd == "allstop") {
    stopAll();
    Serial.println("Stopped all modules.");
    return;
  }
  if (cmd == "allout") {
    allOut();
    return;
  }
  if (cmd == "allin") {
    allIn();
    return;
  }
  if (cmd == "allcycle") {
    for (int i = 0; i < NUM_MODULES; i++) cycleModule(i);
    return;
  }

  int idx = commandIndex(cmd);
  if (idx < 0 || idx >= NUM_MODULES) {
    Serial.println("Unknown command or invalid module. Type: help");
    return;
  }

  if (cmd.startsWith("out ")) {
    timedOut(idx);
  } else if (cmd.startsWith("in ")) {
    timedIn(idx);
  } else if (cmd.startsWith("stop ")) {
    stopMotor(idx);
    Serial.printf("Stopped %s\n", LABELS[idx]);
  } else if (cmd.startsWith("brake ")) {
    brakeMotor(idx);
    delay(BRAKE_MS);
    stopMotor(idx);
    Serial.printf("Braked %s\n", LABELS[idx]);
  } else if (cmd.startsWith("cycle ")) {
    cycleModule(idx);
  } else {
    Serial.println("Unknown command. Type: help");
  }
}

void setup() {
  Serial.begin(115200);
  delay(300);

  pinMode(EN_PIN, OUTPUT);
  digitalWrite(EN_PIN, HIGH);
  analogSetPinAttenuation(BATTERY_ADC_PIN, ADC_11db);

  for (int i = 0; i < NUM_MODULES; i++) {
    ledcAttach(RPWM_PINS[i], PWM_FREQ, PWM_RES);
    ledcAttach(LPWM_PINS[i], PWM_FREQ, PWM_RES);
    stopMotor(i);
  }

  Serial.println();
  Serial.println("=== PosChair V3 Bench Test Ready ===");
  printPins();
  printHelp();
}

void loop() {
  if (Serial.available()) {
    handleCommand(readCommand());
  }
}
