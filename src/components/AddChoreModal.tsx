'use client';

import { useState, useEffect } from 'react';
import { Chore, ChoreFrequency } from '@/types/chore';
import { User } from '@/types/user';
import { POINTS_CONFIG } from '@/types/gamification';
import { X, Zap, Users, Calendar } from 'lucide-react';

interface ChoreFormData {
  title: string;
  description?: string;
  frequency: ChoreFrequency;
  dayOfWeek?: number;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  startDate?: string;
  assignedTo?: string;
}

interface AddChoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (chore: ChoreFormData) => void;
  onEdit?: (choreId: string, chore: ChoreFormData) => void;
  editingChore?: Chore | null;
  teamMembers?: User[];
}

export function AddChoreModal({ isOpen, onClose, onAdd, onEdit, editingChore, teamMembers = [] }: AddChoreModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<ChoreFrequency>('daily');
  const [dayOfWeek, setDayOfWeek] = useState<number>(0);
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([]);
  const [dayOfMonth, setDayOfMonth] = useState<number>(1);
  const [startDate, setStartDate] = useState<string>('');
  const [assignedTo, setAssignedTo] = useState<string>('');
  const [useMultipleDays, setUseMultipleDays] = useState(false);

  const isEditing = !!editingChore;
  const points = POINTS_CONFIG[frequency];

  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const toggleDayOfWeek = (day: number) => {
    setDaysOfWeek(prev => 
      prev.includes(day) 
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  // Populate form when editing
  useEffect(() => {
    if (editingChore) {
      setTitle(editingChore.title);
      setDescription(editingChore.description || '');
      setFrequency(editingChore.frequency);
      setDayOfWeek(editingChore.dayOfWeek ?? 0);
      setDaysOfWeek(editingChore.daysOfWeek ?? []);
      setUseMultipleDays((editingChore.daysOfWeek?.length ?? 0) > 0);
      setDayOfMonth(editingChore.dayOfMonth ?? 1);
      setStartDate(editingChore.startDate ? editingChore.startDate.split('T')[0] : '');
      setAssignedTo(editingChore.assignedTo || '');
    } else {
      resetForm();
    }
  }, [editingChore]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFrequency('daily');
    setDayOfWeek(0);
    setDaysOfWeek([]);
    setUseMultipleDays(false);
    setDayOfMonth(1);
    setStartDate('');
    setAssignedTo('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;

    // Validate multi-day selection
    if ((frequency === 'weekly' || frequency === 'biweekly') && useMultipleDays && daysOfWeek.length === 0) {
      return; // Don't submit if no days selected
    }

    const choreData: ChoreFormData = {
      title: title.trim(),
      description: description.trim() || undefined,
      frequency,
      dayOfWeek: (frequency === 'weekly' || frequency === 'biweekly') && !useMultipleDays ? dayOfWeek : undefined,
      daysOfWeek: (frequency === 'weekly' || frequency === 'biweekly') && useMultipleDays ? daysOfWeek : undefined,
      dayOfMonth: frequency === 'monthly' ? dayOfMonth : undefined,
      startDate: frequency !== 'daily' && startDate ? startDate : undefined,
      assignedTo: assignedTo || undefined,
    };

    if (isEditing && onEdit) {
      onEdit(editingChore.id, choreData);
    } else {
      onAdd(choreData);
    }
    
    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200/80 dark:border-slate-800/80 overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200/70 dark:border-slate-800/70 bg-slate-50/70 dark:bg-slate-900/70">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {isEditing ? 'Edit' : 'Create'}
            </p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isEditing ? 'Edit Chore' : 'Add New Chore'}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <Zap className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span className="text-sm font-bold text-amber-700 dark:text-amber-300">+{points} pts</span>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 rounded-full p-2 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Chore Title *
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
              placeholder="e.g., Vacuum the living room"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Description (optional)
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
              placeholder="Add details about this chore..."
              rows={3}
            />
          </div>

          <div>
            <label htmlFor="frequency" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
              Frequency *
            </label>
            <select
              id="frequency"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as ChoreFrequency)}
              className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Bi-Weekly (Every 2 weeks)</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          {(frequency === 'weekly' || frequency === 'biweekly') && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="useMultipleDays"
                  checked={useMultipleDays}
                  onChange={(e) => setUseMultipleDays(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <label htmlFor="useMultipleDays" className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Multiple days per week
                </label>
              </div>

              {useMultipleDays ? (
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                    Select Days *
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {DAY_NAMES.map((day, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => toggleDayOfWeek(index)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          daysOfWeek.includes(index)
                            ? 'bg-indigo-600 text-white shadow-md'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {day}
                      </button>
                    ))}
                  </div>
                  {daysOfWeek.length === 0 && (
                    <p className="text-xs text-red-500 mt-1">Please select at least one day</p>
                  )}
                </div>
              ) : (
                <div>
                  <label htmlFor="dayOfWeek" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                    Day of Week *
                  </label>
                  <select
                    id="dayOfWeek"
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={2}>Tuesday</option>
                    <option value={3}>Wednesday</option>
                    <option value={4}>Thursday</option>
                    <option value={5}>Friday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              )}
            </div>
          )}

          {frequency === 'monthly' && (
            <div>
              <label htmlFor="dayOfMonth" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                Day of Month *
              </label>
              <input
                id="dayOfMonth"
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
              />
            </div>
          )}

          {frequency !== 'daily' && (
            <div>
              <label htmlFor="startDate" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Start Date (optional)
                </span>
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {frequency === 'biweekly' 
                  ? 'The chore will appear every 2 weeks starting from this date'
                  : 'The chore will only appear starting from this date'
                }
              </p>
            </div>
          )}

          {teamMembers.length > 0 && (
            <div>
              <label htmlFor="assignedTo" className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-1">
                <span className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  Assign To (optional)
                </span>
              </label>
              <select
                id="assignedTo"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/40 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
              >
                <option value="">Anyone can complete</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-500 hover:to-purple-500 transition-all font-semibold shadow-lg shadow-indigo-500/20"
            >
              {isEditing ? 'Save Changes' : 'Add Chore'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
