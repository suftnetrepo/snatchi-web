import {
  searchUsers,
  getUsers,
  removeUser,
  updateUser,
  createUser,
  getUserById,
  aggregateUserDataByRole,
  changePassword
} from '../services/user';
import { verifyToken } from '../utils/helps';
import { logger } from '../utils/logger';

export default verifyToken(async function handler(req, res) {
  const { method } = req;

  const user = req.user;

  try {
    if (method === 'GET') {
      const { action } = req.query;
    
      if (action === 'users') {
        const { sortField, sortOrder, searchQuery } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const { data, success, totalCount } = await getUsers({
          suid: user?.integrator,
          page,
          limit,
          sortField,
          sortOrder,
          searchQuery
        });
        return res.status(200).json({ data, success, totalCount });
      }

      if (action === 'integrator_user') {
        const { integratorId } = req.query;
        const results = await getUserById(integratorId);
        return res.status(200).json({ data: results });
      }

      if (action === 'aggregate') {
        const aggregated = await aggregateUserDataByRole(user?.integrator);
        return res.status(200).json({ success: true, data: aggregated });
      }

      if (action === 'search_user') {
        const { searchQuery } = req.query;
        const searchResults = await searchUsers(searchQuery);
        return res.status(200).json({ success: true, data: searchResults });
      }
    }

    if (method === 'DELETE') {
      const { id } = req.query;
      const deleted = await removeUser(user?.integrator, id);
      return res.status(200).json({ success: true, data: deleted });
    }

    if (method === 'PUT') {
      const { id, action } = req.query;

      if (action === 'update_user') {
        const updated = await updateUser(id, req.body);
        return res.status(200).json({ success: true, data: updated });
      }

      if (action === 'change_password') {
        const updated = await changePassword(user.id, req.body);
        return res.status(200).json({ success: true, data: updated });
      }
    }

    if (method === 'POST') {
      const result = await createUser(user?.integrator, req.body);
      return res.status(200).json({ success: true, data: result });
    }

    res.setHeader('Allow', ['GET', 'DELETE', 'PUT', 'POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
