import React from 'react';
import { motion } from 'motion/react';
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
    ? 'bg-amber-50/50 dark:bg-amber-950/50 text-stone-900 dark:text-amber-100 shadow-amber-950/15'
    : 'bg-emerald-50/50 dark:bg-emerald-950/50 text-stone-900 dark:text-emerald-100 shadow-emerald-950/15';

  // Extract leading emoji if already present in message to prevent dual icons
  const emojiMatch = message.match(/^(\p{Extended_Pictographic}|\p{Emoji_Presentation}|[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}])/u);
  
  let leadingIcon: React.ReactNode = icon;
  let displayMessage = message;

  if (icon) {
    leadingIcon = icon;
    displayMessage = message;
  } else if (emojiMatch) {
    leadingIcon = emojiMatch[0];
    displayMessage = message.slice(emojiMatch[0].length).trim();
  } else {
    leadingIcon = isAmber ? '☕' : '⏱️';
    displayMessage = message;
  }

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{
        duration: 0.35,
        ease: [0.16, 1, 0.3, 1], // iOS standard spring cubic-bezier curve
      }}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
      className={`fixed top-[68px] sm:top-[72px] left-4 right-4 md:left-auto md:right-6 z-50 w-auto md:max-w-md ${borderClass} ${bgClass} backdrop-blur-xl rounded-2xl shadow-xl py-3 px-5 text-base font-medium transition-all pointer-events-auto flex items-center justify-center md:justify-start gap-2.5`}
    >
      {leadingIcon && <span className="shrink-0 text-lg select-none">{leadingIcon}</span>}
      <span className="leading-snug break-words text-stone-900 dark:text-stone-100">{displayMessage}</span>
    </motion.div>
  );
};


