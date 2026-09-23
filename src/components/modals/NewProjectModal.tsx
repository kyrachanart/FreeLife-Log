import React, { useState, useEffect, useMemo } from 'react';
import { Plus, X, Briefcase, DollarSign, Clock, Tag, UserCheck, UserPlus, Palette, Check, Coins } from 'lucide-react';
import { Project, ProjectFeeType } from '../../types';
import { useTheme } from '../../ThemeContext';
import { getRecentCategories, saveRecentCategory } from '../../utils/storage';
import { getAvailableClientColors, getClientColor, saveClientColor } from '../../utils/clientColors';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY, getCurrencySymbol, formatHourlyRate, formatCurrency } from '../../utils/currency';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: Project) => void;
  existingClients?: string[];
  defaultCurrency?: string;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({
  isOpen,
  onClose,
  onAddProject,
  existingClients = [],
  defaultCurrency = DEFAULT_CURRENCY,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [name, setName] = useState('');
  
  // Client selection mode: 'existing' | 'new'
  const [clientMode, setClientMode] = useState<'existing' | 'new'>(
    existingClients.length > 0 ? 'existing' : 'new'
  );
  const [selectedClient, setSelectedClient] = useState<string>(
    existingClients[0] || ''
  );
  const [newClientName, setNewClientName] = useState('');
  const [clientColor, setClientColor] = useState<string>('#E11D48');

  const [category, setCategory] = useState('');
  const [recentCategories, setRecentCategories] = useState<string[]>([]);
  const [currency, setCurrency] = useState<string>(defaultCurrency);
  const [totalContractAmount, setTotalContractAmount] = useState<number | string>('');
  const [estimatedHours, setEstimatedHours] = useState<number | string>('');

  // Calculate colors already used by existing clients (excluding current client if in existing mode)
  const usedClientColors = useMemo(() => {
    const used: string[] = [];
    existingClients.forEach((c) => {
      if (clientMode === 'existing' && c === selectedClient) {
        return;
      }
      used.push(getClientColor(c));
    });
    return used;
  }, [existingClients, clientMode, selectedClient]);

  const availableColors = useMemo(() => {
    return getAvailableClientColors(usedClientColors, clientColor);
  }, [usedClientColors, clientColor]);

  useEffect(() => {
    if (isOpen) {
      // Cleanly reset all form states every time the modal is opened
      setName('');
      setTotalContractAmount('');
      setEstimatedHours('');
      setCategory('');
      setNewClientName('');
      setCurrency(defaultCurrency || DEFAULT_CURRENCY);
      setRecentCategories(getRecentCategories().slice(0, 5));
      if (existingClients.length > 0) {
        setClientMode('existing');
        setSelectedClient(existingClients[0]);
        setClientColor(getClientColor(existingClients[0]));
      } else {
        setClientMode('new');
        setSelectedClient('');
        const initialAvail = getAvailableClientColors([]);
        setClientColor(initialAvail[0]?.hex || '#E11D48');
      }
    }
  }, [isOpen, existingClients, defaultCurrency]);

  // Update color when existing client changes
  const handleSelectClient = (client: string) => {
    setSelectedClient(client);
    setClientColor(getClientColor(client));
  };

  // Do not change color when typing in new client name input
  const handleNewClientChange = (val: string) => {
    setNewClientName(val);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalClient = clientMode === 'existing' && selectedClient.trim()
      ? selectedClient.trim()
      : newClientName.trim();

    if (!name.trim() || !finalClient) return;

    if (category.trim()) {
      saveRecentCategory(category.trim());
    }

    const finalColor = clientColor.trim().startsWith('#') ? clientColor.trim() : getClientColor(finalClient);
    saveClientColor(finalClient, finalColor);

    const parsedContractAmount = totalContractAmount === '' ? 0 : Number(totalContractAmount) || 0;
    const parsedEstimatedHours = estimatedHours === '' ? undefined : Number(estimatedHours);

    const newProject: Project = {
      id: `proj-${Date.now()}`,
      name: name.trim(),
      clientName: finalClient,
      category: category.trim() || 'General',
      feeType: 'fixed',
      totalContractAmount: parsedContractAmount,
      targetHourlyRate: 0,
      estimatedHours: parsedEstimatedHours,
      currency: currency.trim() || defaultCurrency || 'HKD',
      totalWorkedHours: 0,
      color: finalColor,
      clientColor: finalColor,
      status: 'active',
      isArchived: false,
      createdAt: `${new Date().getFullYear()}/${(new Date().getMonth() + 1).toString().padStart(2, '0')}/${new Date().getDate().toString().padStart(2, '0')}`,
    };

    onAddProject(newProject);
    setName('');
    setCategory('');
    setNewClientName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div
        className={`w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-6 pb-20 sm:pb-6 border shadow-2xl transition-all ${
          isWarm ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-600 text-white">
              <Briefcase size={18} />
            </div>
            <h3 className="font-bold text-base">建立新 Project</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-xs font-bold text-stone-500 dark:text-slate-400 mb-1">
              Project 名稱 <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="例：Pulse 官網改版、畫冊封面插畫"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border outline-none ${
                isWarm
                  ? 'bg-stone-50 border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
                  : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
              }`}
            />
          </div>

          {/* Client 階層式歸屬選擇 (現有 Client / 新增 Client) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-stone-500 dark:text-slate-400">
                所屬 Client (客戶) <span className="text-rose-500">*</span>
              </label>
              {existingClients.length > 0 && (
                <div className="flex items-center gap-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setClientMode('existing')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      clientMode === 'existing'
                        ? 'bg-emerald-600 text-white'
                        : isWarm
                        ? 'text-stone-600 hover:bg-stone-100'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    選擇現有 Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setClientMode('new')}
                    className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                      clientMode === 'new'
                        ? 'bg-emerald-600 text-white'
                        : isWarm
                        ? 'text-stone-600 hover:bg-stone-100'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    ＋ 新增 Client
                  </button>
                </div>
              )}
            </div>

            {clientMode === 'existing' && existingClients.length > 0 ? (
              <div>
                <select
                  value={selectedClient}
                  onChange={(e) => handleSelectClient(e.target.value)}
                  className={`w-full text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none cursor-pointer ${
                    isWarm
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                  }`}
                  required
                >
                  {existingClients.map((client, idx) => (
                    <option key={idx} value={client}>
                      👤 {client}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-stone-400 mt-1">
                  此 Project 將歸類於客戶「{selectedClient}」旗下
                </p>
              </div>
            ) : (
              <div>
                <input
                  type="text"
                  required
                  placeholder="例：Pulse Digital Ltd.、Acme Studio"
                  value={newClientName}
                  onChange={(e) => handleNewClientChange(e.target.value)}
                  className={`w-full text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border outline-none ${
                    isWarm
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
                <p className="text-[11px] text-stone-400 mt-1">
                  輸入新 Client 名稱，日後建立新 Project 可直接在清單中快速選取
                </p>
              </div>
            )}

            {/* Client 代表色 / 標籤顏色選擇器 */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Palette size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>客戶代表色 / 標籤顏色</span>
                </label>
                {/* Visual preview badge */}
                <div
                  className="px-2 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1.5 border"
                  style={{
                    backgroundColor: `${clientColor}18`,
                    color: clientColor,
                    borderColor: `${clientColor}40`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: clientColor }} />
                  <span>{clientMode === 'existing' ? selectedClient || '預覽' : newClientName || '預覽'}</span>
                </div>
              </div>

              {/* Preset Color Circles + Custom Hex Input */}
              <div className="flex items-center gap-2 flex-wrap mt-1">
                {availableColors.map((preset) => {
                  const isSelected = clientColor.toLowerCase() === preset.hex.toLowerCase();
                  return (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setClientColor(preset.hex)}
                      title={preset.name}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${
                        isSelected
                          ? 'ring-2 ring-offset-2 ring-emerald-500 scale-110 shadow-sm'
                          : 'hover:scale-105 opacity-85 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: preset.hex }}
                    >
                      {isSelected && <Check size={14} className="text-white drop-shadow-xs" strokeWidth={3} />}
                    </button>
                  );
                })}

                {/* Custom Color Picker input */}
                <div className="relative flex items-center ml-1">
                  <input
                    type="color"
                    value={clientColor.startsWith('#') ? clientColor : '#2563EB'}
                    onChange={(e) => setClientColor(e.target.value)}
                    className="w-7 h-7 rounded-full cursor-pointer opacity-0 absolute inset-0"
                    title="自訂色碼"
                  />
                  <div
                    className="w-7 h-7 rounded-full border border-dashed border-stone-400 dark:border-slate-600 flex items-center justify-center text-[10px] font-bold text-stone-500 dark:text-slate-400 hover:border-emerald-500 transition-colors pointer-events-none"
                    style={{
                      borderColor: !availableColors.some((c) => c.hex.toLowerCase() === clientColor.toLowerCase())
                        ? clientColor
                        : undefined,
                    }}
                  >
                    自訂
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 專案類型 / 領域 (選填) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-stone-500 dark:text-slate-400">
                專案類型 / 領域
              </label>
              <span className="text-[10px] text-stone-400 font-normal">選填</span>
            </div>
            <input
              type="text"
              placeholder="例：插畫、平面設計、排版..."
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={`w-full text-xs sm:text-sm rounded-xl px-3.5 py-2.5 border outline-none ${
                isWarm
                  ? 'bg-stone-50 border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
                  : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
              }`}
            />
            {/* 最近使用標籤 Chip Buttons (上限 5 個) */}
            {recentCategories.slice(0, 5).length > 0 && (
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] font-bold text-stone-400 flex items-center gap-1 shrink-0">
                  <Tag size={12} /> 最近使用：
                </span>
                {recentCategories.slice(0, 5).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setCategory(tag)}
                    className={`text-[11px] font-medium px-2.5 py-0.5 rounded-lg border transition-all cursor-pointer ${
                      category === tag
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : isWarm
                        ? 'bg-stone-100 hover:bg-stone-200 text-stone-700 border-stone-200'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* 財務與工時預算設定 */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-stone-500 dark:text-slate-400 flex items-center gap-1.5">
                  <Coins size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>專案幣別 (Currency) <span className="text-rose-500">*</span></span>
                </label>
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  {currency} ({getCurrencySymbol(currency)})
                </span>
              </div>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className={`w-full text-xs sm:text-sm font-bold rounded-xl px-3.5 py-2.5 border outline-none cursor-pointer ${
                  isWarm
                    ? 'bg-stone-50 border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
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

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-slate-400 mb-1">
                  專案合約總金額 ({currency}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  placeholder="例：25000"
                  value={totalContractAmount}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setTotalContractAmount(e.target.value === '' ? '' : e.target.value)}
                  className={`w-full text-xs sm:text-sm font-mono font-bold rounded-xl px-3.5 py-2.5 border outline-none ${
                    isWarm
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-500 dark:text-slate-400 mb-1">
                  建議總工時上限 (小時)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="例：35"
                  value={estimatedHours}
                  onFocus={(e) => e.target.select()}
                  onChange={(e) => setEstimatedHours(e.target.value === '' ? '' : e.target.value)}
                  className={`w-full text-xs sm:text-sm font-mono font-bold rounded-xl px-3.5 py-2.5 border outline-none ${
                    isWarm
                      ? 'bg-stone-50 border-stone-300 text-stone-900 focus:ring-2 focus:ring-emerald-500'
                      : 'bg-slate-950 border-slate-700 text-slate-100 focus:ring-2 focus:ring-emerald-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* 即時時薪試算提示 */}
          {Number(estimatedHours) > 0 && Number(totalContractAmount) > 0 ? (
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300">
              <span className="flex items-center gap-1.5 font-bold">
                <span>💡 預估目標時薪：</span>
                <span className="font-mono text-sm font-black text-emerald-700 dark:text-emerald-300">
                  {formatHourlyRate((Number(totalContractAmount) || 0) / Number(estimatedHours), currency)}
                </span>
              </span>
              <span className="text-[11px] opacity-80 font-mono">
                ({formatCurrency(Number(totalContractAmount) || 0, currency)} ÷ {Number(estimatedHours)}h)
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-stone-400">
              💡 系統將根據「合約總額 ÷ 實質累計工時」動態計算即時時薪，無需手動設定時薪費率。
            </p>
          )}

          <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                isWarm ? 'bg-stone-100 text-stone-700 hover:bg-stone-200' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs cursor-pointer"
            >
              建立 Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
