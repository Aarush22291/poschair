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
    desc: "Executes the full 33-landmark pose model client-side inside WebAssembly. The vision pipeline does not upload video frames or body coordinates.",
  },
  {
    tag: "HARDWARE BLE",
    title: "NimBLE 5.0 Low-Latency Protocol",
    desc: "Transmits 8-byte packed binary payloads with XOR checksums from Web Bluetooth to the ESP32 controller at up to 10Hz.",
  },
  {
    tag: "SAFETY",
    title: "Command-Link Watchdog",
    desc: "After 2 seconds without valid commands, firmware requests open-loop retraction. Independent hardware limits, force monitoring, and an emergency stop are still required for occupied testing.",
  },
  {
    tag: "BIOMECHANICS",
    title: "Scale & Distance Invariance",
    desc: "Angular deviations are normalized against your calibrated baseline torso length and shoulder width, ensuring accurate tracking regardless of camera distance.",
  },
  {
    tag: "LOCAL DATA",
    title: "Zero Cloud Telemetry",
    desc: "The desktop build stores calibration and posture history on the device; self-hosted deployments can use the included backend database.",
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
