'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { WeeklyTable } from '@/components/WeeklyTable';
import { Chore } from '@/types/chore';
import { Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export default function WeeklyPage() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [todayChores, setTodayChores] = useState<Chore[]>([]);
  const [loadingChores, setLoadingChores] = useState(true);

  const fetchChores = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('auth_token');
      // Fetch today's chores
      const response = await fetch('/api/chores', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      // Fetch all chores for weekly table
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
        fetchChores(); // Refresh data
      }
    } catch (error) {
      console.error('Failed to toggle chore:', error);
    }
  };

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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link 
            href="/"
            className="flex items-center gap-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="hidden sm:inline">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            <h1 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Weekly Overview</h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {loadingChores ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
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
    </div>
  );
}
