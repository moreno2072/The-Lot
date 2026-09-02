import Link from 'next/link';
import { prisma } from '@/lib/prisma';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const statusLabel: Record<string, string> = {
  LIVE: 'Live now',
  UPCOMING: 'Upcoming',
  ENDED: 'Ended',
};

export default async function HomePage() {
  const listings = await prisma.listing.findMany({
    include: { store: true },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });

  const live = listings.filter((l) => l.status === 'LIVE');
  const upcoming = listings.filter((l) => l.status === 'UPCOMING');
  const ended = listings.filter((l) => l.status === 'ENDED');

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <section className="mb-16">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-hammer">The hammer falls fast</p>
        <h1 className="mt-3 max-w-2xl font-display text-5xl leading-[1.05] text-ink">
          Watch the seller. Read the room. Win the lot.
        </h1>
        <p className="mt-4 max-w-xl text-ink/70">
          Every listing here is hosted live by the person selling it. Bid in real time,
          ask questions in chat, and check out the moment the gavel drops.
        </p>
      </section>

      <FeedSection title="Live now" items={live} emptyText="Nothing live at the moment — check back soon." />
      <FeedSection title="Upcoming drops" items={upcoming} emptyText="No upcoming drops scheduled yet." />
      <FeedSection title="Recently ended" items={ended} emptyText="No past lots yet." />
    </div>
  );
}

function FeedSection({
  title,
  items,
  emptyText,
}: {
  title: string;
  items: Awaited<ReturnType<typeof prisma.listing.findMany>>;
  emptyText: string;
}) {
  return (
    <section className="mb-14">
      <div className="mb-5 flex items-baseline justify-between border-b border-hairline/10 pb-3">
        <h2 className="font-display text-2xl text-ink">{title}</h2>
      </div>

      {items.length === 0 ? (
        <p className="font-mono text-sm text-ink/40">{emptyText}</p>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((listing: any) => (
            <Link
              key={listing.id}
              href={`/listing/${listing.id}`}
              className="group overflow-hidden rounded border border-hairline/10 bg-white/40 transition-transform hover:-translate-y-0.5"
            >
              <div className="relative aspect-[4/3] w-full bg-ink/5">
                {listing.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={listing.imageUrl} alt={listing.title} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center font-display text-ink/20 text-3xl">
                    {listing.title.slice(0, 1)}
                  </div>
                )}
                {listing.status === 'LIVE' && (
                  <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded bg-hammer px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-chalk">
                    <span className="h-1.5 w-1.5 rounded-full bg-chalk animate-pulseLive" />
                    Live
                  </span>
                )}
              </div>
              <div className="p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">
                  {listing.store.name} · {statusLabel[listing.status]}
                </p>
                <h3 className="mt-1 font-display text-lg text-ink group-hover:text-hammer transition-colors">
                  {listing.title}
                </h3>
                <p className="mt-2 font-mono text-sm text-ink/70">
                  {listing.status === 'ENDED' ? 'Sold for ' : 'Current bid '}
                  <span className="text-ink">{formatPrice(listing.currentPrice)}</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}
