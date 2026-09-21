import React, { useState, useEffect, useMemo } from 'react';
import {
  Edit3,
  Clock,
  CheckCircle2,
  Coffee,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Zap,
  Sparkles,
  Palette,
  Briefcase,
  X,
  FileText,
} from 'lucide-react';
import { Project, TimeSession } from '../../types';
import { useTheme } from '../../ThemeContext';
import { ProjectSelectDropdown } from '../common/ProjectSelectDropdown';
import { getClientColor } from '../../utils/clientColors';
import { formatCurrency, formatHourlyRate } from '../../utils/currency';
import { getLocalDateString, toISOUTC } from '../../utils/dateUtils';
import { LOCAL_STORAGE_KEYS, loadFromLocalStorage, saveToLocalStorage } from '../../utils/storage';

interface ManualEntryTabProps {
  projects: Project[];
  sessions: TimeSession[];
  onSaveSession: (newSession: TimeSession) => void;
  onNavigateTab?: (tabId: string) => void;
  onOpenNewProjectModal?: () => void;
  onUpdateProject?: (project: Project) => void;
  activeProjectId?: string;
  setActiveProjectId?: (id: string) => void;
  timerStatus?: {
    isRunning: boolean;
    projectId: string;
    projectName: string;
    elapsedFormatted: string;
  };
  viewProjectId?: string;
  onViewProjectChange?: (projectId: string) => void;
}

