import { mongoConnect } from '../../../../utils/connectDb';
import User from '../../models/user';
import { errorHandler } from '../../../../utils/errors';
import { sendEmail } from '../../../../lib/mail';
import { emailTemplates } from '../../../email';
import { compileEmailTemplate } from '../../templates/compile-email-template';
import { NextResponse } from 'next/server';

mongoConnect();

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const emailAddress = body.email.toLowerCase();

    const user = await User.findOne({ email: emailAddress });
    if (!user) {
      return NextResponse.json(
        {
          error: 'User not found. Please sign up for a plan to create a new account.'
        },
        { status: 401 }
      );
    }

    const code = Math.floor(100000 + Math.random() * 900000);
    user.otp = code;
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
      from: process.env.USER_NAME,
      to: emailAddress,
      subject: 'Instructions for changing your Snatchi Account password',
      text: 'Instructions for changing your Snatchi Account password',
      html: template
    };
   
    await sendEmail(mailOptions);

    return NextResponse.json({ data: true }, { status: 200 });
  } catch (err) {      
    return NextResponse.json(
      {
        error: errorHandler(err) || 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
}
