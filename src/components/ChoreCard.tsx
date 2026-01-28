'use client';

import { Chore } from '@/types/chore';
import { getFrequencyLabel, getDayName } from '@/lib/utils';
import { getPointsForChore } from '@/lib/gamification';
import { CheckCircle2, Circle, Trash2, Calendar, Clock, Zap, User, GripVertical, Lock } from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ChoreCardProps {
  chore: Chore;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  assignedToName?: string;
  showAssignee?: boolean;
  canToggle?: boolean;
  currentUserId?: string;
}

export function ChoreCard({ chore, onToggle, onDelete, assignedToName, showAssignee, canToggle = true, currentUserId }: ChoreCardProps) {
  const points = getPointsForChore(chore.frequency);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chore.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const getScheduleInfo = () => {
    if (chore.frequency === 'weekly' && chore.dayOfWeek !== undefined) {
      return `Every ${getDayName(chore.dayOfWeek)}`;
    }
    if (chore.frequency === 'biweekly' && chore.dayOfWeek !== undefined) {
      return `Every other ${getDayName(chore.dayOfWeek)}`;
    }
    if (chore.frequency === 'monthly' && chore.dayOfMonth) {
      return `${chore.dayOfMonth}${getOrdinalSuffix(chore.dayOfMonth)} of each month`;
    }
    return getFrequencyLabel(chore.frequency);
  };

  const getOrdinalSuffix = (day: number) => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  const getFrequencyColor = () => {
    switch (chore.frequency) {
      case 'daily': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200';
      case 'weekly': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200';
      case 'biweekly': return 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-200';
      case 'monthly': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200';
    }
  };

  const getFrequencyAccent = () => {
    switch (chore.frequency) {
      case 'daily': return 'from-blue-500 to-indigo-500';
      case 'weekly': return 'from-emerald-500 to-teal-500';
      case 'biweekly': return 'from-teal-500 to-cyan-500';
      case 'monthly': return 'from-purple-500 to-fuchsia-500';
    }
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`group relative overflow-hidden rounded-2xl border transition-all shadow-sm hover:shadow-lg ${
        chore.isCompleted
          ? 'bg-slate-50/80 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-800/70'
          : 'bg-white/90 dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/70'
      } ${isDragging ? 'shadow-xl ring-2 ring-indigo-500/50' : ''}`}
    >
      <div className={`absolute left-0 top-0 h-full w-1 bg-gradient-to-b ${getFrequencyAccent()}`} />
      <div className="flex items-start gap-2 p-4 sm:p-5">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="mt-1 flex-shrink-0 p-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 rounded transition-colors touch-none"
          aria-label="Drag to reorder"
        >
          <GripVertical className="w-5 h-5" />
        </button>
        
        {/* Toggle Button */}
        <button
          onClick={() => canToggle && onToggle(chore.id)}
          disabled={!canToggle}
          className={`mt-0.5 flex-shrink-0 rounded-full p-1.5 transition-all ${
            canToggle 
              ? 'hover:scale-110 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer' 
              : 'cursor-not-allowed opacity-60'
          }`}
          aria-label={chore.isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          title={canToggle ? undefined : 'Only the assigned person can complete this chore'}
        >
          {chore.isCompleted ? (
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          ) : canToggle ? (
            <Circle className="w-6 h-6 text-slate-400 dark:text-slate-500" />
          ) : (
            <Lock className="w-6 h-6 text-slate-300 dark:text-slate-600" />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold text-lg ${
            chore.isCompleted
              ? 'line-through text-slate-500 dark:text-slate-400'
              : 'text-slate-900 dark:text-white'
          }`}>
            {chore.title}
          </h3>
          
          {chore.description && (
            <p className={`text-sm mt-1 ${
              chore.isCompleted
                ? 'text-slate-400 dark:text-slate-500'
                : 'text-slate-600 dark:text-slate-400'
            }`}>
              {chore.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mt-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${getFrequencyColor()}`}>
              <Calendar className="w-3 h-3" />
              {getScheduleInfo()}
            </span>
            
            {/* Points Badge */}
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
              <Zap className="w-3 h-3" />
              +{points} pts
            </span>

            {showAssignee && assignedToName && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200">
                <User className="w-3 h-3" />
                {assignedToName}
              </span>
            )}
            
            {chore.lastCompleted && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                <Clock className="w-3 h-3" />
                Last: {new Date(chore.lastCompleted).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>

        <button
          onClick={() => onDelete(chore.id)}
          className="flex-shrink-0 p-2 text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 rounded-lg transition-all hover:bg-rose-50/80 dark:hover:bg-rose-500/10 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
          aria-label="Delete chore"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
