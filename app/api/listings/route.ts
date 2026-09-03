import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

export async function GET() {
  const listings = await prisma.listing.findMany({
    include: { store: true },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  });
  return NextResponse.json({ listings });
}

export async function POST(req: NextRequest) {
 const session = await getSession();
  if (!session || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Only sellers can create listings.' }, { status: 403 });
  }

  const store = await prisma.store.findUnique({ where: { sellerId: session.userId } });
  if (!store) {
    return NextResponse.json({ error: 'No store found for this seller.' }, { status: 404 });
  }

  const { title, description, startingPrice, imageUrl, bidIncrement } = await req.json();
  if (!title || !startingPrice) {
    return NextResponse.json({ error: 'Title and starting price are required.' }, { status: 400 });
  }

  const listing = await prisma.listing.create({
    data: {
      storeId: store.id,
      title,
      description: description || '',
      imageUrl: imageUrl || null,
      startingPrice: Math.round(Number(startingPrice) * 100),
      currentPrice: Math.round(Number(startingPrice) * 100),
      bidIncrement: bidIncrement ? Math.round(Number(bidIncrement) * 100) : 100,
      status: 'UPCOMING',
    },
  });

  return NextResponse.json({ listing });
}
