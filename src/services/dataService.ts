import { Project, TimeSession, FreelancerProfile } from '../types';
import { LOCAL_STORAGE_KEYS, loadFromLocalStorage, saveToLocalStorage, clearAllLocalStorage } from '../utils/storage';

/**
 * Data Service API - Abstraction Layer for Local Storage with Cloud Sync Readiness (Supabase/Firebase Adapter Ready)
 */
export const dataService = {
  // Projects API
  async getProjects(): Promise<Project[]> {
    return loadFromLocalStorage<Project[]>(LOCAL_STORAGE_KEYS.PROJECTS, []);
  },
  async saveProjects(projects: Project[]): Promise<void> {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.PROJECTS, projects);
  },

  // Time Sessions API
  async getSessions(): Promise<TimeSession[]> {
    return loadFromLocalStorage<TimeSession[]>(LOCAL_STORAGE_KEYS.SESSIONS, []);
  },
  async saveSessions(sessions: TimeSession[]): Promise<void> {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.SESSIONS, sessions);
  },

  // Freelancer Profile API
  async getFreelancerProfile(): Promise<FreelancerProfile> {
    return loadFromLocalStorage<FreelancerProfile>(LOCAL_STORAGE_KEYS.FREELANCER_PROFILE, {
      name: '',
      title: '',
      email: '',
      paymentInfo: '',
    });
  },
  async saveFreelancerProfile(profile: FreelancerProfile): Promise<void> {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.FREELANCER_PROFILE, profile);
  },

  // Active Project ID
  async getActiveProjectId(): Promise<string> {
    return loadFromLocalStorage<string>(LOCAL_STORAGE_KEYS.ACTIVE_PROJECT_ID, '');
  },
  async saveActiveProjectId(id: string): Promise<void> {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.ACTIVE_PROJECT_ID, id);
  },

  // Hourly Rate Visibility Map
  async getHourlyRateVisibilityMap(): Promise<Record<string, boolean>> {
    return loadFromLocalStorage<Record<string, boolean>>(LOCAL_STORAGE_KEYS.HOURLY_RATE_VISIBILITY_MAP, {});
  },
  async saveHourlyRateVisibilityMap(map: Record<string, boolean>): Promise<void> {
    saveToLocalStorage(LOCAL_STORAGE_KEYS.HOURLY_RATE_VISIBILITY_MAP, map);
  },

  // Clear all data
  async clearAll(): Promise<void> {
    clearAllLocalStorage();
  }
};
