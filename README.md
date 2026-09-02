# 🪑 PosChair v1.3 — AI-Powered Active Posture Correction Chair
### Master Technical & Operating Manual

> **Patent Pending · PosChair Technologies Inc.**  
> An active posture correction system powered by real-time computer vision, biomechanical kinematic modeling, and a 6-zone motorized paraspinal backrest attachment.

[![Latest Release v1.3](https://img.shields.io/github/v/release/brovk2008/Poschair_final?label=download&color=0284c7)](https://github.com/brovk2008/Poschair_final/releases/latest)
[![Patent Pending](https://img.shields.io/badge/patent-pending-blue)](LICENSE)
[![License: Proprietary](https://img.shields.io/badge/license-Proprietary-red)](LICENSE)
[![Website](https://img.shields.io/badge/website-poschair--comfort.vercel.app-gray)](https://poschair-comfort.vercel.app)

---

## 📋 Table of Contents

1. [Executive Summary & Biomechanical Concept](#-1-executive-summary--biomechanical-concept)
2. [How to Run PosChair in 60 Seconds (Beginner Guide)](#-2-how-to-run-poschair-in-60-seconds-beginner-guide)
3. [Full Application Dashboard & UI Guide](#-3-full-application-dashboard--ui-guide)
4. [Biomechanical Kinematics & Math Formulas](#-4-biomechanical-kinematics--math-formulas)
5. [2×3 Paraspinal Actuator Matrix Architecture](#-5-23-paraspinal-actuator-matrix-architecture)
6. [Hardware Wiring & Assembly Reference](#-6-hardware-wiring--assembly-reference)
7. [NimBLE Bluetooth Low Energy Protocol (v1.3)](#-7-nimble-bluetooth-low-energy-protocol-v13)
8. [Software Development & Build Commands](#-8-software-development--build-commands)
9. [Complete Repository Directory Map](#-9-complete-repository-directory-map)
10. [Troubleshooting & Frequently Asked Questions (FAQ)](#-10-troubleshooting--frequently-asked-questions-faq)
11. [Safety & Watchdog Failsafe Systems](#-11-safety--watchdog-failsafe-systems)
12. [Patent Reservation & License Notice](#-12-patent-reservation--license-notice)

---

## 💡 1. Executive Summary & Biomechanical Concept

### The Problem with Ergonomic Chairs
Traditional ergonomic office chairs are **passive support structures**. They only assist your lumbar spine if you maintain ideal posture voluntarily. As fatigue sets in during desk work, users inevitably slump forward (thoracic kyphosis), lean to one side (asymmetric spinal loading), or crane their neck toward the monitor ("tech neck"). Passive chairs do nothing to detect or correct these biomechanical failures.

### The PosChair Active Solution
PosChair is an **active closed-loop ergonomic robot**:
* **Camera Vision Eye:** Tracks 33 3D body landmarks at 60 FPS using MediaPipe Pose executing inside client-side WebAssembly (WASM). No video or coordinate data is ever uploaded to the cloud.
* **Kinematic Posture Engine:** Calculates spine forward deviation, lateral roll tilt, and neck inclination angle relative to a personalized 5-second baseline pose.
* **Motorized Actuation Matrix:** A 2×3 grid of 6 motorized worm-rack actuators on the backrest extends up to **55mm**, pressing high-density foam pads into your **paraspinal muscles** (erector spinae and multifidus) to physically push your spine back into alignment.

```text
+-----------------------------------------------------------------------------------+
|                                 POSCHAIR CLOSED LOOP                              |
|                                                                                   |
|  [ User sitting ] ---> [ Browser Webcam ] ---> [ MediaPipe Pose WASM (33 Points) ]|
|          ^                                                   |                    |
|          |                                                   v                    |
|  [ 2x3 Motor Support ] <--- [ ESP32 & H-Bridges ] <--- [ NimBLE BLE (8 Bytes) ]   |
+-----------------------------------------------------------------------------------+
```

---

## ⚡ 2. How to Run PosChair in 60 Seconds (Beginner Guide)

You can run PosChair **with or without physical hardware connected**. If you don't have the hardware built yet, PosChair includes a **Live Hardware Simulator** directly on the camera screen so you can test all posture features immediately!

### System Requirements
* **Operating System:** Windows 10/11, macOS, or Linux.
* **Browser:** **Google Chrome** or **Microsoft Edge** (Required for Web Bluetooth API). Safari and Firefox do NOT support Web Bluetooth.
* **Webcam:** Any standard USB or built-in webcam ($640 \times 480$ or higher).
* **Node.js:** Node.js **20.x LTS** (pinned in CI).
* **Python:** Python **3.12.x** (pinned in CI for backend checks).

---

### Method A: Double-Click Desktop Launcher (Easiest — No Code Required)

1. Download or clone this repository to your computer.
2. Open the project folder in Windows Explorer.
3. Double-click the file:
   ```text
   run-poschair.bat
   ```
4. The launcher will install missing packages automatically, start the server, and open **`http://localhost:5173`** in your default web browser!

---

### Method B: Manual Command Line Launch

Open Terminal or Command Prompt in the repository folder:

```bash
# 1. Enter the frontend application directory
cd app/frontend

# 2. Install dependencies (only required on first run)
npm install

# 3. Launch the development server
npm run dev
```

Open **`http://localhost:5173`** in Google Chrome or Microsoft Edge.

---

### Method C: Full-Stack Docker Container Launch

For developers running the full backend stack (React Frontend + FastAPI Backend + PostgreSQL Database):

```bash
cd app
docker-compose up --build
```

Open **`http://localhost:5173`** in Chrome or Edge.

---

## 🎮 3. Full Application Dashboard & UI Guide

When you open the application at `http://localhost:5173`, the dashboard provides real-time biomechanical feedback:

```text
+----------------------------------------------------------------------------------+
|  POSCHAIR v1.3               [ Connect Chair ]  [ Stop Camera ]  [ Mode: Office ]|
+----------------------------------------------------------------------------------+
|                                        |                                         |
|   LIVE POSTURE VIDEO FEED              |   CHAIR HARDWARE VISUALIZER             |
|   +--------------------------------+   |   +---------------------------------+   |
|   | [Score: 85 (Good)]  [HARDWARE] |   |   |  Upper-Left:  18mm  [====---]  |   |
|   |                     [DIAGRAM ] |   |   |  Upper-Right: 18mm  [====---]  |   |
|   |   (33 Yellow Joint Dots &      |   |   |  Mid-Left:    45mm  [========]  |   |
|   |    Green/Red Spine Line)       |   |   |  Mid-Right:   45mm  [========]  |   |
|   |                                |   |   |  Lower-Left:  32mm  [======--]  |   |
|   | [Spine:+8.4°] [Lat:-1.2°]      |   |   |  Lower-Right: 32mm  [======--]  |   |
|   +--------------------------------+   |   +---------------------------------+   |
|                                        |                                         |
|   [ Calibrate Baseline ] [ Session Clock ] |   INTEGRATION SETTINGS                  |
|   Spine Velocity: +2.1 deg/s           |   [ Local CV Only ]  [ Active BLE Loop ] |
|                                        |                                         |
|   ANALYTICS TREND CHART                |   MANUAL POSITION OVERRIDE              |
|   [==================================] |   Module 1 Position: [-------o----] 35mm|
+----------------------------------------------------------------------------------+
```

### Detailed Feature Breakdown

#### 1. Live Posture Video Panel (`CameraView.tsx`)
* **Full Body Skeleton Overlay:** Draws all 33 pose landmarks as prominent **yellow dots** (matching the physical reference design).
* **Posture-Aware Spine Line:** Highlights the line from Hip Midpoint → Shoulder Midpoint → Ear Midpoint:
  * **Green:** Excellent alignment ($\text{Score} \ge 75$)
  * **Yellow/Amber:** Minor posture deviation ($\text{Score } 50\text{--}74$)
  * **Red:** Severe posture slump ($\text{Score} < 50$)
* **Live Bottom Metric Pills:**
  * **`Spine (°)`:** Angle of torso forward lean relative to vertical (e.g. `+12.4°`).
  * **`Lateral (°)`:** Shoulder roll tilt angle left/right (e.g. `-4.2°`).
  * **`Neck (°)`:** Ear-to-shoulder inclination angle (Tech Neck proxy, e.g. `+14.7°`).
  * **`Confidence (%)`:** Pose tracking confidence score (e.g. `98% conf`).

#### 2. Live Hardware Motor Simulator Widget (Top-Right of Video)
* **Vibrant Blue Oval Chair Backrest Diagram (`front side of chair`):** Represents the physical backrest layout.
* **6 Actuator Nodes (`UL`, `UR`, `ML`, `MR`, `LL`, `LR`):**
  * **Bright Yellow (`0mm`):** Motor is idle/resting.
  * **Glowing Red + Pulse (`1–55mm`):** Motor is actively extending/rotating to push your spine.
  * **Real-time Readout:** Displays exact millimeter extension inside each circle.

#### 3. 5-Second Baseline Calibration (`CalibrationModal.tsx`)
* Clicking **"Calibrate Baseline"** prompts you to sit in your natural, healthy upright pose for 5 seconds.
* The system samples high-confidence frames ($\text{confidence} \ge 0.65$) and calculates your personalized baseline values:
  * $\text{spineAngle0}$, $\text{lateralAngle0}$, $\text{neckAngle0}$, $\text{shoulderWidth}$, $\text{torsoLength}$.
* All posture deviations are measured **relative to your baseline**, ensuring accurate operation regardless of camera height or user body dimensions.

#### 4. Posture Modes (`ModeSelector.tsx`)
* **Office Mode ($1.0\times$):** Standard balanced posture correction.
* **Gaming Mode ($1.2\times$):** Higher aggressiveness for forward-slouched gaming sessions.
* **Study Mode ($0.85\times$):** Moderated support for reading/writing.
* **Relax Mode ($0.5\times$):** Gentle baseline support.

#### 5. Integration Settings
* **Local CV Only:** Runs full camera tracking, biomechanical analysis, and live UI motor simulation without transmitting Bluetooth packets.
* **Active BLE Loop:** Continuously streams 8-byte command packets to the physical ESP32 chair controller over Bluetooth.

---

## 🧮 4. Biomechanical Kinematics & Math Formulas

### 1. Scale & Distance Invariance
To ensure posture calculations remain identical whether you sit close to or far from your webcam, all vector distances are scaled by your baseline **Torso Length** and **Shoulder Width**:

$$\text{torsoScale} = \frac{\text{CurrentTorsoLength}}{\text{BaselineTorsoLength}}$$

$$\text{forwardHeadRatio} = \frac{\text{MidEar}_x - \text{MidShoulder}_x}{\text{ShoulderWidth} \times \text{torsoScale}}$$

### 2. Exponential Moving Average (EMA) Temporal Filter
To eliminate camera frame jitter while retaining real-time responsiveness, all raw angular outputs pass through an EMA filter ($\alpha = 0.35$):

$$S_t = \alpha \cdot X_t + (1 - \alpha) \cdot S_{t-1}$$

### 3. Neck Inclination Angle (Tech Neck Proxy)
Calculated using the ear-to-shoulder inclination vector averaged across left and right sides:

$$\theta_{\text{neck}} = \text{atan2}(|\text{Ear}_x - \text{Shoulder}_x|, |\text{Ear}_y - \text{Shoulder}_y|) \times \left(\frac{180}{\pi}\right)$$

### 4. 3-Component Posture Score Formula
$$\text{Score} = \max\left(0, \min\left(100, 100 - P_{\text{spine}} - P_{\text{lateral}} - P_{\text{neck}}\right)\right)$$

Where:
* $P_{\text{spine}} = \min\left(40, \frac{|\Delta \text{Spine}|}{20^\circ} \times 40\right)$
* $P_{\text{lateral}} = \min\left(30, \frac{|\Delta \text{Lateral}|}{10^\circ} \times 30\right)$
* $P_{\text{neck}} = \min\left(30, \frac{|\Delta \text{Neck}|}{25^\circ} \times 30\right)$

### 5. Velocity Bonus & Differential Lateral Split
* **Velocity Bonus:** Adds up to $+15\text{mm}$ extra motor extension if the user slumps rapidly ($\text{SpineVelocity} > 3^\circ/\text{s}$).
* **Differential Lateral Split:**
  * Leaning **RIGHT** ($\Delta \text{Lateral} > +2^\circ$) $\rightarrow$ Adds extension bonus exclusively to **Right Column** (`UR`, `MR`, `LR`).
  * Leaning **LEFT** ($\Delta \text{Lateral} < -2^\circ$) $\rightarrow$ Adds extension bonus exclusively to **Left Column** (`UL`, `ML`, `LL`).

---

## 🪑 5. 2×3 Paraspinal Actuator Matrix Architecture

The physical chair attachment features 6 worm-rack actuators arranged in a **2×3 grid**:

```text
        LEFT COLUMN          RIGHT COLUMN
ROW 1:  [ M0 - UL ]         [ M1 - UR ]      Upper Thoracic / Shoulder
ROW 2:  [ M2 - ML ]         [ M3 - MR ]      Mid Lumbar
ROW 3:  [ M4 - LL ]         [ M5 - LR ]      Lower Lumbar / Pelvis
```

* **Center Spinal Channel:** A 2cm open vertical gap down the center ensures pads press into the **paraspinal muscle lines**, never pressing directly on spinal vertebrae.
* **Flex Strips:** Actuators drive pre-curved **65Mn spring steel strips** that provide 20mm of natural curvature at rest and flex up to 55mm total extension under load.

---

## 🔌 6. Hardware Wiring & Assembly Reference

### Bill of Materials (BOM)
| Item | Qty | Description / Part Notes |
|---|---:|---|
| **ESP32 DevKit V1** | 1 | 38-pin microcontroller (`ESP32 Dev Module`) |
| **BTS7960 Motor Driver** | 6 | High-current H-Bridge drivers (1 per motor) |
| **DC Geared Motors** | 6 | High-torque 12V DC geared motors with worm-racks |
| **12V Motor Battery/Power**| 1 | Dedicated 12V 10A+ motor power supply |
| **100kΩ Resistors** | 2 | Battery voltage sensing divider circuit |
| **Common Ground Bus** | 1 | Required common ground line |

---

### ESP32 Pin Connection Table

| Module Index | Body Position | BTS7960 RPWM | BTS7960 LPWM | Shared Enable | Motor Output |
|---|---|---|---|---|---|
| **M0** | Upper-Left (UL) | ESP32 `GPIO25` | ESP32 `GPIO26` | `GPIO5` | Motor 0 `M+`/`M-` |
| **M1** | Upper-Right (UR) | ESP32 `GPIO27` | ESP32 `GPIO16` | `GPIO5` | Motor 1 `M+`/`M-` |
| **M2** | Mid-Left (ML) | ESP32 `GPIO14` | ESP32 `GPIO13` | `GPIO5` | Motor 2 `M+`/`M-` |
| **M3** | Mid-Right (MR) | ESP32 `GPIO17` | ESP32 `GPIO18` | `GPIO5` | Motor 3 `M+`/`M-` |
| **M4** | Lower-Left (LL) | ESP32 `GPIO21` | ESP32 `GPIO22` | `GPIO5` | Motor 4 `M+`/`M-` |
| **M5** | Lower-Right (LR) | ESP32 `GPIO23` | ESP32 `GPIO19` | `GPIO5` | Motor 5 `M+`/`M-` |

---

### BTS7960 Driver Connections (Per Driver Board)

```text
  +--------------------------------------------------------------------+
  |                        BTS7960 H-BRIDGE DRIVER                     |
  |                                                                    |
  |   RPWM ----> Assigned ESP32 RPWM GPIO (Extends motor)             |
  |   LPWM ----> Assigned ESP32 LPWM GPIO (Retracts motor)            |
  |   R_EN ----> ESP32 GPIO5 (Shared Driver Enable)                   |
  |   L_EN ----> ESP32 GPIO5 (Shared Driver Enable)                   |
  |   VCC  ----> ESP32 3.3V (Logic Power)                             |
  |   GND  ----> Common Ground Bus                                    |
  |   B+   ----> 12V Motor Battery Positive                           |
  |   B-   ----> Common Ground Bus (12V Battery Negative)             |
  |   M+   ----> DC Geared Motor Terminal 1                           |
  |   M-   ----> DC Geared Motor Terminal 2                           |
  +--------------------------------------------------------------------+
```

> ⚡ **CRITICAL POWER RULES:**  
> 1. **Common Ground:** ESP32 GND, BTS7960 GND, and 12V Battery Negative MUST be connected to a single common ground bus.  
> 2. **Separate Motor Rail:** Never power DC motors directly from the ESP32 board or USB cable.  
> 3. **Motor Polarity:** If a motor retracts when it should extend, swap its `M+` and `M-` wires on the BTS7960 driver terminal.

---

### Battery Voltage Sensing Circuit
Connect two 100kΩ resistors to measure battery voltage on `GPIO34`:

```text
12V Battery Positive ---- [ 100kΩ R1 ] ----+---- [ 100kΩ R2 ] ---- Ground Bus
                                           |
                                     ESP32 GPIO34
```

---

## 📡 7. NimBLE Bluetooth Low Energy Protocol (v1.3)

* **Device Local Name:** `POSCHAIR_001`
* **Service UUID:** `a1b2c3d4-0001-4b5c-8d6e-1f2a3b4c5d6e`
* **Command Characteristic:** `a1b2c3d4-0002-4b5c-8d6e-1f2a3b4c5d6e` (Write Without Response)
* **Status Characteristic:** `a1b2c3d4-0003-4b5c-8d6e-1f2a3b4c5d6e` (Notify)

### 8-Byte Command Packet Map (App → ESP32)

| Byte | Field | Type | Value Range | Description |
|---|---|---|---|---|
| `0` | Header | `uint8_t` | `0xA5` | Fixed packet start byte |
| `1` | UL Position | `uint8_t` | `0–55` | Target extension in millimeters |
| `2` | UR Position | `uint8_t` | `0–55` | Target extension in millimeters |
| `3` | ML Position | `uint8_t` | `0–55` | Target extension in millimeters |
| `4` | MR Position | `uint8_t` | `0–55` | Target extension in millimeters |
| `5` | LL Position | `uint8_t` | `0–55` | Target extension in millimeters |
| `6` | LR Position | `uint8_t` | `0–55` | Target extension in millimeters |
| `7` | Checksum | `uint8_t` | Byte | XOR verification of bytes 0–6 |

$$\text{Checksum} = B_0 \oplus B_1 \oplus B_2 \oplus B_3 \oplus B_4 \oplus B_5 \oplus B_6$$

### Command Packet Debug Vectors

```text
All Motors Home (0mm):           A5 00 00 00 00 00 00 A5
Mid Lumbar Actuation (32mm):     A5 00 00 20 20 00 00 85
Right Column Full Out (55mm):    A5 00 37 00 37 00 37 A0
Full Matrix Out (55mm):          A5 37 37 37 37 37 37 92
```

---

## 8. Software Development & Build Commands

### Frontend Development (React + Vite + TypeScript)
```bash
cd app/frontend
npm install
npm run dev      # Start Vite dev server on http://localhost:5173
npm run lint     # ESLint quality gate (0 warnings allowed)
npm run test     # Vitest unit tests
npm run build    # Production build check (tsc && vite build)
```

### Marketing Website Development (Next.js)
```bash
cd website
npm install
npm run dev      # Start Next.js dev server on http://localhost:3000
npm run lint     # ESLint quality gate (0 warnings allowed)
npm run build    # Production static page build (next build)
```

### Backend Development (FastAPI + SQLAlchemy)
```bash
cd app/backend
python -m pip install -r requirements-dev.txt
python -m ruff check src tests
python -m ruff format --check src tests
DATABASE_URL=sqlite:///./test_poschair.db python -m pytest -q
```

### Developer Quick-Check (Pre-PR)
```bash
# Frontend
cd /home/runner/work/poschair/poschair/app/frontend && npm run lint && npm run test && npm run build

# Website
cd /home/runner/work/poschair/poschair/website && npm run lint && npm run build

# Backend
cd /home/runner/work/poschair/poschair/app/backend && python -m ruff check src tests && python -m ruff format --check src tests && DATABASE_URL=sqlite:///./test_poschair.db python -m pytest -q
```

### Firmware Compilation (Arduino IDE 2.x)
1. Open `firmware/poschair_firmware/poschair_firmware.ino` in Arduino IDE.
2. Install Library: **NimBLE-Arduino** (via Library Manager).
3. Board Selection: **`ESP32 Dev Module`**.
4. Settings: CPU Frequency `240MHz`, Flash Size `4MB`.
5. Upload Speed: `921600`.

---

## 📁 9. Complete Repository Directory Map

```text
poschair_final/
├── run-poschair.bat            # 1-Click Desktop Launcher for Windows
├── README.md                   # Master Technical & Operating Manual
├── LICENSE                     # Proprietary & Patent-Pending License
├── app/
│   ├── frontend/               # Dashboard App (React, Vite, Web Bluetooth, MediaPipe)
│   │   ├── src/
│   │   │   ├── App.tsx         # Core App component, state management, retry loader
│   │   │   ├── poseDetector.ts # MediaPipe WASM detector loader & DrawingUtils wrapper
│   │   │   ├── postureAnalyzer.ts # EMA filter, neck inclination, posture score math
│   │   │   ├── decisionEngine.ts  # Paraspinal matrix position mapping & velocity bonus
│   │   │   ├── bleManager.ts      # Web Bluetooth manager & 8-byte XOR packet encoder
│   │   │   ├── apiClient.ts       # Backend REST API client
│   │   │   └── components/
│   │   │       ├── CameraView.tsx # Video feed, 33-landmark skeleton, hardware diagram
│   │   │       ├── SpineVisualizer.tsx # 2x3 grid actuator dual progress bars
│   │   │       ├── CalibrationModal.tsx # 5-second natural pose baseline capture
│   │   │       ├── AnalyticsDashboard.tsx # Recharts posture trend line & daily bar charts
│   │   │       ├── BLEStatusBar.tsx # Bluetooth diagnostics bar
│   │   │       ├── ModeSelector.tsx # Office/Gaming/Study/Relax mode selector
│   │   │       └── LateralLeanAlert.tsx # Real-time side-lean alert banner
│   ├── backend/                # FastAPI Python Backend
│   │   ├── src/
│   │   │   ├── main.py         # FastAPI router & CORS middleware
│   │   │   ├── models.py       # SQLAlchemy User, Calibration, Session models
│   │   │   ├── database.py     # SQLite/PostgreSQL connection
│   │   │   └── routes/         # Profile, Calibration, Session REST routes
│   └── docker-compose.yml      # Docker container stack configuration
├── firmware/
│   ├── poschair_firmware/      # Main ESP32 BLE peripheral & motor controller firmware
│   │   ├── poschair_firmware.ino
│   │   ├── config.h            # Pinouts, MAX_POSITION_MM (55mm), watchdog constants
│   │   └── MotorController.h   # Timed open-loop position calculation engine
│   └── poschair_motor_test/    # Standalone 1-motor direction & speed calibration sketch
├── docs/
│   ├── hardware_wiring.md      # Pinout schematics, power wiring & assembly checklist
│   ├── protocol.md             # Complete BLE binary protocol specification
│   └── system_working_diagram.md # End-to-end Mermaid system flow diagrams
└── website/                    # Next.js Marketing & Interactive Documentation Site
    ├── src/
    │   ├── pages/
    │   │   ├── index.tsx       # Homepage with live telemetry simulator & specs table
    │   │   └── docs.tsx        # Interactive hover system guide & documentation hub
    │   └── components/
    │       ├── Hero.tsx        # Interactive 2x3 hardware telemetry simulator console
    │       ├── InteractiveDocs.tsx # 6-pillar hover-to-explain interactive explorer
    │       ├── Features.tsx    # Technical architecture & engineering cards
    │       ├── HowItWorks.tsx  # Vision-to-actuation pipeline steps
    │       ├── Nav.tsx         # Navbar with v1.3 tag & Docs link
    │       └── Footer.tsx      # Footer with patent notice
```

---

## ❓ 10. Troubleshooting & Frequently Asked Questions (FAQ)

### Q1: Why does the camera feed say "Camera / Model Error"?
* **Cause:** Camera permissions are blocked or another app (Zoom, Teams, Discord) is using your webcam.
* **Fix:** Close other video applications, click the lock icon next to `http://localhost:5173` in your browser address bar, set Camera to **Allow**, and refresh the page.

### Q2: Why does "Connect Chair" fail to find the Bluetooth device?
* **Cause 1:** You are using Firefox or Safari.  
  * **Fix:** Use **Google Chrome** or **Microsoft Edge**.
* **Cause 2:** The ESP32 is not powered on or BLE is already connected to your phone.  
  * **Fix:** Power the ESP32, verify `POSCHAIR_001` appears in Bluetooth settings, and restart the ESP32.

### Q3: What if one motor moves backward during testing?
* **Cause:** DC motor wires are reversed on the BTS7960 output.
* **Fix:** Do not edit software. Swap the `M+` and `M-` wires for that module directly on the BTS7960 terminal block.

### Q4: Can I run PosChair without building the physical chair?
* **Yes!** Switch Integration Settings to **Local CV Only**. The full camera skeleton, biomechanical score, and live top-right **Chair Hardware Simulator Diagram** will operate seamlessly in your browser.

---

## 🛡️ 11. Safety & Watchdog Failsafe Systems

1. **2000ms Bluetooth Watchdog:** If command packets cease for more than 2 seconds, the ESP32 automatically sets the failsafe flag and retracts all 6 actuators back to `0mm` home.
2. **Startup Homing Cycle:** Every boot forces a retraction cycle to guarantee all actuators start at `0mm` before accepting BLE commands.
3. **Physical Travel Clamping:** The firmware hard-clamps all module commands to `MAX_POSITION_MM = 55mm` regardless of input values.
4. **Emergency Mechanical Retraction:** Powering off the 12V motor supply immediately releases motor holding torque, allowing pre-curved flex strips to relax safely.

---

## ⚖️ 12. Patent Reservation & License Notice

**Copyright (c) 2026 PosChair Technologies Inc. All Rights Reserved. Patent Pending.**

This software, firmware, 2×3 paraspinal matrix hardware designs, kinematic biomechanical algorithms, and documentation are subject to pending patent applications. 

Commercial manufacturing, distribution, marketing, or licensing without explicit prior written authorization from **PosChair Technologies Inc.** is strictly prohibited. Personal, non-commercial evaluation and academic research are permitted under the terms of the [LICENSE](LICENSE).
