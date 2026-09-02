import Link from 'next/link';
import type { SessionPayload } from '@/lib/auth';
import LogoutButton from './LogoutButton';

export default function NavBar({ session }: { session: SessionPayload | null }) {
  return (
    <header className="sticky top-0 z-40 border-b border-hairline/10 bg-chalk/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="font-display text-2xl tracking-tight text-ink">
          Lot<span className="text-hammer">.</span>
        </Link>

        <nav className="flex items-center gap-6 font-mono text-xs uppercase tracking-widest text-ink/70">
          <Link href="/" className="hover:text-ink">Live &amp; Upcoming</Link>
          {session?.role === 'SELLER' && (
            <Link href="/dashboard" className="hover:text-ink">Dashboard</Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          {session ? (
            <>
              <span className="font-mono text-xs text-ink/60">{session.name}</span>
              <LogoutButton />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="font-mono text-xs uppercase tracking-widest text-ink/70 hover:text-ink"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded bg-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-chalk hover:bg-hammer transition-colors"
              >
                Join
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
