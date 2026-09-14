import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function GET(req: NextRequest) {
  const session = await getSession();
  const origin = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;

  if (!session || !stripe) {
    return NextResponse.redirect(`${origin}/dashboard`);
  }

  const store = await prisma.store.findUnique({ where: { sellerId: session.userId } });

  if (store?.stripeAccountId) {
    const account = await stripe.v2.core.accounts.retrieve(store.stripeAccountId, {
      include: ['configuration.recipient'],
    });
    const onboarded =
      account.configuration?.recipient?.capabilities?.stripe_balance?.stripe_transfers?.status === 'active';

    await prisma.store.update({
      where: { id: store.id },
      data: { stripeOnboarded: onboarded },
    });
  }

  return NextResponse.redirect(`${origin}/dashboard`);
}
