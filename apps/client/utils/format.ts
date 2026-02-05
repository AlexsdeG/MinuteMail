/**
 * Formats milliseconds into human-readable time format
 * @param ms - Time in milliseconds
 * @param showFull - If true, shows extended format with days/weeks
 */
export function formatTimeRemaining(ms: number, showFull = false): string {
  if (ms <= 0) return showFull ? 'Expired' : '00:00';
  
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);

  const pad = (num: number) => num.toString().padStart(2, '0');

  if (showFull) {
    if (weeks > 0) {
      const remainingDays = days % 7;
      return remainingDays > 0 ? `${weeks}w ${remainingDays}d` : `${weeks}w`;
    }
    if (days > 0) {
      const remainingHours = hours % 24;
      return remainingHours > 0 ? `${days}d ${remainingHours}h` : `${days}d`;
    }
    if (hours > 0) {
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
    }
    const remainingSeconds = totalSeconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  }

  // Compact format for small times
  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes % 60)}:${pad(totalSeconds % 60)}`;
  }
  return `${pad(minutes)}:${pad(totalSeconds % 60)}`;
}

/**
 * Calculate progress percentage for timer (0-100)
 * @param expiresAt - Expiration timestamp
 * @param createdAt - Creation timestamp (for calculating total duration)
 * @param totalDurationMs - Total duration in ms (if createdAt not available)
 */
export function calculateTimerProgress(
  expiresAt: string,
  createdAt?: string,
  totalDurationMs?: number,
): number {
  const now = Date.now();
  const expiryTime = new Date(expiresAt).getTime();
  const remaining = expiryTime - now;
  
  if (remaining <= 0) return 0;

  let total: number;
  if (createdAt) {
    total = expiryTime - new Date(createdAt).getTime();
  } else if (totalDurationMs) {
    total = totalDurationMs;
  } else {
    // Default to 10 minutes if no reference
    total = 10 * 60 * 1000;
  }

  return Math.min(100, Math.max(0, (remaining / total) * 100));
}

/**
 * Format bytes to human-readable size
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

