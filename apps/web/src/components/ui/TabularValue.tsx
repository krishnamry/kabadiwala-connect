import React from 'react';

export interface TabularValueProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const TabularValue: React.FC<TabularValueProps> = ({
  value,
  prefix = '',
  suffix = '',
  size = 'md',
  trend = 'neutral',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'text-xs',
    md: 'text-sm font-semibold',
    lg: 'text-lg font-bold',
    xl: 'text-2xl font-black tracking-tight',
    '2xl': 'text-3xl sm:text-4xl font-black tracking-tight'
  }[size];

  const trendStyles = {
    up: 'text-emerald-700 dark:text-emerald-400',
    down: 'text-rose-600 dark:text-rose-400',
    neutral: 'text-slate-900 dark:text-slate-100'
  }[trend];

  const formattedValue =
    typeof value === 'number'
      ? value.toLocaleString('en-IN')
      : String(value);

  return (
    <span
      className={`font-mono inline-flex items-baseline gap-0.5 select-none ${sizeStyles} ${trendStyles} ${className}`}
      style={{ fontVariantNumeric: 'tabular-nums lining-nums' }}
    >
      {prefix && <span className="opacity-80 font-sans text-[0.85em] font-medium">{prefix}</span>}
      <span>{formattedValue}</span>
      {suffix && <span className="opacity-70 font-sans text-[0.75em] font-normal ml-0.5">{suffix}</span>}
    </span>
  );
};
