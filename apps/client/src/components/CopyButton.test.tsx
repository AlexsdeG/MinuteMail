import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import CopyButton from './CopyButton';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn(),
  },
});

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  }
}));

describe('CopyButton Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders copy icon initially', () => {
    render(<CopyButton text="copy me" />);
    // Copy icon is usually represented by the button or aria-label, 
    // but since we are using lucide icons without aria labels in the code yet, 
    // we can check if button is present.
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('copies text to clipboard on click', async () => {
    render(<CopyButton text="secret text" />);
    const button = screen.getByRole('button');
    
    fireEvent.click(button);
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('secret text');
  });

  it('shows success toast on copy', async () => {
    (navigator.clipboard.writeText as any).mockResolvedValue(undefined);
    render(<CopyButton text="test" />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      // Import the mock to check calls
      const toast = require('react-hot-toast').default;
      expect(toast.success).toHaveBeenCalledWith("Copied to clipboard!");
    });
  });

  it('shows error toast on failure', async () => {
    (navigator.clipboard.writeText as any).mockRejectedValue(new Error('Fail'));
    render(<CopyButton text="test" />);
    
    fireEvent.click(screen.getByRole('button'));
    
    await waitFor(() => {
      const toast = require('react-hot-toast').default;
      expect(toast.error).toHaveBeenCalledWith("Failed to copy");
    });
  });
});
