import * as jose from 'jose';
import { cookies } from 'next/headers';

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
  integrator: string;
}

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

const ACCESS_TOKEN_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_ACCESS_TOKEN_SECRET || 'KDJHF7823RHIU3289FJ9321456777I2G8FG239'
);
const REFRESH_TOKEN_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET || '946acb540311776067cadad0976d65c086673babcd8e8298b323ae85823f34b3'
);

export class AuthService {
  static async generateTokens(payload: any) {
    const accessToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(ACCESS_TOKEN_SECRET);

    const refreshToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(REFRESH_TOKEN_SECRET);

    return { accessToken, refreshToken };
  }

  static async verifyAccessToken(token: string) {
    try {
      const { payload } = await jose.jwtVerify(token, ACCESS_TOKEN_SECRET);
      return payload;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  static async verifyRefreshToken(token: string) {
    try {
      const { payload } = await jose.jwtVerify(token, ACCESS_TOKEN_SECRET);
      return payload;
    } catch {
      return null;
    }
  }

  static async setTokens(tokens: { accessToken: string; refreshToken: string }) {
    const cookieStore = await cookies();

    cookieStore.set('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'production',
      sameSite: 'strict',
      maxAge: 15 * 60 // 15 minutes
    });

    cookieStore.set('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV !== 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    });
  }

  static async clearTokens() {
    const cookieStore = await cookies();
    cookieStore.delete('accessToken');
    cookieStore.delete('refreshToken');
  }
}
