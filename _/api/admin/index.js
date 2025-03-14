import {
  getIntegrators,
  recentInspectors,
  aggregateInspectorStatus,
  getWeeklyUserSignOnData
} from '../services/integrator';
import { verifyToken } from '../utils/helps';
import { logger } from '../utils/logger';

export default verifyToken(async function handler(req, res) {
  const { method, query } = req;

  try {
    if (method === 'GET') {
      const { action } = query;

      if (action === 'aggregate') {
        const aggregated = await aggregateInspectorStatus();
        return res.status(200).json({ success: true, data: aggregated });
      }

      if (action === 'recent') {
        const recent = await recentInspectors();
        return res.status(200).json({ success: true, data: recent });
      }

      if (action === 'paginate') {
        const { sortField, sortOrder, searchQuery } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { data, success, totalCount } = await getIntegrators({
          page,
          limit,
          sortField,
          sortOrder,
          searchQuery
        });

        return res.status(200).json({ data, success, totalCount });
      }

      if (action === 'chart') {
        const weeklyUserSignOnData = await getWeeklyUserSignOnData();
        return res.status(200).json({ success: true, data: weeklyUserSignOnData });
      }

      return res.status(400).json({ success: false, message: 'Invalid action parameter' });
    }

    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
