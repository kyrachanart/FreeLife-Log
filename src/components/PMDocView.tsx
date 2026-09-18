import React from 'react';
import { Target, Users, Zap, CheckCircle, ShieldAlert, Cpu, Layers, GitBranch, ArrowRight, Activity, DollarSign, Clock } from 'lucide-react';
import { useTheme } from '../ThemeContext';

export const PMDocView: React.FC = () => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* PM Executive Summary Card */}
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
          <Target size={15} />
          <span>Product Requirement Document (PRD) · 產品需求規格書</span>
        </div>
        <h1 className={`text-2xl lg:text-3xl font-bold mb-3 ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
          FreelanceFlow AI：香港自由工作者工時與實質時薪自動紀錄產品規劃
        </h1>
        <p className={`text-sm leading-relaxed max-w-3xl ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
          專為香港 Freelancer（設計師、UI/UX、Full-stack 開發者、文案顧問）設計嘅工時收益工具。原生支援香港接案核心收費模式：
          <span className={`font-semibold ${isWarm ? 'text-stone-900' : 'text-slate-200'}`}>「Lump Sum 一口價（隨工時自動 Update 實質時薪）」</span>與
          <span className={`font-semibold ${isWarm ? 'text-stone-900' : 'text-slate-200'}`}>「Hourly 按時薪計鐘」</span>
          ，解決 Freelance 接 Job 過程中「Client 無止境改嘢導致一口價實質時薪跌穿底線」、「休息飲咖啡同開工工時混淆」以及「收工後懶得填寫 Timesheet」三大痛點。
        </p>
      </div>

      {/* Pricing Modes PRD Section */}
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
            ★
          </span>
          <h2 className={`text-xl font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
            核心模式：Job 總價與實質時薪自動換算 (Dual Pricing Modes Architecture)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mode 1: Fixed Price with Dynamic Update */}
          <div
            className={`rounded-2xl p-5 border space-y-3 ${
              isWarm ? 'bg-stone-50 border-stone-200/90' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold text-sm flex items-center gap-1.5 ${isWarm ? 'text-emerald-800' : 'text-emerald-400'}`}>
                <DollarSign size={16} />
                <span>模式 A：一口價 Job（隨工時即時 Auto-Update 時薪）</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isWarm ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950 text-emerald-300'}`}>
                即時動態折算
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <p className={isWarm ? 'text-stone-600' : 'text-slate-400'}>
                <strong>適用場景：</strong>整套品牌官網改版、獨立 App、年度宣傳專題等預先傾好一口價 Lump Sum 的 Job。
              </p>
              <div className={`p-2.5 rounded-xl font-mono text-[11px] ${isWarm ? 'bg-white border border-stone-200 text-stone-800' : 'bg-slate-900 text-emerald-400'}`}>
                實質時薪 (Dynamic Rate) = Job 一口價合約總金額 ÷ 累積淨工時 (扣除休息)
              </div>
              <ul className={`space-y-1 list-disc list-inside ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
                <li><strong>隨時間做得愈多自動即時 Update：</strong>每做多一粒鐘，時薪精準向下刷新，杜絕「看似賺好多實質做義工」。</li>
                <li><strong>時薪底線防禦：</strong>可容忍工時 = 總價 ÷ 個人目標時薪底線（如 $500/h）。</li>
                <li><strong>Client 改嘢衝擊試算：</strong>客每要求加改 10 小時，系統即時計算實質時薪跌幅，並自動產生「建議追加報價 (Add-on Quote)」。</li>
              </ul>
            </div>
          </div>

          {/* Mode 2: Hourly Billing */}
          <div
            className={`rounded-2xl p-5 border space-y-3 ${
              isWarm ? 'bg-stone-50 border-stone-200/90' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className={`font-bold text-sm flex items-center gap-1.5 ${isWarm ? 'text-teal-800' : 'text-teal-400'}`}>
                <Clock size={16} />
                <span>模式 B：Hourly 按時薪計鐘（實報實銷）</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isWarm ? 'bg-teal-100 text-teal-800' : 'bg-teal-950 text-teal-400'}`}>
                跟鐘透明出單
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <p className={isWarm ? 'text-stone-600' : 'text-slate-400'}>
                <strong>適用場景：</strong>顧問諮詢、系統維護、長期按小時計費的 Retainer 合約。
              </p>
              <div className={`p-2.5 rounded-xl font-mono text-[11px] ${isWarm ? 'bg-white border border-stone-200 text-stone-800' : 'bg-slate-900 text-emerald-400'}`}>
                應收總額 (Billable Total) = (累積淨工時分鐘 ÷ 60) × 約定時薪費率
              </div>
              <ul className={`space-y-1 list-disc list-inside ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
                <li><strong>休息自動剔除：</strong>中途飲咖啡、食飯、吹水嚴格獨立標記，出 Invoice 明確列明已扣減休息，Client 睇得安心。</li>
                <li><strong>Client 預算上限預警：</strong>當工時達到 Client 預算 85% 時發出提醒。</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Step 1: User Pain Points & Needs Deep Dive */}
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
            步驟一：香港接案痛點與產品對策 (Hong Kong Freelancer Needs)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`rounded-2xl p-4 space-y-2 border ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="text-rose-600 font-bold text-sm flex items-center gap-1.5">
              <ShieldAlert size={16} />
              <span>痛點 1：一口價無休止改嘢・時薪暴跌</span>
            </div>
            <p className={`text-xs leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              總價看似可觀（如 HK$38,000），但 Client 無止境改嘢，累計做咗超過 100 小時後，實質時薪跌破 $380/h，甚至不如兼職時薪。
            </p>
            <div className={`text-[11px] font-medium pt-2 border-t ${isWarm ? 'text-emerald-800 border-stone-200' : 'text-emerald-400 border-slate-800/80'}`}>
              💡 解法：實質時薪即時隨工時動態 Auto-Update，自動提示改嘢追加報價。
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 space-y-2 border ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="text-amber-700 font-bold text-sm flex items-center gap-1.5">
              <Activity size={16} />
              <span>痛點 2：開工休息混淆・請款易有爭拗</span>
            </div>
            <p className={`text-xs leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              跟鐘計費的 Job，若飲咖啡、食飯或處理私事混入時間，出單時 Client 會質疑水分；手動切換計時器又經常忘記開番。
            </p>
            <div className={`text-[11px] font-medium pt-2 border-t ${isWarm ? 'text-emerald-800 border-stone-200' : 'text-emerald-400 border-slate-800/80'}`}>
              💡 解法：一鍵暫停休息，淨工時與休息雙軌獨立，Invoice 清晰列明剔除休息時間。
            </div>
          </div>

          <div
            className={`rounded-2xl p-4 space-y-2 border ${
              isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950/70 border-slate-800'
            }`}
          >
            <div className="text-purple-600 font-bold text-sm flex items-center gap-1.5">
              <Cpu size={16} />
              <span>痛點 3：收工懶得開表單 Log 工時</span>
            </div>
            <p className={`text-xs leading-relaxed ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              忙完一日攰到唔想打字填表，幾日後忘記做咗幾多個鐘，導致工時失真甚至漏請款。
            </p>
            <div className={`text-[11px] font-medium pt-2 border-t ${isWarm ? 'text-emerald-800 border-stone-200' : 'text-emerald-400 border-slate-800/80'}`}>
              💡 解法：AI 廣東話語音/口語速記，講一句話自動提取 PROJECT、淨工時同扣除休息。
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
