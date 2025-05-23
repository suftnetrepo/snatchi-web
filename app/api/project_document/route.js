import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../utils/logger';
import { createDocument, getDocuments, removeDocument } from '../services/projectDocument';
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

    const documentType = formData.get('document_type');
    const documentName = formData.get('document_name');
    const id = formData.get('id');

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

    const data = await createDocument(user.integrator, id, {
      document_type: documentType,
      document_name: documentName,
      public_id: result.public_id,
      secure_url: result.secure_url
    });

    return NextResponse.json({ data }, { status: 200 });
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
    const id = url.searchParams.get('id');

    const results = await getDocuments(user.integrator, id);
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
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('projectId');

    const deleted = await removeDocument(user.integrator, projectId, id);
    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
