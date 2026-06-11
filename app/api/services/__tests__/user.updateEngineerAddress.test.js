/**
 * Unit tests for updateEngineerAddress
 */

jest.mock('../../models/user', () => ({
  __esModule: true,
  default: {
    findOneAndUpdate: jest.fn()
  }
}));

jest.mock('../../utils/logger', () => ({
  logger: { error: jest.fn() }
}));

jest.mock('@/utils/connectDb', () => ({
  mongoConnect: jest.fn().mockResolvedValue(undefined)
}));

jest.mock('../../validator/user', () => ({
  userValidator: jest.fn(),
  userEditValidator: jest.fn()
}));

jest.mock('../../utils/helps', () => ({
  isValidObjectId: jest.fn(),
  generatePassword: jest.fn()
}));

import User from '../../models/user';
import { isValidObjectId } from '../../utils/helps';
import { updateEngineerAddress } from '../user';

const USER_ID = '507f1f77bcf86cd799439011';
const OTHER_USER_ID = '507f1f77bcf86cd799439012';

beforeEach(() => {
  jest.clearAllMocks();
  isValidObjectId.mockReturnValue(true);
  User.findOneAndUpdate.mockResolvedValue({
    _id: USER_ID,
    address: {
      addressLine1: '10 Oxford Street',
      town: 'London'
    },
    email: 'engineer@example.com'
  });
});

describe('updateEngineerAddress validation', () => {
  test('invalid ObjectId rejected', async () => {
    isValidObjectId.mockReturnValue(false);

    await expect(
      updateEngineerAddress({
        userId: 'bad-id',
        address: { town: 'London' },
        actor: { role: 'engineer', id: USER_ID }
      })
    ).rejects.toMatchObject({ message: 'Invalid userId', statusCode: 400 });
  });

  test('requires address', async () => {
    await expect(
      updateEngineerAddress({
        userId: USER_ID,
        actor: { role: 'engineer', id: USER_ID }
      })
    ).rejects.toMatchObject({ message: 'address is required', statusCode: 400 });
  });

  test('address must be an object', async () => {
    await expect(
      updateEngineerAddress({
        userId: USER_ID,
        address: 'London',
        actor: { role: 'engineer', id: USER_ID }
      })
    ).rejects.toMatchObject({ message: 'address must be an object', statusCode: 400 });
  });

  test('disallowed fields ignored/rejected', async () => {
    await expect(
      updateEngineerAddress({
        userId: USER_ID,
        address: { email: 'hacker@example.com' },
        actor: { role: 'engineer', id: USER_ID }
      })
    ).rejects.toMatchObject({ message: 'Field email is not allowed', statusCode: 400 });
  });
});

describe('updateEngineerAddress security', () => {
  test('guest blocked', async () => {
    await expect(
      updateEngineerAddress({
        userId: USER_ID,
        address: { town: 'London' },
        actor: { role: 'guest', id: USER_ID }
      })
    ).rejects.toMatchObject({ message: 'Unauthorized', statusCode: 403 });
  });

  test('engineer blocked from updating another user', async () => {
    await expect(
      updateEngineerAddress({
        userId: USER_ID,
        address: { town: 'London' },
        actor: { role: 'engineer', id: OTHER_USER_ID }
      })
    ).rejects.toMatchObject({ message: 'Unauthorized', statusCode: 403 });
  });

  test('engineer updates own address', async () => {
    const result = await updateEngineerAddress({
      userId: USER_ID,
      address: { town: 'London' },
      actor: { role: 'engineer', id: USER_ID }
    });

    expect(result._id).toBe(USER_ID);
    expect(User.findOneAndUpdate).toHaveBeenCalled();
  });

  test('admin allowed', async () => {
    await updateEngineerAddress({
      userId: USER_ID,
      address: { town: 'London' },
      actor: { role: 'admin', id: OTHER_USER_ID }
    });

    expect(User.findOneAndUpdate).toHaveBeenCalled();
  });
});

describe('updateEngineerAddress update behavior', () => {
  test('partial address update works', async () => {
    await updateEngineerAddress({
      userId: USER_ID,
      address: { town: 'London', postcode: 'SW1A 1AA' },
      actor: { role: 'engineer', id: USER_ID }
    });

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: USER_ID },
      {
        $set: {
          'address.town': 'London',
          'address.postcode': 'SW1A 1AA'
        }
      },
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  test('location coordinates update works', async () => {
    await updateEngineerAddress({
      userId: USER_ID,
      address: {
        location: {
          coordinates: [-0.1276, 51.5072]
        }
      },
      actor: { role: 'engineer', id: USER_ID }
    });

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: USER_ID },
      {
        $set: {
          'address.location.type': 'Point',
          'address.location.coordinates': [-0.1276, 51.5072]
        }
      },
      expect.objectContaining({ new: true, runValidators: true })
    );
  });

  test('non-address fields unchanged', async () => {
    const result = await updateEngineerAddress({
      userId: USER_ID,
      address: { town: 'Manchester' },
      actor: { role: 'engineer', id: USER_ID }
    });

    expect(User.findOneAndUpdate).toHaveBeenCalledWith(
      { _id: USER_ID },
      {
        $set: {
          'address.town': 'Manchester'
        }
      },
      expect.objectContaining({ projection: { address: 1 } })
    );
    expect(result.email).toBe('engineer@example.com');
  });

  test('rejects invalid location coordinates', async () => {
    await expect(
      updateEngineerAddress({
        userId: USER_ID,
        address: {
          location: {
            coordinates: ['lng', 'lat']
          }
        },
        actor: { role: 'engineer', id: USER_ID }
      })
    ).rejects.toMatchObject({
      message: 'address.location.coordinates must contain only numbers',
      statusCode: 400
    });
  });
});
