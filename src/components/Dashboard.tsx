'use client';

import { useEffect, useState } from 'react';
import { Calendar, Sparkles, Dumbbell, CheckCircle2, Circle, Timer, Quote } from 'lucide-react';
import Link from 'next/link';

interface Chore {
  id: string;
  title: string;
  frequency: string;
  isCompleted: boolean;
  points: number;
  userId?: string;
  assignedTo?: string;
}

interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  duration?: number;
  completedAt: string;
}

interface DashboardProps {
  userName: string;
  userId: string;
}

const MOTIVATIONAL_QUOTES = [
  { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Everything you've ever wanted is on the other side of fear.", author: "George Addair" },
  { text: "Success is not how high you have climbed, but how you make a positive difference to the world.", author: "Roy T. Bennett" },
  { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
  { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Your limitation—it's only your imagination.", author: "Unknown" },
  { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
  { text: "Great things never come from comfort zones.", author: "Unknown" },
  { text: "Dream it. Wish it. Do it.", author: "Unknown" },
  { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
  { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
  { text: "Dream bigger. Do bigger.", author: "Unknown" },
  { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
  { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
  { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
];

export function Dashboard({ userName, userId }: DashboardProps) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loadingChores, setLoadingChores] = useState(true);
  const [loadingExercises, setLoadingExercises] = useState(true);
  const [dailyQuote, setDailyQuote] = useState(MOTIVATIONAL_QUOTES[0]);

  // Get current date info
  const now = new Date();
  const dayName = now.toLocaleDateString('en-US', { weekday: 'long' });
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const date = now.getDate();
  const year = now.getFullYear();

  // Get daily quote based on date (same quote for the same day)
  useEffect(() => {
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const quoteIndex = dayOfYear % MOTIVATIONAL_QUOTES.length;
    setDailyQuote(MOTIVATIONAL_QUOTES[quoteIndex]);
  }, []);

  // Fetch today's chores
  const fetchChores = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/chores', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        // Filter to only show current user's chores
        const userChores = (data.chores || []).filter((chore: Chore) => 
          chore.assignedTo === userId || (!chore.assignedTo && chore.userId === userId)
        );
        setChores(userChores);
      }
    } catch (error) {
      console.error('Failed to fetch chores:', error);
    } finally {
      setLoadingChores(false);
    }
  };

  useEffect(() => {
    fetchChores();
  }, []);

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
        await fetchChores();
      }
    } catch (error) {
      console.error('Failed to toggle chore:', error);
    }
  };

  // Fetch today's exercises
  useEffect(() => {
    const fetchExercises = async () => {
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
    };
    fetchExercises();
  }, []);

  const completedChores = chores.filter(c => c.isCompleted).length;
  const totalChores = chores.length;
  const totalExercises = exercises.length;
  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header with Date */}
      <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-6 h-6" />
          <span className="text-sm font-medium opacity-90">{dayName}</span>
        </div>
        <h1 className="text-4xl font-bold mb-2">
          Welcome back, {userName}!
        </h1>
        <p className="text-xl opacity-90">
          {monthName} {date}, {year}
        </p>
      </div>

      {/* Daily Quote */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-gradient-to-br from-yellow-100 to-orange-100 dark:from-yellow-900/30 dark:to-orange-900/30 rounded-xl">
            <Quote className="w-6 h-6 text-orange-500" />
          </div>
          <div className="flex-1">
            <p className="text-lg font-medium text-slate-800 dark:text-slate-100 mb-2 italic">
              &ldquo;{dailyQuote.text}&rdquo;
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              — {dailyQuote.author}
            </p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Chores</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {completedChores}/{totalChores}
          </div>
          <div className="text-xs text-slate-400 mt-1">
            {totalChores > 0 ? Math.round((completedChores / totalChores) * 100) : 0}% complete
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Exercises</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalExercises}</div>
          <div className="text-xs text-slate-400 mt-1">workouts today</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Sets</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">{totalSets}</div>
          <div className="text-xs text-slate-400 mt-1">performed</div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">Points</div>
          <div className="text-2xl font-bold text-slate-800 dark:text-white">
            {chores.filter(c => c.isCompleted).reduce((sum, c) => sum + c.points, 0)}
          </div>
          <div className="text-xs text-slate-400 mt-1">earned today</div>
        </div>
      </div>

      {/* Today's Chores */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            Today&apos;s Chores ({totalChores})
          </h2>
          <Link 
            href="/chores"
            className="text-sm text-indigo-500 hover:text-indigo-600 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
          >
            View All →
          </Link>
        </div>
        {loadingChores ? (
          <p className="text-center text-slate-400 py-8">Loading chores...</p>
        ) : chores.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No chores scheduled for today</p>
        ) : (
          <div className="space-y-2">
            {chores.slice(0, 5).map((chore) => (
              <button
                key={chore.id}
                onClick={() => handleToggleChore(chore.id)}
                className="w-full flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {chore.isCompleted ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-slate-300 dark:text-slate-600 flex-shrink-0" />
                )}
                <span className={`flex-1 text-left ${chore.isCompleted ? 'line-through text-slate-400' : 'text-slate-700 dark:text-slate-300'}`}>
                  {chore.title}
                </span>
                <span className="text-xs text-slate-400">{chore.points} pts</span>
              </button>
            ))}
            {chores.length > 5 && (
              <p className="text-center text-sm text-slate-400 pt-2">
                +{chores.length - 5} more chores
              </p>
            )}
          </div>
        )}
      </div>

      {/* Today's Exercises */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            Today&apos;s Exercises ({totalExercises})
          </h2>
          <Link 
            href="/exercise"
            className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            View All →
          </Link>
        </div>
        {loadingExercises ? (
          <p className="text-center text-slate-400 py-8">Loading exercises...</p>
        ) : exercises.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No exercises tracked today</p>
        ) : (
          <div className="space-y-2">
            {exercises.slice(0, 5).map((exercise) => (
              <div
                key={exercise.id}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                <Dumbbell className="w-5 h-5 text-blue-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium text-slate-700 dark:text-slate-300">{exercise.name}</div>
                  <div className="text-xs text-slate-400">
                    {exercise.sets} sets × {exercise.reps} reps
                    {exercise.duration && (
                      <span className="ml-2 inline-flex items-center gap-1">
                        <Timer className="w-3 h-3" />
                        {formatTime(exercise.duration)}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {exercises.length > 5 && (
              <p className="text-center text-sm text-slate-400 pt-2">
                +{exercises.length - 5} more exercises
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
