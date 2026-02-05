import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../utils/cn';
import { formatTimeRemaining } from '../utils/format';

interface TimerProps {
  expiresAt: string;
  onExpire?: () => void;
  className?: string;
}

const Timer: React.FC<TimerProps> = ({ expiresAt, onExpire, className }) => {
  const calculateTimeLeft = () => {
    const difference = new Date(expiresAt).getTime() - new Date().getTime();
    return difference > 0 ? difference : 0;
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    // Immediate check
    const initialTime = calculateTimeLeft();
    setTimeLeft(initialTime);
    
    if (initialTime <= 0) {
      if (onExpire) onExpire();
      return;
    }

    const timer = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [expiresAt, onExpire]);

  const isUrgent = timeLeft < 60000; // Less than 1 minute

  return (
    <div className={cn(
      "flex items-center space-x-2 text-sm font-mono font-medium px-3 py-1.5 rounded-full bg-slate-100 text-slate-700",
      isUrgent && "bg-red-50 text-red-600 animate-pulse",
      className
    )}>
      <Clock className="h-4 w-4" />
      <span>{formatTimeRemaining(timeLeft)}</span>
    </div>
  );
};

export default Timer;
