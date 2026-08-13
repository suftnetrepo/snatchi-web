import { mongoConnect } from '../../../utils/connectDb';
import { errorHandler } from '../../../utils/errors';
import { createUser } from '../services/user';
import { createIntegrator } from '../services/subscriber';
import Integrator from '../models/integrator';
import User from '../models/user';
const { NextResponse } = require('next/server');

mongoConnect();

export async function POST(req) {
  try {
    const body = await req.json();
    const email = String(body.email || '')
      .trim()
      .toLowerCase();
    const pendingIntegratorPayload = {
      name: body.name,
      mobile: body.mobile,
      email,
      priceId: body.priceId,
      status: 'inactive'
    };
    let integrator = await Integrator.findOne({ email });

    if (!integrator) {
      integrator = await createIntegrator(pendingIntegratorPayload);
    } else if (!['inactive', 'incomplete'].includes(integrator.status)) {
      throw Object.assign(new Error('An account with this email already exists. Please sign in instead.'), {
        statusCode: 409
      });
    } else {
      integrator = await Integrator.findByIdAndUpdate(
        integrator._id,
        { $set: { name: body.name, mobile: body.mobile, priceId: body.priceId || integrator.priceId } },
        { new: true, runValidators: true }
      );
    }

    const userPayload = {
      first_name: body.first_name,
      last_name: body.last_name,
      mobile: body.mobile,
      email,
      role: 'integrator',
      user_status: true,
      visible: 'private'
    };
    let user = await User.findOne({ email });
    if (user && String(user.integrator) !== String(integrator._id)) {
      throw Object.assign(new Error('An account with this email already exists. Please sign in instead.'), {
        statusCode: 409
      });
    }
    if (!user) user = await createUser(integrator._id, userPayload);

    const payload = {
      user_id: user._id,
      first_name: user.first_name,
      last_name: user.last_name,
      mobile: user.mobile,
      email: user.email,
      role: user.role,
      secure_url: user.secure_url,
      public_id: user.public_id,
      integrator_id: integrator._id
    };

    const response = NextResponse.json({ data: payload }, { status: 200 });

    return response;
  } catch (err) {
    console.error('[SUBSCRIBER PROVISIONING] Failed to create pending account:', {
      name: err?.name,
      code: err?.code,
      statusCode: err?.statusCode,
      message: err?.message
    });

    const statusCode = [400, 409, 422].includes(err?.statusCode) ? err.statusCode : err?.code === 11000 ? 409 : 500;

    return NextResponse.json(
      {
        error: errorHandler(err)
      },
      { status: statusCode }
    );
  }
}
