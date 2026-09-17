# PosChair Production Readiness

## Current Classification

PosChair is a software-hardened, unoccupied bench prototype. It is not yet ready
for powered testing against a person, commercial manufacture, or unsupervised
operation. The software watchdog and open-loop position estimate are useful
fallbacks, but neither is a safety-rated control.

## Implemented Software Controls

- Actuator output starts disabled and requires connection, calibration, and an explicit bench-test confirmation.
- Missing 3D pose data or low confidence commands all targets to 0mm.
- BLE writes are serialized with a latest-command-wins queue.
- Firmware clamps commands to 0-55mm and requests retraction after two seconds without a valid packet.
- Mid-motion target changes update the open-loop position estimate before reversing or changing duration.
- Battery telemetry uses a 120k/27k divider sized for up to 15V input, plus ADC filtering and calibration support.
- Desktop builds persist profiles, calibration, and sessions locally without requiring a separate backend.
- API payloads are bounded and validated, timestamps are timezone-aware, and invalid user references are rejected.
- CI lints, tests, builds, and compiles the frontend, backend, website, and ESP32 firmware.

## Blocking Hardware Gates

All items below are required before occupied powered testing:

1. Normally-closed, latching emergency stop that removes motor power independently of software.
2. Independent retract and extend limit sensing on every actuator.
3. Closed-loop position feedback from encoders or equivalent sensors.
4. Current, load, or force monitoring with an independent cutoff path.
5. Mechanical stops rated for worst-case stall load and foreseeable misuse.
6. Per-channel electrical protection sized from measured motor stall current.
7. Measured and documented pad-force and contact-pressure limits across the full travel range.
8. Verified behavior for jams, disconnected sensors, reversed wiring, BLE loss, application failure, and controller reset.

## Verification Evidence Needed

- Electrical schematic, wiring review, fuse calculations, and measured current data.
- Mechanical drawings, material specifications, load calculations, and cycle-life results.
- Calibration procedure for actuator speed, position feedback, force sensing, and battery voltage.
- Traceable test cases with pass/fail records for every safety requirement and fault condition.
- A controlled pilot plan beginning with instrumented, unoccupied tests before any supervised human evaluation.
- Independent legal, regulatory, clinical, and intellectual-property review before public safety or medical claims.

## Funding Milestones

1. Build one instrumented actuator channel with limits, encoder feedback, force sensing, and hardware cutoff.
2. Validate the channel across expected loads, jams, power loss, and repeated cycles.
3. Replicate the verified channel six times and validate simultaneous operation and power integrity.
4. Integrate the emergency stop and system-level fault handling, then complete an independent design review.
5. Only after the preceding gates pass, define a supervised human-factors study with qualified advisors.

This sequence turns the current prototype into a fundable engineering program
without presenting software fallbacks as proof of physical safety.
