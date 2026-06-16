
import EngineerServiceRate from '../models/engineerServiceRate';
import { engineerServiceRateValidator } from '../validator/user';
import { isValidObjectId } from '../utils/helps';
import { mongoConnect } from '@/utils/connectDb';
const { logger } = require('../utils/logger');

mongoConnect();

async function createEngineerServiceRate({ engineerId, serviceName, rate, rateType = 'hourly', description = '' }) {
  try {
    if (!isValidObjectId(engineerId)) {
      const error = new Error('Invalid engineer ID');
      error.statusCode = 400;
      throw error;
    }

    const validationErrors = engineerServiceRateValidator({
      serviceName,
      rate: parseFloat(rate),
      rateType: rateType || 'hourly',
      description: description || ''
    });

    if (validationErrors.length) {
      const error = new Error(validationErrors.map((it) => it.message).join(', '));
      error.statusCode = 400;
      throw error;
    }

    const newRate = await EngineerServiceRate.create({
      engineer: engineerId,
      serviceName,
      rate,
      rateType: rateType || 'hourly',
      description: description || '',
      active: true
    });

    return newRate;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    logger.error(error);
    throw new Error('Failed to create service rate');
  }
}

async function getEngineerServiceRates(engineerId) {
  try {
    if (!isValidObjectId(engineerId)) {
      const error = new Error('Invalid engineer ID');
      error.statusCode = 400;
      throw error;
    }

    const rates = await EngineerServiceRate.find({
      engineer: engineerId,
      active: true
    })
      .sort({ createdAt: -1 })
      .exec();

    return rates;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    logger.error(error);
    throw new Error('Failed to fetch service rates');
  }
}

async function getEngineerServiceRateById(rateId) {
  try {
    if (!isValidObjectId(rateId)) {
      const error = new Error('Invalid rate ID');
      error.statusCode = 400;
      throw error;
    }

    const rate = await EngineerServiceRate.findById(rateId);

    if (!rate || !rate.active) {
      const error = new Error('Service rate not found');
      error.statusCode = 404;
      throw error;
    }

    return rate;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    logger.error(error);
    throw new Error('Failed to fetch service rate');
  }
}

async function updateEngineerServiceRate({ rateId, serviceName, rate, rateType, description }) {
  try {
    if (!isValidObjectId(rateId)) {
      const error = new Error('Invalid rate ID');
      error.statusCode = 400;
      throw error;
    }

    const updateData = {
        ...(serviceName && { serviceName }),
        ...(rate !== undefined && { rate: parseFloat(rate) }),
        ...(rateType && { rateType }),
        ...(description && { description })
    };

    const validationErrors = engineerServiceRateValidator(updateData);

    if (validationErrors.length) {
      const error = new Error(validationErrors.map((it) => it.message).join(', '));
      error.statusCode = 400;
      throw error;
    }

    const updatedRate = await EngineerServiceRate.findByIdAndUpdate(rateId, updateData, {
      new: true,
      runValidators: true
    });

    return updatedRate;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    logger.error(error);
    throw new Error('Failed to update service rate');
  }
}

async function deleteEngineerServiceRate(rateId) {
  try {
    if (!isValidObjectId(rateId)) {
      const error = new Error('Invalid rate ID');
      error.statusCode = 400;
      throw error;
    }

    const deletedRate = await EngineerServiceRate.findByIdAndUpdate(rateId, { active: false }, { new: true });

    return deletedRate;
  } catch (error) {
    if (error.statusCode) {
      throw error;
    }
    logger.error(error);
    throw new Error('Failed to delete service rate');
  }
}

export {
  createEngineerServiceRate,
  getEngineerServiceRates,
  getEngineerServiceRateById,
  updateEngineerServiceRate,
  deleteEngineerServiceRate
};
