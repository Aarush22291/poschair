import { useState, useEffect } from 'react';
import DownloadButton from './DownloadButton';

type Preset = 'normal' | 'slouch' | 'leanRight' | 'leanLeft';

export default function Hero() {
  const [preset, setPreset] = useState<Preset>('slouch');

  // Simulated actuator extension values (0–55mm) for each preset
  const PRESET_POSITIONS: Record<Preset, number[]> = {
    normal:    [0, 0, 0, 0, 0, 0],
    slouch:    [22, 22, 55, 55, 42, 42],  // Mid & lower lumbar extend to support posture
    leanRight: [12, 45, 18, 55, 15, 48],  // Right column extends to push body back to center
    leanLeft:  [45, 12, 55, 18, 48, 15],  // Left column extends to push body back to center
  };

  const positions = PRESET_POSITIONS[preset];
  const activeCount = positions.filter((p) => p > 3).length;

  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1.05fr',
      gap: '56px',
      padding: '120px 0 80px',
      alignItems: 'center',
    }}>
      {/* Left side: Heading & CTA */}
      <div style={{ textAlign: 'left' }}>
        <div className="section-tag" style={{ marginBottom: 24 }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'var(--accent-blue)',
            boxShadow: '0 0 10px var(--accent-blue)',
          }} />
          Patent Pending · PosChair Technologies Inc.
        </div>

        <h1 style={{
          fontSize: '56px',
          fontWeight: 800,
          lineHeight: 1.08,
          letterSpacing: '-0.03em',
          marginBottom: '24px',
          color: 'var(--text-primary)',
        }}>
          Active Paraspinal<br />
          <span style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            Spine Correction
          </span><br />
          Using Client-Side AI.
        </h1>

        <p style={{
          fontSize: '18px',
          color: 'var(--text-secondary)',
          lineHeight: 1.65,
          marginBottom: '40px',
          maxWidth: '520px',
        }}>
          PosChair tracks 33 3D body landmarks at 60 FPS in WebAssembly. When posture degrades, it commands a 6-zone motorized paraspinal backrest to actively push your spine back into alignment.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <DownloadButton />
            <a
              href="https://github.com/brovk2008/Poschair_final"
              target="_blank"
              rel="noopener noreferrer"
              className="tech-btn-secondary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
              </svg>
              View GitHub (v1.3)
            </a>
          </div>

          <div style={{ display: 'flex', gap: 20, fontSize: '12px', color: 'var(--text-muted)' }}>
            <span>✓ Zero Cloud Telemetry</span>
            <span>✓ 0–55mm Travel Range</span>
            <span>✓ NimBLE BLE Protocol</span>
          </div>
        </div>
      </div>

      {/* Right side: Interactive 2x3 Hardware Actuator Simulator Console */}
      <div className="tech-card" style={{ padding: 28, background: '#0a0d14' }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottom: '1px solid var(--border)',
          paddingBottom: 14,
        }}>
          <div>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Hardware Telemetry Simulator
            </span>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)' }}>
              2×3 Paraspinal Matrix
            </h3>
          </div>
          <span className="code-font" style={{
            fontSize: 11,
            padding: '4px 10px',
            borderRadius: 6,
            background: activeCount > 0 ? 'rgba(239, 68, 68, 0.12)' : 'rgba(34, 197, 94, 0.12)',
            color: activeCount > 0 ? 'var(--accent-red)' : 'var(--accent-green)',
            border: `1px solid ${activeCount > 0 ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`,
            fontWeight: 600,
          }}>
            {activeCount > 0 ? `${activeCount} MOTORS ACTIVE` : 'ALL IDLE'}
          </span>
        </div>

        {/* Posture Preset Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 24 }}>
          {(['slouch', 'leanRight', 'leanLeft', 'normal'] as Preset[]).map((p) => {
            const labels: Record<Preset, string> = {
              normal:    'Normal Sit',
              slouch:    'Forward Slouch',
              leanRight: 'Lean Right',
              leanLeft:  'Lean Left',
            };
            const selected = preset === p;
            return (
              <button
                key={p}
                onClick={() => setPreset(p)}
                style={{
                  padding: '8px 6px',
                  borderRadius: 8,
                  fontSize: 11,
                  fontWeight: 600,
                  border: selected ? '1px solid var(--accent-blue)' : '1px solid var(--border)',
                  background: selected ? 'rgba(56, 189, 248, 0.12)' : 'var(--surface-base)',
                  color: selected ? 'var(--accent-blue)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {labels[p]}
              </button>
            );
          })}
        </div>

        {/* Interactive Visualizer: Blue Oval Backrest & 2x3 Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '130px 1fr',
          gap: 24,
          alignItems: 'center',
          background: 'var(--surface-base)',
          padding: 20,
          borderRadius: 14,
          border: '1px solid var(--border)',
        }}>
          {/* Blue Oval Chair Backrest Diagram */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 100,
              height: 124,
              background: '#0099ff',
              borderRadius: '50px / 62px',
              border: '2px solid #000',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '12px 14px',
              gap: 8,
              position: 'relative',
              boxShadow: 'inset 0 0 14px rgba(0, 0, 0, 0.4)',
            }}>
              {[0, 1, 2].map((rowIdx) => (
                <div key={rowIdx} style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
                  {[0, 1].map((colIdx) => {
                    const moduleIdx = rowIdx * 2 + colIdx;
                    const pos = positions[moduleIdx];
                    const isActive = pos > 3;
                    return (
                      <div
                        key={colIdx}
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: '50%',
                          background: isActive ? '#ef4444' : '#facc15',
                          border: '2px solid #000',
                          boxShadow: isActive
                            ? '0 0 12px #ef4444, inset 0 0 4px #990000'
                            : 'inset 0 0 2px rgba(0,0,0,0.3)',
                          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 8,
                          fontWeight: 800,
                          color: isActive ? '#ffffff' : '#000000',
                          transform: isActive ? 'scale(1.15)' : 'scale(1.0)',
                        }}
                      >
                        {pos > 0 ? `${pos}` : ''}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <span style={{ fontSize: 9, fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              front side of chair
            </span>
          </div>

          {/* Module Telemetry List */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 14px' }}>
            {[
              { label: 'Upper Left (UL)',  idx: 0 },
              { label: 'Upper Right (UR)', idx: 1 },
              { label: 'Mid Left (ML)',    idx: 2 },
              { label: 'Mid Right (MR)',   idx: 3 },
              { label: 'Lower Left (LL)',  idx: 4 },
              { label: 'Lower Right (LR)', idx: 5 },
            ].map((mod) => {
              const pos = positions[mod.idx];
              const pct = (pos / 55) * 100;
              const isActive = pos > 3;
              return (
                <div key={mod.idx} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                    <span style={{ color: 'var(--text-secondary)', fontSize: 10 }}>{mod.label}</span>
                    <span className="code-font" style={{
                      fontWeight: 700,
                      color: isActive ? 'var(--accent-red)' : 'var(--text-muted)',
                      fontSize: 11,
                    }}>
                      {pos}mm
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      background: isActive ? 'var(--accent-red)' : 'var(--accent-blue)',
                      transition: 'width 0.3s ease',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Real BLE Packet Telemetry */}
        <div className="code-font" style={{
          marginTop: 16,
          padding: '10px 14px',
          borderRadius: 8,
          background: 'rgba(0,0,0,0.5)',
          border: '1px solid var(--border)',
          fontSize: 10,
          color: 'var(--text-muted)',
          display: 'flex',
          justifyContent: 'space-between',
        }}>
          <span>TX Packet: 0xA5 {positions.map(p => p.toString(16).padStart(2, '0').toUpperCase()).join(' ')} [XOR]</span>
          <span style={{ color: 'var(--accent-blue)' }}>NimBLE 50Hz</span>
        </div>
      </div>
    </section>
  );
}
