'use client';

import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="font-mono text-xs uppercase tracking-widest text-ink/70 hover:text-hammer"
    >
      Sign out
    </button>
  );
}
