import React, { useRef, useState, useEffect } from 'react';

interface MarqueeTextProps {
  text: string;
  className?: string;
  containerClassName?: string;
}

export const MarqueeText: React.FC<MarqueeTextProps> = ({
  text,
  className = '',
  containerClassName = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const diff = textRef.current.scrollWidth - containerRef.current.clientWidth;
        setOverflowDistance(diff > 2 ? diff : 0);
      }
    };

    // Initial check + delayed check to allow font rendering & layout recalculation
    checkOverflow();
    const timeoutId = setTimeout(checkOverflow, 150);

    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  const isOverflowing = overflowDistance > 0;

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap ${containerClassName}`}
    >
      <span
        ref={textRef}
        className={`inline-block whitespace-nowrap ${className}`}
        style={
          isOverflowing
            ? ({
                animation: 'marqueePingPong 8s ease-in-out infinite',
                '--marquee-offset': `-${overflowDistance + 6}px`,
              } as React.CSSProperties)
            : undefined
        }
      >
        {text}
      </span>
    </div>
  );
};
