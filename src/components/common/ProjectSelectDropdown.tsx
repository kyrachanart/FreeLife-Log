import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Check, Lock } from 'lucide-react';
import { Project } from '../../types';
import { useTheme } from '../../ThemeContext';
import { getClientColor } from '../../utils/clientColors';

interface ProjectSelectDropdownProps {
  projects: Project[];
  selectedProjectId: string;
  onSelectProject: (projectId: string) => void;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  variant?: 'default' | 'header';
}

export const ProjectSelectDropdown: React.FC<ProjectSelectDropdownProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  className = '',
  placeholder = '選擇 Project...',
  disabled = false,
  variant = 'default',
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';
  const [isOpen, setIsOpen] = useState(false);
  const [expandedClients, setExpandedClients] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

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

  // Auto-expand client group if the active selected project is hidden beyond top 5
  useEffect(() => {
    if (!selectedProjectId) return;
    groupedProjects.forEach((clientProjs, clientName) => {
      const idx = clientProjs.findIndex((p) => p.id === selectedProjectId);
      if (idx >= 5) {
        setExpandedClients((prev) => ({ ...prev, [clientName]: true }));
      }
    });
  }, [selectedProjectId, groupedProjects]);

  const currentProject = projects.find((p) => p.id === selectedProjectId);
  const currentClientColor = currentProject
    ? getClientColor(currentProject.clientName, currentProject.clientColor || currentProject.color)
    : '#2563EB';

  const isHeader = variant === 'header';

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      {isHeader ? (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          title={
            disabled
              ? '計時進行中已鎖定 Project'
              : '點擊切換當前 Project'
          }
          className={`flex items-center gap-1.5 py-0.5 px-1.5 -ml-1.5 rounded-lg transition-all select-none cursor-pointer group ${
            disabled
              ? 'opacity-60 grayscale cursor-not-allowed'
              : 'hover:bg-stone-200/50 dark:hover:bg-slate-800/60 active:scale-98'
          }`}
        >
          {/* Client Color Dot */}
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
            style={{ backgroundColor: currentClientColor }}
          />
          {/* Project Name (pure text style, 16px/18px font-semibold, max-w-240px ellipsis) */}
          <span
            className="font-semibold text-sm sm:text-base text-stone-800 dark:text-slate-200 group-hover:text-stone-950 dark:group-hover:text-white truncate block max-w-[170px] sm:max-w-[240px] md:max-w-[320px]"
            style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
          >
            {currentProject ? currentProject.name : placeholder}
          </span>
          {/* Chevron */}
          {disabled ? (
            <Lock size={13} className="shrink-0 text-stone-400 dark:text-slate-500 ml-0.5" />
          ) : (
            <ChevronDown
              size={15}
              className={`text-stone-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ml-0.5 ${
                isOpen ? 'rotate-180 text-stone-700 dark:text-slate-200' : ''
              }`}
            />
          )}
        </button>
      ) : (
        <button
          type="button"
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          title={
            disabled
              ? '計時進行中已鎖定 Project。如需查看其他 Project 資料，請切換至「Project 總覽」'
              : undefined
          }
          className={`w-full flex items-center justify-between gap-2 rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 text-left border transition-all select-none ${
            disabled
              ? 'opacity-60 grayscale cursor-not-allowed bg-stone-100 dark:bg-slate-900 border-stone-300 dark:border-slate-700 text-stone-700 dark:text-slate-300 shadow-none'
              : isWarm
              ? 'bg-stone-50 hover:bg-stone-100/80 border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-400 cursor-pointer'
              : 'bg-slate-950 hover:bg-slate-900 border-slate-700 text-slate-100 focus:ring-2 focus:ring-slate-500 cursor-pointer'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
            {currentProject ? (
              <>
                {/* Solid Client Color Dot */}
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                  style={{ backgroundColor: currentClientColor }}
                />
                {/* Project Name */}
                <span
                  className="font-bold sm:font-extrabold text-sm sm:text-base truncate block max-w-full"
                  style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
                >
                  {currentProject.name}
                </span>
              </>
            ) : (
              <span
                className="text-stone-400 dark:text-slate-500 text-sm sm:text-base truncate block max-w-full"
                style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
              >
                {placeholder}
              </span>
            )}
          </div>

          {disabled ? (
            <Lock size={14} className="shrink-0 text-stone-400 dark:text-slate-500" />
          ) : (
            <ChevronDown
              size={16}
              className={`text-stone-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          )}
        </button>
      )}

      {/* Custom Dropdown Menu */}
      {isOpen && !disabled && (
        <div
          className={`absolute left-0 sm:min-w-[340px] max-w-[480px] mt-1.5 z-50 rounded-2xl border shadow-xl max-h-[350px] overflow-y-auto overflow-x-hidden p-1.5 transition-all animate-in fade-in zoom-in-95 duration-100 ${
            isWarm
              ? 'bg-white border-stone-200 text-stone-900 shadow-stone-900/10'
              : 'bg-slate-900 border-slate-800 text-slate-100 shadow-black/40'
          }`}
        >
          {projects.length === 0 ? (
            <div className="p-4 text-center text-xs text-stone-400 dark:text-slate-500">
              尚無可用 Project
            </div>
          ) : (
            Array.from(groupedProjects.entries()).map(([client, clientProjects]) => {
              const clientColor = getClientColor(
                client,
                clientProjects[0]?.clientColor || clientProjects[0]?.color
              );
              const isExpanded = expandedClients[client] || false;
              const hasMoreThanFive = clientProjects.length > 5;
              const visibleProjects = hasMoreThanFive && !isExpanded
                ? clientProjects.slice(0, 5)
                : clientProjects;

              return (
                <div key={client} className="mb-2 last:mb-0">
                  {/* Client Group Header with Client Color Frame */}
                  <div
                    className="flex items-center justify-between px-2.5 py-1 rounded-md my-1 text-xs font-bold border transition-colors"
                    style={{
                      backgroundColor: `${clientColor}10`,
                      borderColor: `${clientColor}40`,
                      color: clientColor,
                    }}
                  >
                    <span className="truncate font-black">{client}</span>
                    <span className="text-[10px] font-bold opacity-80">
                      {clientProjects.length} 個專案
                    </span>
                  </div>

                  {/* Project Items in Group */}
                  <div className="space-y-0.5 pl-1 pr-0.5">
                    {visibleProjects.map((p) => {
                      const isSelected = p.id === selectedProjectId;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => {
                            onSelectProject(p.id);
                            setIsOpen(false);
                          }}
                          className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left text-xs sm:text-sm transition-colors cursor-pointer ${
                            isSelected
                              ? isWarm
                                ? 'bg-stone-100/90 font-bold text-stone-900'
                                : 'bg-slate-800/90 font-bold text-slate-100'
                              : isWarm
                              ? 'hover:bg-stone-100/70 text-stone-800 font-medium'
                              : 'hover:bg-slate-800/50 text-slate-200 font-medium'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1 overflow-hidden">
                            {/* Color Dot */}
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: clientColor }}
                            />
                            {/* Project Name */}
                            <span
                              className="truncate font-medium block max-w-full"
                              style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }}
                            >
                              {p.name}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-xs text-stone-400 dark:text-slate-400">
                              HK${p.totalContractAmount.toLocaleString()}
                            </span>
                            {isSelected ? (
                              <Check
                                size={14}
                                className="text-stone-500 dark:text-slate-400 shrink-0"
                                strokeWidth={2.5}
                              />
                            ) : (
                              <div className="w-3.5" />
                            )}
                          </div>
                        </button>
                      );
                    })}

                    {/* Collapsible toggle button */}
                    {hasMoreThanFive && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedClients((prev) => ({ ...prev, [client]: !isExpanded }));
                        }}
                        className={`w-full py-1.5 px-2.5 mt-1 text-center text-[11px] font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 border ${
                          isWarm
                            ? 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                            : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 border-slate-700/60'
                        }`}
                      >
                        <span>
                          {isExpanded
                            ? '收合專案 ▴'
                            : `展開其餘 ${clientProjects.length - 5} 個專案 ▾`}
                        </span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
