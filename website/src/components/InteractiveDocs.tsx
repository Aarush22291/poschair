import React, { useState } from 'react';

interface DocTopic {
  id: string;
  category: 'VISION' | 'ANALYSIS' | 'BLUETOOTH' | 'HARDWARE' | 'SAFETY';
  title: string;
  simpleTitle: string;
  shortDesc: string;
  laymanExplanation: string;
  techDetails: string[];
  icon: string;
  badge: string;
  color: string;
}

const DOC_TOPICS: DocTopic[] = [
  {
    id: 'vision',
    category: 'VISION',
    title: 'Client-Side AI Camera Detection',
    simpleTitle: '1. The AI Camera Eye',
    shortDesc: 'Tracks 33 body points in real time directly inside your web browser.',
    laymanExplanation:
      'Like a digital skeleton overlay, your computer webcam tracks your nose, shoulders, ears, and hips 60 times a second. Nothing is recorded or sent to the cloud—your video stays 100% private on your device.',
    techDetails: [
      'Model: MediaPipe Pose (full float16 model)',
      'Resolution: 640×480 normalized coordinates',
      'Execution: WebAssembly (WASM) GPU acceleration',
      'Privacy: 0 bytes uploaded to external servers',
    ],
    icon: '📷',
    badge: '60 FPS WASM',
    color: '#38bdf8',
  },
  {
    id: 'analyzer',
    category: 'ANALYSIS',
    title: 'Kinematic Posture & EMA Filter',
    simpleTitle: '2. Posture Angle Calculator',
    shortDesc: 'Measures slouching, side-tilting, and tech neck angles.',
    laymanExplanation:
      'Compares your current posture against your 5-second calibrated baseline. It calculates how far your spine leans forward, if your shoulders roll to one side, or if your head is craning forward (tech neck). An exponential filter prevents any camera jitter.',
    techDetails: [
      'Spine Angle: atan2(dx, -dy) relative to vertical',
      'Lateral Roll: Shoulder line tilt angle',
      'Neck Inclination: Ear-to-shoulder vector proxy',
      'EMA Smoothing: α = 0.35 temporal noise filter',
    ],
    icon: '📐',
    badge: '±0.1° Accuracy',
    color: '#818cf8',
  },
  {
    id: 'engine',
    category: 'ANALYSIS',
    title: 'Paraspinal Decision Engine',
    simpleTitle: '3. Smart Motion Brain',
    shortDesc: 'Converts posture errors into millimeter motor pushes.',
    laymanExplanation:
      'Translates posture angles into exact millimeter push commands for 6 cushions on your backrest. If you lean right, the right side pushes harder to re-center you. If you slump forward, the lower back cushions extend.',
    techDetails: [
      'Matrix: 2×3 Grid (UL, UR, ML, MR, LL, LR)',
      'Travel Range: 0mm (idle) to 55mm (max support)',
      'Modes: Office (1.0x), Gaming (1.2x), Study (0.85x)',
      'Velocity Boost: Up to +15mm for sudden slumping',
    ],
    icon: '🧠',
    badge: '0–55mm Travel',
    color: '#a855f7',
  },
  {
    id: 'ble',
    category: 'BLUETOOTH',
    title: 'NimBLE Binary Protocol',
    simpleTitle: '4. Wireless Command Link',
    shortDesc: 'Sends packed 8-byte position commands over Bluetooth.',
    laymanExplanation:
      'The browser talks wirelessly to the chair via Bluetooth. Every fraction of a second, it sends a tiny 8-byte message containing the target push distance for all 6 motors, protected by a safety checksum.',
    techDetails: [
      'Header: 0xA5 start byte',
      'Payload: 6 bytes for UL, UR, ML, MR, LL, LR positions',
      'Checksum: XOR verification byte',
      'Rate: 50Hz LEDC PWM update frequency',
    ],
    icon: '📡',
    badge: '50Hz NimBLE',
    color: '#38bdf8',
  },
  {
    id: 'hardware',
    category: 'HARDWARE',
    title: 'ESP32 & BTS7960 Driver Grid',
    simpleTitle: '5. Motors & Backrest Support',
    shortDesc: '6 DC geared motors drive worm-rack actuators into your back.',
    laymanExplanation:
      'Inside the chair, a microchip receives the Bluetooth message and powers 6 high-torque motors. Each motor winds a flexible steel strip that gently pushes a soft foam pad into your back muscles.',
    techDetails: [
      'MCU: ESP32 DevKit V1 (240MHz dual-core)',
      'Drivers: 6× BTS7960 High-Current H-Bridges',
      'Strips: 65Mn pre-curved spring steel',
      'Contact: Dual paraspinal muscle line placement',
    ],
    icon: '⚙️',
    badge: '6x H-Bridge',
    color: '#f59e0b',
  },
  {
    id: 'safety',
    category: 'SAFETY',
    title: 'Watchdog Failsafe System',
    simpleTitle: '6. Auto-Retract Safety',
    shortDesc: 'Automatically retracts all motors if connection drops.',
    laymanExplanation:
      'Your safety comes first: if your laptop battery dies, Bluetooth disconnects, or you close the browser tab, the chair automatically detects the silence within 2 seconds and pulls all 6 cushions safely flat.',
    techDetails: [
      'Watchdog Timeout: 2000ms hardware timer',
      'Home Position: All motors retract to 0mm',
      'Voltage Sensing: GPIO34 12V ADC divider check',
      'Common Ground: Single bus reference line',
    ],
    icon: '🛡️',
    badge: '2s Failsafe',
    color: '#22c55e',
  },
];

