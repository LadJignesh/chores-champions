export interface UserStats {
  userId: string;
  totalPoints: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  badges: Badge[];
  weeklyPoints: number;
  monthlyPoints: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  avatar?: string;
  points: number;
  level: number;
  streak: number;
  rank: number;
}

export interface PointsConfig {
  daily: number;
  weekly: number;
  biweekly: number;
  monthly: number;
  streakBonus: number;
  firstOfDay: number;
}

export const POINTS_CONFIG: PointsConfig = {
  daily: 10,
  weekly: 25,
  biweekly: 35,
  monthly: 50,
  streakBonus: 5,
  firstOfDay: 15,
};

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 3500, 5500, 8000, 12000, 18000, 25000
];

export const LEVEL_NAMES = [
  'Rookie', 'Helper', 'Contributor', 'Achiever', 'Star',
  'Champion', 'Hero', 'Legend', 'Master', 'Grand Master', 'Elite', 'Ultimate'
];

export const BADGES_DEFINITIONS = [
  { id: 'first_chore', name: 'First Step', description: 'Complete your first chore', icon: '🎯', tier: 'bronze' as const },
  { id: 'streak_3', name: 'On a Roll', description: 'Maintain a 3-day streak', icon: '🔥', tier: 'bronze' as const },
  { id: 'streak_7', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '⚡', tier: 'silver' as const },
  { id: 'streak_30', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🏆', tier: 'gold' as const },
  { id: 'complete_10', name: 'Getting Started', description: 'Complete 10 chores', icon: '✨', tier: 'bronze' as const },
  { id: 'complete_50', name: 'Dedicated', description: 'Complete 50 chores', icon: '💪', tier: 'silver' as const },
  { id: 'complete_100', name: 'Centurion', description: 'Complete 100 chores', icon: '🌟', tier: 'gold' as const },
  { id: 'complete_500', name: 'Legend', description: 'Complete 500 chores', icon: '👑', tier: 'platinum' as const },
  { id: 'level_5', name: 'Rising Star', description: 'Reach level 5', icon: '⭐', tier: 'silver' as const },
  { id: 'level_10', name: 'Top Performer', description: 'Reach level 10', icon: '🚀', tier: 'gold' as const },
  { id: 'early_bird', name: 'Early Bird', description: 'Complete a chore before 8 AM', icon: '🌅', tier: 'bronze' as const },
  { id: 'night_owl', name: 'Night Owl', description: 'Complete a chore after 10 PM', icon: '🦉', tier: 'bronze' as const },
  { id: 'team_player', name: 'Team Player', description: 'Be part of a team with 3+ members', icon: '🤝', tier: 'silver' as const },
];
