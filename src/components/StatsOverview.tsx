import React from 'react';
import { Files, HardDrive, Users, CheckCircle2 } from 'lucide-react';
import { formatFileSize } from '../lib/storage';

interface StatsOverviewProps {
  totalFiles: number;
  totalSize: number;
  totalClients: number;
  deliverablesCount: number;
}

export function StatsOverview({
  totalFiles,
  totalSize,
  totalClients,
  deliverablesCount,
}: StatsOverviewProps) {
  const cards = [
    {
      label: 'Total Files in Vault',
      value: totalFiles.toString(),
      subtext: 'Encrypted & client-isolated',
      icon: Files,
      color: 'text-red-700 dark:text-red-400',
      bg: 'bg-red-50 dark:bg-red-950/40 border-red-200/70 dark:border-red-900/40',
    },
    {
      label: 'Storage Consumed',
      value: formatFileSize(totalSize),
      subtext: 'High-speed cloud delivery',
      icon: HardDrive,
      color: 'text-amber-700 dark:text-amber-400',
      bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-200/70 dark:border-amber-900/30',
    },
    {
      label: 'Active Clients',
      value: totalClients.toString(),
      subtext: 'Distinct project workspaces',
      icon: Users,
      color: 'text-emerald-700 dark:text-emerald-400',
      bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/70 dark:border-emerald-900/30',
    },
    {
      label: 'Delivered Assets',
      value: deliverablesCount.toString(),
      subtext: 'Ready for client download',
      icon: CheckCircle2,
      color: 'text-rose-700 dark:text-rose-400',
      bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200/70 dark:border-rose-900/30',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <div
            key={card.label}
            className={`p-4 rounded-2xl border ${card.bg} transition-all duration-200 hover:shadow-sm`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {card.label}
              </span>
              <Icon className={`w-4 h-4 ${card.color}`} />
            </div>
            <div className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {card.value}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {card.subtext}
            </p>
          </div>
        );
      })}
    </div>
  );
}
