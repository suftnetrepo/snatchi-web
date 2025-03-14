import { getProjectWeeklySummary, getProjectSummaryByIntegrator, getProjects, getProjectById, removeProject, updateProject, createProject, getProjectStatusAggregates } from '../services/project';
import { verifyToken } from '../utils/helps';
import { logger } from '../utils/logger';

export default verifyToken(async function handler(req, res) {
  const { method } = req;
  const user = req.user;

  try {
    if (method === 'GET') {
      const { action } = req.query;

      if (action === 'paginate') {
        const { sortField, sortOrder, searchQuery } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { data, success, totalCount } = await getProjects({
          suid: user?.integrator,
          page,
          limit,
          sortField,
          sortOrder,
          searchQuery
        });
        return res.status(200).json({ data, success, totalCount });
      }

      if (action === 'single') {
        const { id } = req.query;
        const { data } = await getProjectById(id);
        return res.status(200).json({ data, success: true });
      }

      if (action === 'aggregate') {
        const aggregated = await getProjectStatusAggregates(user?.integrator);
        return res.status(200).json({ success: true, data: aggregated });
      }

      if (action === 'recent') {
        const aggregated = await getProjectSummaryByIntegrator(user?.integrator);
        return res.status(200).json({ success: true, data: aggregated });
      }

      if (action === 'chart') {
        const aggregated = await getProjectWeeklySummary(user?.integrator);
        return res.status(200).json({ success: true, data: aggregated });
      }

    }

    if (method === 'DELETE') {
      const { id } = req.query;
      const deleted = await removeProject(user?.integrator, id);
      return res.status(200).json({ success: true, data: deleted });
    }

    if (method === 'PUT') {
      const { id } = req.query;
   
      const updated = await updateProject(id, req.body);
      return res.status(200).json({ success: true, data: updated });
    }

    if (method === 'POST') {
      const result = await createProject(user?.integrator, req.body);
      return res.status(200).json({ success: true, data: result });
    }

    res.setHeader('Allow', ['GET', 'DELETE', 'PUT', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    logger.error(error);
    return res.status(400).json({ success: false, message: error.message });
  }
});
