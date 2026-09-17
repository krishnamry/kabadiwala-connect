import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'emerald' | 'copper' | 'amber' | 'slate' | 'rose';
  withDot?: boolean;
  pulseDot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'emerald',
  withDot = false,
  pulseDot = false,
  className = ''
}) => {
  const variantStyles = {
    emerald:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
    copper:
      'bg-orange-50 dark:bg-orange-950/60 text-orange-900 dark:text-orange-300 border-orange-200/80 dark:border-orange-800/60',
    amber:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
    slate:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    rose:
      'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60'
  }[variant];

  const dotStyles = {
    emerald: 'bg-emerald-500',
    copper: 'bg-orange-500',
    amber: 'bg-amber-500',
    slate: 'bg-slate-400',
    rose: 'bg-rose-500'
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${variantStyles} ${className}`}
    >
      {withDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${dotStyles} ${
            pulseDot ? 'animate-pulse' : ''
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
};
