'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewListingForm() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const form = new FormData(e.currentTarget);

    const res = await fetch('/api/listings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: form.get('title'),
        description: form.get('description'),
        startingPrice: form.get('startingPrice'),
        bidIncrement: form.get('bidIncrement'),
        imageUrl: form.get('imageUrl'),
      }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || 'Something went wrong.');
      return;
    }

    (e.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded border border-hairline/10 bg-white/40 p-4">
      <div>
        <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Title</label>
        <input name="title" required className="w-full rounded border border-hairline/20 bg-white px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Description</label>
        <textarea name="description" rows={3} className="w-full rounded border border-hairline/20 bg-white px-3 py-2 text-sm" />
      </div>
      <div>
        <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Image URL</label>
        <input name="imageUrl" placeholder="https://…" className="w-full rounded border border-hairline/20 bg-white px-3 py-2 text-sm" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Starting price ($)</label>
          <input name="startingPrice" type="number" min="1" step="0.01" required className="w-full rounded border border-hairline/20 bg-white px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block font-mono text-xs uppercase tracking-widest text-ink/60">Bid increment ($)</label>
          <input name="bidIncrement" type="number" min="0.5" step="0.01" defaultValue="1.00" className="w-full rounded border border-hairline/20 bg-white px-3 py-2 text-sm" />
        </div>
      </div>

      {error && <p className="text-sm text-hammer">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-ink py-2.5 font-mono text-xs uppercase tracking-widest text-chalk hover:bg-hammer transition-colors disabled:opacity-50"
      >
        {loading ? 'Creating…' : 'Create listing'}
      </button>
    </form>
  );
}
