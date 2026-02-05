import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Home from './Home';
import api from '../api/axios';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../api/axios', () => ({
  default: {
    post: vi.fn(),
  }
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Home Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('generates guest alias on button click', async () => {
    const mockAlias = {
      id: '123',
      address: 'guest@test.com',
      expiresAt: new Date().toISOString(),
      isActive: true
    };
    (api.post as any).mockResolvedValue({ data: mockAlias });

    render(
      <BrowserRouter>
        <Home />
      </BrowserRouter>
    );

    const createButton = screen.getByText(/Create Temporary Email/i);
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/aliases');
      expect(localStorage.getItem('guest_alias')).toContain('guest@test.com');
      expect(mockNavigate).toHaveBeenCalledWith('/inbox/123');
    });
  });
});
