import { mongoConnect } from '../../../utils/connectDb';
import { errorHandler } from '../../../utils/errors';
import { serialize } from 'cookie';
import { getAccessToken } from '../../../utils/generateToken';
import { createUser } from '../services/user';
import { createIntegrator } from '../services/subscriber';

mongoConnect();

export default async (req, res) => {
  switch (req.method) {
    case 'POST':
      await handler(req, res);
      break;
  }
};

const handler = async (req, res) => {
  try {
    let body = req.body;
    const integrator = await createIntegrator({ ...body, status: 'inactive' });
    body = {
      ...body,
      role: 'integrator',
      user_status: true,
      visible: 'private'
    };
    const user = await createUser(integrator._id, { ...body });

    res.setHeader(
      'Set-Cookie',
      serialize('authToken', getAccessToken({ id: user._id, email: user.email, integrator: user.integrator }), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600,
        path: '/'
      })
    );

    const payload = {
      user_id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      secure_url: user.secure_url,
      public_id: user.public_id
    };

    res.setHeader('Allow', ['POST']);
    res.status(200).json({ data: payload });
  } catch (err) {
    return res.status(400).json({
      error: errorHandler(err)
    });
  }
};
