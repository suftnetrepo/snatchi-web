import {
  createEngineerServiceRate,
  getEngineerServiceRates,
  getEngineerServiceRateById,
  updateEngineerServiceRate,
  deleteEngineerServiceRate
} from '../services/engineerServiceRate';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';
import { getUserSession } from '@/utils/generateToken';

// Authentication middleware
const authenticateUser = async (req) => {
  const user = await getUserSession(req);
  
  if (!user) {
    return { user: null, error: { message: 'Unauthorized', status: 401 } };
  }
  
  return { user, error: null };
};

// Error response helper
const errorResponse = (message, status = 500, error = null) => {
  logger.error(error || message);
  return NextResponse.json({ success: false, error: message }, { status });
};

// Success response helper
const successResponse = (data, status = 200) => {
  return NextResponse.json({ success: true, data }, { status });
};

// Validate engineer access
const validateEngineerAccess = (user, engineerId) => {
  if (user.role === 'engineer' && user.id !== engineerId) {
    return { valid: false, error: 'You can only manage your own service rates', status: 403 };
  }

  return { valid: true };
};

export const GET = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get('action');
    const engineerId = url.searchParams.get('engineerId');
    const rateId = url.searchParams.get('rateId');

    // List all service rates for an engineer
    if (action === 'list' || action === null) {
      if (!engineerId) {
        return errorResponse('engineerId is required', 400);
      }

      const accessCheck = validateEngineerAccess(user, engineerId);
      if (!accessCheck.valid) {
        return errorResponse(accessCheck.error, accessCheck.status);
      }

      const rates = await getEngineerServiceRates(engineerId);
      return successResponse(rates);
    }

    // Get a specific service rate
    if (action === 'getById') {
      if (!rateId) {
        return errorResponse('rateId is required', 400);
      }

      const rate = await getEngineerServiceRateById(rateId);
      
      const accessCheck = validateEngineerAccess(user, rate.engineer.toString());
      if (!accessCheck.valid) {
        return errorResponse(accessCheck.error, accessCheck.status);
      }

      return successResponse(rate);
    }

    return errorResponse('Invalid action', 400);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred';
    return errorResponse(message, statusCode, error);
  }
};

export const POST = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const body = await req.json();
    const engineerId = body.engineerId || user.id;

    const accessCheck = validateEngineerAccess(user, engineerId);
    if (!accessCheck.valid) {
      return errorResponse(accessCheck.error, accessCheck.status);
    }

    const newRate = await createEngineerServiceRate({
      engineerId,
      serviceName: body.serviceName,
      rate: body.rate,
      rateType: body.rateType,
      description: body.description
    });

    return successResponse(newRate, 201);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred';
    return errorResponse(message, statusCode, error);
  }
};

export const PUT = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const body = await req.json();
    const rateId = body.rateId;
    const engineerId = body.engineerId || user.id;

    if (!rateId) {
      return errorResponse('rateId is required', 400);
    }

    const accessCheck = validateEngineerAccess(user, engineerId);
    if (!accessCheck.valid) {
      return errorResponse(accessCheck.error, accessCheck.status);
    }

    const updatedRate = await updateEngineerServiceRate({
      rateId,
      engineerId,
      serviceName: body.serviceName,
      rate: body.rate,
      rateType: body.rateType,
      description: body.description
    });

    return successResponse(updatedRate);
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred';
    return errorResponse(message, statusCode, error);
  }
};

export const DELETE = async (req) => {
  try {
    const { user, error } = await authenticateUser(req);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    const url = new URL(req.url);
    const rateId = url.searchParams.get('rateId');
    const engineerId = url.searchParams.get('engineerId') || user.id;

    if (!rateId) {
      return errorResponse('rateId is required', 400);
    }

    const accessCheck = validateEngineerAccess(user, engineerId);
    if (!accessCheck.valid) {
      return errorResponse(accessCheck.error, accessCheck.status);
    }

    const deletedRate = await deleteEngineerServiceRate(rateId, engineerId);

    return successResponse({ message: 'Service rate deleted successfully', data: deletedRate });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'An unexpected error occurred';
    return errorResponse(message, statusCode, error);
  }
};
