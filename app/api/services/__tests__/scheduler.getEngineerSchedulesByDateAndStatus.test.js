/**
 * Unit tests for getEngineerSchedulesByDateAndStatus
 *
 * Run with Jest (see repo README for setup instructions):
 *   npx jest app/api/services/__tests__/scheduler.getEngineerSchedulesByDateAndStatus.test.js
 */

// ── Mocks (must be declared before any imports) ──────────────────────────────

jest.mock('mongoose', () => ({
  isValidObjectId: jest.fn(),
}));

jest.mock('../../models/scheduler', () => ({
  __esModule: true,
  default: { find: jest.fn() },
}));

jest.mock('../../models/user', () => ({
  __esModule: true,
  default: { findById: jest.fn() },
}));

jest.mock('../../utils/logger', () => ({
  logger: { error: jest.fn() },
}));

jest.mock('@/utils/connectDb', () => ({
  mongoConnect: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('../../validator/user', () => ({
  schedulerValidator: jest.fn(),
}));

jest.mock('../../models/project', () => ({
  __esModule: true,
  default: {},
}));

// ── Imports (after mocks) ─────────────────────────────────────────────────────

import mongoose from 'mongoose';
import Scheduler from '../../models/scheduler';
import User from '../../models/user';
import { getEngineerSchedulesByDateAndStatus } from '../scheduler';

// ── Constants ─────────────────────────────────────────────────────────────────

const ENGINEER_OID = '507f1f77bcf86cd799439011';
const OTHER_OID    = '507f1f77bcf86cd799439012';
const INTEGRATOR_A = '607f1f77bcf86cd799439011';
const INTEGRATOR_B = '607f1f77bcf86cd799439012';

/**
 * Build a thenable-and-chainable mock for Mongoose query chains like:
 *   Scheduler.find(query).populate(...).populate(...).populate(...)
 *
 * Because each .populate() returns `chain` (which is a thenable), awaiting
 * the final expression resolves to `result`.
 */
const buildQueryChain = (result = []) => {
  const chain = {
    populate: jest.fn(),
    then: (resolve) => Promise.resolve(result).then(resolve),
    catch: (reject) => Promise.resolve(result).catch(reject),
  };
  chain.populate.mockReturnValue(chain);
  return chain;
};

// ── Helper: allow a valid ObjectId by default ─────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  mongoose.isValidObjectId.mockReturnValue(true);
});

// ─────────────────────────────────────────────────────────────────────────────
// Input validation
// ─────────────────────────────────────────────────────────────────────────────

describe('getEngineerSchedulesByDateAndStatus – validation', () => {
  test('throws 400 when engineerId is missing', async () => {
    await expect(
      getEngineerSchedulesByDateAndStatus({ engineerId: undefined })
    ).rejects.toMatchObject({ message: 'engineerId is required', statusCode: 400 });
  });

  test('throws 400 when engineerId is not a valid ObjectId', async () => {
    mongoose.isValidObjectId.mockReturnValue(false);
    await expect(
      getEngineerSchedulesByDateAndStatus({ engineerId: 'bad-id' })
    ).rejects.toMatchObject({ message: 'Invalid engineerId', statusCode: 400 });
  });

  test('throws 400 when date format is invalid', async () => {
    await expect(
      getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, date: '25-05-2026' })
    ).rejects.toMatchObject({ message: 'Invalid date format. Use YYYY-MM-DD', statusCode: 400 });
  });

  test('throws 400 when date is a plain string without dashes', async () => {
    await expect(
      getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, date: '20260525' })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Security
// ─────────────────────────────────────────────────────────────────────────────

describe('getEngineerSchedulesByDateAndStatus – security', () => {
  test('engineer cannot fetch another engineer\'s schedules (403)', async () => {
    const actor = { role: 'engineer', userId: OTHER_OID };
    await expect(
      getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, actor })
    ).rejects.toMatchObject({ message: 'Unauthorized', statusCode: 403 });
  });

  test('engineer can fetch their own schedules', async () => {
    const actor = { role: 'engineer', userId: ENGINEER_OID };
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    const result = await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, actor });
    expect(result).toEqual({ data: [] });
  });

  test('integrator cannot fetch engineer outside their integrator (403)', async () => {
    const actor = { role: 'integrator', integratorId: INTEGRATOR_A };
    // engineer belongs to INTEGRATOR_B
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ integrator: INTEGRATOR_B }) });

    await expect(
      getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, actor })
    ).rejects.toMatchObject({ message: 'Unauthorized', statusCode: 403 });
  });

  test('integrator throws 403 when engineer is not found', async () => {
    const actor = { role: 'integrator', integratorId: INTEGRATOR_A };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue(null) });

    await expect(
      getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, actor })
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('integrator can fetch engineer within their integrator', async () => {
    const actor = { role: 'integrator', integratorId: INTEGRATOR_A };
    User.findById.mockReturnValue({ select: jest.fn().mockResolvedValue({ integrator: INTEGRATOR_A }) });
    const mockData = [{ title: 'Fix pipes', status: 'Accepted' }];
    Scheduler.find.mockReturnValue(buildQueryChain(mockData));

    const result = await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, actor });
    expect(result).toEqual({ data: mockData });
  });

  test('admin can fetch any engineer\'s schedules', async () => {
    const actor = { role: 'admin' };
    const mockData = [{ title: 'Admin view' }];
    Scheduler.find.mockReturnValue(buildQueryChain(mockData));

    const result = await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, actor });
    expect(result).toEqual({ data: mockData });
  });

  test('unknown role throws 403', async () => {
    const actor = { role: 'unknown' };
    await expect(
      getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, actor })
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Query building – engineer only (no filters)
// ─────────────────────────────────────────────────────────────────────────────

describe('getEngineerSchedulesByDateAndStatus – filter: engineer only', () => {
  test('queries only by engineer when no date or status given', async () => {
    const mockData = [{ title: 'Schedule 1' }];
    Scheduler.find.mockReturnValue(buildQueryChain(mockData));

    const result = await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID });

    expect(Scheduler.find).toHaveBeenCalledWith({ engineer: ENGINEER_OID });
    expect(result).toEqual({ data: mockData });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Query building – date filter
// ─────────────────────────────────────────────────────────────────────────────

describe('getEngineerSchedulesByDateAndStatus – filter: date', () => {
  test('adds startDate/endDate range for the selected day', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, date: '2026-05-25' });

    expect(Scheduler.find).toHaveBeenCalledWith({
      engineer: ENGINEER_OID,
      startDate: { $lte: new Date('2026-05-25T23:59:59.999Z') },
      endDate:   { $gte: new Date('2026-05-25T00:00:00.000Z') },
    });
  });

  test('returns schedules that overlap the selected date', async () => {
    const mockData = [{ title: 'Overlapping schedule', startDate: '2026-05-24', endDate: '2026-05-26' }];
    Scheduler.find.mockReturnValue(buildQueryChain(mockData));

    const result = await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, date: '2026-05-25' });
    expect(result.data).toHaveLength(1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Query building – status filter
// ─────────────────────────────────────────────────────────────────────────────

describe('getEngineerSchedulesByDateAndStatus – filter: status', () => {
  test('filters by a single status string', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, status: 'Accepted' });

    expect(Scheduler.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: { $in: ['Accepted'] } })
    );
  });

  test('filters by comma-delimited status string', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, status: 'Accepted,ReadyToStart' });

    expect(Scheduler.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: { $in: expect.arrayContaining(['Accepted', 'ReadyToStart']) } })
    );
  });

  test('filters by an array of statuses', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, status: ['Accepted', 'Paid'] });

    expect(Scheduler.find).toHaveBeenCalledWith(
      expect.objectContaining({ status: { $in: expect.arrayContaining(['Accepted', 'Paid']) } })
    );
  });

  test('legacy alias "Progress" expands to both Progress and InProgress', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, status: 'Progress' });

    const callArg = Scheduler.find.mock.calls[0][0];
    expect(callArg.status.$in).toEqual(expect.arrayContaining(['Progress', 'InProgress']));
  });

  test('legacy alias "Ready" expands to both Ready and ReadyToStart', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, status: 'Ready' });

    const callArg = Scheduler.find.mock.calls[0][0];
    expect(callArg.status.$in).toEqual(expect.arrayContaining(['Ready', 'ReadyToStart']));
  });

  test('deduplicates when canonical form is already included alongside alias', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    // Both "Progress" and "InProgress" supplied – result should have no duplicates
    await getEngineerSchedulesByDateAndStatus({
      engineerId: ENGINEER_OID,
      status: 'Progress,InProgress',
    });

    const callArg = Scheduler.find.mock.calls[0][0];
    const inArray = callArg.status.$in;
    const unique = [...new Set(inArray)];
    expect(inArray).toHaveLength(unique.length);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Combined date + status filter
// ─────────────────────────────────────────────────────────────────────────────

describe('getEngineerSchedulesByDateAndStatus – filter: date + status combined', () => {
  test('applies both date range and status filter together', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByDateAndStatus({
      engineerId: ENGINEER_OID,
      date: '2026-05-25',
      status: 'Accepted,Approved',
    });

    expect(Scheduler.find).toHaveBeenCalledWith({
      engineer:  ENGINEER_OID,
      startDate: { $lte: new Date('2026-05-25T23:59:59.999Z') },
      endDate:   { $gte: new Date('2026-05-25T00:00:00.000Z') },
      status:    { $in: expect.arrayContaining(['Accepted', 'Approved']) },
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// No actor (unauthenticated / internal call)
// ─────────────────────────────────────────────────────────────────────────────

describe('getEngineerSchedulesByDateAndStatus – no actor', () => {
  test('skips security check when actor is null', async () => {
    const mockData = [{ title: 'Internal call' }];
    Scheduler.find.mockReturnValue(buildQueryChain(mockData));

    const result = await getEngineerSchedulesByDateAndStatus({ engineerId: ENGINEER_OID, actor: null });
    expect(result).toEqual({ data: mockData });
  });
});
