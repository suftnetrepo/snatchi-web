const { getIntegratorById } = require('../../services/integrator');
const { logger } = require('../../utils/logger');
const { NextResponse } = require('next/server');

export const GET = async (req) => {
  try {
    const userData = req.headers.get('x-user-data');
    const user = userData ? JSON.parse(userData) : null;
  
    const results = await getIntegratorById(user?.integrator);
   
    return NextResponse.json({ data: results });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
