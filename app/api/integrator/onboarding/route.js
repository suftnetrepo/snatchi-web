import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { mongoConnect } from '@/utils/connectDb';
import Integrator from '../../models/integrator';
import User from '../../models/user';
import Project from '../../models/project';
import Scheduler from '../../models/scheduler';
import { logger } from '../../utils/logger';
import mongoose from 'mongoose';

export const dynamic = 'force-dynamic';

const resolveIntegratorId = async (user) => {
  if (mongoose.Types.ObjectId.isValid(user.integrator)) return user.integrator;

  const currentUser = await User.findOne({
    $or: [
      ...(mongoose.Types.ObjectId.isValid(user.id) ? [{ _id: user.id }] : []),
      ...(user.email ? [{ email: String(user.email).trim().toLowerCase() }] : [])
    ]
  })
    .select('integrator')
    .lean();

  return currentUser?.integrator;
};

const authorize = async (req) => {
  const user = await getUserSession(req);
  if (!user) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (!['integrator', 'manager'].includes(user.role)) {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  await mongoConnect();
  const integratorId = await resolveIntegratorId(user);
  if (!mongoose.Types.ObjectId.isValid(integratorId)) {
    return { response: NextResponse.json({ error: 'Organisation not found for this account' }, { status: 404 }) };
  }
  return { integratorId };
};

export async function GET(req) {
  try {
    const { integratorId, response } = await authorize(req);
    if (response) return response;
    const [integrator, engineerCount, projectCount, bookingCount] = await Promise.all([
      Integrator.findById(integratorId)
        .select('name email mobile description connectAccountStatus chargesEnabled payoutsEnabled onboarding')
        .lean(),
      User.countDocuments({ integrator: integratorId, role: 'engineer' }),
      Project.countDocuments({ integrator: integratorId }),
      Scheduler.countDocuments({
        $or: [{ integrator: integratorId }, { payingIntegrator: integratorId }]
      })
    ]);

    if (!integrator) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });

    const checks = {
      profile: Boolean(integrator.name?.trim() && integrator.email?.trim() && integrator.mobile?.trim()),
      engineer: engineerCount > 0,
      project: projectCount > 0,
      booking: bookingCount > 0,
      payouts: integrator.connectAccountStatus === 'verified' && integrator.chargesEnabled && integrator.payoutsEnabled
    };
    const requiredKeys = ['profile', 'engineer', 'project', 'booking'];
    const currentCompletedRequired = requiredKeys.filter((key) => checks[key]).length;
    const completed = Boolean(integrator.onboarding?.onboardingCompleted) || currentCompletedRequired === requiredKeys.length;
    const completedRequired = completed ? requiredKeys.length : currentCompletedRequired;

    if (completed && !integrator.onboarding?.onboardingCompleted) {
      await Integrator.updateOne(
        { _id: integratorId, 'onboarding.onboardingCompleted': { $ne: true } },
        { $set: { 'onboarding.onboardingCompleted': true } }
      );
    }

    return NextResponse.json({
      data: {
        checks,
        counts: { engineers: engineerCount, projects: projectCount, bookings: bookingCount },
        payoutStatus: integrator.connectAccountStatus || 'not_started',
        completedRequired,
        requiredTotal: requiredKeys.length,
        percent: Math.round((completedRequired / requiredKeys.length) * 100),
        complete: completed,
        dismissed: Boolean(integrator.onboarding?.welcomeModalDismissed),
        setupChecklistDismissed: Boolean(integrator.onboarding?.setupChecklistDismissed)
      }
    });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ error: 'Unable to check organisation setup' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    const { integratorId, response } = await authorize(req);
    if (response) return response;

    const body = await req.json();
    const allowedFields = ['welcomeModalDismissed', 'setupChecklistDismissed', 'onboardingCompleted'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (typeof body?.[field] === 'boolean') updates[`onboarding.${field}`] = body[field];
    });

    if (!Object.keys(updates).length) {
      return NextResponse.json({ error: 'No valid onboarding fields supplied' }, { status: 400 });
    }

    const integrator = await Integrator.findByIdAndUpdate(
      integratorId,
      { $set: updates },
      { new: true }
    ).select('onboarding').lean();

    if (!integrator) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
    return NextResponse.json({ data: integrator.onboarding });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ error: 'Unable to update onboarding state' }, { status: 500 });
  }
}
