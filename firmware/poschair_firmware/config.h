#pragma once
#include <Arduino.h>

// Module index map:
// 0=Upper-Left, 1=Upper-Right, 2=Mid-Left, 3=Mid-Right, 4=Lower-Left, 5=Lower-Right
#define NUM_MODULES 6

// BTS7960 PWM pin assignments for ESP32 DevKit V1 (38-pin).
// Avoid GPIO0, GPIO2, GPIO12, and GPIO15 because they are boot-strapping pins.
// Avoid GPIO6-GPIO11 because they are connected to the onboard flash chip.
// RPWM drives rack out, LPWM drives rack in.
const uint8_t RPWM_PINS[NUM_MODULES] = {25, 27, 14, 17, 21, 23};
const uint8_t LPWM_PINS[NUM_MODULES] = {26, 16, 13, 18, 22, 19};

// Shared enable pin. Tie all BTS7960 R_EN and L_EN pins here, HIGH = enabled.
#define EN_PIN 5

// Battery voltage divider input. GPIO34 is input-only and ADC1_CH6.
// Wiring: Battery+ -> R1 120k -> GPIO34 -> R2 27k -> GND.
// This keeps the ADC below 2.76V at a 15V worst-case supply input.
#define BATTERY_ADC_PIN 34
#define BATTERY_R1_OHMS 120000.0f
#define BATTERY_R2_OHMS 27000.0f
#define BATTERY_DIVIDER_RATIO ((BATTERY_R1_OHMS + BATTERY_R2_OHMS) / BATTERY_R2_OHMS)
#define BATTERY_CALIBRATION_FACTOR 1.0f
#define BATTERY_MAX_INPUT_MV 15000

// Motor PWM settings for ESP32 Arduino core v3 ledcAttach/ledcWrite API.
#define MOTOR_PWM_NORMAL 200
#define MOTOR_PWM_HOMING 150
#define MOTOR_PWM_FREQ 5000
#define MOTOR_PWM_RES 8

// Timed position model: position unit 0-55 maps to 0-55mm extension.
// 55mm is the current prototype's configured mechanical travel limit.
#define MOTOR_SPEED_MM_PER_MS 0.075f
#define MAX_POSITION_MM 55
#define POSITION_UNIT_TO_MM 1.0f

// Homing and safety.
#define HOMING_TIMEOUT_MS 3000
#define HOMING_EXTRA_MS 200
#define FAILSAFE_TIMEOUT_MS 2000
#define MIN_POSITION_CHANGE 3

// BLE UUIDs. Must match app/frontend/src/bleManager.ts exactly.
#define BLE_DEVICE_NAME "POSCHAIR_001"
#define SERVICE_UUID "a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e"
#define COMMAND_CHAR_UUID "a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e"
#define STATUS_CHAR_UUID "a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e"

#define STATUS_INTERVAL_MS 1000
