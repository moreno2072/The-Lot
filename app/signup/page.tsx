'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [role, setRole] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.get('name'),
        email: form.get('email'),
        password: form.get('password'),
        role,
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Something went wrong.');
      return;
    }

    router.push(role === 'SELLER' ? '/dashboard' : '/');
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display text-3xl text-ink">Create an account</h1>
      <p className="mt-2 text-sm text-ink/60">
        Join as a buyer to bid, or a seller to host your own drops.
      </p>

      <div className="mt-6 flex gap-2 font-mono text-xs uppercase tracking-widest">
        <button
          type="button"
          onClick={() => setRole('BUYER')}
          className={`flex-1 rounded border px-3 py-2 ${role === 'BUYER' ? 'border-ink bg-ink text-chalk' : 'border-hairline/20 text-ink/60'}`}
        >
          Buyer
        </button>
        <button
          type="button"
          onClick={() => setRole('SELLER')}
          className={`flex-1 rounded border px-3 py-2 ${role === 'SELLER' ? 'border-ink bg-ink text-chalk' : 'border-hairline/20 text-ink/60'}`}
        >
          Seller
        </button>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Name</label>
          <input name="name" required className="w-full rounded border border-hairline/20 bg-white/60 px-3 py-2 text-ink" />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Email</label>
          <input name="email" type="email" required className="w-full rounded border border-hairline/20 bg-white/60 px-3 py-2 text-ink" />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Password</label>
          <input name="password" type="password" required minLength={8} className="w-full rounded border border-hairline/20 bg-white/60 px-3 py-2 text-ink" />
        </div>

        {error && <p className="text-sm text-hammer">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-ink py-2.5 font-mono text-xs uppercase tracking-widest text-chalk hover:bg-hammer transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>
    </div>
  );
}
