import React, { useState, useEffect } from 'react';
import { User, X, CheckCircle2, Briefcase } from 'lucide-react';
import { FreelancerProfile } from '../../types';
import { useTheme } from '../../ThemeContext';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: FreelancerProfile;
  onSaveProfile: (profile: FreelancerProfile) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
}) => {
  const { theme } = useTheme();
  const isWarm = theme === 'warm';

  const [name, setName] = useState(profile.name || '');
  const [title, setTitle] = useState(profile.title || '');

  useEffect(() => {
    setName(profile.name || '');
    setTitle(profile.title || '');
  }, [profile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...profile,
      name: name.trim(),
      title: title.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md max-h-[85vh] overflow-y-auto rounded-3xl p-6 sm:p-7 pb-20 sm:pb-7 shadow-2xl border transition-all ${
          isWarm ? 'bg-white border-stone-200 text-stone-900' : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-slate-800 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-emerald-600 text-white shadow-md shadow-emerald-600/20">
              <User size={18} />
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg">個人資訊與製表人設定</h3>
              <p className="text-xs text-stone-500 dark:text-slate-400">
                設定姓名與職業，將自動同步至 Timesheet 文字及圖片匯出抬頭
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
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
      </div>
    </div>
  );
};
