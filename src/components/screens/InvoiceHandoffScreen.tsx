import React, { useState } from 'react';
import { FileText, Download, Share2, Check, Copy, ExternalLink, Printer, ShieldCheck } from 'lucide-react';
import { Project, TimeSession } from '../../types';
import { useTheme } from '../../ThemeContext';
import { exportTimesheetPDF } from '../../utils/pdfExport';

interface InvoiceHandoffScreenProps {
  projects: Project[];
  sessions: TimeSession[];
  onNavigate?: (screenId: string) => void;
}

export const InvoiceHandoffScreen: React.FC<InvoiceHandoffScreenProps> = ({
  projects,
  sessions,
  onNavigate,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [selectedProjectId, setSelectedProjectId] = useState('proj-1');
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const currentProject = projects.find((p) => p.id === selectedProjectId) || projects[0];
  const projectSessions = sessions.filter((s) => s.projectId === selectedProjectId);

  const totalBillableMinutes = projectSessions.reduce((acc, s) => acc + s.workDurationMinutes, 0);
  const totalBreakMinutes = projectSessions.reduce((acc, s) => acc + s.breakDurationMinutes, 0);

  const isFixed = currentProject.feeType === 'fixed';
  const invoiceAmount = isFixed
    ? currentProject.totalContractAmount
    : Math.round(currentProject.totalWorkedHours * currentProject.targetHourlyRate);

  const handleCopySummary = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadPDF = async () => {
    try {
      setDownloaded(true);
      await exportTimesheetPDF({
        project: currentProject,
        sessions: projectSessions,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setTimeout(() => setDownloaded(false), 2500);
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
            商業結算與請款
          </span>
          <h2 className={`text-base font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
            Client 工時明細與 Invoice 生成
          </h2>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] border ${
            isWarm
              ? 'bg-stone-100 border-stone-300 text-stone-600'
              : 'bg-slate-900 border-slate-800 text-slate-300'
          }`}
        >
          INV-2026-09
        </span>
      </div>

      {/* Project Selector */}
      <div className="mb-3">
        <select
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{ textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden', maxWidth: '100%' }}
          className={`w-full max-w-full truncate text-xs font-semibold rounded-xl px-3 py-2 border outline-none transition-colors ${
            isWarm
              ? 'bg-white border-stone-300 text-stone-800 focus:ring-1 focus:ring-emerald-500 shadow-xs'
              : 'bg-slate-900 border-slate-800 text-slate-200 focus:ring-1 focus:ring-emerald-500'
          }`}
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id} className="truncate">
              出 Invoice 之 PROJECT：{p.clientName} - {p.name} [{p.feeType === 'fixed' ? '一口價' : 'Hourly'}]
            </option>
          ))}
        </select>
      </div>

      {/* Invoice Paper Document Mockup */}
      <div
        className={`rounded-2xl p-4 shadow-md mb-4 relative transition-all border ${
          isWarm
            ? 'bg-white border-stone-200 text-stone-800 shadow-stone-200/60'
            : 'bg-slate-900 border-slate-700/80 text-slate-200'
        }`}
      >
        {/* Subtle Watermark Stamp */}
        <div
          className={`absolute top-3 right-3 flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${
            isWarm
              ? 'text-emerald-800 bg-emerald-50 border-emerald-300'
              : 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
          }`}
        >
          <ShieldCheck size={12} />
          <span>淨工時無水分驗證</span>
        </div>

        {/* Invoice Metadata */}
        <div className={`mb-3 pb-3 border-b ${isWarm ? 'border-stone-100' : 'border-slate-800'}`}>
          <div className={`text-[10px] ${isWarm ? 'text-stone-400' : 'text-slate-400'}`}>To Client：</div>
          <div className={`text-sm font-bold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
            {currentProject.clientName}
          </div>
          <div className={`text-xs mt-0.5 ${isWarm ? 'text-stone-600' : 'text-slate-300'}`}>
            PROJECT: {currentProject.name}
          </div>
          <div className="mt-1">
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md border ${
                isFixed
                  ? isWarm
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                  : isWarm
                  ? 'bg-teal-50 text-teal-800 border-teal-200'
                  : 'bg-teal-950 text-teal-400 border-teal-800'
              }`}
            >
              收費模式：{isFixed ? '📦 一口價總額 (Lump Sum)' : '⏱️ Hourly 按鐘實報實銷'}
            </span>
          </div>
        </div>

        {/* Breakdown Table */}
        <div className="space-y-2 text-xs mb-3">
          <div
            className={`flex justify-between text-[11px] pb-1 border-b ${
              isWarm ? 'border-stone-100 text-stone-500' : 'border-slate-800 text-slate-400'
            }`}
          >
            <span>項目細項</span>
            <span>工時 / 金額</span>
          </div>

          <div className="flex justify-between">
            <span className={isWarm ? 'text-stone-700' : 'text-slate-300'}>累計投入淨工時</span>
            <span className={`font-mono font-semibold ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
              {currentProject.totalWorkedHours} 小時
            </span>
          </div>

          <div
            className={`flex justify-between text-[11px] ${
              isWarm ? 'text-amber-700' : 'text-amber-400/90'
            }`}
          >
            <span>已扣除個人休息 (不向 Client 收費)</span>
            <span className="font-mono">已扣除 {totalBreakMinutes} 分鐘</span>
          </div>

          {!isFixed && (
            <div className="flex justify-between">
              <span className={isWarm ? 'text-stone-700' : 'text-slate-300'}>約定時薪費率</span>
              <span className={`font-mono ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
                ${currentProject.targetHourlyRate}/h
              </span>
            </div>
          )}

          {isFixed && (
            <div className="flex justify-between">
              <span className={isWarm ? 'text-stone-700' : 'text-slate-300'}>一口價約定總金額</span>
              <span className={`font-mono ${isWarm ? 'text-stone-900' : 'text-slate-100'}`}>
                ${currentProject.totalContractAmount.toLocaleString()} HKD
              </span>
            </div>
          )}
        </div>

        {/* Total Grand Amount */}
        <div
          className={`pt-3 border-t flex justify-between items-baseline ${
            isWarm ? 'border-stone-200' : 'border-slate-800'
          }`}
        >
          <div>
            <span className={`text-xs font-semibold ${isWarm ? 'text-stone-600' : 'text-slate-400'}`}>
              本次 Invoice 請款總額
            </span>
            <div className={`text-[10px] ${isWarm ? 'text-stone-400' : 'text-slate-500'}`}>
              附淨工時審計清單
            </div>
          </div>
          <div className="text-right">
            <span
              className={`text-xl font-mono font-bold ${
                isWarm ? 'text-emerald-700' : 'text-emerald-400'
              }`}
            >
              ${invoiceAmount.toLocaleString()}
            </span>
            <span className={`text-xs ml-1 ${isWarm ? 'text-stone-500' : 'text-slate-400'}`}>HKD</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2 mt-auto">
        <button
          onClick={handleDownloadPDF}
          className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all text-white ${
            isWarm
              ? 'bg-emerald-600 hover:bg-emerald-700 shadow-sm shadow-emerald-600/20'
              : 'bg-emerald-600 hover:bg-emerald-500'
          }`}
        >
          {downloaded ? <Check size={14} /> : <Download size={14} />}
          <span>{downloaded ? '已生成 PDF Invoice！' : '匯出專業 PDF Invoice'}</span>
        </button>

        <div className="flex gap-2">
          <button
            onClick={handleCopySummary}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
              isWarm
                ? 'bg-white hover:bg-stone-50 border-stone-200 text-stone-700'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300'
            }`}
          >
            {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
            <span>{copied ? '已複製到剪貼簿' : '複製 WhatsApp / Email 格式'}</span>
          </button>

          <button
            onClick={() => onNavigate && onNavigate('screen-calculator')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border ${
              isWarm
                ? 'bg-stone-100 hover:bg-stone-200 border-stone-300 text-stone-700'
                : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
            }`}
          >
            <span>返去時薪算盤</span>
          </button>
        </div>
      </div>
    </div>
  );
};
