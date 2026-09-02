import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = getSession();
  if (!session || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Only sellers can start a live listing.' }, { status: 403 });
  }

  const listing = await prisma.listing.findUnique({
    where: { id: params.id },
    include: { store: true },
  });

  if (!listing || listing.store.sellerId !== session.userId) {
    return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }

  const updated = await prisma.listing.update({
    where: { id: params.id },
    data: { status: 'LIVE' },
  });

  return NextResponse.json({ listing: updated });
}
