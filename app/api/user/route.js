import { v2 as cloudinary } from 'cloudinary';
import {
  searchUsers,
  getUsers,
  removeUser,
  updateUser,
  createUser,
  getUserById,
  aggregateUserDataByRole,
  changePassword,
  searchUsersByMultipleCriteria,
  updateEngineerAddress
} from '../services/user';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { ensureFirebaseAuthUser } from '../services/firebaseAuthService';
import { userValidator as validateUser, userEditValidator as validateUserEdit } from '../validator/user';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRETE
});

// Authentication middleware
const authenticateUser = async (req) => {
  const user = await getUserSession(req);
  
  if (!user) {
    return { user: null, error: { message: 'Unauthorized', status: 401 } };
  }
  
  return { user, error: null };
};

// Error response helper
const errorResponse = (message, status = 500, error = null) => {
  logger.error(error || message);
  return NextResponse.json({ success: false, error: message }, { status });
};

// Success response helper
const successResponse = (data, status = 200) => {
  return NextResponse.json({ success: true, data }, { status });
};

const canManageUsers = (user) => ['integrator', 'manager'].includes(user?.role);
const MANAGED_USER_FIELDS = new Set(['first_name', 'last_name', 'email', 'mobile', 'role', 'visible', 'user_status', 'chat_status']);
const pickManagedUserFields = (body) => Object.fromEntries(Object.entries(body || {}).filter(([key]) => MANAGED_USER_FIELDS.has(key)));
const validateManagedValues = (body, { allowIntegrator = false } = {}) => {
  const allowedRoles = allowIntegrator ? ['integrator', 'engineer', 'manager', 'guest'] : ['engineer', 'manager', 'guest'];
  if (!allowedRoles.includes(body.role)) return 'Select a valid user role';
  if (body.visible && !['private', 'public'].includes(body.visible)) return 'Select a valid visibility';
  if (typeof body.user_status !== 'boolean' || typeof body.chat_status !== 'boolean') return 'User and chat status must be valid';
  return null;
};

// Parse pagination parameters from URL
const parsePaginationParams = (url) => {
  return {
    sortField: url.searchParams.get('sortField'),
    sortOrder: url.searchParams.get('sortOrder'),
    searchQuery: url.searchParams.get('searchQuery'),
    page: parseInt(url.searchParams.get('page') || '1', 10),
    limit: parseInt(url.searchParams.get('limit') || '10', 10)
  };
};

// Upload file to Cloudinary
const uploadToCloudinary = async (file) => {
  return new Promise((resolve, reject) => {
    const fileBuffer = file.arrayBuffer();
    
    fileBuffer.then(async (buffer) => {
      const base64Data = Buffer.from(buffer).toString('base64');
      const fileUri = `data:${file.type};base64,${base64Data}`;
      
      cloudinary.uploader
        .upload(fileUri, {
          folder: 'snatchi_project_uploads',
          resource_type: 'auto',
          invalidate: true
        })
        .then((result) => resolve(result))
        .catch((error) => reject(error));
    }).catch((error) => reject(error));
  });
};

// Process mobile user update with file upload
const processMobileUserUpdate = async (formData, userId, integratorId) => {
  const body = {
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    email: formData.get('email'),
    mobile: formData.get('mobile'),
  };

  const file = formData.get('file');
  if (file && file.size > 0) {
    try {
      const uploadResult = await uploadToCloudinary(file);
      if (uploadResult) {
        body.public_id = uploadResult.public_id;
        body.secure_url = uploadResult.secure_url;
      }
    } catch (uploadError) {
      logger.error('Cloudinary upload failed:', uploadError);
      throw new Error('File upload failed');
    }
  }

  return await updateUser(integratorId, userId, body);
};

