'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SellerReviewButtons({ storeId }: { storeId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function decide(decision: 'APPROVED' | 'REJECTED') {
    setLoading(true);
    const res = await fetch('/api/admin/sellers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId, decision }),
    });
    setLoading(false);
    if (!res.ok) {
      alert('Could not update. Are you signed in as an admin?');
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button onClick={() => decide('APPROVED')} disabled={loading} className="rounded bg-ink px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-chalk disabled:opacity-50">Approve</button>
      <button onClick={() => decide('REJECTED')} disabled={loading} className="rounded border border-hairline/20 px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-ink/70 disabled:opacity-50">Reject</button>
    </div>
  );
}
