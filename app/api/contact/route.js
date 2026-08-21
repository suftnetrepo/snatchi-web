import { NextResponse } from 'next/server';
import { sendBrevoEmail } from '@/lib/mail';

const attempts = new Map();
const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const clean = (value, max) => String(value || '').trim().slice(0, max);
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

export async function POST(req) {
  try {
    const body = await req.json();
    if (body.website) return NextResponse.json({ success: true });

    const forwarded = req.headers.get('x-forwarded-for');
    const clientId = forwarded?.split(',')[0]?.trim() || 'unknown';
    const now = Date.now();
    const recent = (attempts.get(clientId) || []).filter((time) => now - time < WINDOW_MS);
    if (recent.length >= MAX_ATTEMPTS) {
      return NextResponse.json({ error: 'Too many messages. Please try again later.' }, { status: 429 });
    }
    attempts.set(clientId, [...recent, now]);

    const firstName = clean(body.firstName || body.name, 80);
    const lastName = clean(body.lastName, 80);
    const email = clean(body.email, 160).toLowerCase();
    const department = clean(body.department || 'General enquiry', 80);
    const message = clean(body.message, 3000);
    if (!firstName || !isEmail(email) || message.length < 10) {
      return NextResponse.json({ error: 'Please provide your name, a valid email and a message of at least 10 characters.' }, { status: 400 });
    }

    const destination = process.env.CONTACT_EMAIL || 'info@plasmapro.co.uk';
    const textContent = [
      `New Snatchi ${department} enquiry`,
      `Name: ${[firstName, lastName].filter(Boolean).join(' ')}`,
      `Email: ${email}`,
      '',
      message
    ].join('\n');

    await sendBrevoEmail({
      sender: { email: process.env.USER_NAME || destination, name: 'Snatchi Website' },
      to: [{ email: destination }],
      replyTo: { email, name: [firstName, lastName].filter(Boolean).join(' ') },
      subject: `Snatchi website enquiry: ${department}`,
      textContent
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Contact form delivery failed:', error);
    return NextResponse.json(
      { error: 'Your message could not be sent. Please email info@plasmapro.co.uk.' },
      { status: 500 }
    );
  }
}
