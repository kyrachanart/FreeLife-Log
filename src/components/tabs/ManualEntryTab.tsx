import React, { useState, useEffect, useMemo } from 'react';
import {
  Edit3,
  Clock,
  CheckCircle2,
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
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  // --- Tabbed Entry Mode: 'quick' | 'detailed' ---
  const [entryMode, setEntryMode] = useState<'quick' | 'detailed'>('quick');

  // --- Profession / Role Recommendation State ---
  const [currentProfession, setCurrentProfession] = useState<string>('');

  // --- Form States for Manual Entry ---
  const selectedProjectId = useMemo(() => {
    if (activeProjectId && projects.some((p) => p.id === activeProjectId)) {
      return activeProjectId;
    }
    return projects[0]?.id || '';
  }, [activeProjectId, projects]);

  const handleSelectProject = (id: string) => {
    if (setActiveProjectId) {
      setActiveProjectId(id);
    }
  };

  const [workDate, setWorkDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  
  // 24-hour Time Interval States (unprefilled by default)
  const [startTime, setStartTime] = useState<string>('');
  const [endTime, setEndTime] = useState<string>('');

  // Work & Break Durations (unprefilled by default, break default 0)
  const [workHours, setWorkHours] = useState<number | ''>('');
  const [workMinutes, setWorkMinutes] = useState<number | ''>('');
  const [breakMinutes, setBreakMinutes] = useState<number | ''>(0);
  
  // Optional Memo (initialized empty)
  const [taskNote, setTaskNote] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scope Creep Simulator States (Default Collapsed)
  const [isScopeCreepExpanded, setIsScopeCreepExpanded] = useState<boolean>(false);
  const [scopeCreepProjectId, setScopeCreepProjectId] = useState<string>(() => projects[0]?.id || '');
  const [scopeCreepHours, setScopeCreepHours] = useState<number>(6);
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

  const showToast = (msg: string) => {
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
    const endNow = new Date(now.getTime() + addedMins * 60000);
    const endTimeStr = `${endNow.getHours().toString().padStart(2, '0')}:${endNow.getMinutes().toString().padStart(2, '0')}`;

    const finalDesc = taskNote.trim() || `快捷加時 (${label})`;

    const newSession: TimeSession = {
      id: `sess-${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      clientName: currentProject.clientName,
      taskDescription: finalDesc,
      date: workDate || new Date().toISOString().split('T')[0],
      startTime: startTimeStr,
      endTime: endTimeStr,
      workDurationMinutes: addedMins,
      breakDurationMinutes: 0,
      effectiveHourlyRate: targetHourlyRate,
      earnedAmount,
      status: 'completed',
      tags: [isFixed ? '合約總額' : 'Hourly'].filter(Boolean),
    };

    onSaveSession(newSession);
    setTaskNote('');
    showToast(`⚡ 成功快捷追加 ${label} (${addedMins} 分鐘) 工時至「${currentProject.name}」！`);
  };

  // Submit manual entry (Default to '專注工作' if blank)
  const handleSubmitManualEntry = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentProject) {
      showToast('⚠️ 請先選擇或建立 Project！');
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

    const startStr = startTime.trim();
    const endStr = endTime.trim();

    const newSession: TimeSession = {
      id: `sess-${Date.now()}`,
      projectId: currentProject.id,
      projectName: currentProject.name,
      clientName: currentProject.clientName,
      taskDescription: finalDescription,
      date: workDate || new Date().toISOString().split('T')[0],
      startTime: startStr || '--:--',
      endTime: endStr || (startStr ? calcEndTimeStr(startStr, totalWorkMins + b) : '--:--'),
      workDurationMinutes: totalWorkMins,
      breakDurationMinutes: b,
      effectiveHourlyRate: targetHourlyRate,
      earnedAmount,
      status: 'completed',
      tags: [isFixed ? '合約總額' : 'Hourly'].filter(Boolean),
    };

    onSaveSession(newSession);
    
    // Clear note after submit
    setTaskNote('');
    showToast(`✅ 成功補記 ${totalWorkMins} 分鐘工時至「${currentProject.name}」！`);
  };

  // Scope Creep calculations (Dynamic Effective Rate)
  const targetScopeProject = projects.find((p) => p.id === scopeCreepProjectId) || currentProject || projects[0];
  const scopeContractAmount = targetScopeProject?.totalContractAmount || 0;
  const scopeEstimatedHours = targetScopeProject?.estimatedHours && targetScopeProject.estimatedHours > 0
    ? targetScopeProject.estimatedHours
    : 35;

  // Calculate current logged minutes & hours for this target project
  const scopeProjectSessions = useMemo(() => {
    return sessions.filter((s) => s.projectId === targetScopeProject?.id);
  }, [sessions, targetScopeProject?.id]);

  const scopeCurrentWorkedMinutes = scopeProjectSessions.reduce((sum, s) => sum + s.workDurationMinutes, 0);
  const scopeCurrentWorkedHours = scopeCurrentWorkedMinutes / 60;

  // Current dynamic effective hourly rate:
  const currentEffectiveRate = scopeCurrentWorkedMinutes > 0
    ? scopeContractAmount / scopeCurrentWorkedHours
    : (scopeEstimatedHours > 0 ? scopeContractAmount / scopeEstimatedHours : 0);

  const currentEffectiveRateFormatted = currentEffectiveRate > 0
    ? `HK$ ${currentEffectiveRate.toFixed(1)} / h`
    : 'HK$ -- / h';

  // Dilution calculation if revisions are done for free:
  // Formula: 專案總金額 ÷ (當前總工時 + 追加工時)
  const baseHoursForDilution = scopeCurrentWorkedMinutes > 0 ? scopeCurrentWorkedHours : scopeEstimatedHours;
  const newTotalHours = baseHoursForDilution + scopeCreepHours;
  const dilutedRate = newTotalHours > 0 ? Math.round(scopeContractAmount / newTotalHours) : 0;
  const hourlyLoss = Math.max(0, Math.round(currentEffectiveRate - dilutedRate));
  const rateDilutionPercent = currentEffectiveRate > 0
    ? Math.max(1, Math.round(((currentEffectiveRate - dilutedRate) / currentEffectiveRate) * 100))
    : 0;

  // Recommended Add-on Fee (to maintain current effective hourly rate):
  const baseRateForAddon = currentEffectiveRate > 0 ? currentEffectiveRate : Math.round(scopeContractAmount / scopeEstimatedHours);
  const recommendedAddOnFee = Math.round(baseRateForAddon * scopeCreepHours);

  const handleCopyScopeCreepQuote = () => {
    const clientName = targetScopeProject?.clientName || 'Client';
    const projName = targetScopeProject?.name || 'Project';
    const text = `Hi ${clientName}，收到你關於「${projName}」嘅改稿需求！因為今次修改範圍超出咗原定合約內容，估計需要額外加多 ${scopeCreepHours} 小時處理。為維持項目進度與品質，呢部分會追加報價 HK$ ${recommendedAddOnFee.toLocaleString()}。如果冇問題我哋就安排開工，辛苦晒！`;
    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    showToast('💬 已複製廣東話追加報價 WhatsApp 文案！');
    setTimeout(() => setCopiedQuote(false), 2500);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-24 right-6 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 border border-emerald-400">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dynamic Sticky Active Timer Banner */}
      {timerStatus?.isRunning && (
        <div className="rounded-2xl p-4 bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-black text-emerald-950 dark:text-emerald-200">
              ⏱️ 正在為「{timerStatus.projectName || '當前專案'}」計時中
            </span>
          </div>
          {onNavigateTab && (
            <button
              type="button"
              onClick={() => {
                if (setActiveProjectId && timerStatus.projectId) {
                  setActiveProjectId(timerStatus.projectId);
                }
                onNavigateTab('timer');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black transition-all cursor-pointer shadow-xs self-end sm:self-auto shrink-0 flex items-center gap-1"
            >
              回到計時專案 ➔
            </button>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 1. MANUAL ENTRY FORM */}
      {/* ============================================================ */}
      {(() => {
        const clientColor = currentProject
          ? getClientColor(currentProject.clientName, currentProject.clientColor || currentProject.color)
          : '#2563EB';

        return (
          <div
            className={`rounded-3xl p-6 sm:p-8 border transition-all ${
              isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
            }`}
            style={{
              borderLeftWidth: '4px',
              borderLeftColor: clientColor,
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
                    手動補記工時 (Manual Entry)
                  </h2>
                  <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                    忘記開計時器？在此手動輸入，即時寫入全域 Timesheet 並同步更新總工時與預算進度
                  </p>
                </div>
              </div>

              {onNavigateTab && (
                <button
                  onClick={() => onNavigateTab('calculator')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                    isWarm
                      ? 'border-stone-300 hover:bg-stone-100 text-stone-700'
                      : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  前往 Project 總覽 →
                </button>
              )}
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
                <span>一鍵快捷加時 (Quick Time Log)</span>
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
                <span>詳細紀錄 (Detailed Entry)</span>
              </button>
            </div>

            {/* MODE 1: QUICK TIME LOG */}
            {entryMode === 'quick' ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* 1. 選擇 Project */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                      1. 選擇追加工時的 Project <span className="text-rose-500">*</span>
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

                  {/* 2. 工作備註 */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                      2. 工作備註 (選填)
                    </label>
                    <input
                      type="text"
                      placeholder="例：Client 追稿修圖、臨時開會、細節維護..."
                      value={taskNote}
                      onChange={(e) => setTaskNote(e.target.value)}
                      className={`w-full text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none transition-colors ${
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
                    1. 選擇 Client & Project <span className="text-rose-500">*</span>
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

            {/* 2. 工作日期 (預設今日) * */}
            <div>
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                2. 工作日期 (預設今日) <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={workDate}
                onChange={(e) => setWorkDate(e.target.value)}
                className={`w-full text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none transition-colors ${
                  isWarm
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                    : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                }`}
                required
              />
            </div>
          </div>

          {/* Row 2: Field 3 (補記實際時間) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                3. 補記實際時間
              </label>
              <span className="text-[11px] text-stone-400">
                可留空，直接於下方填寫工時
              </span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-stone-500 dark:text-slate-400 block mb-1">
                  開始時間 (Start Time)
                </span>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => handleStartTimeChange(e.target.value)}
                  className={`w-full text-xs sm:text-sm font-mono font-bold rounded-xl px-3.5 py-2.5 border outline-none text-center ${
                    isWarm
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div>
                <span className="text-[11px] text-stone-500 dark:text-slate-400 block mb-1">
                  結束時間 (End Time)
                </span>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => handleEndTimeChange(e.target.value)}
                  className={`w-full text-xs sm:text-sm font-mono font-bold rounded-xl px-3.5 py-2.5 border outline-none text-center ${
                    isWarm
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>
            <p className="text-[11px] text-stone-400 mt-1">
              {startTime && endTime
                ? `區間：${startTime} 至 ${endTime}（已自動計算下方工時長度）`
                : '無需精確時段時可留空，直接在下方輸入投入小時與分鐘'}
            </p>
          </div>

          {/* Row 3: Field 4 (投入實質工時 *) & Field 5 (舒緩休息時間) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* 4. 投入實質工時 (計費) * */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                4. 投入實質工時 (計費) <span className="text-rose-500">*</span>
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
                    className={`w-full text-xs sm:text-sm font-black font-mono rounded-xl px-3.5 py-2.5 border outline-none text-center ${
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
                    className={`w-full text-xs sm:text-sm font-black font-mono rounded-xl px-3.5 py-2.5 border outline-none text-center ${
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
                  className={`w-full text-xs sm:text-sm font-black font-mono rounded-xl px-3.5 py-2.5 border outline-none text-center ${
                    isWarm
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
                <span className="absolute right-3 top-2.5 text-xs text-stone-400 pointer-events-none">分鐘 (m)</span>
              </div>
            </div>
          </div>

          {/* Row 4: Field 6 (工作內容) + 智能推薦快捷詞助手 */}
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

            {/* SMART ROLE RECOMMENDATION SECTION (Positioned directly under Field 6 as a quick-fill assistant) */}
            <div className="p-4 rounded-2xl bg-stone-50/90 dark:bg-slate-950/70 border border-stone-200/90 dark:border-slate-800 space-y-3.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <Sparkles size={15} />
                  </div>
                  <span className="text-xs font-black text-stone-900 dark:text-slate-100">
                    自由輸入職業 + 智能推薦快捷詞 (Smart Role Recommendation)
                  </span>
                </div>
                <span className="text-[10px] text-stone-400">點擊下方快捷詞直接帶入工作 Memo</span>
              </div>

              {/* Profession Input & Quick Preset Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-600 dark:text-slate-400 whitespace-nowrap">
                    當前職業：
                  </span>
                  <div className="relative flex-1 flex items-center">
                    <input
                      type="text"
                      value={currentProfession}
                      onChange={(e) => setCurrentProfession(e.target.value)}
                      placeholder="輸入職業名稱...（例：插畫、設計師、剪輯、教練、翻譯...）"
                      className={`w-full text-xs font-bold rounded-xl pl-3 pr-8 py-1.5 border outline-none transition-all ${
                        isWarm
                          ? 'bg-white border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
                          : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                      }`}
                    />
                    {currentProfession && (
                      <button
                        type="button"
                        onClick={() => setCurrentProfession('')}
                        className="absolute right-2 p-0.5 rounded text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors cursor-pointer"
                        title="清空職業輸入"
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Quick Category Tags */}
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] text-stone-400 mr-0.5">快捷切換：</span>
                  {presetProfessions.map((prof, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentProfession(prof)}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                        currentProfession === prof
                          ? 'bg-emerald-600 text-white border-emerald-600 font-bold shadow-xs'
                          : isWarm
                          ? 'bg-white border-stone-200 text-stone-700 hover:bg-stone-100'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {prof}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dynamic Concise Keywords Grid */}
              <div className="pt-2 border-t border-stone-200/70 dark:border-slate-800/70">
                <span className="text-[11px] font-bold text-stone-500 dark:text-slate-400 block mb-2">
                  ⚡ 常用工作核心關鍵字（點擊直接帶入 Memo）：
                </span>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {dynamicKeywords.map((kw, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleApplyKeyword(kw)}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 hover:scale-102 active:scale-98 ${
                        taskNote === kw
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : isWarm
                          ? 'bg-white border-stone-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-stone-800'
                          : 'bg-slate-900 border-slate-800 hover:border-emerald-500 hover:bg-emerald-950/40 text-slate-200'
                      }`}
                    >
                      <span>{kw}</span>
                    </button>
                  ))}
                </div>
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
        );
      })()}

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
          className={`w-full p-5 sm:p-6 flex items-center justify-between text-left transition-colors cursor-pointer ${
            isWarm ? 'hover:bg-stone-50/80' : 'hover:bg-slate-800/50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-sm">
              <Clock size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base text-stone-900 dark:text-slate-100">
                  Client 臨時追加改稿點算？ (Scope Creep Protection)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  改稿報價神器
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                即時計算免費改稿會令你每小時實質少賺幾多，並一鍵生成 WhatsApp 內容追加報價，企硬唔白做。
              </p>
            </div>
          </div>

          <div className="p-2 rounded-xl border border-stone-200 dark:border-slate-700 text-stone-500">
            {isScopeCreepExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </button>

        {isScopeCreepExpanded && (
          <div className="p-6 sm:p-8 border-t border-stone-100 dark:border-slate-800 space-y-6 bg-stone-50/40 dark:bg-slate-950/30">
            {/* Scope Creep Project Selection & Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  選擇要評估的 Project：
                </label>
                <select
                  value={scopeCreepProjectId}
                  onChange={(e) => setScopeCreepProjectId(e.target.value)}
                  className={`w-full text-xs font-bold rounded-xl px-3 py-2.5 border outline-none cursor-pointer ${
                    isWarm
                      ? 'bg-white border-stone-300 text-stone-900'
                      : 'bg-slate-900 border-slate-700 text-slate-100'
                  }`}
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} [{p.clientName}] · HK$ {p.totalContractAmount.toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                    預計額外改稿 / 追加工時：
                  </label>
                  <span className="font-mono font-black text-sm text-amber-600">
                    +{scopeCreepHours} 小時
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="30"
                  step="1"
                  value={scopeCreepHours}
                  onChange={(e) => setScopeCreepHours(parseInt(e.target.value) || 1)}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Impact Metric Cards (Dynamic Effective Hourly Rate) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Card 1: 當前預算 & 即時時薪 */}
              <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-500 dark:text-slate-400 block mb-1">
                    當前預算 & 即時時薪
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-black text-stone-900 dark:text-slate-100">
                    {currentEffectiveRateFormatted}
                  </div>
                </div>
                <div className="text-[11px] text-stone-400 mt-2 font-medium">
                  已用工時：{scopeCurrentWorkedHours.toFixed(1)}h / 預估上限 {scopeEstimatedHours}h
                </div>
              </div>

              {/* Card 2: 若免費改稿 時薪變動 */}
              <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/25 border border-rose-200 dark:border-rose-900 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-800 dark:text-rose-300 block mb-1">
                    若免費改稿 時薪將跌至
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">
                    HK$ {dilutedRate} / h
                  </div>
                </div>
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold mt-2">
                  ⚠️ 時薪比原本拉低了 {rateDilutionPercent}% (每小時少賺 HK$ {hourlyLoss})
                </div>
              </div>

              {/* Card 3: 建議追加報價金額 & 應對建議 */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900 flex flex-col justify-between">
                <div>
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block mb-1">
                    建議追加報價金額
                  </span>
                  <div className="font-mono text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    HK$ {recommendedAddOnFee.toLocaleString()}
                  </div>
                </div>
                <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold mt-2">
                  💡 建議補收 HK$ {recommendedAddOnFee.toLocaleString()} 以維持目前 HK$ {Math.round(baseRateForAddon)}/h 的時薪水準
                </div>
              </div>
            </div>

            {/* Copy WhatsApp Quote button */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={handleCopyScopeCreepQuote}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-amber-600/25 hover:scale-102 active:scale-98"
              >
                {copiedQuote ? <Check size={16} /> : <Copy size={16} />}
                <span>{copiedQuote ? '已複製廣東話報價文案' : '複製追加報價 WhatsApp 文案'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
