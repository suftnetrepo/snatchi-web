/**
 * Unit tests for getEngineerSchedulesByStatus
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
    find: jest.fn()
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
import { getEngineerSchedulesByStatus } from '../scheduler';

const ENGINEER_ID = '507f1f77bcf86cd799439011';
const OTHER_ENGINEER_ID = '507f1f77bcf86cd799439012';
const INTEGRATOR_A = '607f1f77bcf86cd799439011';
const INTEGRATOR_B = '607f1f77bcf86cd799439012';

const buildQueryChain = (result = []) => {
  const chain = {
    sort: jest.fn(),
    populate: jest.fn(),
    then: (resolve) => Promise.resolve(result).then(resolve),
    catch: (reject) => Promise.resolve(result).catch(reject)
  };

  chain.sort.mockReturnValue(chain);
  chain.populate.mockReturnValue(chain);
  return chain;
};

const mockSelect = (value) => ({
  select: jest.fn().mockResolvedValue(value)
});

beforeEach(() => {
  jest.clearAllMocks();
  mongoose.isValidObjectId.mockReturnValue(true);
  Scheduler.find.mockReturnValue(buildQueryChain([]));
});

describe('getEngineerSchedulesByStatus validation', () => {
  test('rejects missing engineerId', async () => {
    await expect(getEngineerSchedulesByStatus({ status: 'Pending' })).rejects.toMatchObject({
      message: 'engineerId is required',
      statusCode: 400
    });
  });

  test('rejects invalid engineerId', async () => {
    mongoose.isValidObjectId.mockReturnValue(false);

    await expect(
      getEngineerSchedulesByStatus({ engineerId: 'bad-id', status: 'Pending' })
    ).rejects.toMatchObject({ message: 'Invalid engineerId', statusCode: 400 });
  });

  test('rejects missing status', async () => {
    await expect(
      getEngineerSchedulesByStatus({ engineerId: ENGINEER_ID })
    ).rejects.toMatchObject({ message: 'status is required', statusCode: 400 });
  });

  test('rejects comma-delimited status', async () => {
    await expect(
      getEngineerSchedulesByStatus({ engineerId: ENGINEER_ID, status: 'Pending,Accepted' })
    ).rejects.toMatchObject({ message: 'status must be a single value', statusCode: 400 });
  });
});

describe('getEngineerSchedulesByStatus security', () => {
  test('unauthorized engineer blocked', async () => {
    await expect(
      getEngineerSchedulesByStatus({
        engineerId: ENGINEER_ID,
        status: 'Pending',
        actor: { role: 'engineer', userId: OTHER_ENGINEER_ID }
      })
    ).rejects.toMatchObject({ message: 'Unauthorized', statusCode: 403 });
  });

  test('external integrator blocked', async () => {
    User.findById.mockReturnValue(mockSelect({ integrator: INTEGRATOR_B }));

    await expect(
      getEngineerSchedulesByStatus({
        engineerId: ENGINEER_ID,
        status: 'Pending',
        actor: { role: 'integrator', integratorId: INTEGRATOR_A }
      })
    ).rejects.toMatchObject({ message: 'Unauthorized', statusCode: 403 });
  });
});

describe('getEngineerSchedulesByStatus query behavior', () => {
  test('returns Pending schedules for engineer', async () => {
    const schedules = [{ _id: '1', status: 'Pending' }];
    Scheduler.find.mockReturnValue(buildQueryChain(schedules));

    const result = await getEngineerSchedulesByStatus({ engineerId: ENGINEER_ID, status: 'Pending' });

    expect(Scheduler.find).toHaveBeenCalledWith({
      engineer: createObjectId(ENGINEER_ID),
      status: 'Pending'
    });
    expect(result).toEqual({ data: schedules });
  });

  test('returns Accepted schedules for engineer', async () => {
    const schedules = [{ _id: '2', status: 'Accepted' }];
    Scheduler.find.mockReturnValue(buildQueryChain(schedules));

    const result = await getEngineerSchedulesByStatus({ engineerId: ENGINEER_ID, status: 'Accepted' });

    expect(Scheduler.find).toHaveBeenCalledWith({
      engineer: createObjectId(ENGINEER_ID),
      status: 'Accepted'
    });
    expect(result).toEqual({ data: schedules });
  });

  test('sorts by startDate ascending', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByStatus({ engineerId: ENGINEER_ID, status: 'Pending' });

    const chain = Scheduler.find.mock.results[0].value;
    expect(chain.sort).toHaveBeenCalledWith({ startDate: 1, startTime: 1 });
  });

  test('legacy status normalization works', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByStatus({ engineerId: ENGINEER_ID, status: 'In Progress' });

    expect(Scheduler.find).toHaveBeenCalledWith({
      engineer: createObjectId(ENGINEER_ID),
      status: 'InProgress'
    });
  });

  test('populates related references', async () => {
    Scheduler.find.mockReturnValue(buildQueryChain([]));

    await getEngineerSchedulesByStatus({ engineerId: ENGINEER_ID, status: 'Ready' });

    const chain = Scheduler.find.mock.results[0].value;
    expect(chain.populate).toHaveBeenNthCalledWith(1, 'engineer', 'first_name last_name email role secure_url integrator');
    expect(chain.populate).toHaveBeenNthCalledWith(2, 'project', 'name title location');
    expect(chain.populate).toHaveBeenNthCalledWith(3, 'payingIntegrator', 'name');
    expect(chain.populate).toHaveBeenNthCalledWith(
      4,
      'receivingIntegratorId',
      'name stripeConnectAccountId connectAccountStatus chargesEnabled payoutsEnabled'
    );
  });
});
