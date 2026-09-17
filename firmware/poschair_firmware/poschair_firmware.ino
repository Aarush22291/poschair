// PosChair Firmware v3 - ESP32 DevKit V1
// 6 custom worm-rack actuators in 2x3 paraspinal grid.
// Drivers: 6x BTS7960 H-bridges, one DC geared motor per module.
//
// Board: ESP32 Dev Module
// CPU Frequency: 240MHz
// Library: NimBLE-Arduino

#include "config.h"
#include "protocol.h"
#include "motor_controller.h"
#include "ble_manager.h"

MotorController motors;
unsigned long lastStatusMs = 0;
bool failsafeActive = false;

uint16_t readBatteryMv() {
  const uint32_t adcMv = analogReadMilliVolts(BATTERY_ADC_PIN);
  const float inputMv = adcMv * BATTERY_DIVIDER_RATIO * BATTERY_CALIBRATION_FACTOR;
  return (uint16_t)min(inputMv, 65535.0f);
}

void setup() {
  Serial.begin(115200);
  delay(200);
  Serial.println("\n=== PosChair v3 Firmware Starting ===");
  Serial.println("Layout: UL=M0 UR=M1 ML=M2 MR=M3 LL=M4 LR=M5");
  Serial.println("Actuator: BTS7960 + DC motor + worm-rack timed position control");

  analogSetPinAttenuation(BATTERY_ADC_PIN, ADC_11db);

  motors.begin();
  motors.homeAll();
  bleManager.begin(&motors);

  Serial.printf("Ready. Positions are 0-%dmm. Advertising as %s.\n", MAX_POSITION_MM, BLE_DEVICE_NAME);
}

void loop() {
  motors.update();

  const bool timedOut = (millis() - bleManager.lastValidPacketMs() > FAILSAFE_TIMEOUT_MS);
  if (timedOut && !failsafeActive) {
    Serial.println("WARNING: BLE timeout - retracting all modules to 0mm");
    failsafeActive = true;
    for (int i = 0; i < NUM_MODULES; i++) motors.setTarget(i, 0);
  }
  if (!timedOut) failsafeActive = false;

  if (millis() - lastStatusMs > STATUS_INTERVAL_MS) {
    lastStatusMs = millis();
    const uint16_t batteryMv = readBatteryMv();
    bleManager.sendStatus(failsafeActive, batteryMv);

    Serial.printf("[Status] UL=%d UR=%d ML=%d MR=%d LL=%d LR=%d bat=%dmV homed=%d moving=%d fs=%d\n",
      motors.getCurrentPosition(0), motors.getCurrentPosition(1),
      motors.getCurrentPosition(2), motors.getCurrentPosition(3),
      motors.getCurrentPosition(4), motors.getCurrentPosition(5),
      batteryMv, motors.isHomingComplete(), motors.isAnyMoving(), failsafeActive);
  }
}
