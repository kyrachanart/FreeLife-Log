import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ArrowRight,
  ShieldAlert,
  Layers,
  Sparkles,
  Info,
  Play,
  Pause,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { Project, ProjectFeeType } from '../../types';
import { useTheme } from '../../ThemeContext';

export type CalculatorMode = 'fixed-dynamic' | 'hourly' | 'quote-target';

interface ProjectCalculatorScreenProps {
  projects: Project[];
  activeProjectId?: string;
  onUpdateProject?: (updatedProject: Project) => void;
  onNavigate?: (screenId: string) => void;
}

export const ProjectCalculatorScreen: React.FC<ProjectCalculatorScreenProps> = ({
  projects,
  activeProjectId = 'proj-1',
  onUpdateProject,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [selectedId, setSelectedId] = useState(activeProjectId);
  const currentProject = projects.find((p) => p.id === selectedId) || projects[0];

  // 3 Modes:
  // 1. 'fixed-dynamic': 一個 Job 已有總價錢，入工作時間後自動計時薪幾錢，隨住時間做得愈多自動即時 update
  // 2. 'hourly': Hourly 按時收費模式（按鐘實報實銷）
  // 3. 'quote-target': 想賺目標時薪，倒推計算應該報幾多一口價 Quotation
  const [activeMode, setActiveMode] = useState<CalculatorMode>('fixed-dynamic');

  // Parameters for Mode 1 (Fixed Price Job - Dynamic Hourly Rate)
  const [jobTotalAmount, setJobTotalAmount] = useState<number>(
    currentProject.totalContractAmount > 0 ? currentProject.totalContractAmount : 38000
  );
  const [jobWorkedHours, setJobWorkedHours] = useState<number>(
    currentProject.totalWorkedHours > 0 ? currentProject.totalWorkedHours : 42.5
  );
  const [targetFloorRate, setTargetFloorRate] = useState<number>(
    currentProject.targetHourlyRate > 0 ? currentProject.targetHourlyRate : 500
  );
  const [scopeChangeHours, setScopeChangeHours] = useState<number>(8); // Client 加改嘢時數

  // Live Auto-Ticker Simulation (模擬時間實時增加，時薪自動動態 update)
  const [isSimulatingLive, setIsSimulatingLive] = useState<boolean>(false);

  useEffect(() => {
    let timer: any;
    if (isSimulatingLive) {
      timer = setInterval(() => {
        setJobWorkedHours((prev) => {
          // 每次微增 0.1 小時 (6分鐘)，展現隨時間做得愈多，時薪自動即時 update
          return Math.round((prev + 0.1) * 10) / 10;
        });
      }, 800);
    }
    return () => clearInterval(timer);
  }, [isSimulatingLive]);

  // Parameters for Mode 2 (Hourly Billing)
  const [hourlyRateAgreed, setHourlyRateAgreed] = useState<number>(
    currentProject.targetHourlyRate || 650
  );
  const [hourlyHoursDone, setHourlyHoursDone] = useState<number>(
    currentProject.totalWorkedHours || 24
  );
  const [clientBudgetHours, setClientBudgetHours] = useState<number>(40);

  // Parameters for Mode 3 (Target Hourly Rate -> Quotation Generator)
  const [targetDesiredRate, setTargetDesiredRate] = useState<number>(650);
  const [estimatedJobHours, setEstimatedJobHours] = useState<number>(50);
  const [bufferPercent, setBufferPercent] = useState<number>(20); // 緩衝與風險加成 %

  // Calculations for Mode 1:
  // 隨住時間做得愈多，實質時薪即時動態 Update！
  const dynamicHourlyRate =
    jobWorkedHours > 0 ? Math.round(jobTotalAmount / jobWorkedHours) : targetFloorRate;
  const maxSafeHours =
    targetFloorRate > 0 ? Math.round((jobTotalAmount / targetFloorRate) * 10) / 10 : 0;
  const remainingHoursBeforeFloor = Math.round((maxSafeHours - jobWorkedHours) * 10) / 10;
  const isHealthy = dynamicHourlyRate >= targetFloorRate;
  const rateDiffPercent = Math.round(
    ((dynamicHourlyRate - targetFloorRate) / targetFloorRate) * 100
  );

  // Client 加改嘢後嘅新時薪
  const postScopeHours = Math.round((jobWorkedHours + scopeChangeHours) * 10) / 10;
  const postScopeRate = Math.round(jobTotalAmount / Math.max(1, postScopeHours));
  const suggestedScopeFee = Math.round(scopeChangeHours * targetFloorRate);

  // Calculations for Mode 2:
  const hourlyEarnedTotal = Math.round(hourlyHoursDone * hourlyRateAgreed);
  const hourlyBudgetTotal = Math.round(clientBudgetHours * hourlyRateAgreed);
  const remainingBudgetHours = Math.max(0, Math.round((clientBudgetHours - hourlyHoursDone) * 10) / 10);

  // Calculations for Mode 3:
  const baseQuote = Math.round(targetDesiredRate * estimatedJobHours);
  const bufferAmount = Math.round(baseQuote * (bufferPercent / 100));
  const recommendedQuote = baseQuote + bufferAmount;

  const handleSelectProject = (projId: string) => {
    const nextProj = projects.find((p) => p.id === projId);
    if (nextProj) {
      setSelectedId(nextProj.id);
      if (nextProj.feeType === 'fixed') {
        setActiveMode('fixed-dynamic');
        setJobTotalAmount(nextProj.totalContractAmount || 38000);
        setJobWorkedHours(nextProj.totalWorkedHours || 30);
        setTargetFloorRate(nextProj.targetHourlyRate || 500);
      } else {
        setActiveMode('hourly');
        setHourlyRateAgreed(nextProj.targetHourlyRate || 650);
        setHourlyHoursDone(nextProj.totalWorkedHours || 20);
      }
    }
  };

  const handleQuickAddHours = (hours: number) => {
    setJobWorkedHours((prev) => Math.max(1, Math.round((prev + hours) * 10) / 10));
  };

  return (
    <div
      className={`flex-1 flex flex-col p-4 overflow-y-auto scrollbar-none transition-colors duration-300 ${
        isWarm ? 'bg-[#FAF8F5] text-stone-800' : 'bg-slate-950 text-slate-100'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <span
            className={`text-[10px] font-bold tracking-wider uppercase ${
              isWarm ? 'text-emerald-700' : 'text-emerald-400'
            }`}
          >
            收費與時薪算盤
          </span>
          <h2 className={`text-base font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
            Job 總價・工時・實質時薪即時換算
          </h2>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
            isWarm
              ? 'bg-stone-100 border-stone-300 text-stone-600'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          即時動態 Update
        </span>
      </div>

      {/* Mode Selector Tabs (3 Modes) */}
      <div
        className={`p-1 rounded-2xl flex items-center mb-3 border ${
          isWarm ? 'bg-stone-200/70 border-stone-300/80' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <button
          onClick={() => setActiveMode('fixed-dynamic')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeMode === 'fixed-dynamic'
              ? isWarm
                ? 'bg-white text-stone-900 shadow-sm'
                : 'bg-emerald-600 text-white shadow-sm'
              : isWarm
              ? 'text-stone-600 hover:text-stone-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>📦 一口價計時薪</span>
        </button>

        <button
          onClick={() => setActiveMode('hourly')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeMode === 'hourly'
              ? isWarm
                ? 'bg-white text-stone-900 shadow-sm'
                : 'bg-emerald-600 text-white shadow-sm'
              : isWarm
              ? 'text-stone-600 hover:text-stone-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>⏱️ Hourly 計鐘</span>
        </button>

        <button
          onClick={() => setActiveMode('quote-target')}
          className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
            activeMode === 'quote-target'
              ? isWarm
                ? 'bg-white text-stone-900 shadow-sm'
                : 'bg-emerald-600 text-white shadow-sm'
              : isWarm
              ? 'text-stone-600 hover:text-stone-900'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>🎯 目標時薪報價</span>
        </button>
      </div>

      {/* PROJECT Selector */}
      <div className="mb-3.5">
        <label className={`block text-[11px] font-medium mb-1 ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
          選擇關聯 PROJECT：
        </label>
        <select
          value={selectedId}
          onChange={(e) => handleSelectProject(e.target.value)}
          className={`w-full text-xs font-semibold rounded-xl px-3 py-2 border outline-none transition-colors ${
            isWarm
              ? 'bg-white border-stone-300 text-stone-800 focus:ring-1 focus:ring-emerald-500 shadow-xs'
              : 'bg-slate-900 border-slate-800 text-slate-200 focus:ring-1 focus:ring-emerald-500'
          }`}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              PROJECT: {p.name} · {p.clientName} [{p.feeType === 'fixed' ? '一口價' : 'Hourly'}]
            </option>
          ))}
        </select>
      </div>

      {/* MODE 1: 一個 Job 已有總價錢，入工作時間後自動計時薪幾錢，隨住時間就得多就會自動 update */}
      {activeMode === 'fixed-dynamic' && (
        <div className="space-y-3.5">
          {/* Main Dynamic Rate Result Card */}
          <div
            className={`rounded-2xl p-4 border transition-all relative overflow-hidden ${
              isHealthy
                ? isWarm
                  ? 'bg-gradient-to-br from-emerald-50/90 to-stone-50 border-emerald-300 shadow-sm shadow-emerald-200/50'
                  : 'bg-gradient-to-br from-emerald-950/80 to-slate-900 border-emerald-700/60 shadow-lg'
                : isWarm
                ? 'bg-gradient-to-br from-rose-50/90 to-stone-50 border-rose-300 shadow-sm shadow-rose-200/50'
                : 'bg-gradient-to-br from-rose-950/80 to-slate-900 border-rose-700/60 shadow-lg'
            }`}
          >
            {/* Top Badge */}
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isWarm ? 'text-emerald-800' : 'text-emerald-400'}`}>
                  隨工時即時動態更新
                </span>
                <div className={`text-xs font-semibold ${isWarm ? 'text-stone-700' : 'text-slate-300'}`}>
                  一口價 Job 當前實質時薪 (Dynamic Rate)
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isHealthy
                    ? isWarm
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-900/60 text-emerald-300 border-emerald-600/40'
                    : isWarm
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-rose-900/60 text-rose-300 border-rose-600/40'
                }`}
              >
                {isHealthy ? `高過底線 +${rateDiffPercent}%` : `跌穿底線 ${rateDiffPercent}%`}
              </span>
            </div>

            {/* Big Rate Display */}
            <div className="flex items-baseline gap-2 my-1">
              <span
                className={`text-3xl font-mono font-extrabold tracking-tight transition-all duration-300 ${
                  isHealthy
                    ? isWarm
                      ? 'text-emerald-900'
                      : 'text-emerald-300'
                    : isWarm
                    ? 'text-rose-900'
                    : 'text-rose-300'
                }`}
              >
                ${dynamicHourlyRate.toLocaleString()}
              </span>
              <span className={`text-xs ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
                HKD / 小時
              </span>
            </div>

            <p className={`text-[11px] leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              總價 ${jobTotalAmount.toLocaleString()} ÷ 已投入 {jobWorkedHours} 小時。做得愈多時間，實質時薪自動向下 update。
            </p>

            {/* Real-time Ticker Simulation Tool */}
            <div
              className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
                isWarm ? 'border-stone-200/90' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isSimulatingLive ? 'bg-emerald-500 animate-ping' : 'bg-stone-400'}`} />
                <span className={`text-[11px] font-medium ${isWarm ? 'text-stone-600' : 'text-slate-300'}`}>
                  {isSimulatingLive ? '正在模擬時間流逝 (時薪即時跳動)...' : '模擬開工時間自動 Update'}
                </span>
              </div>
              <button
                onClick={() => setIsSimulatingLive(!isSimulatingLive)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold flex items-center gap-1 transition-all ${
                  isSimulatingLive
                    ? 'bg-amber-500 text-white shadow-xs'
                    : isWarm
                    ? 'bg-stone-200 hover:bg-stone-300 text-stone-800'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                {isSimulatingLive ? (
                  <>
                    <Pause size={12} />
                    <span>暫停模擬</span>
                  </>
                ) : (
                  <>
                    <Play size={12} />
                    <span>開始實時跳動</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Input Controls Card */}
          <div
            className={`rounded-2xl p-4 border transition-all space-y-3.5 ${
              isWarm
                ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/40'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`text-xs font-bold ${isWarm ? 'text-stone-800' : 'text-slate-200'}`}>
                Job 參數調整與工時累計
              </span>
              <button
                onClick={() => {
                  setJobWorkedHours(currentProject.totalWorkedHours || 40);
                  setIsSimulatingLive(false);
                }}
                className={`text-[10px] flex items-center gap-1 font-medium ${
                  isWarm ? 'text-stone-500 hover:text-stone-800' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <RotateCcw size={10} />
                <span>還原初始</span>
              </button>
            </div>

            {/* 1. Job 總價錢 */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={isWarm ? 'text-stone-600' : 'text-slate-300'}>
                  Job 一口價總合約金額 (HKD)
                </span>
                <span className={`font-mono font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
                  ${jobTotalAmount.toLocaleString()}
                </span>
              </div>
              <input
                type="number"
                step="1000"
                value={jobTotalAmount}
                onChange={(e) => setJobTotalAmount(Math.max(1000, Number(e.target.value)))}
                className={`w-full text-xs font-mono font-semibold rounded-xl px-3 py-1.5 border outline-none ${
                  isWarm
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:ring-1 focus:ring-emerald-500'
                    : 'bg-slate-800 border-slate-700 text-slate-100 focus:ring-1 focus:ring-emerald-500'
                }`}
              />
            </div>

            {/* 2. 已投入工作時間 (動態輸入與快速加鐘) */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={isWarm ? 'text-stone-600' : 'text-slate-300'}>
                  已投入工作時間 (小時)
                </span>
                <span className={`font-mono font-bold ${isWarm ? 'text-emerald-700' : 'text-emerald-400'}`}>
                  {jobWorkedHours} 小時
                </span>
              </div>

              {/* Slider for smooth dragging */}
              <input
                type="range"
                min="1"
                max="120"
                step="0.5"
                value={jobWorkedHours}
                onChange={(e) => setJobWorkedHours(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
              />

              {/* Quick Increment Buttons */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`text-[10px] ${isWarm ? 'text-stone-400' : 'text-slate-500'}`}>
                  快速加工時：
                </span>
                {[0.5, 1, 5, 10].map((delta) => (
                  <button
                    key={delta}
                    onClick={() => handleQuickAddHours(delta)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border transition-colors ${
                      isWarm
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    +{delta}h
                  </button>
                ))}
              </div>
            </div>

            {/* 3. 目標時薪底線 (守護利潤) */}
            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={isWarm ? 'text-stone-600' : 'text-slate-300'}>
                  個人目標時薪底線 (HKD/h)
                </span>
                <span className={`font-mono font-semibold ${isWarm ? 'text-stone-800' : 'text-slate-200'}`}>
                  ${targetFloorRate}/h
                </span>
              </div>
              <input
                type="range"
                min="300"
                max="1200"
                step="50"
                value={targetFloorRate}
                onChange={(e) => setTargetFloorRate(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
              />
            </div>
          </div>

          {/* 时薪安全防線指標卡 */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              isWarm
                ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/40'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className={`text-xs font-bold ${isWarm ? 'text-stone-800' : 'text-slate-200'}`}>
                時薪安全防線分析
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  remainingHoursBeforeFloor > 0
                    ? isWarm
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-emerald-950 text-emerald-400'
                    : isWarm
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-rose-950 text-rose-400'
                }`}
              >
                {remainingHoursBeforeFloor > 0
                  ? `尚餘 ${remainingHoursBeforeFloor} 小時安全工時`
                  : `已超時蝕本 ${Math.abs(remainingHoursBeforeFloor)} 小時`}
              </span>
            </div>

            {/* Progress bar */}
            <div className="space-y-1.5">
              <div className={`w-full rounded-full h-2.5 overflow-hidden ${isWarm ? 'bg-stone-200' : 'bg-slate-800'}`}>
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isHealthy ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  style={{
                    width: `${Math.min(100, (jobWorkedHours / Math.max(1, maxSafeHours)) * 100)}%`,
                  }}
                />
              </div>
              <div className={`flex justify-between text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
                <span>已用：{jobWorkedHours}h</span>
                <span>時薪不跌穿 ${targetFloorRate}/h 之最高工時上限：{maxSafeHours}h</span>
              </div>
            </div>
          </div>

          {/* Client 加改嘢 (Scope Creep) 時薪衝擊計算機 */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              isWarm
                ? 'bg-gradient-to-br from-amber-50/60 to-stone-50 border-amber-200'
                : 'bg-gradient-to-br from-amber-950/40 to-slate-900 border-amber-800/50'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-amber-800 dark:text-amber-300">
              <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400" />
              <span>Client 加改嘢 (Scope Creep) 時薪衝擊試算</span>
            </div>

            <p className={`text-[11px] mb-3 leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              如果 Client 要求加改額外時數，此處即時模擬實質時薪會跌到幾多，並自動計出「建議追加收費」：
            </p>

            <div className="grid grid-cols-2 gap-2.5 mb-3">
              <div
                className={`p-2.5 rounded-xl border ${
                  isWarm ? 'bg-white border-stone-200' : 'bg-slate-800/80 border-slate-700'
                }`}
              >
                <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
                  若加改時數
                </div>
                <div className="flex items-center gap-1 mt-0.5">
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={scopeChangeHours}
                    onChange={(e) => setScopeChangeHours(Math.max(1, Number(e.target.value)))}
                    className={`w-14 text-sm font-bold font-mono px-1.5 py-0.5 rounded border ${
                      isWarm ? 'bg-stone-50 border-stone-300 text-stone-900' : 'bg-slate-900 border-slate-700 text-white'
                    }`}
                  />
                  <span className="text-xs">小時</span>
                </div>
              </div>

              <div
                className={`p-2.5 rounded-xl border ${
                  isWarm ? 'bg-white border-stone-200' : 'bg-slate-800/80 border-slate-700'
                }`}
              >
                <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
                  改嘢後時薪將跌至
                </div>
                <div className="text-sm font-mono font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                  ${postScopeRate}
                  <span className="text-[10px] font-normal text-stone-500">/h</span>
                </div>
              </div>
            </div>

            {/* Suggested Add-on Fee Callout */}
            <div
              className={`p-2.5 rounded-xl flex items-center justify-between text-xs border ${
                isWarm
                  ? 'bg-amber-100/70 border-amber-300 text-amber-950'
                  : 'bg-amber-950/70 border-amber-700 text-amber-200'
              }`}
            >
              <div>
                <span className="font-bold">建議向 Client 提出追加報價：</span>
                <span className="block text-[10px] opacity-80">
                  按底線 ${targetFloorRate}/h × {scopeChangeHours} 小時
                </span>
              </div>
              <span className="text-sm font-mono font-extrabold">+${suggestedScopeFee.toLocaleString()}</span>
            </div>
          </div>

          {/* Hourly Rate Decay Schedule (工時增加對照表) */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              isWarm
                ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/40'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div className={`text-xs font-bold mb-2 ${isWarm ? 'text-stone-800' : 'text-slate-200'}`}>
              隨工時增加・實質時薪對照參考
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center">
              {[20, 40, 60, 80].map((hrs) => {
                const rate = Math.round(jobTotalAmount / hrs);
                const healthy = rate >= targetFloorRate;
                return (
                  <div
                    key={hrs}
                    className={`p-2 rounded-xl border ${
                      healthy
                        ? isWarm
                          ? 'bg-emerald-50/50 border-emerald-200'
                          : 'bg-emerald-950/40 border-emerald-800'
                        : isWarm
                        ? 'bg-rose-50/50 border-rose-200'
                        : 'bg-rose-950/40 border-rose-800'
                    }`}
                  >
                    <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
                      做滿 {hrs}h
                    </div>
                    <div
                      className={`text-xs font-mono font-bold mt-0.5 ${
                        healthy
                          ? isWarm
                            ? 'text-emerald-800'
                            : 'text-emerald-300'
                          : isWarm
                          ? 'text-rose-800'
                          : 'text-rose-300'
                      }`}
                    >
                      ${rate}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* MODE 2: HOURLY BILLING (按鐘實報實銷) */}
      {activeMode === 'hourly' && (
        <div className="space-y-3.5">
          {/* Main Hourly Earned Card */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              isWarm
                ? 'bg-gradient-to-br from-teal-50 to-stone-50 border-teal-300 shadow-sm'
                : 'bg-gradient-to-br from-teal-950/80 to-slate-900 border-teal-700/60 shadow-lg'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isWarm ? 'text-teal-800' : 'text-teal-400'}`}>
                  按時收費實報實銷
                </span>
                <div className={`text-xs font-semibold ${isWarm ? 'text-stone-700' : 'text-slate-300'}`}>
                  目前累計應收金額 (Earned Total)
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isWarm
                    ? 'bg-teal-100 text-teal-800 border-teal-300'
                    : 'bg-teal-900/60 text-teal-300 border-teal-600/40'
                }`}
              >
                約定時薪 ${hourlyRateAgreed}/h
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-1.5">
              <span className={`text-3xl font-mono font-bold ${isWarm ? 'text-stone-900' : 'text-slate-50'}`}>
                ${hourlyEarnedTotal.toLocaleString()}
              </span>
              <span className={`text-xs ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>HKD</span>
            </div>

            <p className={`text-[11px] ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              已實質完成 {hourlyHoursDone} 小時，無須承擔一口價修改超時風險。
            </p>
          </div>

          {/* Hourly Inputs Card */}
          <div
            className={`rounded-2xl p-4 border space-y-3 ${
              isWarm
                ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/40'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={isWarm ? 'text-stone-600' : 'text-slate-300'}>約定時薪 (HKD/h)</span>
                <span className={`font-mono font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
                  ${hourlyRateAgreed}/h
                </span>
              </div>
              <input
                type="number"
                step="50"
                value={hourlyRateAgreed}
                onChange={(e) => setHourlyRateAgreed(Number(e.target.value))}
                className={`w-full text-xs font-mono font-semibold rounded-xl px-3 py-1.5 border outline-none ${
                  isWarm
                    ? 'bg-stone-50 border-stone-300 text-stone-900'
                    : 'bg-slate-800 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={isWarm ? 'text-stone-600' : 'text-slate-300'}>已記錄工時 (小時)</span>
                <span className={`font-mono font-bold ${isWarm ? 'text-teal-700' : 'text-teal-400'}`}>
                  {hourlyHoursDone}h
                </span>
              </div>
              <input
                type="range"
                min="1"
                max="80"
                step="1"
                value={hourlyHoursDone}
                onChange={(e) => setHourlyHoursDone(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={isWarm ? 'text-stone-600' : 'text-slate-300'}>Client 預算上限時數</span>
                <span className={`font-mono font-semibold ${isWarm ? 'text-stone-700' : 'text-slate-300'}`}>
                  {clientBudgetHours}h (總預算 ${hourlyBudgetTotal.toLocaleString()})
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={clientBudgetHours}
                onChange={(e) => setClientBudgetHours(Number(e.target.value))}
                className="w-full accent-teal-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* MODE 3: 目標時薪 ➔ QUOTATION 報價反推 */}
      {activeMode === 'quote-target' && (
        <div className="space-y-3.5">
          {/* Main Recommended Quote Card */}
          <div
            className={`rounded-2xl p-4 border transition-all ${
              isWarm
                ? 'bg-gradient-to-br from-indigo-50 to-stone-50 border-indigo-200 shadow-sm'
                : 'bg-gradient-to-br from-indigo-950/80 to-slate-900 border-indigo-700/60 shadow-lg'
            }`}
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isWarm ? 'text-indigo-800' : 'text-indigo-400'}`}>
                  Quotation 報價算盤
                </span>
                <div className={`text-xs font-semibold ${isWarm ? 'text-stone-700' : 'text-slate-300'}`}>
                  建議一口價報價金額 (含修改緩衝)
                </div>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isWarm
                    ? 'bg-indigo-100 text-indigo-800 border-indigo-200'
                    : 'bg-indigo-900/60 text-indigo-300 border-indigo-700/50'
                }`}
              >
                目標 ${targetDesiredRate}/h
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-1.5">
              <span className={`text-3xl font-mono font-bold ${isWarm ? 'text-stone-900' : 'text-slate-50'}`}>
                ${recommendedQuote.toLocaleString()}
              </span>
              <span className={`text-xs ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>HKD</span>
            </div>

            <p className={`text-[11px] ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              基準工時 ${baseQuote.toLocaleString()} + {bufferPercent}% 改稿緩衝金 (${bufferAmount.toLocaleString()})。
            </p>
          </div>

          {/* Quote Inputs Card */}
          <div
            className={`rounded-2xl p-4 border space-y-3 ${
              isWarm
                ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/40'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={isWarm ? 'text-stone-600' : 'text-slate-300'}>理想目標時薪 (HKD/h)</span>
                <span className={`font-mono font-bold ${isWarm ? 'text-indigo-700' : 'text-indigo-400'}`}>
                  ${targetDesiredRate}/h
                </span>
              </div>
              <input
                type="number"
                step="50"
                value={targetDesiredRate}
                onChange={(e) => setTargetDesiredRate(Number(e.target.value))}
                className={`w-full text-xs font-mono font-semibold rounded-xl px-3 py-1.5 border outline-none ${
                  isWarm
                    ? 'bg-stone-50 border-stone-300 text-stone-900'
                    : 'bg-slate-800 border-slate-700 text-slate-100'
                }`}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={isWarm ? 'text-stone-600' : 'text-slate-300'}>預估完成此 Job 所需工時 (小時)</span>
                <span className={`font-mono font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
                  {estimatedJobHours}h
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="120"
                step="5"
                value={estimatedJobHours}
                onChange={(e) => setEstimatedJobHours(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1 text-xs font-medium">
                <span className={isWarm ? 'text-stone-600' : 'text-slate-300'}>防 Client 改稿之安全緩衝 (%)</span>
                <span className={`font-mono font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
                  +{bufferPercent}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={bufferPercent}
                onChange={(e) => setBufferPercent(Number(e.target.value))}
                className="w-full accent-indigo-600 cursor-pointer h-1.5 bg-stone-200 rounded-lg appearance-none"
              />
            </div>
          </div>
        </div>
      )}

      {/* Action Navigation Footer */}
      <div className="mt-4 pt-3 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between">
        <button
          onClick={() => onNavigate && onNavigate('screen-timer')}
          className={`flex items-center gap-1.5 text-xs font-semibold py-2 px-3 rounded-xl transition-all ${
            isWarm
              ? 'bg-stone-200/80 hover:bg-stone-300 text-stone-700'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
          }`}
        >
          <span>返去開工計時</span>
        </button>

        <button
          onClick={() => onNavigate && onNavigate('screen-invoice')}
          className={`flex items-center gap-1.5 text-xs font-bold py-2 px-3 rounded-xl transition-all text-white shadow-sm ${
            isWarm
              ? 'bg-emerald-700 hover:bg-emerald-800'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          <span>一鍵帶入出 Invoice</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
};
