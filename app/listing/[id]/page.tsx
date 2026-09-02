import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import ListingRoom from '@/components/ListingRoom';

export default async function ListingPage({ params }: { params: { id: string } }) {
  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: {
      store: true,
      bids: { orderBy: { createdAt: 'desc' }, take: 20, include: { user: true } },
      chatMessages: { orderBy: { createdAt: 'asc' }, take: 100, include: { user: true } },
    },
  });

  if (!listing) notFound();

  const session = getSession();

  return (
    <ListingRoom
      listing={{
        id: listing.id,
        title: listing.title,
        description: listing.description,
        imageUrl: listing.imageUrl,
        status: listing.status,
        currentPrice: listing.currentPrice,
        bidIncrement: listing.bidIncrement,
        storeName: listing.store.name,
        storeSlug: listing.store.slug,
      }}
      initialBids={listing.bids.map((b) => ({
        id: b.id,
        userName: b.user.name,
        amount: b.amount,
        createdAt: b.createdAt.toISOString(),
      }))}
      initialChat={listing.chatMessages.map((c) => ({
        id: c.id,
        userName: c.user.name,
        message: c.message,
        createdAt: c.createdAt.toISOString(),
      }))}
      session={session}
    />
  );
}
