import { LOCAL_STORAGE_KEYS, loadFromLocalStorage, saveToLocalStorage } from './storage';
import { Project, TimeSession, FreelancerProfile } from '../types';

export interface BackupPayload {
  appName: string;
  version: string;
  exportedAt: string;
  stats: {
    projectCount: number;
    sessionCount: number;
  };
  data: {
    projects: Project[];
    sessions: TimeSession[];
    freelancerProfile: FreelancerProfile;
    clientColors?: Record<string, string>;
    hourlyRateVisibilityMap?: Record<string, boolean>;
    recentCategories?: string[];
  };
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  projectCount: number;
  sessionCount: number;
  hasProfile: boolean;
  exportedAt?: string;
  data?: BackupPayload['data'];
}

/**
 * Exports all application data into a single downloadable JSON backup file.
 */
export function exportBackupJSON(): { success: boolean; filename: string; projectCount: number; sessionCount: number } {
  try {
    const projects = loadFromLocalStorage<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, []);
    const sessions = loadFromLocalStorage<TimeSession[]>(LOCAL_STORAGE_KEYS.SESSIONS, []);
    const freelancerProfile = loadFromLocalStorage<FreelancerProfile>(LOCAL_STORAGE_KEYS.FREELANCER_PROFILE, {
      name: '',
      title: '',
      email: '',
      paymentInfo: '',
    });
    const clientColors = loadFromLocalStorage<Record<string, string>>(LOCAL_STORAGE_KEYS.CLIENT_COLORS, {});
    const hourlyRateVisibilityMap = loadFromLocalStorage<Record<string, boolean>>(
      LOCAL_STORAGE_KEYS.HOURLY_RATE_VISIBILITY_MAP,
      {}
    );
    const recentCategories = loadFromLocalStorage<string[]>(LOCAL_STORAGE_KEYS.RECENT_CATEGORIES, []);

    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const filename = `FreeLifeLog_Backup_${yyyy}${mm}${dd}.json`;

    const payload: BackupPayload = {
      appName: 'FreeLife Log',
      version: '1.0',
      exportedAt: now.toISOString(),
      stats: {
        projectCount: projects.length,
        sessionCount: sessions.length,
      },
      data: {
        projects,
        sessions,
        freelancerProfile,
        clientColors,
        hourlyRateVisibilityMap,
        recentCategories,
      },
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return {
      success: true,
      filename,
      projectCount: projects.length,
      sessionCount: sessions.length,
    };
  } catch (err) {
    console.error('Failed to export backup:', err);
    throw err;
  }
}

/**
 * Validates the uploaded JSON file content before restoring.
 */
export function validateBackupContent(contentStr: string): ValidationResult {
  try {
    const parsed = JSON.parse(contentStr);

    // Support both standardized BackupPayload and flat export structures
    let rawData: any = parsed;
    if (parsed && typeof parsed === 'object' && parsed.data && typeof parsed.data === 'object') {
      rawData = parsed.data;
    }

    const projects: Project[] = Array.isArray(rawData.projects) ? rawData.projects : [];
    const sessions: TimeSession[] = Array.isArray(rawData.sessions) ? rawData.sessions : [];
    const freelancerProfile: FreelancerProfile = rawData.freelancerProfile || {
      name: '',
      title: '',
      email: '',
      paymentInfo: '',
    };
    const clientColors = rawData.clientColors || {};
    const hourlyRateVisibilityMap = rawData.hourlyRateVisibilityMap || {};
    const recentCategories = Array.isArray(rawData.recentCategories) ? rawData.recentCategories : [];

    // Basic validity check: must be a JSON object and have valid structure
    if (!Array.isArray(projects) && !Array.isArray(sessions) && !rawData.freelancerProfile) {
      return {
        isValid: false,
        error: 'JSON 格式不符：未偵測到有效的 Project 清單或 Timesheet 紀錄。',
        projectCount: 0,
        sessionCount: 0,
        hasProfile: false,
      };
    }

    return {
      isValid: true,
      projectCount: projects.length,
      sessionCount: sessions.length,
      hasProfile: Boolean(freelancerProfile.name || freelancerProfile.title),
      exportedAt: parsed.exportedAt,
      data: {
        projects,
        sessions,
        freelancerProfile,
        clientColors,
        hourlyRateVisibilityMap,
        recentCategories,
      },
    };
  } catch (err: any) {
    return {
      isValid: false,
      error: `JSON 解析失敗：${err?.message || '檔案非標準 JSON 格式'}`,
      projectCount: 0,
      sessionCount: 0,
      hasProfile: false,
    };
  }
}

/**
 * Writes the validated data into localStorage.
 */
export function restoreBackupToStorage(data: BackupPayload['data']): void {
  if (!data) return;

  if (Array.isArray(data.projects)) {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.PROJECTS, data.projects);
  }
  if (Array.isArray(data.sessions)) {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.SESSIONS, data.sessions);
  }
  if (data.freelancerProfile) {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.FREELANCER_PROFILE, data.freelancerProfile);
  }
  if (data.clientColors) {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.CLIENT_COLORS, data.clientColors);
  }
  if (data.hourlyRateVisibilityMap) {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.HOURLY_RATE_VISIBILITY_MAP, data.hourlyRateVisibilityMap);
  }
  if (data.recentCategories && Array.isArray(data.recentCategories)) {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.RECENT_CATEGORIES, data.recentCategories);
  }

  // Set active project if there are projects
  if (data.projects && data.projects.length > 0) {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.ACTIVE_PROJECT_ID, data.projects[0].id);
  }
}
