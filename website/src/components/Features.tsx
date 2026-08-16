import React from 'react';

const features = [
  {
    tag: "MECHANICAL",
    title: "2×3 Paraspinal Actuator Matrix",
    desc: "Two independent vertical columns of three worm-rack modules push pre-curved 65Mn spring steel strips into paraspinal muscle lines, applying up to 55mm of targeted correction.",
  },
  {
    tag: "COMPUTER VISION",
    title: "On-Device MediaPipe WASM Pipeline",
    desc: "Executes the full 33-landmark pose model client-side inside WebAssembly at 60 FPS. Video streams and body coordinates never leave your machine.",
  },
  {
    tag: "HARDWARE BLE",
    title: "NimBLE 5.0 Low-Latency Protocol",
    desc: "Transmits 8-byte packed binary payloads with XOR checksums directly from Web Bluetooth to the ESP32 controller at 50Hz update rates.",
  },
  {
    tag: "SAFETY",
    title: "Hardware Watchdog Failsafe",
    desc: "If Bluetooth disconnects or the browser tab closes, the onboard watchdog automatically triggers full motor retraction to the 0mm home position within 2 seconds.",
  },
  {
    tag: "BIOMECHANICS",
    title: "Scale & Distance Invariance",
    desc: "Angular deviations are normalized against your calibrated baseline torso length and shoulder width, ensuring accurate tracking regardless of camera distance.",
  },
  {
    tag: "LOCAL DATA",
    title: "Zero Cloud Telemetry",
    desc: "Calibration baselines and posture history log exclusively to your local PostgreSQL/SQLite database. Complete privacy by design.",
  },
];

export default function Features() {
  return (
    <section id="features" style={{ padding: '80px 0 100px' }}>
      <div style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-blue)', marginBottom: 12 }}>
        Engineered Capabilities
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 48, letterSpacing: '-0.02em' }}>
        Technical Architecture & Specs
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {features.map((f, i) => (
          <div key={i} className="tech-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <span className="code-font" style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>
              {f.tag}
            </span>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>{f.title}</h3>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
