import { updateIntegrator } from '../services/integrator';
import { v2 as cloudinary } from 'cloudinary';
import { verifyToken } from '../utils/helps';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { logger } from '../utils/logger';

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
    
      const name = fields.name[0];
      const email = fields.email[0];
      const mobile = fields.mobile[0];
      const description = fields.description[0];

      const file = Object.keys(files).length ? files.file[0] : null;
      const filePath = file? file?.filepath : '';

      const body = {
        description: description,
        name: name,
        email: email,
        mobile: mobile
      };

      if (file) {
        const result = await cloudinary.uploader.upload(filePath, {
          resource_type: 'auto',
          folder: 'snatchi_profile_updates'
        });
        body.public_id = result.public_id;
        body.secure_url = result.secure_url;
      }

      const data = await updateIntegrator(user.integrator, body);

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

    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${method} Not Allowed`);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: error.message });
  }
});
