import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { useTheme } from '../../ThemeContext';

export type ToastVariant = 'emerald' | 'amber';

interface ToastProps {
  id?: string;
  message: string;
  variant?: ToastVariant;
  icon?: React.ReactNode;
  onClose?: () => void;
}

export const Toast: React.FC<ToastProps> = ({
  id = 'app-toast',
  message,
  variant = 'emerald',
  icon,
  onClose,
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

  // Conditional Auto-Marquee: Check if text width exceeds available container width
  const textContainerRef = useRef<HTMLDivElement>(null);
  const textSpanRef = useRef<HTMLSpanElement>(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (textContainerRef.current && textSpanRef.current) {
        const diff = textSpanRef.current.scrollWidth - textContainerRef.current.clientWidth;
        setOverflowDistance(diff > 2 ? diff : 0);
      }
    };

    checkOverflow();
    const rafId = requestAnimationFrame(checkOverflow);
    const timeoutId = setTimeout(checkOverflow, 120);

    window.addEventListener('resize', checkOverflow);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [displayMessage]);

  // Touch Gesture tracking: Swipe Up (DeltaY < -30px) & Swipe Right (DeltaX > 40px)
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dismissDirection, setDismissDirection] = useState<'up' | 'right' | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (dismissDirection) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || dismissDirection) return;
    const touch = e.touches[0];
    const rawDeltaX = touch.clientX - touchStartRef.current.x;
    const rawDeltaY = touch.clientY - touchStartRef.current.y;

    // Fluid drag feedback:
    // Allow dragging upwards (negative Y) and rightwards (positive X) freely, with damping in opposite directions
    const clampedX = rawDeltaX > 0 ? rawDeltaX : rawDeltaX * 0.15;
    const clampedY = rawDeltaY < 0 ? rawDeltaY : rawDeltaY * 0.15;

    setDragOffset({ x: clampedX, y: clampedY });
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current || dismissDirection) return;
    const { x: currentX, y: currentY } = dragOffset;
    setIsDragging(false);

    // Thresholds:
    // 1. 向上滑動 (DeltaY < -30px)
    // 2. 向右滑動 (DeltaX > 40px)
    if (currentY < -30) {
      setDismissDirection('up');
      setTimeout(() => {
        onClose?.();
      }, 220);
    } else if (currentX > 40) {
      setDismissDirection('right');
      setTimeout(() => {
        onClose?.();
      }, 220);
    } else {
      // Spring rebound back to original position
      setDragOffset({ x: 0, y: 0 });
    }
    touchStartRef.current = null;
  };

  const isOverflowing = overflowDistance > 0;

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: -20, scale: 0.96 }}
      animate={{
        opacity: dismissDirection ? 0 : 1,
        y: dismissDirection === 'up' ? -90 : 0,
        x: dismissDirection === 'right' ? 350 : 0,
        scale: dismissDirection ? 0.94 : 1,
      }}
      exit={{ opacity: 0, y: -16, scale: 0.96 }}
      transition={{
        duration: dismissDirection ? 0.22 : 0.35,
        ease: [0.16, 1, 0.3, 1],
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        transform: isDragging && !dismissDirection
          ? `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`
          : undefined,
        transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.2s ease',
        touchAction: 'none',
      }}
      className={`fixed top-[68px] sm:top-[72px] left-4 right-4 md:left-auto md:right-6 z-50 w-auto max-w-[calc(100vw-32px)] md:max-w-md overflow-hidden ${borderClass} ${bgClass} backdrop-blur-xl rounded-2xl shadow-xl py-3 px-4 text-base font-medium pointer-events-auto flex items-center justify-center md:justify-start gap-2.5 cursor-grab active:cursor-grabbing select-none`}
    >
      {leadingIcon && (
        <span className="shrink-0 text-lg select-none pointer-events-none flex items-center">
          {leadingIcon}
        </span>
      )}
      <div
        ref={textContainerRef}
        className="flex-1 min-w-0 overflow-hidden whitespace-nowrap flex items-center"
      >
        <span
          ref={textSpanRef}
          className="inline-block whitespace-nowrap leading-none text-stone-900 dark:text-stone-100 pointer-events-none"
          style={
            isOverflowing
              ? ({
                  animation: 'marquee 8s linear infinite',
                  '--marquee-offset': `-${overflowDistance + 8}px`,
                } as React.CSSProperties)
              : undefined
          }
        >
          {displayMessage}
        </span>
      </div>
    </motion.div>
  );
};
