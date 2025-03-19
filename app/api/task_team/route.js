import { logger } from '../utils/logger';
import { addOne, getAll, removeOne } from '../services/taskTeam';
const { NextResponse } = require('next/server');

export const POST = async (req) => {
  try {
    const userData = req.headers.get('x-user-data');
    const user = userData ? JSON.parse(userData) : null;
    const body = await req.json();
   
    const result = await addOne(body);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const GET = async (req) => {
  try {
    const userData = req.headers.get('x-user-data');
    const user = userData ? JSON.parse(userData) : null;
    const url = new URL(req.url);
    const projectId = url.searchParams.get('projectId');
    const taskId = url.searchParams.get('taskId');
  
    const result = await getAll(taskId, projectId);
    return NextResponse.json({ success: true, data: result }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export const DELETE = async (req) => {
  try {
    const userData = req.headers.get('x-user-data');
    const user = userData ? JSON.parse(userData) : null;
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const projectId = url.searchParams.get('projectId');
    const taskId = url.searchParams.get('taskId');
  
    const deleted = await removeOne(projectId, taskId, id);
    return NextResponse.json({ success: true, data: deleted }, { status: 200 });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
