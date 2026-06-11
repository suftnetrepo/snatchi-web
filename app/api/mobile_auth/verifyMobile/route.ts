import { mongoConnect } from '../../../../utils/connectDb';
import User from '../../models/user';
import { errorHandler } from '../../../../utils/errors';
import { NextResponse } from 'next/server';
import { AuthService } from '../../../../lib/AuthService';

mongoConnect();

export async function POST(req: Request) {
  try {
    const { email, code, fcm } = await req.json();

    const matchUser = await User.findOne({
      email: new RegExp(`^${email}$`, 'i'),
      otp: code
    }).select('_id first_name last_name email chat_status address mobile role fcm secure_url public_id integrator attachments');

    console.log('Matched User:', matchUser);

    if (!matchUser) {
      return NextResponse.json(
        {
          error:
            "Sorry, we couldn't find an account associated with the email. Please check your details and try again, or sign up for a new account if you don't have one yet."
        },
        { status: 401 }
      );
    }

    matchUser.otp = '';
    matchUser.fcm = fcm;
    await matchUser.save();

    const { accessToken } = await AuthService.generateTokens({
      id: matchUser._id,
      email: matchUser.email,
      role: matchUser.role,
      integrator: matchUser.integrator
    });

    const user = {
      user_id: matchUser._id,
      first_name: matchUser.first_name,
      last_name: matchUser.last_name,
      email: matchUser.email,
      mobile: matchUser.mobile,
      role: matchUser.role,
      fcm: matchUser.fcm,
      secure_url: matchUser.secure_url,
      address: matchUser.address,
      chat_status: matchUser.chat_status,
      public_id: matchUser.public_id,
    };

    return NextResponse.json({ data: { user, token: accessToken } }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      {
        error: errorHandler(err)
      },
      { status: 500 }
    );
  }
}
