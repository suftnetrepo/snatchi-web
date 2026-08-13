import { v2 as cloudinary } from 'cloudinary';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';
import { createDocument, getDocuments, removeDocument, restoreDocument } from '../../services/userDocument';
import { isValidObjectId } from '../../utils/helps';
import { logger } from '../../utils/logger';

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
  ['application/pdf', 'PDF'],
  ['application/msword', 'Word'],
  ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'Word'],
  ['application/vnd.ms-excel', 'Spreadsheet'],
  ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'Spreadsheet'],
  ['text/csv', 'Spreadsheet'],
  ['text/plain', 'Text']
]);
const canManageDocuments = (user) => ['integrator', 'manager'].includes(user?.role);
const errorResponse = (message, status = 500) => NextResponse.json({ success: false, error: message }, { status });

const canAccessUserDocuments = (actor, userId) =>
  canManageDocuments(actor) || String(actor?.id) === String(userId);

const hasExpectedSignature = (mimeType, buffer) => {
  const bytes = new Uint8Array(buffer);
  const startsWith = (...signature) => signature.every((byte, index) => bytes[index] === byte);
  if (mimeType === 'application/pdf') return startsWith(0x25, 0x50, 0x44, 0x46);
  if (mimeType === 'image/jpeg') return startsWith(0xff, 0xd8, 0xff);
  if (mimeType === 'image/png') return startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (mimeType === 'image/gif') return String.fromCharCode(...bytes.slice(0, 4)) === 'GIF8';
  if (mimeType === 'image/webp') return String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (['image/heic', 'image/heif'].includes(mimeType)) return String.fromCharCode(...bytes.slice(4, 12)).includes('ftyp');
  if (['application/msword', 'application/vnd.ms-excel'].includes(mimeType)) return startsWith(0xd0, 0xcf, 0x11, 0xe0);
  if (['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mimeType)) {
    return startsWith(0x50, 0x4b, 0x03, 0x04);
  }
  if (['text/csv', 'text/plain'].includes(mimeType)) return !bytes.slice(0, 1024).includes(0);
  return false;
};

const deleteCloudinaryAsset = async (document) => {
  if (!document?.public_id) return;
  const resourceTypes = document.resource_type
    ? [document.resource_type]
    : ['raw', 'image', 'video'];

  for (const resourceType of resourceTypes) {
    const result = await cloudinary.uploader.destroy(document.public_id, { resource_type: resourceType, invalidate: true });
    if (result.result !== 'not found') return;
  }
};

export const POST = async (req) => {
  let uploadedAsset = null;
  try {
    const actor = await getUserSession(req);
    if (!actor) return errorResponse('Unauthorized', 401);

    const formData = await req.formData();
    const userId = formData.get('userId');
    if (!isValidObjectId(userId)) return errorResponse('Invalid user ID', 400);
    if (!canAccessUserDocuments(actor, userId)) return errorResponse('You do not have permission to upload this document', 403);

    const name = String(formData.get('name') || '').trim();
    const description = String(formData.get('description') || '').trim();
    const file = formData.get('file');
    if (!name) return errorResponse('Document name is required', 400);
    if (name.length > 100) return errorResponse('Document name must not exceed 100 characters', 400);
    if (description.length > 500) return errorResponse('Description must not exceed 500 characters', 400);
    if (!file || typeof file.arrayBuffer !== 'function' || file.size === 0) return errorResponse('No file provided', 400);
    if (file.size > MAX_FILE_SIZE) return errorResponse('Files must be 15MB or smaller', 400);

    const documentType = ALLOWED_FILE_TYPES.get(file.type);
    if (!documentType) {
      return errorResponse('Supported files: phone images, JPEG, PNG, WebP, GIF, HEIC, PDF, DOC, DOCX, XLS, XLSX, CSV and TXT', 400);
    }

    // Verify tenant ownership before uploading anything to Cloudinary.
    await getDocuments(actor.integrator, userId);
    const fileBuffer = await file.arrayBuffer();
    if (!hasExpectedSignature(file.type, fileBuffer)) return errorResponse('The selected file content does not match its file type', 400);
    const fileUri = `data:${file.type};base64,${Buffer.from(fileBuffer).toString('base64')}`;
    uploadedAsset = await cloudinary.uploader.upload(fileUri, {
      folder: 'snatchi_user_documents',
      resource_type: 'auto',
      invalidate: true
    });

    try {
      const data = await createDocument(actor.integrator, userId, {
        name,
        description,
        document_type: documentType,
        original_filename: String(file.name || '').slice(0, 255),
        public_id: uploadedAsset.public_id,
        secure_url: uploadedAsset.secure_url,
        resource_type: uploadedAsset.resource_type,
        mime_type: file.type,
        bytes: uploadedAsset.bytes || file.size
      });
      return NextResponse.json({ success: true, data }, { status: 201 });
    } catch (databaseError) {
      await deleteCloudinaryAsset(uploadedAsset).catch((cleanupError) => logger.error(cleanupError));
      throw databaseError;
    }
  } catch (error) {
    logger.error(error);
    return errorResponse(error.message || 'Unable to upload document', error.statusCode || 500);
  }
};

export const GET = async (req) => {
  try {
    const actor = await getUserSession(req);
    if (!actor) return errorResponse('Unauthorized', 401);
    const userId = new URL(req.url).searchParams.get('userId');
    if (!isValidObjectId(userId)) return errorResponse('Invalid user ID', 400);
    if (!canAccessUserDocuments(actor, userId)) return errorResponse('You do not have permission to view these documents', 403);
    const results = await getDocuments(actor.integrator, userId);
    return NextResponse.json({ success: true, data: results }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return errorResponse(error.message || 'Unable to retrieve documents', error.statusCode || 500);
  }
};

export const DELETE = async (req) => {
  try {
    const actor = await getUserSession(req);
    if (!actor) return errorResponse('Unauthorized', 401);
    const url = new URL(req.url);
    const documentId = url.searchParams.get('id');
    const userId = url.searchParams.get('userId');
    if (!isValidObjectId(userId) || !isValidObjectId(documentId)) return errorResponse('Invalid document request', 400);
    if (!canAccessUserDocuments(actor, userId)) return errorResponse('You do not have permission to delete this document', 403);

    const deleted = await removeDocument(actor.integrator, userId, documentId);
    try {
      await deleteCloudinaryAsset(deleted);
    } catch (cloudinaryError) {
      await restoreDocument(actor.integrator, userId, deleted).catch((restoreError) => logger.error(restoreError));
      throw Object.assign(new Error('The document could not be removed from storage. Please try again.'), { statusCode: 502 });
    }
    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return errorResponse(error.message || 'Unable to delete document', error.statusCode || 500);
  }
};
