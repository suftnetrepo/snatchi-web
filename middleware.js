import { NextResponse } from 'next/server';
import { AuthService } from './lib/AuthService';
import { getToken } from 'next-auth/jwt';

const isApiRoute = (pathname) => pathname.startsWith('/api');

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
      secureCookie: false,
    });

    if (nextToken) {
      return NextResponse.next();
    }

    // -------------------------------------------
    // 4. Mobile Bearer token authentication
    // -------------------------------------------
    if (authHeader?.startsWith('Bearer ')) {
      const bearerToken = authHeader.split(' ')[1];
      try {
        const decoded = await AuthService.verifyAccessToken(bearerToken);
        console.log("✅ Bearer verified:", decoded);
        return NextResponse.next();
      } catch (e) {
        console.warn('❌ Invalid bearer token');
      }
    }

    // -------------------------------------------
    // 5. Block non-API routes
    // -------------------------------------------
    if (!isApiRoute(pathname)) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      );
    }

    // -------------------------------------------
    // 6. Redirect API requests to login
    // -------------------------------------------
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
    '/api/invoice/:path*'
  ]
};
