import { renderHook } from '@testing-library/react-hooks';
import { act } from 'react';
import { useIntegratorChat } from '../useChat';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';

// Mock Firebase Firestore methods
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  Timestamp: {
    now: jest.fn()
  }
}));

describe('useIntegratorChat Hook', () => {
  const mockIntegratorId = 'integrator123';

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    jest.useFakeTimers(); // Use fake timers to handle async operations
  });

  afterEach(() => {
    jest.useRealTimers(); // Restore real timers after each test
  });

  test('initial state is correct', () => {
    const { result } = renderHook(() => useIntegratorChat(mockIntegratorId));

    expect(result.current.chats).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.success).toBe(false);
    expect(result.current.error).toBe(null);
  });

  describe('useIntegratorChat', () => {
    const mockIntegratorId = 'integrator123';
  
    beforeEach(() => {
      jest.clearAllMocks();
    });
  
    test('fetches integrator rooms on mount', async () => {
      const mockChatRooms = [
        { 
          id: 'room1', 
          name: 'Test Room', 
          integratorIds: ['integrator123', 'integrator456'],
          isIntegratorRoom: true 
        }
      ];
  
      // Mock return of Firestore functions
      getDocs.mockResolvedValueOnce({
        docs: mockChatRooms.map(room => ({
          id: room.id,
          data: () => room
        }))
      });
  
      query.mockImplementation(() => 'mock-query');
      collection.mockImplementation(() => 'mock-collection');
      where.mockImplementation((...args) => args.join('-'));
  
      const { result, waitForNextUpdate } = renderHook(() => useIntegratorChat(mockIntegratorId));
  
      await waitForNextUpdate(); // waits for useEffect to finish
  
      expect(query).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.anything()
      );
  
      expect(result.current.chats).toEqual(mockChatRooms);
      expect(result.current.error).toBe(null);
    });
  });

  test('creates new integrator chat room successfully', async () => {
    // Mock getDocs to return empty result (no existing room)
    getDocs.mockResolvedValue({ empty: true });

    // Mock addDoc to simulate successful document creation
    addDoc.mockResolvedValue({ id: 'newRoomId' });

    const { result } = renderHook(() => useIntegratorChat(mockIntegratorId));

    await act(async () => {
      const success = await result.current.handleNewIntegratorChatRoom(
        ['integrator123', 'integrator456'], 
        'New Test Room'
      );

      expect(success).toBe(true);
      expect(result.current.success).toBe(true);
      expect(result.current.error).toBe(null);
    });
  });

  test('prevents creating duplicate integrator chat room', async () => {
    // Mock getDocs to return non-empty result (room already exists)
    getDocs.mockResolvedValue({ empty: false });

    const { result } = renderHook(() => useIntegratorChat(mockIntegratorId));

    await act(async () => {
      const success = await result.current.handleNewIntegratorChatRoom(
        ['integrator123', 'integrator456'], 
        'Duplicate Room'
      );

      expect(success).toBe(false);
      expect(result.current.error).toBe('Room already exists:');
    });
  });

  test('handles error when creating integrator chat room fails', async () => {
    // Mock addDoc to throw an error
    addDoc.mockRejectedValue(new Error('Firestore error'));

    const { result } = renderHook(() => useIntegratorChat(mockIntegratorId));

    await act(async () => {
      await result.current.handleNewIntegratorChatRoom(
        ['integrator123', 'integrator456'], 
        'Error Room'
      );

      expect(result.current.error).toBe('Room already exists:');
    });
  });

  test('handles error when fetching integrator rooms fails', async () => {
    // Mock getDocs to throw an error
    getDocs.mockRejectedValue(new Error('Fetch error'));

    const { result, waitForNextUpdate } = renderHook(() => useIntegratorChat(mockIntegratorId));

    await waitForNextUpdate();

    expect(result.current.error).toBe('Failed to fetch integrator rooms');
    expect(result.current.chats).toEqual([]);
  });
});