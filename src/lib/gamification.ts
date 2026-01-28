'use client';

import { POINTS_CONFIG, LEVEL_NAMES, LEVEL_THRESHOLDS, UserStats } from '@/types/gamification';
import { ChoreFrequency } from '@/types/chore';

export function getPointsForChore(frequency: ChoreFrequency): number {
  return POINTS_CONFIG[frequency];
}

export function calculateTotalPoints(frequency: ChoreFrequency, streak: number, isFirstOfDay: boolean): number {
  let points = getPointsForChore(frequency);
  
  // Streak bonus (1 extra point per streak day, capped at 10)
  const streakBonus = Math.min(streak, 10) * POINTS_CONFIG.streakBonus;
  points += streakBonus;
  
  // First chore of the day bonus
  if (isFirstOfDay) {
    points += POINTS_CONFIG.firstOfDay;
  }
  
  return points;
}

export function getLevelName(level: number): string {
  return LEVEL_NAMES[Math.min(level, LEVEL_NAMES.length - 1)];
}

export function getLevelProgress(totalPoints: number): { current: number; next: number; progress: number } {
  let currentThreshold = 0;
  let nextThreshold = LEVEL_THRESHOLDS[1] || 100;
  
  for (let i = 0; i < LEVEL_THRESHOLDS.length - 1; i++) {
    if (totalPoints >= LEVEL_THRESHOLDS[i]) {
      currentThreshold = LEVEL_THRESHOLDS[i];
      nextThreshold = LEVEL_THRESHOLDS[i + 1];
    }
  }
  
  const progress = ((totalPoints - currentThreshold) / (nextThreshold - currentThreshold)) * 100;
  
  return {
    current: currentThreshold,
    next: nextThreshold,
    progress: Math.min(progress, 100),
  };
}

export function calculateStreak(lastCompletedDate: string | undefined, currentStreak: number): { streak: number; isConsecutive: boolean } {
  if (!lastCompletedDate) {
    return { streak: 1, isConsecutive: false };
  }
  
  const last = new Date(lastCompletedDate);
  const now = new Date();
  
  // Reset time components for date comparison
  last.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);
  
  const diffDays = Math.floor((now.getTime() - last.getTime()) / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    // Same day - maintain streak
    return { streak: currentStreak, isConsecutive: true };
  } else if (diffDays === 1) {
    // Consecutive day - increment streak
    return { streak: currentStreak + 1, isConsecutive: true };
  } else {
    // Streak broken - reset to 1
    return { streak: 1, isConsecutive: false };
  }
}

export function formatPoints(points: number): string {
  if (points >= 1000000) {
    return `${(points / 1000000).toFixed(1)}M`;
  }
  if (points >= 1000) {
    return `${(points / 1000).toFixed(1)}K`;
  }
  return points.toString();
}

export function getRankEmoji(rank: number): string {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
}

export function sortLeaderboard(stats: (UserStats & { userName: string })[]): (UserStats & { userName: string; rank: number })[] {
  return stats
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

export function getTierColor(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): string {
  switch (tier) {
    case 'bronze': return 'from-amber-600 to-orange-700';
    case 'silver': return 'from-slate-400 to-slate-500';
    case 'gold': return 'from-yellow-400 to-amber-500';
    case 'platinum': return 'from-cyan-300 to-blue-400';
    default: return 'from-slate-400 to-slate-500';
  }
}

export function getTierBorder(tier: 'bronze' | 'silver' | 'gold' | 'platinum'): string {
  switch (tier) {
    case 'bronze': return 'border-amber-600/50';
    case 'silver': return 'border-slate-400/50';
    case 'gold': return 'border-yellow-400/50';
    case 'platinum': return 'border-cyan-400/50';
    default: return 'border-slate-400/50';
  }
}
