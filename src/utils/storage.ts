import { Project, TimeSession, FreelancerProfile, ClientProfile } from '../types';

export const LOCAL_STORAGE_KEYS = {
  PROJECTS: 'freelanceflow_projects_v1',
  SESSIONS: 'freelanceflow_sessions_v1',
  CHAT_MESSAGES: 'freelanceflow_chat_messages_v1',
  TIMER_STATE: 'freelanceflow_timer_state_v1',
  FREELANCER_PROFILE: 'freelanceflow_freelancer_profile_v1',
  CLIENT_PROFILE: 'freelanceflow_client_profile_v1',
  INVOICE_CONFIG: 'freelanceflow_invoice_config_v1',
  ACTIVE_PROJECT_ID: 'freelanceflow_active_project_id_v1',
  RECENT_CATEGORIES: 'freelife_recent_categories_v1',
  SHOW_HOURLY_RATE: 'freelife_show_hourly_rate_v1',
  HOURLY_RATE_VISIBILITY_MAP: 'freelife_hourly_rate_visibility_map_v1',
  CLIENT_COLORS: 'freelife_client_colors_v1',
  HAS_SEEN_BACKUP_TOAST: 'freelife_has_seen_backup_toast_v1',
};

export const DEFAULT_RECENT_CATEGORIES = [
  '書籍排版',
  '網頁設計',
  '品牌識別',
  '插畫設計',
  'UI/UX',
];

export function getRecentCategories(): string[] {
  const list = loadFromLocalStorage<string[]>(LOCAL_STORAGE_KEYS.RECENT_CATEGORIES, DEFAULT_RECENT_CATEGORIES);
  return (Array.isArray(list) && list.length > 0 ? list : DEFAULT_RECENT_CATEGORIES).slice(0, 5);
}

export function saveRecentCategory(newCategory: string): string[] {
  const trimmed = newCategory.trim();
  if (!trimmed) return getRecentCategories();
  const current = getRecentCategories();
  const updated = [trimmed, ...current.filter((c) => c.toLowerCase() !== trimmed.toLowerCase())].slice(0, 5);
  saveToLocalStorage(LOCAL_STORAGE_KEYS.RECENT_CATEGORIES, updated);
  return updated;
}

export const DEFAULT_FREELANCER_PROFILE: FreelancerProfile = {
  name: '',
  title: '',
  email: '',
  paymentInfo: '',
};

export const DEFAULT_CLIENT_PROFILE: ClientProfile = {
  clientName: '',
  companyName: '',
  email: '',
  paymentTerms: '收到請款單後 7 日內 (Net 7)',
  notes: '',
};

// Safe JSON parser with fallback
export function loadFromLocalStorage<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (e) {
    console.error(`Failed to load key "${key}" from localStorage:`, e);
    return fallback;
  }
}

// Safe JSON setter
export function saveToLocalStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(`Failed to save key "${key}" to localStorage:`, e);
  }
}

// Clear all app data
export function clearAllLocalStorage(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEYS.PROJECTS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSIONS);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CHAT_MESSAGES);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.TIMER_STATE);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.FREELANCER_PROFILE);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.CLIENT_PROFILE);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.INVOICE_CONFIG);
    localStorage.removeItem(LOCAL_STORAGE_KEYS.ACTIVE_PROJECT_ID);
  } catch (e) {
    console.error('Failed to clear localStorage:', e);
  }
}
