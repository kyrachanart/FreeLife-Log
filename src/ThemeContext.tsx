import React, { createContext, useContext, useState } from 'react';

/**
 * Theme tokens for FreelanceFlow
 * Supports 'warm' (relaxing organic linen/matcha cream) and 'dark' (slate)
 */

export type AppTheme = 'warm' | 'dark';

export interface ThemeColors {
  id: AppTheme;
  name: string;
  desc: string;
  // Main app canvas
  pageBg: string;
  pageText: string;
  headerBg: string;
  headerBorder: string;
  cardBg: string;
  cardBorder: string;
  cardInnerBg: string;
  cardInnerBorder: string;
  textMuted: string;
  textHeading: string;
  accent: string;
  accentHover: string;
  accentText: string;
  accentLight: string;
  accentBorder: string;
  amberBg: string;
  amberBorder: string;
  amberText: string;
  // Phone simulation specific
  phoneOuter: string;
  phoneScreenBg: string;
  phoneScreenText: string;
  phoneIslandBg: string;
  phoneSubCardBg: string;
  phoneSubCardBorder: string;
}

export const THEME_CONFIGS: Record<AppTheme, ThemeColors> = {
  warm: {
    id: 'warm',
    name: '日光舒緩 (Warm Sage & Linen)',
    desc: '柔和無壓力的日系舒壓色調，淺燕麥暖白搭配森林抹茶綠與暖陶琥珀，長時間工作注視溫柔不刺眼',
    pageBg: 'bg-[#F9F8F6]',
    pageText: 'text-stone-800',
    headerBg: 'bg-[#F9F8F6]/90',
    headerBorder: 'border-stone-200/80',
    cardBg: 'bg-white',
    cardBorder: 'border-stone-200/90 shadow-sm shadow-stone-200/50',
    cardInnerBg: 'bg-stone-50',
    cardInnerBorder: 'border-stone-200/70',
    textMuted: 'text-stone-500',
    textHeading: 'text-stone-900',
    accent: 'bg-emerald-600',
    accentHover: 'hover:bg-emerald-700',
    accentText: 'text-emerald-700',
    accentLight: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    accentBorder: 'border-emerald-300',
    amberBg: 'bg-amber-50',
    amberBorder: 'border-amber-200',
    amberText: 'text-amber-800',
    phoneOuter: 'bg-stone-200/80 ring-stone-300',
    phoneScreenBg: 'bg-[#FAF8F5]',
    phoneScreenText: 'text-stone-800',
    phoneIslandBg: 'bg-stone-800',
    phoneSubCardBg: 'bg-white',
    phoneSubCardBorder: 'border-stone-200',
  },
  dark: {
    id: 'dark',
    name: '深邃暗夜 (Night Slate)',
    desc: '沉浸專注的深石墨黑灰色系',
    pageBg: 'bg-slate-950',
    pageText: 'text-slate-100',
    headerBg: 'bg-slate-950/85',
    headerBorder: 'border-slate-800/80',
    cardBg: 'bg-slate-900/90',
    cardBorder: 'border-slate-800',
    cardInnerBg: 'bg-slate-950/70',
    cardInnerBorder: 'border-slate-800/70',
    textMuted: 'text-slate-400',
    textHeading: 'text-slate-100',
    accent: 'bg-emerald-600',
    accentHover: 'hover:bg-emerald-500',
    accentText: 'text-emerald-400',
    accentLight: 'bg-emerald-950/80 text-emerald-300 border-emerald-800',
    accentBorder: 'border-emerald-600/50',
    amberBg: 'bg-amber-950/70',
    amberBorder: 'border-amber-800/80',
    amberText: 'text-amber-300',
    phoneOuter: 'bg-slate-900 ring-slate-800',
    phoneScreenBg: 'bg-slate-950',
    phoneScreenText: 'text-slate-100',
    phoneIslandBg: 'bg-black',
    phoneSubCardBg: 'bg-slate-900/90',
    phoneSubCardBorder: 'border-slate-800',
  },
};

interface ThemeContextType {
  theme: AppTheme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: AppTheme) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: 'warm',
  colors: THEME_CONFIGS.warm,
  toggleTheme: () => {},
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to 'warm' as requested: "令人放鬆舒服的感覺，黑底令我感到有壓力"
  const [theme, setThemeState] = useState<AppTheme>('warm');

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'warm' ? 'dark' : 'warm'));
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
  };

  const colors = THEME_CONFIGS[theme];

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
