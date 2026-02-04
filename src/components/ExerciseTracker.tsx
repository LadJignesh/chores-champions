'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, Edit2, Timer, Play, Pause, RotateCcw, Save, X, Dumbbell } from 'lucide-react';

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

interface SelectedRoutine {
  id: string;
  name: string;
  description?: string;
  category: string;
  difficulty: string;
  exercises: RoutineExercise[];
}

interface ExerciseTrackerProps {
  exercises: Exercise[];
  currentUserId: string;
  onAddExercise: (exercise: {
    name: string;
    sets: number;
    reps: number;
    duration?: number;
    notes?: string;
  }) => Promise<void>;
  onUpdateExercise: (
    id: string,
    updates: { name: string; sets: number; reps: number; duration?: number; notes?: string }
  ) => Promise<void>;
  onDeleteExercise: (id: string) => Promise<void>;
  selectedRoutine?: SelectedRoutine | null;
}

export function ExerciseTracker({
  exercises,
  currentUserId,
  onAddExercise,
  onUpdateExercise,
  onDeleteExercise,
  selectedRoutine,
}: ExerciseTrackerProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [routineExerciseIndex, setRoutineExerciseIndex] = useState(0);
  const [newExercise, setNewExercise] = useState({
    name: '',
    sets: 3,
    reps: 10,
    duration: 0,
    notes: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    sets: 3,
    reps: 10,
    duration: 0,
    notes: '',
  });

  // Timer states
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentReps, setCurrentReps] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  // Load routine exercise when selected or index changes
  useEffect(() => {
    if (selectedRoutine && selectedRoutine.exercises.length > 0) {
      const currentExercise = selectedRoutine.exercises[routineExerciseIndex];
      if (currentExercise) {
        setNewExercise({
          name: currentExercise.name,
          sets: currentExercise.sets,
          reps: currentExercise.reps,
          duration: 0,
          notes: currentExercise.notes || '',
        });
        setShowAddForm(true);
        handleResetTimer();
      }
    }
  }, [selectedRoutine, routineExerciseIndex]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    setTimerActive(true);
  };

  const handlePauseTimer = () => {
    setTimerActive(false);
  };

  const handleResetTimer = () => {
    setTimerActive(false);
    setTimerSeconds(0);
    setCurrentSet(1);
    setCurrentReps(0);
  };

  const handleNextSet = () => {
    if (currentSet < newExercise.sets) {
      setCurrentSet((prev) => prev + 1);
      setCurrentReps(0);
    }
  };

  const handleAddRep = () => {
    if (currentReps < newExercise.reps) {
      setCurrentReps((prev) => prev + 1);
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newExercise.name.trim()) return;

    await onAddExercise({
      name: newExercise.name,
      sets: newExercise.sets,
      reps: newExercise.reps,
      duration: timerSeconds > 0 ? timerSeconds : undefined,
      notes: newExercise.notes || undefined,
    });

    // If working from a routine, move to next exercise
    if (selectedRoutine && routineExerciseIndex < selectedRoutine.exercises.length - 1) {
      setRoutineExerciseIndex(prev => prev + 1);
    } else {
      setNewExercise({ name: '', sets: 3, reps: 10, duration: 0, notes: '' });
      setShowAddForm(false);
      setRoutineExerciseIndex(0);
    }
    handleResetTimer();
  };

  const handleEditSubmit = async (id: string) => {
    if (!editForm.name.trim()) return;

    await onUpdateExercise(id, {
      name: editForm.name,
      sets: editForm.sets,
      reps: editForm.reps,
      duration: editForm.duration || undefined,
      notes: editForm.notes || undefined,
    });

    setEditingId(null);
  };

  const startEdit = (exercise: Exercise) => {
    setEditingId(exercise.id);
    setEditForm({
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      duration: exercise.duration || 0,
      notes: exercise.notes || '',
    });
  };

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets, 0);
  const totalReps = exercises.reduce((sum, ex) => sum + ex.sets * ex.reps, 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-4 text-white">
          <div className="text-sm opacity-90">Exercises</div>
          <div className="text-2xl font-bold">{exercises.length}</div>
        </div>
        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-4 text-white">
          <div className="text-sm opacity-90">Total Sets</div>
          <div className="text-2xl font-bold">{totalSets}</div>
        </div>
        <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl p-4 text-white">
          <div className="text-sm opacity-90">Total Reps</div>
          <div className="text-2xl font-bold">{totalReps}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-4 text-white">
          <div className="text-sm opacity-90">Active Time</div>
          <div className="text-2xl font-bold">{formatTime(timerSeconds)}</div>
        </div>
      </div>

      {/* Add Exercise Section */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Exercise
          </button>
        ) : (
          <div className="space-y-4">
            {/* Routine Info Banner */}
            {selectedRoutine && (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-4 border border-purple-200 dark:border-purple-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-800 dark:text-white">
                      {selectedRoutine.name}
                    </h3>
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Exercise {routineExerciseIndex + 1} of {selectedRoutine.exercises.length}
                    </p>
                  </div>
                  <div className="text-sm px-3 py-1 bg-purple-500 text-white rounded-full font-medium">
                    {selectedRoutine.category}
                  </div>
                </div>
              </div>
            )}
            
            {/* Timer Controls */}
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700">
              <div className="text-center mb-4">
                <div className="text-5xl font-bold text-slate-800 dark:text-white mb-2">
                  {formatTime(timerSeconds)}
                </div>
                <div className="text-sm text-slate-500 dark:text-slate-400">
                  Set {currentSet} of {newExercise.sets} • Rep {currentReps} of {newExercise.reps}
                </div>
              </div>
              <div className="flex gap-2 justify-center">
                {!timerActive ? (
                  <button
                    onClick={handleStartTimer}
                    className="px-6 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start
                  </button>
                ) : (
                  <button
                    onClick={handlePauseTimer}
                    className="px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Pause className="w-4 h-4" />
                    Pause
                  </button>
                )}
                <button
                  onClick={handleResetTimer}
                  className="px-6 py-2 bg-slate-500 hover:bg-slate-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </button>
              </div>
              <div className="flex gap-2 justify-center mt-3">
                <button
                  onClick={handleAddRep}
                  disabled={currentReps >= newExercise.reps}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  +1 Rep
                </button>
                <button
                  onClick={handleNextSet}
                  disabled={currentSet >= newExercise.sets}
                  className="px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next Set
                </button>
              </div>
            </div>

            {/* Exercise Form */}
            <form onSubmit={handleAddSubmit} className="space-y-3">
              <input
                type="text"
                placeholder="Exercise name *"
                value={newExercise.name}
                onChange={(e) => setNewExercise({ ...newExercise, name: e.target.value })}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                autoFocus
              />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Sets</label>
                  <input
                    type="number"
                    min="1"
                    value={newExercise.sets}
                    onChange={(e) => setNewExercise({ ...newExercise, sets: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">Reps</label>
                  <input
                    type="number"
                    min="1"
                    value={newExercise.reps}
                    onChange={(e) => setNewExercise({ ...newExercise, reps: parseInt(e.target.value) || 1 })}
                    className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-white"
                  />
                </div>
              </div>
              <textarea
                placeholder="Notes (optional)"
                value={newExercise.notes}
                onChange={(e) => setNewExercise({ ...newExercise, notes: e.target.value })}
                className="w-full px-4 py-2 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Exercise
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddForm(false);
                    setNewExercise({ name: '', sets: 3, reps: 10, duration: 0, notes: '' });
                    handleResetTimer();
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Exercise List */}
      {exercises.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-blue-500" />
            Today&apos;s Exercises ({exercises.length})
          </h2>
          <div className="space-y-3">
            {exercises.map((exercise) => (
              <div
                key={exercise.id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                {editingId === exercise.id ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Sets"
                        value={editForm.sets}
                        onChange={(e) => setEditForm({ ...editForm, sets: parseInt(e.target.value) || 1 })}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                      />
                      <input
                        type="number"
                        placeholder="Reps"
                        value={editForm.reps}
                        onChange={(e) => setEditForm({ ...editForm, reps: parseInt(e.target.value) || 1 })}
                        className="px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white"
                      />
                    </div>
                    <textarea
                      placeholder="Notes"
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 resize-none"
                      rows={2}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditSubmit(exercise.id)}
                        className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-slate-800 dark:text-white">{exercise.name}</h3>
                      <div className="flex gap-3 mt-1 text-sm text-slate-600 dark:text-slate-400">
                        <span>{exercise.sets} sets × {exercise.reps} reps</span>
                        {exercise.duration && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Timer className="w-3 h-3" />
                              {formatTime(exercise.duration)}
                            </span>
                          </>
                        )}
                      </div>
                      {exercise.notes && (
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{exercise.notes}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => startEdit(exercise)}
                        className="p-2 text-slate-400 hover:text-blue-500 transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Delete this exercise?')) {
                            onDeleteExercise(exercise.id);
                          }
                        }}
                        className="p-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
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
