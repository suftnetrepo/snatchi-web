
const { getIntegratorById } = require('../../services/integrator');
const { logger } = require('../../utils/logger');
const { NextResponse } = require('next/server');
import { getUserSession } from '@/utils/generateToken';

export const GET = async (req) => {
  try {
    const user = await getUserSession(req);

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  
    const results = await getIntegratorById(user?.integrator);
   
    return NextResponse.json({ data: results });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
