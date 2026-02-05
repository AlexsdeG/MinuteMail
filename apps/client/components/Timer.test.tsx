import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Timer from './Timer';

describe('Timer Component', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders correctly with time remaining', () => {
    const futureDate = new Date(Date.now() + 65000).toISOString(); // 1 min 5 sec
    render(<Timer expiresAt={futureDate} />);
    
    // Should show roughly 01:05
    expect(screen.getByText('01:05')).toBeInTheDocument();
  });

  it('counts down', () => {
    const futureDate = new Date(Date.now() + 10000).toISOString(); // 10 sec
    render(<Timer expiresAt={futureDate} />);

    expect(screen.getByText('00:10')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(screen.getByText('00:08')).toBeInTheDocument();
  });

  it('calls onExpire when time runs out', () => {
    const onExpireMock = vi.fn();
    const futureDate = new Date(Date.now() + 2000).toISOString(); // 2 sec
    render(<Timer expiresAt={futureDate} onExpire={onExpireMock} />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(onExpireMock).toHaveBeenCalledTimes(1);
    expect(screen.getByText('00:00')).toBeInTheDocument();
  });
});
