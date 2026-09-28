import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession } from '@/lib/auth';

function isAdmin(email: string | undefined) {
  const list = (process.env.ADMIN_EMAILS || '').split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);
  return Boolean(email && list.includes(email.toLowerCase()));
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdmin(session.email)) {
    return NextResponse.json({ error: 'Not authorized.' }, { status: 403 });
  }

  const { storeId, decision } = await req.json();
  if (!storeId || (decision !== 'APPROVED' && decision !== 'REJECTED')) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }

  await prisma.store.update({
    where: { id: storeId },
    data: { sellerStatus: decision, reviewedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}
