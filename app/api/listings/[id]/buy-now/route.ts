import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'You must be signed in to buy this.' }, { status: 401 });
  }

  const { id } = await params;
  const listing = await prisma.listing.findUnique({ where: { id } });

  if (!listing) {
    return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }
  if (listing.status !== 'LIVE') {
    return NextResponse.json({ error: 'This listing is not live.' }, { status: 400 });
  }
  if (!listing.buyNowPrice) {
    return NextResponse.json({ error: 'Buy Now is not available for this listing.' }, { status: 400 });
  }

  const updated = await prisma.listing.update({
    where: { id },
    data: { status: 'ENDED', currentPrice: listing.buyNowPrice },
  });

  return NextResponse.json({ listing: updated });
}
