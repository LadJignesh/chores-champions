'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getLevelName, getLevelProgress, formatPoints, getTierColor, getTierBorder } from '@/lib/gamification';
import { LEVEL_NAMES } from '@/types/gamification';
import { Star, Trophy, Target, Award, X } from 'lucide-react';
import { ContributionGraph } from './ContributionGraph';
import { useState, useEffect } from 'react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { user, userStats, logout } = useAuth();
  const [completionHistory, setCompletionHistory] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    if (isOpen) {
      // Fetch completion history
      const fetchHistory = async () => {
        try {
          const token = localStorage.getItem('auth_token');
          const response = await fetch('/api/stats/history', {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {},
          });
          if (response.ok) {
            const data = await response.json();
            setCompletionHistory(data.history);
          }
        } catch (error) {
          console.error('Error fetching completion history:', error);
        }
      };
      fetchHistory();
    }
  }, [isOpen]);

  if (!isOpen || !user || !userStats) return null;

  const levelProgress = getLevelProgress(userStats.totalPoints);
  const nextLevelName = LEVEL_NAMES[Math.min(userStats.level + 1, LEVEL_NAMES.length - 1)];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden">
          {/* Header with gradient */}
          <div className="relative bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 px-6 py-8 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-3xl font-bold shadow-lg">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h2 className="text-2xl font-bold">{user.name}</h2>
                <p className="text-white/80">{user.email}</p>
              </div>
            </div>

            {/* Level Badge */}
            <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur rounded-full">
              <Star className="w-5 h-5 text-yellow-300" />
              <span className="font-semibold">Level {userStats.level}</span>
              <span className="text-white/80">•</span>
              <span className="text-white/90">{getLevelName(userStats.level)}</span>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="px-6 py-6">
            {/* Level Progress */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                  Progress to {nextLevelName}
                </span>
                <span className="text-sm text-slate-500">
                  {formatPoints(userStats.totalPoints)} / {formatPoints(levelProgress.next)} pts
                </span>
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${levelProgress.progress}%` }}
                />
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200/50 dark:border-amber-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  <span className="text-sm font-medium text-amber-800 dark:text-amber-200">Total Points</span>
                </div>
                <p className="text-2xl font-bold text-amber-900 dark:text-amber-100">
                  {formatPoints(userStats.totalPoints)}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 border border-emerald-200/50 dark:border-emerald-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="w-5 h-5 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Completed</span>
                </div>
                <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
                  {userStats.totalCompleted}
                </p>
              </div>
            </div>

            {/* GitHub-style Contribution Graph */}
            <div className="mb-6">
              <ContributionGraph
                completionHistory={completionHistory}
                currentStreak={userStats.currentStreak}
                longestStreak={userStats.longestStreak}
              />
            </div>

            {/* Badges */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <h3 className="font-semibold text-slate-900 dark:text-white">Badges Earned</h3>
                <span className="text-sm text-slate-500">({userStats.badges.length})</span>
              </div>
              
              {userStats.badges.length > 0 ? (
                <div className="grid grid-cols-4 gap-3">
                  {userStats.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className={`relative p-3 rounded-xl bg-gradient-to-br ${getTierColor(badge.tier)} border ${getTierBorder(badge.tier)} text-center group cursor-default`}
                      title={`${badge.name}: ${badge.description}`}
                    >
                      <span className="text-2xl">{badge.icon}</span>
                      <p className="text-xs font-medium text-white mt-1 truncate">{badge.name}</p>
                      
                      {/* Tooltip */}
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 dark:bg-slate-700 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                        {badge.description}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500 dark:text-slate-400">
                  <Award className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
                  <p className="text-sm">Complete chores to earn badges!</p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-medium hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
