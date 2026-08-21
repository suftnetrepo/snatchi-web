import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';
import { authOptions } from '@/auth';
import { connectDb } from '@/utils/connectDb';

export async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session) return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  if (session.user?.role !== 'admin') {
    return { response: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  await connectDb();
  return { session };
}

export async function recordAdminAudit({ req, session, action, targetType, targetId, reason = '', result = 'success', metadata = {} }) {
  const AdminAudit = require('../models/adminAudit');
  const forwarded = req.headers.get('x-forwarded-for');
  return AdminAudit.create({
    actor: session.user.id,
    actorEmail: session.user.email,
    action,
    targetType,
    targetId: String(targetId),
    reason: String(reason).trim().slice(0, 500),
    result,
    metadata,
    ipAddress: forwarded?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '',
    userAgent: (req.headers.get('user-agent') || '').slice(0, 500)
  });
}

export function validateAdminReason(reason) {
  const value = String(reason || '').trim();
  if (value.length < 8 || value.length > 500) return null;
  return value;
}
