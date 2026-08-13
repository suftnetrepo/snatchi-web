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

const MAX_FILE_SIZE = 15 * 1024 * 1024;
const ALLOWED_FILE_TYPES = new Map([
  ['image/jpeg', 'Image'],
  ['image/png', 'Image'],
  ['image/webp', 'Image'],
  ['image/gif', 'Image'],
  ['image/heic', 'Image'],
  ['image/heif', 'Image'],
  ['application/pdf', 'Pdf'],
  ['application/msword', 'Word'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Word']
]);

const deleteCloudinaryAsset = async (document) => {
  if (!document?.public_id) return;

  const resourceTypes = document.resource_type
    ? [document.resource_type]
    : document.document_type?.toLowerCase() === 'image'
      ? ['image', 'raw']
      : ['raw', 'image'];

  for (const resourceType of resourceTypes) {
    const result = await cloudinary.uploader.destroy(document.public_id, {
      resource_type: resourceType,
      invalidate: true
    });
    if (result.result !== 'not found') return;
  }
};

export const POST = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await req.formData();

    const documentName = formData.get('document_name');
    const id = formData.get('id');

    const file = formData.get('file');
    if (!file || file.size === 0) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const documentType = ALLOWED_FILE_TYPES.get(file.type);
    if (!documentType) {
      return NextResponse.json(
        { error: 'Only JPEG, PNG, WebP, GIF, HEIC, PDF, DOC and DOCX files are supported' },
        { status: 400 }
      );
    }
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'Files must be 15MB or smaller' }, { status: 400 });
    }
    if (!documentName?.trim()) {
      return NextResponse.json({ error: 'Document name is required' }, { status: 400 });
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

    let data;
    try {
      data = await createDocument(user.integrator, id, {
        document_type: documentType,
        document_name: documentName.trim(),
        public_id: result.public_id,
        secure_url: result.secure_url,
        resource_type: result.resource_type,
        mime_type: file.type,
        bytes: result.bytes || file.size
      });
    } catch (databaseError) {
      await deleteCloudinaryAsset({ public_id: result.public_id, resource_type: result.resource_type }).catch(() => {});
      throw databaseError;
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error(error);
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
    try {
      await deleteCloudinaryAsset(deleted);
    } catch (cloudinaryError) {
      logger.error('Document removed from project, but Cloudinary cleanup failed', cloudinaryError);
    }
    return NextResponse.json({ success: true, data: true }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
