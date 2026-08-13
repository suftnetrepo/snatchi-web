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

export async function GET(req) {
  try {
    const user = await getUserSession(req);
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!['integrator', 'manager'].includes(user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await mongoConnect();
    let integratorId = user.integrator;

    // Recover from older or freshly-issued sessions that do not yet contain
    // the organisation id, while keeping all checks scoped to the signed-in user.
    if (!mongoose.Types.ObjectId.isValid(integratorId)) {
      const currentUser = await User.findOne({
        $or: [
          ...(mongoose.Types.ObjectId.isValid(user.id) ? [{ _id: user.id }] : []),
          ...(user.email ? [{ email: String(user.email).trim().toLowerCase() }] : [])
        ]
      })
        .select('integrator')
        .lean();
      integratorId = currentUser?.integrator;
    }

    if (!mongoose.Types.ObjectId.isValid(integratorId)) {
      return NextResponse.json({ error: 'Organisation not found for this account' }, { status: 404 });
    }
    const [integrator, engineerCount, projectCount, bookingCount] = await Promise.all([
      Integrator.findById(integratorId)
        .select('name email mobile description connectAccountStatus chargesEnabled payoutsEnabled')
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
    const completedRequired = requiredKeys.filter((key) => checks[key]).length;

    return NextResponse.json({
      data: {
        checks,
        counts: { engineers: engineerCount, projects: projectCount, bookings: bookingCount },
        payoutStatus: integrator.connectAccountStatus || 'not_started',
        completedRequired,
        requiredTotal: requiredKeys.length,
        percent: Math.round((completedRequired / requiredKeys.length) * 100),
        complete: completedRequired === requiredKeys.length
      }
    });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ error: 'Unable to check organisation setup' }, { status: 500 });
  }
}
