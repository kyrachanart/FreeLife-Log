import React, { useState, useEffect } from 'react';
import { Play, Pause, Coffee, Sparkles, CheckCircle2, ChevronDown, Zap, Clock, DollarSign, ArrowUpRight } from 'lucide-react';
import { Project, ProjectFeeType } from '../../types';
import { useTheme } from '../../ThemeContext';

interface TimerScreenProps {
  projects: Project[];
  activeProjectId?: string;
  onSelectProject?: (id: string) => void;
  onSaveSession?: (sessionData: any) => void;
  onNavigate?: (screenId: string) => void;
}

export const TimerScreen: React.FC<TimerScreenProps> = ({
  projects,
  activeProjectId = 'proj-1',
  onSelectProject,
  onSaveSession,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [selectedProjId, setSelectedProjId] = useState(activeProjectId);
  const [timerState, setTimerState] = useState<'idle' | 'working' | 'resting'>('working');
  const [workSeconds, setWorkSeconds] = useState(6284); // ~1h 44m 44s
  const [breakSeconds, setBreakSeconds] = useState(900); // 15m
  const [simulatedExtraHours, setSimulatedExtraHours] = useState(0);
  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);

  const currentProject = projects.find((p) => p.id === selectedProjId) || projects[0];
  const isFixed = currentProject.feeType === 'fixed';

  // Total elapsed work hours in decimal (cumulative project hours + current timer session + simulation)
  const currentSessionHours = workSeconds / 3600;
  const totalAccumulatedHours =
    Math.round((currentProject.totalWorkedHours + currentSessionHours + simulatedExtraHours) * 10) / 10;

  // 動態時薪 (Dynamic Effective Hourly Rate):
  // 一個 Job 已有總價錢，入工作時間後自動計時薪幾錢，隨住時間做得愈多就會即時自動 update！
  const dynamicEffectiveRate = isFixed
    ? Math.round(currentProject.totalContractAmount / Math.max(0.5, totalAccumulatedHours))
    : currentProject.targetHourlyRate;

  // Real-time earned income for this session:
  const sessionEarned = Math.round(
    currentSessionHours * (isFixed ? dynamicEffectiveRate : currentProject.targetHourlyRate)
  );

  // Timer interval simulation
  useEffect(() => {
    let interval: any;
    if (timerState === 'working') {
      interval = setInterval(() => {
        setWorkSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerState === 'resting') {
      interval = setInterval(() => {
        setBreakSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timerState]);

  const formatHMS = (totalSec: number) => {
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleWorkPause = () => {
    if (timerState === 'working') {
      setTimerState('resting');
    } else if (timerState === 'resting') {
      setTimerState('working');
    } else {
      setTimerState('working');
    }
  };

  const handleFinishSession = () => {
    setTimerState('idle');
    setLastSavedNotice(
      `已成功 Log 入 Timesheet！淨工時 ${Math.round(workSeconds / 60)} 分鐘，扣除休息 ${Math.round(breakSeconds / 60)} 分鐘`
    );
    if (onSaveSession) {
      onSaveSession({
        projectId: currentProject.id,
        workMinutes: Math.round(workSeconds / 60),
        breakMinutes: Math.round(breakSeconds / 60),
        earned: sessionEarned,
      });
    }
    setTimeout(() => setLastSavedNotice(null), 4000);
  };

  return (
    <div
      className={`flex-1 flex flex-col justify-between p-4 transition-colors duration-300 ${
        isWarm ? 'bg-[#FAF8F5] text-stone-800' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Top PROJECT Pill & Mode Switch */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              isWarm
                ? 'bg-white border border-stone-200 text-stone-700 shadow-xs'
                : 'bg-slate-900 border border-slate-800 text-slate-300'
            }`}
          >
            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentProject.color }} />
            <span className="truncate max-w-[120px]">Client: {currentProject.clientName}</span>
            <ChevronDown size={12} className={isWarm ? 'text-stone-400' : 'text-slate-400'} />
          </div>

          <button
            onClick={() => onNavigate && onNavigate('screen-calculator')}
            className={`flex items-center gap-1 text-[11px] font-medium px-2.5 py-1 rounded-full transition-colors ${
              isWarm
                ? 'text-emerald-800 bg-emerald-100/70 hover:bg-emerald-100 border border-emerald-300'
                : 'text-emerald-400 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-800/60'
            }`}
          >
            <Zap size={11} />
            <span>時薪算盤</span>
          </button>
        </div>

        {/* PROJECT Selector & Dynamic Rate Card */}
        <div
          className={`rounded-2xl p-3.5 border transition-all ${
            isWarm
              ? 'bg-white border-stone-200/90 shadow-sm shadow-stone-200/40'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label className={`text-[11px] font-medium ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
              當前 PROJECT 及收費模式
            </label>
            {/* Mode Badge */}
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                isFixed
                  ? isWarm
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-950/80 text-emerald-300 border-emerald-700'
                  : isWarm
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-teal-950/80 text-teal-300 border-teal-800'
              }`}
            >
              {isFixed ? '📦 一口價 (隨工時動態計時薪)' : '⏱️ Hourly 按鐘計'}
            </span>
          </div>

          <select
            value={selectedProjId}
            onChange={(e) => {
              setSelectedProjId(e.target.value);
              if (onSelectProject) onSelectProject(e.target.value);
            }}
            style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}
            className={`w-full max-w-full truncate text-xs font-semibold rounded-xl px-2.5 py-2 border outline-none transition-colors ${
              isWarm
                ? 'bg-stone-50 border-stone-300 text-stone-800 focus:ring-1 focus:ring-emerald-500'
                : 'bg-slate-800/90 border-slate-700 text-slate-100 focus:ring-1 focus:ring-emerald-500'
            }`}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="truncate">
                {p.name} · [{p.feeType === 'fixed' ? `一口價 $${p.totalContractAmount.toLocaleString()}` : `時薪 $${p.targetHourlyRate}/h`}]
              </option>
            ))}
          </select>

          {/* Dynamic Rate Live Indicator */}
          <div
            className={`mt-2.5 pt-2.5 border-t flex items-center justify-between text-xs ${
              isWarm ? 'border-stone-100' : 'border-slate-800/80'
            }`}
          >
            <div>
              <div className={`text-[11px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
                {isFixed ? '隨時間累積・實質時薪即時 Update' : '約定 Hourly Rate'}
              </div>
              {isFixed && (
                <div className={`text-[10px] mt-0.5 ${isWarm ? 'text-stone-400' : 'text-slate-500'}`}>
                  累計投入 {totalAccumulatedHours} 小時
                </div>
              )}
            </div>

            <div className="text-right">
              <div
                className={`flex items-center justify-end gap-1 font-semibold ${
                  isWarm ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              >
                <span>HKD</span>
                <span className="text-lg font-mono font-extrabold">${dynamicEffectiveRate}</span>
                <span className={`text-[10px] font-normal ${isWarm ? 'text-stone-400' : 'text-slate-400'}`}>
                  /小時
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Center Stopwatch & Dynamic Glow Ring */}
      <div className="relative my-auto flex flex-col items-center justify-center py-4">
        {/* State Glow backdrop - gentle, soft and relaxing */}
        <div
          className={`absolute w-52 h-52 rounded-full blur-3xl pointer-events-none transition-all duration-700 ${
            isWarm
              ? timerState === 'working'
                ? 'bg-emerald-300/35'
                : timerState === 'resting'
                ? 'bg-amber-300/40'
                : 'bg-stone-200/40'
              : timerState === 'working'
              ? 'bg-emerald-500/30'
              : timerState === 'resting'
              ? 'bg-amber-500/30'
              : 'bg-slate-700/20'
          }`}
        />

        {/* Status Pill */}
        <div
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold mb-4 transition-all border ${
            timerState === 'working'
              ? isWarm
                ? 'bg-emerald-100/90 text-emerald-800 border-emerald-300 shadow-xs'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-700/60 ring-1 ring-emerald-500/30'
              : timerState === 'resting'
              ? isWarm
                ? 'bg-amber-100 text-amber-900 border-amber-300 shadow-xs animate-pulse'
                : 'bg-amber-950/90 text-amber-300 border-amber-600/70 animate-pulse'
              : isWarm
              ? 'bg-stone-100 text-stone-600 border-stone-300'
              : 'bg-slate-800 text-slate-400 border-slate-700'
          }`}
        >
          {timerState === 'working' && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>🌱 專注開工中 (計入有效工時)</span>
            </>
          )}
          {timerState === 'resting' && (
            <>
              <Coffee size={13} className={isWarm ? 'text-amber-700' : 'text-amber-400'} />
              <span>☕ 暫停休息中 (自動剔除・不計入工時)</span>
            </>
          )}
          {timerState === 'idle' && <span>準備就緒，點擊開工計時</span>}
        </div>

        {/* Giant Timer Display */}
        <div className="text-center relative z-10">
          <div
            className={`text-5xl font-mono font-bold tracking-tight drop-shadow-xs ${
              isWarm ? 'text-stone-900' : 'text-slate-50'
            }`}
          >
            {formatHMS(workSeconds)}
          </div>
          <div
            className={`text-[11px] mt-1 font-medium tracking-wide ${
              isWarm ? 'text-stone-500' : 'text-slate-400'
            }`}
          >
            純工作專注時長 (淨工時)
          </div>
        </div>

        {/* Rest/Break Counter Widget */}
        <div
          className={`mt-5 w-full max-w-[290px] rounded-2xl p-3 flex items-center justify-between border transition-all ${
            isWarm
              ? 'bg-white/90 border-stone-200 shadow-xs'
              : 'bg-slate-900/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                timerState === 'resting'
                  ? isWarm
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-amber-500/20 text-amber-400'
                  : isWarm
                  ? 'bg-stone-100 text-stone-500'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Coffee size={16} />
            </div>
            <div>
              <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
                已累積休息時間
              </div>
              <div
                className={`text-xs font-mono font-semibold ${
                  isWarm ? 'text-amber-700' : 'text-amber-300'
                }`}
              >
                {formatHMS(breakSeconds)}
              </div>
            </div>
          </div>

          <div className="text-right">
            <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
              {isFixed ? '本節折算產值' : '本節已賺酬勞'}
            </div>
            <div
              className={`text-xs font-mono font-bold ${
                isWarm ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              +${sessionEarned.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Notification pill if saved */}
        {lastSavedNotice && (
          <div
            className={`mt-3 flex items-center gap-1.5 text-xs px-3.5 py-1.5 rounded-xl border animate-fade-in ${
              isWarm
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs'
                : 'bg-emerald-950 border-emerald-700 text-emerald-300'
            }`}
          >
            <CheckCircle2 size={14} />
            <span>{lastSavedNotice}</span>
          </div>
        )}
      </div>

      {/* Bottom Action Controls */}
      <div className="space-y-2.5 pt-2">
        {/* Fast Break presets buttons (if working) */}
        {timerState === 'working' && (
          <div
            className={`flex items-center justify-center gap-2 text-[11px] ${
              isWarm ? 'text-stone-500' : 'text-slate-400'
            }`}
          >
            <span>隨時暫停：</span>
            <button
              onClick={() => {
                setTimerState('resting');
                setBreakSeconds((prev) => prev + 300); // add 5m
              }}
              className={`px-2.5 py-0.5 rounded-lg border text-amber-700 transition-colors ${
                isWarm
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
              }`}
            >
              +5m 伸展
            </button>
            <button
              onClick={() => {
                setTimerState('resting');
                setBreakSeconds((prev) => prev + 900); // add 15m
              }}
              className={`px-2.5 py-0.5 rounded-lg border text-amber-700 transition-colors ${
                isWarm
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
              }`}
            >
              +15m 咖啡
            </button>
            <button
              onClick={() => {
                setTimerState('resting');
                setBreakSeconds((prev) => prev + 2700); // add 45m
              }}
              className={`px-2.5 py-0.5 rounded-lg border text-amber-700 transition-colors ${
                isWarm
                  ? 'bg-amber-50 hover:bg-amber-100 border-amber-200'
                  : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-amber-400'
              }`}
            >
              +45m 食飯
            </button>
          </div>
        )}

        {/* Primary Controls */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Pause / Resume Button */}
          <button
            onClick={handleToggleWorkPause}
            className={`py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] ${
              timerState === 'working'
                ? isWarm
                  ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                  : 'bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold'
                : isWarm
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {timerState === 'working' ? (
              <>
                <Coffee size={16} />
                <span>隨時暫停休息</span>
              </>
            ) : (
              <>
                <Play size={16} />
                <span>結束休息・繼續開工</span>
              </>
            )}
          </button>

          {/* Finish / Save Button */}
          <button
            onClick={handleFinishSession}
            className={`py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${
              isWarm
                ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            <CheckCircle2 size={16} className={isWarm ? 'text-emerald-700' : 'text-emerald-400'} />
            <span>完成・Log 入 Timesheet</span>
          </button>
        </div>
      </div>
    </div>
  );
};
