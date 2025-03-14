import jwt from 'jsonwebtoken';
import { mongoConnect } from '../../../utils/connectDb';
import User from '../models/user';
import { errorHandler } from '../../../utils/errors';
const { sendGridMail } = require('../../../lib/mail');
const { compileEmailTemplate } = require('../templates/compile-email-template');

mongoConnect();

export default async (req, res) => {
  switch (req.method) {
    case 'POST':
      await forgot(req, res);
      break;
    default:
      res.setHeader('Allow', ['POST']);
      res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }
};

const forgot = async (req, res) => {
  try {
    const { email } = req.body;
    const emailAddress = email.toLowerCase();

    const user = await User.findOne({ email: emailAddress });
    if (!user) {
      return res.status(401).json({
        error: 'User not found. Please sign up for a plan to create a new account.'
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    user.otp = code;
    await user.save();

    const reset_token = jwt.sign({ otp: code, email }, process.env.JWT_SECRET);

    const template = await compileEmailTemplate({
      fileName: 'forgotPassword.mjml',
      data: {
        name: `${user.first_name} ${user.last_name}`,
        reset_url: `${process.env.RESET_PASSWORD_URL}?&token=${reset_token}`,
        contact_email: process.env.CONTACT_EMAIL,
        team: process.env.TEAM
      }
    });

    const mailOptions = {
      from: process.env.USER_NAME,
      to: `${email}`,
      subject: 'Instructions for changing your Snatchi Account password',
      text: 'Instructions for changing your Snatchi Account password',
      html: template
    };

    sendGridMail(mailOptions);

    return res.status(200).json({ data: true });
  } catch (err) {
    return res.status(500).json({
      error: errorHandler(err)
    });
  }
};
