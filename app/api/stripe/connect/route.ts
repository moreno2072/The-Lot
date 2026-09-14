import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'SELLER') {
    return NextResponse.json({ error: 'Only sellers can connect payouts.' }, { status: 403 });
  }

  if (!stripe) {
    return NextResponse.json(
      { error: 'Stripe is not configured yet. Add STRIPE_SECRET_KEY first.' },
      { status: 501 },
    );
  }

  const store = await prisma.store.findUnique({ where: { sellerId: session.userId } });
  if (!store) {
    return NextResponse.json({ error: 'No store found for this seller.' }, { status: 404 });
  }

  let accountId = store.stripeAccountId;

  if (!accountId) {
    const account = await stripe.v2.core.accounts.create({
      contact_email: session.email,
      dashboard: 'express', 
      identity: {
        country: 'us',
        entity_type: 'individual',
      },
      defaults: {
        responsibilities: {
          fees_collector: 'application',
          losses_collector: 'application',
        },
      },
      configuration: {
        recipient: {
          capabilities: {
            stripe_balance: {
              stripe_transfers: { requested: true },
            },
          },
        },
      },
      include: ['configuration.recipient'],
    });
    accountId = account.id;
    await prisma.store.update({
      where: { id: store.id },
      data: { stripeAccountId: accountId },
    });
  }

  const origin = req.nextUrl.origin;
  const accountLink = await stripe.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        configurations: ['recipient'],
        refresh_url: `${origin}/dashboard`,
        return_url: `${origin}/api/stripe/connect/callback`,
      },
    },
  });

  return NextResponse.json({ url: accountLink.url });
}
