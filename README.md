# 🪑 PosChair v1.3 — AI-Powered Active Posture Correction Chair

> **Patent Pending · PosChair Technologies**  
> An active posture correction system powered by real-time computer vision, biomechanical kinematic modeling, and a 6-zone motorized paraspinal backrest.

[![Latest Release v1.3](https://img.shields.io/github/v/release/brovk2008/Poschair_final?label=download&color=0284c7)](https://github.com/brovk2008/Poschair_final/releases/latest)
[![Patent Pending](https://img.shields.io/badge/patent-pending-blue)](LICENSE)
[![License: Proprietary](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)
[![Website](https://img.shields.io/badge/website-poschair--comfort.vercel.app-gray)](https://poschair-comfort.vercel.app)

---

## 💡 What is PosChair? (Non-Technical Explanation)

Most ergonomic office chairs are **passive**—they only support your back when you sit correctly. The moment you slump forward or tilt to one side, passive chairs do nothing to stop it.

**PosChair is an active posture corrector:**
1. **📷 Camera Eye:** Your webcam tracks 33 points on your upper body at 60 frames per second inside your browser. No video is ever saved or sent over the internet.
2. **🧠 AI Posture Brain:** It measures if you are slouching forward, tilting to one side, or craning your head ("tech neck").
3. **⚙️ Motorized Backrest:** A 2×3 matrix of 6 motorized cushions on your chair seat backrest extends up to **55mm** into your back muscles, actively pushing you back into proper alignment.

---

## ⚡ How to Run PosChair in 60 Seconds (Beginner Guide)

You can run PosChair **with or without physical hardware connected**. If you don't have the hardware built yet, PosChair includes a **Live Hardware Simulator** right on your camera view!

### Method 1: Double-Click Desktop Launcher (Easiest — No Coding Needed)

1. **Download or Clone** this repository to your computer.
2. Open the project folder and double-click:
   ```text
   run-poschair.bat
   ```
3. A command window will automatically set up the application and open **`http://localhost:5173`** in your browser.
4. Click **"Enable Tracking"** on the dashboard to start!

*(Note: Always use **Google Chrome** or **Microsoft Edge** because Safari and Firefox do not support Web Bluetooth).*

---

### Method 2: Standard Terminal Commands

If you prefer using the terminal:

```bash
# 1. Navigate to the app frontend folder
cd app/frontend

# 2. Install dependencies (only needed first time)
npm install

# 3. Start the application
npm run dev
```

Open **`http://localhost:5173`** in Chrome or Edge.

---

### Method 3: Full-Stack Docker Deployment (For Developers)

To run the complete system (React Frontend + FastAPI Backend + PostgreSQL Database):

```bash
cd app
docker-compose up --build
```

Open **`http://localhost:5173`** in Chrome or Edge.

---

## 🎮 How to Use the Dashboard (Step-by-Step UI Guide)

When you open the PosChair application at `http://localhost:5173`:

1. **Click "Enable Tracking":** This activates your webcam and loads the full MediaPipe AI pose model. You will see a 33-point yellow skeleton overlaid on your video.
2. **Click "Calibrate Baseline":** Sit in your normal, healthy upright pose for 5 seconds. The app captures your personal spine baseline so all posture measurements are customized to your body.
3. **Watch the Live Metrics:**
   * **Posture Score (0–100):** Green (85–100) = Excellent, Yellow (50–74) = Fair, Red (<50) = Poor.
   * **Spine (°):** Angle of forward torso slouching (e.g. `+12.4°`).
   * **Lateral (°):** Left or right shoulder roll tilt (e.g. `-4.2°`).
   * **Neck (°):** Forward head inclination (tech neck).
4. **Observe the Live Motor Diagram (Top-Right of Video):**
   * Shows a blue oval chair backrest with 6 actuator nodes.
   * Nodes stay **YELLOW (0mm)** when your posture is good.
   * When you slouch or lean right/left, the corresponding nodes light up **glowing RED** and show exact millimeter extensions (e.g. `28mm`) as the motors push to correct you!
5. **Select Mode:** Choose between **Office** (1.0x standard), **Gaming** (1.2x aggressive), **Study** (0.85x gentle), or **Relax** (0.5x passive).
6. **Connect Chair (Bluetooth):** Click **"Connect Chair"** when your ESP32 hardware is powered on to transmit motor commands over Bluetooth.

---

## 🪑 2×3 Paraspinal Actuator Matrix

PosChair uses 6 worm-rack motor actuators arranged in a **2×3 grid** on the backrest. The central spine line is kept clear; actuators press into the **paraspinal muscle lines** on either side:

```text
         LEFT COLUMN        RIGHT COLUMN
ROW 1:  [ UL - M0 ]        [ UR - M1 ]     Upper Thoracic / Shoulders
ROW 2:  [ ML - M2 ]        [ MR - M3 ]     Mid Lumbar
ROW 3:  [ LL - M4 ]        [ LR - M5 ]     Lower Lumbar / Pelvis
```

* **Max Safe Extension:** `55mm` (hardware clamped in firmware).
* **Differential Side Support:** If you lean to the right, the **Right Column (UR, MR, LR)** extends harder to press your torso back to the center line.

---

## 🔌 Hardware Assembly & Pinout Map (For Builders)

### Parts List
* **1×** ESP32 DevKit V1 (38-pin, 240MHz dual-core)
* **6×** BTS7960 High-Current H-Bridge Motor Drivers
* **6×** DC Geared Motors + Worm-Rack Linear Actuators ($0\text{--}55\text{mm}$ travel)
* **1×** 12V High-Current DC Motor Power Supply / Battery
* **2×** 100kΩ Resistors (Battery voltage sensing divider)

### Pinout Connection Table

| Module | Position | BTS7960 RPWM | BTS7960 LPWM | Shared Enable | Motor Output |
|---|---|---|---|---|---|
| **M0** | Upper-Left (UL) | ESP32 GPIO25 | ESP32 GPIO26 | GPIO5 | M0 `M+` / `M-` |
| **M1** | Upper-Right (UR) | ESP32 GPIO27 | ESP32 GPIO16 | GPIO5 | M1 `M+` / `M-` |
| **M2** | Mid-Left (ML) | ESP32 GPIO14 | ESP32 GPIO13 | GPIO5 | M2 `M+` / `M-` |
| **M3** | Mid-Right (MR) | ESP32 GPIO17 | ESP32 GPIO18 | GPIO5 | M3 `M+` / `M-` |
| **M4** | Lower-Left (LL) | ESP32 GPIO21 | ESP32 GPIO22 | GPIO5 | M4 `M+` / `M-` |
| **M5** | Lower-Right (LR) | ESP32 GPIO23 | ESP32 GPIO19 | GPIO5 | M5 `M+` / `M-` |

> ⚠️ **Important Wiring Rules:**  
> 1. Do NOT power DC motors from the ESP32 3.3V or USB port. Use a dedicated 12V supply.  
> 2. Ensure all grounds are tied together (ESP32 GND, BTS7960 GND, 12V Battery Negative).  
> 3. GPIO5 controls the shared `R_EN` and `L_EN` pins across all 6 BTS7960 drivers.

---

## 📡 NimBLE Bluetooth Protocol (v1.3)

* **Device Local Name:** `POSCHAIR_001`
* **Service UUID:** `a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e`
* **Command Characteristic:** `a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e`
* **Update Frequency:** 50Hz LEDC PWM

### 8-Byte Command Packet Structure (App → ESP32)

| Byte | Field | Type | Description |
|---|---|---|---|
| `0` | Header | `uint8_t` | Constant `0xA5` |
| `1` | UL Position | `uint8_t` | Target extension: `0–55mm` |
| `2` | UR Position | `uint8_t` | Target extension: `0–55mm` |
| `3` | ML Position | `uint8_t` | Target extension: `0–55mm` |
| `4` | MR Position | `uint8_t` | Target extension: `0–55mm` |
| `5` | LL Position | `uint8_t` | Target extension: `0–55mm` |
| `6` | LR Position | `uint8_t` | Target extension: `0–55mm` |
| `7` | Checksum | `uint8_t` | XOR verification of bytes 0–6 |

```text
Checksum Formula: B0 ^ B1 ^ B2 ^ B3 ^ B4 ^ B5 ^ B6
```

---

## 🛡️ Safety & Watchdog Failsafes

1. **Hardware Disconnect Retraction (2-Second Watchdog):** If Bluetooth connection drops or the browser tab closes, the ESP32 watchdog triggers within `2000ms`, automatically retracting all 6 actuators back to `0mm` home.
2. **Startup Homing:** On power-up, the firmware automatically homes all modules to `0mm` before accepting BLE commands.
3. **Voltage Sensing:** GPIO34 monitors battery voltage via a 100k/100k voltage divider to alert the user of low battery.

---

## 📁 Repository Structure

```text
poschair_final/
├── run-poschair.bat            # 1-Click Desktop Launcher for non-coders
├── README.md                   # Full beginner & technical manual
├── LICENSE                     # Proprietary & Patent-Pending License
├── app/
│   ├── frontend/               # React + Vite Web Bluetooth Dashboard
│   ├── backend/                # FastAPI backend for profiles & session logs
│   └── docker-compose.yml      # Local full-stack container environment
├── firmware/
│   ├── poschair_firmware/      # Main ESP32 DevKit BLE & motor controller code
│   └── poschair_motor_test/    # Single-motor direction & speed test sketch
├── docs/
│   ├── hardware_wiring.md      # Pinouts, schematic, and assembly steps
│   ├── protocol.md             # Complete BLE binary protocol specification
│   └── system_working_diagram.md # Architecture & system flow diagrams
└── website/                    # Next.js marketing & interactive documentation site
```

---

## ⚖️ Patent & License Notice

**Copyright (c) 2026 PosChair Technologies. All Rights Reserved. Patent Pending.**

This software, hardware designs, kinematic algorithms, and 2×3 paraspinal matrix innovations are subject to pending patent applications. 

Commercial manufacturing, selling, distributing, or licensing without explicit prior written consent from **PosChair Technologies Inc.** is strictly prohibited. Personal non-commercial evaluation and academic research are permitted. See [LICENSE](LICENSE) for details.
