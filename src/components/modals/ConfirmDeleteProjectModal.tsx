import React from 'react';
import { AlertTriangle, Trash2, X, FolderMinus } from 'lucide-react';
import { Project } from '../../types';
import { useTheme } from '../../ThemeContext';

interface ConfirmDeleteProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  project: Project | null;
  sessionCount?: number;
}

export const ConfirmDeleteProjectModal: React.FC<ConfirmDeleteProjectModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  project,
  sessionCount = 0,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  if (!isOpen || !project) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl transition-all ${
          isWarm ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
              <FolderMinus size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 dark:text-slate-100">
                刪除 Project 確認
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                永久移除項目與旗下 Timesheet
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning Content */}
        <div className="my-4 p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs sm:text-sm text-rose-800 dark:text-rose-300 space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle size={18} className="shrink-0 mt-0.5 text-rose-600" />
            <span className="font-bold">
              確定要刪除「{project.name}」嗎？這將會永久刪除該 Project 以及旗下所有 Timesheet 工時紀錄，此操作無法復原。
            </span>
          </div>
          <div className="text-[11px] text-rose-700/80 dark:text-rose-400/80 pt-1 space-y-1">
            <p>• Client：<strong>{project.clientName}</strong></p>
            <p>• 預計一併移除工時紀錄：<strong>{sessionCount} 筆</strong></p>
            <p>• 總計工時：<strong>{project.totalWorkedHours} 小時</strong></p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-3">
          <button
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isWarm
                ? 'border-stone-300 hover:bg-stone-100 text-stone-700'
                : 'border-slate-700 hover:bg-slate-800 text-slate-300'
            }`}
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <Trash2 size={14} />
            <span>確定永久刪除 Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};
