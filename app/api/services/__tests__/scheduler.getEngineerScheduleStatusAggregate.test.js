/**
 * Unit tests for getEngineerScheduleStatusAggregate
 */

const createObjectId = (value) => ({
  _mockObjectId: value,
  toString: () => value
});

jest.mock('mongoose', () => ({
  isValidObjectId: jest.fn(),
  Types: {
    ObjectId: jest.fn((value) => createObjectId(value))
  }
}));

jest.mock('../../models/scheduler', () => ({
  __esModule: true,
  default: {
    aggregate: jest.fn(),
    find: jest.fn(),
    countDocuments: jest.fn()
  }
}));

jest.mock('../../models/user', () => ({
  __esModule: true,
  default: { findById: jest.fn() }
}));

jest.mock('../../utils/logger', () => ({
  logger: { error: jest.fn() }
}));

jest.mock('@/utils/connectDb', () => ({
  mongoConnect: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../validator/user', () => ({
  schedulerValidator: jest.fn()
}));

jest.mock('../../models/project', () => ({
  __esModule: true,
  default: {}
}));

import mongoose from 'mongoose';
import Scheduler from '../../models/scheduler';
import User from '../../models/user';
import { getEngineerScheduleStatusAggregate } from '../scheduler';

const ENGINEER_ID = '507f1f77bcf86cd799439011';
const OTHER_ENGINEER_ID = '507f1f77bcf86cd799439012';
const INTEGRATOR_A = '607f1f77bcf86cd799439011';
const INTEGRATOR_B = '607f1f77bcf86cd799439012';

const mockSelect = (value) => ({
  select: jest.fn().mockResolvedValue(value)
});

const sampleFindChain = (rows = []) => ({
  limit: jest.fn().mockResolvedValue(rows)
});

beforeEach(() => {
  jest.clearAllMocks();
  mongoose.isValidObjectId.mockReturnValue(true);
  mongoose.Types.ObjectId.isValid = jest.fn().mockReturnValue(true);
  Scheduler.countDocuments.mockResolvedValue(0);
  Scheduler.find.mockReturnValue(sampleFindChain([]));
  Scheduler.aggregate.mockResolvedValue([]);
});

describe('getEngineerScheduleStatusAggregate validation', () => {
  test('requires engineerId', async () => {
    await expect(getEngineerScheduleStatusAggregate({})).rejects.toMatchObject({
      message: 'engineerId is required',
      statusCode: 400
    });
  });

  test('validates engineerId format', async () => {
    mongoose.isValidObjectId.mockReturnValue(false);

    await expect(
      getEngineerScheduleStatusAggregate({ engineerId: 'bad-id' })
    ).rejects.toMatchObject({ message: 'Invalid engineerId', statusCode: 400 });
  });

  test('validates date format', async () => {
    await expect(
      getEngineerScheduleStatusAggregate({ engineerId: ENGINEER_ID, date: '2026/05/27' })
    ).rejects.toMatchObject({
      message: 'Invalid date format. Use YYYY-MM-DD',
      statusCode: 400
    });
  });
});

describe('getEngineerScheduleStatusAggregate security', () => {
  test('blocks engineer from fetching another engineer aggregate', async () => {
    await expect(
      getEngineerScheduleStatusAggregate({
        engineerId: ENGINEER_ID,
        actor: { role: 'engineer', userId: OTHER_ENGINEER_ID }
      })
    ).rejects.toMatchObject({ message: 'Unauthorized', statusCode: 403 });
  });

  test('allows engineer to fetch their own aggregate', async () => {
    await getEngineerScheduleStatusAggregate({
      engineerId: ENGINEER_ID,
      actor: { role: 'engineer', userId: ENGINEER_ID }
    });

    expect(Scheduler.aggregate).toHaveBeenCalled();
  });

  test('blocks integrator from external engineer', async () => {
    User.findById.mockReturnValue(mockSelect({ integrator: INTEGRATOR_B }));

    await expect(
      getEngineerScheduleStatusAggregate({
        engineerId: ENGINEER_ID,
        actor: { role: 'integrator', integratorId: INTEGRATOR_A }
      })
    ).rejects.toMatchObject({ message: 'Unauthorized', statusCode: 403 });
  });

  test('allows integrator for their own engineer', async () => {
    User.findById.mockReturnValue(mockSelect({ integrator: INTEGRATOR_A }));

    await getEngineerScheduleStatusAggregate({
      engineerId: ENGINEER_ID,
      actor: { role: 'integrator', integratorId: INTEGRATOR_A }
    });

    expect(User.findById).toHaveBeenCalledWith(ENGINEER_ID);
    expect(Scheduler.aggregate).toHaveBeenCalled();
  });
});

