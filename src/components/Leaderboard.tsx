'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getLevelName, getLevelProgress, formatPoints, getRankEmoji } from '@/lib/gamification';
import { Trophy, Flame, TrendingUp, Crown, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export function Leaderboard() {
  const { teamMembers, team, user } = useAuth();
  const [copied, setCopied] = useState(false);

  // Team members already have stats from the API
  // Sort by points and add rank
  const leaderboardData = [...teamMembers]
    .sort((a, b) => (b.stats?.totalPoints || 0) - (a.stats?.totalPoints || 0))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const copyInviteCode = () => {
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/70 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/60 backdrop-blur shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-xl">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-white">Team Leaderboard</h3>
              <p className="text-amber-100 text-sm">{team?.name || 'Your Team'}</p>
            </div>
          </div>
          {team?.inviteCode && (
            <button
              onClick={copyInviteCode}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white text-sm font-medium transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  {team.inviteCode}
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Leaderboard List */}
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {leaderboardData.map((entry) => {
          const isCurrentUser = entry.id === user?.id;
          const levelProgress = getLevelProgress(entry.stats?.totalPoints || 0);
          
          return (
            <div
              key={entry.id}
              className={`px-5 py-4 flex items-center gap-4 transition-colors ${
                isCurrentUser ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
              }`}
            >
              {/* Rank */}
              <div className="w-10 text-center">
                {entry.rank <= 3 ? (
                  <span className="text-2xl">{getRankEmoji(entry.rank)}</span>
                ) : (
                  <span className="text-lg font-bold text-slate-400">#{entry.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' :
                'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
              }`}>
                {entry.name.charAt(0).toUpperCase()}
              </div>

              {/* Name & Level */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`font-semibold truncate ${isCurrentUser ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'}`}>
                    {entry.name}
                  </span>
                  {isCurrentUser && (
                    <span className="text-xs px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 rounded-full">
                      You
                    </span>
                  )}
                  {entry.rank === 1 && (
                    <Crown className="w-4 h-4 text-amber-500" />
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Lv. {entry.stats?.level || 0} {getLevelName(entry.stats?.level || 0)}
                  </span>
                  {/* Level Progress Bar */}
                  <div className="flex-1 max-w-24 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all"
                      style={{ width: `${levelProgress.progress}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center gap-4 text-right">
                {/* Streak */}
                <div className="hidden sm:flex items-center gap-1.5">
                  <Flame className={`w-4 h-4 ${(entry.stats?.currentStreak || 0) > 0 ? 'text-orange-500' : 'text-slate-300'}`} />
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {entry.stats?.currentStreak || 0}
                  </span>
                </div>

                {/* Points */}
                <div className="flex items-center gap-1.5 min-w-[80px] justify-end">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatPoints(entry.stats?.totalPoints || 0)}
                  </span>
                  <span className="text-xs text-slate-500">pts</span>
                </div>
              </div>
            </div>
          );
        })}

        {leaderboardData.length === 0 && (
          <div className="px-5 py-12 text-center text-slate-500 dark:text-slate-400">
            <Trophy className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-600" />
            <p className="font-medium">No team members yet</p>
            <p className="text-sm mt-1">Share your invite code to add members!</p>
          </div>
        )}
      </div>
    </div>
  );
}
