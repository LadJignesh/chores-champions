import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { Chore, ChoreFrequency, ChoreStats } from '@/types/chore';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function isChoreScheduledToday(chore: Chore): boolean {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const dayOfMonth = today.getDate();

  switch (chore.frequency) {
    case 'daily':
      return true;
    case 'weekly':
      return chore.dayOfWeek === dayOfWeek;
    case 'monthly':
      return chore.dayOfMonth === dayOfMonth;
    default:
      return false;
  }
}

export function shouldResetCompletion(chore: Chore): boolean {
  if (!chore.lastCompleted) return true;

  const lastCompleted = new Date(chore.lastCompleted);
  const today = new Date();

  switch (chore.frequency) {
    case 'daily':
      return !isSameDay(lastCompleted, today);
    case 'weekly':
      return !isSameWeek(lastCompleted, today);
    case 'monthly':
      return !isSameMonth(lastCompleted, today);
    default:
      return true;
  }
}

function isSameDay(date1: Date, date2: Date): boolean {
  return date1.toDateString() === date2.toDateString();
}

function isSameWeek(date1: Date, date2: Date): boolean {
  const oneWeek = 7 * 24 * 60 * 60 * 1000;
  const diff = Math.abs(date2.getTime() - date1.getTime());
  return diff < oneWeek && date1.getDay() <= date2.getDay();
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return date1.getMonth() === date2.getMonth() && 
         date1.getFullYear() === date2.getFullYear();
}

export function getChoreStats(chores: Chore[]): ChoreStats {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const completedToday = chores.filter(chore => 
    chore.completionHistory.some(record => 
      isSameDay(new Date(record.date), today)
    )
  ).length;

  const completedThisWeek = chores.filter(chore =>
    chore.completionHistory.some(record =>
      new Date(record.date) >= startOfWeek
    )
  ).length;

  const completedThisMonth = chores.filter(chore =>
    chore.completionHistory.some(record =>
      new Date(record.date) >= startOfMonth
    )
  ).length;

  const scheduledToday = chores.filter(isChoreScheduledToday).length;
  const completionRate = scheduledToday > 0 
    ? (completedToday / scheduledToday) * 100 
    : 0;

  return {
    totalChores: chores.length,
    completedToday,
    completedThisWeek,
    completedThisMonth,
    completionRate: Math.round(completionRate),
  };
}

export function getFrequencyLabel(frequency: ChoreFrequency): string {
  const labels: Record<ChoreFrequency, string> = {
    daily: 'Daily',
    weekly: 'Weekly',
    biweekly: 'Bi-Weekly',
    monthly: 'Monthly',
  };
  return labels[frequency];
}

export function getDayName(dayIndex: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayIndex] || '';
}
