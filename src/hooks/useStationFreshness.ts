import { useMemo } from 'react';

export type FreshnessLevel = 'fresh' | 'recent' | 'stale' | 'old';

interface FreshnessResult {
  level: FreshnessLevel;
  opacity: number;
  isGrayscale: boolean;
  label: string;
  minutesAgo: number;
}

export function useStationFreshness(updatedAt: string | Date): FreshnessResult {
  return useMemo(() => {
    const updated = new Date(updatedAt);
    const now = new Date();
    const diffMs = now.getTime() - updated.getTime();
    const minutesAgo = Math.floor(diffMs / 60000);

    if (minutesAgo < 30) {
      return {
        level: 'fresh',
        opacity: 1,
        isGrayscale: false,
        label: 'Just Updated',
        minutesAgo,
      };
    } else if (minutesAgo < 60) {
      return {
        level: 'recent',
        opacity: 0.9,
        isGrayscale: false,
        label: `${minutesAgo}m ago`,
        minutesAgo,
      };
    } else if (minutesAgo < 180) {
      const hours = Math.floor(minutesAgo / 60);
      return {
        level: 'stale',
        opacity: 0.5,
        isGrayscale: false,
        label: `${hours}h ago`,
        minutesAgo,
      };
    } else {
      const hours = Math.floor(minutesAgo / 60);
      return {
        level: 'old',
        opacity: 0.3,
        isGrayscale: true,
        label: `${hours}h ago`,
        minutesAgo,
      };
    }
  }, [updatedAt]);
}