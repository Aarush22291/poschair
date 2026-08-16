# PosChair

AI-assisted posture correction hardware for chairs, built around a browser vision loop, BLE control, and a 2x3 paraspinal actuator grid.

[![Latest Release](https://img.shields.io/github/v/release/brovk2008/Poschair_final?label=download&color=5c8aff)](https://github.com/brovk2008/Poschair_final/releases/latest)
[![Patent Pending](https://img.shields.io/badge/patent-pending-blue)](LICENSE)
[![License: Proprietary](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)
[![Website](https://img.shields.io/badge/website-poschair--comfort.vercel.app-gray)](https://poschair-comfort.vercel.app)

PosChair tracks posture locally with MediaPipe Pose, converts posture deviation into six linear actuator targets, and sends those commands to an ESP32 DevKit V1 over Bluetooth Low Energy. The v3 hardware uses DC geared motors, BTS7960 H-bridge drivers, and custom worm-rack actuators that move foam pads up to 100mm.

## Current Version

**V3 motorized actuator architecture**

- 6 custom worm-rack actuators in a 2x3 paraspinal grid
- 6 BTS7960 H-bridge motor drivers
- ESP32 DevKit V1 BLE peripheral using NimBLE-Arduino
- Web Bluetooth dashboard for Chrome/Edge
- Local-only camera posture analysis with MediaPipe WASM
- FastAPI backend for profile, calibration, and session history

## Architecture

```text
Camera
  -> MediaPipe Pose running in browser
  -> Posture analyzer
  -> Velocity-aware decision engine
  -> Web Bluetooth command packet
  -> ESP32 DevKit V1
  -> 6x BTS7960 H-bridges
  -> DC geared motors
  -> Worm-rack actuators
  -> Foam pads on paraspinal muscles
```

## Hardware Layout

```text
        LEFT COLUMN      RIGHT COLUMN

ROW 1:  [UL - M0]       [UR - M1]    Upper thoracic / shoulder
ROW 2:  [ML - M2]       [MR - M3]    Mid lumbar
ROW 3:  [LL - M4]       [LR - M5]    Lower lumbar / pelvis
```

The center spine line is intentionally left open. The modules press into paraspinal muscle areas on either side of the spine.

## Features

- **Position-based actuation:** command values are 0-100, mapping to 0-100mm of linear pad travel.
- **Continuous correction:** forward lean and lateral lean are mapped proportionally instead of using only fixed thresholds.
- **Velocity awareness:** fast posture deterioration increases actuator response before the user fully slouches.
- **Confidence gating:** low-confidence pose frames hold the previous motor target to avoid mechanical jitter.
- **Startup homing:** every boot retracts the actuators to the 0mm home position before BLE control begins.
- **BLE failsafe:** if command packets stop for more than 2 seconds, all modules retract to 0mm.
- **Privacy-first vision:** raw camera frames stay in the browser.

## Repository Structure

```text
firmware/
  poschair_firmware/      Main ESP32 DevKit BLE + motor control firmware
  poschair_motor_test/    Motor calibration and wiring test sketch

app/
  frontend/               React + Vite dashboard with Web Bluetooth
  backend/                FastAPI backend for profiles, calibration, sessions
  docker-compose.yml      Local full-stack development environment

docs/
  hardware_wiring.md      BTS7960, ESP32 DevKit, and actuator wiring reference
  protocol.md             BLE packet protocol reference

website/                  Public Next.js marketing/documentation site
```

## Quick Start

### 1. Wire the Hardware

Connect each BTS7960 driver to the ESP32 DevKit V1 using the pin map in [docs/hardware_wiring.md](docs/hardware_wiring.md). Use a separate motor power rail sized for your motors and keep all grounds common.

Do not power the DC motors from the ESP32 or USB.

### 2. Calibrate Motor Speed

Flash the motor test sketch:

```text
firmware/poschair_motor_test/poschair_motor_test.ino
```

Measure how far each actuator moves during the 2000ms extension test.

```text
MOTOR_SPEED_MM_PER_MS = measured_mm / 2000.0
```

Update the value in:

```text
firmware/poschair_firmware/config.h
```

### 3. Flash Main Firmware

Open the main sketch in Arduino IDE 2.x:

```text
firmware/poschair_firmware/poschair_firmware.ino
```

Recommended Arduino settings:

- Board: `ESP32 Dev Module`
- Flash Size: `4MB`
- CPU Frequency: `240MHz`
- Library: `NimBLE-Arduino`

### 4. Run the App

```bash
cd app
docker-compose up --build
```

Open [http://localhost:5173](http://localhost:5173) in Chrome or Edge.

Web Bluetooth is required, so Safari/iOS and Firefox are not supported for hardware control.

## BLE Protocol

Device name:

```text
POSCHAIR_001
```

Command packet, app to ESP32:

```text
[0]   0xA5
[1]   UL position 0-100
[2]   UR position 0-100
[3]   ML position 0-100
[4]   MR position 0-100
[5]   LL position 0-100
[6]   LR position 0-100
[7]   XOR checksum of bytes 0-6
```

Status packet, ESP32 to app:

```text
[0]   0x5A
[1]   flags: bit0=ok, bit1=failsafe, bit2=homed, bit3=moving
[2]   battery mV high byte
[3]   battery mV low byte
[4-9] current module positions, UL through LR
```

See [docs/protocol.md](docs/protocol.md) for UUIDs and test packets.

## Development Commands

Frontend dashboard:

```bash
cd app/frontend
npm run build
```

Website:

```bash
cd website
npm run build
```

Full local stack:

```bash
cd app
docker-compose up --build
```

## Safety Notes

This project controls physical hardware. Use conservative travel limits, soft foam padding, current-appropriate wiring, and a separate motor power supply. Test one module at a time before wearing or leaning against the full chair attachment.

The firmware clamps commanded travel to 100mm and retracts on BLE timeout, but mechanical end stops and careful power design are still required.

## License & Patent Notice

Copyright (c) 2026 PosChair Technologies. All Rights Reserved. **Patent Pending.**

This software, hardware designs, and 2×3 paraspinal actuator algorithms are subject to pending patent applications. Commercial manufacturing, distribution, or licensing without express written authorization is strictly prohibited. See [LICENSE](LICENSE) for details.
