import { mongoConnect } from '../../../utils/connectDb';
import Integrator from '../models/integrator';
import { integratorValidator } from '../validator/user';
const { logger } = require('../utils/logger');

mongoConnect();

async function createIntegrator(body) {
  const bodyErrors = integratorValidator({ ...body });
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const newIntegrator = await Integrator.create({
      ...body
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
