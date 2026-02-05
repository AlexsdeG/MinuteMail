import React, { useEffect, useState } from 'react';
import { cn } from '../utils/cn';
import { formatTimeRemaining, calculateTimerProgress } from '../utils/format';

interface CircularProgressTimerProps {
  expiresAt: string;
  createdAt?: string;
  totalDurationMs?: number;
  size?: 'sm' | 'md' | 'lg';
  onExpire?: () => void;
  className?: string;
}

const sizes = {
  sm: { svg: 48, stroke: 4, fontSize: 'text-xs' },
  md: { svg: 64, stroke: 5, fontSize: 'text-sm' },
  lg: { svg: 80, stroke: 6, fontSize: 'text-base' },
};

const CircularProgressTimer: React.FC<CircularProgressTimerProps> = ({
  expiresAt,
  createdAt,
  totalDurationMs,
  size = 'md',
  onExpire,
  className,
}) => {
  const [timeLeft, setTimeLeft] = useState(() => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    return diff > 0 ? diff : 0;
  });

  const [progress, setProgress] = useState(() =>
    calculateTimerProgress(expiresAt, createdAt, totalDurationMs)
  );

  useEffect(() => {
    const updateTimer = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft(0);
        setProgress(0);
        onExpire?.();
        return false;
      }
      setTimeLeft(diff);
      setProgress(calculateTimerProgress(expiresAt, createdAt, totalDurationMs));
      return true;
    };

    // Initial update
    if (!updateTimer()) return;

    const timer = setInterval(() => {
      if (!updateTimer()) {
        clearInterval(timer);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, createdAt, totalDurationMs, onExpire]);

  const { svg: svgSize, stroke: strokeWidth, fontSize } = sizes[size];
  const radius = (svgSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  const isUrgent = timeLeft < 60 * 60 * 1000; // Less than 1 hour
  const isCritical = timeLeft < 10 * 60 * 1000; // Less than 10 minutes

  const progressColor = isCritical
    ? 'stroke-red-500'
    : isUrgent
    ? 'stroke-amber-500'
    : 'stroke-blue-500';

  return (
    <div className={cn('relative inline-flex items-center justify-center', className)}>
      <svg
        width={svgSize}
        height={svgSize}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          className="stroke-slate-200"
        />
        {/* Progress circle */}
        <circle
          cx={svgSize / 2}
          cy={svgSize / 2}
          r={radius}
          fill="none"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            'transition-all duration-1000 ease-linear',
            progressColor,
            isCritical && 'animate-pulse'
          )}
        />
      </svg>
      {/* Time text */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center font-mono font-medium',
          fontSize,
          isCritical ? 'text-red-600' : isUrgent ? 'text-amber-600' : 'text-slate-700'
        )}
      >
        {formatTimeRemaining(timeLeft, true)}
      </div>
    </div>
  );
};

export default CircularProgressTimer;
