'use client';

import { useAuth } from '@/contexts/AuthContext';
import { AuthScreen } from '@/components/AuthScreen';
import { ChoreCard } from '@/components/ChoreCard';
import { AddChoreModal } from '@/components/AddChoreModal';
import { ProfileModal } from '@/components/ProfileModal';
import { MiniLeaderboard } from '@/components/MiniLeaderboard';
import { Chore, ChoreFrequency } from '@/types/chore';
import { Plus, Calendar, Flame, Trophy, Loader2 } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

// Droppable Column Component
function DroppableColumn({ 
  id, 
  children, 
  title, 
  count 
}: { 
  id: string; 
  children: React.ReactNode; 
  title: string; 
  count: number 
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 rounded-2xl p-4 transition-all duration-200 ${
        isOver 
          ? 'bg-indigo-50 dark:bg-indigo-950/20 ring-2 ring-indigo-300 dark:ring-indigo-600' 
          : 'bg-slate-50/80 dark:bg-slate-900/40'
      }`}
    >
      <div className="flex items-center gap-2 mb-4">
        <h3 className="font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
        <span className="text-xs bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full">
          {count}
        </span>
      </div>
      <div className="space-y-3 min-h-[200px]">{children}</div>
    </div>
  );
}

export default function Home() {
  const { user, team, isAuthenticated, isLoading, userStats, teamMembers, refreshTeamMembers } = useAuth();
  const [chores, setChores] = useState<Chore[]>([]);
  const [filter, setFilter] = useState<'mine' | 'today' | 'all'>('mine');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loadingChores, setLoadingChores] = useState(true);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

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
        // API returns { success, chores } object
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
      const response = await fetch(`/api/chores/${choreId}/toggle`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
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

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || !user) return;

    const choreId = active.id as string;
    const chore = chores.find(c => c.id === choreId);
    if (!chore) return;

    // Check if dropped in a different column
    const isOverTodo = over.id === 'todo';
    const isOverDone = over.id === 'done';

    // Only toggle if moving between columns
    if ((isOverDone && !chore.isCompleted) || (isOverTodo && chore.isCompleted)) {
      // Only the assigned user can toggle
      if (chore.assignedTo === user.id || !chore.assignedTo) {
        await handleToggleChore(choreId);
      }
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

  const todoChores = filteredChores.filter(c => !c.isCompleted);
  const doneChores = filteredChores.filter(c => c.isCompleted);

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

          {/* Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-orange-500">
              <Flame className="w-5 h-5" />
              <span className="font-bold">{userStats?.currentStreak || 0}</span>
            </div>
            <div className="flex items-center gap-1.5 text-amber-500">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">{userStats?.totalPoints || 0}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Date & Mini Leaderboard Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
            <Calendar className="w-5 h-5" />
            <span className="text-lg font-medium">{dateString}</span>
          </div>
          
          {team && <MiniLeaderboard />}
        </div>

        {/* Filter Tabs & Add Button */}
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          {[
            { key: 'mine', label: 'My Tasks' },
            { key: 'today', label: 'Today' },
            { key: 'all', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key as typeof filter)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === tab.key
                  ? 'bg-slate-800 dark:bg-slate-100 text-white dark:text-slate-900 shadow-md'
                  : 'bg-white/80 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
          
          <div className="flex-1" />
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Chore</span>
          </button>
        </div>

        {/* Kanban Board */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* To Do Column */}
            <DroppableColumn id="todo" title="To Do" count={todoChores.length}>
              <SortableContext items={todoChores.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {todoChores.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-slate-500 py-8">
                    No tasks to do 🎉
                  </p>
                ) : (
                  todoChores.map(chore => (
                    <ChoreCard
                      key={chore.id}
                      chore={chore}
                      onToggle={handleToggleChore}
                      onDelete={handleDeleteChore}
                      assignedToName={getAssigneeName(chore.assignedTo)}
                      showAssignee={filter === 'all'}
                      canToggle={chore.assignedTo === user?.id || (!chore.assignedTo && chore.userId === user?.id)}
                      currentUserId={user?.id}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableColumn>

            {/* Done Column */}
            <DroppableColumn id="done" title="Done" count={doneChores.length}>
              <SortableContext items={doneChores.map(c => c.id)} strategy={verticalListSortingStrategy}>
                {doneChores.length === 0 ? (
                  <p className="text-center text-slate-400 dark:text-slate-500 py-8">
                    Complete tasks to see them here
                  </p>
                ) : (
                  doneChores.map(chore => (
                    <ChoreCard
                      key={chore.id}
                      chore={chore}
                      onToggle={handleToggleChore}
                      onDelete={handleDeleteChore}
                      assignedToName={getAssigneeName(chore.assignedTo)}
                      showAssignee={filter === 'all'}
                      canToggle={chore.assignedTo === user?.id || (!chore.assignedTo && chore.userId === user?.id)}
                      currentUserId={user?.id}
                    />
                  ))
                )}
              </SortableContext>
            </DroppableColumn>
          </div>
        </DndContext>

        {/* Loading chores indicator */}
        {loadingChores && (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
          </div>
        )}
      </main>

      {/* Modals */}
      <AddChoreModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddChore}
        teamMembers={teamMembers}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
