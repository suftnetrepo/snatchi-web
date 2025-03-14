import { serialize } from 'cookie';
import jwt from 'jsonwebtoken';
import { getRefreshToken } from '../../../utils/generateToken';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ message: `Method ${req.method} Not Allowed` });
  }

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Malformed token' });
    }

    jwt.verify(token, process.env.NEXT_PUBLIC_REFRESH_TOKEN_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ error: 'Invalid or expired refresh token.' });
      }

      const newAccessToken = getRefreshToken({
        id: user.id,
        email: user.email,
        role: user.role
      });

      res.setHeader(
        'Set-Cookie',
        serialize('authToken', newAccessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 60 * 15,
          path: '/'
        })
      );

      return res.status(200).json({ user, token });
    });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
