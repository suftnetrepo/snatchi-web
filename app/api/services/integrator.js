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
    const recentInspectors = await Integrator.find({}).sort({ createdAt: -1 }).limit(limit);

    return recentInspectors;
  } catch (error) {
    logger.error(error);
    throw new Error('Error fetching recent integrators. Please try again.');
  }
};

async function getIntegrators({ page = 1, limit = 10, sortField, sortOrder, searchQuery }) {
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
      ...searchFilter
    };

    const [integrators, totalCount] = await Promise.all([
      Integrator.find(query).sort(sortOptions).skip(skip).limit(limit).exec(),
      Integrator.countDocuments({})
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
      const results = await Integrator.findOne({ _id: id })
        .exec();
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

    if (!updated) {
      throw new Error('Integrator not found or update failed');
    }

    return updated;
  } catch (error) {
    logger.error(error);
    throw new Error('An unexpected error occurred. Please try again.');
  }
}

async function updateIntegratorStatus(stripeCustomerId, body) {

  try {
    const updated = await Integrator.findOneAndUpdate(
      { stripeCustomerId: stripeCustomerId },
      body, 
      { new: true } 
    );

    if (!updated) {
      throw new Error('Integrator not found or update failed');
    }

    return updated;
  } catch (error) {
    logger.error(error);   
  }
}


export { updateIntegratorStatus, getIntegratorById, updateIntegrator, recentInspectors, aggregateInspectorStatus, getIntegrators, getWeeklyUserSignOnData };
