import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Clock,
  Play,
  Coffee,
  CheckCircle2,
  Plus,
  AlertTriangle,
  Droplets,
  Lock,
  FileText,
  RotateCcw,
  Edit2,
  TrendingUp,
  DollarSign,
  PieChart,
  MoreVertical,
  BarChart3,
  Layers,
  FolderMinus,
  Square,
  Sparkles,
} from 'lucide-react';
import { Project, TimeSession, TimerBridge } from '../../types';
import { useTheme } from '../../ThemeContext';
import { EditProjectModal } from '../modals/EditProjectModal';
import { TimerRunningInterceptionModal } from '../modals/TimerRunningInterceptionModal';
import { ProjectSelectDropdown } from '../common/ProjectSelectDropdown';
import { ProjectHeader } from '../common/ProjectHeader';
import { getClientColor } from '../../utils/clientColors';
import {
  LOCAL_STORAGE_KEYS,
  loadFromLocalStorage,
  saveToLocalStorage,
} from '../../utils/storage';
import { soundEffects } from '../../utils/audioAlerts';
import { sendSystemNotification } from '../../utils/notifications';

export interface ActiveTimerSaveState {
  selectedProjectId: string;
  timerProjectId?: string | null;
  taskNote: string;
  taskTag: string;
  timerState: 'idle' | 'working' | 'resting';
  workStartedAt: number | null;
  breakStartedAt: number | null;
  accumulatedWorkSeconds: number;
  accumulatedBreakSeconds: number;
  sessionStartTime: string;
  continuousWorkStartTime: number | null;
}

interface TimerTabProps {
  projects: Project[];
  sessions: TimeSession[];
  onSaveSession: (newSession: TimeSession) => void;
  onNavigateTab?: (tabId: string) => void;
  onOpenNewProjectModal?: () => void;
  onUpdateProject?: (project: Project) => void;
  activeProjectId?: string;
  setActiveProjectId?: (id: string) => void;
  onRegisterTimerBridge?: (bridge: TimerBridge) => void;
  onRequestInterception?: (action: { type: 'switch_project'; targetProjectId: string } | { type: 'new_project' }) => void;
  showHourlyRate?: boolean;
  hourlyRateVisibilityMap?: Record<string, boolean>;
  onToggleShowHourlyRate?: (projectId?: string) => void;
}

