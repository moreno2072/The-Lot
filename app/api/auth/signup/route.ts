import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signSession, sessionCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password, name, role } = await req.json();

  if (!email || !password || !name) {
    return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: 'An account with that email already exists.' }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      name,
      role: role === 'SELLER' ? 'SELLER' : 'BUYER',
    },
  });

  // Sellers get a store automatically so they can start listing right away.
  if (user.role === 'SELLER') {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    await prisma.store.create({
      data: { name, slug: `${slug}-${user.id.slice(0, 6)}`, sellerId: user.id },
    });
  }

  const token = signSession({ userId: user.id, email: user.email, name: user.name, role: user.role });
  const res = NextResponse.json({ ok: true, user: { id: user.id, name: user.name, role: user.role } });
  const cookieOpts = sessionCookieOptions();
  res.cookies.set(cookieOpts.name, token, cookieOpts);
  return res;
}
