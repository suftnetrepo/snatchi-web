import { mongoConnect } from '../../../utils/connectDb';
import { errorHandler } from '../../../utils/errors';
import { createUser } from '../services/user';
import { createIntegrator } from '../services/subscriber';
const { NextResponse } = require('next/server');

mongoConnect();

export async function POST(req) {
  try {
    const body = await req.json();
    const integrator = await createIntegrator({ ...body, status: 'inactive' });
    
    const userPayload = {
      ...body,
      role: 'integrator',
      user_status: true,
      visible: 'private'
    };
    const user = await createUser(integrator._id, userPayload);
   
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
   
    const response = NextResponse.json({ data: payload }, { status: 200 });
    
    return response;
  } catch (err) {
    return NextResponse.json(
      {
        error: errorHandler(err)
      },
      { status: 400 }
    );
  }
}
