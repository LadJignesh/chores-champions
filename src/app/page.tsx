'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { ChoreCard } from '@/components/ChoreCard';
import { AddChoreModal } from '@/components/AddChoreModal';
import { ProfileModal } from '@/components/ProfileModal';
import { LeaderboardDropdown } from '@/components/LeaderboardDropdown';
import { Chore, ChoreFrequency } from '@/types/chore';
import { Plus, Calendar, Flame, Trophy, Loader2, CheckCircle2, CalendarDays } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export default function Home() {
  const { user, team, isAuthenticated, isLoading, userStats, teamMembers, refreshTeamMembers } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [filter, setFilter] = useState<'mine' | 'today' | 'all'>('mine');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loadingChores, setLoadingChores] = useState(true);
  const [editingChore, setEditingChore] = useState<Chore | null>(null);

  // Format today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });

  const fetchChores = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/chores', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setChores(data.chores || []);
      }
    } catch (error) {
      console.error('Failed to fetch chores:', error);
    } finally {
      setLoadingChores(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChores();
    }
  }, [isAuthenticated, fetchChores]);

  const handleToggleChore = async (choreId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chores/${choreId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'toggle' }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setChores(prev => prev.map(c => c.id === choreId ? data.chore : c));
        
        if (data.chore.isCompleted) {
          confetti({
            particleCount: 50,
            spread: 60,
            origin: { y: 0.7 },
          });
        }
        
        // Refresh team data
        refreshTeamMembers();
      }
    } catch (error) {
      console.error('Failed to toggle chore:', error);
    }
  };

  const handleDeleteChore = async (choreId: string) => {
    if (!confirm('Are you sure you want to delete this chore?')) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chores/${choreId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        setChores(prev => prev.filter(c => c.id !== choreId));
      }
    } catch (error) {
      console.error('Failed to delete chore:', error);
    }
  };

  const handleAddChore = async (choreData: {
    title: string;
    description?: string;
    frequency: ChoreFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    startDate?: string;
    assignedTo?: string;
  }) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/chores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(choreData),
      });
      
      if (response.ok) {
        fetchChores();
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to add chore:', error);
    }
  };

  const handleEditChore = async (choreId: string, choreData: {
    title: string;
    description?: string;
    frequency: ChoreFrequency;
    dayOfWeek?: number;
    dayOfMonth?: number;
    startDate?: string;
    assignedTo?: string;
  }) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/chores/${choreId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(choreData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setChores(prev => prev.map(c => c.id === choreId ? data.chore : c));
        setEditingChore(null);
        setIsAddModalOpen(false);
      }
    } catch (error) {
      console.error('Failed to edit chore:', error);
    }
  };

  // Filter chores
  const getAssigneeName = (assigneeId: string | undefined) => {
    if (!assigneeId) return undefined;
    return teamMembers.find(m => m.id === assigneeId)?.name;
  };

  const filteredChores = chores.filter(c => {
    if (filter === 'mine') return c.assignedTo === user?.id || (!c.assignedTo && c.userId === user?.id);
    if (filter === 'today') return c.frequency === 'daily';
    return true;
  });

  // Sort: incomplete first, then by creation date
  const sortedChores = [...filteredChores].sort((a, b) => {
    if (a.isCompleted !== b.isCompleted) return a.isCompleted ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Auth screen
  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      {/* Minimal Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Profile Button */}
          <button 
            onClick={() => setIsProfileOpen(true)} 
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="text-left hidden sm:block">
              <p className="font-semibold text-slate-800 dark:text-slate-100">{user?.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">{team?.name || 'Personal'}</p>
            </div>
          </button>

          {/* Nav Links */}
          <div className="flex items-center gap-1">
            {team && <LeaderboardDropdown />}
            
            <Link
              href="/weekly"
              className="flex items-center gap-1.5 px-3 py-2 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-sm font-medium"
            >
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Weekly</span>
            </Link>
            
            {/* Add Chore Button in Header */}
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Chore</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Date & Task Progress */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Calendar className="w-5 h-5" />
            <span className="font-medium">{dateString}</span>
          </div>
          
          {!loadingChores && sortedChores.length > 0 && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                {sortedChores.filter(c => !c.isCompleted).length}/{sortedChores.length} remaining
              </span>
              <div className="w-20 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                  style={{ width: `${(sortedChores.filter(c => c.isCompleted).length / sortedChores.length) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { key: 'mine', label: 'My Tasks' },
            { key: 'today', label: 'Today' },
            { key: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Chores List */}
        <div className="space-y-3">
          {loadingChores ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
            </div>
          ) : sortedChores.length === 0 ? (
            <div className="text-center py-12 bg-white/60 dark:bg-slate-900/40 rounded-2xl border border-slate-200/50 dark:border-slate-800/50">
              <p className="text-slate-500 dark:text-slate-400 text-lg">No chores yet</p>
              <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Add your first chore to get started!</p>
            </div>
          ) : (
            sortedChores.map(chore => (
              <ChoreCard
                key={chore.id}
                chore={chore}
                onToggle={handleToggleChore}
                onDelete={handleDeleteChore}
                onEdit={(c) => { setEditingChore(c); setIsAddModalOpen(true); }}
                assignedToName={getAssigneeName(chore.assignedTo)}
                showAssignee={filter === 'all'}
                canToggle={chore.assignedTo === user?.id || (!chore.assignedTo && chore.userId === user?.id)}
                currentUserId={user?.id}
              />
            ))
          )}
        </div>

        {/* Stats & Leaderboard Section */}
        <div className="mt-8 space-y-4">
          {/* Your Stats */}
          <div className="bg-white/80 dark:bg-slate-900/60 rounded-2xl border border-slate-200/50 dark:border-slate-800/50 p-4">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Your Stats</h3>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                  <Flame className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{userStats?.currentStreak || 0}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Day Streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{userStats?.totalPoints || 0}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total Points</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">{userStats?.totalCompleted || 0}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modals */}
      <AddChoreModal
        isOpen={isAddModalOpen}
        onClose={() => { setIsAddModalOpen(false); setEditingChore(null); }}
        onAdd={handleAddChore}
        onEdit={handleEditChore}
        editingChore={editingChore}
        teamMembers={teamMembers}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
