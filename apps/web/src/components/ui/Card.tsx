import React from 'react';
import { triggerHaptic } from '../../lib/haptics';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  interactive?: boolean;
  elevation?: 'flat' | 'raised' | 'floating';
  noPadding?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  interactive = false,
  elevation = 'flat',
  noPadding = false,
  onClick,
  className = '',
  ...props
}) => {
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (interactive) {
      triggerHaptic(10);
    }
    onClick?.(e);
  };

  const elevationStyles = {
    flat: 'bg-white dark:bg-[#111625] border border-slate-200/80 dark:border-slate-800 shadow-2xs',
    raised:
      'bg-white dark:bg-[#131D31] border border-slate-200/90 dark:border-slate-700/80 shadow-sm hover:shadow-md',
    floating:
      'bg-white dark:bg-[#15203B] border border-slate-200 dark:border-slate-700 shadow-lg'
  }[elevation];

  const interactiveStyles = interactive
    ? 'cursor-pointer select-none transition-all duration-150 hover:border-slate-300 dark:hover:border-slate-600 active:scale-[0.99]'
    : '';

  const paddingStyle = noPadding ? '' : 'p-4 sm:p-5';

  return (
    <div
      onClick={handleClick}
      className={`rounded-2xl sm:rounded-3xl ${elevationStyles} ${interactiveStyles} ${paddingStyle} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
