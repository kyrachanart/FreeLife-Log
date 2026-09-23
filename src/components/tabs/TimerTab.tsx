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
  Zap,
} from 'lucide-react';
import { Project, TimeSession, TimerBridge } from '../../types';
import { useTheme } from '../../ThemeContext';
import { Toast } from '../common/Toast';
import { EditProjectModal } from '../modals/EditProjectModal';
import { TimerRunningInterceptionModal } from '../modals/TimerRunningInterceptionModal';
import { ProjectSelectDropdown } from '../common/ProjectSelectDropdown';
import { ProjectHeader } from '../common/ProjectHeader';
import { getClientColor } from '../../utils/clientColors';
import { formatCurrency, formatHourlyRate, getCurrencySymbol } from '../../utils/currency';
import {
  LOCAL_STORAGE_KEYS,
  loadFromLocalStorage,
  saveToLocalStorage,
} from '../../utils/storage';
import { soundEffects } from '../../utils/audioAlerts';
import { sendSystemNotification } from '../../utils/notifications';
import { getLocalDateString, getLocalTimeString, toISOUTC } from '../../utils/dateUtils';

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
  firstSessionStartedAt?: number | null;
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

  const activeProjects = useMemo(() => projects.filter((p) => !p.isArchived), [projects]);

  // Selected project for timer (always preserved!)
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (activeProjectId && activeProjects.some((p) => p.id === activeProjectId)) {
      return activeProjectId;
    }
    if (savedTimer?.selectedProjectId && activeProjects.some((p) => p.id === savedTimer.selectedProjectId)) {
      return savedTimer.selectedProjectId;
    }
    return activeProjects[0]?.id || projects[0]?.id || '';
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
  const [firstSessionStartedAt, setFirstSessionStartedAt] = useState<number | null>(
    savedTimer?.firstSessionStartedAt || null
  );
  const [continuousWorkStartTime, setContinuousWorkStartTime] = useState<number | null>(
    savedTimer?.continuousWorkStartTime || null
  );

  // Check if timer is actively ticking (working or resting)
  const isActivelyRunning = timerState === 'working' || timerState === 'resting';

  // Check if timer is actively running or has uncommitted recorded time
  const isTimerRunning = isActivelyRunning;

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
  const [isResetConfirmModalOpen, setIsResetConfirmModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    | { type: 'switch_project'; targetProjectId: string }
    | { type: 'new_project' }
    | null
  >(null);

  // Keep selectedProjectId synchronized with active projects & external activeProjectId
  useEffect(() => {
    if (activeProjects.length > 0) {
      if (!isTimerRunning) {
        if (activeProjectId && activeProjects.some((p) => p.id === activeProjectId)) {
          if (selectedProjectId !== activeProjectId) {
            setSelectedProjectId(activeProjectId);
            setTimerProjectId(activeProjectId);
          }
        } else if (!selectedProjectId || !activeProjects.some((p) => p.id === selectedProjectId)) {
          setSelectedProjectId(activeProjects[0].id);
          setTimerProjectId(activeProjects[0].id);
        }
      }
    } else {
      if (selectedProjectId !== '') {
        setSelectedProjectId('');
      }
    }
  }, [activeProjects, activeProjectId, isTimerRunning, selectedProjectId]);

  // Interval Ref to ensure complete cleanup on reset or unmount
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Re-render tick trigger
  const [tick, setTick] = useState<number>(0);

  // Toast and alert snooze states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'focus' | 'break'>('focus');
  const [snoozedAlert, setSnoozedAlert] = useState(false);
  const [isTestAlertActive, setIsTestAlertActive] = useState(false);
  const hasTriggered2HourAlertRef = useRef<boolean>(false);

  // Card Glow Feedback on Mode Switch (Focus / Rest)
  const [cardGlow, setCardGlow] = useState<'working' | 'resting' | null>(null);
  const cardGlowTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerCardGlow = useCallback((type: 'working' | 'resting') => {
    if (cardGlowTimeoutRef.current) {
      clearTimeout(cardGlowTimeoutRef.current);
    }
    setCardGlow(type);
    cardGlowTimeoutRef.current = setTimeout(() => {
      setCardGlow(null);
    }, 1500);
  }, []);

  useEffect(() => {
    return () => {
      if (cardGlowTimeoutRef.current) {
        clearTimeout(cardGlowTimeoutRef.current);
      }
    };
  }, []);

  const showToast = useCallback((msg: string, forcedType?: 'focus' | 'break') => {
    const isRest = forcedType === 'break' || (!forcedType && (msg.includes('休息') || msg.includes('☕') || timerState === 'resting'));
    setToastType(isRest ? 'break' : 'focus');
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  }, [timerState]);

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

  const hasProject = projects.length > 0 && !!currentProject && !!selectedProjectId;
  const isWorkingFocusRunning = hasProject && timerState === 'working' && workStartedAt !== null;

  // 4b. 2-Hour Continuous Focus Work Alert Trigger (Sound & Notification)
  useEffect(() => {
    if (!isWorkingFocusRunning || !continuousWorkStartTime) {
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
        title: 'FreeLife Log',
        body: '已經工作 2 小時，要休息啦！',
        tag: '2hour-focus-break',
      });
      setSnoozedAlert(false);
    }
  }, [isWorkingFocusRunning, continuousWorkStartTime, tick]);

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
        firstSessionStartedAt,
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
    firstSessionStartedAt,
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
      const endTimeStr = getLocalTimeString(now);
      const workMinutes = Math.max(1, Math.round(finalWorkSec / 60));
      const breakMinutes = Math.round(finalBreakSec / 60);

      const projectRate = targetProj.targetHourlyRate || 600;
      const sessionEarnedAmount = Math.round((workMinutes / 60) * projectRate);
      const finalNote = taskNote.trim() || '專注工作';

      const initialStartTimestamp = firstSessionStartedAt || (workStartedAt || (Date.now() - (finalWorkSec + finalBreakSec) * 1000));
      const startDateObj = new Date(initialStartTimestamp);
      const startDateStr = getLocalDateString(startDateObj);
      const endDateStr = getLocalDateString(now);
      const isCross = startDateStr !== endDateStr;
      const startStr = sessionStartTime === '--:--' ? getLocalTimeString(startDateObj) : sessionStartTime;

      const newSession: TimeSession = {
        id: `sess-${Date.now()}`,
        projectId: targetProj.id,
        projectName: targetProj.name,
        clientName: targetProj.clientName,
        taskDescription: finalNote,
        date: startDateStr,
        startDate: startDateStr,
        endDate: endDateStr,
        startTime: startStr,
        endTime: endTimeStr,
        startISO: toISOUTC(startDateObj),
        endISO: toISOUTC(now),
        isCrossMidnight: isCross,
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
      setFirstSessionStartedAt(null);
      setContinuousWorkStartTime(null);
      setSnoozedAlert(false);
      localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);

      if (onComplete) {
        onComplete();
      }
    },
    [
      activeTimerProject,
      getLiveWorkSeconds,
      getLiveBreakSeconds,
      taskNote,
      sessionStartTime,
      firstSessionStartedAt,
      workStartedAt,
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
    setFirstSessionStartedAt(null);
    setContinuousWorkStartTime(null);
    setSnoozedAlert(false);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);

    showToast('🗑️ 已放棄當時計時。');

    if (onComplete) {
      onComplete();
    }
  }, [showToast]);

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
    activeProjects.forEach((p) => {
      const client = (p.clientName || '未指定 Client').trim();
      if (!map.has(client)) {
        map.set(client, []);
      }
      map.get(client)!.push(p);
    });
    return map;
  }, [activeProjects]);

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
  const projCurrency = currentProject?.currency || 'HKD';
  const isUnderOneHour = totalProjectMinutes < 60;
  const targetEstimatedRate = (currentProject && hasEstimatedHoursLimit)
    ? currentProject.totalContractAmount / currentProject.estimatedHours!
    : null;

  const liveRate = !isUnderOneHour
    ? (totalProjectHours > 0 ? (currentProject?.totalContractAmount || 0) / totalProjectHours : null)
    : targetEstimatedRate;

  const liveRateText = isUnderOneHour
    ? (targetEstimatedRate !== null ? `${formatHourlyRate(targetEstimatedRate, projCurrency)} (目標預估)` : `${getCurrencySymbol(projCurrency)} -- / h`)
    : (liveRate !== null ? formatHourlyRate(liveRate, projCurrency) : `${getCurrencySymbol(projCurrency)} -- / h`);

  // Continuous Work Calculation for 2-hour water alert
  const continuousSeconds = useMemo(() => {
    if (timerState === 'working' && continuousWorkStartTime) {
      return Math.max(0, Math.floor((Date.now() - continuousWorkStartTime) / 1000));
    }
    return 0;
  }, [timerState, continuousWorkStartTime, tick]);

  const isTwoHourAlertActive =
    isWorkingFocusRunning && (isTestAlertActive || (continuousSeconds >= 7200 && !snoozedAlert));

  // CONTROLLER ACTIONS
  // 1. 開工 (Start / Resume)
  const handleStart = () => {
    if (!currentProject || projects.length === 0 || !selectedProjectId) {
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

    if (!firstSessionStartedAt) {
      setFirstSessionStartedAt(now);
    }

    if (sessionStartTime === '--:--') {
      const d = new Date();
      setSessionStartTime(
        `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
      );
    }

    triggerCardGlow('working');
  };

  // 2. 暫停休息 (Pause / Break)
  const handlePause = () => {
    if (!currentProject || projects.length === 0 || !selectedProjectId) {
      showToast('⚠️ 請先建立或選擇 Project 才能開始計時/休息');
      if (onOpenNewProjectModal) onOpenNewProjectModal();
      return;
    }

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
    setIsTestAlertActive(false);

    triggerCardGlow('resting');
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
    const endTimeStr = getLocalTimeString(now);
    const workMinutes = Math.max(1, Math.round(finalWorkSec / 60));
    const breakMinutes = Math.round(finalBreakSec / 60);

    const projectRate = targetProj.targetHourlyRate || 600;
    const sessionEarnedAmount = Math.round((workMinutes / 60) * projectRate);

    // Explicitly write taskNote / Project Memo to the Timesheet session (Default to '專注工作' if empty)
    const finalNote = taskNote.trim() || '專注工作';

    const initialStartTimestamp = firstSessionStartedAt || (workStartedAt || (Date.now() - (finalWorkSec + finalBreakSec) * 1000));
    const startDateObj = new Date(initialStartTimestamp);
    const startDateStr = getLocalDateString(startDateObj);
    const endDateStr = getLocalDateString(now);
    const isCross = startDateStr !== endDateStr;
    const startStr = sessionStartTime === '--:--' ? getLocalTimeString(startDateObj) : sessionStartTime;

    const newSession: TimeSession = {
      id: `sess-${Date.now()}`,
      projectId: targetProj.id,
      projectName: targetProj.name,
      clientName: targetProj.clientName,
      taskDescription: finalNote,
      date: startDateStr,
      startDate: startDateStr,
      endDate: endDateStr,
      startTime: startStr,
      endTime: endTimeStr,
      startISO: toISOUTC(startDateObj),
      endISO: toISOUTC(now),
      isCrossMidnight: isCross,
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
    setFirstSessionStartedAt(null);
    setContinuousWorkStartTime(null);
    setSnoozedAlert(false);
    setIsTestAlertActive(false);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);
  };

  // 4. 重構 Reset 觸發與確認函數 (Confirmation Dialog Logic)
  const handleOpenResetConfirm = () => {
    setIsResetConfirmModalOpen(true);
  };

  const handleConfirmReset = () => {
    // 關閉彈窗
    setIsResetConfirmModalOpen(false);

    // 清除定時器
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    // 停止計時狀態
    setTimerState('idle');

    // 將累計秒數清零
    setAccumulatedWorkSeconds(0);
    setAccumulatedBreakSeconds(0);
    setWorkStartedAt(null);
    setBreakStartedAt(null);

    // 清除/重置開始時間
    setSessionStartTime('--:--');
    setFirstSessionStartedAt(null);
    setContinuousWorkStartTime(null);
    setSnoozedAlert(false);
    setIsTestAlertActive(false);

    // 清除持久化計時狀態
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);
    showToast('🔄 已重新計時，當前本節時間已清零。');
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
    const endTimeStr = getLocalTimeString(now);
    const workMinutes = Math.max(1, Math.round(finalWorkSec / 60));
    const breakMinutes = Math.round(finalBreakSec / 60);

    const projectRate = currentProject.targetHourlyRate || 600;
    const sessionEarnedAmount = Math.round((workMinutes / 60) * projectRate);
    const finalNote = taskNote.trim() || '專注工作';

    const initialStartTimestamp = firstSessionStartedAt || (workStartedAt || (Date.now() - (finalWorkSec + finalBreakSec) * 1000));
    const startDateObj = new Date(initialStartTimestamp);
    const startDateStr = getLocalDateString(startDateObj);
    const endDateStr = getLocalDateString(now);
    const isCross = startDateStr !== endDateStr;
    const startStr = sessionStartTime === '--:--' ? getLocalTimeString(startDateObj) : sessionStartTime;

    const newSession: TimeSession = {
      id: `sess-${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      clientName: currentProject.clientName,
      taskDescription: finalNote,
      date: startDateStr,
      startDate: startDateStr,
      endDate: endDateStr,
      startTime: startStr,
      endTime: endTimeStr,
      startISO: toISOUTC(startDateObj),
      endISO: toISOUTC(now),
      isCrossMidnight: isCross,
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
    setFirstSessionStartedAt(null);
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
    setFirstSessionStartedAt(null);
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
    if (!isWorkingFocusRunning) {
      showToast('⚠️ 僅在專注工作計時中才可測試 2 小時提醒');
      return;
    }
    setIsTestAlertActive(true);
    soundEffects.playTwoHourWaterChime();
    sendSystemNotification({
      title: 'FreeLife Log',
      body: '已經工作 2 小時，要休息啦！',
      tag: '2hour-focus-break-test',
    });
    showToast('已經工作 2 小時，要休息啦！');
  };

  const hasActiveSeconds = currentWorkSeconds > 0 || currentBreakSeconds > 0 || timerState !== 'idle';

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <Toast
          id="timer-tab-toast"
          message={toastMessage}
          variant={toastType === 'break' ? 'amber' : 'emerald'}
        />
      )}

      {/* 2-Hour Continuous Focus Overlay Pop-up Modal (Fixed Overlay - Does NOT push/shift layout, Timer continues running) */}
      {isTwoHourAlertActive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className={`w-full max-w-md max-w-[calc(100vw-32px)] overflow-hidden rounded-3xl p-6 sm:p-7 border-2 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 animate-gentle-pulse-glow ${
              isWarm
                ? 'bg-white border-amber-400 text-stone-900'
                : 'bg-slate-900 border-amber-500 text-slate-100'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-orange-500 text-white flex items-center justify-center shadow-md shadow-orange-500/30 shrink-0">
                  <Coffee size={22} className="text-white" />
                </div>
                <h3 className="font-black text-lg sm:text-xl tracking-tight text-stone-900 dark:text-slate-100 leading-tight">
                  已經工作 2 小時，要休息啦！
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-slate-300 leading-relaxed">
                長時間連續專注容易導致視覺與精神疲勞。適度暫停休息完全不計入工時，能幫助維持高質量產出。
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 w-full">
              <button
                type="button"
                onClick={() => {
                  setSnoozedAlert(true);
                  setIsTestAlertActive(false);
                }}
                className={`w-full sm:w-1/2 py-3 sm:py-3.5 px-4 rounded-2xl text-base sm:text-lg font-bold border transition-colors cursor-pointer text-center ${
                  isWarm
                    ? 'bg-white border-stone-200 hover:bg-stone-100 text-stone-600'
                    : 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300'
                }`}
              >
                稍後提醒
              </button>
              <button
                type="button"
                onClick={() => {
                  setSnoozedAlert(true);
                  setIsTestAlertActive(false);
                  if (!hasProject) {
                    showToast('⚠️ 請先建立或選擇 Project 才能開始計時/休息');
                    if (onOpenNewProjectModal) onOpenNewProjectModal();
                    return;
                  }
                  handlePause();
                }}
                className="w-full sm:w-1/2 py-3 sm:py-3.5 px-4 rounded-2xl text-base sm:text-lg font-bold bg-orange-500 hover:bg-orange-600 text-white border-2 border-white/90 shadow-md shadow-orange-500/25 flex items-center justify-center transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                <span>立即暫停休息</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Top Project Selector & Info (Toggl/Notion-inspired minimalist card) */}
      {(() => {
        const displayProj = currentProject;
        const clientColor = displayProj
          ? getClientColor(displayProj.clientName, displayProj.clientColor || displayProj.color)
          : '#E2E8F0';
        const formattedDate = displayProj?.createdAt
          ? displayProj.createdAt.replace(/-/g, '/')
          : '2026/09/19';

        return (
          <div className="w-full max-w-xl mx-auto">
            <div className="bg-white dark:bg-slate-900 border border-stone-200/90 dark:border-slate-800 rounded-2xl p-3 sm:p-3.5 shadow-2xs transition-all">
              {projects.length > 0 ? (
                <div className="space-y-2">
                  {/* Row 1: Left = Project Dropdown (occupies main width), Right = New Project button */}
                  <div className="flex items-center gap-2 sm:gap-3 w-full">
                    <div className="flex-1 min-w-0">
                      <ProjectSelectDropdown
                        projects={activeProjects}
                        selectedProjectId={selectedProjectId}
                        onSelectProject={(id) => handleProjectChangeAttempt(id)}
                        disabled={isTimerRunning}
                        className="w-full"
                      />
                    </div>

                    {onOpenNewProjectModal && (
                      <button
                        type="button"
                        onClick={onOpenNewProjectModal}
                        className="h-10 px-2.5 sm:px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                        title="快速新增 Project"
                      >
                        <Plus size={15} />
                        <span className="hidden sm:inline">新增 Project</span>
                      </button>
                    )}
                  </div>

                  {/* Row 2: Client & Category tags aligned directly below Project selector */}
                  {displayProj && (
                    <div className="flex items-center justify-between gap-2 flex-wrap min-w-0 pt-0.5">
                      <div className="flex items-center gap-1.5 flex-wrap min-w-0 text-xs">
                        {displayProj.clientName && (
                          <span
                            className="px-2.5 py-1 rounded-md text-white font-medium text-xs flex items-center shrink-0 shadow-2xs"
                            style={{ backgroundColor: clientColor }}
                          >
                            <span className="truncate max-w-[140px] sm:max-w-none">Client: {displayProj.clientName}</span>
                          </span>
                        )}

                        {displayProj.category && (
                          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium text-xs shrink-0 whitespace-nowrap">
                            {displayProj.category}
                          </span>
                        )}
                      </div>

                      {displayProj.createdAt && (
                        <div className="shrink-0 font-medium text-stone-400 dark:text-slate-500 whitespace-nowrap text-[11px] ml-auto">
                          建立於 <span className="font-mono">{formattedDate}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between gap-3 w-full">
                  <span className="text-xs font-semibold text-stone-500 dark:text-slate-400">
                    尚未建立任何 Project
                  </span>
                  {onOpenNewProjectModal && (
                    <button
                      type="button"
                      onClick={onOpenNewProjectModal}
                      className="h-10 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-95 shrink-0"
                      title="新增第一個 Project"
                    >
                      <Plus size={15} />
                      <span>新增 Project</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* SINGLE CORE TIMER CONTAINER */}
      <div className="w-full max-w-xl mx-auto">
        {/* Main Central Card with Subtle Background Glow & Status Badge */}
        <div
          id="timer-card"
          className={`transition-all duration-1000 ease-out relative overflow-hidden flex flex-col justify-between p-6 rounded-3xl ${
            timerState === 'resting'
              ? 'border-2 border-amber-400 dark:border-amber-600 bg-white dark:bg-slate-900 shadow-md'
              : 'border-2 border-emerald-500 bg-white dark:bg-slate-900 shadow-md'
          } ${
            cardGlow === 'working'
              ? 'ring-4 ring-emerald-400/80 dark:ring-emerald-500/80 shadow-[0_0_35px_rgba(16,185,129,0.5)]'
              : cardGlow === 'resting'
              ? 'ring-4 ring-amber-400/80 dark:ring-amber-500/80 shadow-[0_0_35px_rgba(245,158,11,0.5)]'
              : 'ring-0 ring-transparent'
          }`}
        >
          {/* 第 1 層 (頂部狀態列) */}
          <div className="flex items-center justify-between mb-4 border-b border-stone-100 dark:border-slate-800/80 pb-3">
            {/* Left: Mode Status Badge with Pulsing Dot only when isActivelyRunning */}
            <div className="flex items-center">
              {timerState === 'resting' ? (
                <span className="bg-amber-100 text-amber-900 px-3.5 py-1.5 rounded-full text-sm font-bold select-none flex items-center gap-2 dark:bg-amber-950/60 dark:text-amber-300">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    {isActivelyRunning ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500 animate-pulse" />
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                    )}
                  </span>
                  <span>舒緩休息模式</span>
                </span>
              ) : (
                <span className="bg-emerald-100 text-emerald-800 px-3.5 py-1.5 rounded-full text-sm font-bold select-none flex items-center gap-2 dark:bg-emerald-950/40 dark:text-emerald-300">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    {isActivelyRunning ? (
                      <>
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 animate-pulse" />
                      </>
                    ) : (
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
                    )}
                  </span>
                  <span>專注工作模式</span>
                </span>
              )}
            </div>

            {/* Right: Other mode cumulative time */}
            <div className="text-gray-500 dark:text-slate-400 text-xs sm:text-sm font-semibold font-mono">
              {timerState === 'resting' ? (
                <span>⏱️ 累積工作：{formatTime(currentWorkSeconds)}</span>
              ) : (
                <span>☕ 累積休息：{formatTime(currentBreakSeconds)}</span>
              )}
            </div>
          </div>

          {/* 第 2 層 (核心計時) */}
          <div className="w-full flex flex-col justify-center items-center my-3 text-center shrink-0">
            <div className="w-full flex justify-center items-center py-1 sm:py-2 shrink-0">
              <div
                className={`font-mono text-6xl sm:text-8xl font-black select-none tracking-tight leading-none shrink-0 transition-colors duration-200 ${
                  timerState === 'resting'
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {formatTime(timerState === 'resting' ? currentBreakSeconds : currentWorkSeconds)}
              </div>
            </div>

            {/* Cumulative info / helper info */}
            <div className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-slate-400 mt-2">
              <span>本節淨工時：{(currentWorkSeconds / 3600).toFixed(2)} 小時 • 開始於：{sessionStartTime || '--:--'}</span>
            </div>
          </div>

          {/* 第 3 層 (高頻切換按鈕或開始計時按鈕) */}
          <div className="mt-4 pt-4 border-t border-stone-100 dark:border-slate-800/80 w-full">
            {!isTimerRunning && currentWorkSeconds === 0 && currentBreakSeconds === 0 ? (
              /* 1. 未開始計時 (00:00:00)：顯示醒目的綠色主按鈕 [ 開始計時 ] 內部僅保留單一 Play icon */
              <button
                type="button"
                disabled={!hasProject}
                onClick={handleStart}
                className={`font-bold h-12 w-full max-w-xs rounded-full text-base mx-auto flex items-center justify-center gap-2 border-none transition-all select-none ${
                  !hasProject
                    ? "bg-gray-200 text-gray-400 dark:bg-slate-800 dark:text-slate-600 opacity-50 cursor-not-allowed shadow-none"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg cursor-pointer active:scale-98"
                }`}
              >
                <Play size={18} fill="currentColor" />
                <span>開始計時</span>
              </button>
            ) : (
              /* 2. 計時進行中 / 已有時間：顯示「專注工作 / 舒緩休息」切換槽與右側重置圖示按鈕 */
              <div className="flex items-center justify-center gap-3 w-full max-w-md mx-auto">
                {/* 切換槽 */}
                <div className="bg-gray-100 dark:bg-slate-800 p-1.5 rounded-full flex-1 flex gap-2 select-none">
                  {/* Left button: ⏱️ 專注工作 */}
                  <button
                    type="button"
                    disabled={!hasProject}
                    onClick={() => {
                      if (!hasProject) return;
                      if (timerState === 'resting' || timerState === 'idle') {
                        handleStart();
                      }
                    }}
                    className={`rounded-full py-2.5 flex-1 transition-all duration-200 border-none font-bold text-sm ${
                      !hasProject
                        ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-slate-600 select-none"
                        : timerState !== 'resting'
                        ? "bg-emerald-600 text-white shadow-md cursor-pointer"
                        : "text-gray-600 hover:bg-gray-200/50 dark:text-slate-300 dark:hover:bg-slate-700/50 font-semibold cursor-pointer"
                    }`}
                  >
                    <span>⏱️ 專注工作</span>
                  </button>

                  {/* Right button: ☕ 舒緩休息 */}
                  <button
                    type="button"
                    disabled={!hasProject}
                    onClick={() => {
                      if (!hasProject) return;
                      if (timerState === 'working' || timerState === 'idle') {
                        handlePause();
                      }
                    }}
                    className={`rounded-full py-2.5 flex-1 transition-all duration-200 border-none font-bold text-sm ${
                      !hasProject
                        ? "opacity-50 cursor-not-allowed text-gray-400 dark:text-slate-600 select-none"
                        : timerState === 'resting'
                        ? "bg-[#DB6A35] text-white shadow-sm cursor-pointer"
                        : "text-gray-600 hover:bg-gray-200/50 dark:text-slate-300 dark:hover:bg-slate-700/50 font-semibold cursor-pointer"
                    }`}
                  >
                    <span>☕ 舒緩休息</span>
                  </button>
                </div>

                {/* 右側：圓形重置按鈕 */}
                <button
                  type="button"
                  disabled={!hasProject || (!isTimerRunning && currentWorkSeconds === 0 && currentBreakSeconds === 0)}
                  onClick={handleOpenResetConfirm}
                  className={`p-2 rounded-full transition-colors flex items-center justify-center border-none shrink-0 ${
                    !hasProject || (!isTimerRunning && currentWorkSeconds === 0 && currentBreakSeconds === 0)
                      ? "bg-gray-100 text-gray-300 dark:bg-slate-800 dark:text-slate-600 opacity-50 cursor-not-allowed select-none"
                      : "bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 cursor-pointer"
                  }`}
                  title="重新計時（重置本節時間）"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            )}
          </div>

          {/* 第 4 層 (分割線與收尾結算區) */}
          <div className="border-t border-gray-100 dark:border-slate-800 my-4" />
          <div className="flex gap-3 items-center w-full">
            {/* Left: Input box (Wide) - Disabled when timer not started and no time accumulated */}
            {(() => {
              const isSettlementDisabled = !hasProject || (!isTimerRunning && currentWorkSeconds === 0);
              return (
                <>
                  <input
                    type="text"
                    placeholder={
                      !hasProject
                        ? "⚠️ 請先選擇或建立 Project"
                        : (!isTimerRunning && currentWorkSeconds === 0)
                        ? "請先開始計時後再輸入工作內容..."
                        : "💬 輸入當前工作內容..."
                    }
                    value={taskNote}
                    disabled={isSettlementDisabled}
                    onChange={(e) => setTaskNote(e.target.value)}
                    className={`flex-1 border rounded-xl p-2.5 text-sm focus:outline-none transition-all ${
                      isSettlementDisabled
                        ? "bg-gray-100/70 border-gray-200 text-gray-400 dark:bg-slate-900/40 dark:border-slate-800 dark:text-slate-600 opacity-50 cursor-not-allowed select-none"
                        : "bg-gray-100 border-gray-200 text-stone-900 focus:border-gray-400 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-100"
                    }`}
                  />

                  {/* Right: Settlement button - Disabled when timer not started and no time accumulated */}
                  <button
                    type="button"
                    disabled={isSettlementDisabled}
                    onClick={handleRecord}
                    className={`px-5 py-2.5 rounded-xl font-bold transition-all shrink-0 text-sm select-none border-none ${
                      isSettlementDisabled
                        ? "bg-gray-200 text-gray-400 dark:bg-slate-800 dark:text-slate-600 opacity-50 cursor-not-allowed shadow-none"
                        : "bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 cursor-pointer shadow-xs active:scale-98"
                    }`}
                  >
                    <span>✓ 完成結算</span>
                  </button>
                </>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Test 2-Hour Alert Button (Subtle Fine Gray Text with Underline at Bottom Right) */}
      <div className="w-full max-w-xl mx-auto pt-3 pb-1 flex justify-end pr-1">
        <button
          type="button"
          disabled={!isWorkingFocusRunning}
          onClick={handleTest2HourAlert}
          className={`text-xs select-none transition-colors border-none bg-transparent p-0 ${
            !isWorkingFocusRunning
              ? 'text-stone-300 dark:text-slate-700 opacity-50 cursor-not-allowed no-underline'
              : 'text-stone-400 dark:text-slate-500 underline underline-offset-2 hover:text-stone-600 dark:hover:text-slate-300 cursor-pointer'
          }`}
          title={
            !isWorkingFocusRunning
              ? '需在專案「專注工作計時中」才可測試 2 小時提醒'
              : '模擬連續工作滿 2 小時，觸發見字飲水提醒與休息彈窗'
          }
        >
          ⚡️ 測試 2 小時提醒
        </button>
      </div>

      {/* Reset Confirmation Modal */}
      {isResetConfirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div
            className={`w-full max-w-sm rounded-3xl p-6 border shadow-2xl space-y-4 animate-in zoom-in-95 duration-150 ${
              isWarm
                ? 'bg-white border-stone-200 text-stone-900 shadow-stone-950/20'
                : 'bg-slate-900 border-slate-700 text-slate-100 shadow-black/60'
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950/60 dark:text-rose-400 shrink-0">
                <RotateCcw size={22} />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-base sm:text-lg tracking-tight text-stone-900 dark:text-slate-100">
                  重置本節計時？
                </h3>
                <p className="text-xs text-stone-600 dark:text-slate-300 leading-relaxed">
                  重置後當前累積的時間將會清零，此操作無法復原。
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5 w-full">
              <button
                type="button"
                autoFocus
                onClick={() => setIsResetConfirmModalOpen(false)}
                className={`py-2 px-4 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                  isWarm
                    ? 'border-stone-200 hover:bg-stone-100 text-stone-700'
                    : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                }`}
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmReset}
                className="py-2 px-4 rounded-xl text-xs font-extrabold bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 transition-all cursor-pointer hover:scale-102 active:scale-98"
              >
                確定重置
              </button>
            </div>
          </div>
        </div>
      )}

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
