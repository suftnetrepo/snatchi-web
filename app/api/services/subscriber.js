import { mongoConnect } from '../../../utils/connectDb';
import Integrator from '../models/integrator';
import { integratorValidator } from '../validator/user';
const { logger } = require('../utils/logger');

mongoConnect();

async function createIntegrator(body) {
  const normalizedBody = { ...body };

  // Pending checkout records do not have Stripe identifiers yet. Treat legacy
  // empty-string values as absent; Stripe writes trusted IDs in the next step.
  if (!normalizedBody.subscriptionId) delete normalizedBody.subscriptionId;
  if (!normalizedBody.stripeCustomerId) delete normalizedBody.stripeCustomerId;

  const bodyErrors = integratorValidator(normalizedBody);
  if (bodyErrors.length) {
    throw Object.assign(new Error(bodyErrors.map((it) => it.message).join(',')), { statusCode: 400 });
  }

  try {
    const newIntegrator = await Integrator.create({
      ...normalizedBody
    });

    if (!newIntegrator) {
      throw new Error('create new integrator failed');
    }

    return newIntegrator;
  } catch (error) {
    logger.error(error);
    throw error;
  }
}

export { createIntegrator };
