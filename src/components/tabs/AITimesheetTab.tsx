import React, { useState } from 'react';
import {
  Sparkles,
  Clock,
  Coffee,
  DollarSign,
  Send,
  Bot,
  User,
  AlertCircle,
  Copy,
  Check,
  RotateCcw,
  Lightbulb,
  AlertTriangle,
  TrendingDown,
  ChevronDown,
  ChevronUp,
  Plus,
} from 'lucide-react';
import { Project, TimeSession } from '../../types';
import { useTheme } from '../../ThemeContext';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
  parsedLog?: {
    projectId: string;
    projectName: string;
    clientName: string;
    taskDescription: string;
    workMinutes: number;
    breakMinutes: number;
    feeType: 'fixed' | 'hourly';
    aiSummary: string;
    tags: string[];
  };
}

interface AITimesheetTabProps {
  projects: Project[];
  sessions: TimeSession[];
  chatMessages: ChatMessage[];
  onSendMessage: (userMsg: ChatMessage) => void;
  onReceiveAssistantMessage: (botMsg: ChatMessage) => void;
  onSaveSession: (newSession: TimeSession) => void;
  onDeleteSession: (sessionId: string) => void;
  onNavigateTab?: (tabId: string) => void;
  onOpenClearAllModal: () => void;
  onOpenNewProjectModal?: () => void;
}

