import React from 'react';
import { PhoneFrame } from './PhoneFrame';
import { TimerScreen } from './screens/TimerScreen';
import { ProjectCalculatorScreen } from './screens/ProjectCalculatorScreen';
import { AILoggerScreen } from './screens/AILoggerScreen';
import { DailyTimesheetScreen } from './screens/DailyTimesheetScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { InvoiceHandoffScreen } from './screens/InvoiceHandoffScreen';
import { SCREEN_METADATA_LIST } from '../data/mockData';
import { Project, TimeSession } from '../types';
import { ArrowRight, CheckCircle2, Eye, Sparkles, Layers, Sliders, Smartphone, Moon, Sun } from 'lucide-react';
import { useTheme } from '../ThemeContext';

interface AllScreensCanvasProps {
  projects: Project[];
  sessions: TimeSession[];
  onSelectInteractiveScreen: (screenId: string) => void;
}

export const AllScreensCanvas: React.FC<AllScreensCanvasProps> = ({
  projects,
  sessions,
  onSelectInteractiveScreen,
}) => {
  const { theme, toggleTheme } = useTheme();
  const isWarm = theme === 'warm';

  const screensConfig = [
    {
      id: 'screen-timer',
      meta: SCREEN_METADATA_LIST[0],
      component: (
        <TimerScreen
          projects={projects}
          activeProjectId="proj-1"
          onNavigate={onSelectInteractiveScreen}
        />
      ),
    },
    {
      id: 'screen-calculator',
      meta: SCREEN_METADATA_LIST[1],
      component: (
        <ProjectCalculatorScreen
          projects={projects}
          activeProjectId="proj-1"
          onNavigate={onSelectInteractiveScreen}
        />
      ),
    },
    {
      id: 'screen-ai-logger',
      meta: SCREEN_METADATA_LIST[2],
      component: (
        <AILoggerScreen
          projects={projects}
          onNavigate={onSelectInteractiveScreen}
        />
      ),
    },
    {
      id: 'screen-timesheet',
      meta: SCREEN_METADATA_LIST[3],
      component: (
        <DailyTimesheetScreen
          sessions={sessions}
          onNavigate={onSelectInteractiveScreen}
        />
      ),
    },
    {
      id: 'screen-analytics',
      meta: SCREEN_METADATA_LIST[4],
      component: (
        <AnalyticsScreen
          projects={projects}
          onNavigate={onSelectInteractiveScreen}
        />
      ),
    },
    {
      id: 'screen-invoice',
      meta: SCREEN_METADATA_LIST[5],
      component: (
        <InvoiceHandoffScreen
          projects={projects}
          sessions={sessions}
          onNavigate={onSelectInteractiveScreen}
        />
      ),
    },
  ];

  return (
    <div className="space-y-12">
      {/* Intro Header */}
      <div
        className={`rounded-3xl p-6 lg:p-8 backdrop-blur-sm border transition-all ${
          isWarm
            ? 'bg-white/90 border-stone-200 shadow-md shadow-stone-200/50'
            : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold border ${
                isWarm
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
              }`}
            >
              <Sparkles size={13} />
              <span>同屏原型總覽 · 一口價 (隨工時動態計時薪) & Hourly 計鐘雙模式</span>
            </div>
            <h1 className={`text-2xl lg:text-3xl font-bold tracking-tight ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
              FreelanceFlow AI 原型畫面矩陣
            </h1>
            <p className={`text-sm max-w-3xl leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              採用令人放鬆舒適的低壓暖調（燕麥日光色），全面支援「Lump Sum 一口價（隨工時自動 Update 實質時薪）」同「Hourly 按時薪計鐘」兩種模式。包含開工與休息雙計時器、Job 總價動態時薪算盤、廣東話 AI 自然語言 Log 工時、每日 Timesheet、PROJECT 報酬率分析與出 Invoice。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Visual Mode Pill */}
            <div
              className={`px-4 py-2 rounded-2xl text-xs border ${
                isWarm ? 'bg-stone-50 border-stone-200 text-stone-700' : 'bg-slate-950/70 border-slate-800 text-slate-300'
              }`}
            >
              <span className={`block text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-500'}`}>收費模式支援</span>
              <span className={`font-semibold ${isWarm ? 'text-emerald-700' : 'text-emerald-400'}`}>
                一口價動態時薪 + Hourly 計鐘
              </span>
            </div>

            <div
              className={`px-4 py-2 rounded-2xl text-xs border ${
                isWarm ? 'bg-stone-50 border-stone-200 text-stone-700' : 'bg-slate-950/70 border-slate-800 text-slate-300'
              }`}
            >
              <span className={`block text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-500'}`}>放鬆無壓視覺</span>
              <span className={`font-semibold ${isWarm ? 'text-amber-800' : 'text-slate-100'}`}>
                {isWarm ? '日光燕麥舒緩調色 (放鬆舒服)' : '深邃暗夜調色'}
              </span>
            </div>
          </div>
        </div>

        {/* User Journey Flow Indicator */}
        <div className={`mt-6 pt-6 border-t ${isWarm ? 'border-stone-200/80' : 'border-slate-800/80'}`}>
          <div
            className={`text-xs font-semibold mb-3 flex items-center gap-1.5 ${
              isWarm ? 'text-stone-600' : 'text-slate-400'
            }`}
          >
            <Layers size={14} className={isWarm ? 'text-emerald-700' : 'text-emerald-400'} />
            <span>Freelancer 日常工作流程 (User Journey Flow)：</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {screensConfig.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => onSelectInteractiveScreen(item.id)}
                className={`cursor-pointer rounded-xl p-2.5 border transition-all text-left group ${
                  isWarm
                    ? 'bg-stone-50/70 hover:bg-stone-100 border-stone-200 hover:border-emerald-300'
                    : 'bg-slate-950/60 hover:bg-slate-800 border-slate-800 hover:border-emerald-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] mb-1">
                  <span className={`font-mono font-bold ${isWarm ? 'text-stone-500' : 'text-slate-500'}`}>
                    0{idx + 1}
                  </span>
                  <span
                    className={`font-semibold px-1 py-0.2 rounded ${
                      isWarm ? 'bg-stone-200 text-stone-700' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.meta.badge}
                  </span>
                </div>
                <div
                  className={`text-xs font-bold truncate transition-colors ${
                    isWarm
                      ? 'text-stone-800 group-hover:text-emerald-700'
                      : 'text-slate-200 group-hover:text-emerald-400'
                  }`}
                >
                  {item.meta.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grid of All 6 Screens in One Canvas */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
        {screensConfig.map((screen) => (
          <div
            key={screen.id}
            id={screen.id}
            className={`rounded-3xl p-5 border flex flex-col transition-all group ${
              isWarm
                ? 'bg-white border-stone-200 shadow-md shadow-stone-200/50 hover:shadow-lg hover:border-emerald-300'
                : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 shadow-xl'
            }`}
          >
            {/* Screen Header Meta Bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span
                  className={`w-6 h-6 rounded-lg font-mono font-bold text-xs flex items-center justify-center border ${
                    isWarm
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}
                >
                  {screen.meta.number}
                </span>
                <div>
                  <h3 className={`font-bold text-sm leading-tight ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
                    {screen.meta.title}
                  </h3>
                  <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-500'}`}>
                    {screen.meta.titleEn}
                  </div>
                </div>
              </div>

              <button
                onClick={() => onSelectInteractiveScreen(screen.id)}
                className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-xl transition-all border ${
                  isWarm
                    ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                    : 'text-emerald-400 bg-emerald-950 hover:bg-emerald-900 border-emerald-800'
                }`}
              >
                <Smartphone size={12} />
                <span>手機操作</span>
              </button>
            </div>

            {/* Simulated Phone Device */}
            <div className="my-auto py-2">
              <PhoneFrame isCompact={true}>{screen.component}</PhoneFrame>
            </div>

            {/* Bottom PM & Design Highlight Card */}
            <div
              className={`mt-4 pt-3.5 border-t text-xs space-y-1.5 ${
                isWarm ? 'border-stone-100' : 'border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    isWarm ? 'text-stone-500' : 'text-slate-400'
                  }`}
                >
                  {screen.meta.category}
                </span>
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                    isWarm ? 'bg-stone-100 text-stone-600' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {screen.meta.badge}
                </span>
              </div>
              <p className={`text-[11px] leading-relaxed line-clamp-2 ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
                {screen.meta.purpose}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
