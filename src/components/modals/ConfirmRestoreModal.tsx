import React from 'react';
import { AlertCircle, RefreshCw, X, FileCheck, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../../ThemeContext';
import { ValidationResult } from '../../utils/backup';

interface ConfirmRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  validationResult: ValidationResult | null;
  filename: string;
}

export const ConfirmRestoreModal: React.FC<ConfirmRestoreModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  validationResult,
  filename,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  if (!isOpen || !validationResult) return null;

  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl p-6 pb-20 sm:pb-6 border shadow-2xl transition-all ${
          isWarm ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/60">
              <AlertCircle size={20} />
            </div>
            <h3 className="font-extrabold text-base">確認匯入並復原備份</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-4 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-slate-300">
          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 text-xs font-semibold">
            ⚠️ 匯入將會覆蓋/合併當前資料，確定要繼續嗎？
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-stone-700 dark:text-slate-200 mb-2">
              <FileCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="truncate">檔案：{filename}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-200/60 dark:border-slate-800">
              <div>
                <span className="text-stone-400 dark:text-slate-500 block text-[11px]">包含 Projects</span>
                <span className="font-mono font-bold text-stone-800 dark:text-slate-200 text-sm">
                  {validationResult.projectCount} 個
                </span>
              </div>
              <div>
                <span className="text-stone-400 dark:text-slate-500 block text-[11px]">包含 Timesheet 紀錄</span>
                <span className="font-mono font-bold text-stone-800 dark:text-slate-200 text-sm">
                  {validationResult.sessionCount} 筆
                </span>
              </div>
            </div>

            {validationResult.exportedAt && (
              <div className="mt-2.5 pt-2 border-t border-stone-200/60 dark:border-slate-800 text-[11px] text-stone-400 dark:text-slate-500">
                備份時間：{new Date(validationResult.exportedAt).toLocaleString('zh-TW')}
              </div>
            )}
          </div>

          <p className="text-xs text-stone-500 dark:text-slate-400">
            確認後將會將此備份檔案寫入本地資料庫，並自動重新整理頁面呈現最新資料。
          </p>
        </div>

        {/* Actions */}
        <div className="pt-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
              isWarm
                ? 'bg-stone-100 hover:bg-stone-200 text-stone-700'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
            }`}
          >
            取消
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
          >
            <RefreshCw size={15} />
            <span>確定覆蓋並復原資料</span>
          </button>
        </div>
      </div>
    </div>
  );
};
