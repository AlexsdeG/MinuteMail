import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import Dashboard from './Dashboard';
import api from '../api/axios';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies
vi.mock('../api/axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    patch: vi.fn(),
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

// Mock Timer to avoid complex interval logic in these tests
vi.mock('../components/Timer', () => ({
  default: () => <div data-testid="mock-timer">00:00</div>
}));

describe('Dashboard Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockAliases = [
    {
      id: '1',
      address: 'test1@example.com',
      expiresAt: new Date(Date.now() + 10000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString()
    },
    {
      id: '2',
      address: 'test2@example.com',
      expiresAt: new Date(Date.now() + 20000).toISOString(),
      isActive: true,
      createdAt: new Date().toISOString()
    }
  ];

  it('fetches and displays aliases on mount', async () => {
    (api.get as any).mockResolvedValue({ data: mockAliases });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    expect(screen.getByText('Loading aliases...')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('test1@example.com')).toBeInTheDocument();
      expect(screen.getByText('test2@example.com')).toBeInTheDocument();
    });
  });

  it('opens modal and creates new alias', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    (api.post as any).mockResolvedValue({ data: mockAliases[0] });

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    // Wait for initial load
    await waitFor(() => expect(screen.queryByText('Loading aliases...')).not.toBeInTheDocument());

    const newAliasBtn = screen.getByText('New Alias');
    fireEvent.click(newAliasBtn);

    expect(screen.getByText('Create New Alias')).toBeInTheDocument();

    const generateBtn = screen.getByText('Generate Alias');
    fireEvent.click(generateBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/aliases');
    });
  });

  it('handles delete alias flow', async () => {
    (api.get as any).mockResolvedValue({ data: [mockAliases[0]] });
    (api.delete as any).mockResolvedValue({});

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText('test1@example.com'));

    // Find delete button (Trash icon)
    const deleteBtn = screen.getByTitle('Delete');
    fireEvent.click(deleteBtn);

    // Modal should appear
    expect(screen.getByText('Delete Forever')).toBeInTheDocument();

    // Confirm delete
    fireEvent.click(screen.getByText('Delete Forever'));

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith('/aliases/1');
      // Optimistic update check: element should be gone
      expect(screen.queryByText('test1@example.com')).not.toBeInTheDocument();
    });
  });
  
  it('calls extend alias api', async () => {
    (api.get as any).mockResolvedValue({ data: [mockAliases[0]] });
    (api.patch as any).mockResolvedValue({});

    render(
      <BrowserRouter>
        <Dashboard />
      </BrowserRouter>
    );

    await waitFor(() => screen.getByText('test1@example.com'));

    const extendBtn = screen.getByTitle('Extend 1 Hour');
    fireEvent.click(extendBtn);

    await waitFor(() => {
       expect(api.patch).toHaveBeenCalledWith('/aliases/1/extend', { duration: 3600 });
    });
  });
});
