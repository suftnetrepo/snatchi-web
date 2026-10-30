import { mongoConnect } from '../../../../utils/connectDb';
import User from '../../models/user';
import { errorHandler } from '../../../../utils/errors';
import { NextResponse } from 'next/server';

mongoConnect();

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
       
    const matchUser = await User.findOne({
      email: String(email || '').trim().toLowerCase(),
      otp: String(code || ''),
      otpExpiresAt: { $gt: new Date() }
    });

    if (!matchUser) {
      return NextResponse.json(
        {
          error:
            "Sorry, we couldn't find an account associated with the email. Please check your details and try again, or sign up for a new account if you don't have one yet."
        },
        { status: 401 }
      );
    } 
     
    return NextResponse.json({ data: { email, code } }, { status: 200 });
  } catch (err) {
    
    return NextResponse.json(
      {
        error: errorHandler(err)
      },
      { status: 500 }
    );
  }
}
