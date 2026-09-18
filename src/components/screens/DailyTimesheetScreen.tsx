import React, { useState } from 'react';
import { Calendar, Clock, Coffee, DollarSign, Plus, ChevronLeft, ChevronRight, Tag, ArrowRight } from 'lucide-react';
import { TimeSession } from '../../types';
import { useTheme } from '../../ThemeContext';

interface DailyTimesheetScreenProps {
  sessions: TimeSession[];
  onNavigate?: (screenId: string) => void;
}

export const DailyTimesheetScreen: React.FC<DailyTimesheetScreenProps> = ({
  sessions,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [currentDateIndex, setCurrentDateIndex] = useState(0);
  const days = ['今日 (9月16日)', '尋日 (9月15日)', '前日 (9月14日)'];

  // Aggregated metrics for today
  const totalWorkMinutes = sessions.reduce((acc, s) => acc + s.workDurationMinutes, 0);
  const totalBreakMinutes = sessions.reduce((acc, s) => acc + s.breakDurationMinutes, 0);
  const totalEarned = sessions.reduce((acc, s) => acc + s.earnedAmount, 0);
  const avgHourlyRate = totalWorkMinutes > 0 ? Math.round(totalEarned / (totalWorkMinutes / 60)) : 0;

  return (
    <div
      className={`flex-1 flex flex-col p-4 overflow-y-auto scrollbar-none transition-colors duration-300 ${
        isWarm ? 'bg-[#FAF8F5] text-stone-800' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Date Switcher Bar */}
      <div
        className={`flex items-center justify-between mb-3 rounded-2xl px-3 py-2 border transition-all ${
          isWarm
            ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/40 text-stone-800'
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <button
          onClick={() => setCurrentDateIndex((prev) => Math.min(prev + 1, days.length - 1))}
          className={`p-1 rounded-lg transition-colors ${
            isWarm ? 'hover:bg-stone-100 text-stone-500' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <ChevronLeft size={16} />
        </button>

        <div className="flex items-center gap-1.5 text-xs font-bold">
          <Calendar size={13} className={isWarm ? 'text-emerald-700' : 'text-emerald-400'} />
          <span>{days[currentDateIndex]}</span>
        </div>

        <button
          onClick={() => setCurrentDateIndex((prev) => Math.max(prev - 1, 0))}
          className={`p-1 rounded-lg transition-colors ${
            isWarm ? 'hover:bg-stone-100 text-stone-500' : 'hover:bg-slate-800 text-slate-400'
          }`}
        >
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Summary KPI Card */}
      <div
        className={`rounded-2xl p-3.5 mb-3.5 border shadow-sm transition-all ${
          isWarm
            ? 'bg-white border-stone-200 shadow-stone-200/50'
            : 'bg-gradient-to-br from-slate-900 to-slate-950 border-slate-800'
        }`}
      >
        <div className="flex justify-between items-center mb-2.5">
          <span className={`text-[11px] font-medium ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
            今日累計工時與應收
          </span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
              isWarm
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-emerald-950 text-emerald-400 border-emerald-800'
            }`}
          >
            平均實質時薪 ${avgHourlyRate}/h
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div
            className={`rounded-xl p-2 border ${
              isWarm ? 'bg-stone-50 border-stone-200/70' : 'bg-slate-950/70 border-slate-800/80'
            }`}
          >
            <div
              className={`text-[10px] flex items-center justify-center gap-1 ${
                isWarm ? 'text-stone-500' : 'text-slate-400'
              }`}
            >
              <Clock size={10} className={isWarm ? 'text-emerald-700' : 'text-emerald-400'} />
              <span>淨工時</span>
            </div>
            <div className={`font-mono font-bold text-xs mt-0.5 ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
              {Math.floor(totalWorkMinutes / 60)}h {totalWorkMinutes % 60}m
            </div>
          </div>

          <div
            className={`rounded-xl p-2 border ${
              isWarm ? 'bg-stone-50 border-stone-200/70' : 'bg-slate-950/70 border-slate-800/80'
            }`}
          >
            <div
              className={`text-[10px] flex items-center justify-center gap-1 ${
                isWarm ? 'text-stone-500' : 'text-slate-400'
              }`}
            >
              <Coffee size={10} className={isWarm ? 'text-amber-700' : 'text-amber-400'} />
              <span>休息喘息</span>
            </div>
            <div className={`font-mono font-bold text-xs mt-0.5 ${isWarm ? 'text-amber-700' : 'text-amber-300'}`}>
              {totalBreakMinutes} 分鐘
            </div>
          </div>

          <div
            className={`rounded-xl p-2 border ${
              isWarm ? 'bg-stone-50 border-stone-200/70' : 'bg-slate-950/70 border-slate-800/80'
            }`}
          >
            <div
              className={`text-[10px] flex items-center justify-center gap-1 ${
                isWarm ? 'text-stone-500' : 'text-slate-400'
              }`}
            >
              <DollarSign size={10} className={isWarm ? 'text-emerald-700' : 'text-emerald-400'} />
              <span>今日應收</span>
            </div>
            <div className={`font-mono font-bold text-xs mt-0.5 ${isWarm ? 'text-emerald-700' : 'text-emerald-400'}`}>
              +${Math.round(totalEarned).toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Visual Timeline Bar for the Day */}
      <div className="mb-3.5 space-y-1">
        <div
          className={`flex justify-between text-[10px] font-medium ${
            isWarm ? 'text-stone-500' : 'text-slate-400'
          }`}
        >
          <span>一日時間分佈條 (09:00 - 18:00)</span>
          <span className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <span>工時</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
              <span>休息</span>
            </span>
          </span>
        </div>

        {/* Visual Bar */}
        <div
          className={`w-full h-3 rounded-full flex overflow-hidden p-0.5 border ${
            isWarm ? 'bg-stone-200/90 border-stone-300' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className="bg-emerald-500 h-full rounded-l-full" style={{ width: '35%' }} />
          <div className="bg-amber-400 h-full" style={{ width: '8%' }} />
          <div className="bg-emerald-500 h-full" style={{ width: '25%' }} />
          <div className="bg-amber-400 h-full" style={{ width: '12%' }} />
          <div className="bg-emerald-500 h-full rounded-r-full" style={{ width: '20%' }} />
        </div>
      </div>

      {/* Timeline List of Sessions */}
      <div className="space-y-2.5 flex-1">
        <div
          className={`text-[11px] font-semibold flex items-center justify-between ${
            isWarm ? 'text-stone-700' : 'text-slate-300'
          }`}
        >
          <span>Timesheet 工時明細 ({sessions.length})</span>
          <button
            onClick={() => onNavigate && onNavigate('screen-timer')}
            className={`flex items-center gap-1 text-[10px] font-bold ${
              isWarm ? 'text-emerald-700 hover:text-emerald-800' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            <Plus size={11} />
            <span>開工計時</span>
          </button>
        </div>

        {sessions.map((sess) => (
          <div
            key={sess.id}
            className={`rounded-2xl p-3 border transition-all ${
              isWarm
                ? 'bg-white border-stone-200/90 shadow-xs hover:border-stone-300'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-start justify-between mb-1.5">
              <div>
                <div className={`font-bold text-xs ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
                  {sess.projectName}
                </div>
                <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
                  Client: {sess.clientName} · {sess.startTime && sess.startTime !== '--:--' ? `${sess.startTime} - ${sess.endTime}` : '手動工時'}
                </div>
              </div>

              <div className="text-right">
                <div className={`font-mono font-bold text-xs ${isWarm ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  +${Math.round(sess.earnedAmount).toLocaleString()}
                </div>
                <div className={`text-[10px] font-mono ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
                  ${sess.effectiveHourlyRate}/h
                </div>
              </div>
            </div>

            <p className={`text-[11px] leading-relaxed mb-2 ${isWarm ? 'text-stone-600' : 'text-slate-300'}`}>
              {sess.taskDescription}
            </p>

            <div
              className={`flex items-center justify-between pt-2 border-t text-[10px] ${
                isWarm ? 'border-stone-100' : 'border-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`flex items-center gap-1 font-mono ${isWarm ? 'text-stone-700' : 'text-slate-300'}`}>
                  <Clock size={10} className={isWarm ? 'text-emerald-700' : 'text-emerald-400'} />
                  <span>{Math.floor(sess.workDurationMinutes / 60)}h {sess.workDurationMinutes % 60}m 工時</span>
                </span>
                <span className={`flex items-center gap-1 font-mono ${isWarm ? 'text-amber-700' : 'text-amber-400'}`}>
                  <Coffee size={10} />
                  <span>{sess.breakDurationMinutes}m 休息</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                {sess.tags.map((t, i) => (
                  <span
                    key={i}
                    className={`px-1.5 py-0.5 rounded-md text-[9px] ${
                      isWarm ? 'bg-stone-100 text-stone-600' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