export const AITimesheetTab: React.FC<AITimesheetTabProps> = ({
  projects,
  sessions,
  chatMessages,
  onSendMessage,
  onReceiveAssistantMessage,
  onSaveSession,
  onNavigateTab,
  onOpenClearAllModal,
  onOpenNewProjectModal,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  // Input states
  const [inputText, setInputText] = useState('');
  const [copiedTodaySummary, setCopiedTodaySummary] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Scope Creep Simulator States (Default Collapsed as requested)
  const [isScopeCreepExpanded, setIsScopeCreepExpanded] = useState<boolean>(false);
  const [scopeCreepProjectId, setScopeCreepProjectId] = useState<string>(() => projects[0]?.id || '');
  const [scopeCreepHours, setScopeCreepHours] = useState<number>(1);
  const [copiedQuote, setCopiedQuote] = useState<boolean>(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Preset Cantonese / English sample logs for instant demo
  const samplePrompts = [
    '今日幫 Client 做咗 2 個鐘切版，中間飲咗杯咖啡休息咗 15 分鐘',
    '線上會議溝通需求 1 小時，改稿 45 分鐘',
    '後端 API 串接與測試 3 個鐘，中間暫停休息咗半個鐘',
  ];

  // Natural Language Cantonese & English parser heuristics
  const parseWorkInput = (text: string) => {
    let matchedProject = projects[0];
    for (const p of projects) {
      if (
        text.toLowerCase().includes(p.name.toLowerCase()) ||
        text.toLowerCase().includes(p.clientName.toLowerCase())
      ) {
        matchedProject = p;
        break;
      }
    }

    let workMinutes = 120; // Default 2 hours
    const hourRegex = /(\d+(\.\d+)?)\s*(個鐘|小時|hours|hrs|h)/i;
    const hourMatch = text.match(hourRegex);
    if (hourMatch) {
      workMinutes = Math.round(parseFloat(hourMatch[1]) * 60);
    } else {
      const minRegex = /(\d+)\s*(分鐘|mins|m)/i;
      const minMatch = text.match(minRegex);
      if (minMatch) {
        workMinutes = parseInt(minMatch[1], 10);
      }
    }

    let breakMinutes = 0;
    const breakRegex = /(休息|抖咗|break|coffee|咖啡)\s*(\d+)?\s*(分鐘|mins|m|半個鐘|半小時)?/i;
    const breakMatch = text.match(breakRegex);
    if (breakMatch) {
      if (text.includes('半個鐘') || text.includes('半小時')) {
        breakMinutes = 30;
      } else if (breakMatch[2]) {
        breakMinutes = parseInt(breakMatch[2], 10);
      } else {
        breakMinutes = 15;
      }
    }

    let taskDescription = text.trim();
    if (text.includes('切版')) taskDescription = '前端頁面切版與響應式排版優化';
    else if (text.includes('會議')) taskDescription = 'Client 需求討論與時程規劃線上會議';
    else if (text.includes('API')) taskDescription = '後端 API 串接、測試與資料校驗';
    else if (text.includes('改稿')) taskDescription = 'Client 第一階段修訂意見反饋調整';

    return {
      projectId: matchedProject ? matchedProject.id : 'proj-general',
      projectName: matchedProject ? matchedProject.name : '一般工作任務',
      clientName: matchedProject ? matchedProject.clientName : '內部/專屬 Client',
      taskDescription,
      workMinutes,
      breakMinutes,
      feeType: (matchedProject ? matchedProject.feeType : 'fixed') as 'fixed' | 'hourly',
      aiSummary: `已自動識別投入 ${Math.floor(workMinutes / 60)}h ${workMinutes % 60}m 實質工時，已記錄 ${breakMinutes} 分鐘休息時間。`,
      tags: ['AI自動記錄', matchedProject?.feeType === 'fixed' ? '一口價' : 'Hourly'],
    };
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: inputText,
      time: timeStr,
    };
    onSendMessage(userMsg);

    const parsed = parseWorkInput(inputText);
    setInputText('');

    setTimeout(() => {
      const botMsg: ChatMessage = {
        id: `msg-bot-${Date.now()}`,
        sender: 'assistant',
        text: `收到！我已幫你智能解析出此段工時細節：`,
        time: timeStr,
        parsedLog: parsed,
      };
      onReceiveAssistantMessage(botMsg);
    }, 450);
  };

  const handleConfirmAddSession = (log: NonNullable<ChatMessage['parsedLog']>) => {
    const targetProject = projects.find((p) => p.id === log.projectId) || projects[0];
    const isFixed = targetProject?.feeType === 'fixed';

    const effectiveRate = targetProject
      ? isFixed
        ? (targetProject.totalWorkedHours || 0) + log.workMinutes / 60 > 0
          ? Math.round(targetProject.totalContractAmount / ((targetProject.totalWorkedHours || 0) + log.workMinutes / 60))
          : targetProject.targetHourlyRate
        : targetProject.targetHourlyRate
      : 550;

    const earned = Math.round((log.workMinutes / 60) * effectiveRate);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    const newSession: TimeSession = {
      id: `sess-${Date.now()}`,
      projectId: targetProject ? targetProject.id : 'proj-custom',
      projectName: log.projectName,
      clientName: log.clientName,
      taskDescription: log.taskDescription,
      date: todayStr,
      startTime: '10:00',
      endTime: '12:00',
      workDurationMinutes: log.workMinutes,
      breakDurationMinutes: log.breakMinutes,
      effectiveHourlyRate: effectiveRate,
      earnedAmount: earned,
      status: 'completed',
      tags: log.tags,
    };

    onSaveSession(newSession);
    showToast(`✅ 已將「${log.taskDescription}」存入 Timesheet 紀錄！`);
  };

  // Copy today summary text
  const handleCopyTodaySummary = () => {
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter((s) => s.date === today);
    const todayMins = todaySessions.reduce((acc, s) => acc + s.workDurationMinutes, 0);
    const todayBreakMins = todaySessions.reduce((acc, s) => acc + s.breakDurationMinutes, 0);
    const todayEarned = todaySessions.reduce((acc, s) => acc + s.earnedAmount, 0);

    const text = `📋 【Freelancer 今日工時與收益摘要 (${today})】\n⏱ 淨專注工時：${Math.floor(todayMins / 60)}h ${todayMins % 60}m\n☕️ 休息時間：${todayBreakMins} 分鐘\n💰 今日累計產值：約 HK$ ${todayEarned.toLocaleString()}\n📝 完成任務項目：\n${
      todaySessions.length > 0
        ? todaySessions.map((s, i) => `${i + 1}. [${s.projectName}] ${s.taskDescription} (${Math.floor(s.workDurationMinutes / 60)}h ${s.workDurationMinutes % 60}m)`).join('\n')
        : '（今日尚無已結算紀錄）'
    }`;

    navigator.clipboard.writeText(text);
    setCopiedTodaySummary(true);
    showToast('📋 已複製今日工時與收益摘要至剪貼簿！');
    setTimeout(() => setCopiedTodaySummary(false), 3000);
  };

  // Scope Creep Calculations (for bottom card)
  const creepProject = projects.find((p) => p.id === scopeCreepProjectId) || projects[0];
  const targetHourlyRate = creepProject ? creepProject.targetHourlyRate : 600;
  const contractAmount = creepProject ? creepProject.totalContractAmount : 30000;
  const currentWorkedHours = creepProject ? creepProject.totalWorkedHours : 0;
  const safeRate = Math.max(1, targetHourlyRate);
  const recommendedMaxHours = Math.round((contractAmount / safeRate) * 10) / 10;

  const totalHoursWithCreep = (currentWorkedHours || recommendedMaxHours * 0.5) + scopeCreepHours;
  const dilutedRate = Math.round(contractAmount / Math.max(0.1, totalHoursWithCreep));
  const rateDilutionPercent =
    targetHourlyRate > 0
      ? Math.max(0, Math.round(((targetHourlyRate - dilutedRate) / targetHourlyRate) * 100))
      : 0;
  const recommendedAddOnFee = Math.round(scopeCreepHours * targetHourlyRate);

  const handleCopyScopeCreepQuote = () => {
    const projectName = creepProject ? creepProject.name : 'Project';
    const text = `Hi ${creepProject?.clientName || 'Client'}，\n\n關於「${projectName}」最新提出的追加/調整需求，我已評估所需開發與設計工時約為 ${scopeCreepHours} 小時。\n\n依照我們約定之一口價基準（目標時薪 HK$ ${targetHourlyRate}/hr），此部分追加調整報價為：\n👉 追加預算：HK$ ${recommendedAddOnFee.toLocaleString()} (含 ${scopeCreepHours} 小時工時)\n\n確認後我將立即排入時程推進，謝謝！`;

    navigator.clipboard.writeText(text);
    setCopiedQuote(true);
    showToast('💬 已複製改稿追加報價文案至剪貼簿！');
    setTimeout(() => setCopiedQuote(false), 3000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 right-6 z-50 px-4 py-3 rounded-2xl bg-stone-900 text-white dark:bg-emerald-600 shadow-2xl text-xs font-bold animate-bounce flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-black text-stone-900 dark:text-slate-100 flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <Sparkles size={18} />
            </span>
            <span>AI 助手與追加報價 (AI Assistant & Scope Creep)</span>
          </h2>
          <p className="text-xs text-stone-500 dark:text-slate-400 mt-1">
            自然語言對話自動解析工時、產生每日摘要，並提供 Client 改稿追加報價防護！
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleCopyTodaySummary}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs ${
              copiedTodaySummary
                ? 'bg-emerald-600 text-white border-emerald-600'
                : isWarm
                ? 'border-stone-300 hover:bg-stone-100 text-stone-800 bg-white'
                : 'border-slate-700 hover:bg-slate-800 text-slate-200 bg-slate-900'
            }`}
          >
            {copiedTodaySummary ? <Check size={14} /> : <Copy size={14} />}
            <span>{copiedTodaySummary ? '已複製今日摘要' : '📋 複製今日摘要'}</span>
          </button>

          <button
            onClick={onOpenClearAllModal}
            className="px-3.5 py-2 rounded-xl text-xs font-bold border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1 cursor-pointer"
            title="清空歷史紀錄與重設"
          >
            <RotateCcw size={13} />
            <span>重設數據</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. AI 智能對話與快速 LOG 工時 (MAIN ASSISTANT SECTION) */}
      {/* ============================================================ */}
      <div
        className={`rounded-3xl p-6 sm:p-7 border transition-all ${
          isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bot size={20} className="text-emerald-600" />
            <h3 className="font-extrabold text-base text-stone-900 dark:text-slate-100">
              AI 自然語言工時速記助手
            </h3>
          </div>
          <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-bold border border-emerald-200 dark:border-emerald-800">
            廣東話 / 英文雙語支援
          </span>
        </div>

        {/* Quick Sample Prompts */}
        <div className="my-3 space-y-1.5">
          <span className="text-[11px] font-semibold text-stone-400 flex items-center gap-1">
            <Lightbulb size={12} /> 點擊快捷填入示範對話：
          </span>
          <div className="flex flex-wrap gap-1.5">
            {samplePrompts.map((p, idx) => (
              <button
                key={idx}
                onClick={() => setInputText(p)}
                className={`text-xs px-2.5 py-1 rounded-xl border text-left transition-colors cursor-pointer ${
                  isWarm
                    ? 'border-stone-200 hover:bg-stone-50 text-stone-600'
                    : 'border-slate-800 hover:bg-slate-800 text-slate-300'
                }`}
              >
                "{p}"
              </button>
            ))}
          </div>
        </div>

        {/* Chat History Container */}
        <div
          className={`h-72 sm:h-80 overflow-y-auto p-4 rounded-2xl border space-y-4 ${
            isWarm ? 'bg-stone-50/70 border-stone-200' : 'bg-slate-950 border-slate-800'
          }`}
        >
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'assistant' && (
                <div className="p-2 rounded-2xl bg-emerald-600 text-white shrink-0 self-start shadow-xs">
                  <Bot size={16} />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs sm:text-sm ${
                  msg.sender === 'user'
                    ? 'bg-stone-900 text-white dark:bg-emerald-600'
                    : isWarm
                    ? 'bg-white border border-stone-200 text-stone-800 shadow-xs'
                    : 'bg-slate-900 border border-slate-800 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between gap-4 mb-1">
                  <span className="font-bold text-[11px] opacity-75">
                    {msg.sender === 'user' ? '你' : 'AI 助手'}
                  </span>
                  <span className="text-[10px] opacity-60 font-mono">{msg.time}</span>
                </div>

                <p className="whitespace-pre-wrap">{msg.text}</p>

                {/* Parsed Result Card inside Assistant Message */}
                {msg.parsedLog && (
                  <div className="mt-3 p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                    <div className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <Sparkles size={14} />
                      <span>{msg.parsedLog.aiSummary}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-stone-100 dark:border-slate-800">
                      <div>
                        <span className="text-stone-400">對應 Project: </span>
                        <strong className="text-stone-800 dark:text-slate-200">
                          {msg.parsedLog.projectName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-400">對應 Client: </span>
                        <strong className="text-stone-800 dark:text-slate-200">
                          {msg.parsedLog.clientName}
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-400">專注工時: </span>
                        <strong className="font-mono text-emerald-600">
                          {Math.floor(msg.parsedLog.workMinutes / 60)}h{' '}
                          {msg.parsedLog.workMinutes % 60}m
                        </strong>
                      </div>
                      <div>
                        <span className="text-stone-400">休息時間: </span>
                        <strong className="font-mono text-amber-600">
                          {msg.parsedLog.breakMinutes} 分鐘
                        </strong>
                      </div>
                    </div>

                    <div className="pt-2 flex items-center justify-end">
                      <button
                        onClick={() => handleConfirmAddSession(msg.parsedLog!)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                      >
                        <Check size={14} />
                        <span>確認寫入 Timesheet 紀錄</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {msg.sender === 'user' && (
                <div className="p-2 rounded-2xl bg-stone-700 dark:bg-slate-800 text-white shrink-0 self-start shadow-xs">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <div className="relative mt-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            placeholder="用廣東話/英文輸入，例如：「今日切版 2 個鐘，中間休息咗 15 分鐘」..."
            className={`w-full pl-4 pr-24 py-3.5 text-xs sm:text-sm rounded-2xl border outline-none transition-colors ${
              isWarm
                ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
            }`}
          />
          <button
            onClick={handleSend}
            disabled={!inputText.trim()}
            className={`absolute right-2 top-2 bottom-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
              inputText.trim()
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                : 'bg-stone-200 text-stone-400 dark:bg-slate-800 dark:text-slate-600 cursor-not-allowed'
            }`}
          >
            <Send size={14} />
            <span>記錄</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. COLLAPSIBLE SECTION: Client 改稿要求 (Scope Creep 防護算盤) */}
      {/* ============================================================ */}
      <div
        className={`rounded-3xl border transition-all overflow-hidden ${
          isWarm ? 'bg-white border-stone-200 shadow-sm' : 'bg-slate-900 border-slate-800'
        }`}
      >
        {/* Toggle Button / Header Banner */}
        <button
          onClick={() => setIsScopeCreepExpanded((prev) => !prev)}
          className={`w-full p-5 sm:p-6 text-left flex items-center justify-between transition-colors cursor-pointer ${
            isScopeCreepExpanded
              ? 'border-b border-stone-100 dark:border-slate-800 bg-amber-50/30 dark:bg-amber-950/10'
              : 'hover:bg-stone-50 dark:hover:bg-slate-850'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500 text-white shadow-sm">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm sm:text-base text-stone-900 dark:text-slate-100">
                  Client 改稿要求 (Scope Creep 防護算盤)
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {isScopeCreepExpanded ? '展開計算中' : '點此展開'}
                </span>
              </div>
              <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                {isScopeCreepExpanded
                  ? '拉動工時滑桿，即時計算時薪稀釋程度並一鍵產生專業報價文案'
                  : '⚡ Client 臨時要求改稿？點此計算追加報價與時薪稀釋防護'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-stone-500">
            {isScopeCreepExpanded ? (
              <ChevronUp size={20} className="text-amber-600" />
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-xs transition-colors">
                <Plus size={14} />
                <span>計算追加報價</span>
              </div>
            )}
          </div>
        </button>

        {/* Expanded Content */}
        {isScopeCreepExpanded && (
          <div className="p-6 sm:p-8 space-y-6">
            {/* Target Project Selection */}
            {projects.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-stone-500 dark:text-slate-400">
                    對照 Project:
                  </span>
                  <select
                    value={scopeCreepProjectId}
                    onChange={(e) => setScopeCreepProjectId(e.target.value)}
                    className={`text-xs font-bold rounded-xl px-3 py-1.5 border outline-none cursor-pointer ${
                      isWarm
                        ? 'bg-stone-50 border-stone-300 text-stone-800'
                        : 'bg-slate-950 border-slate-700 text-slate-200'
                    }`}
                  >
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.clientName}) - 目標 ${p.targetHourlyRate}/h
                      </option>
                    ))}
                  </select>
                </div>

                <span className="text-xs text-stone-400 font-mono">
                  合約額: HK$ {contractAmount.toLocaleString()} · 目標時薪: HK$ {targetHourlyRate}/h
                </span>
              </div>
            )}

            {/* Scope Creep Interactive Slider */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-stone-700 dark:text-slate-300">
                  估計 Client 改稿所需額外工時：
                </label>
                <span className="font-mono text-xl font-black text-amber-600 dark:text-amber-400">
                  +{scopeCreepHours} 小時
                </span>
              </div>

              <input
                type="range"
                min="1"
                max="40"
                step="1"
                value={scopeCreepHours}
                onChange={(e) => setScopeCreepHours(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />

              <div className="flex justify-between text-[11px] font-mono text-stone-400">
                <span>+1 小時 (小修小補)</span>
                <span>+10 小時 (大幅度調整)</span>
                <span>+20 小時</span>
                <span>+40 小時 (架構重寫)</span>
              </div>
            </div>

            {/* Live Dilution & Add-on Quotation Output Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-4">
              <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900">
                <span className="text-[11px] font-semibold text-rose-800 dark:text-rose-300 block mb-0.5">
                  若無償改稿（實質時薪稀釋）
                </span>
                <div className="font-mono text-xl font-black text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <TrendingDown size={18} />
                  <span>HK$ {dilutedRate}/h</span>
                </div>
                <span className="text-[10px] text-rose-500/80">
                  時薪被稀釋 -{rateDilutionPercent}%（原目標 ${targetHourlyRate}/h）
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900">
                <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 block mb-0.5">
                  建議向 Client 追加報價
                </span>
                <div className="font-mono text-xl font-black text-emerald-700 dark:text-emerald-400">
                  +HK$ {recommendedAddOnFee.toLocaleString()}
                </div>
                <span className="text-[10px] text-emerald-600/80">
                  以約定時薪 ${targetHourlyRate}/h × {scopeCreepHours}h 精確計費
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 flex flex-col justify-between">
                <span className="text-[11px] font-semibold text-stone-500 dark:text-slate-400 block mb-1">
                  一鍵複製報價文案
                </span>
                <button
                  onClick={handleCopyScopeCreepQuote}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                    copiedQuote
                      ? 'bg-emerald-600 text-white'
                      : 'bg-stone-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:opacity-90'
                  }`}
                >
                  {copiedQuote ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedQuote ? '已複製 WhatsApp 文案' : '複製追加報價文案'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
