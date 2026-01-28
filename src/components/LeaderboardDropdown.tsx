'use client';

import { useAuth } from '@/contexts/AuthContext';
import { formatPoints, getRankEmoji } from '@/lib/gamification';
import { Trophy, Copy, Check, Users, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function LeaderboardDropdown() {
  const { teamMembers, team, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const leaderboardData = [...teamMembers]
    .sort((a, b) => (b.stats?.totalPoints || 0) - (a.stats?.totalPoints || 0))
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));

  const currentUserRank = leaderboardData.find(e => e.id === user?.id)?.rank || 0;

  const copyInviteCode = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (team?.inviteCode) {
      navigator.clipboard.writeText(team.inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!team) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
      >
        <Trophy className="w-4 h-4" />
        <span className="hidden sm:inline">#{currentUserRank}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold">{team.name}</p>
                <p className="text-xs text-amber-100">{teamMembers.length} members</p>
              </div>
              <Trophy className="w-6 h-6 text-amber-200" />
            </div>
          </div>

          {/* Invite Code */}
          {team.inviteCode && (
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
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
                  className={`px-4 py-2.5 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 last:border-0 ${
                    isCurrentUser ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
                  }`}
                >
                  <span className="w-6 text-center font-bold text-sm">
                    {entry.rank <= 3 ? getRankEmoji(entry.rank) : `#${entry.rank}`}
                  </span>
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                      entry.rank === 1 ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                      entry.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400' :
                      entry.rank === 3 ? 'bg-gradient-to-br from-amber-600 to-orange-700' :
                      'bg-gradient-to-br from-indigo-400 to-purple-500'
                    }`}
                  >
                    {entry.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      isCurrentUser ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {entry.name} {isCurrentUser && <span className="text-xs">(you)</span>}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {formatPoints(entry.stats?.totalPoints || 0)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
