import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { useTheme } from '../../ThemeContext';

interface ConfirmClearModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const ConfirmClearModal: React.FC<ConfirmClearModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-6 pb-20 sm:pb-6 border shadow-2xl transition-all ${
          isWarm ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-950/60">
              <AlertTriangle size={20} />
            </div>
            <h3 className="font-extrabold text-base">警告：清空所有紀錄</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="py-5 space-y-3 text-xs sm:text-sm leading-relaxed text-stone-600 dark:text-slate-300">
          <p className="font-semibold text-stone-900 dark:text-slate-100 text-sm">
            確定要清空所有工時與 Project 紀錄嗎？此動作無法復原。
          </p>
          <div
            className={`p-3 rounded-2xl border text-xs ${
              isWarm ? 'bg-rose-50 border-rose-200 text-rose-800' : 'bg-rose-950/40 border-rose-900 text-rose-300'
            }`}
          >
            執行後將會立即：
            <ul className="list-disc list-inside mt-1 space-y-0.5">
              <li>清除所有已儲存的 Timesheet 詳細紀錄</li>
              <li>重設計時器秒數至 00:00:00</li>
              <li>清空所有建立的 Projects 與設定</li>
              <li>抹除瀏覽器本地（localStorage）中的所有暫存紀錄</li>
            </ul>
          </div>
        </div>

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
            取消返回
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white flex items-center gap-1.5 transition-all shadow-md shadow-rose-600/20 cursor-pointer"
          >
            <Trash2 size={15} />
            <span>確定清空並重置</span>
          </button>
        </div>
      </div>
    </div>
  );
};
