
import { TransactionalEmailsApi, TransactionalEmailsApiApiKeys } from '@getbrevo/brevo';

/**
 * Robust Email Sender using Brevo API
 * Provides comprehensive error handling, validation, retry logic, and batch sending
 */
class BrevoEmailSender {
  constructor(apiKey, options = {}) {
    if (!apiKey) {
      throw new Error('Brevo API key is required');
    }

    this.api = new TransactionalEmailsApi();
    this.api.setApiKey(TransactionalEmailsApiApiKeys.apiKey, apiKey);
    
    // Configuration options
    this.options = {
      maxRetries: options.maxRetries || 3,
      retryDelay: options.retryDelay || 1000, // milliseconds
      batchSize: options.batchSize || 10,
      timeout: options.timeout || 30000,
      validateEmails: options.validateEmails !== false,
      logErrors: options.logErrors !== false,
      ...options
    };
  }

  /**
   * Validate email address format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate email parameters
   */
  validateEmailParams(params) {
    const errors = [];

    // Check required fields
    if (!params.to || !Array.isArray(params.to) || params.to.length === 0) {
      errors.push('Recipients (to) array is required and must not be empty');
    }

    if (!params.sender || !params.sender.email) {
      errors.push('Sender email is required');
    }

    if (!params.subject) {
      errors.push('Email subject is required');
    }

    if (!params.htmlContent && !params.textContent) {
      errors.push('Either htmlContent or textContent is required');
    }

    // Validate email formats
    if (this.options.validateEmails) {
      if (params.sender?.email && !this.validateEmail(params.sender.email)) {
        errors.push(`Invalid sender email: ${params.sender.email}`);
      }

      params.to?.forEach((recipient, index) => {
        if (!this.validateEmail(recipient.email)) {
          errors.push(`Invalid recipient email at index ${index}: ${recipient.email}`);
        }
      });

      params.cc?.forEach((recipient, index) => {
        if (!this.validateEmail(recipient.email)) {
          errors.push(`Invalid CC email at index ${index}: ${recipient.email}`);
        }
      });

      params.bcc?.forEach((recipient, index) => {
        if (!this.validateEmail(recipient.email)) {
          errors.push(`Invalid BCC email at index ${index}: ${recipient.email}`);
        }
      });
    }

    console.log('Validation errors:', errors);
    return errors;
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Send a single email with retry logic
   */
  async sendEmail(params, retryCount = 0) {
    // Validate parameters
    const validationErrors = this.validateEmailParams(params);
    if (validationErrors.length > 0) {
      throw new Error(`Validation failed: ${validationErrors.join(', ')}`);
    }

    try {
      const result = await this.api.sendTransacEmail({
        to: params.to,
        sender: params.sender,
        subject: params.subject,
        htmlContent: params.htmlContent,
        textContent: params.textContent,
        cc: params.cc,
        bcc: params.bcc,
        replyTo: params.replyTo,
        attachment: params.attachments,
        headers: params.headers,
        templateId: params.templateId,
        params: params.templateParams,
        tags: params.tags,
        scheduledAt: params.scheduledAt,
      });

      return {
        success: true,
        messageId: result.body.messageId,
        response: result.body
      };

    } catch (error) {
      const shouldRetry = this.shouldRetryError(error);
      
      if (shouldRetry && retryCount < this.options.maxRetries) {
        if (this.options.logErrors) {
          console.warn(`Email send failed (attempt ${retryCount + 1}/${this.options.maxRetries}), retrying...`, error.message);
        }
        
        await this.sleep(this.options.retryDelay * (retryCount + 1));
        return this.sendEmail(params, retryCount + 1);
      }

      console.error('Final email send failure:', JSON.stringify(error));
      if (this.options.logErrors) {
        console.error('Email send failed:', error);
      }

      return {
        success: false,
        error: error.message || 'Unknown error',
        errorDetails: error.body || error,
        retryCount
      };
    }
  }

  /**
   * Determine if error should trigger a retry
   */
  shouldRetryError(error) {
    // Retry on network errors, timeouts, and 5xx server errors
    if (error.status >= 500 && error.status < 600) return true;
    if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') return true;
    if (error.message?.includes('timeout')) return true;
    
    // Don't retry on client errors (4xx)
    if (error.status >= 400 && error.status < 500) return false;
    
    return false;
  }

  /**
   * Send multiple emails in batches
   */
  async sendBatch(emailsArray) {
    const results = [];
    const batches = [];

    // Split into batches
    for (let i = 0; i < emailsArray.length; i += this.options.batchSize) {
      batches.push(emailsArray.slice(i, i + this.options.batchSize));
    }

    // Process each batch
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      if (this.options.logErrors) {
        console.log(`Processing batch ${batchIndex + 1}/${batches.length}`);
      }

      const batchResults = await Promise.allSettled(
        batch.map(emailParams => this.sendEmail(emailParams))
      );

      results.push(...batchResults.map((result, index) => ({
        index: batchIndex * this.options.batchSize + index,
        ...result
      })));

      // Add delay between batches to avoid rate limiting
      if (batchIndex < batches.length - 1) {
        await this.sleep(500);
      }
    }

    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;

    return {
      total: results.length,
      successful,
      failed,
      results
    };
  }

  /**
   * Send email with template
   */
  async sendTemplateEmail(params) {
    if (!params.templateId) {
      throw new Error('Template ID is required for template emails');
    }

    return this.sendEmail({
      to: params.to,
      sender: params.sender,
      templateId: params.templateId,
      params: params.templateParams,
      cc: params.cc,
      bcc: params.bcc,
      replyTo: params.replyTo,
      attachment: params.attachments,
      headers: params.headers,
      tags: params.tags,
      scheduledAt: params.scheduledAt,
    });
  }

  /**
   * Send email with attachments
   */
  async sendEmailWithAttachments(params) {
    // Validate attachments
    if (params.attachments && Array.isArray(params.attachments)) {
      params.attachments.forEach((att, index) => {
        if (!att.content || !att.name) {
          throw new Error(`Attachment at index ${index} must have 'content' and 'name' properties`);
        }
      });
    }

    return this.sendEmail(params);
  }

  /**
   * Schedule email for future delivery
   */
  async scheduleEmail(params, scheduledDate) {
    if (!(scheduledDate instanceof Date)) {
      throw new Error('scheduledDate must be a Date object');
    }

    if (scheduledDate <= new Date()) {
      throw new Error('scheduledDate must be in the future');
    }

    return this.sendEmail({
      ...params,
      scheduledAt: scheduledDate.toISOString()
    });
  }
}

export default BrevoEmailSender;