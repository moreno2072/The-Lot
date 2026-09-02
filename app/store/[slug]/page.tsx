import Link from 'next/link';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function StorePage({ params }: { params: { slug: string } }) {
  const store = await prisma.store.findUnique({
    where: { slug: params.slug },
    include: { listings: { orderBy: [{ status: 'asc' }, { createdAt: 'desc' }] }, seller: true },
  });

  if (!store) notFound();

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="border-b border-hairline/10 pb-8">
        <p className="font-mono text-xs uppercase tracking-widest text-ink/40">Storefront</p>
        <h1 className="mt-2 font-display text-4xl text-ink">{store.name}</h1>
        {store.description && <p className="mt-3 max-w-xl text-ink/70">{store.description}</p>}
      </div>

      <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {store.listings.map((listing) => (
          <Link
            key={listing.id}
            href={`/listing/${listing.id}`}
            className="group overflow-hidden rounded border border-hairline/10 bg-white/40 transition-transform hover:-translate-y-0.5"
          >
            <div className="p-4">
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink/40">{listing.status}</p>
              <h3 className="mt-1 font-display text-lg text-ink group-hover:text-hammer transition-colors">
                {listing.title}
              </h3>
              <p className="mt-2 font-mono text-sm text-ink/70">{formatPrice(listing.currentPrice)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