export const TimerTab: React.FC<TimerTabProps> = ({
  projects,
  sessions,
  onSaveSession,
  onNavigateTab,
  onOpenNewProjectModal,
  onUpdateProject,
  activeProjectId,
  setActiveProjectId,
  onRegisterTimerBridge,
  onRequestInterception,
  showHourlyRate = true,
  hourlyRateVisibilityMap,
  onToggleShowHourlyRate,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  // 1. Load active timer state from localStorage
  const savedTimer = loadFromLocalStorage<ActiveTimerSaveState | null>(
    LOCAL_STORAGE_KEYS.TIMER_STATE,
    null
  );

  // Selected project for timer (always preserved!)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      return activeProjectId;
    }
    if (savedTimer?.selectedProjectId && projects.some((p) => p.id === savedTimer.selectedProjectId)) {
      return savedTimer.selectedProjectId;
    }
    return projects[0]?.id || '';
  });

  // Project Memo / Task Note state
  const [taskNote, setTaskNote] = useState<string>(savedTimer?.taskNote || '');

  // Timestamp Delta States
  const [timerState, setTimerState] = useState<'idle' | 'working' | 'resting'>(
    savedTimer?.timerState || 'idle'
  );
  const [workStartedAt, setWorkStartedAt] = useState<number | null>(
    savedTimer?.workStartedAt || null
  );
  const [breakStartedAt, setBreakStartedAt] = useState<number | null>(
    savedTimer?.breakStartedAt || null
  );
  const [accumulatedWorkSeconds, setAccumulatedWorkSeconds] = useState<number>(
    savedTimer?.accumulatedWorkSeconds || 0
  );
  const [accumulatedBreakSeconds, setAccumulatedBreakSeconds] = useState<number>(
    savedTimer?.accumulatedBreakSeconds || 0
  );
  const [sessionStartTime, setSessionStartTime] = useState<string>(
    savedTimer?.sessionStartTime || '--:--'
  );
  const [continuousWorkStartTime, setContinuousWorkStartTime] = useState<number | null>(
    savedTimer?.continuousWorkStartTime || null
  );

  // Check if timer is actively running or has uncommitted recorded time
  const isTimerRunning = timerState === 'working' || timerState === 'resting' || accumulatedWorkSeconds > 0;

  // Locked timer project ID (decoupled from selected view project)
  const [timerProjectId, setTimerProjectId] = useState<string | null>(() => {
    if (savedTimer?.timerProjectId && projects.some((p) => p.id === savedTimer.timerProjectId)) {
      return savedTimer.timerProjectId;
    }
    if (isTimerRunning && savedTimer?.selectedProjectId) {
      return savedTimer.selectedProjectId;
    }
    return null;
  });

  // Interception Modal states for project switch or new project attempts
  const [isInterceptionModalOpen, setIsInterceptionModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'switch_project'; targetProjectId: string }
    | { type: 'new_project' }
    | null
  >(null);

  // Synchronize when global activeProjectId changes externally (only when idle)
  useEffect(() => {
    if (
      activeProjectId &&
      activeProjectId !== selectedProjectId &&
      projects.some((p) => p.id === activeProjectId)
    ) {
      if (!isTimerRunning) {
        setSelectedProjectId(activeProjectId);
        setTimerProjectId(activeProjectId);
      }
    }
  }, [activeProjectId, projects, selectedProjectId, isTimerRunning]);

  // Interval Ref to ensure complete cleanup on reset or unmount
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Re-render tick trigger
  const [tick, setTick] = useState<number>(0);

  // Toast and alert snooze states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'focus' | 'break'>('focus');
  const [snoozedAlert, setSnoozedAlert] = useState(false);
  const hasTriggered2HourAlertRef = useRef<boolean>(false);

  // Keep selectedProjectId synchronized if project list changes
  useEffect(() => {
    if (projects.length > 0) {
      if (!selectedProjectId || !projects.some((p) => p.id === selectedProjectId)) {
        setSelectedProjectId(projects[0].id);
      }
    } else {
      setSelectedProjectId('');
    }
  }, [projects, selectedProjectId]);

  // Current selected project for viewing in top selector
  const currentProject = useMemo(() => {
    if (projects.length === 0) return null;
    return projects.find((p) => p.id === selectedProjectId) || projects[0];
  }, [projects, selectedProjectId]);

  // Locked Project being timed (strictly preserves project when timer was started)
  const timerProject = useMemo(() => {
    if (isTimerRunning && timerProjectId) {
      const found = projects.find((p) => p.id === timerProjectId);
      if (found) return found;
    }
    return currentProject;
  }, [isTimerRunning, timerProjectId, projects, currentProject]);

  const activeTimerProject = timerProject || currentProject;
  const isFixed = activeTimerProject?.feeType === 'fixed';

  // 2. Timestamp Delta Live Calculator: returns precise elapsed seconds at this instant
  const getLiveWorkSeconds = useCallback((): number => {
    if (timerState === 'working' && workStartedAt) {
      const liveElapsed = Math.max(0, Math.floor((Date.now() - workStartedAt) / 1000));
      return accumulatedWorkSeconds + liveElapsed;
    }
    return accumulatedWorkSeconds;
  }, [timerState, workStartedAt, accumulatedWorkSeconds]);

  const getLiveBreakSeconds = useCallback((): number => {
    if (timerState === 'resting' && breakStartedAt) {
      const liveElapsed = Math.max(0, Math.floor((Date.now() - breakStartedAt) / 1000));
      return accumulatedBreakSeconds + liveElapsed;
    }
    return accumulatedBreakSeconds;
  }, [timerState, breakStartedAt, accumulatedBreakSeconds]);

  const currentWorkSeconds = getLiveWorkSeconds();
  const currentBreakSeconds = getLiveBreakSeconds();

  // 3. Interval Ticker with cleanup handling
  useEffect(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (timerState === 'working' || timerState === 'resting') {
      timerIntervalRef.current = setInterval(() => {
        setTick((t) => (t + 1) % 1000000);
      }, 1000);
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [timerState]);

  // 4. Listen for visibility & wake up events
  useEffect(() => {
    const handleWakeUp = () => {
      setTick((t) => (t + 1) % 1000000);
    };

    document.addEventListener('visibilitychange', handleWakeUp);
    window.addEventListener('focus', handleWakeUp);
    window.addEventListener('pageshow', handleWakeUp);

    return () => {
      document.removeEventListener('visibilitychange', handleWakeUp);
      window.removeEventListener('focus', handleWakeUp);
      window.removeEventListener('pageshow', handleWakeUp);
    };
  }, []);

  // 4b. 2-Hour Continuous Focus Work Alert Trigger (Sound & Notification)
  useEffect(() => {
    if (timerState !== 'working' || !continuousWorkStartTime) {
      hasTriggered2HourAlertRef.current = false;
      return;
    }

    const focusSeconds = Math.max(0, Math.floor((Date.now() - continuousWorkStartTime) / 1000));
    console.log("Current Focus Seconds:", focusSeconds);

    // 2-Hour Continuous Alert: triggered at 120 minutes (7200s or more)
    if (focusSeconds >= 7200 && !hasTriggered2HourAlertRef.current) {
      hasTriggered2HourAlertRef.current = true;
      console.log("2-Hour Alert Triggered!");
      soundEffects.playTwoHourWaterChime();
      sendSystemNotification({
        title: '☕ FreeLife Log 專注提醒',
        body: '您已連續工作滿 2 小時！是時候放下工作喝杯水、拉拉筋，讓身體和大腦好好休息一下。',
        tag: '2hour-focus-break',
      });
    }
  }, [timerState, continuousWorkStartTime, tick]);

  // 5. Persist timer state to localStorage
  useEffect(() => {
    if (
      timerState !== 'idle' ||
      accumulatedWorkSeconds > 0 ||
      accumulatedBreakSeconds > 0 ||
      workStartedAt !== null ||
      breakStartedAt !== null
    ) {
      saveToLocalStorage(LOCAL_STORAGE_KEYS.TIMER_STATE, {
        selectedProjectId,
        timerProjectId,
        taskNote,
        taskTag: 'UI/UX',
        timerState,
        workStartedAt,
        breakStartedAt,
        accumulatedWorkSeconds,
        accumulatedBreakSeconds,
        sessionStartTime,
        continuousWorkStartTime,
      });
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);
    }
  }, [
    timerState,
    workStartedAt,
    breakStartedAt,
    accumulatedWorkSeconds,
    accumulatedBreakSeconds,
    selectedProjectId,
    timerProjectId,
    taskNote,
    sessionStartTime,
    continuousWorkStartTime,
  ]);

  // Synchronize TimerBridge with parent
  const executeStopAndSave = useCallback(
    (onComplete?: () => void) => {
      const targetProj = activeTimerProject;
      if (!targetProj) {
        if (onComplete) onComplete();
        return;
      }

      const finalWorkSec = getLiveWorkSeconds();
      const finalBreakSec = getLiveBreakSeconds();

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      const now = new Date();
      const endTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const workMinutes = Math.max(1, Math.round(finalWorkSec / 60));
      const breakMinutes = Math.round(finalBreakSec / 60);

      const projectRate = targetProj.targetHourlyRate || 600;
      const sessionEarnedAmount = Math.round((workMinutes / 60) * projectRate);
      const finalNote = taskNote.trim() || '專注工作';

      const newSession: TimeSession = {
        id: `sess-${Date.now()}`,
        projectId: targetProj.id,
        projectName: targetProj.name,
        clientName: targetProj.clientName,
        taskDescription: finalNote,
        date: now.toISOString().split('T')[0],
        startTime: sessionStartTime === '--:--' ? '09:00' : sessionStartTime,
        endTime: endTimeStr,
        workDurationMinutes: workMinutes,
        breakDurationMinutes: breakMinutes,
        effectiveHourlyRate: projectRate,
        earnedAmount: sessionEarnedAmount,
        status: 'completed',
        tags: [targetProj.feeType === 'fixed' ? '合約總額' : 'Hourly'].filter(Boolean),
      };

      onSaveSession(newSession);

      // Reset timer states
      setTimerState('idle');
      setTimerProjectId(null);
      setWorkStartedAt(null);
      setBreakStartedAt(null);
      setAccumulatedWorkSeconds(0);
      setAccumulatedBreakSeconds(0);
      setTaskNote('');
      setSessionStartTime('--:--');
      setContinuousWorkStartTime(null);
      setSnoozedAlert(false);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);

      showToast(`✅ 已結算並儲存「${targetProj.name}」工時（${workMinutes} 分鐘）！`);

      if (onComplete) {
        onComplete();
      }
    },
    [
      currentProject,
      getLiveWorkSeconds,
      getLiveBreakSeconds,
      taskNote,
      sessionStartTime,
      isFixed,
      onSaveSession,
    ]
  );

  const executeDiscard = useCallback((onComplete?: () => void) => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setTimerState('idle');
    setTimerProjectId(null);
    setWorkStartedAt(null);
    setBreakStartedAt(null);
    setAccumulatedWorkSeconds(0);
    setAccumulatedBreakSeconds(0);
    setSessionStartTime('--:--');
    setContinuousWorkStartTime(null);
    setSnoozedAlert(false);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);

    showToast('🗑️ 已放棄當時計時。');

    if (onComplete) {
      onComplete();
    }
  }, []);

  // Format seconds to HH:MM:SS
  const formatTime = useCallback((totalSec: number) => {
    const hrs = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  const executeStopAndSaveRef = useRef(executeStopAndSave);
  executeStopAndSaveRef.current = executeStopAndSave;

  const executeDiscardRef = useRef(executeDiscard);
  executeDiscardRef.current = executeDiscard;

  const onRegisterTimerBridgeRef = useRef(onRegisterTimerBridge);
  onRegisterTimerBridgeRef.current = onRegisterTimerBridge;

  const getLiveWorkSecondsRef = useRef(getLiveWorkSeconds);
  getLiveWorkSecondsRef.current = getLiveWorkSeconds;

  const formatTimeRef = useRef(formatTime);
  formatTimeRef.current = formatTime;

  useEffect(() => {
    if (onRegisterTimerBridgeRef.current) {
      const isActivelyTiming = timerState === 'working' || timerState === 'resting';
      const lockedProjId = (isActivelyTiming && timerProjectId) ? timerProjectId : (activeTimerProject?.id || selectedProjectId);
      const lockedProj = projects.find((p) => p.id === lockedProjId) || activeTimerProject || currentProject;

      onRegisterTimerBridgeRef.current({
        isRunning: isActivelyTiming,
        timerState: timerState,
        projectId: lockedProjId,
        projectName: lockedProj?.name || '',
        elapsedFormatted: formatTimeRef.current(getLiveWorkSecondsRef.current()),
        stopAndSave: (cb) => executeStopAndSaveRef.current(cb),
        discard: (cb) => executeDiscardRef.current(cb),
      });
    }
  }, [
    timerState,
    timerProjectId,
    activeTimerProject?.id,
    activeTimerProject?.name,
    selectedProjectId,
    currentProject?.name,
    projects,
  ]);

  const showToast = (msg: string, forcedType?: 'focus' | 'break') => {
    const isRest = forcedType === 'break' || (!forcedType && (msg.includes('休息') || msg.includes('☕') || timerState === 'resting'));
    setToastType(isRest ? 'break' : 'focus');
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const workHoursDecimal = currentWorkSeconds / 3600;
  const breakMinutesTotal = Math.round(currentBreakSeconds / 60);

  // Budget calculations & safeguards
  const hasEstimatedHoursLimit = typeof currentProject?.estimatedHours === 'number' && currentProject.estimatedHours > 0;
  const budgetedTotalHours = hasEstimatedHoursLimit ? currentProject!.estimatedHours! : 0;

  const projectSessions = useMemo(() => {
    if (!currentProject) return [];
    return sessions.filter((s) => s.projectId === currentProject.id);
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

  const projectSessionMinutes = projectSessions.reduce((sum, s) => sum + s.workDurationMinutes, 0);
  const accurateCumulativeMinutes = Math.max(
    projectSessionMinutes,
    Math.round((currentProject?.totalWorkedHours || 0) * 60)
  );
  const accurateCumulativeHours = accurateCumulativeMinutes / 60;

  const totalProjectHours = accurateCumulativeHours + workHoursDecimal;
  const totalProjectMinutes = accurateCumulativeMinutes + Math.round(currentWorkSeconds / 60);

  const budgetUsagePercent = (hasEstimatedHoursLimit && budgetedTotalHours > 0)
    ? Math.round((totalProjectHours / budgetedTotalHours) * 100)
    : null;

  const isBudgetWarning80 = budgetUsagePercent !== null && budgetUsagePercent >= 80 && budgetUsagePercent < 100;
  const isBudgetOver100 = budgetUsagePercent !== null && budgetUsagePercent >= 100;
  const remainingSafeHours = (hasEstimatedHoursLimit && budgetedTotalHours > 0)
    ? Math.max(0, Math.round((budgetedTotalHours - totalProjectHours) * 10) / 10)
    : null;

  // Real-time hourly rate calculation safeguard (1-Hour Threshold Rule: < 60 minutes)
  const isUnderOneHour = totalProjectMinutes < 60;
  const targetEstimatedRate = (currentProject && hasEstimatedHoursLimit)
    ? currentProject.totalContractAmount / currentProject.estimatedHours!
    : null;

  const liveRate = !isUnderOneHour
    ? (totalProjectHours > 0 ? (currentProject?.totalContractAmount || 0) / totalProjectHours : null)
    : targetEstimatedRate;

  const liveRateText = isUnderOneHour
    ? (targetEstimatedRate !== null ? `HK$ ${targetEstimatedRate.toFixed(1)} / h (目標預估)` : 'HK$ -- / h')
    : (liveRate !== null ? `HK$ ${liveRate.toFixed(1)} / h` : 'HK$ -- / h');

  // Continuous Work Calculation for 2-hour water alert
  const continuousSeconds = useMemo(() => {
    if (timerState === 'working' && continuousWorkStartTime) {
      return Math.max(0, Math.floor((Date.now() - continuousWorkStartTime) / 1000));
    }
    return 0;
  }, [timerState, continuousWorkStartTime, tick]);

  const isTwoHourAlertActive =
    timerState === 'working' && continuousSeconds >= 7200 && !snoozedAlert;

  // CONTROLLER ACTIONS
  // 1. 開工 (Start / Resume)
  const handleStart = () => {
    if (!currentProject || projects.length === 0) {
      showToast('⚠️ 請先建立或選擇 Project 才能開始計時');
      if (onOpenNewProjectModal) onOpenNewProjectModal();
      return;
    }

    const now = Date.now();

    let newAccBreak = accumulatedBreakSeconds;
    if (timerState === 'resting' && breakStartedAt) {
      newAccBreak += Math.max(0, Math.floor((now - breakStartedAt) / 1000));
    }
    setAccumulatedBreakSeconds(newAccBreak);
    setBreakStartedAt(null);

    setWorkStartedAt(now);
    setTimerState('working');
    setSnoozedAlert(false);

    if (!timerProjectId && currentProject) {
      setTimerProjectId(currentProject.id);
    }

    if (!continuousWorkStartTime) {
      setContinuousWorkStartTime(now);
    }

    if (sessionStartTime === '--:--') {
      const d = new Date();
      setSessionStartTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      );
    }

    showToast('🚀 已開始專注開工計時！', 'focus');
  };

  // 2. 暫停休息 (Pause / Break)
  const handlePause = () => {
    const now = Date.now();

    let newAccWork = accumulatedWorkSeconds;
    if (timerState === 'working' && workStartedAt) {
      newAccWork += Math.max(0, Math.floor((now - workStartedAt) / 1000));
    }
    setAccumulatedWorkSeconds(newAccWork);
    setWorkStartedAt(null);

    setBreakStartedAt(now);
    setTimerState('resting');
    setContinuousWorkStartTime(null);

    showToast('☕ 已切換至舒緩休息模式', 'break');
  };

  // 3. 完成記錄 (Stop & Save)
  const handleRecord = () => {
    const targetProj = activeTimerProject || currentProject;
    if (!targetProj) {
      showToast('⚠️ 找不到關聯 Project，無法記錄。');
      return;
    }

    const finalWorkSec = getLiveWorkSeconds();
    const finalBreakSec = getLiveBreakSeconds();

    if (finalWorkSec < 5) {
      showToast('⚠️ 實質工時少於 5 秒，請繼續計時。');
      return;
    }

    // Stop active interval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const now = new Date();
    const endTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const workMinutes = Math.max(1, Math.round(finalWorkSec / 60));
    const breakMinutes = Math.round(finalBreakSec / 60);

    const projectRate = targetProj.targetHourlyRate || 600;
    const sessionEarnedAmount = Math.round((workMinutes / 60) * projectRate);

    // Explicitly write taskNote / Project Memo to the Timesheet session (Default to '專注工作' if empty)
    const finalNote = taskNote.trim() || '專注工作';

    const newSession: TimeSession = {
      id: `sess-${Date.now()}`,
      projectId: targetProj.id,
      projectName: targetProj.name,
      clientName: targetProj.clientName,
      taskDescription: finalNote,
      date: now.toISOString().split('T')[0],
      startTime: sessionStartTime === '--:--' ? '09:00' : sessionStartTime,
      endTime: endTimeStr,
      workDurationMinutes: workMinutes,
      breakDurationMinutes: breakMinutes,
      effectiveHourlyRate: projectRate,
      earnedAmount: sessionEarnedAmount,
      status: 'completed',
      tags: [targetProj.feeType === 'fixed' ? '一口價' : 'Hourly'].filter(Boolean),
    };

    onSaveSession(newSession);

    // Reset timer states while keeping selectedProjectId intact!
    setTimerState('idle');
    setTimerProjectId(null);
    setWorkStartedAt(null);
    setBreakStartedAt(null);
    setAccumulatedWorkSeconds(0);
    setAccumulatedBreakSeconds(0);
    setTaskNote('');
    setSessionStartTime('--:--');
    setContinuousWorkStartTime(null);
    setSnoozedAlert(false);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);

    showToast(`✅ 已精確結算 ${workMinutes} 分鐘工時（☕️ 休息時間：${breakMinutes} 分鐘）！`);
  };

  // 4. 徹底重置計時器 (Timer Reset Logic - Strict preservation of selectedProjectId)
  const handleResetTimer = () => {
    // 1. Force clearInterval
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 2. Reset time states to 0
    setTimerState('idle');
    setTimerProjectId(null);
    setWorkStartedAt(null);
    setBreakStartedAt(null);
    setAccumulatedWorkSeconds(0);
    setAccumulatedBreakSeconds(0);
    setSessionStartTime('--:--');
    setContinuousWorkStartTime(null);
    setSnoozedAlert(false);

    // 3. Clear active timer from storage without clearing selectedProjectId
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);

    showToast('🔄 已重置當前計時器（已保留當前 Project）');
  };

  // Handlers for project change (only allowed when idle, guarded by disabled dropdown)
  const handleProjectChangeAttempt = (targetId: string) => {
    if (isTimerRunning) return;
    if (targetId === selectedProjectId) return;
    setSelectedProjectId(targetId);
    setTimerProjectId(targetId);
    if (setActiveProjectId) setActiveProjectId(targetId);
  };

  const handleNewProjectAttempt = () => {
    if (isTimerRunning && onRequestInterception) {
      onRequestInterception({ type: 'new_project' });
      return;
    }
    if (isTimerRunning) {
      setPendingAction({ type: 'new_project' });
      setIsInterceptionModalOpen(true);
      return;
    }
    if (onOpenNewProjectModal) onOpenNewProjectModal();
  };

  // Option 1: 停止並儲存 (Save session, stop timer, and proceed)
  const handleInterceptionStopAndSave = () => {
    if (!currentProject) {
      setIsInterceptionModalOpen(false);
      setPendingAction(null);
      return;
    }

    const finalWorkSec = getLiveWorkSeconds();
    const finalBreakSec = getLiveBreakSeconds();

    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    const now = new Date();
    const endTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const workMinutes = Math.max(1, Math.round(finalWorkSec / 60));
    const breakMinutes = Math.round(finalBreakSec / 60);

    const projectRate = currentProject.targetHourlyRate || 600;
    const sessionEarnedAmount = Math.round((workMinutes / 60) * projectRate);
    const finalNote = taskNote.trim() || '專注工作';

    const newSession: TimeSession = {
      id: `sess-${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      clientName: currentProject.clientName,
      taskDescription: finalNote,
      date: now.toISOString().split('T')[0],
      startTime: sessionStartTime === '--:--' ? '09:00' : sessionStartTime,
      endTime: endTimeStr,
      workDurationMinutes: workMinutes,
      breakDurationMinutes: breakMinutes,
      effectiveHourlyRate: projectRate,
      earnedAmount: sessionEarnedAmount,
      status: 'completed',
      tags: [isFixed ? '合約總額' : 'Hourly'].filter(Boolean),
    };

    onSaveSession(newSession);

    // Reset timer states
    setTimerState('idle');
    setWorkStartedAt(null);
    setBreakStartedAt(null);
    setAccumulatedWorkSeconds(0);
    setAccumulatedBreakSeconds(0);
    setTaskNote('');
    setSessionStartTime('--:--');
    setContinuousWorkStartTime(null);
    setSnoozedAlert(false);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);

    const action = pendingAction;
    setIsInterceptionModalOpen(false);
    setPendingAction(null);

    if (action?.type === 'switch_project' && action.targetProjectId) {
      setSelectedProjectId(action.targetProjectId);
      if (setActiveProjectId) setActiveProjectId(action.targetProjectId);
      showToast(`✅ 已結算並儲存「${currentProject.name}」工時，已切換專案！`);
    } else if (action?.type === 'new_project') {
      if (onOpenNewProjectModal) onOpenNewProjectModal();
      showToast(`✅ 已結算並儲存「${currentProject.name}」工時！`);
    }
  };

  // Option 2: 直接放棄計時 (Discard uncommitted timer and proceed)
  const handleInterceptionDiscard = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    setTimerState('idle');
    setWorkStartedAt(null);
    setBreakStartedAt(null);
    setAccumulatedWorkSeconds(0);
    setAccumulatedBreakSeconds(0);
    setSessionStartTime('--:--');
    setContinuousWorkStartTime(null);
    setSnoozedAlert(false);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);

    const action = pendingAction;
    setIsInterceptionModalOpen(false);
    setPendingAction(null);

    if (action?.type === 'switch_project' && action.targetProjectId) {
      setSelectedProjectId(action.targetProjectId);
      if (setActiveProjectId) setActiveProjectId(action.targetProjectId);
      showToast('🗑️ 已放棄當時計時，並切換至新專案。');
    } else if (action?.type === 'new_project') {
      if (onOpenNewProjectModal) onOpenNewProjectModal();
      showToast('🗑️ 已放棄當時計時。');
    }
  };

  // Option 3: 繼續當前計時（取消操作）
  const handleInterceptionCancel = () => {
    setIsInterceptionModalOpen(false);
    setPendingAction(null);
  };

  const targetProject = pendingAction?.type === 'switch_project'
    ? projects.find((p) => p.id === pendingAction.targetProjectId)
    : undefined;

  const handleTest2HourAlert = () => {
    const simulatedStartTime = Date.now() - 7205 * 1000;
    setContinuousWorkStartTime(simulatedStartTime);
    setTimerState('working');
    if (workStartedAt === null) {
      setWorkStartedAt(simulatedStartTime);
    }
    setSnoozedAlert(false);
    hasTriggered2HourAlertRef.current = true;
    console.log("2-Hour Alert Triggered!");
    soundEffects.playTwoHourWaterChime();
    sendSystemNotification({
      title: '☕ FreeLife Log 專注提醒 (測試)',
      body: '您已連續工作滿 2 小時！是時候放下工作喝杯水、拉拉筋，讓身體和大腦好好休息一下。',
      tag: '2hour-focus-break-test',
    });
    showToast('💧 已模擬觸發 2 小時見字飲水提醒與音效！');
    setTick((t) => (t + 1) % 1000000);
  };

  const hasProject = projects.length > 0 && !!currentProject;
  const hasActiveSeconds = currentWorkSeconds > 0 || currentBreakSeconds > 0 || timerState !== 'idle';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="timer-tab-toast"
          className={`fixed top-24 right-6 z-50 text-white px-4 py-2.5 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 border transition-all duration-200 animate-in fade-in slide-in-from-top-2 ${
            toastType === 'break'
              ? 'bg-[#ea580c] border-orange-400 shadow-orange-950/20'
              : 'bg-emerald-600 border-emerald-400 shadow-emerald-950/20'
          }`}
        >
          {toastType === 'break' ? (
            <Coffee size={16} className="text-white shrink-0" />
          ) : (
            <CheckCircle2 size={16} className="text-white shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* 2-Hour Continuous Focus Overlay Pop-up Modal (Fixed Overlay - Does NOT push/shift layout, Timer continues running) */}
      {isTwoHourAlertActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 ${
              isWarm
                ? 'bg-white border-amber-300 text-stone-900 shadow-amber-950/20'
                : 'bg-slate-900 border-amber-600/50 text-slate-100 shadow-black/60'
            }`}
          >
            <div className="flex items-start gap-4">
              <div className="p-3.5 rounded-2xl bg-amber-500 text-white shadow-lg shadow-amber-500/30 shrink-0">
                <Droplets size={28} />
              </div>
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300">
                  <span>☕ 專注健康提醒</span>
                </div>
                <h3 className="font-black text-lg sm:text-xl tracking-tight text-stone-900 dark:text-slate-100">
                  💧 已經工作 2 小時，見字飲水，要休息啦！
                </h3>
                <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed pt-1">
                  長時間連續專注容易導致視覺與精神疲勞。適度暫停休息完全不計入工時，能幫助維持高質量產出。
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-2.5 w-full">
              <button
                type="button"
                onClick={() => setSnoozedAlert(true)}
                className={`w-full sm:w-1/2 py-3 px-4 rounded-2xl text-xs font-bold border transition-colors cursor-pointer text-center ${
                  isWarm
                    ? 'border-stone-200 hover:bg-stone-100 text-stone-600'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                稍後提醒
              </button>
              <button
                type="button"
                onClick={() => {
                  setSnoozedAlert(true);
                  handlePause();
                }}
                className="w-full sm:w-1/2 py-3 px-4 rounded-2xl text-xs font-extrabold bg-amber-600 hover:bg-amber-700 text-white shadow-md shadow-amber-600/25 flex items-center justify-center gap-1.5 transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                <Coffee size={15} />
                <span>立即暫停休息</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Project Selector & Info (Frameless / No Card Box) */}
      {(() => {
        const displayProj = currentProject;
        const clientColor = displayProj
          ? getClientColor(displayProj.clientName, displayProj.clientColor || displayProj.color)
          : '#E2E8F0';
        const formattedDate = displayProj?.createdAt
          ? displayProj.createdAt.replace(/-/g, '/')
          : '2026/09/19';

        return (
          <div className="px-1 py-1">
            {projects.length > 0 ? (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 w-full text-xs">
                {/* 1. 左側群組: 選擇 PROJECT + 下拉選單 + Client 標籤 + 種類型 Tab 靠在 project 右邊 */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <span className="font-bold text-stone-500 dark:text-slate-400 whitespace-nowrap shrink-0 text-xs">
                    選擇 PROJECT:
                  </span>
                  <div className="w-[180px] sm:w-[220px] shrink-0">
                    <ProjectSelectDropdown
                      projects={projects}
                      selectedProjectId={selectedProjectId}
                      onSelectProject={(id) => handleProjectChangeAttempt(id)}
                      disabled={isTimerRunning}
                      className="w-full"
                    />
                  </div>

                  {displayProj && (
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span
                        className="font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border shadow-2xs shrink-0 max-w-full text-xs"
                        style={{
                          backgroundColor: `${clientColor}18`,
                          color: clientColor,
                          borderColor: `${clientColor}40`,
                        }}
                      >
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: clientColor }} />
                        <span className="truncate max-w-[130px] sm:max-w-none">Client: {displayProj.clientName}</span>
                      </span>

                      {displayProj.category && (
                        <span className="font-bold px-2.5 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-stone-600 dark:text-slate-300 border border-stone-200 dark:border-slate-700 shrink-0 whitespace-nowrap text-xs">
                          {displayProj.category}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. 右側: 建立日期 (位置不變，靠最右側) */}
                {displayProj && (
                  <div className="shrink-0 font-semibold text-stone-500 dark:text-slate-400 whitespace-nowrap text-[11px] sm:text-xs sm:ml-auto">
                    建立於 <span className="font-mono">{formattedDate}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 w-full py-1">
                <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                  尚無 Project，請先建立 Project 即可開始專注計時
                </span>
                {onOpenNewProjectModal && (
                  <button
                    type="button"
                    onClick={onOpenNewProjectModal}
                    className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1 transition-all shadow-xs cursor-pointer shrink-0"
                  >
                    <Plus size={14} />
                    <span>新增 Project</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* ============================================================ */}
      {/* 2. CONSOLIDATED TIMER CONTROL PANEL & WORK CONTENT (POSITIONED ABOVE TIMERS) */}
      {/* ============================================================ */}
      <div
        className={`rounded-3xl p-4 sm:p-5 border transition-all ${
          isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* UNIFIED CONTROLS ACCORDING TO TIMER STATE */}
        {timerState === 'idle' ? (
          <div className="flex flex-col items-center justify-center space-y-2.5">
            <div className="flex items-center justify-center gap-3 w-full max-w-md">
              {/* PRIMARY BIG GREEN BUTTON: 【▶ 開始工作】 */}
              <button
                onClick={handleStart}
                disabled={!hasProject}
                className={`flex-1 py-3.5 px-6 rounded-2xl font-black text-base sm:text-lg flex items-center justify-center gap-2.5 transition-all shadow-lg ${
                  hasProject
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/35 cursor-pointer hover:scale-102 active:scale-98'
                    : 'bg-stone-300 dark:bg-slate-800 text-stone-500 dark:text-slate-500 shadow-none cursor-not-allowed opacity-60'
                }`}
                title={hasProject ? '點擊立即開始工作' : '請先建立或選擇 Project 才能開始計時'}
              >
                {!hasProject ? <Lock size={20} /> : <Play size={20} fill="currentColor" />}
                <span>開始工作</span>
              </button>

              {/* RESET BUTTON WHEN IDLE WITH ACCUMULATED SECONDS */}
              {hasActiveSeconds && (
                <button
                  onClick={handleResetTimer}
                  className={`py-3.5 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    isWarm
                      ? 'border-stone-300 hover:bg-stone-100 text-stone-600'
                      : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                  title="重置當前計時器"
                >
                  <RotateCcw size={16} />
                  <span>重置</span>
                </button>
              )}
            </div>

            {!hasProject && (
              <p className="text-xs font-bold text-rose-600 dark:text-rose-400 text-center">
                ⚠️ 請先建立或選擇 Project 才能開始計時
              </p>
            )}
          </div>
        ) : (
          /* ACTIVE / RUNNING / RESTING STATE: SMOOTH SLIDE-DOWN ACCORDION FLOW */
          <div className="space-y-4 animate-in fade-in-50 slide-in-from-top-2 duration-300">
            {/* 1. Task Content Input Box */}
            <div className="text-left">
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <span>💼 工作內容</span>
                </span>
                <span className="text-[10px] text-stone-400 font-normal">
                  按下【完成並結算】時將自動寫入 Timesheet 工時紀錄
                </span>
              </label>
              <input
                type="text"
                placeholder="例：封面插畫草稿、Client 追稿、開 meeting、排版校對..."
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
                className={`w-full text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border outline-none transition-all ${
                  isWarm
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                    : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                }`}
              />
            </div>

            {/* 2. Action Buttons Row */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 text-center">
              {timerState === 'working' ? (
                <>
                  {/* BREAK BUTTON */}
                  <button
                    onClick={handlePause}
                    className="flex-1 min-w-[140px] max-w-xs py-3 px-5 rounded-2xl font-black text-sm sm:text-base bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102 active:scale-98"
                  >
                    <Coffee size={18} />
                    <span>休息</span>
                  </button>

                  {/* STOP / COMPLETE BUTTON */}
                  <button
                    onClick={handleRecord}
                    className="flex-1 min-w-[140px] max-w-xs py-3 px-5 rounded-2xl font-black text-sm sm:text-base bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102 active:scale-98"
                  >
                    <CheckCircle2 size={18} />
                    <span>完成並結算</span>
                  </button>

                  {/* SAFE RESET BUTTON */}
                  <button
                    onClick={handleResetTimer}
                    className={`py-3 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isWarm
                        ? 'border-stone-300 hover:bg-stone-100 text-stone-600'
                        : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                    title="重置當前計時器"
                  >
                    <RotateCcw size={15} />
                    <span>重置</span>
                  </button>
                </>
              ) : (
                <>
                  {/* RESUME BUTTON */}
                  <button
                    onClick={handleStart}
                    className="flex-1 min-w-[140px] max-w-xs py-3 px-5 rounded-2xl font-black text-sm sm:text-base bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102 active:scale-98"
                  >
                    <Play size={18} fill="currentColor" />
                    <span>繼續工作</span>
                  </button>

                  {/* STOP / COMPLETE BUTTON */}
                  <button
                    onClick={handleRecord}
                    className="flex-1 min-w-[140px] max-w-xs py-3 px-5 rounded-2xl font-black text-sm sm:text-base bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-102 active:scale-98"
                  >
                    <CheckCircle2 size={18} />
                    <span>完成並結算</span>
                  </button>

                  {/* SAFE RESET BUTTON */}
                  <button
                    onClick={handleResetTimer}
                    className={`py-3 px-3 rounded-2xl border font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer ${
                      isWarm
                        ? 'border-stone-300 hover:bg-stone-100 text-stone-600'
                        : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                    }`}
                    title="重置當前計時器"
                  >
                    <RotateCcw size={15} />
                    <span>重置</span>
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* DUAL TIMERS DISPLAY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
        {/* CARD 1: 專注工作計時器 (Work Timer - Emerald) */}
        <div
          className={`rounded-3xl p-4 sm:p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
            timerState === 'working'
              ? 'border-emerald-500 ring-4 ring-emerald-500/30 shadow-xl shadow-emerald-500/10 bg-emerald-50/20 dark:bg-emerald-950/20'
              : isWarm
              ? 'bg-white border-stone-200'
              : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl text-white ${
                    timerState === 'working' ? 'bg-emerald-600 shadow-md shadow-emerald-600/30' : 'bg-stone-500 dark:bg-slate-700'
                  }`}
                >
                  <Clock size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-stone-900 dark:text-slate-100 flex items-center gap-2">
                    <span>專注工作計時器</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
                      淨工時
                    </span>
                  </h3>
                </div>
              </div>

              {/* Pulsing Status Dot */}
              <div className="flex items-center gap-1.5">
                {timerState === 'working' ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                    </span>
                    <span>專注開工中</span>
                  </span>
                ) : (
                  <span className="text-xs font-medium text-stone-400 dark:text-slate-500">
                    {timerState === 'resting' ? '暫停保留' : '待命'}
                  </span>
                )}
              </div>
            </div>

            {/* Big Work Digital Timer */}
            <div className="my-2.5 text-center sm:text-left">
              <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-stone-950 dark:text-white select-none">
                {formatTime(currentWorkSeconds)}
              </div>
              <div className="text-xs font-semibold text-stone-500 dark:text-slate-400 mt-1.5 flex flex-wrap items-center gap-2">
                <span>淨投入：{(currentWorkSeconds / 3600).toFixed(2)} 小時</span>
                <span>•</span>
                <span>開始於：{sessionStartTime}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: 舒緩休息計時器 (Break Timer - Warm Caramel) */}
        <div
          className={`rounded-3xl p-4 sm:p-5 border transition-all relative overflow-hidden flex flex-col justify-between ${
            timerState === 'resting'
              ? 'border-[#ea580c] ring-4 ring-[#ea580c]/30 shadow-xl shadow-[#ea580c]/10 bg-[#fff7ed] dark:bg-[#281810]'
              : 'bg-[#fffaf0]/80 dark:bg-[#1f1510]/80 border-[#fed7aa]/80 dark:border-[#7c2d12]/80'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div
                  className={`p-2 rounded-xl text-white ${
                    timerState === 'resting' ? 'bg-[#ea580c] shadow-md shadow-[#ea580c]/30' : 'bg-amber-600'
                  }`}
                >
                  <Coffee size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-[#9a3412] dark:text-[#fdba74] flex items-center gap-2">
                    <span>舒緩休息計時器</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950 text-[#c2410c] dark:text-orange-300 font-bold border border-orange-200 dark:border-orange-800">
                      不計工時
                    </span>
                  </h3>
                </div>
              </div>

              {/* Pulsing Status Dot */}
              <div className="flex items-center gap-1.5">
                {timerState === 'resting' ? (
                  <span className="flex items-center gap-1.5 text-xs font-bold text-[#ea580c] dark:text-[#fb923c]">
                    <span className="relative flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#ea580c]"></span>
                    </span>
                    <span>放鬆休息中</span>
                  </span>
                ) : (
                  <span className="text-xs font-medium text-[#c2410c]/60 dark:text-[#fed7aa]/50">
                    {currentBreakSeconds > 0 ? '已保留' : '待命'}
                  </span>
                )}
              </div>
            </div>

            {/* Big Break Digital Timer */}
            <div className="my-2.5 text-center sm:text-left">
              <div className="font-mono text-4xl sm:text-5xl font-black tracking-tight text-[#ea580c] dark:text-[#fb923c] select-none">
                {formatTime(currentBreakSeconds)}
              </div>
              <div className="text-xs font-semibold text-[#9a3412] dark:text-[#fed7aa] mt-1.5 flex flex-wrap items-center gap-2">
                <span>☕️ 休息時間：約 {breakMinutesTotal} 分鐘</span>
                <span>•</span>
                <span>CHILL下先啦</span>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-stone-100 dark:border-slate-800/60 flex flex-col sm:flex-row items-center justify-between text-[11px] text-stone-400 dark:text-slate-500 gap-2.5 flex-wrap">
          <span>
            ⏱️ 採用時間戳差值 (Timestamp Delta) 技術，背景切頁、手機鎖屏待機精準零延遲。
          </span>
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={handleTest2HourAlert}
              className="text-stone-400 hover:text-amber-600 dark:hover:text-amber-400 underline cursor-pointer"
              title="點擊直接模擬連續開工滿 2 小時觸發智能飲水提醒"
            >
              ⚡ 測試 2 小時提醒
            </button>
          </div>
        </div>

      {/* Edit Project Modal */}
      {currentProject && (
        <EditProjectModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          project={currentProject}
          onUpdateProject={(updated) => {
            if (onUpdateProject) {
              onUpdateProject(updated);
            }
          }}
        />
      )}

      {/* Timer Running Interception Confirmation Modal */}
      <TimerRunningInterceptionModal
        isOpen={isInterceptionModalOpen}
        onClose={handleInterceptionCancel}
        currentProjectName={currentProject?.name || '當前專案'}
        elapsedFormatted={formatTime(getLiveWorkSeconds())}
        targetActionType={pendingAction?.type || 'switch_project'}
        targetProjectName={targetProject?.name}
        onStopAndSave={handleInterceptionStopAndSave}
        onDiscardAndProceed={handleInterceptionDiscard}
      />
    </div>
  );
};
