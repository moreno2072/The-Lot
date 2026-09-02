'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), password: form.get('password') }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Something went wrong.');
      return;
    }

    router.push('/');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl text-ink">Sign in</h1>
      <p className="mt-2 text-sm text-ink/60">Demo accounts: seller@demo.com / buyer@demo.com, password123</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Email</label>
          <input name="email" type="email" required className="w-full rounded border border-hairline/20 bg-white/60 px-3 py-2 text-ink" />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Password</label>
          <input name="password" type="password" required className="w-full rounded border border-hairline/20 bg-white/60 px-3 py-2 text-ink" />
        </div>

        {error && <p className="text-sm text-hammer">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-ink py-2.5 font-mono text-xs uppercase tracking-widest text-chalk hover:bg-hammer transition-colors disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
