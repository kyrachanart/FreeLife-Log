import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Check } from 'lucide-react';
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
}

export const ProjectSelectDropdown: React.FC<ProjectSelectDropdownProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  className = '',
  placeholder = '選擇 Project...',
  disabled = false,
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

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between gap-2.5 rounded-xl px-3.5 py-2.5 text-left border transition-all cursor-pointer select-none ${
          isWarm
            ? 'bg-stone-50 hover:bg-stone-100/80 border-stone-300 text-stone-900 focus:ring-2 focus:ring-stone-400'
            : 'bg-slate-950 hover:bg-slate-900 border-slate-700 text-slate-100 focus:ring-2 focus:ring-slate-500'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
          {currentProject ? (
            <>
              {/* Solid Client Color Dot */}
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 shadow-2xs"
                style={{ backgroundColor: currentClientColor }}
              />
              {/* Project Name */}
              <span className="font-bold text-xs sm:text-sm truncate">
                {currentProject.name}
              </span>
              {/* Client Tag */}
              <span
                className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded border shrink-0"
                style={{
                  backgroundColor: `${currentClientColor}15`,
                  color: currentClientColor,
                  borderColor: `${currentClientColor}35`,
                }}
              >
                {currentProject.clientName}
              </span>
            </>
          ) : (
            <span className="text-stone-400 dark:text-slate-500 text-xs sm:text-sm">
              {placeholder}
            </span>
          )}
        </div>

        <ChevronDown
          size={16}
          className={`text-stone-400 dark:text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Custom Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute left-0 right-0 sm:min-w-[340px] max-w-[480px] mt-1.5 z-50 rounded-2xl border shadow-xl max-h-[350px] overflow-y-auto overflow-x-hidden p-1.5 transition-all animate-in fade-in zoom-in-95 duration-100 ${
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
                          <div className="flex items-center gap-2 min-w-0 flex-1 truncate">
                            {/* Color Dot */}
                            <span
                              className="w-2 h-2 rounded-full shrink-0"
                              style={{ backgroundColor: clientColor }}
                            />
                            {/* Project Name */}
                            <span className="truncate font-medium">{p.name}</span>
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
