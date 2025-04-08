import {
  getIntegrators,
  recentInspectors,
  aggregateInspectorStatus,
  getWeeklyUserSignOnData
} from '../services/integrator';
import { logger } from '../utils/logger';
import { NextResponse } from 'next/server';

export const GET = async (req) => {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action');
  
    if (action === 'aggregate') {
      const aggregated = await aggregateInspectorStatus();
      return NextResponse.json({ success: true, data: aggregated });
    }

    if (action === 'recent') {
      const recent = await recentInspectors();
      return NextResponse.json({ success: true, data: recent });
    }

    if (action === 'paginate') {
      const sortField = url.searchParams.get('sortField');
      const sortOrder = url.searchParams.get('sortOrder');
      const searchQuery = url.searchParams.get('searchQuery');
      const page = parseInt(url.searchParams.get('page') || '1', 10);
      const limit = parseInt(url.searchParams.get('limit') || '10', 10);

      const { data, success, totalCount } = await getIntegrators({
        page,
        limit,
        sortField,
        sortOrder,
        searchQuery
      });

      return NextResponse.json({ data, success, totalCount });
    }

    if (action === 'chart') {
      const weeklyUserSignOnData = await getWeeklyUserSignOnData();
      return NextResponse.json({ success: true, data: weeklyUserSignOnData });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
};
