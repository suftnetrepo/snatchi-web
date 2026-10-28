import * as jose from 'jose';
import { getAccessTokenSecret, getRefreshTokenSecret } from '../utils/tokenSecrets';

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

const encodedAccessTokenSecret = () => new TextEncoder().encode(getAccessTokenSecret());
const encodedRefreshTokenSecret = () => new TextEncoder().encode(getRefreshTokenSecret());

export class AuthService {
  static async generateTokens(payload: any) {
    const accessToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(encodedAccessTokenSecret());

    const refreshToken = await new jose.SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(encodedRefreshTokenSecret());

    return { accessToken, refreshToken };
  }

  static async verifyAccessToken(token: string) {
    try {
      const { payload } = await jose.jwtVerify(token, encodedAccessTokenSecret());
      return payload;
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  static async verifyRefreshToken(token: string) {
    try {
      const { payload } = await jose.jwtVerify(token, encodedRefreshTokenSecret());
      return payload;
    } catch {
      return null;
    }
  }

 
}
