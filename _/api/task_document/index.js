import { v2 as cloudinary } from 'cloudinary';
import { verifyToken } from '../utils/helps';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { logger } from '../utils/logger';
import { createDocument, getDocuments, removeDocument } from '../services/taskDocument';

export const config = {
  api: { bodyParser: false }
};

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRETE
});

export default verifyToken(async function handler(req, res) {
  const { method } = req;

  const user = req.user;

  try {
    if (method === 'POST') {
      const form = formidable({
        multiples: false,
        keepExtensions: true
      });

      const { fields, files } = await new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
          if (err) reject(err);
          else resolve({ fields, files });
        });
      });

      const documentType = fields.document_type[0];
      const documentName = fields.document_name[0];
      const taskId = fields.taskId[0];
      const projectId = fields.projectId[0];

      const file = files.file[0];
      const filePath = file.filepath;

      const result = await cloudinary.uploader.upload(filePath, {
        resource_type: 'auto',
        folder: 'snatchi_project_uploads'
      });

      const data = await createDocument(taskId, projectId, {
        document_type: documentType,
        document_name: documentName,
        public_id: result.public_id,
        secure_url: result.secure_url
      });

      try {
        await fs.unlink(filePath);
      } catch (err) {
        if (err.code === 'ENOENT') {
        } else {
          logger.error(err);
        }
      }

      return res.status(200).json({ data: data });
    }

    if (method === 'GET') {
      const { taskId, projectId } = req.query;    
      const results = await getDocuments(projectId, taskId);
      return res.status(200).json({ data: results });
    }

    if (method === 'DELETE') {
      const { id, taskId, projectId } = req.query;
      const deleted = await removeDocument(projectId, taskId, id);
      return res.status(200).json({ success: true, data: deleted });
    }

    res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ data: { success: false, message: error.message } });
  }
});
