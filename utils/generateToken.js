import jwt from 'jsonwebtoken';
import { getToken } from 'next-auth/jwt';
import { AuthService } from '../lib/AuthService';

export const getAccessToken = (payload) => {
    return jwt.sign(payload, process.env.NEXT_PUBLIC_ACCESS_TOKEN_SECRET, {expiresIn: '30m'})
}

export const getRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET, {expiresIn: '7d'})
}

export async function getUserSession(req) {
    // Try to get NextAuth JWT token from cookies
    // Use consistent secret without trimming (same as middleware.js)
    const token = await getToken({
      req: req,
      secret: process.env.NEXTAUTH_SECRET,
      secureCookie: false
    });
    
    // If token found in cookies, return it
    if (token?.email) {
      return token;
    }
  
    // Fallback: Try Bearer token from x-access-token header (mobile/external clients)
    const authHeader = req.headers.get('x-access-token');
    if (authHeader?.startsWith('Bearer ')) {
      const rawToken = authHeader.split(' ')[1];
      try {
        const decoded = await AuthService.verifyAccessToken(rawToken);
        if (decoded) {
          return decoded;
        }
      } catch (e) {
        console.error('Bearer token verification failed:', e.message);
        return null;
      }
    }
  
    // No valid authentication found
    return null;
  }
  