import { loadFromLocalStorage, saveToLocalStorage, LOCAL_STORAGE_KEYS } from './storage';

export interface ColorPreset {
  name: string;
  hex: string;
  bgLight: string;
  textLight: string;
  bgDark: string;
  textDark: string;
  borderLight: string;
  borderDark: string;
}

export const PRESET_CLIENT_COLORS: ColorPreset[] = [
  {
    name: '鮮紅',
    hex: '#EF4444',
    bgLight: 'bg-red-50',
    textLight: 'text-red-700',
    bgDark: 'dark:bg-red-950/60',
    textDark: 'dark:text-red-300',
    borderLight: 'border-red-200',
    borderDark: 'dark:border-red-800',
  },
  {
    name: '桃粉',
    hex: '#EC4899',
    bgLight: 'bg-pink-50',
    textLight: 'text-pink-700',
    bgDark: 'dark:bg-pink-950/60',
    textDark: 'dark:text-pink-300',
    borderLight: 'border-pink-200',
    borderDark: 'dark:border-pink-800',
  },
  {
    name: '暖橙',
    hex: '#F97316',
    bgLight: 'bg-orange-50',
    textLight: 'text-orange-700',
    bgDark: 'dark:bg-orange-950/60',
    textDark: 'dark:text-orange-300',
    borderLight: 'border-orange-200',
    borderDark: 'dark:border-orange-800',
  },
  {
    name: '金黃',
    hex: '#F59E0B',
    bgLight: 'bg-amber-50',
    textLight: 'text-amber-700',
    bgDark: 'dark:bg-amber-950/60',
    textDark: 'dark:text-amber-300',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-800',
  },
  {
    name: '翡翠綠',
    hex: '#10B981',
    bgLight: 'bg-emerald-50',
    textLight: 'text-emerald-700',
    bgDark: 'dark:bg-emerald-950/60',
    textDark: 'dark:text-emerald-300',
    borderLight: 'border-emerald-200',
    borderDark: 'dark:border-emerald-800',
  },
  {
    name: '經典藍',
    hex: '#2563EB',
    bgLight: 'bg-blue-50',
    textLight: 'text-blue-700',
    bgDark: 'dark:bg-blue-950/60',
    textDark: 'dark:text-blue-300',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-800',
  },
  {
    name: '靛紫',
    hex: '#8B5CF6',
    bgLight: 'bg-purple-50',
    textLight: 'text-purple-700',
    bgDark: 'dark:bg-purple-950/60',
    textDark: 'dark:text-purple-300',
    borderLight: 'border-purple-200',
    borderDark: 'dark:border-purple-800',
  },
  {
    name: '深石灰',
    hex: '#6B7280',
    bgLight: 'bg-gray-100',
    textLight: 'text-gray-700',
    bgDark: 'dark:bg-gray-800/60',
    textDark: 'dark:text-gray-300',
    borderLight: 'border-gray-300',
    borderDark: 'dark:border-gray-700',
  },
];

/**
 * Hash string to pick deterministic color from presets
 */
export function getHashColor(str: string): string {
  if (!str) return PRESET_CLIENT_COLORS[0].hex;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % PRESET_CLIENT_COLORS.length;
  return PRESET_CLIENT_COLORS[index].hex;
}

/**
 * Get Client Color with fallback to stored client mapping or hash
 */
export function getClientColor(clientName: string, explicitColor?: string): string {
  if (explicitColor && explicitColor.trim() && explicitColor.startsWith('#')) {
    return explicitColor.trim();
  }
  const storedMap = loadFromLocalStorage<Record<string, string>>(LOCAL_STORAGE_KEYS.CLIENT_COLORS, {});
  if (clientName && storedMap[clientName.trim()]) {
    return storedMap[clientName.trim()];
  }
  return getHashColor(clientName || '');
}

/**
 * Save client color to global storage
 */
export function saveClientColor(clientName: string, colorHex: string): void {
  const trimmed = clientName.trim();
  if (!trimmed || !colorHex) return;
  const storedMap = loadFromLocalStorage<Record<string, string>>(LOCAL_STORAGE_KEYS.CLIENT_COLORS, {});
  storedMap[trimmed] = colorHex;
  saveToLocalStorage(LOCAL_STORAGE_KEYS.CLIENT_COLORS, storedMap);
}
