import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import NewListingForm from '@/components/NewListingForm';
import GoLiveButton from '@/components/GoLiveButton';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function DashboardPage() {
  const session = getSession();
  if (!session || session.role !== 'SELLER') {
    redirect('/login');
  }

  const store = await prisma.store.findUnique({
    where: { sellerId: session!.userId },
    include: { listings: { orderBy: { createdAt: 'desc' } } },
  });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="font-display text-3xl text-ink">{store?.name}'s dashboard</h1>
      <p className="mt-1 text-sm text-ink/60">Create listings, then go live to start taking bids.</p>

      <div className="mt-10 grid grid-cols-1 gap-10 md:grid-cols-[1fr,320px]">
        <div>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-ink/50">Your listings</h2>
          <div className="space-y-3">
            {store?.listings.length === 0 && (
              <p className="font-mono text-sm text-ink/40">No listings yet — create your first one.</p>
            )}
            {store?.listings.map((listing) => (
              <div
                key={listing.id}
                className="flex items-center justify-between rounded border border-hairline/10 bg-white/40 px-4 py-3"
              >
                <div>
                  <p className="font-display text-lg text-ink">{listing.title}</p>
                  <p className="font-mono text-xs text-ink/50">
                    {listing.status} · {formatPrice(listing.currentPrice)}
                  </p>
                </div>
                {listing.status === 'UPCOMING' && <GoLiveButton listingId={listing.id} />}
                {listing.status === 'LIVE' && (
                  <a
                    href={`/listing/${listing.id}`}
                    className="rounded bg-hammer px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-chalk"
                  >
                    View live
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-ink/50">New listing</h2>
          <NewListingForm />
        </div>
      </div>
    </div>
  );
}
