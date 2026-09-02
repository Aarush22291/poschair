import Head from 'next/head'
import Nav from '../components/Nav'
import Footer from '../components/Footer'

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 40 }}>
    <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: 'var(--text-primary)' }}>{title}</h2>
    <div style={{ color: 'var(--text-secondary)', lineHeight: 1.75 }}>{children}</div>
  </div>
)

export default function Terms() {
  return (
    <>
      <Head>
        <title>Terms of Service — PosChair</title>
      </Head>
      <Nav />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '80px 24px' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, marginBottom: 8, color: 'var(--text-primary)' }}>Terms of Service</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: 14, marginBottom: 56 }}>
          Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
        </p>

        <Section title="1. Not medical advice">
          <p>PosChair is an experimental hardware and software project. It is not a medical device and does not constitute medical advice. Do not use PosChair as a substitute for professional medical or physiotherapy guidance. If you have back, neck, or spinal conditions, consult a qualified healthcare professional before use.</p>
        </Section>

        <Section title="2. Use at your own risk">
          <p>PosChair involves physical motor-driven hardware attached to a chair. Improper setup, hardware failure, or software bugs could cause unexpected movement. You are solely responsible for safe installation, use, and supervision of the hardware. The project maintainers accept no liability for personal injury, property damage, or any other harm arising from use of this software or hardware.</p>
        </Section>

        <Section title="3. Open-source license">
          <p>PosChair is released under the MIT License. You may use, modify, and distribute the source code freely, subject to the terms of that license. No warranty is provided, express or implied.</p>
        </Section>

        <Section title="4. No warranty">
          <p>This software is provided &quot;as is&quot; without warranty of any kind. The authors make no guarantees about correctness, reliability, or fitness for any particular purpose. Use in safety-critical or commercial applications is not recommended without independent review.</p>
        </Section>

        <Section title="5. Changes to these terms">
          <p>We may update these terms at any time. The latest version is always at this URL. Continued use after changes constitutes acceptance of the updated terms.</p>
        </Section>

        <Section title="6. Contact">
          <p>For questions, open an issue on the <a href="https://github.com/brovk2008/Poschair_final" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>GitHub repository</a>.</p>
        </Section>
      </main>
      <Footer />
    </>
  )
}
