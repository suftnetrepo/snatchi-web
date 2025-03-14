import { verifyToken } from '../utils/helps';
import { logger } from '../utils/logger';
import { addOne, getAll, removeOne } from '../services/team';

export default verifyToken(async function handler(req, res) {
  const { method } = req;

  const user = req.user;

  try {
    if (method === 'POST') {
      const result = await addOne(user?.integrator, req.body);
      return res.status(200).json({ success: true, data: result });
    }

    if (method === 'GET') {
      const { id } = req.query;
      const results = await getAll(user.integrator, id);
      return res.status(200).json({ data: results });
    }

    if (method === 'DELETE') {
      const { id, projectId } = req.query;
      const deleted = await removeOne(user?.integrator, projectId, id);
      return res.status(200).json({ success: true, data: deleted });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ data: { success: false, message: error.message } });
  }
});
