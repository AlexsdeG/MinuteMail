import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import EmailViewer from './EmailViewer';
import { Email } from '../types';

// Mock DOMPurify
// DOMPurify typically works in JSDOM, but we'll assume it's working as per previous tests.
// Mock URL.createObjectURL for download test
global.URL.createObjectURL = vi.fn(() => 'mock-url');
global.URL.revokeObjectURL = vi.fn();

const mockEmail: Email = {
  id: '1',
  aliasId: 'alias-1',
  sender: 'sender@example.com',
  subject: 'Test Subject',
  bodyText: 'Plain text content',
  bodyHtml: '<div>Safe Content</div>',
  receivedAt: new Date().toISOString()
};

describe('EmailViewer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders subject and sender', () => {
    render(<EmailViewer email={mockEmail} />);
    expect(screen.getByText('Test Subject')).toBeInTheDocument();
    expect(screen.getByText('sender@example.com')).toBeInTheDocument();
  });

  it('renders sanitized HTML content', () => {
    render(<EmailViewer email={mockEmail} />);
    expect(screen.getByText('Safe Content')).toBeInTheDocument();
  });

  it('calls onDelete when delete button clicked', () => {
    const onDelete = vi.fn();
    render(<EmailViewer email={mockEmail} onDelete={onDelete} />);
    
    // Find delete button (using title or icon logic, assume Title is best a11y)
    const deleteBtn = screen.getByTitle('Delete Email');
    fireEvent.click(deleteBtn);
    
    expect(onDelete).toHaveBeenCalledWith('1');
  });

  it('triggers download logic', () => {
    render(<EmailViewer email={mockEmail} />);
    const downloadBtn = screen.getByTitle('Download HTML');
    
    // Mock anchor click
    const linkSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click');
    
    fireEvent.click(downloadBtn);
    
    expect(global.URL.createObjectURL).toHaveBeenCalled();
    expect(linkSpy).toHaveBeenCalled();
  });
});
