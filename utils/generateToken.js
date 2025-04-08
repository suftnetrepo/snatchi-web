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
    const token = await getToken({
      req: req,
      secret: process.env.NEXTAUTH_SECRET?.trim(),
      secureCookie: false
    });
    if (token?.email) return token;
  
    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const rawToken = authHeader.split(' ')[1];
      try {
        const decoded = await AuthService.verifyAccessToken(rawToken);
        if (decoded) return decoded;
      } catch (e) {
        return null;
      }
    }
  
    return null;
  }
  