export const ManualEntryTab: React.FC<ManualEntryTabProps> = ({
  projects,
  sessions,
  onSaveSession,
  onNavigateTab,
  onOpenNewProjectModal,
  onUpdateProject,
  activeProjectId,
  setActiveProjectId,
  timerStatus,
  viewProjectId,
  onViewProjectChange,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  // --- Tabbed Entry Mode: 'quick' | 'detailed' ---
  const [entryMode, setEntryMode] = useState<'quick' | 'detailed'>('quick');

  // --- Accordion Collapsible Form State (Default Collapsed) ---
  const [isFormExpanded, setIsFormExpanded] = useState<boolean>(false);

  // --- Dynamic Recent Keywords / Tags in LocalStorage ---
  const DEFAULT_RECENT_TAGS = ['插畫', '排版', '開會', '校對', '設計', '剪輯', '文案', '程式'];
  const [recentTags, setRecentTags] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('freelife_recent_tags');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      // ignore
    }
    return DEFAULT_RECENT_TAGS;
  });

  const addRecentTag = (tag: string) => {
    const trimmed = tag.trim();
    if (!trimmed) return;
    setRecentTags((prev) => {
      const filtered = prev.filter((t) => t !== trimmed);
      const updated = [trimmed, ...filtered].slice(0, 8);
      try {
        localStorage.setItem('freelife_recent_tags', JSON.stringify(updated));
      } catch (e) {
        // ignore
      }
      return updated;
    });
  };

  // --- Profession / Role Recommendation State ---
  const [currentProfession, setCurrentProfession] = useState<string>('');

  // --- Form States for Manual Entry ---
  const [selectedProjectId, setSelectedProjectId] = useState<string>(() => {
    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      return activeProjectId;
    }
    if (viewProjectId && projects.some((p) => p.id === viewProjectId)) {
      return viewProjectId;
    }
    return projects[0]?.id || '';
  });

  useEffect(() => {
    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, projects]);

  useEffect(() => {
    if (viewProjectId && projects.some((p) => p.id === viewProjectId)) {
      setSelectedProjectId(viewProjectId);
    }
  }, [viewProjectId, projects]);

  const handleSelectProject = (id: string) => {
    setSelectedProjectId(id);
    if (onViewProjectChange) {
      onViewProjectChange(id);
    }
    if (setActiveProjectId) {
      setActiveProjectId(id);
    }
  };

  const [workDate, setWorkDate] = useState<string>(() => getLocalDateString());

  // Year, Month, Day helper calculations for dropdown selectors
  const [yearVal, monthVal, dayVal] = useMemo(() => {
    if (!workDate) {
      const d = new Date();
      return [d.getFullYear(), d.getMonth() + 1, d.getDate()];
    }
    const parts = workDate.split('-');
    return [
      parseInt(parts[0], 10) || new Date().getFullYear(),
      parseInt(parts[1], 10) || (new Date().getMonth() + 1),
      parseInt(parts[2], 10) || new Date().getDate()
    ];
  }, [workDate]);

  const todayObj = new Date();
  const currYear = todayObj.getFullYear();
  const currMonth = todayObj.getMonth() + 1;
  const currDay = todayObj.getDate();

  // Year dropdown options (Current Year down to 2020)
  const yearsOptions = useMemo(() => {
    const arr = [];
    for (let y = currYear; y >= 2020; y--) {
      arr.push(y);
    }
    return arr;
  }, [currYear]);

  // Month dropdown options based on selected year
  const monthsOptions = useMemo(() => {
    const arr = [];
    const limit = (yearVal === currYear) ? currMonth : 12;
    for (let m = 1; m <= limit; m++) {
      arr.push(m);
    }
    return arr;
  }, [yearVal, currYear, currMonth]);

  // Day dropdown options based on selected year and month
  const daysOptions = useMemo(() => {
    const arr = [];
    const maxDays = new Date(yearVal, monthVal, 0).getDate();
    const limit = (yearVal === currYear && monthVal === currMonth) ? currDay : maxDays;
    for (let d = 1; d <= limit; d++) {
      arr.push(d);
    }
    return arr;
  }, [yearVal, monthVal, currYear, currMonth, currDay]);

  const handleYearChange = (yStr: string) => {
    const y = parseInt(yStr, 10);
    let newM = monthVal;
    if (y === currYear && newM > currMonth) {
      newM = currMonth;
    }
    const maxDays = new Date(y, newM, 0).getDate();
    let newD = dayVal;
    if (newD > maxDays) {
      newD = maxDays;
    }
    if (y === currYear && newM === currMonth && newD > currDay) {
      newD = currDay;
    }
    const formattedDate = `${y}-${String(newM).padStart(2, '0')}-${String(newD).padStart(2, '0')}`;
    setWorkDate(formattedDate);
  };

  const handleMonthChange = (mStr: string) => {
    const m = parseInt(mStr, 10);
    const maxDays = new Date(yearVal, m, 0).getDate();
    let newD = dayVal;
    if (newD > maxDays) {
      newD = maxDays;
    }
    if (yearVal === currYear && m === currMonth && newD > currDay) {
      newD = currDay;
    }
    const formattedDate = `${yearVal}-${String(m).padStart(2, '0')}-${String(newD).padStart(2, '0')}`;
    setWorkDate(formattedDate);
  };

  const handleDayChange = (dStr: string) => {
    const d = parseInt(dStr, 10);
    const formattedDate = `${yearVal}-${String(monthVal).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    setWorkDate(formattedDate);
  };
  
  // 24-hour Time Interval States (unprefilled by default)
  const [isTimeRangeExpanded, setIsTimeRangeExpanded] = useState<boolean>(false);
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Work & Break Durations (unprefilled by default, break default 0)
  const [workHours, setWorkHours] = useState<number | ''>('');
  const [workMinutes, setWorkMinutes] = useState<number | ''>('');
  const [breakMinutes, setBreakMinutes] = useState<number | ''>(0);
  
  // Optional Memo (initialized empty)
  const [taskNote, setTaskNote] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'focus' | 'break'>('focus');

  // Scope Creep Simulator States (Default Collapsed)
  const [isScopeCreepExpanded, setIsScopeCreepExpanded] = useState<boolean>(false);
  const [scopeCreepProjectId, setScopeCreepProjectId] = useState<string>(() => projects[0]?.id || '');
  const [scopeCreepHours, setScopeCreepHours] = useState<number>(1);
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);

  // Helper to calculate end time string given start time and minutes
  const calcEndTimeStr = (start: string, durationMins: number): string => {
    if (!start) return '15:30';
    const parts = start.split(':');
    const h = parseInt(parts[0], 10) || 0;
    const m = parseInt(parts[1], 10) || 0;
    const totalM = (h * 60 + m + durationMins) % (24 * 60);
    const endH = Math.floor(totalM / 60).toString().padStart(2, '0');
    const endM = (totalM % 60).toString().padStart(2, '0');
    return `${endH}:${endM}`;
  };

  // Helper to calculate duration minutes given start and end time
  const calcDurationFromTimes = (start: string, end: string): number => {
    if (!start || !end) return 0;
    const [h1, m1] = start.split(':').map((v) => parseInt(v, 10) || 0);
    const [h2, m2] = end.split(':').map((v) => parseInt(v, 10) || 0);
    let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
    if (diff < 0) diff += 24 * 60; // Cross-midnight safe
    return diff;
  };

  // Sync projects list for Scope Creep
  useEffect(() => {
    if (projects.length > 0) {
      if (!scopeCreepProjectId || !projects.some((p) => p.id === scopeCreepProjectId)) {
        setScopeCreepProjectId(projects[0].id);
      }
    }
  }, [projects, scopeCreepProjectId]);

  const currentProject = projects.find((p) => p.id === selectedProjectId);

  const clientColor = currentProject
    ? getClientColor(currentProject.clientName, currentProject.clientColor || currentProject.color)
    : '#E2E8F0';

  const showToast = (msg: string, forcedType?: 'focus' | 'break') => {
    const isRest = forcedType === 'break' || (!forcedType && (msg.includes('休息') || msg.includes('☕')));
    setToastType(isRest ? 'break' : 'focus');
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Preset Profession Tags for fast selection
  const presetProfessions = [
    '🎨 插畫',
    '✨ 設計師',
    '🎬 影片剪輯',
    '🏋️ 健身教練',
    '🍰 甜點師 / 烘焙',
    '✍️ 翻譯 / 文案',
    '📷 攝影 / 修圖',
    '💼 通用 Freelancer',
  ];

  // Dynamic Concise Keywords Recommendation based on currentProfession (no break text, core concise terms)
  const dynamicKeywords = useMemo<string[]>(() => {
    const raw = currentProfession.trim().toLowerCase();

    // 1. 插畫 / 繪圖 / 藝術 / 動漫
    if (raw.includes('插畫') || raw.includes('繪圖') || raw.includes('畫') || raw.includes('繪') || raw.includes('illustrat') || raw.includes('art') || raw.includes('漫畫')) {
      return ['草稿構圖', '精細線稿', '光影上色', '角色設定', '背景繪製', 'Client 改稿', '完稿輸出'];
    }

    // 2. 設計師 / 視覺 / 平面 / 品牌 / UI
    if (raw.includes('設計') || raw.includes('design') || raw.includes('視覺') || raw.includes('平面') || raw.includes('排版') || raw.includes('brand') || raw.includes('logo') || raw.includes('包裝') || raw.includes('海報')) {
      return ['品牌識別', '排版設計', '提案簡報', '海報設計', '包裝規範', 'Client 改稿', '完稿送印'];
    }

    // 3. 影片剪輯 / 影音 / 動畫
    if (raw.includes('剪輯') || raw.includes('影片') || raw.includes('video') || raw.includes('影音') || raw.includes('剪片') || raw.includes('動畫') || raw.includes('youtub')) {
      return ['粗剪順片', '精剪調色', '音效配樂', '字幕特效', '動態字卡', 'Client 改片', '輸出交件'];
    }

    // 4. 健身教練 / 運動指導
    if (raw.includes('健身') || raw.includes('教練') || raw.includes('運動') || raw.includes('瑜珈') || raw.includes('fitness') || raw.includes('trainer') || raw.includes('體能')) {
      return ['動作評估', '課表規劃', '1對1 教學', '飲食指導', '學員諮詢', '體態檢測', '進度追蹤'];
    }

    // 5. 甜點師 / 烘焙 / 料理
    if (raw.includes('甜點') || raw.includes('烘焙') || raw.includes('廚藝') || raw.includes('料理') || raw.includes('蛋糕') || raw.includes('baking') || raw.includes('cake')) {
      return ['食譜研發', '備料製作', '烘焙烤焙', '奶油抹面', '翻糖裝飾', '包裝出貨', '客製訂單'];
    }

    // 6. 翻譯 / 文案 / 寫作
    if (raw.includes('翻譯') || raw.includes('文案') || raw.includes('寫作') || raw.includes('translat') || raw.includes('copywriting') || raw.includes('文章') || raw.includes('編輯')) {
      return ['初稿翻譯', '專有名詞校對', '雙語潤稿', '文案撰寫', '格式排版', '審查修訂', '交件覆核'];
    }

    // 7. 攝影師 / 修圖
    if (raw.includes('攝影') || raw.includes('照片') || raw.includes('修圖') || raw.includes('photo') || raw.includes('camera') || raw.includes('外拍')) {
      return ['拍攝前置', '現場拍攝', '毛片挑選', '風格調色', '人像精修', '瑕疵去除', '交稿出圖'];
    }

    // 8. 程式 / 開發 / 工程師
    if (raw.includes('程式') || raw.includes('dev') || raw.includes('web') || raw.includes('engineer') || raw.includes('前端') || raw.includes('後端')) {
      return ['架構設計', '功能開發', 'API 串接', 'Bug 修復', '單元測試', '部署發布'];
    }

    // 9. 行銷 / 社群
    if (raw.includes('行銷') || raw.includes('社群') || raw.includes('marketing') || raw.includes('廣告')) {
      return ['貼文文案', '廣告投放', '數據分析', '活動企劃', '素材製作', '結案報告'];
    }

    // 10. 通用 Freelancer 情境 (Default & Fallback)
    return ['需求會議', '合約報價', '專案執行', '提案簡報', 'Client 改稿', '進度匯報', '結案交稿'];
  }, [currentProfession]);

  // Apply keyword directly into taskNote
  const handleApplyKeyword = (keyword: string) => {
    setTaskNote(keyword);
    showToast(`✨ 已帶入「${keyword}」至工作 Memo！`);
  };

  // Group projects by clientName for organized select dropdown
  const groupedProjects = useMemo(() => {
    const map = new Map<string, Project[]>();
    projects.forEach((p) => {
      const client = p.clientName || '未指定 Client';
      if (!map.has(client)) {
        map.set(client, []);
      }
      map.get(client)!.push(p);
    });
    return map;
  }, [projects]);

  // When start time changes:
  // If end time is already provided, recalculate gross duration and update workHours / workMinutes
  const handleStartTimeChange = (newStart: string) => {
    setStartTime(newStart);
    if (newStart && endTime) {
      const grossMins = calcDurationFromTimes(newStart, endTime);
      const b = typeof breakMinutes === 'number' ? breakMinutes : 0;
      const netMins = Math.max(0, grossMins - b);
      setWorkHours(Math.floor(netMins / 60));
      setWorkMinutes(netMins % 60);
    } else if (newStart) {
      const h = typeof workHours === 'number' ? workHours : 0;
      const m = typeof workMinutes === 'number' ? workMinutes : 0;
      const b = typeof breakMinutes === 'number' ? breakMinutes : 0;
      const grossMins = h * 60 + m + b;
      if (grossMins > 0) {
        setEndTime(calcEndTimeStr(newStart, grossMins));
      }
    }
  };

  // When end time changes, recalculate workHours and workMinutes = total duration - breakMinutes (default 0)
  const handleEndTimeChange = (newEnd: string) => {
    setEndTime(newEnd);
    if (startTime && newEnd) {
      const grossMins = calcDurationFromTimes(startTime, newEnd);
      const b = typeof breakMinutes === 'number' ? breakMinutes : 0;
      const netMins = Math.max(0, grossMins - b);
      setWorkHours(Math.floor(netMins / 60));
      setWorkMinutes(netMins % 60);
    }
  };

  // When break minutes change, recalculate workHours and workMinutes = total duration - breakMinutes
  const handleBreakMinutesChange = (newBreak: number | '') => {
    const validBreak = typeof newBreak === 'number' ? Math.max(0, newBreak) : 0;
    setBreakMinutes(newBreak);
    if (startTime && endTime) {
      const grossMins = calcDurationFromTimes(startTime, endTime);
      const netMins = Math.max(0, grossMins - validBreak);
      setWorkHours(Math.floor(netMins / 60));
      setWorkMinutes(netMins % 60);
    }
  };

  // When workHours or workMinutes change, update end time if start time is present
  const handleWorkHoursChange = (h: number | '') => {
    setWorkHours(h);
    const validH = typeof h === 'number' ? Math.max(0, Math.min(24, h)) : 0;
    const m = typeof workMinutes === 'number' ? workMinutes : 0;
    const b = typeof breakMinutes === 'number' ? breakMinutes : 0;
    const netMins = validH * 60 + m;
    const grossMins = netMins + b;
    if (startTime && grossMins > 0) {
      setEndTime(calcEndTimeStr(startTime, grossMins));
    }
  };

  const handleWorkMinutesChange = (m: number | '') => {
    setWorkMinutes(m);
    const validM = typeof m === 'number' ? Math.max(0, Math.min(59, m)) : 0;
    const h = typeof workHours === 'number' ? workHours : 0;
    const b = typeof breakMinutes === 'number' ? breakMinutes : 0;
    const netMins = h * 60 + validM;
    const grossMins = netMins + b;
    if (startTime && grossMins > 0) {
      setEndTime(calcEndTimeStr(startTime, grossMins));
    }
  };

  // Quick Add Minutes Handler (One-Click Time Log)
  const handleQuickAddMinutes = (addedMins: number, label: string) => {
    if (!currentProject) {
      showToast('⚠️ 請先選擇或建立 Project！');
      return;
    }
    const isFixed = currentProject.feeType === 'fixed';
    const targetHourlyRate = currentProject.targetHourlyRate || 600;
    const earnedAmount = Math.round((addedMins / 60) * targetHourlyRate);
    const now = new Date();
    const startTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const effectiveDate = workDate || getLocalDateString(now);
    const endNow = new Date(now.getTime() + addedMins * 60000);
    const endTimeStr = `${endNow.getHours().toString().padStart(2, '0')}:${endNow.getMinutes().toString().padStart(2, '0')}`;
    const endDateStr = getLocalDateString(endNow);
    const isCross = endDateStr !== effectiveDate;

    const finalDesc = taskNote.trim() || `快捷加時 (${label})`;
    if (taskNote.trim()) {
      addRecentTag(taskNote.trim());
    }

    const newSession: TimeSession = {
      id: `sess-${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      clientName: currentProject.clientName,
      taskDescription: finalDesc,
      date: effectiveDate,
      startDate: effectiveDate,
      endDate: endDateStr,
      startTime: startTimeStr,
      endTime: endTimeStr,
      startISO: toISOUTC(now),
      endISO: toISOUTC(endNow),
      isCrossMidnight: isCross,
      workDurationMinutes: addedMins,
      breakDurationMinutes: 0,
      effectiveHourlyRate: targetHourlyRate,
      earnedAmount,
      status: 'completed',
      tags: [isFixed ? '合約總額' : 'Hourly'].filter(Boolean),
    };

    onSaveSession(newSession);
    setTaskNote('');
    setWorkDate(getLocalDateString());

    if (setActiveProjectId) {
      setActiveProjectId(newSession.projectId);
    }
    if (onViewProjectChange) {
      onViewProjectChange(newSession.projectId);
    }

    // Highlight and auto-navigate to Calculator overview tab
    try {
      localStorage.setItem('freelife_highlight_session_id', newSession.id);
    } catch (e) {
      // ignore
    }

    if (onNavigateTab) {
      onNavigateTab('calculator');
    }
  };

  // Submit manual entry (Default to '專注工作' if blank)
  const handleSubmitManualEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProject) {
      showToast('⚠️ 請先選擇或建立 Project！');
      return;
    }

    const todayStr = getLocalDateString();
    if (workDate && workDate > todayStr) {
      showToast('⚠️ 手動補記僅限過去或今天的工時紀錄');
      return;
    }

    const h = typeof workHours === 'number' ? workHours : 0;
    const m = typeof workMinutes === 'number' ? workMinutes : 0;
    const totalWorkMins = h * 60 + m;
    if (totalWorkMins <= 0) {
      showToast('⚠️ 請在「投入實質工時」輸入有效的小時或分鐘！');
      return;
    }

    const b = typeof breakMinutes === 'number' ? breakMinutes : 0;
    const isFixed = currentProject.feeType === 'fixed';
    const targetHourlyRate = currentProject.targetHourlyRate || 600;
    const earnedAmount = Math.round((totalWorkMins / 60) * targetHourlyRate);

    // Default to '專注工作' if note is empty
    const finalDescription = taskNote.trim() || '專注工作';
    if (taskNote.trim()) {
      addRecentTag(taskNote.trim());
    }

    const startStr = startTime.trim();
    const endStr = endTime.trim();
    const effectiveWorkDate = workDate || todayStr;

    // Calculate start & end ISO timestamps
    let startISO = '';
    let endISO = '';
    let isCross = false;
    let computedEndDate = effectiveWorkDate;

    if (startStr) {
      try {
        const [sh, sm] = startStr.split(':').map(Number);
        const startDateObj = new Date(`${effectiveWorkDate}T${String(sh).padStart(2, '0')}:${String(sm).padStart(2, '0')}:00`);
        startISO = toISOUTC(startDateObj);

        const totalGrossMins = totalWorkMins + b;
        const endDateObj = new Date(startDateObj.getTime() + totalGrossMins * 60000);
        endISO = toISOUTC(endDateObj);
        computedEndDate = getLocalDateString(endDateObj);
        isCross = computedEndDate !== effectiveWorkDate;
      } catch (err) {
        startISO = toISOUTC();
        endISO = toISOUTC();
      }
    } else {
      startISO = toISOUTC();
      endISO = toISOUTC();
    }

    const finalEndTimeStr = endStr || (startStr ? calcEndTimeStr(startStr, totalWorkMins + b) : '--:--');

    const newSession: TimeSession = {
      id: `sess-${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      clientName: currentProject.clientName,
      taskDescription: finalDescription,
      date: effectiveWorkDate,
      startDate: effectiveWorkDate,
      endDate: computedEndDate,
      startTime: startStr || '--:--',
      endTime: finalEndTimeStr,
      startISO,
      endISO,
      isCrossMidnight: isCross,
      workDurationMinutes: totalWorkMins,
      breakDurationMinutes: b,
      effectiveHourlyRate: targetHourlyRate,
      earnedAmount,
      status: 'completed',
      tags: [isFixed ? '合約總額' : 'Hourly'].filter(Boolean),
    };

    onSaveSession(newSession);
    
    // Reset all form inputs to clean initial state (including resetting workDate to today)
    setWorkDate(todayStr);
    setWorkHours('');
    setWorkMinutes('');
    setBreakMinutes(0);
    setTaskNote('');
    setStartTime('');
    setEndTime('');
    setIsTimeRangeExpanded(false);

    if (setActiveProjectId) {
      setActiveProjectId(newSession.projectId);
    }
    if (onViewProjectChange) {
      onViewProjectChange(newSession.projectId);
    }

    // Highlight and auto-navigate to Calculator overview tab
    try {
      localStorage.setItem('freelife_highlight_session_id', newSession.id);
    } catch (e) {
      // ignore
    }

    if (onNavigateTab) {
      onNavigateTab('calculator');
    }
  };

  // Scope Creep calculations (Empty State Guard for usedHours < 1)
  const targetScopeProject = projects.find((p) => p.id === scopeCreepProjectId) || currentProject || projects[0];
  const isNoProjectSelected = !targetScopeProject || !scopeCreepProjectId;
  const totalBudget = targetScopeProject?.totalContractAmount || 0;
  const extraHours = scopeCreepHours;

  // Calculate current logged minutes & hours for this target project
  const scopeProjectSessions = useMemo(() => {
    if (isNoProjectSelected) return [];
    return sessions.filter((s) => s.projectId === targetScopeProject?.id);
  }, [sessions, targetScopeProject?.id, isNoProjectSelected]);

  const scopeCurrentWorkedMinutes = scopeProjectSessions.reduce((sum, s) => sum + s.workDurationMinutes, 0);
  const usedHours = isNoProjectSelected ? 0 : scopeCurrentWorkedMinutes / 60; // Exact hours e.g. 0.3h
  const isUnderOneHour = isNoProjectSelected || usedHours < 1;

  // 只有當 usedHours >= 1 時，才啟動時薪計算
  // 1. 當前時薪 (currentHourlyRate): totalBudget / usedHours
  const currentHourlyRate = !isUnderOneHour && usedHours > 0 ? totalBudget / usedHours : 0;

  // 2. 若免費改稿 時薪將跌至 (newHourlyRate): totalBudget / (usedHours + extraHours)
  const newHourlyRate = !isUnderOneHour && (usedHours + extraHours) > 0 ? totalBudget / (usedHours + extraHours) : 0;

  // 3. 每小時少賺 (rateDrop): currentHourlyRate - newHourlyRate
  const rateDrop = !isUnderOneHour ? Math.max(0, currentHourlyRate - newHourlyRate) : 0;

  // 4. 拉低百分比 (percentageDrop)
  const percentageDrop = !isUnderOneHour && currentHourlyRate > 0
    ? Math.max(0, Math.min(100, ((currentHourlyRate - newHourlyRate) / currentHourlyRate) * 100))
    : 0;

  // 5. 建議追加報價金額 (suggestedQuote): currentHourlyRate * extraHours (四捨五入至整數)
  const suggestedQuote = !isUnderOneHour ? Math.round(currentHourlyRate * extraHours) : 0;

  const currentHourlyRateFormatted = !isUnderOneHour
    ? formatHourlyRate(currentHourlyRate)
    : '-- / h';

  const newHourlyRateFormatted = !isUnderOneHour
    ? formatHourlyRate(newHourlyRate)
    : '-- / h';

  const rateDropFormatted = !isUnderOneHour
    ? formatCurrency(rateDrop)
    : '--';

  const percentageDropFormatted = !isUnderOneHour
    ? `${percentageDrop.toFixed(1)}%`
    : '--%';

  const handleCopyScopeCreepQuote = () => {
    const clientName = targetScopeProject?.clientName || 'Client';
    const projName = targetScopeProject?.name || 'Project';
    const quoteText = !isUnderOneHour && suggestedQuote > 0
      ? `追加報價 ${formatCurrency(suggestedQuote)}`
      : `追加報價（約 ${extraHours} 小時）`;
    const text = `Hi ${clientName}，收到你關於「${projName}」嘅改稿需求！因為今次修改範圍超出咗原定合約內容，估計需要額外加多 ${extraHours} 小時處理。為維持項目進度與品質，呢部分會${quoteText}。如果冇問題我哋就安排開工，辛苦晒！`;
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    showToast('💬 已複製廣東話追加報價 WhatsApp 文案！');
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-28">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          id="manual-entry-tab-toast"
          className={`fixed z-50 bottom-20 left-1/2 -translate-x-1/2 max-w-[92vw] w-max md:bottom-auto md:top-20 md:right-6 md:left-auto md:translate-x-0 md:max-w-md text-white px-4 py-2.5 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 border transition-all duration-200 toast-mobile-slide-up select-none pointer-events-auto ${
            toastType === 'break'
              ? 'bg-[#ea580c] border-orange-400 shadow-orange-950/25'
              : 'bg-emerald-600 border-emerald-400 shadow-emerald-950/25'
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

      {/* ============================================================ */}
      {/* 1. MANUAL ENTRY FORM */}
      {/* ============================================================ */}
      <div
        className={`rounded-3xl p-6 sm:p-8 border transition-all duration-200 ${
          isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
        style={{
          borderLeftWidth: isFormExpanded && currentProject ? '4px' : '1px',
          borderLeftColor: isFormExpanded && currentProject
            ? clientColor
            : (isWarm ? '#e7e5e4' : '#1e293b'),
        }}
      >
            {/* Clean Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-stone-100 dark:border-slate-800 mb-6 gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                  <Edit3 size={20} />
                </div>
                <div>
                  <h2 className="font-black text-lg sm:text-xl text-stone-900 dark:text-slate-100">
                    手動補記工時
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    忘記開計時器？即時在此補記時間
                  </p>
                </div>
              </div>
            </div>

            {/* Sub-tab Entry Mode Switcher */}
            <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-stone-100 dark:bg-slate-800/80 mb-6">
              <button
                type="button"
                onClick={() => setEntryMode('quick')}
                className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  entryMode === 'quick'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <Zap size={16} />
                <span>一鍵快捷加時</span>
              </button>
              <button
                type="button"
                onClick={() => setEntryMode('detailed')}
                className={`flex-1 py-2.5 px-3 sm:px-4 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  entryMode === 'detailed'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'text-stone-600 dark:text-slate-300 hover:text-stone-900 dark:hover:text-white'
                }`}
              >
                <FileText size={16} />
                <span>詳細紀錄</span>
              </button>
            </div>

            {/* ACCORDION FORM WRAPPER: DEFAULT COLLAPSED */}
            {!isFormExpanded ? (
              <div
                onClick={() => setIsFormExpanded(true)}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  isWarm ? 'bg-stone-50 hover:bg-stone-100/80 border-stone-200' : 'bg-slate-950/60 hover:bg-slate-950 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {entryMode === 'quick' ? <Zap size={18} className="text-amber-500 shrink-0" /> : <FileText size={18} className="text-emerald-500 shrink-0" />}
                  <div>
                    <div className="text-xs sm:text-sm font-extrabold text-stone-800 dark:text-slate-200 flex items-center gap-2">
                      <span>當前補記模式：{entryMode === 'quick' ? '一鍵快捷加時' : '詳細紀錄'}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold">點擊展開</span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer shrink-0"
                >
                  <span>展開填寫表單</span>
                  <ChevronDown size={14} />
                </button>
              </div>
            ) : (
              <div className="space-y-6 animate-in fade-in-50 duration-200">
                {/* Header Collapse Bar */}
                <div className="flex items-center justify-end pb-3 border-b border-stone-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsFormExpanded(false)}
                    className="px-3 py-1 rounded-xl border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-stone-600 dark:text-slate-300 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>收摺表單</span>
                    <ChevronUp size={14} />
                  </button>
                </div>

                {/* MODE 1: QUICK TIME LOG */}
                {entryMode === 'quick' ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* 1. 選擇 Project */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                          1. 選擇Project <span className="text-rose-500">*</span>
                        </label>
                        {projects.length > 0 ? (
                          <ProjectSelectDropdown
                            projects={projects}
                            selectedProjectId={selectedProjectId}
                            onSelectProject={(id) => handleSelectProject(id)}
                            className="w-full"
                          />
                        ) : (
                          <span className="text-xs text-rose-500 font-bold">尚無 Project</span>
                        )}
                      </div>

                      {/* 2. 動態熱門標籤 & 自訂備註 */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                          <span>2. 工作內容</span>
                        </label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {recentTags.slice(0, 6).map((tag, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setTaskNote(tag)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                                taskNote === tag
                                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                                  : isWarm
                                  ? 'bg-stone-50 hover:bg-stone-100 border-stone-200 text-stone-700'
                                  : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-slate-300'
                              }`}
                            >
                              <span>{tag}</span>
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="或輸入自訂備註（例：Client 追稿、臨時開會...）"
                          value={taskNote}
                          onChange={(e) => setTaskNote(e.target.value)}
                          className={`w-full text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2 border outline-none transition-colors ${
                            isWarm
                              ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                              : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                          }`}
                        />
                      </div>
                    </div>

                {/* 3. 一鍵累加按鈕矩陣 */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-3">
                    3. 點擊一鍵直接追加工時至 Timesheet：
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                    {[
                      { label: '+15m', mins: 15 },
                      { label: '+30m', mins: 30 },
                      { label: '+1h', mins: 60 },
                      { label: '+2h', mins: 120 },
                      { label: '+3h', mins: 180 },
                      { label: '+4h', mins: 240 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        onClick={() => handleQuickAddMinutes(item.mins, item.label)}
                        disabled={!currentProject}
                        className={`py-4 px-3 rounded-2xl border font-black flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                          isWarm
                            ? 'bg-emerald-50/80 hover:bg-emerald-100 border-emerald-300 text-emerald-800 shadow-2xs hover:scale-103'
                            : 'bg-emerald-950/40 hover:bg-emerald-900/60 border-emerald-800 text-emerald-300 shadow-2xs hover:scale-103'
                        }`}
                      >
                        <span className="text-lg font-black">{item.label}</span>
                        <span className="text-[10px] font-normal opacity-80">
                          ({item.mins} 分鐘)
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* MODE 2: DETAILED FORM */
              <form onSubmit={handleSubmitManualEntry} className="space-y-5">
              {/* Row 1: Field 1 (選擇 Client & Project *) & Field 2 (工作日期 *) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. 選擇 Client & Project * (按 Client 分組) */}
                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                    1. 選擇Project <span className="text-rose-500">*</span>
                  </label>
                  {projects.length > 0 ? (
                    <ProjectSelectDropdown
                      projects={projects}
                      selectedProjectId={selectedProjectId}
                      onSelectProject={(id) => handleSelectProject(id)}
                      className="w-full"
                    />
                  ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-rose-500 font-bold">尚無 Project</span>
                  {onOpenNewProjectModal && (
                    <button
                      type="button"
                      onClick={onOpenNewProjectModal}
                      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 text-white cursor-pointer"
                    >
                      ＋ 新增 Project
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* 2. 工作日期 * */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                2. 工作日期 <span className="text-rose-500">*</span>
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {/* Year Select */}
                <div className="relative">
                  <select
                    value={yearVal}
                    onChange={(e) => handleYearChange(e.target.value)}
                    className={`w-full text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none appearance-none transition-colors cursor-pointer ${
                      isWarm
                        ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  >
                    {yearsOptions.map((y) => (
                      <option key={y} value={y}>{y} 年</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-400">
                    <span className="text-[10px]">⌵</span>
                  </div>
                </div>

                {/* Month Select */}
                <div className="relative">
                  <select
                    value={monthVal}
                    onChange={(e) => handleMonthChange(e.target.value)}
                    className={`w-full text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none appearance-none transition-colors cursor-pointer ${
                      isWarm
                        ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  >
                    {monthsOptions.map((m) => (
                      <option key={m} value={m}>{m} 月</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-400">
                    <span className="text-[10px]">⌵</span>
                  </div>
                </div>

                {/* Day Select */}
                <div className="relative">
                  <select
                    value={dayVal}
                    onChange={(e) => handleDayChange(e.target.value)}
                    className={`w-full text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none appearance-none transition-colors cursor-pointer ${
                      isWarm
                        ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  >
                    {daysOptions.map((d) => (
                      <option key={d} value={d}>{d} 日</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-stone-400">
                    <span className="text-[10px]">⌵</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Field 3 (補記實際時間) */}
          <div className="border border-stone-200/80 dark:border-slate-800 rounded-2xl p-3 sm:p-4 bg-stone-50/50 dark:bg-slate-950/40">
            <button
              type="button"
              onClick={() => setIsTimeRangeExpanded((prev) => !prev)}
              className="w-full flex items-center justify-between text-xs font-bold text-stone-700 dark:text-slate-300 cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Clock size={15} className="text-emerald-600 dark:text-emerald-400" />
                <span>3. 補記實際時間</span>
                {startTime && endTime && (
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono">
                    {startTime} - {endTime}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 text-[11px] text-stone-400">
                <span>{isTimeRangeExpanded ? '收合' : '展開'}</span>
                {isTimeRangeExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </div>
            </button>

            {isTimeRangeExpanded && (
              <div className="mt-3 pt-3 border-t border-stone-200/60 dark:border-slate-800 space-y-2 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <span className="text-[11px] text-stone-500 dark:text-slate-400 block mb-1 font-medium">
                      開始時間 (Start)
                    </span>
                    <input
                      type="time"
                      value={startTime}
                      onChange={(e) => handleStartTimeChange(e.target.value)}
                      className={`w-full text-xs sm:text-sm font-mono font-bold rounded-xl px-3 py-2 border outline-none text-center ${
                        isWarm
                          ? 'bg-white border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
                          : 'bg-slate-900 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                  </div>

                  <div>
                    <span className="text-[11px] text-stone-500 dark:text-slate-400 block mb-1 font-medium">
                      結束時間 (End)
                    </span>
                    <input
                      type="time"
                      value={endTime}
                      onChange={(e) => handleEndTimeChange(e.target.value)}
                      className={`w-full text-xs sm:text-sm font-mono font-bold rounded-xl px-3 py-2 border outline-none text-center ${
                        isWarm
                          ? 'bg-white border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
                          : 'bg-slate-900 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-stone-400">
                  {startTime && endTime
                    ? `區間：${startTime} 至 ${endTime}（已自動連動下方工時長度）`
                    : '無需指定時間點時可留空，直接在下方輸入投入小時與分鐘'}
                </p>
              </div>
            )}
          </div>

          {/* Row 3: Field 4 (投入實質工時 *) & Field 5 (舒緩休息時間) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 4. 投入實質工時 * */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                4. 實質投入工時 <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="24"
                    step="any"
                    placeholder="0"
                    value={workHours}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleWorkHoursChange(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className={`w-full text-xs sm:text-sm font-black font-mono rounded-xl pl-3.5 pr-16 py-2.5 border outline-none text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      isWarm
                        ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-400 pointer-events-none">小時 (h)</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="any"
                    placeholder="0"
                    value={workMinutes}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleWorkMinutesChange(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className={`w-full text-xs sm:text-sm font-black font-mono rounded-xl pl-3.5 pr-16 py-2.5 border outline-none text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      isWarm
                        ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-stone-400 pointer-events-none">分鐘 (m)</span>
                </div>
              </div>
            </div>

            {/* 5. 舒緩休息時間 (不計工時) */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                5. 舒緩休息時間 (不計工時)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  max="180"
                  step="any"
                  placeholder="0"
                  value={breakMinutes}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => handleBreakMinutesChange(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value) || 0))}
                  className={`w-full text-xs sm:text-sm font-black font-mono rounded-xl pl-3.5 pr-16 py-2.5 border outline-none text-left [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    isWarm
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-stone-400 pointer-events-none">分鐘 (m)</span>
              </div>
            </div>
          </div>

          {/* Row 4: Field 6 (工作內容) + 內建標籤快速帶入 */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5 flex items-center justify-between">
                <span>6. 工作內容</span>
                <span className="text-[10px] text-stone-400 font-normal">留空將自動帶入「專注工作」</span>
              </label>
              <input
                type="text"
                value={taskNote}
                onChange={(e) => setTaskNote(e.target.value)}
                placeholder="例：封面插畫草稿、Client 追稿、開meeting、排版校對..."
                className={`w-full text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border outline-none transition-colors ${
                  isWarm
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                    : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                }`}
              />
            </div>

            {/* Quick Built-in Tags Bar */}
            <div className="p-3.5 rounded-2xl bg-stone-50/90 dark:bg-slate-950/70 border border-stone-200/90 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={14} className="text-amber-500" />
                <span className="text-xs font-extrabold text-stone-800 dark:text-slate-200">
                  常用工作標籤（歷史紀錄自動記錄）
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {recentTags.map((tagText, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setTaskNote((prev) => (prev ? `${prev}、${tagText}` : tagText));
                      setToastMessage(`已帶入「${tagText}」至工作 Memo`);
                    }}
                    className={`px-2.5 py-1 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1 hover:scale-102 active:scale-98 ${
                      taskNote.includes(tagText)
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isWarm
                        ? 'bg-white border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-800'
                        : 'bg-slate-900 border-slate-800 hover:border-emerald-500 hover:bg-emerald-950/40 text-slate-200'
                    }`}
                  >
                    <span>{tagText}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-3.5 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-emerald-600/25 hover:scale-101"
            >
              <CheckCircle2 size={18} />
              <span>確認補記並存入 Timesheet</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )}
</div>

      {/* ============================================================ */}
      {/* 2. SCOPE CREEP 改稿防護算盤 (ACCORDION - DEFAULT COLLAPSED) */}
      {/* ============================================================ */}
      <div
        className={`rounded-3xl border transition-all overflow-hidden ${
          isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <button
          onClick={() => setIsScopeCreepExpanded(!isScopeCreepExpanded)}
          className={`w-full p-4 sm:p-5 flex items-center justify-between text-left transition-colors cursor-pointer ${
            isWarm ? 'hover:bg-stone-50/80' : 'hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="p-2.5 rounded-xl bg-slate-800 text-white shadow-xs shrink-0">
              <Clock size={18} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-slate-100 whitespace-nowrap">
                  Client 臨時追加修改？
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shrink-0 whitespace-nowrap">
                  報價神器
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                即時計算實質少賺幾多，拒絕免費OT
              </p>
            </div>
          </div>

          <div className="p-1.5 rounded-xl border border-stone-200 dark:border-slate-700 text-stone-500 shrink-0 ml-2">
            {isScopeCreepExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </div>
        </button>

        {isScopeCreepExpanded && (
          <div className="p-5 sm:p-7 space-y-6 bg-stone-50/40 dark:bg-slate-950/30">
            {/* Scope Creep Project Selection & Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  選擇要評估的 Project：
                </label>
                <select
                  value={scopeCreepProjectId}
                  onChange={(e) => setScopeCreepProjectId(e.target.value)}
                  style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}
                  className={`w-full max-w-full text-xs font-bold rounded-xl px-3 py-2.5 border outline-none cursor-pointer truncate ${
                    isWarm
                      ? 'bg-white border-stone-300 text-stone-900'
                      : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                >
                  {projects.length === 0 ? (
                    <option value="">請先選擇或建立 Project</option>
                  ) : (
                    <>
                      {(!scopeCreepProjectId || !projects.some(p => p.id === scopeCreepProjectId)) && (
                        <option value="">請先選擇或建立 Project</option>
                      )}
                      {projects.map((p) => (
                        <option key={p.id} value={p.id} className="truncate">
                          {p.name} [{p.clientName}] · HK$ {p.totalContractAmount.toLocaleString()}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>
 
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                    預計額外改稿 / 追加工時：
                  </label>
                  <span className="font-mono font-semibold text-sm text-slate-800 dark:text-slate-200">
                    {isNoProjectSelected ? '+--' : `+${scopeCreepHours}`} 小時
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={isNoProjectSelected ? 1 : scopeCreepHours}
                  disabled={isNoProjectSelected}
                  onChange={(e) => setScopeCreepHours(parseInt(e.target.value) || 1)}
                  className={`w-full accent-slate-800 dark:accent-slate-200 cursor-pointer transition-all ${
                    isNoProjectSelected ? 'opacity-40 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>

            {/* Impact Metric Cards (Dynamic Effective Hourly Rate) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: 當前時薪 */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-500 dark:text-slate-400 block mb-1">
                    當前時薪
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-black text-stone-900 dark:text-slate-100">
                    {isUnderOneHour ? '-- / h' : currentHourlyRateFormatted}
                  </div>
                </div>
                <div className="text-[11px] text-stone-500 dark:text-slate-400 mt-2 font-medium">
                  {isUnderOneHour ? (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      ⚠️ 已用工時不足 1 小時，暫無法統計
                    </span>
                  ) : (
                    <span>目前已用工時：{usedHours.toFixed(1)}h / 總預算 HK$ {totalBudget.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {/* Card 2: 若免費改稿 時薪變動 */}
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block mb-1">
                    若免費改稿
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                    {isUnderOneHour ? '-- / h' : newHourlyRateFormatted}
                  </div>
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-2">
                  {isUnderOneHour ? (
                    <span className="text-stone-500 dark:text-slate-400 font-normal">
                      累積工時達 1 小時後自動計算
                    </span>
                  ) : (
                    <span>⚠️ 時薪比原本拉低了 {percentageDropFormatted}（每小時少賺 {rateDropFormatted}）</span>
                  )}
                </div>
              </div>

              {/* Card 3: 建議追加報價金額 & 應對建議 */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    建議追加報價
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {isUnderOneHour ? '--' : formatCurrency(suggestedQuote)}
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold mt-2">
                  {isUnderOneHour ? (
                    <span className="text-stone-500 dark:text-slate-400 font-normal">
                      請直接按基本時薪自行估價
                    </span>
                  ) : (
                    <span>💡 建議追加報價 {formatCurrency(suggestedQuote)} 以維持目前 {formatHourlyRate(currentHourlyRate)} 的時薪水準</span>
                  )}
                </div>
              </div>
            </div>

            {/* Copy WhatsApp Quote button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                disabled={isUnderOneHour}
                onClick={handleCopyScopeCreepQuote}
                className={`px-5 py-3 rounded-2xl text-xs font-black flex items-center gap-2 transition-all ${
                  isUnderOneHour
                    ? 'bg-[#E5E7EB] dark:bg-slate-800 text-[#9CA3AF] dark:text-slate-500 cursor-not-allowed pointer-events-none shadow-none'
                    : 'bg-slate-900 hover:bg-slate-800 text-white cursor-pointer shadow-none hover:scale-102 active:scale-98'
                }`}
              >
                {copiedQuote ? (
                  <Check size={16} />
                ) : (
                  <Copy size={16} className={isUnderOneHour ? 'text-[#9CA3AF] dark:text-slate-500' : 'text-white'} />
                )}
                <span>
                  {isUnderOneHour
                    ? '複製追加報價 WhatsApp 文案 (工時不足 1h)'
                    : (copiedQuote ? '已複製廣東話報價文案' : '複製追加報價 WhatsApp 文案')}
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
