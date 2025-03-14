import { getTaskById, getTasks, removeTask, updateTask, createTask } from '../services/task';
import { verifyToken } from '../utils/helps';
import { logger } from '../utils/logger';

export default verifyToken(async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'GET') {
      const { action } = req.query;

      if (action === 'paginate') {
        const { sortField, sortOrder, searchQuery, projectId } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { data, success, totalCount } = await getTasks({
          projectId: projectId,
          page,
          limit,
          sortField,
          sortOrder,
          searchQuery
        });
        return res.status(200).json({ data, success, totalCount });
      }

      if (action === 'single') {
        const { id, projectId } = req.query;
        const { data } = await getTaskById(projectId, id);
        return res.status(200).json({ data, success: true });
      }
    }

    if (method === 'DELETE') {
      const { id, projectId } = req.query;
      const deleted = await removeTask(projectId, id);
      return res.status(200).json({ success: true, data: deleted });
    }

    if (method === 'PUT') {
      const { id } = req.query;   
      const updated = await updateTask(id, req.body);
      return res.status(200).json({ success: true, data: updated });
    }

    if (method === 'POST') {   
      const result = await createTask(req.body);
      return res.status(200).json({ success: true, data: result });
    }

    res.setHeader('Allow', ['GET', 'DELETE', 'PUT', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return res.status(400).json({ success: false, message: error.message });
  }
});
