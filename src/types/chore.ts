export type ChoreFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly';

export interface Chore {
  id: string;
  title: string;
  description?: string;
  frequency: ChoreFrequency;
  dayOfWeek?: number; // 0-6 for weekly/biweekly chores (0 = Sunday)
  dayOfMonth?: number; // 1-31 for monthly chores
  startDate?: string; // ISO date string - when the chore schedule starts (for non-daily)
  isCompleted: boolean;
  lastCompleted?: string; // ISO date string
  createdAt: string;
  completionHistory: CompletionRecord[];
  // Team features
  userId: string;
  teamId: string;
  assignedTo?: string; // Can be assigned to another team member
  points: number; // Points earned for this chore type
  position: number; // For drag and drop ordering
}

export interface CompletionRecord {
  date: string; // ISO date string
  completedAt: string; // ISO datetime string
}

export interface ChoreStats {
  totalChores: number;
  completedToday: number;
  completedThisWeek: number;
  completedThisMonth: number;
  completionRate: number;
}
