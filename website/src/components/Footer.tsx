import Link from 'next/link'

export default function Footer() {
  return (
    <footer style={{
      borderTop:  '1px solid var(--border)',
      marginTop:   80,
      padding:    '40px 24px',
      background: 'rgba(10, 10, 15, 0.5)'
    }}>
      <div style={{
        maxWidth:       1100,
        margin:         '0 auto',
        display:        'flex',
        justifyContent: 'space-between',
        alignItems:     'center',
        flexWrap:       'wrap',
        gap:             16,
        fontSize:        13,
        color:          'var(--text-muted)',
      }}>
        <span>PosChair Technologies © {new Date().getFullYear()} · All Rights Reserved · Patent Pending</span>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link href="/terms"   style={{ color: 'var(--text-muted)' }}>Terms of Service</Link>
          <Link href="/privacy" style={{ color: 'var(--text-muted)' }}>Privacy Policy</Link>
          <a href="https://github.com/brovk2008/Poschair_final"
             target="_blank" rel="noopener noreferrer"
             style={{ color: 'var(--text-muted)' }}>Source Code</a>
        </div>
      </div>
    </footer>
  )
}
