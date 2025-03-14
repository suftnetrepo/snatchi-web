import { getIntegratorById } from '../services/integrator';
import { verifyToken } from '../utils/helps';
import { logger } from '../utils/logger';

export default verifyToken(async function handler(req, res) {
  const { method } = req;

  const user = req.user;

  try {
    if (method === 'GET') {
      const results = await getIntegratorById(user?.integrator);
      return res.status(200).json({ data: results, success: true });
    }

    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
