'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { ExerciseTracker } from '@/components/ExerciseTracker';
import { RoutineManager } from '@/components/RoutineManager';
import { ProfileModal } from '@/components/ProfileModal';
import { LeaderboardDropdown } from '@/components/LeaderboardDropdown';
import { NavDropdown } from '@/components/NavDropdown';
import { Loader2, Dumbbell, List, Target } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  duration?: number;
  notes?: string;
  completedAt: string;
  user: {
    id: string;
    name: string;
  };
}

interface RoutineExercise {
  name: string;
  sets: number;
  reps: number;
  restTime?: number;
  notes?: string;
}

interface WorkoutRoutine {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  exercises: RoutineExercise[];
  lastUsed?: string;
  timesUsed: number;
}

export default function ExercisePage() {
  const { user, team, isAuthenticated, isLoading } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tracker' | 'routines'>('routines');
  const [selectedRoutine, setSelectedRoutine] = useState<WorkoutRoutine | null>(null);

  const fetchExercises = useCallback(async () => {
    if (!isAuthenticated) return;
    
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/exercise', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        const data = await response.json();
        setExercises(data.exercises || []);
      }
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
    } finally {
      setLoadingExercises(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchExercises();
    }
  }, [isAuthenticated, fetchExercises]);

  const handleSelectRoutine = (routine: WorkoutRoutine) => {
    setSelectedRoutine(routine);
    setActiveTab('tracker');
  };

  const handleAddExercise = async (exerciseData: {
    name: string;
    sets: number;
    reps: number;
    duration?: number;
    notes?: string;
  }) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(exerciseData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setExercises(prev => [data.exercise, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add exercise:', error);
    }
  };

  const handleUpdateExercise = async (
    exerciseId: string,
    updates: { name: string; sets: number; reps: number; duration?: number; notes?: string }
  ) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/exercise/${exerciseId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        const data = await response.json();
        setExercises(prev =>
          prev.map(exercise => exercise.id === exerciseId ? data.exercise : exercise)
        );
      }
    } catch (error) {
      console.error('Failed to update exercise:', error);
    }
  };

  const handleDeleteExercise = async (exerciseId: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/exercise/${exerciseId}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      
      if (response.ok) {
        setExercises(prev => prev.filter(exercise => exercise.id !== exerciseId));
      }
    } catch (error) {
      console.error('Failed to delete exercise:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthScreen />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/40 transition-shadow">
              <Dumbbell className="w-5 h-5 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Exercise Tracker
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

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-1">
            Daily Exercise Tracker
          </h2>
          <p className="text-slate-500 dark:text-slate-400">
            Track your workouts with sets, reps, and timer
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'tracker'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <Target className="w-5 h-5" />
            Exercise Tracker
          </button>
          <button
            onClick={() => setActiveTab('routines')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              activeTab === 'routines'
                ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <List className="w-5 h-5" />
            Workout Routines
          </button>
        </div>

        {loadingExercises ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : activeTab === 'routines' ? (
          <RoutineManager
            onSelectRoutine={handleSelectRoutine}
          />
        ) : (
          <ExerciseTracker
            exercises={exercises}
            currentUserId={user?.id || ''}
            onAddExercise={handleAddExercise}
            onUpdateExercise={handleUpdateExercise}
            onDeleteExercise={handleDeleteExercise}
            selectedRoutine={selectedRoutine}
          />
        )}
      </main>

      <ProfileModal isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
    </div>
  );
}
