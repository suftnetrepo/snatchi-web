const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';
const DEFAULT_MIN_SCORE = 0.5;

const minScore = () => {
  const configured = Number.parseFloat(process.env.RECAPTCHA_MIN_SCORE);
  return Number.isFinite(configured) ? configured : DEFAULT_MIN_SCORE;
};

export async function verifyRecaptchaToken(token, { remoteIp, action } = {}) {
  if (!process.env.SECRET_KEY) {
    throw new Error('reCAPTCHA secret key is not configured');
  }

  if (!token || typeof token !== 'string') return false;

  const body = new URLSearchParams({
    secret: process.env.SECRET_KEY,
    response: token
  });
  if (remoteIp) body.set('remoteip', remoteIp);

  const response = await fetch(RECAPTCHA_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store'
  });

  if (!response.ok) throw new Error('Unable to verify reCAPTCHA');

  const result = await response.json();
  if (result?.success !== true) return false;

  // reCAPTCHA v3: reject tokens minted for another action or scored as likely bots.
  if (action && result.action !== action) return false;
  return typeof result.score === 'number' && result.score >= minScore();
}
