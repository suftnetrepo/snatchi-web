import { NextResponse } from 'next/server';
import { AuthService } from './lib/AuthService';
import { getToken } from 'next-auth/jwt';
import jwt from "jsonwebtoken";

export async function middleware(request) {
  try {
    const isMobileApp = request.headers.get('X-App-Route') === 'mobile';

    console.log("Headers:", request);

    console.log("Headers:", request.headers);

    let token, userData;
    const authHeader = request.headers.get('authorization');

    console.error('..........................authHeader:', authHeader);
    console.error('..........................process.env.NEXTAUTH_SECRET:', process.env.NEXTAUTH_SECRET);

    if (isMobileApp) {
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return createAuthError(request, isMobileApp, 'Invalid authorization header');
      }

      token = authHeader.split('Bearer ')[1];

      console.error('..........................token:', token);

      if (!token) {
        return createAuthError(request, isMobileApp, 'No token provided');
      }

      try {
        userData = await AuthService.verifyAccessToken(token);
      } catch (error) {
        console.error('Session verification error:', error);
        return createAuthError(request, isMobileApp, error.message || 'Invalid token');
      }
    } else {
      try {
        const session = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });

        if (!session) {
          console.log('Raw Token:', request.cookies.get('next-auth.session-token'));
          console.log('Decoded Token:', jwt.decode(request.cookies.get('next-auth.session-token')));
        }

        const sessions = await getToken({
          req: request,
          secret:'ft8c95VaAkJiIl7x2zyI5vdVvqblSmF5THeod78WA34='
        });

        console.error('..........................session:', sessions);

        if (!session) {
          console.error('Session verification error:', session);
          return createAuthError(request, isMobileApp, 'Session expired or not authenticated');
        }

        userData = session;
      } catch (error) {
        console.error('Session verification error:', error);
        return createAuthError(request, isMobileApp, 'Session verification failed');
      }
    }

    const response = NextResponse.next();

    if (userData) {
      response.headers.set('x-user-id', userData.id);
      response.headers.set('x-user-data', JSON.stringify(userData));
    }

    return response;
  } catch (error) {
    console.error('Authentication middleware error:', error);
    return NextResponse.json({ error: 'Internal server error', message: 'Authentication failed' }, { status: 500 });
  }
}

function createAuthError(request, isMobileApp, message) {
  if (isMobileApp) {
    return NextResponse.json({ error: 'Unauthorized', message: message || 'Authentication required' }, { status: 401 });
  } else {
    const returnUrl = encodeURIComponent(request.nextUrl.pathname);
    return NextResponse.redirect(new URL(`/login?returnUrl=${returnUrl}`, request.url));
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
