import React from 'react';
import { AlertTriangle, Square, Trash2, Play, X, Clock } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

interface TimerRunningInterceptionModalProps {
  isOpen: boolean;
  onClose: () => void; // 繼續當前計時（取消操作）
  currentProjectName: string;
  elapsedFormatted: string;
  targetActionType: 'switch_project' | 'new_project';
  targetProjectName?: string;
  onStopAndSave: () => void; // 停止並儲存
  onDiscardAndProceed: () => void; // 直接放棄計時
}

export const TimerRunningInterceptionModal: React.FC<TimerRunningInterceptionModalProps> = ({
  isOpen,
  onClose,
  currentProjectName,
  elapsedFormatted,
  targetActionType,
  targetProjectName,
  onStopAndSave,
  onDiscardAndProceed,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-7 pb-20 sm:pb-7 shadow-2xl border transition-all relative ${
          isWarm ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Close button (Acts as Continue Timing / Cancel) */}
        <button
          onClick={onClose}
          className={`absolute top-5 right-5 p-2 rounded-full transition-colors cursor-pointer ${
            isWarm ? 'hover:bg-stone-100 text-stone-400 hover:text-stone-600' : 'hover:bg-slate-800 text-slate-500 hover:text-slate-300'
          }`}
          title="繼續當前計時"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="p-3 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 shrink-0 border border-amber-200 dark:border-amber-800">
            <AlertTriangle size={26} />
          </div>
          <div className="pr-6">
            <h3 className="text-xl font-black tracking-tight text-stone-900 dark:text-slate-100">
              ⚠️ 計時正在進行中
            </h3>
            <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 mt-1 leading-relaxed">
              你目前正在為「<span className="font-bold text-stone-800 dark:text-slate-200">{currentProjectName}</span>」計時中。請選擇如何處理當前的計時：
            </p>
          </div>
        </div>

        {/* Current Timer Status Pill */}
        <div className={`mb-6 p-3.5 rounded-2xl border flex items-center justify-between ${
          isWarm ? 'bg-amber-50/70 border-amber-200/80 text-amber-900' : 'bg-amber-950/30 border-amber-900/50 text-amber-200'
        }`}>
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Clock size={15} className="text-amber-600 dark:text-amber-400" />
            <span>當前累積時間：</span>
            <span className="font-mono text-base font-black text-amber-700 dark:text-amber-300">
              {elapsedFormatted}
            </span>
          </div>
          <div className="text-[11px] text-stone-500 dark:text-slate-400">
            {targetActionType === 'switch_project' ? (
              <span>即將切換至：<strong className="text-stone-800 dark:text-slate-200">{targetProjectName || '新專案'}</strong></span>
            ) : (
              <span>即將建立新專案</span>
            )}
          </div>
        </div>

        {/* 3 Action Buttons */}
        <div className="space-y-2.5">
          {/* Option 1: 停止並儲存 */}
          <button
            type="button"
            onClick={onStopAndSave}
            className="w-full p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white text-left transition-all cursor-pointer shadow-md shadow-emerald-600/20 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-white/20 text-white shrink-0">
                <Square size={16} className="fill-white" />
              </div>
              <div>
                <div className="text-sm font-black flex items-center gap-1.5">
                  <span>停止並儲存</span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-white/25 text-white">
                    推薦
                  </span>
                </div>
                <div className="text-xs text-emerald-100 mt-0.5">
                  自動結束計時並寫入原本專案的 Timesheet 紀錄，然後繼續執行
                </div>
              </div>
            </div>
            <span className="text-xs font-bold text-emerald-100 group-hover:translate-x-0.5 transition-transform">
              儲存 →
            </span>
          </button>

          {/* Option 2: 直接放棄計時 */}
          <button
            type="button"
            onClick={onDiscardAndProceed}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between group ${
              isWarm
                ? 'bg-stone-50 hover:bg-rose-50 border-stone-200 hover:border-rose-200 text-stone-800 hover:text-rose-700'
                : 'bg-slate-800/60 hover:bg-rose-950/40 border-slate-700 hover:border-rose-800 text-slate-200 hover:text-rose-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shrink-0 transition-colors ${
                isWarm ? 'bg-stone-200 text-stone-600 group-hover:bg-rose-100 group-hover:text-rose-600' : 'bg-slate-700 text-slate-300 group-hover:bg-rose-900 group-hover:text-rose-300'
              }`}>
                <Trash2 size={16} />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold">
                  直接放棄計時
                </div>
                <div className="text-[11px] text-stone-400 dark:text-slate-400 mt-0.5">
                  清空/取消當前這筆計時（不寫入紀錄），然後繼續執行
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-stone-400 group-hover:text-rose-500 transition-colors">
              捨棄 →
            </span>
          </button>

          {/* Option 3: 繼續當前計時 (取消操作) */}
          <button
            type="button"
            onClick={onClose}
            className={`w-full p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between ${
              isWarm
                ? 'bg-white hover:bg-stone-100 border-stone-200 text-stone-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl shrink-0 ${
                isWarm ? 'bg-stone-100 text-stone-500' : 'bg-slate-800 text-slate-400'
              }`}>
                <Play size={16} className="fill-current" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-bold">
                  繼續當前計時（取消操作）
                </div>
                <div className="text-[11px] text-stone-400 dark:text-slate-400 mt-0.5">
                  關閉提示彈窗，維持原本專案與計時狀態不變
                </div>
              </div>
            </div>
            <span className="text-xs font-medium text-stone-400">
              取消
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
