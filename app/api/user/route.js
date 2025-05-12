import { v2 as cloudinary } from 'cloudinary';
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
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRETE
});

export const GET = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');

    if (action === 'users') {
      const sortField = url.searchParams.get('sortField');
      const sortOrder = url.searchParams.get('sortOrder');
      const searchQuery = url.searchParams.get('searchQuery');
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

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

    if (action === 'oneUser') {
      const results = await getUserById(user?.id);
      return NextResponse.json({ data: results });
    }

    if (action === 'aggregate') {
      const aggregated = await aggregateUserDataByRole(user?.integrator);
      return NextResponse.json({ success: true, data: aggregated });
    }

    if (action === 'search_user') {
      const searchQuery = url.searchParams.get('searchQuery');
      const searchResults = await searchUsers(searchQuery);
      return NextResponse.json({ success: true, data: searchResults });
    }

    return NextResponse.json({ success: false, message: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    logger.error(error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const DELETE = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');

    const deleted = await removeUser(user?.integrator, id);
    return NextResponse.json({ success: true, data: deleted });
  } catch (error) {
    logger.error(error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const PUT = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const action = url.searchParams.get('action');

    if (action === 'update_user') {
      const body = await req.json();
      const updated = await updateUser(id, body);
      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'update_mobile_user') {
      const formData = await req.formData();

      const first_name = formData.get('first_name');
      const last_name = formData.get('last_name');
      const email = formData.get('email');
      const mobile = formData.get('mobile');

      const body = {
        first_name: first_name,
        last_name: last_name,
        email: email,
        mobile: mobile,
        public_id: '',
        secure_url: ''
      };

      const file = formData.get('file');
      if (file) {
        const fileBuffer = await file.arrayBuffer();
        const base64Data = Buffer.from(fileBuffer).toString('base64');
        const fileUri = `data:${file.type};base64,${base64Data}`;

        const uploadToCloudinary = () => {
          return new Promise((resolve, reject) => {
            cloudinary.uploader
              .upload(fileUri, {
                folder: 'snatchi_project_uploads',
                resource_type: 'auto',
                invalidate: true
              })
              .then((result) => resolve(result))
              .catch((error) => reject(error));
          });
        };

        const result = await uploadToCloudinary();

        if (result) {
          (body.public_id = result?.public_id), (body.secure_url = result?.secure_url);
        }
      }

      const updated = await updateUser(id, body);

      return NextResponse.json({ success: true, data: updated });
    }

    if (action === 'change_password') {
      const updated = await changePassword(user.id, body);
      return NextResponse.json({ success: true, data: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    console.error(error);

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};

export const POST = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const body = await req.json();

    const result = await createUser(user?.integrator, body);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    logger.error(error);

    if (error.message === 'Unauthorized') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
