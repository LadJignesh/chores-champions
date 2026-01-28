'use client';

import { useAuth } from '@/contexts/AuthContext';
import { formatPoints, getRankEmoji } from '@/lib/gamification';
import { Trophy, ChevronDown, ChevronUp, Copy, Check, Users } from 'lucide-react';
import { useState } from 'react';

export function MiniLeaderboard() {
  const { teamMembers, team, user } = useAuth();
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const leaderboardData = [...teamMembers]
    .sort((a, b) => (b.stats?.totalPoints || 0) - (a.stats?.totalPoints || 0))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const currentUserRank = leaderboardData.find(e => e.id === user?.id)?.rank || 0;
  const topThree = leaderboardData.slice(0, 3);

  const copyInviteCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur border border-slate-200/50 dark:border-slate-800/50 rounded-xl overflow-hidden">
      {/* Collapsed Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {topThree.map((member, i) => (
              <div
                key={member.id}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 border-white dark:border-slate-900 ${
                  i === 0 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white z-30' :
                  i === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white z-20' :
                  'bg-gradient-to-br from-amber-600 to-orange-700 text-white z-10'
                }`}
              >
                {member.name.charAt(0).toUpperCase()}
              </div>
            ))}
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {team?.name || 'Team'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              You're #{currentUserRank} • {teamMembers.length} members
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-4 h-4 text-amber-500" />
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-slate-200/50 dark:border-slate-800/50">
          {/* Invite Code */}
          {team?.inviteCode && (
            <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-800/30 border-b border-slate-200/50 dark:border-slate-800/50">
              <button
                onClick={copyInviteCode}
                className="w-full flex items-center justify-between text-sm"
              >
                <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Users className="w-3.5 h-3.5" />
                  Invite Code
                </span>
                <span className="flex items-center gap-1.5 font-mono text-indigo-600 dark:text-indigo-400">
                  {team.inviteCode}
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                </span>
              </button>
            </div>
          )}

          {/* Leaderboard List */}
          <div className="max-h-64 overflow-y-auto">
            {leaderboardData.map((entry) => {
              const isCurrentUser = entry.id === user?.id;
              
              return (
                <div
                  key={entry.id}
                  className={`px-4 py-2.5 flex items-center gap-3 ${
                    isCurrentUser ? 'bg-indigo-50/50 dark:bg-indigo-950/20' : ''
                  }`}
                >
                  <span className="w-6 text-center">
                    {entry.rank <= 3 ? (
                      <span className="text-base">{getRankEmoji(entry.rank)}</span>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">#{entry.rank}</span>
                    )}
                  </span>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500 text-white' :
                    entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                    entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-700 text-white' :
                    'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                  }`}>
                    {entry.name.charAt(0).toUpperCase()}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isCurrentUser ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-900 dark:text-white'
                    }`}>
                      {entry.name}
                      {isCurrentUser && <span className="ml-1 text-xs opacity-70">(You)</span>}
                    </p>
                  </div>
                  
                  <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                    {formatPoints(entry.stats?.totalPoints || 0)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
