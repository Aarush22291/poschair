import Head from 'next/head';
import Nav from '../components/Nav';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import DownloadButton from '../components/DownloadButton';
import Footer from '../components/Footer';

export default function Home() {
  return (
    <>
      <Head>
        <title>PosChair v1.3 — AI-Powered Active Posture Correction Chair</title>
        <meta name="description" content="Open-source AI posture correction. MediaPipe vision detects slouching; 2x3 paraspinal motor matrix corrects your posture in real time." />
        <meta property="og:image" content="/og-image.png" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </Head>

      <Nav />

      <main style={{ maxWidth: 1140, margin: '0 auto', padding: '0 24px' }}>
        <Hero />
        <HowItWorks />
        <Features />

        {/* Technical Specs Comparison Table */}
        <section style={{ padding: '60px 0 100px', borderTop: '1px solid var(--border)' }}>
          <div style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent-blue)', marginBottom: 12 }}>
            Engineering Reference
          </div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 40, letterSpacing: '-0.02em' }}>
            System Architecture Overview
          </h2>

          <div className="tech-card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14, textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'var(--surface-base)', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Component</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Specification / Protocol</th>
                  <th style={{ padding: '16px 24px', color: 'var(--text-muted)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Performance / Guarantee</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { component: 'Actuator Grid', spec: '2×3 Paraspinal matrix (UL, UR, ML, MR, LL, LR)', perf: '0–55mm travel, 65Mn pre-curved steel' },
                  { component: 'Motor Driver', spec: '6× BTS7960 High-Current H-Bridge Drivers', perf: '50Hz LEDC PWM frequency' },
                  { component: 'Microcontroller', spec: 'ESP32 DevKit V1 (38-pin, 240MHz dual-core)', perf: '2000ms watchdog hardware failsafe' },
                  { component: 'Vision Pipeline', spec: 'MediaPipe Pose (full float16 model)', perf: '33 3D landmarks @ 60 FPS in WASM' },
                  { component: 'Wireless Protocol', spec: 'NimBLE Web Bluetooth API (8-byte binary packets)', perf: '<50ms roundtrip packet latency' },
                  { component: 'Biomechanical Filter', spec: 'Exponential Moving Average (EMA α=0.35)', perf: 'Jitter-free scale-invariant tracking' },
                ].map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < 5 ? '1px solid var(--border)' : 'none' }}>
                    <td style={{ padding: '16px 24px', fontWeight: 700, color: 'var(--text-primary)' }}>{row.component}</td>
                    <td className="code-font" style={{ padding: '16px 24px', color: 'var(--accent-blue)', fontSize: 13 }}>{row.spec}</td>
                    <td style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{row.perf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Download Section */}
        <section style={{ textAlign: 'center', padding: '100px 0 120px', borderTop: '1px solid var(--border)' }}>
          <div className="section-tag" style={{ marginBottom: 20 }}>
            Open Source Release
          </div>
          <h2 style={{ fontSize: '36px', marginBottom: '16px', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Ready to correct your posture?
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '36px', maxWidth: '540px', margin: '0 auto 36px', fontSize: 16 }}>
            Download the pre-compiled Windows executable, run in your browser, or flash the ESP32 firmware directly from GitHub.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16 }}>
            <DownloadButton />
          </div>
          <p style={{ color: 'var(--text-muted)', marginTop: 24, fontSize: 13 }}>
            Requires Windows 10/11, a webcam, and Bluetooth LE support.
          </p>
        </section>
      </main>

      <Footer />
    </>
  );
}
