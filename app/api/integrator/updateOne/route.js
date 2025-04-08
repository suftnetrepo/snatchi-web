import { updateIntegrator } from '../../services/integrator';
import { v2 as cloudinary } from 'cloudinary';
import { logger } from '../../utils/logger';
const { NextResponse } = require('next/server');
import { getUserSession } from '@/utils/generateToken';

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUD_NAME,
  api_key: process.env.NEXT_PUBLIC_CLOUD_API_KEY,
  api_secret: process.env.NEXT_PUBLIC_CLOUD_SECRETE
});

export const config = {
  api: { bodyParser: false }
};

export const POST = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    let result = null;
    const formData = await req.formData();

    const name = formData.get('name');
    const email = formData.get('email');
    const mobile = formData.get('mobile');
    const description = formData.get('description');
    const file = formData.get('file');

    if (file) {
      const fileBuffer = await file.arrayBuffer();
      const base64Data = Buffer.from(fileBuffer).toString('base64');
      const fileUri = `data:${file.type};base64,${base64Data}`;

      try {
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

        result = await uploadToCloudinary();
      } catch (error) {
        console.log(error);
      }
    }

    const body = {
      description,
      name,
      email,
      mobile
    };

    if (result) {
      body.public_id = result.public_id;
      body.secure_url = result.secure_url;
    }

    const data = await updateIntegrator(user.integrator, body);

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message || 'Something went wrong' }, { status: 500 });
  }
};
