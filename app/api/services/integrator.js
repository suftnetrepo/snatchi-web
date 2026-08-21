import { mongoConnect } from '../../../utils/connectDb';
import Integrator from '../models/integrator';
const { logger } = require('../utils/logger');
import { isValidObjectId, va } from '../utils/helps';
import { integratorUpdateValidator } from '../validator/user';

mongoConnect();

const aggregateInspectorStatus = async () => {
  try {
    const result = await Integrator.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    return result;
  } catch (error) {
    throw new Error('Error aggregating integrators status. Please try again.');
  }
};

const recentInspectors = async (limit = 10) => {
  try {
    const safeLimit = Math.min(25, Math.max(1, Number(limit) || 10));
    const recentInspectors = await Integrator.find({})
      .select('name mobile email secure_url status plan createdAt')
      .sort({ createdAt: -1 })
      .limit(safeLimit)
      .lean();

    return recentInspectors;
  } catch (error) {
    logger.error(error);
    throw new Error('Error fetching recent integrators. Please try again.');
  }
};

async function getIntegrators({ page = 1, limit = 10, sortField, sortOrder, searchQuery }) {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 10));
  const skip = (safePage - 1) * safeLimit;

  try {
    const sortOptions = {};
    const allowedSortFields = new Set(['name', 'email', 'mobile', 'plan', 'status', 'createdAt', 'startDate']);
    if (sortField && allowedSortFields.has(sortField)) {
      sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    }

    const escapedSearch = String(searchQuery || '').trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const searchFilter = escapedSearch
      ? {
          $or: [
            { name: { $regex: escapedSearch, $options: 'i' } },
            { mobile: { $regex: escapedSearch, $options: 'i' } },
            { email: { $regex: escapedSearch, $options: 'i' } },
            { plan: { $regex: escapedSearch, $options: 'i' } }
          ]
        }
      : {};

    const query = {
      ...searchFilter
    };

    const [integrators, totalCount] = await Promise.all([
      Integrator.find(query)
        .select('name mobile email description secure_url logo_url status plan startDate endDate trial_start trial_end createdAt adminSuspension')
        .sort(sortOptions)
        .skip(skip)
        .limit(safeLimit)
        .lean()
        .exec(),
      Integrator.countDocuments(query)
    ]);

    return {
      data: integrators,
      totalCount,
      success: true
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function getIntegratorsBySearch({ page = 1, limit = 10, sortField, sortOrder, searchQuery }) {
  const skip = (page - 1) * limit;

  try {
    const sortOptions = {};
    if (sortField) {
      sortOptions[sortField] = sortOrder === 'desc' ? -1 : 1;
    }

    const searchFilter = searchQuery
      ? {
          $or: [
            { name: { $regex: searchQuery, $options: 'i' } },
            { mobile: { $regex: searchQuery, $options: 'i' } },
            { email: { $regex: searchQuery, $options: 'i' } },
            { plan: { $regex: searchQuery, $options: 'i' } }
          ]
        }
      : {};

    const query = {
      status: 'active', // Added this condition to only get active integrators
      ...searchFilter
    };

    const [integrators, totalCount] = await Promise.all([
      Integrator.find(query)
        .select('name email mobile description _id address secure_url status')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      Integrator.countDocuments({ status: 'active' }) // Updated to count only active integrators
    ]);

    return {
      data: integrators,
      totalCount
    };
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}
async function getWeeklyUserSignOnData() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const result = await Integrator.aggregate([
      {
        $match: {
          startDate: { $gte: sevenDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$startDate' }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    const data = [];
    const dateMap = result.reduce((acc, cur) => {
      acc[cur._id] = cur.count;
      return acc;
    }, {});

    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      data.push(dateMap[dateString] || 0);
    }

    return data;
  } catch (error) {
    logger.error(error);
    throw new Error('Error fetching user sign-on data.');
  }
}

async function getIntegratorById(id) {
  try {
    try {
      const results = await Integrator.findOne({ _id: id }).exec();
      return { data: results };
    } catch (error) {
      throw error;
    }
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateIntegrator(id, body) {
  if (!isValidObjectId(id)) {
    throw new Error(JSON.stringify([{ field: 'id', message: 'Invalid MongoDB ObjectId' }]));
  }

  const bodyErrors = integratorUpdateValidator(body);
  if (bodyErrors.length) {
    throw new Error(bodyErrors.map((it) => it.message).join(','));
  }

  try {
    const updated = await Integrator.findByIdAndUpdate(id, body, {
      new: true
    });

    return updated;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateIntegratorStatus(stripeCustomerId, body, integratorId = '') {

  try {
    // Normalize status to lowercase if provided
    const updateData = { ...body };
    if (updateData.status) {
      updateData.status = updateData.status.toLowerCase();
    }

    const identity = [];
    if (stripeCustomerId) identity.push({ stripeCustomerId });
    if (integratorId && isValidObjectId(integratorId)) identity.push({ _id: integratorId });
    if (!identity.length) throw new Error('Missing integrator identity');

    const result = await Integrator.updateOne(identity.length === 1 ? identity[0] : { $or: identity }, { $set: updateData });

    if (result.matchedCount !== 1) {
      throw new Error(`Integrator not found for Stripe customer ${stripeCustomerId || 'unknown'}`);
    }

    return result;
  } catch (error) {
    logger.error(error);
    throw error; // Re-throw so caller is aware of the error
  }
}

async function getVerifySubscriptionStatus(id) {
  try {
    const result = await Integrator.findOne({ stripeCustomerId: id });

    return {
      active: result?.status === 'active'
    };
  } catch (error) {
    logger.error(`Failed to verify subscription for customer ${id}:`, error);
    throw new Error(`Unable to verify subscription status`);
  }
}

export {
  getIntegratorsBySearch,
  getVerifySubscriptionStatus,
  updateIntegratorStatus,
  getIntegratorById,
  updateIntegrator,
  recentInspectors,
  aggregateInspectorStatus,
  getIntegrators,
  getWeeklyUserSignOnData
};
