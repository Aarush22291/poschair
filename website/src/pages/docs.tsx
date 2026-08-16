import Head from 'next/head';
import Nav from '../components/Nav';
import Footer from '../components/Footer';
import InteractiveDocs from '../components/InteractiveDocs';

export default function DocsPage() {
  return (
    <>
      <Head>
        <title>PosChair Documentation & System Working Guide (v1.3)</title>
        <meta name="description" content="Complete documentation guide for PosChair v1.3: hardware wiring, BLE binary protocol, and pose decision engine architecture." />
      </Head>

      <Nav />

      <main style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
        {/* Header */}
        <section style={{ padding: '80px 0 40px', textAlign: 'center' }}>
          <div className="section-tag" style={{ marginBottom: 16 }}>
            Comprehensive Reference Manual
          </div>
          <h1 style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16 }}>
            PosChair Documentation & System Guide
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto' }}>
            Everything you need to know about PosChair—explained simply for beginners, with full hardware wiring schematics and BLE protocol specifications for developers.
          </p>
        </section>

        {/* Interactive Hover Explorer Section */}
        <InteractiveDocs />

        {/* Hardware Wiring Guide Section */}
        <section style={{ padding: '60px 0 80px', borderTop: '1px solid var(--border)' }}>
          <div style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-amber)', marginBottom: 12 }}>
            Hardware Engineering Guide
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24, letterSpacing: '-0.02em' }}>
            ESP32 & BTS7960 Wiring Reference
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 680, marginBottom: 32 }}>
            Follow this pinout map to connect the ESP32 DevKit V1 controller, 6× BTS7960 motor drivers, 12V battery supply, and battery voltage divider.
          </p>

          <div className="tech-card" style={{ padding: 0, overflow: 'hidden', marginBottom: 32 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-base)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 11 }}>Module</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 11 }}>Body Position</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 11 }}>BTS7960 RPWM</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 11 }}>BTS7960 LPWM</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: 11 }}>Shared Enable</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { mod: 'M0', pos: 'Upper-Left (UL)', rpwm: 'GPIO25', lpwm: 'GPIO26', en: 'GPIO5' },
                  { mod: 'M1', pos: 'Upper-Right (UR)', rpwm: 'GPIO27', lpwm: 'GPIO16', en: 'GPIO5' },
                  { mod: 'M2', pos: 'Mid-Left (ML)', rpwm: 'GPIO14', lpwm: 'GPIO13', en: 'GPIO5' },
                  { mod: 'M3', pos: 'Mid-Right (MR)', rpwm: 'GPIO17', lpwm: 'GPIO18', en: 'GPIO5' },
                  { mod: 'M4', pos: 'Lower-Left (LL)', rpwm: 'GPIO21', lpwm: 'GPIO22', en: 'GPIO5' },
                  { mod: 'M5', pos: 'Lower-Right (LR)', rpwm: 'GPIO23', lpwm: 'GPIO19', en: 'GPIO5' },
                ].map((r, i) => (
                  <tr key={i} style={{ borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                    <td className="code-font" style={{ padding: '14px 20px', fontWeight: 700, color: 'var(--accent-amber)' }}>{r.mod}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-primary)' }}>{r.pos}</td>
                    <td className="code-font" style={{ padding: '14px 20px', color: 'var(--accent-blue)' }}>{r.rpwm}</td>
                    <td className="code-font" style={{ padding: '14px 20px', color: 'var(--accent-indigo)' }}>{r.lpwm}</td>
                    <td className="code-font" style={{ padding: '14px 20px', color: 'var(--accent-green)' }}>{r.en}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* BLE Protocol Section */}
        <section style={{ padding: '60px 0 80px', borderTop: '1px solid var(--border)' }}>
          <div style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-blue)', marginBottom: 12 }}>
            Protocol Specification
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 24, letterSpacing: '-0.02em' }}>
            BLE Binary Packet Structure (v1.3)
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, maxWidth: 680, marginBottom: 32 }}>
            Commands are packed into 8-byte write-without-response binary structures transmitted from the browser to the ESP32.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            <div className="tech-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Command Packet (App → ESP32)
              </h3>
              <div className="code-font" style={{ fontSize: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ padding: '8px 12px', background: 'var(--surface-base)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  Byte 0: Header <span style={{ color: 'var(--accent-blue)' }}>0xA5</span>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--surface-base)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  Byte 1–6: Module Positions <span style={{ color: 'var(--accent-green)' }}>0–55mm (UL, UR, ML, MR, LL, LR)</span>
                </div>
                <div style={{ padding: '8px 12px', background: 'var(--surface-base)', borderRadius: 6, border: '1px solid var(--border)' }}>
                  Byte 7: Checksum <span style={{ color: 'var(--accent-amber)' }}>XOR of Bytes 0–6</span>
                </div>
              </div>
            </div>

            <div className="tech-card" style={{ padding: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 16 }}>
                Test Vectors
              </h3>
              <div className="code-font" style={{ fontSize: 11, display: 'flex', flexDirection: 'column', gap: 10, color: 'var(--text-secondary)' }}>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>// All Retracted (Home)</span>
                  <div style={{ color: 'var(--accent-blue)', marginTop: 2 }}>A5 00 00 00 00 00 00 A5</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>// Mid Lumbar Correction (ML+MR 32mm)</span>
                  <div style={{ color: 'var(--accent-blue)', marginTop: 2 }}>A5 00 00 20 20 00 00 85</div>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>// Right Column Full Extension</span>
                  <div style={{ color: 'var(--accent-blue)', marginTop: 2 }}>A5 00 37 00 37 00 37 A0</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
