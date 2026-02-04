'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Save, X, List, Lightbulb, Play, ChevronDown, ChevronUp } from 'lucide-react';

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

interface RoutineManagerProps {
  onSelectRoutine: (routine: WorkoutRoutine) => void;
}

const CATEGORIES = ['Upper Body', 'Lower Body', 'Full Body', 'Core', 'Cardio', 'Flexibility'];
const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

export function RoutineManager({ onSelectRoutine }: RoutineManagerProps) {
  const [routines, setRoutines] = useState<WorkoutRoutine[]>([]);
  const [suggestedRoutine, setSuggestedRoutine] = useState<WorkoutRoutine | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedRoutine, setExpandedRoutine] = useState<string | null>(null);
  const [newRoutine, setNewRoutine] = useState({
    name: '',
    description: '',
    category: 'Full Body',
    difficulty: 'Intermediate',
    exercises: [{ name: '', sets: 3, reps: 10, restTime: 60, notes: '' }],
  });

  useEffect(() => {
    fetchRoutines();
    fetchSuggestion();
  }, []);

  const fetchRoutines = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/routines', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setRoutines(data.routines || []);
      }
    } catch (error) {
      console.error('Failed to fetch routines:', error);
    }
  };

  const fetchSuggestion = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/routines/suggest', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });
      if (response.ok) {
        const data = await response.json();
        setSuggestedRoutine(data.suggestion);
      }
    } catch (error) {
      console.error('Failed to fetch suggestion:', error);
    }
  };

  const handleCreateRoutine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoutine.name.trim() || newRoutine.exercises.some(ex => !ex.name.trim())) return;

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('/api/routines', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(newRoutine),
      });

      if (response.ok) {
        setNewRoutine({
          name: '',
          description: '',
          category: 'Full Body',
          difficulty: 'Intermediate',
          exercises: [{ name: '', sets: 3, reps: 10, restTime: 60, notes: '' }],
        });
        setShowCreateForm(false);
        fetchRoutines();
        fetchSuggestion();
      }
    } catch (error) {
      console.error('Failed to create routine:', error);
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/routines/${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      });

      if (response.ok) {
        fetchRoutines();
        fetchSuggestion();
      }
    } catch (error) {
      console.error('Failed to delete routine:', error);
    }
  };

  const handleStartRoutine = async (routine: WorkoutRoutine) => {
    // Mark routine as used
    try {
      const token = localStorage.getItem('auth_token');
      await fetch(`/api/routines/${routine.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ markAsUsed: true }),
      });
      onSelectRoutine(routine);
      fetchRoutines();
      fetchSuggestion();
    } catch (error) {
      console.error('Failed to start routine:', error);
    }
  };

  const addExercise = () => {
    setNewRoutine({
      ...newRoutine,
      exercises: [...newRoutine.exercises, { name: '', sets: 3, reps: 10, restTime: 60, notes: '' }],
    });
  };

  const removeExercise = (index: number) => {
    setNewRoutine({
      ...newRoutine,
      exercises: newRoutine.exercises.filter((_, i) => i !== index),
    });
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updated = [...newRoutine.exercises];
    updated[index] = { ...updated[index], [field]: value };
    setNewRoutine({ ...newRoutine, exercises: updated });
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Upper Body': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
      'Lower Body': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
      'Full Body': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400',
      'Core': 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
      'Cardio': 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
      'Flexibility': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    };
    return colors[category] || 'bg-slate-100 dark:bg-slate-800';
  };

  return (
    <div className="space-y-6">
      {/* Suggested Routine */}
      {suggestedRoutine && (
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-2xl p-6 border-2 border-yellow-200 dark:border-yellow-800">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-yellow-400 dark:bg-yellow-600 rounded-xl">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-1">
                Today&apos;s Suggested Routine
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                {(suggestedRoutine as any).reason || 'Recommended for you'}
              </p>
              <div className="flex items-center gap-3 mb-3">
                <h4 className="text-xl font-bold text-slate-800 dark:text-white">{suggestedRoutine.name}</h4>
                <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getCategoryColor(suggestedRoutine.category)}`}>
                  {suggestedRoutine.category}
                </span>
                <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                  {suggestedRoutine.difficulty}
                </span>
              </div>
              {suggestedRoutine.description && (
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">{suggestedRoutine.description}</p>
              )}
              <div className="text-sm text-slate-500 dark:text-slate-400 mb-3">
                {suggestedRoutine.exercises.length} exercises
              </div>
              <button
                onClick={() => handleStartRoutine(suggestedRoutine)}
                className="px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
              >
                <Play className="w-4 h-4" />
                Start This Routine
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Routine Button */}
      {!showCreateForm && (
        <button
          onClick={() => setShowCreateForm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all font-medium"
        >
          <Plus className="w-5 h-5" />
          Create New Routine
        </button>
      )}

      {/* Create Routine Form */}
      {showCreateForm && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4">Create New Routine</h3>
          <form onSubmit={handleCreateRoutine} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Routine name *"
                value={newRoutine.name}
                onChange={(e) => setNewRoutine({ ...newRoutine, name: e.target.value })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                required
              />
              <select
                value={newRoutine.category}
                onChange={(e) => setNewRoutine({ ...newRoutine, category: e.target.value })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              >
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <textarea
                placeholder="Description (optional)"
                value={newRoutine.description}
                onChange={(e) => setNewRoutine({ ...newRoutine, description: e.target.value })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white resize-none"
                rows={2}
              />
              <select
                value={newRoutine.difficulty}
                onChange={(e) => setNewRoutine({ ...newRoutine, difficulty: e.target.value })}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
              >
                {DIFFICULTIES.map(diff => <option key={diff} value={diff}>{diff}</option>)}
              </select>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-slate-700 dark:text-slate-300">Exercises</h4>
                <button
                  type="button"
                  onClick={addExercise}
                  className="text-sm text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add Exercise
                </button>
              </div>
              {newRoutine.exercises.map((exercise, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 bg-slate-50 dark:bg-slate-900 rounded-lg">
                  <input
                    type="text"
                    placeholder="Exercise name *"
                    value={exercise.name}
                    onChange={(e) => updateExercise(index, 'name', e.target.value)}
                    className="col-span-12 md:col-span-4 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Sets"
                    value={exercise.sets}
                    onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value) || 1)}
                    className="col-span-4 md:col-span-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder="Reps"
                    value={exercise.reps}
                    onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value) || 1)}
                    className="col-span-4 md:col-span-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    min="1"
                  />
                  <input
                    type="number"
                    placeholder="Rest (s)"
                    value={exercise.restTime || ''}
                    onChange={(e) => updateExercise(index, 'restTime', e.target.value ? parseInt(e.target.value) : undefined)}
                    className="col-span-4 md:col-span-2 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                  />
                  {newRoutine.exercises.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExercise(index)}
                      className="col-span-12 md:col-span-2 px-2 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
              >
                <Save className="w-4 h-4" />
                Save Routine
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setNewRoutine({
                    name: '',
                    description: '',
                    category: 'Full Body',
                    difficulty: 'Intermediate',
                    exercises: [{ name: '', sets: 3, reps: 10, restTime: 60, notes: '' }],
                  });
                }}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Routines List */}
      {routines.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            <List className="w-5 h-5 text-blue-500" />
            My Routines ({routines.length})
          </h3>
          <div className="space-y-3">
            {routines.map((routine) => (
              <div key={routine.id} className="border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden">
                <div className="p-4 bg-slate-50 dark:bg-slate-900">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-slate-800 dark:text-white">{routine.name}</h4>
                        <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getCategoryColor(routine.category)}`}>
                          {routine.category}
                        </span>
                        <span className="px-2 py-1 rounded-lg text-xs font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {routine.difficulty}
                        </span>
                      </div>
                      {routine.description && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{routine.description}</p>
                      )}
                      <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400">
                        <span>{routine.exercises.length} exercises</span>
                        <span>Used {routine.timesUsed} times</span>
                        {routine.lastUsed && (
                          <span>Last: {new Date(routine.lastUsed).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setExpandedRoutine(expandedRoutine === routine.id ? null : routine.id)}
                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        {expandedRoutine === routine.id ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleStartRoutine(routine)}
                        className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm flex items-center gap-1"
                      >
                        <Play className="w-4 h-4" />
                        Start
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this routine?')) {
                            handleDeleteRoutine(routine.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                {expandedRoutine === routine.id && (
                  <div className="p-4 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700">
                    <h5 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Exercises:</h5>
                    <div className="space-y-2">
                      {routine.exercises.map((exercise, idx) => (
                        <div key={idx} className="flex items-center gap-3 text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded-lg">
                          <span className="font-medium text-slate-800 dark:text-white flex-1">{exercise.name}</span>
                          <span className="text-slate-600 dark:text-slate-400">{exercise.sets} × {exercise.reps}</span>
                          {exercise.restTime && (
                            <span className="text-slate-500 dark:text-slate-500 text-xs">Rest: {exercise.restTime}s</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
