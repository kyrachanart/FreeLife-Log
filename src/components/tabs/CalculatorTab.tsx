import React, { useState, useMemo, useEffect } from 'react';
import {
  Clock,
  DollarSign,
  TrendingUp,
  Target,
  Edit2,
  Trash2,
  Copy,
  Check,
  Plus,
  Calendar,
  AlertTriangle,
  FolderMinus,
  CheckCircle2,
  Coffee,
  FileText,
  Download,
  Play,
  Eye,
  EyeOff,
  Layers,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Archive,
  ArchiveRestore,
} from 'lucide-react';
import { Project, TimeSession, ProjectMemoItem, FreelancerProfile, TimerBridge } from '../../types';
import { useTheme } from '../../ThemeContext';
import { Toast } from '../common/Toast';
import { exportTimesheetPDF } from '../../utils/pdfExport';
import { EditProjectModal } from '../modals/EditProjectModal';
import { ConfirmDeleteModal } from '../modals/ConfirmDeleteModal';
import { ConfirmDeleteProjectModal } from '../modals/ConfirmDeleteProjectModal';
import { ProjectHeader } from '../common/ProjectHeader';
import { BatchDeleteProjectsModal } from '../modals/BatchDeleteProjectsModal';
import { ProjectSelectDropdown } from '../common/ProjectSelectDropdown';
import { getClientColor } from '../../utils/clientColors';
import { formatCurrency, formatHourlyRate, getCurrencySymbol } from '../../utils/currency';

interface CalculatorTabProps {
  projects: Project[];
  sessions: TimeSession[];
  onDeleteSession: (sessionId: string) => void;
  onUpdateSession?: (updatedSession: TimeSession) => void;
  onDeleteProject?: (projectId: string) => void;
  onDeleteProjects?: (projectIds: string[]) => void;
  onMoveProjects?: (projectIds: string[], targetClientName: string) => void;
  onArchiveProjects?: (projectIds: string[]) => void;
  onUnarchiveProjects?: (projectIds: string[]) => void;
  onUpdateProject: (updatedProject: Project) => void;
  onNavigateTab?: (tabId: string) => void;
  onOpenNewProjectModal?: () => void;
  freelancerProfile: FreelancerProfile;
  activeProjectId?: string;
  setActiveProjectId?: (id: string) => void;
  showHourlyRate?: boolean;
  hourlyRateVisibilityMap?: Record<string, boolean>;
  onToggleShowHourlyRate?: (projectId?: string) => void;
  timerBridge?: TimerBridge | null;
  timerStatus?: {
    isRunning: boolean;
    projectId: string;
    projectName: string;
    elapsedFormatted: string;
  };
  onRequestSwitchProject?: (targetProjectId: string) => void;
  viewProjectId?: string;
  onViewProjectChange?: (projectId: string) => void;
}

