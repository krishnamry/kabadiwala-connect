import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { triggerHaptic } from '../../lib/haptics';

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  maxHeight?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxHeight = 'max-h-[85vh]'
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);

  // Defensive Invariant #2: Android Hardware Back Button Stack Integration
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Capacitor native back-button handling
    const handlePopState = () => {
      if (isOpen) {
        onClose();
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Prevent background scrolling when open
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('popstate', handlePopState);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Frosted Backdrop Scrim */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-fade-in"
        onClick={() => {
          triggerHaptic(10);
          onClose();
        }}
        aria-hidden="true"
      />

      {/* Elevated Bottom Sheet Container */}
      <div
        ref={sheetRef}
        className={`relative z-10 w-full max-w-lg mx-auto bg-white dark:bg-[#111625] rounded-t-[32px] border-t border-slate-200/90 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col ${maxHeight} animate-in slide-in-from-bottom duration-200`}
      >
        {/* Tactile Drag Handle Pill */}
        <div className="pt-3 pb-2 flex justify-center shrink-0 cursor-grab">
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full" />
        </div>

        {/* Sheet Header */}
        {(title || subtitle) && (
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
            <div>
              {title && (
                <h3 className="text-lg font-display font-extrabold text-slate-900 dark:text-white">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                triggerHaptic(10);
                onClose();
              }}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close sheet"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Scrollable Content Body */}
        <div className="px-6 py-4 overflow-y-auto overscroll-contain flex-1">
          {children}
        </div>
      </div>
    </div>
  );
};
