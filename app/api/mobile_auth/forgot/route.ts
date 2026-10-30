import { mongoConnect } from '../../../../utils/connectDb';
import User from '../../models/user';
import { errorHandler } from '../../../../utils/errors';
import { sendBrevoEmail } from '../../../../lib/mail';
import { emailTemplates } from '../../../email';
import { compileEmailTemplate } from '../../templates/compile-email-template';
import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';

 await mongoConnect();

export async function POST(req: Request) {
  try {
   

    const body = await req.json();

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailAddress = body.email.toLowerCase();

    const user = await User.findOne({ email: emailAddress });
    if (!user) return NextResponse.json({ data: true }, { status: 200 });

    if (user.otpRequestedAt && Date.now() - new Date(user.otpRequestedAt).getTime() < 60_000) {
      return NextResponse.json({ data: true }, { status: 200 });
    }

    const code = randomInt(100000, 1000000).toString();
    user.otp = code;
    user.otpRequestedAt = new Date();
    user.otpExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    const template = await compileEmailTemplate(
      emailTemplates.codeVerification({
        name: `${user.first_name ?? ''} ${user.last_name ?? ''}`,
        code: code,
        contact_email: process.env.CONTACT_EMAIL,
        team: process.env.TEAM
      })
    );

    const mailOptions = {
      sender: { email: process.env.USER_NAME, name: 'Snatchi' },
      to: [{ email: emailAddress }],
      subject: 'Instructions for changing your Snatchi account password',
      htmlContent: template
    };

    await sendBrevoEmail(mailOptions);
    return NextResponse.json({ data: true }, { status: 200 });
  } catch (err) {
    console.error('Error in forgot password route:', err);
    return NextResponse.json({ error: 'Something went wrong.' }, { status: 500 });
  }
}
