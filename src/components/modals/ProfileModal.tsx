import React, { useState, useEffect, useRef } from 'react';
import {
  User,
  X,
  CheckCircle2,
  Briefcase,
  Download,
  Upload,
  Database,
  Smartphone,
  Share,
  PlusSquare,
  Sparkles,
  AlertTriangle,
  Info,
  Coins,
} from 'lucide-react';
import { FreelancerProfile, Project, TimeSession } from '../../types';
import { useTheme } from '../../ThemeContext';
import { exportBackupJSON, validateBackupContent, restoreBackupToStorage, ValidationResult } from '../../utils/backup';
import { ConfirmRestoreModal } from './ConfirmRestoreModal';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../../utils/currency';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FreelancerProfile;
  onSaveProfile: (profile: FreelancerProfile) => void;
  projects?: Project[];
  sessions?: TimeSession[];
  initialTab?: 'profile' | 'backup' | 'pwa';
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  projects = [],
  sessions = [],
  initialTab = 'profile',
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';
  const { isInstallable, isInstalled, isIOS, isSafari, install } = usePWAInstall();

  const [activeTab, setActiveTab] = useState<'profile' | 'backup' | 'pwa'>(initialTab);
  const [name, setName] = useState(profile.name || '');
  const [title, setTitle] = useState(profile.title || '');
  const [email, setEmail] = useState(profile.email || '');
  const [defaultCurrency, setDefaultCurrency] = useState(profile.defaultCurrency || DEFAULT_CURRENCY);

  // Backup & Restore states
  const [isExporting, setIsExporting] = useState(false);
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingRestoreData, setPendingRestoreData] = useState<{
    validation: ValidationResult;
    filename: string;
  } | null>(null);
  const [isConfirmRestoreOpen, setIsConfirmRestoreOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(profile.name || '');
      setTitle(profile.title || '');
      setEmail(profile.email || '');
      setDefaultCurrency(profile.defaultCurrency || DEFAULT_CURRENCY);
      setActiveTab(initialTab);
      setExportFeedback(null);
      setImportError(null);
    }
  }, [profile, isOpen, initialTab]);

  if (!isOpen) return null;

  const handleSaveProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim(),
      title: title.trim(),
      email: email.trim(),
      defaultCurrency,
    });
    onClose();
  };

  const handleExportBackup = () => {
    try {
      setIsExporting(true);
      const result = exportBackupJSON();
      setExportFeedback(`✅ 備份下載成功！已打包 ${result.projectCount} 個 Project 與 ${result.sessionCount} 筆工時紀錄。`);
      setTimeout(() => setExportFeedback(null), 5000);
    } catch (err: any) {
      setExportFeedback(`❌ 匯出失敗：${err?.message || '請稍候再試'}`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input value so same file can be selected again
    e.target.value = '';
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const validation = validateBackupContent(content);

      if (!validation.isValid) {
        setImportError(validation.error || '檔案格式無效，請確認為 FreeLife Log 備份之 JSON 檔案。');
        return;
      }

      setPendingRestoreData({
        validation,
        filename: file.name,
      });
      setIsConfirmRestoreOpen(true);
    };

    reader.onerror = () => {
      setImportError('讀取檔案失敗，請檢查檔案權限後重試。');
    };

    reader.readAsText(file);
  };

  const handleConfirmRestore = () => {
    if (!pendingRestoreData || !pendingRestoreData.validation.data) return;

    try {
      restoreBackupToStorage(pendingRestoreData.validation.data);
      setIsConfirmRestoreOpen(false);
      onClose();

      // Refresh window to reinitialize all states cleanly with new storage
      window.location.reload();
    } catch (err: any) {
      setImportError(`復原失敗：${err?.message || '寫入資料庫時發生錯誤'}`);
      setIsConfirmRestoreOpen(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
        <div
          className={`w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-3xl p-6 sm:p-7 pb-20 sm:pb-7 shadow-2xl border transition-all ${
            isWarm ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2.5 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
                <User size={18} />
              </div>
              <div>
                <h3 className="font-extrabold text-base sm:text-lg">個人與系統設定</h3>
                <p className="text-xs text-stone-500 dark:text-slate-400">
                  管理個人資訊、數據備份與手機 App 安裝
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Segmented Tab Navigation */}
          <div className="flex rounded-2xl p-1 bg-stone-100 dark:bg-slate-800/80 mb-5 gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('profile')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'profile'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 shadow-xs'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
              }`}
            >
              <User size={14} />
              <span>個人資訊</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 shadow-xs'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
              }`}
            >
              <Database size={14} />
              <span>備份與復原</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pwa')}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                activeTab === 'pwa'
                  ? 'bg-white dark:bg-slate-900 text-stone-900 dark:text-slate-100 shadow-xs'
                  : 'text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-slate-200'
              }`}
            >
              <Smartphone size={14} />
              <span>PWA 安裝</span>
            </button>
          </div>

          {/* ============================================================ */}
          {/* TAB 1: 個人資訊 */}
          {/* ============================================================ */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfileSubmit} className="space-y-4 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  【姓名 / Name】
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <User size={15} />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例：Chan jai"
                    className={`w-full text-xs sm:text-sm font-semibold rounded-xl pl-10 pr-3.5 py-2.5 border outline-none transition-colors ${
                      isWarm
                        ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 dark:text-slate-300 mb-1.5">
                  【職業 / Role】
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                    <Briefcase size={15} />
                  </div>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例：插畫家 / Designer / 自由工作者"
                    className={`w-full text-xs sm:text-sm font-semibold rounded-xl pl-10 pr-3.5 py-2.5 border outline-none transition-colors ${
                      isWarm
                        ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-stone-700 dark:text-slate-300 flex items-center gap-1.5">
                    <Coins size={14} className="text-emerald-600 dark:text-emerald-400" />
                    <span>【全站預設幣別 / Default Currency】</span>
                  </label>
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                    預設：{defaultCurrency}
                  </span>
                </div>
                <div className="relative">
                  <select
                    value={defaultCurrency}
                    onChange={(e) => setDefaultCurrency(e.target.value)}
                    className={`w-full text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none cursor-pointer transition-colors ${
                      isWarm
                        ? 'bg-stone-50 border-stone-300 text-stone-900 focus:bg-white focus:ring-2 focus:ring-emerald-500'
                        : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                    }`}
                  >
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-stone-400 dark:text-slate-400 mt-1">
                  建立新 Project 時將自動以此幣別作為預設值，個別 Project 亦可隨時指定獨立貨幣。
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                    isWarm
                      ? 'border-stone-300 hover:bg-stone-100 text-stone-700'
                      : 'border-slate-700 hover:bg-slate-800 text-slate-300'
                  }`}
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 size={15} />
                  <span>儲存個人資訊</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 2: 資料備份與復原 (Backup & Restore) */}
          {/* ============================================================ */}
          {activeTab === 'backup' && (
            <div className="space-y-5 animate-in fade-in duration-150">
              {/* Feedback messages */}
              {exportFeedback && (
                <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 size={15} className="shrink-0" />
                  <span>{exportFeedback}</span>
                </div>
              )}

              {importError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={15} className="shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {/* Current Data Overview */}
              <div
                className={`p-4 rounded-2xl border ${
                  isWarm ? 'bg-stone-50 border-stone-200' : 'bg-slate-950 border-slate-800'
                }`}
              >
                <div className="text-xs font-bold text-stone-700 dark:text-slate-300 mb-2 flex items-center justify-between">
                  <span>📊 當前系統資料統計</span>
                  <span className="text-[11px] font-normal text-stone-400">本地離線儲存</span>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/60 dark:border-slate-800">
                    <span className="text-[11px] text-stone-400 dark:text-slate-500 block">已建立 Projects</span>
                    <span className="font-mono font-black text-lg text-stone-900 dark:text-slate-100">
                      {projects.length} <span className="text-xs font-normal">個</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-stone-200/60 dark:border-slate-800">
                    <span className="text-[11px] text-stone-400 dark:text-slate-500 block">Timesheet 工時紀錄</span>
                    <span className="font-mono font-black text-lg text-stone-900 dark:text-slate-100">
                      {sessions.length} <span className="text-xs font-normal">筆</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action 1: Export Backup */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                  isWarm ? 'bg-white border-stone-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 shrink-0">
                    <Download size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-slate-100">
                      1. 匯出備份資料 (Export Backup)
                    </h4>
                    <p className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                      將所有 Timesheet 紀錄、Project 清單、工作備忘筆記與個人設定打包為單一 JSON 檔案下載儲存。
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleExportBackup}
                  disabled={isExporting}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-black bg-stone-900 hover:bg-stone-800 text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98"
                >
                  <Download size={15} />
                  <span>{isExporting ? '打包中...' : '匯出備份 JSON (Download .json)'}</span>
                </button>
              </div>

              {/* Action 2: Import Restore */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                  isWarm ? 'bg-white border-stone-200 shadow-xs' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 shrink-0">
                    <Upload size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs sm:text-sm font-extrabold text-stone-900 dark:text-slate-100">
                      2. 匯入復原資料 (Import Backup)
                    </h4>
                    <p className="text-[11px] sm:text-xs text-stone-500 dark:text-slate-400 mt-0.5">
                      換手機或更換瀏覽器時，選取先前的備份 JSON 檔案即可一鍵無縫還原所有工時歷史。
                    </p>
                  </div>
                </div>

                {/* Hidden File Input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".json,application/json"
                  className="hidden"
                />

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border-2 border-dashed border-stone-300 dark:border-slate-700 hover:border-emerald-500 dark:hover:border-emerald-500 text-stone-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 bg-stone-50/50 dark:bg-slate-950/50 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Upload size={15} />
                  <span>選取備份檔案並匯入 (.json)</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: PWA / iOS 安裝教學 (Install App) */}
          {/* ============================================================ */}
          {activeTab === 'pwa' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Standalone status banner */}
              {isInstalled ? (
                <div className="p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>您目前已在獨立 Web App 模式下運行 FreeLife Log！</span>
                </div>
              ) : null}

              {/* Native Install Button (Chrome / Android / Desktop) */}
              {isInstallable && !isInstalled && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg space-y-3">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <Sparkles size={16} />
                    <span>一鍵安裝至桌面或手機主畫面</span>
                  </div>
                  <p className="text-xs text-emerald-100 leading-relaxed">
                    瀏覽器已支援快速安裝，點擊下方按鈕即可將 FreeLife Log 安裝為獨立應用程式。
                  </p>
                  <button
                    type="button"
                    onClick={install}
                    className="w-full py-2.5 rounded-xl bg-white text-emerald-800 hover:bg-emerald-50 font-black text-xs shadow-md transition-all cursor-pointer"
                  >
                    立即安裝 FreeLife Log
                  </button>
                </div>
              )}

              {/* iOS Safari Step-by-Step Instruction Card */}
              <div
                className={`p-4 sm:p-5 rounded-2xl border space-y-3 ${
                  isWarm ? 'bg-white border-stone-200' : 'bg-slate-900 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2 text-stone-900 dark:text-slate-100 font-extrabold text-xs sm:text-sm">
                  <Smartphone size={16} className="text-emerald-600 dark:text-emerald-400" />
                  <span>iPhone / iPad (iOS Safari) 安裝教學</span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 text-xs leading-relaxed font-semibold">
                  💡 點擊 Safari 下方選單的「分享」按鈕 ➔ 選取「加入主畫面」，即可像原生 App 一樣使用！
                </div>

                <div className="space-y-2.5 pt-1 text-xs text-stone-600 dark:text-slate-300">
                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-stone-50 dark:bg-slate-950/50">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      1
                    </div>
                    <div>
                      在 iPhone 上使用 <strong>Safari</strong> 開啟本網站，點擊螢幕下方工具列中央的「<strong>分享 (Share)</strong>」圖示 <Share size={12} className="inline ml-1 text-blue-500" />。
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-stone-50 dark:bg-slate-950/50">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      2
                    </div>
                    <div>
                      在分享選單中向下滑動，找到並點擊「<strong>加入主畫面 (Add to Home Screen)</strong>」<PlusSquare size={12} className="inline ml-1 text-stone-600" />。
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5 p-2 rounded-xl bg-stone-50 dark:bg-slate-950/50">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center font-mono font-bold text-[11px] shrink-0 mt-0.5">
                      3
                    </div>
                    <div>
                      點擊右上角的「<strong>新增</strong>」，手機桌面即可產生專屬 FreeLife Log App 圖示，全螢幕獨立運行！
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal for Restore */}
      <ConfirmRestoreModal
        isOpen={isConfirmRestoreOpen}
        onClose={() => {
          setIsConfirmRestoreOpen(false);
          setPendingRestoreData(null);
        }}
        onConfirm={handleConfirmRestore}
        validationResult={pendingRestoreData?.validation || null}
        filename={pendingRestoreData?.filename || ''}
      />
    </>
  );
};