describe('getEngineerScheduleStatusAggregate query and aggregation', () => {
  test('uses ObjectId for engineer match', async () => {
    await getEngineerScheduleStatusAggregate({ engineerId: ENGINEER_ID });

    const pipeline = Scheduler.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match.engineer).toEqual(createObjectId(ENGINEER_ID));
  });

  test('no date filter returns all schedules', async () => {
    await getEngineerScheduleStatusAggregate({ engineerId: ENGINEER_ID });

    const pipeline = Scheduler.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match.startDate).toBeUndefined();
    expect(pipeline[0].$match.endDate).toBeUndefined();
  });

  test('date filter returns only overlapping schedules', async () => {
    await getEngineerScheduleStatusAggregate({ engineerId: ENGINEER_ID, date: '2026-05-27' });

    const match = Scheduler.aggregate.mock.calls[0][0][0].$match;
    expect(match.startDate.$lte.toISOString()).toBe('2026-05-27T23:59:59.999Z');
    expect(match.endDate.$gte.toISOString()).toBe('2026-05-27T00:00:00.000Z');
  });

  test('aggregate returns counts for existing engineer schedules', async () => {
    Scheduler.aggregate.mockResolvedValue([
      { _id: 'Pending', count: 13 },
      { _id: 'Accepted', count: 8 }
    ]);

    const result = await getEngineerScheduleStatusAggregate({ engineerId: ENGINEER_ID });

    expect(result.total).toBe(21);
    expect(result.byStatus.Pending).toBe(13);
    expect(result.byStatus.Accepted).toBe(8);
  });

  test('Accepted and Pending are counted correctly when filtered', async () => {
    Scheduler.aggregate.mockResolvedValue([
      { _id: 'Pending', count: 2 },
      { _id: 'Accepted', count: 4 },
      { _id: 'Approved', count: 1 }
    ]);

    const result = await getEngineerScheduleStatusAggregate({
      engineerId: ENGINEER_ID,
      statuses: 'Pending,Accepted'
    });

    expect(result.total).toBe(6);
    expect(result.byStatus.Pending).toBe(2);
    expect(result.byStatus.Accepted).toBe(4);
    expect(result.byStatus.Approved).toBeUndefined();
  });

  test('Progress and In Progress normalize to InProgress', async () => {
    Scheduler.aggregate.mockResolvedValue([
      { _id: 'Progress', count: 2 },
      { _id: 'In Progress', count: 1 },
      { _id: 'inprogress', count: 3 }
    ]);

    const result = await getEngineerScheduleStatusAggregate({ engineerId: ENGINEER_ID });

    expect(result.byStatus.InProgress).toBe(6);
  });

  test('Ready and ReadyToStart normalize to ReadyToStart', async () => {
    Scheduler.aggregate.mockResolvedValue([
      { _id: 'Ready', count: 1 },
      { _id: 'readytostart', count: 2 }
    ]);

    const result = await getEngineerScheduleStatusAggregate({ engineerId: ENGINEER_ID });

    expect(result.byStatus.ReadyToStart).toBe(3);
  });

  test('requested status filter is applied to the aggregate match', async () => {
    await getEngineerScheduleStatusAggregate({
      engineerId: ENGINEER_ID,
      statuses: 'Progress,Ready,Pending'
    });

    const match = Scheduler.aggregate.mock.calls[0][0][0].$match;
    expect(match.status.$in).toEqual(
      expect.arrayContaining(['Progress', 'InProgress', 'Ready', 'ReadyToStart', 'Pending'])
    );
  });
});