export const GET = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // User list used by the integrator chat picker.
    if (action === 'integrator_user') {
      if (!['integrator', 'manager'].includes(user?.role)) {
        return errorResponse('You do not have permission to list chat users', 403);
      }

      const { data } = await getUsers({
        suid: user.integrator,
        page: 1,
        limit: 100,
        sortField: 'first_name',
        sortOrder: 'asc',
        searchQuery: ''
      });
      return successResponse(data || []);
    }

    // Handle users action (paginated user list)
    if (action === 'users') {
      if (!canManageUsers(user)) return errorResponse('You do not have permission to list users', 403);
      const { sortField, sortOrder, searchQuery, page, limit } = parsePaginationParams(url);
      
      const { data, success, totalCount } = await getUsers({
        suid: user?.integrator,
        page,
        limit,
        sortField,
        sortOrder,
        searchQuery
      });

      return NextResponse.json({ data, success, totalCount });
    }

    // Handle oneUser action (single user by ID)
    if (action === 'oneUser') {
      const results = await getUserById(user?.id, user.integrator);
      return NextResponse.json({ data: results });
    }

    // Handle aggregate action (user statistics by role)
    if (action === 'aggregate') {
      if (!canManageUsers(user)) return errorResponse('You do not have permission to view user totals', 403);
      const aggregated = await aggregateUserDataByRole(user?.integrator);
      return successResponse(aggregated);
    }

    // Handle search_user action (basic user search)
    if (action === 'search_user') {
      if (!canManageUsers(user)) return errorResponse('You do not have permission to search users', 403);
      const searchQuery = url.searchParams.get('searchQuery');
      const searchResults = await searchUsers(searchQuery, user.integrator);
      return successResponse(searchResults);
    }

    // Handle searchMultiple action (advanced multi-criteria search)
    if (action === 'searchMultiple') {
      if (!['integrator', 'manager'].includes(user?.role)) {
        return errorResponse('You do not have permission to search engineers', 403);
      }
      const searchQuery = url.searchParams.get('searchQuery');
      const scope = url.searchParams.get('scope') || 'mine';
      if (!['mine', 'external', 'all'].includes(scope)) return errorResponse('Invalid engineer search scope', 400);
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

      const result = await searchUsersByMultipleCriteria({
        suid: user.integrator,
        scope,
        searchQuery,
        page,
        limit
      });
      
      return NextResponse.json({ success: true, ...result });
    }

    // Invalid action
    return NextResponse.json(
      { success: false, message: 'Invalid action parameter' }, 
      { status: 400 }
    );
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};

export const DELETE = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (!canManageUsers(user)) return errorResponse('You do not have permission to delete users', 403);

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    if (String(id) === String(user.id)) return errorResponse('You cannot delete your own account', 409);
    const target = await getUserById(id, user.integrator);
    if (!target) return errorResponse('User not found', 404);
    if (target.role === 'integrator') return errorResponse('The organisation owner cannot be deleted', 409);

    const deleted = await removeUser(user?.integrator, id);
    return successResponse(deleted);
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};

export const PUT = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    // Handle standard user update
    if (action === 'update_user') {
      if (!canManageUsers(user)) return errorResponse('You do not have permission to update users', 403);
      const body = pickManagedUserFields(await req.json());
      const validationErrors = validateUserEdit(body);
      if (validationErrors.length) return errorResponse(validationErrors.map((item) => item.message).join(', '), 400);
      const existing = await getUserById(id, user.integrator);
      if (!existing) return errorResponse('User not found', 404);
      if (existing.role === 'integrator' && user.role !== 'integrator') {
        return errorResponse('Only the organisation owner can update the owner account', 403);
      }
      const invalidValue = validateManagedValues(body, { allowIntegrator: existing.role === 'integrator' });
      if (invalidValue) return errorResponse(invalidValue, 400);
      if (existing.role !== 'integrator' && body.role === 'integrator') return errorResponse('The organisation owner role cannot be assigned', 403);
      if (body.chat_status && (!existing.chat_status || body.email !== existing.email)) {
        await ensureFirebaseAuthUser(body.email, `${body.first_name || ''} ${body.last_name || ''}`.trim());
      }
      const updated = await updateUser(user.integrator, id, body);
      return successResponse(updated);
    }

    // Handle mobile user update with file upload
    if (action === 'update_mobile_user') {
      if (String(id) !== String(user.id)) return errorResponse('You can only update your own profile', 403);
      const formData = await req.formData();
      const updated = await processMobileUserUpdate(formData, id, user.integrator);
      return successResponse(updated);
    }

    // Handle password change
    if (action === 'change_password') {
      const body = await req.json();
      const updated = await changePassword(user.id, body);
      return successResponse(updated);
    }

    if (action === 'updateAddress') {
      if (!canManageUsers(user) && String(id) !== String(user.id)) {
        return errorResponse('You can only update your own address', 403);
      }
      const body = await req.json();

      const updatedUser = await updateEngineerAddress({
        userId: id,
        address: body,
        actor: user
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Address updated successfully',
          data: {
            _id: updatedUser._id,
            address: updatedUser.address
          }
        },
        { status: 200 }
      );
    }

    // Invalid action
    return NextResponse.json(
      { success: false, error: 'Invalid action parameter' }, 
      { status: 400 }
    );
  } catch (error) {
    console.log("Error in PUT /api/user:", error);
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};

export const POST = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (!canManageUsers(user)) return errorResponse('You do not have permission to create users', 403);

    const body = pickManagedUserFields(await req.json());
    const validationErrors = validateUser(body);
    if (validationErrors.length) return errorResponse(validationErrors.map((item) => item.message).join(', '), 400);
    const invalidValue = validateManagedValues(body);
    if (invalidValue) return errorResponse(invalidValue, 400);
    if (body.chat_status) await ensureFirebaseAuthUser(body.email, `${body.first_name || ''} ${body.last_name || ''}`.trim());
    const result = await createUser(user?.integrator, body);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error.message, error.statusCode || 500, error);
  }
};
