import React from 'react';
import { Archive } from 'lucide-react';
import { Project } from '../../types';
import { getClientColor } from '../../utils/clientColors';

interface ProjectHeaderProps {
  project: Project;
  showTitle?: boolean;
  className?: string;
  rightActions?: React.ReactNode;
  showArchivedBadge?: boolean;
}

export const ProjectHeader: React.FC<ProjectHeaderProps> = ({
  project,
  showTitle = true,
  className = '',
  rightActions,
  showArchivedBadge = false,
}) => {
  const clientColor = project.clientColor || project.color || getClientColor(project.clientName);
  const formattedDate = project.createdAt
    ? project.createdAt.replace(/-/g, '/')
    : '2026/09/19';

  return (
    <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-3 w-full ${className}`}>
      {/* Left: Title + Client Tag + Category Tag */}
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          {showTitle && (
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 dark:text-slate-100 tracking-tight break-words max-w-full">
              {project.name}
            </h2>
          )}
          <span
            className="text-white font-medium px-2.5 py-1 rounded-md text-xs flex items-center shrink-0 max-w-full shadow-2xs"
            style={{ backgroundColor: clientColor }}
          >
            <span className="truncate max-w-[130px] sm:max-w-none">Client: {project.clientName}</span>
          </span>
          {project.category && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 shrink-0 whitespace-nowrap">
              {project.category}
            </span>
          )}
          {showArchivedBadge && project.isArchived && (
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 shrink-0 whitespace-nowrap flex items-center gap-1">
              <Archive size={12} />
              <span>已封存</span>
            </span>
          )}
        </div>
      </div>

      {/* Right: Pure Text Created Date (No background, no border, no padding box) */}
      <div className="shrink-0 flex items-center gap-3 pt-0.5 sm:pt-1">
        <span className="text-xs font-semibold text-stone-500 dark:text-slate-400 whitespace-nowrap">
          建立於 <span className="font-mono">{formattedDate}</span>
        </span>
        {rightActions}
      </div>
    </div>
  );
};
