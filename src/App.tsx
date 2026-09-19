import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  BarChart3,
  Edit3,
  CheckCircle2,
  RotateCcw,
  User,
  Eye,
  EyeOff,
  Play,
  Pause,
  Square,
  Coffee,
} from 'lucide-react';
import { ThemeProvider, useTheme } from './ThemeContext';
import { Project, TimeSession, FreelancerProfile, TimerBridge } from './types';
import { TimerTab } from './components/tabs/TimerTab';
import { CalculatorTab } from './components/tabs/CalculatorTab';
import { ManualEntryTab } from './components/tabs/ManualEntryTab';
import { ConfirmClearModal } from './components/modals/ConfirmClearModal';
import { NewProjectModal } from './components/modals/NewProjectModal';
import { ProfileModal } from './components/modals/ProfileModal';
import { TimerRunningInterceptionModal } from './components/modals/TimerRunningInterceptionModal';
import {
  LOCAL_STORAGE_KEYS,
  loadFromLocalStorage,
  saveToLocalStorage,
  clearAllLocalStorage,
} from './utils/storage';

function AppContent() {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  // 3-Tab Architecture: 'timer' | 'calculator' | 'manual-entry'
  const [activeTab, setActiveTab] = useState<string>('timer');

  // Modal States
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [timerResetKey, setTimerResetKey] = useState<number>(0);

  // Hourly Rate Show/Hide Toggle State (Per-Project State Map)
  const [hourlyRateVisibilityMap, setHourlyRateVisibilityMap] = useState<Record<string, boolean>>(() =>
    loadFromLocalStorage<Record<string, boolean>>(LOCAL_STORAGE_KEYS.HOURLY_RATE_VISIBILITY_MAP, {})
  );

  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.HOURLY_RATE_VISIBILITY_MAP, hourlyRateVisibilityMap);
  }, [hourlyRateVisibilityMap]);

  const handleToggleShowHourlyRate = useCallback((targetProjectId?: string) => {
    if (!targetProjectId) return;
    setHourlyRateVisibilityMap((prev) => {
      const currentVal = prev[targetProjectId] !== false;
      const next = { ...prev, [targetProjectId]: !currentVal };
      saveToLocalStorage(LOCAL_STORAGE_KEYS.HOURLY_RATE_VISIBILITY_MAP, next);
      return next;
    });
  }, []);

  // Timer Bridge State for Global Interception
  const [timerBridge, setTimerBridge] = useState<TimerBridge | null>(null);
  const [isInterceptionModalOpen, setIsInterceptionModalOpen] = useState(false);
  const [pendingInterceptionAction, setPendingInterceptionAction] = useState<
    | { type: 'switch_project'; targetProjectId: string }
    | { type: 'new_project' }
    | null
  >(null);

  // Initial State with LocalStorage Persistence
  // 1. Projects
  const [projects, setProjects] = useState<Project[]>(() =>
    loadFromLocalStorage<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, [])
  );

  // 2. Time Sessions
  const [sessions, setSessions] = useState<TimeSession[]>(() =>
    loadFromLocalStorage<TimeSession[]>(LOCAL_STORAGE_KEYS.SESSIONS, [])
  );

  // 3. Freelancer Profile
  const [freelancerProfile, setFreelancerProfile] = useState<FreelancerProfile>(() =>
    loadFromLocalStorage<FreelancerProfile>(LOCAL_STORAGE_KEYS.FREELANCER_PROFILE, {
      name: '',
      title: '',
      email: '',
      paymentInfo: '',
    })
  );

  // 4. Active Project ID (Global synchronization across tabs + LocalStorage persist)
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const saved = loadFromLocalStorage<string>(LOCAL_STORAGE_KEYS.ACTIVE_PROJECT_ID, '');
    const allProjects = loadFromLocalStorage<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, []);
    if (saved && allProjects.some((p) => p.id === saved)) return saved;
    return allProjects[0]?.id || '';
  });

  // Persistent localStorage synchronization
  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.PROJECTS, projects);
  }, [projects]);

  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.SESSIONS, sessions);
  }, [sessions]);

  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.FREELANCER_PROFILE, freelancerProfile);
  }, [freelancerProfile]);

  useEffect(() => {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.ACTIVE_PROJECT_ID, activeProjectId);
  }, [activeProjectId]);

  // Ensure activeProjectId remains valid when projects change
  useEffect(() => {
    if (projects.length > 0) {
      if (!activeProjectId || !projects.some((p) => p.id === activeProjectId)) {
        setActiveProjectId(projects[0].id);
      }
    } else {
      setActiveProjectId('');
    }
  }, [projects]);

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

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Add or record new session (updates project total worked hours & saves session)
  const handleSaveSession = useCallback((newSession: TimeSession) => {
    setSessions((prev) => [newSession, ...prev]);

    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === newSession.projectId) {
          const addedHours = newSession.workDurationMinutes / 60;
          return {
            ...p,
            totalWorkedHours: +(p.totalWorkedHours + addedHours).toFixed(4),
          };
        }
        return p;
      })
    );

    showToast(`✅ 已記錄 ${newSession.workDurationMinutes} 分鐘工時！`);
  }, [showToast]);

  // Delete a session and rollback project worked hours
  const handleDeleteSession = useCallback((sessionId: string) => {
    let targetProjectId = '';
    let deductedHours = 0;

    setSessions((prev) => {
      const targetSession = prev.find((s) => s.id === sessionId);
      if (targetSession && targetSession.projectId) {
        targetProjectId = targetSession.projectId;
        deductedHours = targetSession.workDurationMinutes / 60;
      }
      return prev.filter((s) => s.id !== sessionId);
    });

    if (targetProjectId) {
      setProjects((prev) =>
        prev.map((p) => {
          if (p.id === targetProjectId) {
            return {
              ...p,
              totalWorkedHours: Math.max(
                0,
                +(p.totalWorkedHours - deductedHours).toFixed(4)
              ),
            };
          }
          return p;
        })
      );
    }
    showToast('已刪除工時紀錄並重新計算。');
  }, [showToast]);

  // Update a session (e.g. edit task description)
  const handleUpdateSession = useCallback((updatedSession: TimeSession) => {
    setSessions((prev) => {
      const oldSession = prev.find((s) => s.id === updatedSession.id);
      if (oldSession && oldSession.workDurationMinutes !== updatedSession.workDurationMinutes) {
        const diffHours = (updatedSession.workDurationMinutes - oldSession.workDurationMinutes) / 60;
        setProjects((prevProj) =>
          prevProj.map((p) => {
            if (p.id === updatedSession.projectId) {
              return {
                ...p,
                totalWorkedHours: Math.max(0, +(p.totalWorkedHours + diffHours).toFixed(4)),
              };
            }
            return p;
          })
        );
      }
      return prev.map((s) => (s.id === updatedSession.id ? updatedSession : s));
    });
  }, []);

  // Delete an entire Project and its associated Timesheet records
  const handleDeleteProject = useCallback((projectId: string) => {
    setProjects((prev) => {
      const target = prev.find((p) => p.id === projectId);
      if (target) {
        showToast(`🗑️ 已永久刪除 Project「${target.name}」及旗下所有 Timesheet 紀錄！`);
      }
      return prev.filter((p) => p.id !== projectId);
    });
    setSessions((prev) => prev.filter((s) => s.projectId !== projectId));
  }, [showToast]);

  // Delete multiple Projects and their associated Timesheet records
  const handleDeleteProjects = useCallback((projectIds: string[]) => {
    if (projectIds.length === 0) return;
    setProjects((prev) => prev.filter((p) => !projectIds.includes(p.id)));
    setSessions((prev) => prev.filter((s) => !projectIds.includes(s.projectId)));
    showToast(`🗑️ 已成功一鍵刪除 ${projectIds.length} 個 Project 及旗下工時紀錄！`);
  }, [showToast]);

  // Batch move projects to another Client
  const handleMoveProjects = useCallback((projectIds: string[], targetClientName: string) => {
    if (projectIds.length === 0 || !targetClientName.trim()) return;
    const trimmedClient = targetClientName.trim();
    setProjects((prev) =>
      prev.map((p) => {
        if (projectIds.includes(p.id)) {
          return {
            ...p,
            clientName: trimmedClient,
          };
        }
        return p;
      })
    );
    showToast(`🚚 已成功將 ${projectIds.length} 個 Project 移動至 Client「${trimmedClient}」！`);
  }, [showToast]);

  // Update a project
  const handleUpdateProject = useCallback((updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === updatedProject.id) {
          return updatedProject;
        }
        // If another project belongs to the same client and clientColor was changed, sync clientColor
        if (p.clientName.trim().toLowerCase() === updatedProject.clientName.trim().toLowerCase()) {
          return {
            ...p,
            clientColor: updatedProject.clientColor || updatedProject.color,
            color: updatedProject.color || updatedProject.clientColor,
          };
        }
        return p;
      })
    );
    showToast(`✅ Project「${updatedProject.name}」已更新！`);
  }, [showToast]);

  // Create a new project & auto-switch to it
  const handleCreateProject = useCallback((newProject: Project) => {
    setProjects((prev) => [newProject, ...prev]);
    setActiveProjectId(newProject.id);
    showToast(`🎉 成功建立 Project「${newProject.name}」！已自動切換選取。`);
  }, [showToast]);

  const handleRegisterTimerBridge = useCallback((bridge: TimerBridge) => {
    setTimerBridge((prev) => {
      if (
        prev &&
        prev.isRunning === bridge.isRunning &&
        prev.timerState === bridge.timerState &&
        prev.projectId === bridge.projectId &&
        prev.projectName === bridge.projectName &&
        prev.elapsedFormatted === bridge.elapsedFormatted
      ) {
        return prev;
      }
      return bridge;
    });
  }, []);

  // Interception Triggers & Handlers
  const handleTriggerNewProject = useCallback(() => {
    if (timerBridge?.isRunning) {
      setPendingInterceptionAction({ type: 'new_project' });
      setIsInterceptionModalOpen(true);
      return;
    }
    setIsNewProjectModalOpen(true);
  }, [timerBridge?.isRunning]);

  const handleRequestSwitchProject = useCallback((targetProjectId: string) => {
    if (targetProjectId === activeProjectId) return;
    if (timerBridge?.isRunning) {
      setPendingInterceptionAction({ type: 'switch_project', targetProjectId });
      setIsInterceptionModalOpen(true);
      return;
    }
    setActiveProjectId(targetProjectId);
  }, [activeProjectId, timerBridge?.isRunning]);

  const handleRequestInterception = useCallback((
    action: { type: 'switch_project'; targetProjectId: string } | { type: 'new_project' }
  ) => {
    setPendingInterceptionAction(action);
    setIsInterceptionModalOpen(true);
  }, []);

  const handleInterceptionStopAndSave = useCallback(() => {
    const action = pendingInterceptionAction;
    if (timerBridge) {
      timerBridge.stopAndSave(() => {
        setIsInterceptionModalOpen(false);
        setPendingInterceptionAction(null);
        if (action?.type === 'switch_project' && action.targetProjectId) {
          setActiveProjectId(action.targetProjectId);
          showToast(`✅ 已結算並儲存工時，已切換至新專案！`);
        } else if (action?.type === 'new_project') {
          setIsNewProjectModalOpen(true);
          showToast(`✅ 已結算並儲存工時，請建立新 Project！`);
        }
      });
    } else {
      setIsInterceptionModalOpen(false);
      setPendingInterceptionAction(null);
    }
  }, [pendingInterceptionAction, timerBridge, showToast]);

  const handleInterceptionDiscard = useCallback(() => {
    const action = pendingInterceptionAction;
    if (timerBridge) {
      timerBridge.discard(() => {
        setIsInterceptionModalOpen(false);
        setPendingInterceptionAction(null);
        if (action?.type === 'switch_project' && action.targetProjectId) {
          setActiveProjectId(action.targetProjectId);
          showToast('🗑️ 已放棄當時計時，並切換至新專案。');
        } else if (action?.type === 'new_project') {
          setIsNewProjectModalOpen(true);
          showToast('🗑️ 已放棄當時計時，請建立新 Project！');
        }
      });
    } else {
      setIsInterceptionModalOpen(false);
      setPendingInterceptionAction(null);
    }
  }, [pendingInterceptionAction, timerBridge, showToast]);

  const handleInterceptionCancel = useCallback(() => {
    setIsInterceptionModalOpen(false);
    setPendingInterceptionAction(null);
  }, []);

  const targetProject = pendingInterceptionAction?.type === 'switch_project'
    ? projects.find((p) => p.id === pendingInterceptionAction.targetProjectId)
    : undefined;

  // Completely Reset / Clear All Data (Clean State)
  const handleConfirmClearAll = () => {
    clearAllLocalStorage();
    setProjects([]);
    setSessions([]);
    setTimerResetKey((prev) => prev + 1);
    setIsClearModalOpen(false);
    setActiveTab('timer');
    showToast('✨ 所有工時、Project、歷史紀錄與計時器已完全重置清空！');
  };

  // Active Timer Global Banner state & logic
  const isTimerActive = Boolean(
    timerBridge?.isRunning &&
    (timerBridge.timerState === 'working' || timerBridge.timerState === 'resting') &&
    timerBridge.projectId
  );

  const activeTimerProjectId = timerBridge?.projectId || '';
  const activeTimerProject = projects.find((p) => p.id === activeTimerProjectId);
  const activeTimerProjectName =
    timerBridge?.projectName || activeTimerProject?.name || '當前專案';
  const isResting = timerBridge?.timerState === 'resting';

  // Independent project view selection for Page 2 (Overview) and Page 3 (Manual Entry)
  const [overviewProjectId, setOverviewProjectId] = useState<string>(() => {
    return activeProjectId || projects[0]?.id || '';
  });

  const [manualEntryProjectId, setManualEntryProjectId] = useState<string>(() => {
    return activeProjectId || projects[0]?.id || '';
  });

  // Keep overviewProjectId and manualEntryProjectId valid if projects change
  useEffect(() => {
    if (projects.length > 0) {
      if (!overviewProjectId || !projects.some((p) => p.id === overviewProjectId)) {
        setOverviewProjectId(projects[0].id);
      }
      if (!manualEntryProjectId || !projects.some((p) => p.id === manualEntryProjectId)) {
        setManualEntryProjectId(projects[0].id);
      }
    }
  }, [projects, overviewProjectId, manualEntryProjectId]);

  // Page 1 (timer) strictly hides banner
  // Page 2 & 3 only show banner when viewing a project different from the active timer
  const isViewingDifferentProjectInOtherPage =
    (activeTab === 'calculator' && overviewProjectId !== activeTimerProjectId) ||
    (activeTab === 'manual-entry' && manualEntryProjectId !== activeTimerProjectId);

  const showGlobalActiveBanner =
    isTimerActive && activeTab !== 'timer' && isViewingDifferentProjectInOtherPage;

  const handleReturnToActiveTimerProject = () => {
    if (activeTimerProjectId) {
      setActiveProjectId(activeTimerProjectId);
    }
    setActiveTab('timer');
  };

  // 3-Tab Navigation Definition (Monochrome vector icons)
  const navTabs = [
    { id: 'timer', label: '工作計時 (Timer)', icon: Clock },
    { id: 'calculator', label: 'Project 總覽 (Overview)', icon: BarChart3 },
    { id: 'manual-entry', label: '補記工時與追加報價 (Manual Entry & Scope)', icon: Edit3 },
  ];

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isWarm ? 'bg-stone-100/90 text-stone-800' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="app-global-toast"
          className={`fixed top-24 right-6 z-50 text-white px-4 py-2.5 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 border transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            isResting || toastMessage.includes('休息') || toastMessage.includes('☕')
              ? 'bg-[#ea580c] border-orange-400 shadow-orange-950/20'
              : 'bg-emerald-600 border-emerald-400 shadow-emerald-950/20'
          }`}
        >
          {isResting || toastMessage.includes('休息') || toastMessage.includes('☕') ? (
            <Coffee size={16} className="text-white shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-white shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Sticky Top Header with Dedicated Tab Bar */}
      <header
        className={`sticky top-0 z-50 border-b backdrop-blur-md transition-colors ${
          isWarm
            ? 'bg-stone-50/95 border-stone-200 text-stone-900 shadow-xs'
            : 'bg-slate-900/95 border-slate-800 text-slate-100 shadow-xs'
        }`}
      >
        {/* Upper Brand & Controls Bar */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center shrink-0 overflow-hidden">
              <img
                src="/Freelife-log_icon_v2.png"
                alt="FreeLife Log"
                className="w-full h-full object-contain bg-transparent"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg tracking-tight">FreeLife Log</h1>
              </div>
              <p className="text-[10px] text-stone-500 dark:text-slate-400">
                紀錄Freelancer的生活
              </p>
            </div>
          </div>

          {/* Header Quick Controls */}
          <div className="flex items-center gap-2.5">
            {/* User Profile / Creator Badge */}
            <button
              onClick={() => setIsProfileModalOpen(true)}
              className={`h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isWarm
                  ? 'border-stone-300 bg-stone-100/80 hover:bg-stone-200 text-stone-800'
                  : 'border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200'
              }`}
              title="設定製表人姓名與職業"
            >
              <User size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div className="text-left leading-tight hidden xs:block">
                <div className="font-extrabold truncate max-w-[100px] sm:max-w-[130px]">
                  {freelancerProfile.name || '輸入姓名...'}
                </div>
                <div className="text-[10px] text-stone-500 dark:text-slate-400 truncate max-w-[100px] sm:max-w-[130px]">
                  {freelancerProfile.title || '設定職業...'}
                </div>
              </div>
            </button>

            {/* Prominent New Project Button (With Timer Interception Safeguard) - Hidden during empty state */}
            {projects.length > 0 && (
              <button
                onClick={handleTriggerNewProject}
                className="h-9 px-4 rounded-xl text-xs sm:text-sm font-black bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all shadow-md shadow-emerald-600/20 cursor-pointer hover:scale-102"
                title="創建新的 Project"
              >
                <span>＋ 新增 Project</span>
              </button>
            )}

            {/* Clear All Data with Modal Confirmation - Explicitly labelled "重置紀錄" */}
            <button
              onClick={() => setIsClearModalOpen(true)}
              className={`px-2.5 sm:px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                isWarm
                  ? 'border-rose-300 bg-rose-50/70 hover:bg-rose-100 text-rose-700'
                  : 'border-rose-900/80 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300'
              }`}
              title="清空所有紀錄與資料（含防呆確認）"
            >
              <RotateCcw size={14} className="shrink-0" />
              <span className="hidden sm:inline">重置紀錄</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Tab Viewport (Preserved in DOM to prevent losing background timer state) */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-28 space-y-6">
        {/* Global Active Banner between Header and Project Selector Card */}
        {showGlobalActiveBanner && (
          <div
            id="global-active-timer-banner"
            className={`rounded-2xl p-4 border-2 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200 ${
              isResting
                ? 'bg-[#fff7ed] dark:bg-[#281810] border-[#ea580c]'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/60'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-hidden">
              <span className="relative flex h-3 w-3 shrink-0">
                <span
                  className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                    isResting ? 'bg-orange-400' : 'bg-emerald-400'
                  }`}
                />
                <span
                  className={`relative inline-flex rounded-full h-3 w-3 ${
                    isResting ? 'bg-[#ea580c]' : 'bg-emerald-500'
                  }`}
                />
              </span>
              <span
                className={`text-xs sm:text-sm font-black truncate ${
                  isResting
                    ? 'text-[#9a3412] dark:text-[#fdba74]'
                    : 'text-emerald-950 dark:text-emerald-200'
                }`}
                title={
                  isResting
                    ? `☕ 「${activeTimerProjectName}」休息中... CHILL 下先啦`
                    : `⏱️ 正在為「${activeTimerProjectName}」計時中`
                }
              >
                {isResting
                  ? `☕ 「${activeTimerProjectName}」休息中... CHILL 下先啦`
                  : `⏱️ 正在為「${activeTimerProjectName}」計時中`}
              </span>
            </div>

            <button
              type="button"
              id="btn-return-to-active-timer"
              onClick={handleReturnToActiveTimerProject}
              className={`px-3.5 py-1.5 rounded-xl font-black text-xs text-white transition-all cursor-pointer shadow-xs self-end sm:self-auto shrink-0 flex items-center gap-1 hover:scale-102 active:scale-98 ${
                isResting
                  ? 'bg-[#ea580c] hover:bg-[#c2410c]'
                  : 'bg-emerald-600 hover:bg-emerald-700'
              }`}
              title="回到計時專案"
            >
              <span>回到計時專案 ➔</span>
            </button>
          </div>
        )}

        {/* Tab 1: 核心計時 (Timer) */}
        <div className={activeTab === 'timer' ? 'block' : 'hidden'}>
          <TimerTab
            key={timerResetKey}
            projects={projects}
            sessions={sessions}
            onSaveSession={handleSaveSession}
            onNavigateTab={setActiveTab}
            onOpenNewProjectModal={handleTriggerNewProject}
            onUpdateProject={handleUpdateProject}
            activeProjectId={activeProjectId}
            setActiveProjectId={setActiveProjectId}
            onRegisterTimerBridge={handleRegisterTimerBridge}
            onRequestInterception={handleRequestInterception}
            hourlyRateVisibilityMap={hourlyRateVisibilityMap}
            onToggleShowHourlyRate={handleToggleShowHourlyRate}
          />
        </div>

        {/* Tab 2: Project 總覽 (Overview) */}
        <div className={activeTab === 'calculator' ? 'block' : 'hidden'}>
          <CalculatorTab
            projects={projects}
            sessions={sessions}
            onDeleteSession={handleDeleteSession}
            onUpdateSession={handleUpdateSession}
            onDeleteProject={handleDeleteProject}
            onDeleteProjects={handleDeleteProjects}
            onMoveProjects={handleMoveProjects}
            onUpdateProject={handleUpdateProject}
            onNavigateTab={setActiveTab}
            onOpenNewProjectModal={handleTriggerNewProject}
            freelancerProfile={freelancerProfile}
            activeProjectId={activeProjectId}
            viewProjectId={overviewProjectId}
            onViewProjectChange={setOverviewProjectId}
            hourlyRateVisibilityMap={hourlyRateVisibilityMap}
            onToggleShowHourlyRate={handleToggleShowHourlyRate}
            timerStatus={
              timerBridge
                ? {
                    isRunning: timerBridge.isRunning,
                    projectId: timerBridge.projectId,
                    projectName: timerBridge.projectName,
                    elapsedFormatted: timerBridge.elapsedFormatted,
                  }
                : undefined
            }
            onRequestSwitchProject={handleRequestSwitchProject}
          />
        </div>

        {/* Tab 3: 補記工時與追加報價 (Manual Entry & Scope) */}
        <div className={activeTab === 'manual-entry' ? 'block' : 'hidden'}>
          <ManualEntryTab
            projects={projects}
            sessions={sessions}
            onSaveSession={handleSaveSession}
            onNavigateTab={setActiveTab}
            onOpenNewProjectModal={handleTriggerNewProject}
            onUpdateProject={handleUpdateProject}
            activeProjectId={activeProjectId}
            viewProjectId={manualEntryProjectId}
            onViewProjectChange={setManualEntryProjectId}
            timerStatus={
              timerBridge
                ? {
                    isRunning: timerBridge.isRunning,
                    projectId: timerBridge.projectId,
                    projectName: timerBridge.projectName,
                    elapsedFormatted: timerBridge.elapsedFormatted,
                  }
                : undefined
            }
          />
        </div>
      </main>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={freelancerProfile}
        onSaveProfile={setFreelancerProfile}
      />

      {/* Confirmation Modal for Reset / Clear Data */}
      <ConfirmClearModal
        isOpen={isClearModalOpen}
        onClose={() => setIsClearModalOpen(false)}
        onConfirm={handleConfirmClearAll}
      />

      {/* Modal for Creating a New Project */}
      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onAddProject={handleCreateProject}
        existingClients={existingClients}
      />

      {/* Global Timer Running Interception Modal */}
      <TimerRunningInterceptionModal
        isOpen={isInterceptionModalOpen}
        onClose={handleInterceptionCancel}
        currentProjectName={timerBridge?.projectName || '當前專案'}
        elapsedFormatted={timerBridge?.elapsedFormatted || '00:00:00'}
        targetActionType={pendingInterceptionAction?.type || 'switch_project'}
        targetProjectName={targetProject?.name}
        onStopAndSave={handleInterceptionStopAndSave}
        onDiscardAndProceed={handleInterceptionDiscard}
      />

      {/* Creator Footer */}
      <footer className={`py-6 pb-28 mt-6 text-center text-xs border-t transition-colors ${
        isWarm ? 'border-stone-200/60 text-stone-400' : 'border-slate-800/60 text-slate-500'
      }`}>
        <p className="tracking-wide font-normal">
          Created by <span className="font-medium text-stone-500 dark:text-slate-400">Kyra Chan</span>
        </p>
      </footer>

      {/* Fixed Bottom Navigation Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md transition-colors px-2 py-1.5 shadow-lg ${
        isWarm ? 'bg-white/95 border-stone-200 text-stone-800' : 'bg-slate-900/95 border-slate-800 text-slate-100'
      }`}>
        <nav className="max-w-md mx-auto grid grid-cols-3 gap-1">
          {[
            { id: 'timer', label: '工作計時', icon: Clock },
            { id: 'calculator', label: 'Project總覽', icon: BarChart3 },
            { id: 'manual-entry', label: '補記工時', icon: Edit3 },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all cursor-pointer ${
                  isActive
                    ? 'text-emerald-600 dark:text-emerald-400 font-extrabold bg-emerald-50/80 dark:bg-emerald-950/40'
                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 font-medium'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-emerald-600 dark:text-emerald-400' : ''} />
                <span className="text-[11px] mt-0.5 tracking-tight">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
