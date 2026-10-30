import BrevoEmailSender from './EmailService';

let cachedSender;
const RESERVED_DOMAINS = ['test', 'example', 'invalid', 'localhost', 'local'];

export const htmlToText = (html = '') => html
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/p>/gi, '\n\n').replace(/<[^>]+>/g, ' ')
  .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&#39;/g, "'").replace(/&quot;/g, '"')
  .replace(/[ \t]+/g, ' ').replace(/\n\s+/g, '\n').trim();

const isReservedAddress = (email = '') => {
  const domain = email.toLowerCase().split('@')[1] || '';
  return RESERVED_DOMAINS.some((item) => domain === item || domain.endsWith(`.${item}`));
};

const getSender = () => {
  if (!cachedSender) cachedSender = new BrevoEmailSender(process.env.BREVO_API_KEY, { maxRetries: 3, timeout: 15000 });
  return cachedSender;
};

const normalizeOptions = (options) => {
  const fromEmail = process.env.BREVO_FROM_EMAIL || process.env.USER_NAME;
  if (!fromEmail) throw new Error('Email is not configured: BREVO_FROM_EMAIL is required');
  const htmlContent = options.htmlContent;
  return {
    ...options,
    sender: options.sender?.email ? options.sender : { email: fromEmail, name: process.env.BREVO_FROM_NAME || 'Snatchi' },
    textContent: options.textContent && !/<[a-z][\s\S]*>/i.test(options.textContent)
      ? options.textContent
      : (htmlContent ? htmlToText(htmlContent) : options.textContent)
  };
};

const sendBrevoEmail = async (mailOptions) => {
  const options = normalizeOptions(mailOptions);
  if (options.to.every(({ email }) => isReservedAddress(email))) {
    return { success: true, skipped: true, reason: 'reserved test address' };
  }
  const result = await getSender().sendEmail(options);
  if (!result.success) {
    const error = new Error(`Email delivery failed: ${result.error}`);
    error.status = result.status;
    throw error;
  }
  return result;
};

export { sendBrevoEmail };
