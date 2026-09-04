import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const COOKIE_NAME = 'session';

export type SessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: 'BUYER' | 'SELLER';
};

export function signSession(payload: SessionPayload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifySession(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}
 export async function getSession(): Promise<SessionPayload | null> { const cookieStore = await cookies(); const token = cookieStore.get(COOKIE_NAME)?.value;

  if (!token) return null;
  return verifySession(token);
}

export function sessionCookieOptions() {
  return {
    name: COOKIE_NAME,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
