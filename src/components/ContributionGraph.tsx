'use client';

import { useMemo } from 'react';
import { Flame } from 'lucide-react';

interface ContributionGraphProps {
  completionHistory: { date: string; count: number }[];
  currentStreak: number;
  longestStreak: number;
}

export function ContributionGraph({ completionHistory, currentStreak, longestStreak }: ContributionGraphProps) {
  // Generate last 16 weeks (112 days) of data
  const weeks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Create a map of date -> count for quick lookup
    const countMap = new Map<string, number>();
    completionHistory.forEach(({ date, count }) => {
      countMap.set(date, count);
    });
    
    // Generate weeks (16 weeks = ~4 months)
    const weeksData: { date: Date; count: number; dateStr: string }[][] = [];
    
    // Start from the most recent Sunday
    const startDay = new Date(today);
    const dayOfWeek = startDay.getDay();
    startDay.setDate(startDay.getDate() - dayOfWeek - (16 * 7 - 7));
    
    for (let week = 0; week < 16; week++) {
      const weekData: { date: Date; count: number; dateStr: string }[] = [];
      
      for (let day = 0; day < 7; day++) {
        const date = new Date(startDay);
        date.setDate(startDay.getDate() + week * 7 + day);
        const dateStr = date.toISOString().split('T')[0];
        const count = countMap.get(dateStr) || 0;
        
        weekData.push({
          date,
          count,
          dateStr,
        });
      }
      
      weeksData.push(weekData);
    }
    
    return weeksData;
  }, [completionHistory]);

  // Get intensity level (0-4) based on count
  const getIntensity = (count: number): number => {
    if (count === 0) return 0;
    if (count === 1) return 1;
    if (count === 2) return 2;
    if (count <= 4) return 3;
    return 4;
  };

  // Get color class based on intensity
  const getColorClass = (intensity: number): string => {
    switch (intensity) {
      case 0: return 'bg-slate-100 dark:bg-slate-800';
      case 1: return 'bg-emerald-200 dark:bg-emerald-900';
      case 2: return 'bg-emerald-400 dark:bg-emerald-700';
      case 3: return 'bg-emerald-500 dark:bg-emerald-600';
      case 4: return 'bg-emerald-600 dark:bg-emerald-500';
      default: return 'bg-slate-100 dark:bg-slate-800';
    }
  };

  // Month labels
  const monthLabels = useMemo(() => {
    const labels: { month: string; weekIndex: number }[] = [];
    let lastMonth = -1;
    
    weeks.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0].date;
      const month = firstDayOfWeek.getMonth();
      
      if (month !== lastMonth) {
        labels.push({
          month: firstDayOfWeek.toLocaleDateString('en-US', { month: 'short' }),
          weekIndex,
        });
        lastMonth = month;
      }
    });
    
    return labels;
  }, [weeks]);

  // Day labels
  const dayLabels = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

  // Calculate total contributions
  const totalContributions = useMemo(() => {
    return completionHistory.reduce((sum, { count }) => sum + count, 0);
  }, [completionHistory]);

  return (
    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-semibold text-slate-900 dark:text-white">Activity</h3>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <span className="text-slate-600 dark:text-slate-400">Current:</span>
            <span className="font-bold text-orange-600 dark:text-orange-400">{currentStreak} days</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-slate-600 dark:text-slate-400">Best:</span>
            <span className="font-bold text-purple-600 dark:text-purple-400">{longestStreak} days</span>
          </div>
        </div>
      </div>

      {/* Contribution count */}
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
        <span className="font-semibold text-slate-900 dark:text-white">{totalContributions}</span> chores completed in the last 4 months
      </p>

      {/* Graph */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Month labels */}
          <div className="flex ml-8 mb-1">
            {monthLabels.map(({ month, weekIndex }, i) => (
              <div 
                key={i}
                className="text-xs text-slate-500 dark:text-slate-400"
                style={{ 
                  position: 'relative',
                  left: `${weekIndex * 14}px`,
                  marginRight: i < monthLabels.length - 1 
                    ? `${(monthLabels[i + 1]?.weekIndex - weekIndex - 1) * 14}px` 
                    : '0'
                }}
              >
                {month}
              </div>
            ))}
          </div>

          <div className="flex gap-0.5">
            {/* Day labels */}
            <div className="flex flex-col gap-0.5 mr-1">
              {dayLabels.map((label, i) => (
                <div key={i} className="w-6 h-3 text-[10px] text-slate-400 dark:text-slate-500 flex items-center">
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-0.5">
                {week.map((day, dayIndex) => {
                  const intensity = getIntensity(day.count);
                  const isToday = day.dateStr === new Date().toISOString().split('T')[0];
                  const isFuture = day.date > new Date();
                  
                  return (
                    <div
                      key={dayIndex}
                      className={`w-3 h-3 rounded-sm transition-colors ${
                        isFuture 
                          ? 'bg-transparent' 
                          : getColorClass(intensity)
                      } ${isToday ? 'ring-1 ring-indigo-500 ring-offset-1 dark:ring-offset-slate-800' : ''}`}
                      title={`${day.date.toLocaleDateString('en-US', { 
                        weekday: 'short',
                        month: 'short', 
                        day: 'numeric',
                        year: 'numeric'
                      })}: ${day.count} chore${day.count !== 1 ? 's' : ''} completed`}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-3">
        <span className="text-xs text-slate-500 dark:text-slate-400">Less</span>
        <div className="flex gap-0.5">
          {[0, 1, 2, 3, 4].map((intensity) => (
            <div
              key={intensity}
              className={`w-3 h-3 rounded-sm ${getColorClass(intensity)}`}
            />
          ))}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">More</span>
      </div>
    </div>
  );
}
