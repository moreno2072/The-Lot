import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

// Requires STRIPE_SECRET_KEY in your environment. Get one free in test mode
// at https://dashboard.stripe.com/test/apikeys — no real charges happen
// until you switch to live keys.
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

export async function POST(req: NextRequest) {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'You must be signed in to check out.' }, { status: 401 });
  }

  const { listingId } = await req.json();
  const listing = await prisma.listing.findUnique({ where: { id: listingId } });
  if (!listing) {
    return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
  }
  if (listing.status !== 'ENDED') {
    return NextResponse.json({ error: 'This listing has not ended yet.' }, { status: 400 });
  }

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured. Add STRIPE_SECRET_KEY to your .env to enable checkout.' },
      { status: 501 },
    );
  }

  const order = await prisma.order.upsert({
    where: { listingId },
    update: {},
    create: {
      listingId,
      buyerId: session.userId,
      amount: listing.currentPrice,
      status: 'PENDING',
    },
  });

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: { name: listing.title },
          unit_amount: listing.currentPrice,
        },
        quantity: 1,
      },
    ],
    success_url: `${req.nextUrl.origin}/listing/${listingId}?checkout=success`,
    cancel_url: `${req.nextUrl.origin}/listing/${listingId}?checkout=cancelled`,
    metadata: { orderId: order.id, listingId },
  });

  await prisma.order.update({
    where: { id: order.id },
    data: { stripeSessionId: checkoutSession.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
