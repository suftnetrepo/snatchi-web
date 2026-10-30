const BREVO_ENDPOINT = 'https://api.brevo.com/v3/smtp/email';

class BrevoEmailSender {
  constructor(apiKey, options = {}) {
    if (!apiKey) throw new Error('Email is not configured: BREVO_API_KEY is required');
    this.apiKey = apiKey;
    this.maxRetries = options.maxRetries ?? 3;
    this.retryDelay = options.retryDelay ?? 750;
    this.timeout = options.timeout ?? 15000;
  }
  validate(params) {
    const valid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
    if (!Array.isArray(params.to) || !params.to.length) throw new Error('At least one recipient is required');
    if (!valid(params.sender?.email)) throw new Error('A valid sender email is required');
    if (params.to.some(({ email }) => !valid(email))) throw new Error('A valid recipient email is required');
    if (!params.subject?.trim()) throw new Error('Email subject is required');
    if (!params.htmlContent && !params.textContent) throw new Error('Email content is required');
  }
  async sendEmail(params, retryCount = 0) {
    this.validate(params);
    try {
      const response = await fetch(BREVO_ENDPOINT, {
        method: 'POST',
        headers: { accept: 'application/json', 'api-key': this.apiKey, 'content-type': 'application/json' },
        body: JSON.stringify(params),
        signal: AbortSignal.timeout(this.timeout)
      });
      const body = await response.json().catch(() => ({}));
      if (response.ok) return { success: true, messageId: body.messageId, retryCount };
      if ((response.status === 429 || response.status >= 500) && retryCount < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * 2 ** retryCount));
        return this.sendEmail(params, retryCount + 1);
      }
      return { success: false, error: body.message || `Brevo request failed (${response.status})`, status: response.status, retryCount };
    } catch (error) {
      if (retryCount < this.maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * 2 ** retryCount));
        return this.sendEmail(params, retryCount + 1);
      }
      return { success: false, error: error instanceof Error ? error.message : 'Email network error', retryCount };
    }
  }
}
export default BrevoEmailSender;
