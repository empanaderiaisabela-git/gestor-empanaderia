import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { canVisit, homeFor } from '@/config/navigation';
import type { UserSession } from '@/features/auth/domain/auth.schema';
import { verifyToken } from '@/lib/auth/jwt';

const PUBLIC_PATHS = ['/login', '/favicon.ico', '/api/public', '/home', '/product'];
const STATIC_FILE = /\.(png|jpg|jpeg|svg|css|js|ico)$/;

type Session = { user: UserSession | null; invalid: boolean };

const isPublic = (pathname: string): boolean => PUBLIC_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`));
const redirectTo = (request: NextRequest, path: string): NextResponse => NextResponse.redirect(new URL(path, request.url));

async function readSession(token: string | undefined): Promise<Session> {
  if (!token) return { user: null, invalid: false };
  try {
    return { user: await verifyToken(token), invalid: false };
  } catch {
    return { user: null, invalid: true };
  }
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith('/_next') || pathname.startsWith('/__next') || STATIC_FILE.test(pathname)) return NextResponse.next();

  const { user, invalid } = await readSession(request.cookies.get('session')?.value);
  if (invalid) {
    const response = redirectTo(request, '/home');
    response.cookies.delete('session');
    return response;
  }
  if (!user) return isPublic(pathname) ? NextResponse.next() : redirectTo(request, '/home');
  if (pathname === '/login') return redirectTo(request, homeFor(user.role));
  if (user.role !== 'admin' && !isPublic(pathname) && !canVisit(user.role, pathname)) return redirectTo(request, homeFor(user.role));
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
