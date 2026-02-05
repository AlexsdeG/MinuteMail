import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthProvider, useAuth } from './AuthContext';
import api from '../api/axios';

// Mock axios
vi.mock('../api/axios', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
      create: vi.fn(() => ({
        interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
        }
      })),
      interceptors: {
          request: { use: vi.fn() },
          response: { use: vi.fn() }
      }
    }
  };
});

const TestComponent = () => {
  const { user, login, logout } = useAuth();
  return (
    <div>
      <div data-testid="user-email">{user?.email || 'No User'}</div>
      <button onClick={() => login('test@example.com', 'password')}>Login</button>
      <button onClick={logout}>Logout</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('initializes with no user', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );
    expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
  });

  it('logs in successfully', async () => {
    const mockUser = { id: '1', email: 'test@example.com' };
    (api.post as any).mockResolvedValue({
      data: { accessToken: 'fake-token', user: mockUser }
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const loginButton = screen.getByText('Login');
    await act(async () => {
      loginButton.click();
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', { email: 'test@example.com', password: 'password' });
    expect(localStorage.getItem('token')).toBe('fake-token');
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  it('checks auth on mount if token exists', async () => {
    localStorage.setItem('token', 'existing-token');
    const mockUser = { id: '2', email: 'stored@example.com' };
    (api.get as any).mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/auth/profile');
      expect(screen.getByTestId('user-email')).toHaveTextContent('stored@example.com');
    });
  });

  it('logs out successfully', async () => {
     // Setup initial logged in state
     localStorage.setItem('token', 'token');
     const mockUser = { id: '1', email: 'user@example.com' };
     (api.get as any).mockResolvedValue({ data: mockUser });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => expect(screen.getByTestId('user-email')).toHaveTextContent('user@example.com'));

    const logoutButton = screen.getByText('Logout');
    act(() => {
      logoutButton.click();
    });

    expect(localStorage.getItem('token')).toBeNull();
    expect(screen.getByTestId('user-email')).toHaveTextContent('No User');
  });
});
