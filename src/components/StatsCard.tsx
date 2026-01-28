'use client';

import { ChoreStats } from '@/types/chore';
import { CheckCircle2, ListTodo, TrendingUp, Award } from 'lucide-react';

interface StatsCardProps {
  stats: ChoreStats;
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <StatItem
        icon={<ListTodo className="w-6 h-6" />}
        label="Total Chores"
        value={stats.totalChores}
        color="from-blue-500 to-indigo-500"
      />
      <StatItem
        icon={<CheckCircle2 className="w-6 h-6" />}
        label="Today"
        value={stats.completedToday}
        color="from-emerald-500 to-teal-500"
      />
      <StatItem
        icon={<TrendingUp className="w-6 h-6" />}
        label="This Week"
        value={stats.completedThisWeek}
        color="from-purple-500 to-fuchsia-500"
      />
      <StatItem
        icon={<Award className="w-6 h-6" />}
        label="Completion"
        value={`${stats.completionRate}%`}
        color="from-amber-500 to-orange-500"
      />
    </div>
  );
}

function StatItem({ icon, label, value, color }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div className="group rounded-2xl border border-slate-200/70 dark:border-slate-800/70 bg-white/80 dark:bg-slate-900/70 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-center gap-3">
        <div className={`bg-gradient-to-br ${color} p-2.5 rounded-xl text-white shadow-sm shadow-black/10`}>
          {icon}
        </div>
        <div>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">{value}</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
        </div>
      </div>
    </div>
  );
}