export const CalculatorTab: React.FC<CalculatorTabProps> = ({
  projects,
  sessions,
  onDeleteSession,
  onUpdateSession,
  onDeleteProject,
  onDeleteProjects,
  onMoveProjects,
  onArchiveProjects,
  onUnarchiveProjects,
  onUpdateProject,
  onNavigateTab,
  onOpenNewProjectModal,
  freelancerProfile,
  activeProjectId,
  setActiveProjectId,
  showHourlyRate = true,
  hourlyRateVisibilityMap,
  onToggleShowHourlyRate,
  timerBridge,
  timerStatus,
  onRequestSwitchProject,
  viewProjectId: externalViewProjectId,
  onViewProjectChange,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  // Auto scroll into view & highlight newly created session if redirected from manual entry
  useEffect(() => {
    try {
      const highlightId = localStorage.getItem('freelife_highlight_session_id');
      if (highlightId) {
        localStorage.removeItem('freelife_highlight_session_id');
        setTimeout(() => {
          const el = document.getElementById(`session-${highlightId}`);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-emerald-500', 'bg-emerald-50/80', 'dark:bg-emerald-950/60');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-emerald-500', 'bg-emerald-50/80', 'dark:bg-emerald-950/60');
            }, 3500);
          }
        }, 300);
      }
    } catch (e) {
      // ignore
    }
  }, [sessions]);

  // Extract unique existing clients list
  const existingClients = useMemo(() => {
    const list: string[] = [];
    projects.forEach((p) => {
      const c = (p.clientName || '').trim();
      if (c && !list.includes(c)) {
        list.push(c);
      }
    });
    return list;
  }, [projects]);

  // Top Filter Tab: 'active' (進行中) vs 'archived' (已封存)
  const [projectFilterTab, setProjectFilterTab] = useState<'active' | 'archived'>('active');

  const activeProjects = useMemo(() => projects.filter((p) => !p.isArchived), [projects]);
  const archivedProjects = useMemo(() => projects.filter((p) => !!p.isArchived), [projects]);
  const currentTabProjects = projectFilterTab === 'active' ? activeProjects : archivedProjects;

  // Local independent viewing state
  const [viewProjectId, setViewProjectId] = useState<string>(() => {
    if (externalViewProjectId && projects.some((p) => p.id === externalViewProjectId)) {
      return externalViewProjectId;
    }
    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      return activeProjectId;
    }
    return activeProjects[0]?.id || projects[0]?.id || '';
  });

  // Keep viewProjectId synchronized with current filter tab & externalViewProjectId
  useEffect(() => {
    if (externalViewProjectId && projects.some((p) => p.id === externalViewProjectId)) {
      if (viewProjectId !== externalViewProjectId) {
        setViewProjectId(externalViewProjectId);
      }
      const targetProj = projects.find((p) => p.id === externalViewProjectId);
      if (targetProj) {
        const expectedTab = targetProj.isArchived ? 'archived' : 'active';
        if (projectFilterTab !== expectedTab) {
          setProjectFilterTab(expectedTab);
        }
      }
    } else if (currentTabProjects.length > 0) {
      if (!viewProjectId || !currentTabProjects.some((p) => p.id === viewProjectId)) {
        setViewProjectId(currentTabProjects[0].id);
      }
    } else if (projects.length > 0) {
      if (!viewProjectId || !projects.some((p) => p.id === viewProjectId)) {
        setViewProjectId(projects[0].id);
      }
    } else {
      if (viewProjectId !== '') {
        setViewProjectId('');
      }
    }
  }, [externalViewProjectId, projects, currentTabProjects, projectFilterTab, viewProjectId]);

  const handleViewProjectChange = (targetId: string) => {
    setViewProjectId(targetId);
    if (onViewProjectChange) {
      onViewProjectChange(targetId);
    }
    if (setActiveProjectId) {
      setActiveProjectId(targetId);
    }
  };

  const handleFilterTabChange = (tab: 'active' | 'archived') => {
    setProjectFilterTab(tab);
    const targetList = tab === 'active' ? activeProjects : archivedProjects;
    if (targetList.length > 0) {
      if (!targetList.some((p) => p.id === viewProjectId)) {
        handleViewProjectChange(targetList[0].id);
      }
    }
  };

  const handleToggleArchive = (project: Project) => {
    const willBeArchived = !project.isArchived;

    if (willBeArchived) {
      const executeArchive = () => {
        const updated: Project = {
          ...project,
          isArchived: true,
        };
        onUpdateProject(updated);
        showToast(`📦 已將「${project.name}」封存保存！`);
        const remainingActive = activeProjects.filter((p) => p.id !== project.id);
        if (remainingActive.length > 0) {
          handleViewProjectChange(remainingActive[0].id);
          if (setActiveProjectId) setActiveProjectId(remainingActive[0].id);
        }
      };

      // Running Timer Protection
      if (timerBridge?.isRunning && timerBridge.projectId === project.id) {
        const runningName = project.name || timerBridge.projectName || '當前專案';
        timerBridge.stopAndSave(() => {
          executeArchive();
          showToast(`⏱️ 計時器已自動停止並結算儲存「${runningName}」工時！📦 已成功封存。`);
        });
        return;
      }

      executeArchive();
    } else {
      // Unarchive (取消封存)
      const updated: Project = {
        ...project,
        isArchived: false,
      };
      onUpdateProject(updated);
      showToast(`📤 已取消封存「${project.name}」，已恢復至進行中！`);

      const remainingArchived = archivedProjects.filter((p) => p.id !== project.id);
      // Empty state handling: If the last archived project is unarchived, automatically switch to 'active' tab and view this project!
      if (remainingArchived.length === 0) {
        setProjectFilterTab('active');
        handleViewProjectChange(project.id);
        if (setActiveProjectId) {
          setActiveProjectId(project.id);
        }
      } else {
        handleViewProjectChange(remainingArchived[0].id);
      }
    }
  };

  const handleBatchArchiveProjects = (projectIds: string[]) => {
    if (projectIds.length === 0) return;

    const performBatchArchive = () => {
      if (onArchiveProjects) {
        onArchiveProjects(projectIds);
      } else {
        projectIds.forEach((id) => {
          const p = projects.find((proj) => proj.id === id);
          if (p) onUpdateProject({ ...p, isArchived: true });
        });
        showToast(`💡 已成功封存 ${projectIds.length} 個專案`);
      }

      if (projectFilterTab === 'active' && projectIds.includes(viewProjectId)) {
        const remaining = activeProjects.filter((p) => !projectIds.includes(p.id));
        if (remaining.length > 0) {
          handleViewProjectChange(remaining[0].id);
          if (setActiveProjectId) setActiveProjectId(remaining[0].id);
        }
      }
    };

    // Running Timer Protection for Batch Archive:
    if (timerBridge?.isRunning && projectIds.includes(timerBridge.projectId)) {
      const runningProj = projects.find((p) => p.id === timerBridge.projectId);
      const runningName = runningProj?.name || timerBridge.projectName || '當前專案';
      timerBridge.stopAndSave(() => {
        performBatchArchive();
        showToast(`⏱️ 計時器已自動停止並結算儲存「${runningName}」工時！`);
      });
    } else {
      performBatchArchive();
    }
  };

  const handleBatchUnarchiveProjects = (projectIds: string[]) => {
    if (projectIds.length === 0) return;

    if (onUnarchiveProjects) {
      onUnarchiveProjects(projectIds);
    } else {
      projectIds.forEach((id) => {
        const p = projects.find((proj) => proj.id === id);
        if (p) onUpdateProject({ ...p, isArchived: false });
      });
      showToast(`📤 已成功取消封存 ${projectIds.length} 個專案`);
    }

    const remainingArchived = archivedProjects.filter((p) => !projectIds.includes(p.id));
    // Empty state handling: If all archived projects were unarchived, automatically switch to 'active' tab and view the first restored project!
    if (remainingArchived.length === 0) {
      setProjectFilterTab('active');
      handleViewProjectChange(projectIds[0]);
      if (setActiveProjectId) {
        setActiveProjectId(projectIds[0]);
      }
    } else if (projectIds.includes(viewProjectId)) {
      handleViewProjectChange(remainingArchived[0].id);
    }
  };

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);
  const [copiedFullTimesheet, setCopiedFullTimesheet] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'focus' | 'break'>('focus');

  // Automatically reset metrics to collapsed when viewed project changes
  useEffect(() => {
    setIsMetricsExpanded(false);
  }, [viewProjectId]);

  // Single Session Deletion Modal States
  const [sessionToDelete, setSessionToDelete] = useState<TimeSession | null>(null);

  // Entire Project Deletion Modal States
  const [isDeleteProjectModalOpen, setIsDeleteProjectModalOpen] = useState(false);

  // Batch Projects Deletion Modal State
  const [isBatchDeleteModalOpen, setIsBatchDeleteModalOpen] = useState(false);

  const handleBatchDeleteProjects = (projectIds: string[]) => {
    if (onDeleteProjects) {
      onDeleteProjects(projectIds);
    } else if (onDeleteProject) {
      projectIds.forEach((id) => onDeleteProject(id));
    }
  };

  // Current viewed project
  const currentProject = useMemo(() => {
    if (projects.length === 0) return null;
    const foundInTab = currentTabProjects.find((p) => p.id === viewProjectId);
    if (foundInTab) return foundInTab;
    if (currentTabProjects.length > 0) return currentTabProjects[0];
    return projects.find((p) => p.id === viewProjectId) || null;
  }, [projects, currentTabProjects, viewProjectId]);

  // Project Memo state for current project
  const [projectMemoInput, setProjectMemoInput] = useState<string>('');
  const [copiedMemoId, setCopiedMemoId] = useState<string | null>(null);
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null);
  const [editingMemoContent, setEditingMemoContent] = useState<string>('');

  // Timesheet Entry Title Editing State
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionTitle, setEditingSessionTitle] = useState<string>('');

  const handleStartEditSession = (session: TimeSession) => {
    setEditingSessionId(session.id);
    setEditingSessionTitle(session.taskDescription || '');
  };

  const handleSaveEditSession = (session: TimeSession) => {
    const newTitle = editingSessionTitle.trim() || '專注工作';
    if (onUpdateSession) {
      onUpdateSession({
        ...session,
        taskDescription: newTitle,
      });
    }
    setEditingSessionId(null);
    setEditingSessionTitle('');
    showToast('✅ 已更新工作內容！');
  };

  const handleCancelEditSession = () => {
    setEditingSessionId(null);
    setEditingSessionTitle('');
  };

  // Compute current project's memos list with backward compatibility
  const currentMemos = useMemo<ProjectMemoItem[]>(() => {
    if (!currentProject) return [];
    if (currentProject.memos && currentProject.memos.length > 0) {
      return currentProject.memos;
    }
    if (currentProject.memo && currentProject.memo.trim()) {
      return [
        {
          id: 'initial_memo',
          content: currentProject.memo,
          createdAt: '專案建立 Memo / 備忘',
        },
      ];
    }
    return [];
  }, [currentProject]);

  const handleSaveMemo = () => {
    if (!currentProject) return;
    const trimmed = projectMemoInput.trim();
    if (!trimmed) {
      showToast('⚠️ 請先在輸入框中撰寫筆記內容再進行儲存！');
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const newMemoItem: ProjectMemoItem = {
      id: `memo_${Date.now()}`,
      content: trimmed,
      createdAt: timeStr,
    };

    const updatedMemos = [newMemoItem, ...currentMemos.filter((m) => m.id !== 'initial_memo')];

    onUpdateProject({
      ...currentProject,
      memo: trimmed,
      memos: updatedMemos,
    });

    setProjectMemoInput('');
    showToast('💾 筆記已成功儲存並記錄至下方清單！');
  };

  const handleDeleteMemo = (memoId: string) => {
    if (!currentProject) return;
    const updatedMemos = currentMemos.filter((m) => m.id !== memoId);
    onUpdateProject({
      ...currentProject,
      memo: updatedMemos[0]?.content || '',
      memos: updatedMemos,
    });
    showToast('🗑️ 該筆備忘筆記已刪除');
  };

  const handleCopyMemo = (content: string, memoId: string) => {
    navigator.clipboard.writeText(content);
    setCopiedMemoId(memoId);
    showToast('📋 已複製筆記內容至剪貼簿！');
    setTimeout(() => setCopiedMemoId(null), 2000);
  };

  const handleStartEditMemo = (memo: ProjectMemoItem) => {
    setEditingMemoId(memo.id);
    setEditingMemoContent(memo.content);
  };

  const handleCancelEditMemo = () => {
    setEditingMemoId(null);
    setEditingMemoContent('');
  };

  const handleSaveEditMemo = (memoId: string) => {
    if (!currentProject) return;
    const trimmed = editingMemoContent.trim();
    if (!trimmed) {
      showToast('⚠️ 筆記內容不可為空！');
      return;
    }

    const now = new Date();
    const timeStr = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const updatedMemos = currentMemos.map((m) =>
      m.id === memoId ? { ...m, content: trimmed, createdAt: `${timeStr} (已編輯)` } : m
    );

    onUpdateProject({
      ...currentProject,
      memo: updatedMemos[0]?.content || '',
      memos: updatedMemos,
    });

    setEditingMemoId(null);
    setEditingMemoContent('');
    showToast('✏️ 已成功更新備忘筆記！');
  };

  const showToast = (msg: string, forcedType?: 'focus' | 'break') => {
    const isRest = forcedType === 'break' || (!forcedType && (msg.includes('休息') || msg.includes('☕')));
    setToastType(isRest ? 'break' : 'focus');
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Filter and sort sessions for the current project (Newest First by date and startTime)
  const projectSessions = useMemo(() => {
    if (!currentProject) return [];
    return sessions
      .filter((s) => s.projectId === currentProject.id)
      .sort((a, b) => {
        const datetimeA = `${a.date}T${a.startTime || '00:00'}`;
        const datetimeB = `${b.date}T${b.startTime || '00:00'}`;
        return datetimeB.localeCompare(datetimeA);
      });
  }, [sessions, currentProject]);

  // Group projects by clientName for organized select dropdown
  const groupedProjects = useMemo(() => {
    const map = new Map<string, Project[]>();
    projects.forEach((p) => {
      const client = (p.clientName || '未指定 Client').trim();
      if (!map.has(client)) {
        map.set(client, []);
      }
      map.get(client)!.push(p);
    });
    return map;
  }, [projects]);

  // Project Metrics Calculations
  const contractAmount = currentProject?.totalContractAmount || 0;
  const totalRevenue = contractAmount;

  // Accurate project total minutes & hours
  const totalWorkedMinutes = projectSessions.reduce((sum, s) => sum + s.workDurationMinutes, 0);
  const totalWorkedHours = totalWorkedMinutes / 60;
  const totalBreakMinutes = projectSessions.reduce((sum, s) => sum + (s.breakDurationMinutes || 0), 0);

  // Dynamic Effective Hourly Rate
  // Formula: Effective Hourly Rate = Total Revenue / (Total Minutes / 60)
  // Safeguard: 1-Hour Threshold Rule (totalWorkedMinutes < 60)
  const projCurrency = currentProject?.currency || freelancerProfile?.defaultCurrency || 'HKD';
  const hasEstimatedHoursLimit = typeof currentProject?.estimatedHours === 'number' && currentProject.estimatedHours > 0;
  const targetEstimatedRate = (currentProject && hasEstimatedHoursLimit)
    ? totalRevenue / currentProject.estimatedHours!
    : null;

  const isUnderOneHour = totalWorkedMinutes < 60;
  const effectiveHourlyRate = !isUnderOneHour
    ? (totalWorkedMinutes > 0 ? totalRevenue / (totalWorkedMinutes / 60) : null)
    : targetEstimatedRate;

  const effectiveHourlyRateText = isUnderOneHour
    ? (targetEstimatedRate !== null ? `${formatHourlyRate(targetEstimatedRate, projCurrency)} (目標預估)` : `${getCurrencySymbol(projCurrency)} -- / h`)
    : (effectiveHourlyRate !== null ? formatHourlyRate(effectiveHourlyRate, projCurrency) : `${getCurrencySymbol(projCurrency)} -- / h`);

  const wH = Math.floor(totalWorkedMinutes / 60);
  const wM = totalWorkedMinutes % 60;
  const totalDurationFormatted = wH > 0 ? (wM > 0 ? `${wH}h ${wM}m` : `${wH}h`) : `${wM}m`;

  // Budgeted total safe hours from estimatedHours
  const budgetedTotalHours = hasEstimatedHoursLimit ? currentProject!.estimatedHours! : 0;

  // Budget usage & remaining safe hours
  const budgetUsagePercent = budgetedTotalHours > 0
    ? Math.round((totalWorkedHours / budgetedTotalHours) * 100)
    : 0;
  const remainingSafeHours = budgetedTotalHours > 0
    ? Math.max(0, Math.round((budgetedTotalHours - totalWorkedHours) * 10) / 10)
    : 0;

  // Copy Full Timesheet Summary with User Profile
  const handleCopyFullTimesheet = () => {
    if (!currentProject) return;

    if (projectSessions.length === 0) {
      showToast(`⚠️「${currentProject.name}」目前尚無任何 Timesheet 工時紀錄`);
      return;
    }

    const authorName = freelancerProfile?.name || '未設定姓名';
    const authorRole = freelancerProfile?.title || '未設定職業';

    let text = `----------------------------------------\n`;
    text += `【Timesheet 工時紀錄】\n`;
    text += `製表人：${authorName} (${authorRole})\n`;
    text += `專案名稱：${currentProject.name}\n`;
    text += `Client：${currentProject.clientName || '未指定客戶'}\n`;
    text += `----------------------------------------\n`;

    projectSessions.forEach((s) => {
      const sH = Math.floor(s.workDurationMinutes / 60);
      const sM = s.workDurationMinutes % 60;
      const sDur = sH > 0 ? (sM > 0 ? `${sH}h ${sM}m` : `${sH}h`) : `${sM}m`;
      const timeRange = s.startTime && s.startTime !== '--:--' ? `[${s.startTime}-${s.endTime}]` : '[手動工時]';
      text += `• ${s.date} | ${timeRange} | ${s.taskDescription} | ${sDur}\n`;
    });

    const totH = Math.floor(totalWorkedMinutes / 60);
    const totM = totalWorkedMinutes % 60;
    const totDurStr = totH > 0 ? (totM > 0 ? `${totH}h ${totM}m` : `${totH}h`) : `${totM}m`;

    text += `----------------------------------------\n`;
    text += `總計工時：${totDurStr} (${totalWorkedMinutes} 分鐘)\n`;
    text += `----------------------------------------\n`;

    navigator.clipboard.writeText(text);
    setCopiedFullTimesheet(true);
    showToast(`📋 已複製「${currentProject.name}」完整 Timesheet 文字摘要！`);
    setTimeout(() => setCopiedFullTimesheet(false), 2500);
  };

  // Export Timesheet PDF Report
  const handleExportTimesheetPDF = async () => {
    if (!currentProject) return;

    if (projectSessions.length === 0) {
      showToast(`⚠️「${currentProject.name}」尚無任何 Timesheet 紀錄可供導出`);
      return;
    }

    try {
      setIsExportingPDF(true);
      await exportTimesheetPDF({
        project: currentProject,
        sessions: projectSessions,
        profile: freelancerProfile,
      });
      showToast('📄 已成功匯出 Timesheet PDF 報表！');
    } catch (err) {
      console.error('Failed to export PDF:', err);
      showToast('❌ 匯出 PDF 報表失敗，請稍後再試');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Confirm project deletion
  const handleConfirmDeleteProject = () => {
    if (!currentProject || !onDeleteProject) return;
    const targetId = currentProject.id;
    onDeleteProject(targetId);
    setIsDeleteProjectModalOpen(false);
  };

  if (projects.length === 0) {
    return (
      <div
        className={`rounded-3xl p-10 sm:p-16 border text-center max-w-4xl mx-auto space-y-4 ${
          isWarm ? 'bg-white border-stone-200' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
          <Clock size={32} />
        </div>
        <h3 className="text-xl font-extrabold text-stone-900 dark:text-slate-100">
          目前尚未建立任何 Project
        </h3>
        <p className="text-sm text-stone-500 dark:text-slate-400 max-w-md mx-auto">
          點擊下方按鈕建立你的第一個 Project，開始紀錄合約總額工時預算與 Timesheet！
        </p>
        <div className="pt-2">
          {onOpenNewProjectModal && (
            <button
              onClick={onOpenNewProjectModal}
              className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center gap-2 mx-auto cursor-pointer shadow-lg shadow-emerald-600/30"
            >
              <Plus size={18} />
              <span>立即新增 Project</span>
            </button>
          )}
        </div>
      </div>
    );
  }

  const clientColor = currentProject
    ? getClientColor(currentProject.clientName, currentProject.clientColor || currentProject.color)
    : '#2563EB';

  const isHourlyRateVisible = hourlyRateVisibilityMap && viewProjectId
    ? hourlyRateVisibilityMap[viewProjectId] !== false
    : showHourlyRate;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          id="calculator-tab-toast"
          message={toastMessage}
          variant={toastType === 'break' ? 'amber' : 'emerald'}
        />
      )}

      {/* ============================================================ */}
      {/* 1. TOP TAB SWITCHER: 進行中 (Active) / 已封存 (Archived) */}
      {/* ============================================================ */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Pill style Tab Switcher */}
        <div
          className={`inline-flex items-center p-1 rounded-2xl border transition-all ${
            isWarm
              ? 'bg-stone-100/90 border-stone-200/90 shadow-2xs'
              : 'bg-slate-900/90 border-slate-800 shadow-2xs'
          }`}
        >
          <button
            type="button"
            onClick={() => handleFilterTabChange('active')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              projectFilterTab === 'active'
                ? isWarm
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Clock size={15} className={projectFilterTab === 'active' ? 'text-emerald-600 dark:text-emerald-400' : ''} />
            <span>進行中</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                projectFilterTab === 'active'
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  : 'bg-stone-200 text-stone-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {activeProjects.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleFilterTabChange('archived')}
            className={`flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              projectFilterTab === 'archived'
                ? isWarm
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'bg-slate-800 text-slate-100 shadow-xs'
                : 'text-stone-500 hover:text-stone-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <Archive size={15} className={projectFilterTab === 'archived' ? 'text-blue-600 dark:text-blue-400' : ''} />
            <span>已封存</span>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                projectFilterTab === 'archived'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                  : 'bg-stone-200 text-stone-600 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {archivedProjects.length}
            </span>
          </button>
        </div>

        {/* Right Main Button: only show on active tab */}
        {projectFilterTab === 'active' && onOpenNewProjectModal && (
          <button
            type="button"
            onClick={onOpenNewProjectModal}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer active:scale-95 shrink-0"
          >
            <Plus size={15} />
            <span>新增 Project</span>
          </button>
        )}
      </div>

      {/* Tab Empty State */}
      {currentTabProjects.length === 0 ? (
        <div
          className={`rounded-3xl p-10 sm:p-14 border text-center space-y-4 ${
            isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
        >
          {projectFilterTab === 'archived' ? (
            <>
              <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mx-auto border border-blue-200 dark:border-blue-800">
                <Archive size={28} />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-slate-100">
                目前尚無已封存的 Project
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                當專案完成驗收或階段性結案時，可在專案總覽點擊「封存」按鈕，將專案封存移至此處。所有歷史 Timesheet 紀錄與報表數據將完整妥善保留。
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => handleFilterTabChange('active')}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 mx-auto cursor-pointer shadow-sm transition-all"
                >
                  <Clock size={14} />
                  <span>查看進行中 Project ({activeProjects.length})</span>
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto border border-emerald-200 dark:border-emerald-800">
                <Clock size={28} />
              </div>
              <h3 className="text-lg sm:text-xl font-extrabold text-stone-900 dark:text-slate-100">
                目前沒有進行中的 Project
              </h3>
              <p className="text-xs sm:text-sm text-stone-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                所有 Project 目前均已封存，或者尚未建立進行中專案。你可以立即建立新 Project，或從已封存專案中「取消封存」。
              </p>
              <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                {archivedProjects.length > 0 && (
                  <button
                    type="button"
                    onClick={() => handleFilterTabChange('archived')}
                    className={`px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                      isWarm ? 'border-stone-300 text-stone-700 hover:bg-stone-100' : 'border-slate-700 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Archive size={14} />
                    <span>查看已封存專案 ({archivedProjects.length})</span>
                  </button>
                )}
                {onOpenNewProjectModal && (
                  <button
                    type="button"
                    onClick={onOpenNewProjectModal}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                  >
                    <Plus size={14} />
                    <span>立即新增 Project</span>
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      ) : currentProject ? (
        <>
          {/* ============================================================ */}
          {/* 2. TOP CONTROLS & PROJECT SELECTOR */}
          {/* ============================================================ */}
        <div
          className={`rounded-3xl p-6 sm:p-7 border transition-all ${
            isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
          style={{
            borderLeftWidth: '4px',
            borderLeftColor: clientColor,
          }}
        >
          {/* TOP ACTION & SELECTOR ROWS */}
          <div className="flex items-center justify-between gap-2 sm:gap-3 pb-4 border-b border-stone-100 dark:border-slate-800">
            {/* Left: Label (hidden on mobile) + Dropdown (occupies main width) */}
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <span className="hidden sm:inline-block text-xs font-bold text-stone-500 dark:text-slate-400 whitespace-nowrap shrink-0">
                選擇 PROJECT:
              </span>
              <div className="w-full min-w-0 flex-1">
                <ProjectSelectDropdown
                  projects={currentTabProjects}
                  selectedProjectId={viewProjectId}
                  onSelectProject={(id) => handleViewProjectChange(id)}
                  className="w-full"
                />
              </div>
            </div>

            {/* Right: Unified Settings Menu (⚙️) */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsMenuOpen((prev) => !prev)}
                className={`p-2 sm:px-2.5 sm:py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                  isWarm
                    ? 'border-stone-300 hover:bg-stone-100 text-stone-700 bg-stone-50/50'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300 bg-slate-900/50'
                }`}
                title="Project 操作與設定"
              >
                <Settings size={15} />
                <ChevronDown size={12} className={`transition-transform duration-200 ${isSettingsMenuOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSettingsMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsSettingsMenuOpen(false)}
                  />
                  <div
                    className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 shadow-xl z-50 p-1.5 space-y-1 animate-in fade-in-50 zoom-in-95"
                    onClick={() => setIsSettingsMenuOpen(false)}
                  >
                    {/* Item 1: 編輯 Project */}
                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Edit2 size={14} className="text-stone-500 dark:text-slate-400" />
                      <span>編輯 Project</span>
                    </button>

                    {/* Item 2: 封存 / 取消封存 Project */}
                    {projectFilterTab === 'active' ? (
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(currentProject)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <Archive size={14} className="text-stone-500 dark:text-slate-400" />
                        <span>封存 Project</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleToggleArchive(currentProject)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <ArchiveRestore size={14} className="text-stone-500 dark:text-slate-400" />
                        <span>取消封存 Project</span>
                      </button>
                    )}

                    {/* Item 3: 批次管理 Project */}
                    <button
                      type="button"
                      onClick={() => setIsBatchDeleteModalOpen(true)}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-700 dark:text-slate-200 flex items-center gap-2 transition-colors cursor-pointer"
                    >
                      <Layers size={14} className="text-stone-500 dark:text-slate-400" />
                      <span>批次管理 Project</span>
                    </button>

                    {/* Item 4: 刪除此 Project */}
                    {onDeleteProject && (
                      <button
                        type="button"
                        onClick={() => setIsDeleteProjectModalOpen(true)}
                        className="w-full text-left px-3 py-2 rounded-xl text-xs font-bold hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center gap-2 transition-colors cursor-pointer border-t border-stone-100 dark:border-slate-800 pt-1.5 mt-0.5"
                      >
                        <FolderMinus size={14} />
                        <span>刪除此 Project</span>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>

            {/* Project Title Header via unified ProjectHeader component */}
            <ProjectHeader project={currentProject} showTitle={true} className="pt-4" />

            {/* MIDDLE PART: Horizontal Divider Line & Collapsible Header */}
            <div className="my-4 pt-2 border-t border-stone-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-sm sm:text-base font-black text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <TrendingUp size={18} className="text-emerald-600 dark:text-emerald-400" />
                <span>專案數據統計</span>
              </span>
              <button
                type="button"
                onClick={() => setIsMetricsExpanded((prev) => !prev)}
                className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-extrabold border transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  isWarm
                    ? 'border-emerald-300 hover:bg-emerald-100/80 text-emerald-800 bg-emerald-50/80'
                    : 'border-emerald-800 hover:bg-emerald-950/60 text-emerald-300 bg-emerald-950/40'
                }`}
              >
                <span>{isMetricsExpanded ? '收摺數據' : '展開數據'}</span>
                {isMetricsExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>

            {/* BOTTOM PART: 4 Metric Cards Grid (Collapsible) */}
            {isMetricsExpanded && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in-50 duration-200">
          {/* Block 1: 專案總工時 */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
              isWarm ? 'bg-stone-50/80 border-stone-200/80' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 dark:text-slate-400">專案總工時</span>
              <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                <Clock size={16} />
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-stone-900 dark:text-slate-100">
                {totalDurationFormatted}
              </div>
              <div className="text-[11px] text-stone-400 mt-1.5 flex items-center justify-between">
                <span>累計 {totalWorkedMinutes} 分鐘 ({totalWorkedHours.toFixed(1)}h)</span>
                {totalBreakMinutes > 0 && <span>☕️ 休息 {totalBreakMinutes}m</span>}
              </div>
            </div>
          </div>

          {/* Block 2: 專案總收益 */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
              isWarm ? 'bg-stone-50/80 border-stone-200/80' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-stone-500 dark:text-slate-400">專案總收益</span>
              <div className="p-2 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                <DollarSign size={16} />
              </div>
            </div>
            <div>
              <div className="font-mono text-2xl sm:text-3xl font-black text-blue-600 dark:text-blue-400">
                {formatCurrency(totalRevenue, projCurrency)}
              </div>
              <div className="text-[11px] text-stone-400 mt-1.5">
                專案合約總額 (固定總收益)
              </div>
            </div>
          </div>

          {/* Block 3: 即時有效時薪 (In-Card Toggle with Eye & Slider Switch) */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
              isWarm ? 'bg-stone-50/80 border-stone-200/80' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-3 gap-2">
              <span className="text-xs font-bold text-stone-500 dark:text-slate-400">即時有效時薪</span>
              {onToggleShowHourlyRate && (
                <button
                  type="button"
                  onClick={() => onToggleShowHourlyRate(viewProjectId)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
                    isHourlyRateVisible
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                      : 'bg-stone-100 dark:bg-slate-800 text-stone-500 dark:text-slate-400 border-stone-200 dark:border-slate-700 hover:bg-stone-200 dark:hover:bg-slate-700'
                  }`}
                  title={isHourlyRateVisible ? '點擊關閉即時時薪計算' : '點擊開啟即時時薪計算'}
                >
                  {/* Visual Slider Pill Switch Track */}
                  <span
                    className={`w-6 h-3.5 rounded-full p-0.5 flex items-center transition-colors shrink-0 ${
                      isHourlyRateVisible ? 'bg-emerald-600 justify-end' : 'bg-stone-400 dark:bg-slate-600 justify-start'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-white shadow-2xs" />
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    {isHourlyRateVisible ? <Eye size={12} /> : <EyeOff size={12} />}
                    <span>{isHourlyRateVisible ? '顯示計算' : '隱藏計算'}</span>
                  </span>
                </button>
              )}
            </div>
            <div>
              {isHourlyRateVisible ? (
                <>
                  <div
                    className={`font-mono text-2xl sm:text-3xl font-black ${
                      budgetUsagePercent > 100
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {effectiveHourlyRateText}
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1.5 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <span>總收益 ÷ 累計總工時</span>
                      {budgetUsagePercent > 100 && (
                        <span className="text-rose-500 font-bold">⚠️ 超時拉低</span>
                      )}
                    </div>
                    <span className="text-[10px] text-stone-400 dark:text-slate-500">
                      {isUnderOneHour
                        ? '💡 累計滿 1 小時後將自動轉換為實質動態時薪'
                        : '💡 根據實質累計工時動態計算'}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm sm:text-base font-bold text-stone-500 dark:text-slate-400 py-1 flex items-center gap-1.5">
                    <span>📈 即時計算時薪功能已關閉</span>
                  </div>
                  <div className="text-[11px] text-stone-400 mt-1.5 flex flex-col gap-0.5">
                    <span className="text-[10px] text-stone-400 dark:text-slate-500">
                      💡 已隱藏即時計算時薪功能，點擊右上角「顯示計算」開關可還原顯示
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Block 4: 時間預算 / 安全工時 */}
          <div
            className={`rounded-2xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
              isWarm ? 'bg-stone-50/80 border-stone-200/80' : 'bg-slate-950/60 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-stone-500 dark:text-slate-400">時間預算 / 安全工時</span>
              <div
                className={`p-2 rounded-xl ${
                  budgetUsagePercent > 100
                    ? 'bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400'
                    : budgetUsagePercent >= 80
                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                    : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400'
                }`}
              >
                <Target size={16} />
              </div>
            </div>
            <div>
              {budgetedTotalHours > 0 ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className={budgetUsagePercent > 100 ? 'text-rose-600 dark:text-rose-400' : 'text-stone-700 dark:text-slate-200'}>
                      預算使用率 {budgetUsagePercent}%
                    </span>
                    <span className="font-mono text-stone-500 dark:text-slate-400 text-[11px]">
                      剩餘 {remainingSafeHours}h
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 rounded-full bg-stone-100 dark:bg-slate-800 overflow-hidden relative">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        budgetUsagePercent > 100
                          ? 'bg-rose-500'
                          : budgetUsagePercent >= 80
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, budgetUsagePercent)}%` }}
                    />
                  </div>

                  <div className="text-[10px] text-stone-400 flex items-center justify-between pt-0.5">
                    <span>上限：{budgetedTotalHours}h</span>
                    {budgetUsagePercent > 100 ? (
                      <span className="text-rose-500 font-bold">⚠️ 超出預算</span>
                    ) : (
                      <span>已用 {totalWorkedHours.toFixed(1)}h</span>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div className="text-sm font-bold text-stone-500 dark:text-slate-400">未設定上限</div>
                  <div className="text-[11px] text-stone-400 mt-1">可於編輯 Project 中設定</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>

      {/* ============================================================ */}
      {/* TIMESHEET RECORDS LIST & DELETION */}
      {/* ============================================================ */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border transition-all ${
          isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
        style={{
          borderLeftWidth: '4px',
          borderLeftColor: clientColor,
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800 gap-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400 shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-stone-900 dark:text-slate-100">
                Timesheet 詳細工時紀錄
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Copy Full Timesheet Text Button */}
            <button
              onClick={handleCopyFullTimesheet}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                copiedFullTimesheet
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : isWarm
                  ? 'border-stone-300 hover:bg-stone-100 text-stone-700'
                  : 'border-slate-700 hover:bg-slate-800 text-slate-300'
              }`}
              title="複製包含製表人姓名與職業的完整 Timesheet 文字摘要"
            >
              {copiedFullTimesheet ? <Check size={13} /> : <Copy size={13} />}
              <span>{copiedFullTimesheet ? '已複製完整 Timesheet' : '複製文字摘要'}</span>
            </button>

            {/* Export Timesheet PDF Report Button */}
            <button
              onClick={handleExportTimesheetPDF}
              disabled={isExportingPDF}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all cursor-pointer ${
                isWarm
                  ? 'border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800'
                  : 'border-emerald-900/80 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300'
              }`}
              title="匯出呈現製表人、專案資訊與完整工時明細的 PDF 報表"
            >
              <FileText size={13} className={isExportingPDF ? 'animate-pulse text-emerald-600' : ''} />
              <span>{isExportingPDF ? '正在匯出 PDF...' : '匯出 PDF 報表'}</span>
            </button>
          </div>
        </div>

        {/* 專案名稱與統計資訊分組列 */}
        <div className="pt-3 pb-3 flex items-center justify-between gap-2 border-b border-stone-100/80 dark:border-slate-800/80 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: clientColor }}
            />
            <span className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-slate-100 truncate">
              {currentProject.name}
            </span>
            <span className="text-xs text-stone-400 dark:text-slate-500 shrink-0">
              ({currentProject.clientName})
            </span>
          </div>
          <span className="text-xs font-bold text-stone-500 dark:text-slate-400 shrink-0">
            共 {projectSessions.length} 筆紀錄
          </span>
        </div>

        {projectSessions.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-slate-800 text-stone-400 flex items-center justify-center mx-auto">
              <Calendar size={20} />
            </div>
            <p className="text-xs font-bold text-stone-400">
              此 Project 尚無任何 Timesheet 紀錄
            </p>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('timer')}
                className="text-xs font-bold text-emerald-600 hover:underline cursor-pointer"
              >
                前往計時器開始開工 →
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-stone-100 dark:divide-slate-800">
            {projectSessions.map((session) => {
              const wH = Math.floor(session.workDurationMinutes / 60);
              const wM = session.workDurationMinutes % 60;
              const formattedDuration = wH > 0 ? (wM > 0 ? `${wH}h ${wM}m` : `${wH}h`) : `${wM}m`;

              const bH = Math.floor((session.breakDurationMinutes || 0) / 60);
              const bM = (session.breakDurationMinutes || 0) % 60;
              const formattedBreak = bH > 0 ? (bM > 0 ? `${bH}h ${bM}m` : `${bH}h`) : `${bM}m`;

              const isEditingThis = editingSessionId === session.id;

              return (
                <div
                  key={session.id}
                  id={`session-${session.id}`}
                  className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-stone-50/50 dark:hover:bg-slate-800/30 px-3 rounded-2xl transition-all duration-300"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-stone-600 dark:text-slate-300">
                        {session.date}
                        {session.isCrossMidnight && session.endDate && session.endDate !== session.date && (
                          <span className="text-[10px] ml-1 text-stone-400">~ {session.endDate}</span>
                        )}
                      </span>
                      {session.startTime && session.startTime !== '--:--' ? (
                        <span className="text-xs font-mono text-stone-400">
                          ({session.startTime} - {session.endTime})
                          {session.isCrossMidnight && (
                            <span className="ml-1 text-[10px] font-semibold text-purple-600 dark:text-purple-400">
                              (跨日)
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-stone-400">
                          (手動工時)
                        </span>
                      )}
                      {(session.breakDurationMinutes || 0) > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#ea580c] dark:text-orange-300">
                          ☕️ 休息：{formattedBreak}
                        </span>
                      )}
                    </div>

                    {isEditingThis ? (
                      <div className="flex items-center gap-2 pt-0.5">
                        <input
                          type="text"
                          autoFocus
                          value={editingSessionTitle}
                          onChange={(e) => setEditingSessionTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditSession(session);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              handleCancelEditSession();
                            }
                          }}
                          placeholder="請輸入修改後的工作內容..."
                          className={`w-full text-xs sm:text-sm font-semibold rounded-xl px-3 py-1.5 border outline-none transition-all ${
                            isWarm
                              ? 'bg-white border-emerald-500 text-stone-900 shadow-2xs focus:ring-2 focus:ring-emerald-500/20'
                              : 'bg-slate-950 border-emerald-500 text-slate-100 shadow-2xs focus:ring-2 focus:ring-emerald-500/20'
                          }`}
                        />
                      </div>
                    ) : (
                      <div
                        onClick={() => handleStartEditSession(session)}
                        className="flex items-start gap-1.5 cursor-pointer group/note"
                        title="點擊以修改筆記內容"
                      >
                        <FileText size={13} className="text-stone-400 dark:text-slate-500 shrink-0 mt-0.5 group-hover/note:text-emerald-600 dark:group-hover/note:text-emerald-400 transition-colors" />
                        <p className="text-xs sm:text-sm font-semibold text-stone-800 dark:text-slate-200 break-words group-hover/note:text-emerald-600 dark:group-hover/note:text-emerald-400 transition-colors">
                          {session.taskDescription}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right side: Actions / Status */}
                  {isEditingThis ? (
                    <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                      <button
                        type="button"
                        onClick={() => handleSaveEditSession(session)}
                        className="px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        title="儲存修改 (Enter)"
                      >
                        <Check size={14} />
                        <span>儲存</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleCancelEditSession}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          isWarm
                            ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'
                            : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                        }`}
                        title="取消修改 (Esc)"
                      >
                        <X size={14} />
                        <span>取消</span>
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 sm:gap-3 self-end sm:self-center shrink-0">
                      <span className="text-xs sm:text-sm font-mono font-black px-3.5 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                        {formattedDuration}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleStartEditSession(session)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors cursor-pointer"
                        title="點擊以修改筆記內容"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSessionToDelete(session)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                        title="刪除此筆工時紀錄"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 5. INDEPENDENT PROJECT MEMO / WORK NOTE SECTION */}
      {/* ============================================================ */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border transition-all space-y-6 ${
            isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
          }`}
          style={{
            borderLeftWidth: '4px',
            borderLeftColor: clientColor,
          }}
        >
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800 gap-3">
            <div>
              <h3 className="font-black text-base sm:text-lg text-stone-900 dark:text-slate-100 flex items-center gap-2">
                <span>工作筆記</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono font-bold bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-400">
                  {currentMemos.length} 則紀錄
                </span>
              </h3>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                一鍵記錄「{currentProject.name}」的重點備忘
              </p>
            </div>
          </div>

          {/* New Memo Input Box */}
          <div className="space-y-3">
            <textarea
              rows={3}
              placeholder={`例：
1. 聯絡 Marketing Amy
2. 聽日 WhatsApp 搵 Client 追覆稿 / Confirm 初稿
3. 尾款交稿後 14 日內過數 (FPS/Payme)`}
              value={projectMemoInput}
              onChange={(e) => setProjectMemoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSaveMemo();
                } else if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault();
                  handleSaveMemo();
                }
              }}
              className={`w-full text-xs sm:text-sm rounded-2xl p-4 border outline-none transition-all resize-y ${
                isWarm
                  ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                  : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
              }`}
            />
            <div className="flex items-center justify-between gap-3 px-1">
              <span className="text-[11px] text-stone-400 dark:text-slate-500 font-mono">
                字數：{projectMemoInput.length} 字
              </span>
              
              <button
                type="button"
                onClick={handleSaveMemo}
                className="px-5 py-2 rounded-2xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer shrink-0 hover:scale-102 active:scale-98"
                title="儲存此 Project 備忘筆記至下方歷史紀錄"
              >
                <CheckCircle2 size={16} />
                <span>儲存筆記</span>
              </button>
            </div>
          </div>

          {/* Saved Memos Table / History Section */}
          <div className="pt-4 border-t border-stone-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-stone-800 dark:text-slate-200 flex items-center gap-1.5">
                <Calendar size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>已儲存筆記歷史 / 紀錄列表</span>
              </span>
              {currentMemos.length > 0 && (
                <span className="text-[11px] text-stone-400">
                  共 {currentMemos.length} 筆備忘
                </span>
              )}
            </div>

            {currentMemos.length === 0 ? (
              <div
                className={`py-8 px-4 rounded-2xl border border-dashed text-center ${
                  isWarm ? 'bg-stone-50/60 border-stone-200' : 'bg-slate-950/40 border-slate-800'
                }`}
              >
                <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                  📝 尚無已儲存的專案備忘筆記
                </p>
                <p className="text-[11px] text-stone-400 mt-1">
                  請在上方輸入框填寫內容並點擊【儲存筆記】，資料將即時陳列於此表格中。
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-stone-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr
                      className={`border-b text-[11px] font-bold uppercase tracking-wider ${
                        isWarm
                          ? 'bg-stone-100/90 text-stone-600 border-stone-200'
                          : 'bg-slate-950 text-slate-400 border-slate-800'
                      }`}
                    >
                      <th className="py-3 px-4 w-36 sm:w-44 whitespace-nowrap">儲存時間</th>
                      <th className="py-3 px-4 min-w-[200px]">筆記內容</th>
                      <th className="py-3 px-4 w-24 text-right whitespace-nowrap">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-slate-800/80">
                    {currentMemos.map((memoItem) => (
                      <tr
                        key={memoItem.id}
                        className={`transition-colors ${
                          isWarm ? 'hover:bg-stone-50/80' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        {/* Time */}
                        <td className="py-3.5 px-4 align-top whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2 py-1 rounded-lg ${
                              isWarm
                                ? 'bg-stone-100 text-stone-700'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            <Clock size={12} className="opacity-60" />
                            <span>{memoItem.createdAt}</span>
                          </span>
                        </td>

                        {/* Content */}
                        <td className="py-3.5 px-4 align-top">
                          {editingMemoId === memoItem.id ? (
                            <div className="space-y-2">
                              <textarea
                                rows={3}
                                value={editingMemoContent}
                                onChange={(e) => setEditingMemoContent(e.target.value)}
                                className={`w-full text-xs sm:text-sm rounded-xl p-3 border outline-none transition-all resize-y ${
                                  isWarm
                                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                                    : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                                }`}
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditMemo(memoItem.id)}
                                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                                >
                                  <Check size={13} />
                                  <span>儲存修改</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelEditMemo}
                                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                                    isWarm
                                      ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'
                                      : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
                                  }`}
                                >
                                  取消
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p
                              onClick={() => handleStartEditMemo(memoItem)}
                              className="text-xs sm:text-sm text-stone-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed break-words font-sans cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                              title="點擊以修改筆記內容"
                            >
                              {memoItem.content}
                            </p>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 align-top text-right whitespace-nowrap">
                          <div className="inline-flex items-center justify-end gap-1.5">
                            {/* Edit Button */}
                            <button
                              type="button"
                              onClick={() => handleStartEditMemo(memoItem)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                editingMemoId === memoItem.id
                                  ? 'bg-emerald-600 text-white border-emerald-600'
                                  : isWarm
                                  ? 'border-stone-200 text-stone-600 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-300'
                                  : 'border-slate-700 text-slate-300 hover:text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-700'
                              }`}
                              title="點擊以修改筆記內容"
                            >
                              <Edit2 size={14} />
                            </button>

                            {/* Copy Button */}
                            <button
                              type="button"
                              onClick={() => handleCopyMemo(memoItem.content, memoItem.id)}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                copiedMemoId === memoItem.id
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : isWarm
                                  ? 'border-stone-200 text-stone-600 hover:text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300'
                                  : 'border-slate-700 text-slate-300 hover:text-emerald-400 hover:bg-emerald-950/40 hover:border-emerald-700'
                              }`}
                              title="複製此筆記內容"
                            >
                              {copiedMemoId === memoItem.id ? (
                                <Check size={14} />
                              ) : (
                                <Copy size={14} />
                              )}
                            </button>

                            {/* Delete Button */}
                            <button
                              type="button"
                              onClick={() => handleDeleteMemo(memoItem.id)}
                              className="p-1.5 rounded-lg border border-transparent text-stone-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:border-rose-200 dark:hover:border-rose-900 transition-all cursor-pointer"
                              title="刪除此筆記"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </>
    ) : null}

      {/* Edit Project Modal */}
      <EditProjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        project={currentProject}
        onUpdateProject={(updatedProject) => {
          if (projectFilterTab === 'archived' && currentProject?.isArchived && !updatedProject.isArchived) {
            const remainingArchived = archivedProjects.filter((p) => p.id !== updatedProject.id);
            if (remainingArchived.length === 0) {
              setProjectFilterTab('active');
              handleViewProjectChange(updatedProject.id);
              if (setActiveProjectId) {
                setActiveProjectId(updatedProject.id);
              }
            }
          }
          onUpdateProject(updatedProject);
        }}
        existingClients={existingClients}
        defaultCurrency={freelancerProfile.defaultCurrency || 'HKD'}
      />

      {/* Confirm Delete Single Session Modal */}
      <ConfirmDeleteModal
        isOpen={!!sessionToDelete}
        onClose={() => setSessionToDelete(null)}
        onConfirm={() => {
          if (sessionToDelete) {
            onDeleteSession(sessionToDelete.id);
            setSessionToDelete(null);
          }
        }}
        sessionDescription={
          sessionToDelete
            ? `${sessionToDelete.date} ${sessionToDelete.taskDescription} (${sessionToDelete.workDurationMinutes}分鐘)`
            : ''
        }
      />

      {/* Confirm Delete Entire Project Modal */}
      <ConfirmDeleteProjectModal
        isOpen={isDeleteProjectModalOpen}
        onClose={() => setIsDeleteProjectModalOpen(false)}
        onConfirm={handleConfirmDeleteProject}
        project={currentProject}
        sessionCount={projectSessions.length}
      />

      {/* Batch Delete Projects Modal */}
      <BatchDeleteProjectsModal
        isOpen={isBatchDeleteModalOpen}
        onClose={() => setIsBatchDeleteModalOpen(false)}
        projects={projectFilterTab === 'active' ? activeProjects : archivedProjects}
        mode={projectFilterTab}
        onConfirmDelete={handleBatchDeleteProjects}
        onMoveProjects={onMoveProjects}
        onArchiveProjects={handleBatchArchiveProjects}
        onUnarchiveProjects={handleBatchUnarchiveProjects}
        existingClients={existingClients}
      />
    </div>
  );
};
