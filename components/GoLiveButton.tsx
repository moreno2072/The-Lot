'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function GoLiveButton({ listingId }: { listingId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/listings/${listingId}/go-live`, { method: 'POST' });
    setLoading(false);
    router.push(`/listing/${listingId}`);
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded bg-hammer px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-chalk disabled:opacity-50"
    >
      {loading ? 'Starting…' : 'Go live'}
    </button>
  );
}