export default function InteractiveDocs() {
  const [activeId, setActiveId] = useState<string>('vision');
  const activeTopic = DOC_TOPICS.find((t) => t.id === activeId) || DOC_TOPICS[0];

  return (
    <section id="system-docs" style={{ padding: '80px 0 100px' }}>
      <div style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-blue)', marginBottom: 12 }}>
        Interactive Documentation Guide
      </div>
      <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 16, letterSpacing: '-0.02em' }}>
        How PosChair Works (Hover & Explore)
      </h2>
      <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 620, marginBottom: 40 }}>
        Hover or click on any component below to reveal a beginner-friendly explanation and the exact engineering specifications behind it.
      </p>

      {/* Main Interactive Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1.2fr 1fr',
        gap: 28,
        alignItems: 'start',
      }}>
        {/* Left Column: Interactive Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {DOC_TOPICS.map((topic) => {
            const isHovered = topic.id === activeId;
            return (
              <div
                key={topic.id}
                onMouseEnter={() => setActiveId(topic.id)}
                onClick={() => setActiveId(topic.id)}
                className="tech-card"
                style={{
                  padding: 20,
                  cursor: 'pointer',
                  borderColor: isHovered ? topic.color : 'var(--border)',
                  background: isHovered ? 'var(--surface-hover)' : 'var(--surface-card)',
                  boxShadow: isHovered ? `0 0 24px ${topic.color}25` : 'var(--shadow-card)',
                  transform: isHovered ? 'translateY(-2px)' : 'none',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <span style={{ fontSize: 22 }}>{topic.icon}</span>
                  <span className="code-font" style={{
                    fontSize: 9, fontWeight: 700,
                    padding: '2px 8px', borderRadius: 4,
                    background: `${topic.color}15`,
                    color: topic.color,
                    border: `1px solid ${topic.color}40`,
                  }}>
                    {topic.badge}
                  </span>
                </div>
                <h4 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>
                  {topic.simpleTitle}
                </h4>
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {topic.shortDesc}
                </p>
              </div>
            );
          })}
        </div>

        {/* Right Column: Deep Explanation Display Panel */}
        <div className="tech-card" style={{
          padding: 28,
          borderColor: `${activeTopic.color}40`,
          boxShadow: `0 12px 36px ${activeTopic.color}15`,
          background: '#0a0d14',
          position: 'sticky',
          top: 84,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: `${activeTopic.color}18`,
              border: `1px solid ${activeTopic.color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 22,
            }}>
              {activeTopic.icon}
            </div>
            <div>
              <span className="code-font" style={{ fontSize: 10, color: activeTopic.color, fontWeight: 700, letterSpacing: '0.08em' }}>
                {activeTopic.category} COMPONENT
              </span>
              <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)' }}>
                {activeTopic.title}
              </h3>
            </div>
          </div>

          {/* Simple Layman Explanation Box */}
          <div style={{
            background: 'var(--surface-base)',
            padding: 16,
            borderRadius: 12,
            border: '1px solid var(--border)',
            marginBottom: 20,
          }}>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent-blue)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
              💡 Simple Explanation (For Everyone)
            </span>
            <p style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>
              {activeTopic.laymanExplanation}
            </p>
          </div>

          {/* Technical Specs List */}
          <div>
            <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 10 }}>
              🛠️ Technical Specs & Formulas
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {activeTopic.techDetails.map((detail, idx) => (
                <div key={idx} className="code-font" style={{
                  fontSize: 12,
                  color: 'var(--text-secondary)',
                  background: 'rgba(255,255,255,0.02)',
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}>
                  <span style={{ color: activeTopic.color }}>•</span>
                  {detail}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
