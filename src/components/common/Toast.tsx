import React from 'react';
import { useTheme } from '../../ThemeContext';

export type ToastVariant = 'emerald' | 'amber';

interface ToastProps {
  id?: string;
  message: string;
  variant?: ToastVariant;
  icon?: React.ReactNode;
}

export const Toast: React.FC<ToastProps> = ({
  id = 'app-toast',
  message,
  variant = 'emerald',
  icon,
}) => {
  const { theme } = useTheme();

  const isAmber =
    variant === 'amber' ||
    message.includes('休息') ||
    message.includes('☕') ||
    message.includes('備份') ||
    message.includes('💡') ||
    message.includes('⚠️') ||
    message.includes('🗑️');

  // Mode-coupled color styling with 40-50% alpha translucent glassmorphic backdrop and solid crisp thin border
  const borderClass = isAmber
    ? 'border border-amber-500/90 dark:border-amber-400/90'
    : 'border border-emerald-500/90 dark:border-emerald-400/90';

  const bgClass = isAmber
    ? 'bg-amber-50/45 dark:bg-amber-950/45 text-stone-900 dark:text-amber-100 shadow-amber-950/10'
    : 'bg-emerald-50/45 dark:bg-emerald-950/45 text-stone-900 dark:text-emerald-100 shadow-emerald-950/10';

  return (
    <div
      id={id}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      className={`fixed top-16 right-4 md:top-20 md:right-6 z-50 w-auto max-w-xs md:max-w-md ${borderClass} ${bgClass} backdrop-blur-xl rounded-2xl shadow-lg px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all duration-200 animate-in fade-in slide-in-from-top-2 pointer-events-auto flex items-center gap-2`}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      <span className="leading-snug break-words">{message}</span>
    </div>
  );
};

