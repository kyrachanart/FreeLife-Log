import React from 'react';
import { useTheme } from '../ThemeContext';

interface PhoneFrameProps {
  children: React.ReactNode;
  activeScreenTitle?: string;
  dynamicIslandContent?: React.ReactNode;
  currentTime?: string;
  isCompact?: boolean;
}

export const PhoneFrame: React.FC<PhoneFrameProps> = ({
  children,
  dynamicIslandContent,
  currentTime = '09:41',
  isCompact = false,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  return (
    <div
      className={`relative mx-auto rounded-[48px] p-3 transition-all duration-300 ${
        isWarm
          ? 'bg-stone-200/90 shadow-2xl shadow-stone-300/60 ring-1 ring-stone-300'
          : 'bg-slate-900 shadow-2xl ring-1 ring-slate-800'
      } ${isCompact ? 'w-[320px]' : 'w-[375px]'}`}
      style={{
        boxShadow: isWarm
          ? '0 25px 45px -12px rgba(120, 113, 108, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.05), inset 0 0 0 2px rgba(255, 255, 255, 0.6)'
          : '0 25px 50px -12px rgba(15, 23, 42, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.08), inset 0 0 0 2px rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Outer edge buttons simulation */}
      <div
        className={`absolute -left-[5px] top-[115px] w-[3px] h-[26px] rounded-l-sm ${
          isWarm ? 'bg-stone-300' : 'bg-slate-700'
        }`}
      />
      <div
        className={`absolute -left-[5px] top-[155px] w-[3px] h-[45px] rounded-l-sm ${
          isWarm ? 'bg-stone-300' : 'bg-slate-700'
        }`}
      />
      <div
        className={`absolute -left-[5px] top-[210px] w-[3px] h-[45px] rounded-l-sm ${
          isWarm ? 'bg-stone-300' : 'bg-slate-700'
        }`}
      />
      <div
        className={`absolute -right-[5px] top-[170px] w-[3px] h-[65px] rounded-r-sm ${
          isWarm ? 'bg-stone-300' : 'bg-slate-700'
        }`}
      />

      {/* Screen Container */}
      <div
        className={`relative rounded-[40px] overflow-hidden flex flex-col select-none transition-colors duration-300 ${
          isWarm ? 'bg-[#FAF8F5] text-stone-800' : 'bg-slate-950 text-slate-100'
        }`}
        style={{ height: isCompact ? '660px' : '760px' }}
      >
        {/* Status Bar */}
        <div
          className={`relative z-30 flex items-center justify-between px-7 pt-3.5 pb-2 text-[11px] font-semibold ${
            isWarm ? 'text-stone-600' : 'text-slate-300'
          }`}
        >
          <span>{currentTime}</span>

          {/* Dynamic Island */}
          <div
            className={`absolute left-1/2 -translate-x-1/2 top-2.5 h-[28px] px-3 rounded-full flex items-center justify-center gap-2 shadow-md transition-colors ${
              isWarm
                ? 'bg-stone-850 bg-stone-900 text-stone-100 border border-stone-700/40'
                : 'bg-black text-slate-100 border border-slate-800/80'
            }`}
          >
            {dynamicIslandContent || (
              <>
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-medium text-emerald-400">FreelanceFlow</span>
                <div className={`w-2.5 h-2.5 rounded-full ${isWarm ? 'bg-stone-600' : 'bg-slate-700'}`} />
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px]">5G</span>
            <div
              className={`w-5 h-2.5 border rounded-sm p-0.5 flex items-center ${
                isWarm ? 'border-stone-400' : 'border-slate-400'
              }`}
            >
              <div className="w-full h-full bg-emerald-500 rounded-2xs" />
            </div>
          </div>
        </div>

        {/* Screen Content Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden relative scrollbar-none flex flex-col">
          {children}
        </div>

        {/* Home Indicator Bar */}
        <div
          className={`relative z-30 pt-1 pb-2 flex justify-center backdrop-blur-xs transition-colors ${
            isWarm ? 'bg-[#FAF8F5]/90' : 'bg-slate-950/90'
          }`}
        >
          <div
            className={`w-32 h-1 rounded-full ${
              isWarm ? 'bg-stone-400/60' : 'bg-slate-500/60'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
