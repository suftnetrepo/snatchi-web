import { mongoConnect } from '../../../utils/connectDb';
import User from '../models/user';
import { errorHandler } from '../../../utils/errors';
import { verifyJwtTokenAsync, generatePassword } from '../utils/helps';

mongoConnect();

export default async (req, res) => {
  switch (req.method) {
    case 'POST':
      await reset(req, res);
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
};

const reset = async (req, res) => {
  try {
    const { password, token } = req.body;
    const { email, otp } = await verifyJwtTokenAsync(token, process.env.NEXT_PUBLIC_ACCESS_TOKEN_SECRET)
   
    const matchUser = await User.findOne({
      $and: [{ email: new RegExp(email, 'i') }, { otp }]
    })

    if (!matchUser) {
      return res.status(401).json({
        error: "Sorry, we couldn't find an account associated with the email. Please check your details and try again, or sign up for a new account if you don't have one yet."
      });
    }

    matchUser.password = await generatePassword(password)
    await matchUser.save()
     
    return res.status(200).json({ data: true });
  } catch (err) {
    return res.status(500).json({
      error: errorHandler(err)
    });
  }
};
