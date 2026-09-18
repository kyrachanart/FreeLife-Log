import React, { useState } from 'react';
import { PhoneFrame } from './PhoneFrame';
import { TimerScreen } from './screens/TimerScreen';
import { ProjectCalculatorScreen } from './screens/ProjectCalculatorScreen';
import { AILoggerScreen } from './screens/AILoggerScreen';
import { DailyTimesheetScreen } from './screens/DailyTimesheetScreen';
import { AnalyticsScreen } from './screens/AnalyticsScreen';
import { InvoiceHandoffScreen } from './screens/InvoiceHandoffScreen';
import { SCREEN_METADATA_LIST } from '../data/mockData';
import { Project, TimeSession } from '../types';
import {
  Clock,
  Calculator,
  Sparkles,
  Calendar,
  BarChart3,
  FileText,
  Smartphone,
  Info,
  CheckCircle2,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import { useTheme } from '../ThemeContext';

interface InteractiveDeviceViewProps {
  projects: Project[];
  sessions: TimeSession[];
  activeScreenId: string;
  onScreenChange: (id: string) => void;
  onAddSession: (session: any) => void;
}

export const InteractiveDeviceView: React.FC<InteractiveDeviceViewProps> = ({
  projects,
  sessions,
  activeScreenId,
  onScreenChange,
  onAddSession,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const currentMeta =
    SCREEN_METADATA_LIST.find((s) => s.id === activeScreenId) || SCREEN_METADATA_LIST[0];

  const renderActiveScreen = () => {
    switch (activeScreenId) {
      case 'screen-timer':
        return (
          <TimerScreen
            projects={projects}
            activeProjectId="proj-1"
            onNavigate={(id) => onScreenChange(id)}
          />
        );
      case 'screen-calculator':
        return (
          <ProjectCalculatorScreen
            projects={projects}
            activeProjectId="proj-1"
            onNavigate={(id) => onScreenChange(id)}
          />
        );
      case 'screen-ai-logger':
        return (
          <AILoggerScreen
            projects={projects}
            onAddSession={onAddSession}
            onNavigate={(id) => onScreenChange(id)}
          />
        );
      case 'screen-timesheet':
        return (
          <DailyTimesheetScreen
            sessions={sessions}
            onNavigate={(id) => onScreenChange(id)}
          />
        );
      case 'screen-analytics':
        return (
          <AnalyticsScreen
            projects={projects}
            onNavigate={(id) => onScreenChange(id)}
          />
        );
      case 'screen-invoice':
        return (
          <InvoiceHandoffScreen
            projects={projects}
            sessions={sessions}
            onNavigate={(id) => onScreenChange(id)}
          />
        );
      default:
        return (
          <TimerScreen
            projects={projects}
            activeProjectId="proj-1"
            onNavigate={(id) => onScreenChange(id)}
          />
        );
    }
  };

  const navItems = [
    { id: 'screen-timer', label: '01 開工休息雙計時', icon: Clock },
    { id: 'screen-calculator', label: '02 一口價/時薪算盤', icon: Calculator },
    { id: 'screen-ai-logger', label: '03 AI 語音 Log 工時', icon: Sparkles },
    { id: 'screen-timesheet', label: '04 每日 Timesheet', icon: Calendar },
    { id: 'screen-analytics', label: '05 PROJECT 報酬率', icon: BarChart3 },
    { id: 'screen-invoice', label: '06 Client Invoice', icon: FileText },
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
      {/* Left/Main Column: High-Fidelity Phone Frame */}
      <div className="w-full lg:w-auto flex flex-col items-center">
        {/* Device Mode Title */}
        <div className="mb-4 text-center">
          <div
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold mb-1 border ${
              isWarm
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-emerald-950 text-emerald-400 border-emerald-800'
            }`}
          >
            <Smartphone size={13} />
            <span>手機實測互動 (Interactive Device Sandbox)</span>
          </div>
          <h2 className={`text-xl font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
            {currentMeta.title}
          </h2>
          <p className={`text-xs ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
            {currentMeta.titleEn}
          </p>
        </div>

        {/* The Phone Container */}
        <PhoneFrame isCompact={false}>{renderActiveScreen()}</PhoneFrame>

        {/* Quick Phone Bottom Navigation Tab Simulator */}
        <div
          className={`mt-4 w-[375px] rounded-2xl p-1.5 flex items-center justify-between border shadow-sm ${
            isWarm ? 'bg-white border-stone-200' : 'bg-slate-900 border-slate-800'
          }`}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeScreenId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onScreenChange(item.id)}
                className={`p-2 rounded-xl flex flex-col items-center gap-0.5 text-[9px] font-semibold transition-all ${
                  isActive
                    ? isWarm
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-xs'
                      : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : isWarm
                    ? 'text-stone-500 hover:text-stone-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={item.label}
              >
                <Icon size={14} />
                <span className="truncate max-w-[48px]">{item.label.slice(3)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Screen Spec & Engineering Handoff Details */}
      <div className="w-full lg:flex-1 space-y-5 max-w-2xl">
        {/* Screen Switcher List */}
        <div
          className={`rounded-3xl p-5 border transition-all ${
            isWarm
              ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/50'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div
            className={`text-xs font-bold uppercase tracking-wider mb-3 flex items-center justify-between ${
              isWarm ? 'text-stone-600' : 'text-slate-400'
            }`}
          >
            <span>切換實測螢幕 (Choose Screen)</span>
            <span
              className={`text-[10px] font-normal px-2 py-0.5 rounded-full ${
                isWarm ? 'bg-stone-100 text-stone-600' : 'bg-slate-800 text-slate-300'
              }`}
            >
              6 個高保真原型畫面
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {navItems.map((nav) => {
              const Icon = nav.icon;
              const isSelected = activeScreenId === nav.id;
              return (
                <button
                  key={nav.id}
                  onClick={() => onScreenChange(nav.id)}
                  className={`p-3 rounded-2xl text-left border transition-all flex items-center gap-2.5 ${
                    isSelected
                      ? isWarm
                        ? 'bg-emerald-50/80 border-emerald-300 text-stone-900 shadow-xs'
                        : 'bg-emerald-950/70 border-emerald-600 text-white shadow-md'
                      : isWarm
                      ? 'bg-stone-50/70 border-stone-200 hover:bg-stone-100 text-stone-700'
                      : 'bg-slate-950/50 border-slate-800/80 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  <div
                    className={`p-1.5 rounded-xl ${
                      isSelected
                        ? isWarm
                          ? 'bg-emerald-600 text-white'
                          : 'bg-emerald-500 text-slate-950'
                        : isWarm
                        ? 'bg-stone-200 text-stone-600'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate">{nav.label}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feature Spec Cards */}
        <div
          className={`rounded-3xl p-6 border space-y-4 transition-all ${
            isWarm
              ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/50'
              : 'bg-slate-900/90 border-slate-800'
          }`}
        >
          <div className="flex items-center justify-between border-b pb-3 border-stone-100">
            <div>
              <div
                className={`text-[10px] font-mono font-bold uppercase tracking-wider ${
                  isWarm ? 'text-emerald-700' : 'text-emerald-400'
                }`}
              >
                Screen 0{currentMeta.number} · {currentMeta.category}
              </div>
              <h3 className={`text-lg font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
                {currentMeta.title}
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                isWarm ? 'bg-amber-100 text-amber-900' : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
              }`}
            >
              {currentMeta.badge}
            </span>
          </div>

          {/* Purpose */}
          <div>
            <div className={`text-xs font-bold mb-1 ${isWarm ? 'text-stone-700' : 'text-slate-300'}`}>
              🎯 畫面目標與價值 (Purpose)
            </div>
            <p className={`text-xs leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              {currentMeta.purpose}
            </p>
          </div>

          {/* PM Highlights */}
          <div>
            <div className={`text-xs font-bold mb-1.5 ${isWarm ? 'text-stone-700' : 'text-slate-300'}`}>
              📋 PM 核心業務邏輯 (Business Logic)
            </div>
            <ul className="space-y-1.5">
              {currentMeta.pmHighlights.map((pm, i) => (
                <li
                  key={i}
                  className={`text-xs flex items-start gap-2 leading-relaxed ${
                    isWarm ? 'text-stone-600' : 'text-slate-400'
                  }`}
                >
                  <CheckCircle2
                    size={14}
                    className={`shrink-0 mt-0.5 ${isWarm ? 'text-emerald-700' : 'text-emerald-400'}`}
                  />
                  <span>{pm}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Designer View */}
          <div>
            <div className={`text-xs font-bold mb-1.5 ${isWarm ? 'text-stone-700' : 'text-slate-300'}`}>
              🎨 設計師視角與互動規範 (UX/UI Highlights)
            </div>
            <ul className="space-y-1.5">
              {currentMeta.designHighlights.map((dh, i) => (
                <li
                  key={i}
                  className={`text-xs flex items-start gap-2 leading-relaxed ${
                    isWarm ? 'text-stone-600' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                      isWarm ? 'bg-amber-600' : 'bg-amber-400'
                    }`}
                  />
                  <span>{dh}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Dev Handoff Note */}
          <div
            className={`p-3.5 rounded-2xl border ${
              isWarm ? 'bg-stone-50 border-stone-200/90 text-stone-700' : 'bg-slate-950/70 border-slate-800 text-slate-300'
            }`}
          >
            <div
              className={`text-xs font-bold mb-1 flex items-center gap-1.5 ${
                isWarm ? 'text-emerald-800' : 'text-emerald-400'
              }`}
            >
              <span>💻 工程開發交接須知 (Dev Handoff Notes)</span>
            </div>
            <ul className="space-y-1 text-xs">
              {currentMeta.devNotes.map((dn, i) => (
                <li key={i} className={`font-mono text-[11px] ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
                  • {dn}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
