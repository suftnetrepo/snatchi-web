import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { requireAdmin } from '@/app/api/utils/admin';

const configured = (value) => Boolean(String(value || '').trim());

export async function GET() {
  const auth = await requireAdmin();
  if (auth.response) return auth.response;
  const checks = {
    database: { status: mongoose.connection.readyState === 1 ? 'healthy' : 'unavailable' },
    stripe: { status: configured(process.env.STRIPE_SECRET_KEY) ? 'configured' : 'missing' },
    email: { status: configured(process.env.BREVA_API_KEY) && configured(process.env.USER_NAME) ? 'configured' : 'missing' },
    firebase: { status: configured(process.env.FIREBASE_PROJECT_ID) || configured(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) ? 'configured' : 'missing' },
    cloudinary: { status: configured(process.env.NEXT_PUBLIC_CLOUD_NAME) && configured(process.env.NEXT_PUBLIC_CLOUD_API_KEY) && configured(process.env.NEXT_PUBLIC_CLOUD_SECRETE) ? 'configured' : 'missing' }
  };
  return NextResponse.json({
    success: true,
    environment: process.env.NODE_ENV || 'unknown',
    version: process.env.RENDER_GIT_COMMIT?.slice(0, 12) || process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 12) || 'local',
    checkedAt: new Date().toISOString(),
    checks
  });
}
