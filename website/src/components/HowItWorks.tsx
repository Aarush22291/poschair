import React from 'react';

const steps = [
  {
    step: '01',
    title: 'Client-Side WASM Vision',
    desc: 'MediaPipe Pose Landmarker extracts 33 3D joints from webcam frames in WebAssembly. No image data is ever stored or transmitted.',
    code: 'PoseLandmarker.createFromOptions(vision, { delegate: "GPU" })',
  },
  {
    step: '02',
    title: 'Kinematic & EMA Analysis',
    desc: 'Calculates spine angle, lateral roll, and neck inclination against your baseline pose, stabilized with an exponential moving average (α=0.35).',
    code: 'angleFromVertical(midHip, midShoulder) - baseline.spineAngle0',
  },
  {
    step: '03',
    title: 'Paraspinal Matrix Mapping',
    desc: 'The decision engine scales deviation across 6 independent actuators (UL, UR, ML, MR, LL, LR) capped at the prototype\'s configured 55mm travel limit.',
    code: 'computeTargetPositions(posture, mode) // 0–55mm output',
  },
  {
    step: '04',
    title: 'BLE & H-Bridge Actuation',
    desc: 'Transmits 8-byte command packets to the ESP32. BTS7960 H-bridges drive DC geared motors to wind pre-curved spring steel strips into your spine.',
    code: '0xA5 [UL] [UR] [ML] [MR] [LL] [LR] [XOR_CHECKSUM]',
  },
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: '80px 0' }}>
      <div style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-blue)', marginBottom: 12 }}>
        Vision-Guided Control Prototype
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 48, letterSpacing: '-0.02em' }}>
        How the Vision-to-Motion Pipeline Works
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
        {steps.map((s) => (
          <div key={s.step} className="tech-card" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="code-font" style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent-blue)', letterSpacing: '0.04em' }}>
              STEP {s.step}
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{s.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{s.desc}</p>
            <div className="code-font" style={{
              marginTop: 'auto',
              fontSize: 10,
              padding: '8px 10px',
              borderRadius: 6,
              background: 'var(--surface-base)',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
              wordBreak: 'break-all',
            }}>
              {s.code}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
