import { NextResponse } from 'next/server';
import { AuthService } from './lib/AuthService';
import { getToken } from 'next-auth/jwt';

const isApiRoute = (pathname) => pathname.startsWith('/api');

export async function middleware(req) {
  try {
    const { pathname } = req.nextUrl;

    const token = await getToken({
      req: req,
      secret: process.env.NEXTAUTH_SECRET?.trim(),
      secureCookie: false
    });

    if (token) {
      return NextResponse.next();
    }

    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const bearerToken = authHeader.split(' ')[1];
      try {
        const decoded = await AuthService.verifyAccessToken(bearerToken);
        if (decoded) return NextResponse.next();
      } catch (e) {
        console.warn('Invalid bearer token');
      }
    }

    if (isApiRoute(pathname)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: message || 'Authentication required' },
        { status: 401 }
      );
    }

    const returnUrl = encodeURIComponent(req.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?returnUrl=${returnUrl}`, req.url));
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json({ error: 'Internal server error', message: 'Authentication failed' }, { status: 500 });
  }
}

export const config = {
  matcher: [
    // Protected routes
    '/protected/:path*',

    // Protected API routes
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
    '/api/invoice/:path*'
  ]
};
