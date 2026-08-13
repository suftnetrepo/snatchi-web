import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import User from '../../models/user';
import EngineerServiceRate from '../../models/engineerServiceRate';
import { generatePassword } from '../../utils/helps';
import { logger } from '../../utils/logger';

const errorResponse = (message, status) => NextResponse.json({ success: false, error: message }, { status });

export const POST = async (req) => {
  if (process.env.NODE_ENV !== 'development') return errorResponse('Not found', 404);

  try {
    const sessionUser = await getUserSession(req);
    if (!sessionUser) return errorResponse('Unauthorized', 401);
    if (!['integrator', 'manager'].includes(sessionUser.role)) return errorResponse('Forbidden', 403);

    const seedRun = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const password = await generatePassword('12345!');
    const names = [
      ['Oliver', 'Bennett', 'London'],
      ['Amelia', 'Clarke', 'Manchester'],
      ['Noah', 'Williams', 'Birmingham'],
      ['Isla', 'Morgan', 'Leeds'],
      ['Ethan', 'Hughes', 'Bristol']
    ];

    const engineers = names.map(([firstName, lastName, town], index) => ({
      integrator: sessionUser.integrator,
      first_name: firstName,
      last_name: lastName,
      email: `dev.engineer.${seedRun}.${index + 1}@example.test`,
      mobile: `0770090${String(index + 1).padStart(4, '0')}`,
      password,
      role: 'engineer',
      visible: index % 2 === 0 ? 'public' : 'private',
      user_status: true,
      chat_status: false,
      address: {
        town,
        country: 'United Kingdom',
        completeAddress: `${town}, United Kingdom`,
        location: { type: 'Point', coordinates: [0, 0] }
      }
    }));

    const created = await User.insertMany(engineers, { ordered: true });
    try {
      await EngineerServiceRate.insertMany(created.map((engineer, index) => ({
        engineer: engineer._id,
        serviceName: index % 2 === 0 ? 'AV Installation' : 'System Commissioning',
        rate: 280 + index * 25,
        rateType: 'daily',
        description: 'Development seed rate',
        active: true
      })), { ordered: true });
    } catch (rateError) {
      await User.deleteMany({ _id: { $in: created.map((engineer) => engineer._id) } });
      throw rateError;
    }

    return NextResponse.json({ success: true, data: { count: created.length } }, { status: 201 });
  } catch (error) {
    logger.error(error);
    return errorResponse('Unable to seed development engineers', 500);
  }
};
