import Link from 'next/link';

export default function Nav() {
  return (
    <nav style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      background: 'rgba(8, 9, 13, 0.85)',
      backdropFilter: 'blur(16px)',
      borderBottom: '1px solid var(--border)',
    }}>
      <div style={{
        maxWidth: 1140,
        margin: '0 auto',
        padding: '0 24px',
        height: 64,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}>
        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-primary)', fontWeight: 800, fontSize: 18, letterSpacing: '-0.02em' }}>
          <div style={{
            width: 28, height: 28, borderRadius: 6,
            background: 'var(--surface-card)',
            border: '1px solid var(--border-bright)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--accent-blue)', fontSize: 14, fontWeight: 800,
          }}>
            P
          </div>
          POS<span style={{ color: 'var(--accent-blue)' }}>CHAIR</span>
          <span className="code-font" style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, padding: '2px 6px', borderRadius: 4, background: 'var(--surface-card)', border: '1px solid var(--border)' }}>
            v1.3
          </span>
        </Link>

        <div style={{ display: 'flex', gap: 28, fontSize: 14, alignItems: 'center' }}>
          <a href="#how-it-works" style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Pipeline</a>
          <a href="#features"     style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>Specs</a>
          <a
            href="https://github.com/brovk2008/Poschair_final"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: 'var(--text-primary)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 8,
              background: 'var(--surface-card)',
              border: '1px solid var(--border)',
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2z"/>
            </svg>
            GitHub
          </a>
        </div>
      </div>
    </nav>
  );
}
