'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { WeeklyTable } from '@/components/WeeklyTable';
import { ProfileModal } from '@/components/ProfileModal';
import { LeaderboardDropdown } from '@/components/LeaderboardDropdown';
import { NavDropdown } from '@/components/NavDropdown';
import { Chore } from '@/types/chore';
import { Loader2, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function WeeklyPage() {
  const { user, team, isAuthenticated, isLoading } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [todayChores, setTodayChores] = useState<Chore[]>([]);
  const [loadingChores, setLoadingChores] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const fetchChores = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/chores', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      const allResponse = await fetch('/api/chores?all=true', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setTodayChores(data.chores || []);
      }
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setChores(allData.chores || []);
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
        fetchChores();
      }
    } catch (error) {
      console.error('Failed to toggle chore:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-violet-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/40 transition-shadow">
              <Calendar className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-600 via-violet-600 to-indigo-600 bg-clip-text text-transparent">
                Weekly Overview
              </h1>
            </div>
          </Link>

          <div className="flex items-center gap-1">
            <button 
              onClick={() => setIsProfileOpen(true)} 
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="hidden md:inline text-sm font-medium text-slate-700 dark:text-slate-300">{user?.name}</span>
            </button>
            
            {team && <LeaderboardDropdown />}
            <NavDropdown />
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
            Weekly Schedule
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            View your team&apos;s chores for the week
          </p>
        </div>

        {loadingChores ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          </div>
        ) : (
          <WeeklyTable 
            chores={chores} 
            todayChores={todayChores}
            onToggle={handleToggleChore}
            currentUserId={user?.id}
          />
        )}
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
