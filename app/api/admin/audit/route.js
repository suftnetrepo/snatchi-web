import { NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/utils/admin';

export async function GET(req) {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const AdminAudit = require('../../models/adminAudit');
  const url = new URL(req.url);
  const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
  const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit')) || 25));
  const action = String(url.searchParams.get('action') || '').trim();
  const query = action ? { action } : {};
  const [data, totalCount] = await Promise.all([
    AdminAudit.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    AdminAudit.countDocuments(query)
  ]);
  return NextResponse.json({ success: true, data, totalCount, page, limit });
}
