import { mongoConnect } from '../../../utils/connectDb';
import StripeWebhookEvent from '../models/stripeWebhookEvent';

mongoConnect();

/**
 * Check if a webhook event has already been processed
 * @param {string} stripeEventId - Stripe event ID (from event.id)
 * @param {string} eventType - Event type (from event.type)
 * @param {string} customerId - Stripe customer ID
 * @param {string} subscriptionId - Stripe subscription ID (optional)
 * @returns {object} { isDuplicate: boolean, event: object }
 */
export async function checkWebhookDuplicate(stripeEventId, eventType, customerId, subscriptionId = '') {
  try {
    const existingEvent = await StripeWebhookEvent.findOne({
      stripeEventId: stripeEventId
    });

    if (existingEvent) {
      console.log(`⚠️ Webhook deduplication: Event ${stripeEventId} already processed`);
      return {
        isDuplicate: true,
        event: existingEvent,
        message: `Event ${stripeEventId} was already processed at ${existingEvent.processedAt}`
      };
    }

    return {
      isDuplicate: false,
      event: null,
      message: 'New event - proceeding with processing'
    };
  } catch (error) {
    console.error('Error checking webhook duplicate:', error);
    throw new Error(`Failed to check webhook duplicate: ${error.message}`);
  }
}

/**
 * Record a webhook event as processed
 * @param {string} stripeEventId - Stripe event ID
 * @param {string} eventType - Event type
 * @param {string} customerId - Stripe customer ID
 * @param {string} subscriptionId - Stripe subscription ID (optional)
 * @param {object} eventData - Full event object to store
 * @param {string} status - Processing status (completed, failed, etc)
 * @param {string} errorMessage - Error message if failed
 * @returns {object} Created webhook event record
 */
export async function recordWebhookEvent(
  stripeEventId,
  eventType,
  customerId,
  subscriptionId = '',
  eventData = {},
  status = 'completed',
  errorMessage = ''
) {
  try {
    const webhookEvent = new StripeWebhookEvent({
      stripeEventId,
      eventType,
      customerId,
      subscriptionId: subscriptionId || '',
      processed: status === 'completed',
      processingStatus: status,
      errorMessage: errorMessage || '',
      eventData: eventData || {}
    });

    const saved = await webhookEvent.save();
    console.log(`✅ Webhook event recorded: ${stripeEventId}`);
    return saved;
  } catch (error) {
    // Log but don't fail if we can't record the event
    // Stripe will retry if we return error status
    console.error('Error recording webhook event:', error);
    throw error;
  }
}

/**
 * Mark a webhook event as failed
 * @param {string} stripeEventId - Stripe event ID
 * @param {string} errorMessage - Error message
 * @param {number} retryCount - Current retry count
 * @returns {object} Updated webhook event record
 */
export async function markWebhookEventFailed(stripeEventId, errorMessage = '', retryCount = 0) {
  try {
    const updated = await StripeWebhookEvent.findOneAndUpdate(
      { stripeEventId },
      {
        processed: false,
        processingStatus: 'failed',
        errorMessage: errorMessage || 'Unknown error',
        retryCount: retryCount
      },
      { new: true }
    );

    console.error(`❌ Webhook event marked failed: ${stripeEventId} - ${errorMessage}`);
    return updated;
  } catch (error) {
    console.error('Error marking webhook event as failed:', error);
    throw error;
  }
}

/**
 * Get webhook events that failed and can be retried
 * @param {number} maxRetries - Max number of retries (default 5)
 * @returns {array} Array of failed events
 */
export async function getFailedWebhookEvents(maxRetries = 5) {
  try {
    const failedEvents = await StripeWebhookEvent.find({
      processingStatus: 'failed',
      retryCount: { $lt: maxRetries }
    }).sort({ createdAt: 1 }).limit(10);

    return failedEvents;
  } catch (error) {
    console.error('Error fetching failed webhook events:', error);
    throw error;
  }
}

/**
 * Middleware function to wrap webhook handlers
 * Returns early if event is duplicate
 */
export async function webhookDeduplicationMiddleware(req, event) {
  try {
    // Extract required fields
    const stripeEventId = event.id;
    const eventType = event.type;
    const customerId = event.data.object?.customer || event.data.object?.id;
    const subscriptionId = event.data.object?.subscription || event.data.object?.id || '';

    if (!stripeEventId || !eventType || !customerId) {
      throw new Error('Invalid event: missing required fields (id, type, or customer)');
    }

    // Check for duplicate
    const duplicateCheck = await checkWebhookDuplicate(stripeEventId, eventType, customerId, subscriptionId);

    if (duplicateCheck.isDuplicate) {
      // Already processed - return success to Stripe
      return {
        isDuplicate: true,
        shouldProcess: false,
        message: `Event already processed: ${stripeEventId}`
      };
    }

    // New event - safe to process
    return {
      isDuplicate: false,
      shouldProcess: true,
      stripeEventId,
      eventType,
      customerId,
      subscriptionId,
      message: 'New event - proceeding with processing'
    };
  } catch (error) {
    console.error('Webhook deduplication middleware error:', error);
    throw error;
  }
}
