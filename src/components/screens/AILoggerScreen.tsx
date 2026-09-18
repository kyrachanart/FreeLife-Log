import React, { useState } from 'react';
import { Sparkles, Mic, Send, CheckCircle2, RefreshCw, Layers, ArrowRight, CornerDownLeft, Coffee, Clock } from 'lucide-react';
import { Project, AILogParseResult } from '../../types';
import { useTheme } from '../../ThemeContext';

interface AILoggerScreenProps {
  projects: Project[];
  onAddSession?: (session: any) => void;
  onNavigate?: (screenId: string) => void;
}

export const AILoggerScreen: React.FC<AILoggerScreenProps> = ({
  projects,
  onAddSession,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [inputText, setInputText] = useState(
    '今日下晝幫 PulseBrand 做官網動態切版 3 個鐘，中間飲咗 25 分鐘咖啡休息'
  );
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [parsedResult, setParsedResult] = useState<AILogParseResult>({
    projectName: 'PulseBrand 品牌官網改版',
    clientName: 'Pulse Digital Co.',
    taskDescription: '官網動態切版與響應式動態效果調校',
    workMinutes: 155, // 2h 35m net
    breakMinutes: 25,
    feeType: 'fixed',
    estimatedRateOrIncome: 2307,
    confidence: 0.98,
    suggestedAction: '將從 PulseBrand 一口價總額 $38,000 中扣減 2.6 小時配額，時薪保持健康',
  });
  const [hasConfirmed, setHasConfirmed] = useState(false);

  const samplePrompts = [
    { text: '今日下晝幫 PulseBrand 做官網切版 3 個鐘，中間飲咗 25 分鐘咖啡休息', mode: '一口價' },
    { text: '今朝 10:00 至 12:30 幫 Apex 做 SaaS 架構諮詢，跟鐘計時薪，中間伸展咗 15 分鐘', mode: 'Hourly' },
    { text: '搞掂 FinFlow 財務 App 第 4 次 Client 改稿 180 分鐘，中間散步休息半個鐘', mode: '一口價' },
  ];

  const handleSelectSample = (sample: string) => {
    setInputText(sample);
    setIsAnalyzing(true);
    setHasConfirmed(false);
    setTimeout(() => {
      if (sample.includes('Apex')) {
        setParsedResult({
          projectName: 'SaaS 後台系統諮詢與架構',
          clientName: 'Apex Cloud Ltd.',
          taskDescription: 'SaaS 架構檢視與 API 諮詢',
          workMinutes: 135,
          breakMinutes: 15,
          feeType: 'hourly',
          estimatedRateOrIncome: 1462.5,
          confidence: 0.99,
          suggestedAction: '按約定時薪 $650/h 計算，淨工時 2.25 小時，應收 $1,462.5 HKD',
        });
      } else if (sample.includes('FinFlow')) {
        setParsedResult({
          projectName: 'FinFlow App 財務儀表介面',
          clientName: 'FinFlow Tech',
          taskDescription: '第 4 次 Client 改稿與資產圖表調整',
          workMinutes: 150,
          breakMinutes: 30,
          feeType: 'fixed',
          estimatedRateOrIncome: 1250,
          confidence: 0.96,
          suggestedAction: '注意：呢個 PROJECT 累積工時偏高，實質時薪已滑落至 $500/h 底線',
        });
      } else {
        setParsedResult({
          projectName: 'PulseBrand 品牌官網改版',
          clientName: 'Pulse Digital Co.',
          taskDescription: '官網動態切版與響應式效果調校',
          workMinutes: 155,
          breakMinutes: 25,
          feeType: 'fixed',
          estimatedRateOrIncome: 2307,
          confidence: 0.98,
          suggestedAction: '一口價 Job：累計淨工時增加 2.6h，目前實質時薪仍高於目標',
        });
      }
      setIsAnalyzing(false);
    }, 400);
  };

  const handleConfirmLog = () => {
    setHasConfirmed(true);
    if (onAddSession) {
      onAddSession(parsedResult);
    }
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
            AI 自動化
          </span>
          <h2 className={`text-base font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
            語音 / 自然語言對話 Log 工時
          </h2>
        </div>
        <span
          className={`flex items-center gap-1 text-[10px] px-2.5 py-0.5 rounded-full border ${
            isWarm
              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
              : 'bg-emerald-950 text-emerald-400 border-emerald-800'
          }`}
        >
          <Sparkles size={11} />
          <span>AI 智能提取</span>
        </span>
      </div>

      {/* Voice / Text Input Box */}
      <div
        className={`rounded-2xl p-3 border mb-3 relative transition-all ${
          isWarm
            ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/40'
            : 'bg-slate-900 border-slate-800'
        }`}
      >
        <textarea
          rows={3}
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="例如：今日下晝幫 Pulse 做動態切版 3 個鐘，中間飲咗 25 分鐘咖啡..."
          className={`w-full text-xs rounded-xl p-2.5 outline-none resize-none border ${
            isWarm
              ? 'bg-stone-50 border-stone-200 text-stone-800 placeholder-stone-400 focus:ring-1 focus:ring-emerald-500'
              : 'bg-slate-800/90 border-slate-700 text-slate-100 placeholder-slate-500 focus:ring-1 focus:ring-emerald-500'
          }`}
        />

        <div className="flex items-center justify-between mt-2 pt-2 border-t border-stone-100">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsRecording(!isRecording)}
              className={`p-2 rounded-xl border flex items-center gap-1.5 text-xs font-semibold transition-all ${
                isRecording
                  ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                  : isWarm
                  ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <Mic size={14} className={isRecording ? 'animate-bounce' : ''} />
              <span>{isRecording ? '聆聽廣東話...' : '語音輸入'}</span>
            </button>
            <span className={`text-[10px] ${isWarm ? 'text-stone-400' : 'text-slate-500'}`}>
              支援廣東話口語、English
            </span>
          </div>

          <button
            onClick={() => handleSelectSample(inputText)}
            disabled={isAnalyzing}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 text-white transition-all ${
              isWarm
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
                : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {isAnalyzing ? <RefreshCw size={13} className="animate-spin" /> : <Send size={13} />}
            <span>{isAnalyzing ? '分析中...' : '解析工時'}</span>
          </button>
        </div>
      </div>

      {/* Quick Click Samples */}
      <div className="mb-3 space-y-1.5">
        <span className={`text-[10px] font-semibold block ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
          點擊體驗廣東話口語快速輸入：
        </span>
        <div className="space-y-1">
          {samplePrompts.map((s, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectSample(s.text)}
              className={`w-full text-left text-[11px] p-2 rounded-xl border transition-all flex items-center justify-between ${
                isWarm
                  ? 'bg-white/80 hover:bg-white border-stone-200 text-stone-700'
                  : 'bg-slate-900/60 hover:bg-slate-800 border-slate-800 text-slate-300'
              }`}
            >
              <span className="truncate max-w-[240px]">"{s.text}"</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                  s.mode === 'Hourly'
                    ? isWarm
                      ? 'bg-teal-100 text-teal-800'
                      : 'bg-teal-950 text-teal-300'
                    : isWarm
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-emerald-950 text-emerald-300'
                }`}
              >
                {s.mode}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Structured Parse Result Card */}
      <div
        className={`rounded-2xl p-3.5 border transition-all mb-3 ${
          isWarm
            ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/40'
            : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 size={14} className={isWarm ? 'text-emerald-700' : 'text-emerald-400'} />
            <span className={`text-xs font-bold ${isWarm ? 'text-stone-800' : 'text-slate-100'}`}>
              AI 結構化解析結果
            </span>
          </div>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
              parsedResult.feeType === 'fixed'
                ? isWarm
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                : isWarm
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-teal-950 text-teal-400 border-teal-800'
            }`}
          >
            {parsedResult.feeType === 'fixed' ? '一口價 Job (動態計時薪)' : 'Hourly 按鐘實報實銷'}
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div
            className={`p-2 rounded-xl flex items-center justify-between ${
              isWarm ? 'bg-stone-50 border border-stone-200/80' : 'bg-slate-950/70 border border-slate-800/80'
            }`}
          >
            <span className={isWarm ? 'text-stone-500' : 'text-slate-400'}>自動匹配 PROJECT / Client</span>
            <span className={`font-bold text-right ${isWarm ? 'text-stone-800' : 'text-slate-200'}`}>
              {parsedResult.projectName} · {parsedResult.clientName}
            </span>
          </div>

          <div
            className={`p-2 rounded-xl flex items-center justify-between ${
              isWarm ? 'bg-stone-50 border border-stone-200/80' : 'bg-slate-950/70 border border-slate-800/80'
            }`}
          >
            <span className={isWarm ? 'text-stone-500' : 'text-slate-400'}>工作內容細項</span>
            <span className={`text-right truncate max-w-[170px] ${isWarm ? 'text-stone-800' : 'text-slate-200'}`}>
              {parsedResult.taskDescription}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div
              className={`p-2 rounded-xl ${
                isWarm ? 'bg-stone-50 border border-stone-200/80' : 'bg-slate-950/70 border border-slate-800/80'
              }`}
            >
              <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>純工作淨工時</div>
              <div className={`font-mono font-bold text-sm ${isWarm ? 'text-emerald-700' : 'text-emerald-400'}`}>
                {Math.floor(parsedResult.workMinutes / 60)}h {parsedResult.workMinutes % 60}m
              </div>
            </div>

            <div
              className={`p-2 rounded-xl ${
                isWarm ? 'bg-stone-50 border border-stone-200/80' : 'bg-slate-950/70 border border-slate-800/80'
              }`}
            >
              <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>自動剔除休息時間</div>
              <div className={`font-mono font-bold text-sm ${isWarm ? 'text-amber-700' : 'text-amber-300'}`}>
                {parsedResult.breakMinutes} 分鐘
              </div>
            </div>
          </div>

          {/* Action note */}
          <div
            className={`p-2 rounded-xl text-[11px] leading-relaxed border ${
              isWarm ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900' : 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
            }`}
          >
            {parsedResult.suggestedAction}
          </div>
        </div>
      </div>

      {/* Confirm Button */}
      <div className="mt-auto pt-2">
        <button
          onClick={handleConfirmLog}
          disabled={hasConfirmed}
          className={`w-full py-3 rounded-2xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.99] ${
            hasConfirmed
              ? isWarm
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : isWarm
              ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
        >
          <CheckCircle2 size={16} />
          <span>{hasConfirmed ? '已成功 Log 入 Timesheet！' : '確認無誤・一鍵 Log 入 Timesheet'}</span>
        </button>
      </div>
    </div>
  );
};
