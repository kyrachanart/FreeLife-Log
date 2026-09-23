export type ProjectFeeType = 'fixed' | 'hourly';

export interface ProjectMemoItem {
  id: string;
  content: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  clientName: string;
  category: string;
  feeType: ProjectFeeType; // 'fixed' = Lump Sum 一口價, 'hourly' = 按時薪計鐘
  totalContractAmount: number; // For fixed fee (e.g. 38000 HKD)
  targetHourlyRate: number; // For fixed: 目標時薪底線; For hourly: 約定時薪 (e.g. 600 HKD/hr)
  estimatedHours?: number; // For hourly projects: Client 預算上限時數
  currency: string;
  totalWorkedHours: number; // 累計已投入工時 (小時)
  color: string;
  clientColor?: string;
  status: 'active' | 'completed' | 'paused';
  createdAt?: string;
  deadline?: string;
  memo?: string; // 專案專屬持久備忘筆記
  memos?: ProjectMemoItem[]; // 專案專屬備忘筆記歷史列表
  milestones?: { title: string; amount: number; completed: boolean }[];
  isArchived?: boolean; // 專案封存標記 (預設 false)
}

export interface BreakRecord {
  id: string;
  startTime: string;
  endTime?: string;
  durationMinutes: number;
  reason?: string;
}

export interface TimeSession {
  id: string;
  projectId: string;
  projectName: string;
  clientName: string;
  taskDescription: string;
  date: string; // YYYY-MM-DD (Start date in local time)
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime?: string; // HH:mm
  startISO?: string; // ISO 8601 UTC timestamp
  endISO?: string; // ISO 8601 UTC timestamp
  isCrossMidnight?: boolean; // Flag for cross-midnight sessions
  workDurationMinutes: number;
  breakDurationMinutes: number;
  effectiveHourlyRate: number;
  earnedAmount: number;
  status: 'running' | 'paused' | 'completed';
  tags: string[];
}

export interface AILogParseResult {
  projectName: string;
  clientName: string;
  taskDescription: string;
  workMinutes: number;
  breakMinutes: number;
  feeType: ProjectFeeType;
  estimatedRateOrIncome: number;
  confidence: number;
  suggestedAction: string;
}

export interface FreelancerProfile {
  name: string;
  title: string;
  email: string;
  paymentInfo: string; // FPS / 轉數快 / 銀行帳號
  phone?: string;
  defaultCurrency?: string; // e.g. 'HKD', 'USD', 'TWD', etc.
}

export interface ClientProfile {
  clientName: string;
  companyName?: string;
  email?: string;
  projectName?: string;
  feeType?: ProjectFeeType;
  paymentTerms: string;
  notes?: string;
}

export interface TimerBridge {
  isRunning: boolean;
  timerState?: 'idle' | 'working' | 'resting';
  projectId: string;
  projectName: string;
  elapsedFormatted: string;
  stopAndSave: (onComplete?: () => void) => void;
  discard: (onComplete?: () => void) => void;
}

export type ViewMode = 'all-screens' | 'interactive' | 'pm-spec' | 'design-system';

export interface ScreenMetadata {
  id: string;
  number: string;
  title: string;
  titleEn: string;
  category: string;
  purpose: string;
  badge: string;
  pmHighlights: string[];
  designHighlights: string[];
  devNotes: string[];
}
