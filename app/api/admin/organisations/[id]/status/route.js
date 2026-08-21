import { NextResponse } from 'next/server';
import { requireAdmin, recordAdminAudit, validateAdminReason } from '@/app/api/utils/admin';
import Integrator from '@/app/api/models/integrator';

export async function PATCH(req, { params }) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const { id } = await params;

  try {
    const { suspended, reason } = await req.json();
    const safeReason = validateAdminReason(reason);
    if (typeof suspended !== 'boolean' || !safeReason) {
      return NextResponse.json({ error: 'A reason between 8 and 500 characters is required' }, { status: 400 });
    }

    const organisation = await Integrator.findById(id);
    if (!organisation) return NextResponse.json({ error: 'Organisation not found' }, { status: 404 });
    if (Boolean(organisation.adminSuspension?.suspended) === suspended) {
      return NextResponse.json({ error: suspended ? 'Organisation is already suspended' : 'Organisation is not suspended' }, { status: 409 });
    }

    if (suspended) {
      organisation.adminSuspension = {
        suspended: true,
        reason: safeReason,
        previousStatus: organisation.status,
        suspendedAt: new Date(),
        suspendedBy: auth.session.user.id
      };
      organisation.status = 'suspended';
    } else {
      organisation.status = organisation.adminSuspension?.previousStatus || 'inactive';
      organisation.adminSuspension = { suspended: false, reason: '', previousStatus: '' };
    }
    await organisation.save();

    await recordAdminAudit({
      req,
      session: auth.session,
      action: suspended ? 'organisation.suspend' : 'organisation.restore',
      targetType: 'organisation',
      targetId: id,
      reason: safeReason,
      metadata: { status: organisation.status, stripeMutation: false }
    });

    return NextResponse.json({ success: true, data: {
      _id: organisation._id,
      status: organisation.status,
      adminSuspension: organisation.adminSuspension
    } });
  } catch (error) {
    return NextResponse.json({ error: 'Unable to update organisation access' }, { status: 500 });
  }
}
