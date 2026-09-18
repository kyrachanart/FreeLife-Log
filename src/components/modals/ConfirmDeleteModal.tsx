import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  sessionDescription?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  sessionDescription,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  if (!isOpen) return null;

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
              <Trash2 size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 dark:text-slate-100">
                刪除工時紀錄
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                Timesheet 紀錄移除確認
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
              確定要刪除此筆工時紀錄嗎？刪除後數據將重新計算且無法復原。
            </span>
          </div>
          {sessionDescription && (
            <p className="text-stone-600 dark:text-slate-300 text-xs pl-6">
              目標紀錄：<strong className="font-semibold">{sessionDescription}</strong>
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold border border-stone-200 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-300 transition-colors cursor-pointer"
          >
            取消
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 size={14} />
            <span>確認刪除</span>
          </button>
        </div>
      </div>
    </div>
  );
};
