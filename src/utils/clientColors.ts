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

/**
 * 6 Master Distinct Hue Client Colors (No duplicate hues - Red, Yellow/Amber, Blue, Purple, Teal, Magenta Pink)
 */
export const DISTINCT_CLIENT_COLORS: ColorPreset[] = [
  {
    name: '鮮紅',
    hex: '#E11D48',
    bgLight: 'bg-rose-50',
    textLight: 'text-rose-700',
    bgDark: 'dark:bg-rose-950/60',
    textDark: 'dark:text-rose-300',
    borderLight: 'border-rose-200',
    borderDark: 'dark:border-rose-800',
  },
  {
    name: '暖黃',
    hex: '#D97706',
    bgLight: 'bg-amber-50',
    textLight: 'text-amber-700',
    bgDark: 'dark:bg-amber-950/60',
    textDark: 'dark:text-amber-300',
    borderLight: 'border-amber-200',
    borderDark: 'dark:border-amber-800',
  },
  {
    name: '電光藍',
    hex: '#2563EB',
    bgLight: 'bg-blue-50',
    textLight: 'text-blue-700',
    bgDark: 'dark:bg-blue-950/60',
    textDark: 'dark:text-blue-300',
    borderLight: 'border-blue-200',
    borderDark: 'dark:border-blue-800',
  },
  {
    name: '霓虹紫',
    hex: '#9333EA',
    bgLight: 'bg-purple-50',
    textLight: 'text-purple-700',
    bgDark: 'dark:bg-purple-950/60',
    textDark: 'dark:text-purple-300',
    borderLight: 'border-purple-200',
    borderDark: 'dark:border-purple-800',
  },
  {
    name: '湖水綠',
    hex: '#0D9488',
    bgLight: 'bg-teal-50',
    textLight: 'text-teal-700',
    bgDark: 'dark:bg-teal-950/60',
    textDark: 'dark:text-teal-300',
    borderLight: 'border-teal-200',
    borderDark: 'dark:border-teal-800',
  },
  {
    name: '洋紅',
    hex: '#D946EF',
    bgLight: 'bg-fuchsia-50',
    textLight: 'text-fuchsia-700',
    bgDark: 'dark:bg-fuchsia-950/60',
    textDark: 'dark:text-fuchsia-300',
    borderLight: 'border-fuchsia-200',
    borderDark: 'dark:border-fuchsia-800',
  },
];

export const PRESET_CLIENT_COLORS: ColorPreset[] = DISTINCT_CLIENT_COLORS;
export const SAFE_CLIENT_COLOR_POOL: ColorPreset[] = DISTINCT_CLIENT_COLORS;

/**
 * Dynamic color filtering and fallback:
 * Excludes used colors by other clients and fills up strictly from the 6 distinct hues
 * to ensure no duplicate hues (never two blues or two purples).
 */
export function getAvailableClientColors(
  usedColorsHex: string[] = [],
  currentColorHex?: string
): ColorPreset[] {
  const normalizedUsed = new Set(
    usedColorsHex.map((c) => c.toLowerCase().trim()).filter(Boolean)
  );
  const normalizedCurrent = (currentColorHex || '').toLowerCase().trim();

  const available: ColorPreset[] = [];
  
  // 1. First add distinct colors that are not yet used (or are the current selected color)
  for (const preset of DISTINCT_CLIENT_COLORS) {
    const hex = preset.hex.toLowerCase();
    if (!normalizedUsed.has(hex) || hex === normalizedCurrent) {
      available.push(preset);
    }
  }

  // 2. If available is less than 6, fill with the remaining distinct colors from the 6-set
  if (available.length < 6) {
    for (const preset of DISTINCT_CLIENT_COLORS) {
      if (!available.some((a) => a.hex.toLowerCase() === preset.hex.toLowerCase())) {
        available.push(preset);
        if (available.length === 6) break;
      }
    }
  }

  return available.slice(0, 6);
}

/**
 * Hash string to pick deterministic color from presets
 */
export function getHashColor(str: string): string {
  if (!str) return DISTINCT_CLIENT_COLORS[0].hex;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DISTINCT_CLIENT_COLORS.length;
  return DISTINCT_CLIENT_COLORS[index].hex;
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

