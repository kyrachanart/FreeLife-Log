import React, { useState } from 'react';
import { BarChart3, TrendingUp, AlertTriangle, Award, ShieldAlert, ArrowUpRight, ArrowDownRight, Coffee, Clock } from 'lucide-react';
import { Project } from '../../types';
import { useTheme } from '../../ThemeContext';

interface AnalyticsScreenProps {
  projects: Project[];
  onNavigate?: (screenId: string) => void;
}

export const AnalyticsScreen: React.FC<AnalyticsScreenProps> = ({
  projects,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [period, setPeriod] = useState<'week' | 'month'>('month');

  // Calculate project rankings by dynamic effective hourly rate
  const rankedProjects = [...projects]
    .map((p) => {
      const effectiveRate =
        p.feeType === 'fixed'
          ? Math.round(p.totalContractAmount / Math.max(1, p.totalWorkedHours))
          : p.targetHourlyRate;
      const diff = effectiveRate - p.targetHourlyRate;
      return {
        ...p,
        effectiveRate,
        diff,
        isWinner: diff >= 0,
      };
    })
    .sort((a, b) => b.effectiveRate - a.effectiveRate);

  const totalRevenue = projects.reduce(
    (acc, p) =>
      acc + (p.feeType === 'fixed' ? p.totalContractAmount : p.totalWorkedHours * p.targetHourlyRate),
    0
  );
  const totalHours = projects.reduce((acc, p) => acc + p.totalWorkedHours, 0);
  const blendedRate = Math.round(totalRevenue / Math.max(1, totalHours));

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
            收入與工時分析
          </span>
          <h2 className={`text-base font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
            實質時薪與各 PROJECT 報酬率
          </h2>
        </div>

        {/* Toggle Period */}
        <div
          className={`flex rounded-lg p-0.5 text-xs border ${
            isWarm ? 'bg-stone-200/80 border-stone-300' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <button
            onClick={() => setPeriod('week')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              period === 'week'
                ? isWarm
                  ? 'bg-white text-stone-900 font-bold shadow-xs'
                  : 'bg-emerald-600 text-white font-semibold'
                : isWarm
                ? 'text-stone-600'
                : 'text-slate-400'
            }`}
          >
            今個禮拜
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              period === 'month'
                ? isWarm
                  ? 'bg-white text-stone-900 font-bold shadow-xs'
                  : 'bg-emerald-600 text-white font-semibold'
                : isWarm
                ? 'text-stone-600'
                : 'text-slate-400'
            }`}
          >
            今個月
          </button>
        </div>
      </div>

      {/* Aggregate KPI */}
      <div className="grid grid-cols-2 gap-2 mb-3.5">
        <div
          className={`rounded-2xl p-3 border transition-all ${
            isWarm ? 'bg-white border-stone-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
            加權平均實質時薪
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span
              className={`text-2xl font-mono font-bold ${
                isWarm ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              ${blendedRate}
            </span>
            <span className={`text-[10px] ${isWarm ? 'text-stone-400' : 'text-slate-500'}`}>/h</span>
          </div>
          <div
            className={`text-[10px] flex items-center gap-0.5 mt-1 ${
              isWarm ? 'text-emerald-800 font-medium' : 'text-emerald-400'
            }`}
          >
            <ArrowUpRight size={11} />
            <span>高過 Freelance 基準 +18%</span>
          </div>
        </div>

        <div
          className={`rounded-2xl p-3 border transition-all ${
            isWarm ? 'bg-white border-stone-200 shadow-xs' : 'bg-slate-900 border-slate-800'
          }`}
        >
          <div className={`text-[10px] ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
            累計合約與總工時
          </div>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className={`text-2xl font-mono font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
              ${Math.round(totalRevenue / 1000)}k
            </span>
            <span className={`text-[10px] ${isWarm ? 'text-stone-400' : 'text-slate-500'}`}>
              ({totalHours}h)
            </span>
          </div>
          <div className={`text-[10px] mt-1 ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>
            共進行 4 個活躍 PROJECT
          </div>
        </div>
      </div>

      {/* Client ROI Leaderboard / 天梯榜 */}
      <div
        className={`rounded-2xl p-3.5 border mb-3.5 transition-all ${
          isWarm ? 'bg-white border-stone-200 shadow-xs' : 'bg-slate-900/90 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5">
            <Award size={14} className={isWarm ? 'text-emerald-700' : 'text-emerald-400'} />
            <span className={`text-xs font-bold ${isWarm ? 'text-stone-800' : 'text-slate-200'}`}>
              PROJECT 時薪回報排行榜 (實質時薪排序)
            </span>
          </div>
          <span className={`text-[10px] ${isWarm ? 'text-stone-400' : 'text-slate-400'}`}>
            剔除休息純產出
          </span>
        </div>

        <div className="space-y-2.5">
          {rankedProjects.map((p, idx) => (
            <div
              key={p.id}
              className={`p-2.5 rounded-xl border transition-all ${
                isWarm
                  ? 'bg-stone-50/80 border-stone-200/90 hover:bg-stone-100/80'
                  : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-4 h-4 rounded-md text-[10px] font-bold flex items-center justify-center ${
                      idx === 0
                        ? isWarm
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-amber-500/20 text-amber-400'
                        : isWarm
                        ? 'bg-stone-200 text-stone-600'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <span className={`font-bold text-xs truncate max-w-[140px] ${isWarm ? 'text-stone-900' : 'text-slate-200'}`}>
                    {p.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${
                      p.feeType === 'fixed'
                        ? isWarm
                          ? 'bg-emerald-50 text-emerald-800'
                          : 'bg-emerald-950 text-emerald-300'
                        : isWarm
                        ? 'bg-teal-50 text-teal-800'
                        : 'bg-teal-950 text-teal-400'
                    }`}
                  >
                    {p.feeType === 'fixed' ? '一口價' : 'Hourly'}
                  </span>

                  <span
                    className={`font-mono font-bold text-xs ${
                      p.isWinner
                        ? isWarm
                          ? 'text-emerald-700'
                          : 'text-emerald-400'
                        : isWarm
                        ? 'text-rose-600'
                        : 'text-rose-400'
                    }`}
                  >
                    ${p.effectiveRate}/h
                  </span>
                </div>
              </div>

              {/* Mini comparison bar */}
              <div className="flex items-center gap-2 text-[10px]">
                <div
                  className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                    isWarm ? 'bg-stone-200' : 'bg-slate-800'
                  }`}
                >
                  <div
                    className={`h-full rounded-full ${
                      p.isWinner ? 'bg-emerald-500' : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, (p.effectiveRate / 1000) * 100)}%` }}
                  />
                </div>
                <span className={isWarm ? 'text-stone-500' : 'text-slate-400'}>
                  已做 {p.totalWorkedHours}h
                </span>
                <span
                  className={
                    p.isWinner
                      ? isWarm
                        ? 'text-emerald-700 font-medium'
                        : 'text-emerald-400'
                      : 'text-rose-600 font-bold'
                  }
                >
                  {p.isWinner ? `+$${p.diff}` : `-$${Math.abs(p.diff)}`}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rest & Work-Life Balance Health Index */}
      <div
        className={`rounded-2xl p-3.5 border transition-all ${
          isWarm ? 'bg-white border-stone-200 shadow-xs' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Coffee size={14} className={isWarm ? 'text-amber-700' : 'text-amber-400'} />
            <span className={`text-xs font-bold ${isWarm ? 'text-stone-800' : 'text-slate-200'}`}>
              休息放鬆與工作健康度
            </span>
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              isWarm ? 'bg-emerald-50 text-emerald-800' : 'bg-emerald-950 text-emerald-400'
            }`}
          >
            身心良好
          </span>
        </div>

        <p className={`text-[11px] leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
          今個月工時與休息比例為{' '}
          <span className={`font-semibold ${isWarm ? 'text-stone-900' : 'text-slate-200'}`}>82% 專注 : 18% 喘息</span>
          。隨時暫停飲杯咖啡與休息，有助維持專注力同高時薪產出。
        </p>
      </div>
    </div>
  );
};
