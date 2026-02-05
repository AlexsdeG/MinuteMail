import { renderHook } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useSocket } from './useSocket';
import { io } from 'socket.io-client';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

describe('useSocket Hook', () => {
  let socketMock: any;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup mock socket instance
    socketMock = {
      emit: vi.fn(),
      on: vi.fn(),
      disconnect: vi.fn(),
    };
    
    (io as any).mockReturnValue(socketMock);
  });

  it('connects and joins room on mount', () => {
    const aliasId = 'test-alias-123';
    const callback = vi.fn();
    
    renderHook(() => useSocket(aliasId, callback));

    // Should initialize io
    expect(io).toHaveBeenCalled();
    
    // Simulate 'connect' event to trigger join_room
    const connectHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'connect')?.[1];
    expect(connectHandler).toBeDefined();
    
    if (connectHandler) {
      connectHandler();
      expect(socketMock.emit).toHaveBeenCalledWith('join_room', { aliasId });
    }
  });

  it('does not connect if aliasId is undefined', () => {
    renderHook(() => useSocket(undefined, vi.fn()));
    expect(io).not.toHaveBeenCalled();
  });

  it('listens for email_received events', () => {
    const callback = vi.fn();
    renderHook(() => useSocket('123', callback));

    // Check if event listener was registered
    const emailHandler = socketMock.on.mock.calls.find((call: any[]) => call[0] === 'email_received')?.[1];
    expect(emailHandler).toBeDefined();

    // Simulate receiving an email
    const mockEmail = { id: '1', subject: 'Test' };
    if (emailHandler) {
      emailHandler(mockEmail);
      expect(callback).toHaveBeenCalledWith(mockEmail);
    }
  });

  it('disconnects on unmount', () => {
    const { unmount } = renderHook(() => useSocket('123', vi.fn()));
    unmount();
    expect(socketMock.disconnect).toHaveBeenCalled();
  });
});
