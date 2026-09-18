import React, { useState, useMemo } from 'react';
import { Trash2, X, CheckSquare, Square, AlertTriangle, Layers } from 'lucide-react';
import { Project } from '../../types';
import { useTheme } from '../../ThemeContext';
import { getClientColor } from '../../utils/clientColors';

interface BatchDeleteProjectsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projects: Project[];
  onConfirmDelete: (projectIds: string[]) => void;
}

export const BatchDeleteProjectsModal: React.FC<BatchDeleteProjectsModalProps> = ({
  isOpen,
  onClose,
  projects,
  onConfirmDelete,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmStep, setShowConfirmStep] = useState(false);

  // Group projects by clientName
  const groupedProjects = useMemo(() => {
    const map = new Map<string, Project[]>();
    for (const proj of projects) {
      const client = proj.clientName || '未分類客戶';
      if (!map.has(client)) {
        map.set(client, []);
      }
      map.get(client)!.push(proj);
    }
    return map;
  }, [projects]);

  if (!isOpen) return null;

  const allProjectIds = projects.map((p) => p.id);
  const isAllSelected = projects.length > 0 && selectedIds.size === projects.length;

  const handleToggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allProjectIds));
    }
  };

  const handleToggleProject = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleConfirmAction = () => {
    if (selectedIds.size === 0) return;
    onConfirmDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowConfirmStep(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-xs animate-fadeIn">
      <div
        className={`w-full max-w-lg rounded-3xl p-6 sm:p-7 border shadow-2xl transition-all flex flex-col max-h-[90vh] ${
          isWarm ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-stone-200/60 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
              <Layers size={22} />
            </div>
            <div>
              <h3 className="text-lg font-black text-stone-900 dark:text-slate-100">
                批量刪除 Project 管理
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                勾選欲移除的項目（將一併刪除旗下 Timesheet 紀錄）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Action / Select All Header */}
        <div className="flex items-center justify-between gap-2 py-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleSelectAll}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
              isAllSelected
                ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300'
                : isWarm
                ? 'bg-stone-100 hover:bg-stone-200/80 border-stone-300 text-stone-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            {isAllSelected ? <CheckSquare size={16} /> : <Square size={16} />}
            <span>{isAllSelected ? '清空選擇' : '全選所有專案'}</span>
          </button>

          <span className="text-xs font-extrabold text-stone-500 dark:text-slate-400">
            已選擇 <strong className="text-rose-600 dark:text-rose-400">{selectedIds.size}</strong> / {projects.length} 項
          </span>
        </div>

        {/* Project List (Grouped by Client) */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-1">
          {projects.length === 0 ? (
            <div className="p-8 text-center text-xs text-stone-400 dark:text-slate-500">
              尚無可刪除的 Project
            </div>
          ) : (
            Array.from(groupedProjects.entries()).map(([client, clientProjects]) => {
              const clientColor = getClientColor(
                client,
                clientProjects[0]?.clientColor || clientProjects[0]?.color
              );

              return (
                <div
                  key={client}
                  className={`p-3 rounded-2xl border ${
                    isWarm ? 'bg-stone-50/70 border-stone-200' : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  {/* Client Badge */}
                  <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-stone-200/50 dark:border-slate-800">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: clientColor }}
                    />
                    <span className="text-xs font-black text-stone-800 dark:text-slate-200">
                      {client}
                    </span>
                    <span className="text-[10px] font-bold text-stone-400 dark:text-slate-500">
                      ({clientProjects.length} 個)
                    </span>
                  </div>

                  {/* Projects in Client */}
                  <div className="space-y-1.5">
                    {clientProjects.map((p) => {
                      const isChecked = selectedIds.has(p.id);
                      return (
                        <div
                          key={p.id}
                          onClick={() => handleToggleProject(p.id)}
                          className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-950 dark:text-rose-100 shadow-2xs'
                              : isWarm
                              ? 'bg-white hover:bg-stone-100/80 border-stone-200/80 text-stone-800'
                              : 'bg-slate-900 hover:bg-slate-800/80 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // handled by parent div onClick
                              className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 cursor-pointer shrink-0"
                            />
                            <span className="text-xs sm:text-sm font-bold truncate">
                              {p.name}
                            </span>
                          </div>

                          <div className="text-right shrink-0">
                            <div className="text-xs font-mono font-bold">
                              HK${p.totalContractAmount.toLocaleString()}
                            </div>
                            <div className="text-[10px] opacity-70">
                              {p.totalWorkedHours} 小時
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Secondary Confirmation Warning (if triggered) */}
        {showConfirmStep && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 my-2 animate-in fade-in duration-150">
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-extrabold">警告：確定刪除這 {selectedIds.size} 個 Project？</strong>
                <p className="mt-0.5 text-[11px] opacity-90">
                  此操作將會連同旗下所有 Timesheet 工時紀錄一併永久銷毀，無法恢復。
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200/60 dark:border-slate-800 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
              isWarm
                ? 'border-stone-300 hover:bg-stone-100 text-stone-700'
                : 'border-slate-700 hover:bg-slate-800 text-slate-300'
            }`}
          >
            取消
          </button>

          {!showConfirmStep ? (
            <button
              type="button"
              disabled={selectedIds.size === 0}
              onClick={() => setShowConfirmStep(true)}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-md ${
                selectedIds.size > 0
                  ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30 cursor-pointer'
                  : 'bg-stone-300 dark:bg-slate-800 text-stone-500 dark:text-slate-500 cursor-not-allowed shadow-none'
              }`}
            >
              <Trash2 size={14} />
              <span>一鍵刪除已選專案 ({selectedIds.size} 項)</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleConfirmAction}
              className="px-5 py-2.5 rounded-xl text-xs font-black bg-rose-700 hover:bg-rose-800 text-white shadow-lg shadow-rose-900/40 flex items-center gap-1.5 transition-all cursor-pointer animate-pulse"
            >
              <Trash2 size={14} />
              <span>確定一鍵刪除 ({selectedIds.size} 項)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
