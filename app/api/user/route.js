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
  searchUsersByMultipleCriteria
} from '../services/user';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';

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
const processMobileUserUpdate = async (formData, userId) => {
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

  return await updateUser(userId, body);
};

export const GET = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    // Handle users action (paginated user list)
    if (action === 'users') {
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
      const results = await getUserById(user?.id);
      return NextResponse.json({ data: results });
    }

    // Handle aggregate action (user statistics by role)
    if (action === 'aggregate') {
      const aggregated = await aggregateUserDataByRole(user?.integrator);
      return successResponse(aggregated);
    }

    // Handle search_user action (basic user search)
    if (action === 'search_user') {
      const searchQuery = url.searchParams.get('searchQuery');
      const searchResults = await searchUsers(searchQuery);
      return successResponse(searchResults);
    }

    // Handle searchMultiple action (advanced multi-criteria search)
    if (action === 'searchMultiple') {
      const searchQuery = url.searchParams.get('searchQuery');
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

      const result = await searchUsersByMultipleCriteria({
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
    return errorResponse(error.message, 500, error);
  }
};

export const DELETE = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const deleted = await removeUser(user?.integrator, id);
    return successResponse(deleted);
  } catch (error) {
    return errorResponse(error.message, 500, error);
  }
};

export const PUT = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // TODO: Re-enable subscription enforcement after billing rollout is complete.

    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    // Handle standard user update
    if (action === 'update_user') {
      const body = await req.json();
      const updated = await updateUser(id, body);
      return successResponse(updated);
    }

    // Handle mobile user update with file upload
    if (action === 'update_mobile_user') {
      const formData = await req.formData();
      const updated = await processMobileUserUpdate(formData, id);
      return successResponse(updated);
    }

    // Handle password change
    if (action === 'change_password') {
      const body = await req.json();
      const updated = await changePassword(user.id, body);
      return successResponse(updated);
    }

    // Invalid action
    return NextResponse.json(
      { success: false, error: 'Invalid action parameter' }, 
      { status: 400 }
    );
  } catch (error) {
    return errorResponse(error.message, 500, error);
  }
};

export const POST = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    // TODO: Re-enable subscription enforcement after billing rollout is complete.

    const body = await req.json();
    const result = await createUser(user?.integrator, body);
    return successResponse(result);
  } catch (error) {
    return errorResponse(error.message, 500, error);
  }
};