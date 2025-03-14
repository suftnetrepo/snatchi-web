import { errorHandler } from '../../../utils/errors';
import { serialize } from 'cookie';

export default async (req, res) => {
  switch (req.method) {
    case 'POST':
      await logout(req, res);
      break;
  }
};

const logout = async (_, res) => {
  try {
    res.setHeader(
      'Set-Cookie',
      serialize('authToken', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        expires: new Date(0),
        path: '/'
      })
    );

    res.setHeader('Allow', ['POST']);
    res.status(200).json({ message: 'Logout successful!' });
  } catch (err) {
    return res.status(500).json({
      error: errorHandler(err)
    });
  }
};
