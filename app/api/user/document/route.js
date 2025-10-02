import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../../utils/logger';
import { createDocument, getDocuments, removeDocument } from '../../services/userDocument';
const { NextResponse } = require('next/server');
import { getUserSession } from '@/utils/generateToken';

export const config = {
  api: { bodyParser: false }
};

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRETE
});

export const POST = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();

    const description = formData.get('description');
    const name = formData.get('name');
    const userId = formData.get('userId');

    const file = formData.get('file');
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

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

    const data = await createDocument(user.integrator, userId, {
      description: description,
      name: name,
      public_id: result.public_id,
      secure_url: result.secure_url
    });

    return NextResponse.json({ data, success : true }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
};

export const GET = async (req) => {
    try {
      const user = await getUserSession(req);
  
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
  
      const url = new URL(req.url);
      const userId = url.searchParams.get('userId');

      const results = await getDocuments(user.integrator, userId);
      return NextResponse.json({ data: results }, { status: 200 });
    } catch (error) {
      logger.error(error);
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
      const documentId = url.searchParams.get('id');
      const userId = url.searchParams.get('userId');
  
      const deleted = await removeDocument(user.integrator, userId, documentId);
      return NextResponse.json({ success: true, data: deleted }, { status: 200 });
    } catch (error) {
      logger.error(error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
  };
  