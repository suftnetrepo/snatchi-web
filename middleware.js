import { NextResponse } from 'next/server';
import { AuthService } from './lib/AuthService';
import { getToken } from 'next-auth/jwt';

const isApiRoute = (pathname) => pathname.startsWith('/api');
const isAdminRoute = (pathname) =>
  pathname.startsWith('/protected/admin') || pathname.startsWith('/api/admin');

const denyAdminAccess = (req) => {
  if (isApiRoute(req.nextUrl.pathname)) {
    return NextResponse.json({ error: 'Forbidden', message: 'Administrator access required' }, { status: 403 });
  }

  return NextResponse.redirect(new URL('/login?error=admin_access_required', req.url));
};

export async function middleware(req) {
  try {
    const { pathname } = req.nextUrl;


    // -------------------------------------------
    // 2. Read Bearer authorization BEFORE NextAuth
    // -------------------------------------------
    const authHeader = req.headers.get("x-access-token");

    // -------------------------------------------
    // 3. NextAuth cookie-based authentication
    // -------------------------------------------
    const nextToken = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: req.nextUrl.protocol === 'https:',
    });

    if (nextToken) {
      if (isAdminRoute(pathname) && nextToken.role !== 'admin') return denyAdminAccess(req);
      return NextResponse.next();
    }

    // -------------------------------------------
    // 4. Mobile Bearer token authentication
    // -------------------------------------------
    if (authHeader?.startsWith('Bearer ')) {
      const bearerToken = authHeader.split(' ')[1];
      try {
        const decoded = await AuthService.verifyAccessToken(bearerToken);
        if (isAdminRoute(pathname) && decoded?.role !== 'admin') return denyAdminAccess(req);
        return NextResponse.next();
      } catch (e) {
        console.warn('❌ Invalid bearer token');
      }
    }

    // -------------------------------------------
    // 5. Block non-API routes
    // -------------------------------------------
    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    const returnUrl = encodeURIComponent(req.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?returnUrl=${returnUrl}`, req.url));
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json(
      { error: 'Internal server error', message: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export const config = {
  matcher: [
    '/protected/:path*',
    '/api/project/:path*',
    '/api/project_document/:path*',
    '/api/project_team/:path*',
    '/api/admin/:path*',
    '/api/task/:path*',
    '/api/task_comment/:path*',
    '/api/task_document/:path*',
    '/api/task_team/:path*',
    '/api/user/:path*',
    '/api/integrator/:path*',
    '/api/invoice/:path*',
    '/api/notifications/:path*',
    '/api/scheduler/:path*'
  ]
};
