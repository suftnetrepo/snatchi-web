import { verifyToken } from '../utils/helps';
import { logger } from '../utils/logger';
import { addOne, getAll, removeOne } from '../services/taskTeam';

export default verifyToken(async function handler(req, res) {
  const { method } = req;

  try {
    if (method === 'POST') {
      const result = await addOne(req.body);
      return res.status(200).json({ success: true, data: result });
    }

    if (method === 'GET') {
      const { projectId, taskId } = req.query;
      const result = await getAll(taskId, projectId);  
      return res.status(200).json({ success: true, data: result });
    }

    if (method === 'DELETE') {
      const { id, projectId, taskId } = req.query;
      const deleted = await removeOne(projectId, taskId, id);
      return res.status(200).json({ success: true, data: deleted });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ data: { success: false, message: error.message } });
  }
});
