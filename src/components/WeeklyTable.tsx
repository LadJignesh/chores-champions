'use client';

import { useState } from 'react';
import { Chore } from '@/types/chore';
import { CheckCircle2, Circle, Users, User } from 'lucide-react';

interface WeeklyTableProps {
  chores: Chore[]; // All chores
  todayChores: Chore[]; // Today's scheduled chores with completion status
  onToggle: (id: string) => void;
  currentUserId?: string;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function WeeklyTable({ chores, todayChores, onToggle, currentUserId }: WeeklyTableProps) {
  const [showAllMembers, setShowAllMembers] = useState(false);
  const today = new Date().getDay();

  // Filter chores by user unless showing all
  const filteredChores = showAllMembers 
    ? chores 
    : chores.filter(chore => 
        chore.assignedTo === currentUserId || 
        (!chore.assignedTo && chore.userId === currentUserId)
      );

  // Get chores scheduled for a specific day
  const getChoresForDay = (dayIndex: number) => {
    return filteredChores.filter(chore => {
      // Daily chores show every day
      if (chore.frequency === 'daily') return true;
      
      // Weekly chores
      if (chore.frequency === 'weekly') {
        if (chore.daysOfWeek && chore.daysOfWeek.length > 0) {
          return chore.daysOfWeek.includes(dayIndex);
        }
        return chore.dayOfWeek === dayIndex;
      }
      
      // Biweekly chores (show on scheduled days, actual appearance depends on week)
      if (chore.frequency === 'biweekly') {
        if (chore.daysOfWeek && chore.daysOfWeek.length > 0) {
          return chore.daysOfWeek.includes(dayIndex);
        }
        return chore.dayOfWeek === dayIndex;
      }
      
      // Monthly chores - don't show in weekly view
      return false;
    });
  };

  // Get completion status from today's chores
  const getTodayCompletionStatus = (choreId: string): boolean => {
    const todayChore = todayChores.find(c => c.id === choreId);
    return todayChore?.isCompleted ?? false;
  };

  const canToggle = (chore: Chore) => {
    return chore.assignedTo === currentUserId || (!chore.assignedTo && chore.userId === currentUserId);
  };

  return (
    <div className="bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 overflow-hidden">
      <div className="p-4 border-b border-slate-200/50 dark:border-slate-800/50 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Weekly Overview</h3>
        <button
          onClick={() => setShowAllMembers(!showAllMembers)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            showAllMembers
              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {showAllMembers ? (
            <>
              <Users className="w-3.5 h-3.5" />
              All Members
            </>
          ) : (
            <>
              <User className="w-3.5 h-3.5" />
              My Tasks
            </>
          )}
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[600px]">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/50">
              {DAYS.map((day, index) => (
                <th
                  key={day}
                  className={`px-3 py-3 text-xs font-semibold uppercase tracking-wider text-center border-b border-slate-200/50 dark:border-slate-700/50 ${
                    index === today
                      ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  <span className="hidden sm:inline">{FULL_DAYS[index]}</span>
                  <span className="sm:hidden">{day}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              {DAYS.map((_, dayIndex) => {
                const dayChores = getChoresForDay(dayIndex);
                const isToday = dayIndex === today;
                
                return (
                  <td
                    key={dayIndex}
                    className={`align-top p-2 border-r last:border-r-0 border-slate-200/50 dark:border-slate-700/50 ${
                      isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                    }`}
                  >
                    <div className="space-y-1.5 min-h-[100px]">
                      {dayChores.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">—</p>
                      ) : (
                        dayChores.map(chore => {
                          const isToggleable = canToggle(chore) && isToday;
                          // Only show completion status for today
                          const isCompleted = isToday ? getTodayCompletionStatus(chore.id) : false;
                          
                          return (
                            <div
                              key={chore.id}
                              className={`flex items-start gap-1.5 p-1.5 rounded-lg text-xs transition-colors ${
                                isToday && isCompleted
                                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                                  : isToday
                                  ? 'bg-indigo-100/50 dark:bg-indigo-800/30 text-slate-700 dark:text-slate-300'
                                  : 'bg-slate-100 dark:bg-slate-800/60 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {isToday && (
                                <button
                                  onClick={() => isToggleable && onToggle(chore.id)}
                                  disabled={!isToggleable}
                                  className={`flex-shrink-0 mt-0.5 ${isToggleable ? 'cursor-pointer hover:scale-110' : 'opacity-50'}`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-slate-400" />
                                  )}
                                </button>
                              )}
                              <span className={`flex-1 leading-tight ${isToday && isCompleted ? 'line-through' : ''}`}>
                                {chore.title}
                              </span>
                              {chore.frequency === 'biweekly' && (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">2w</span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
