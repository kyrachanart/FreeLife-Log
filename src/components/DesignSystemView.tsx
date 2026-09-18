import React from 'react';
import { Palette, Type, Smartphone, Compass, Sparkles, Code2, Copy, Check, Moon, Sun, Heart } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export const DesignSystemView: React.FC = () => {
  const { theme, toggleTheme, setTheme } = useTheme();
  const isWarm = theme === 'warm';
  const [copiedToken, setCopiedToken] = React.useState<string | null>(null);

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedToken(id);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Design Philosophy Header */}
      <div
        className={`rounded-3xl p-6 lg:p-8 border transition-all ${
          isWarm ? 'bg-white border-stone-200 shadow-sm shadow-stone-200/50' : 'bg-slate-900 border-slate-800'
        }`}
      >
        <div
          className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-2 ${
            isWarm ? 'text-emerald-700' : 'text-emerald-400'
          }`}
        >
          <Palette size={15} />
          <span>Design System & Psychological Ergonomics · 設計師視角與設計規範</span>
        </div>
        <h1 className={`text-2xl lg:text-3xl font-bold mb-3 ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
          令人放鬆舒服的自由工作者人因工學設計系統 (FreelanceFlow Tokens)
        </h1>
        <p className={`text-sm leading-relaxed max-w-3xl ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
          針對 Freelancer 長時間面對電腦螢幕的心理壓力，我們提供精心調配的
          <span className={`font-semibold ${isWarm ? 'text-stone-900' : 'text-slate-200'}`}>「日光燕麥舒緩 (Warm Sage & Linen)」</span>
          暖色調。徹底告別高對比黑底帶來的壓迫與焦慮感，採用自然有機的柔和燕麥白、清新翡翠綠、溫暖咖啡琥珀色，搭配圓潤觸控幾何與等寬數字，讓每次開工與休息都無比療癒放鬆。
        </p>

        {/* Live Theme Switcher Banner */}
        <div
          className={`mt-5 p-3.5 rounded-2xl flex items-center justify-between border ${
            isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950/80 border-slate-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <Heart size={16} className="text-rose-500 fill-rose-500" />
            <span className={`text-xs font-bold ${isWarm ? 'text-stone-800' : 'text-slate-200'}`}>
              即時體驗調色切換：
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme('warm')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                isWarm
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Sun size={13} />
              <span>日光燕麥舒緩 (推薦・放鬆無壓)</span>
            </button>
            <button
              onClick={() => setTheme('dark')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                !isWarm
                  ? 'bg-slate-700 text-white shadow-sm'
                  : 'bg-stone-200 text-stone-700 hover:bg-stone-300'
              }`}
            >
              <Moon size={13} />
              <span>深邃暗夜模式</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1. Color Palette & Emotional Mapping */}
      <div
        className={`rounded-3xl p-6 lg:p-8 space-y-6 border transition-all ${
          isWarm ? 'bg-white/90 border-stone-200 shadow-sm shadow-stone-200/40' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center border ${
              isWarm
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            01
          </span>
          <h2 className={`text-xl font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
            放鬆舒緩色彩心理學與設計變數 (Relaxing Organic Palette)
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Linen Warm Base */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="h-14 rounded-xl bg-[#FAF8F5] border border-stone-300 flex items-center justify-center shadow-xs text-stone-800 font-mono font-bold text-xs">
              #FAF8F5 · Warm Linen
            </div>
            <div className={`text-xs font-bold ${isWarm ? 'text-stone-900' : 'text-slate-200'}`}>
              無壓有機底座 (Organic Canvas)
            </div>
            <p className={`text-[11px] leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              如日系棉麻質感，相較刺眼純白減少 15% 反射光，徹底免除深色背景帶來的壓抑沉重感。
            </p>
          </div>

          {/* Forest Matcha Emerald */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="h-14 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm text-white font-mono font-bold text-xs">
              #059669 · Sage Emerald
            </div>
            <div className={`text-xs font-bold ${isWarm ? 'text-stone-900' : 'text-slate-200'}`}>
              專注開工 / 時薪成長
            </div>
            <p className={`text-[11px] leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              草木與抹茶綠調，傳達穩定產出、正向時薪累積，不刺眼不急躁。
            </p>
          </div>

          {/* Warm Amber Honey */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="h-14 rounded-xl bg-amber-500 flex items-center justify-center shadow-sm text-stone-900 font-mono font-bold text-xs">
              #F59E0B · Honey Amber
            </div>
            <div className={`text-xs font-bold ${isWarm ? 'text-stone-900' : 'text-slate-200'}`}>
              休息暫停 / 咖啡喘息
            </div>
            <p className={`text-[11px] leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              象徵午後咖啡香氣。暫停時營造舒適心境，提醒自由工作者「休息是為了走更長遠的路」。
            </p>
          </div>

          {/* Gentle Coral Red */}
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className="h-14 rounded-xl bg-rose-500 flex items-center justify-center shadow-sm text-white font-mono font-bold text-xs">
              #F43F5E · Gentle Coral
            </div>
            <div className={`text-xs font-bold ${isWarm ? 'text-stone-900' : 'text-slate-200'}`}>
              時薪警示 / Client 改嘢提示
            </div>
            <p className={`text-[11px] leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              溫柔的珊瑚紅警示，當一口價實質時薪隨工時跌破底線時提醒向 Client 提出追加報價，守護自身收益。
            </p>
          </div>
        </div>
      </div>

      {/* 2. Dual Pricing Calculation Ergonomics */}
      <div
        className={`rounded-3xl p-6 lg:p-8 space-y-6 border transition-all ${
          isWarm ? 'bg-white/90 border-stone-200 shadow-sm shadow-stone-200/40' : 'bg-slate-900/80 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-lg font-bold text-sm flex items-center justify-center border ${
              isWarm
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
            }`}
          >
            02
          </span>
          <h2 className={`text-xl font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
            雙計費模式 (一口價動態折算 vs Hourly 計鐘) 介面設計規範
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className={`font-bold text-sm ${isWarm ? 'text-emerald-800' : 'text-emerald-300'}`}>
              一口價（Lump Sum · 隨工時即時 Auto-Update 時薪）
            </div>
            <p className={`leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              核心元件係「即時實質時薪倒推卡片」與「Client 改嘢追加款試算滑塊」。設計上突顯『做多幾多小時時薪會跌幾多』，讓接案者同 Client 溝通改嘢時底氣十足。
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border space-y-2 ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950 border-slate-800'
            }`}
          >
            <div className={`font-bold text-sm ${isWarm ? 'text-teal-800' : 'text-teal-300'}`}>
              Hourly 按時收費（跟鐘實報實銷）
            </div>
            <p className={`leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              核心元件係「扣除休息後之純工時請款 Invoice」與「Client 預算上限指示」。計時器清晰標注『休息時間不向 Client 收錢』，給予雙方極高透明度與信任感。
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
