export type Category = "wealth" | "kindness" | "health" | "debug";

export type Screen =
  | "auth"
  | "home"
  | "timeline"
  | "checkin"
  | "success"
  | "ai-insight"
  | "tutorial"
  | "bedtime"
  | "profile";

export type AuthMode = "login" | "register";

export interface TodayCounts {
  wealth: number;
  kindness: number;
  health: number;
  debug: number;
}

export interface CheckinEntry {
  id?: string;
  user_id: string | null;
  category: Category;
  money_amount: number;
  note: string;
  tags: string[];
  session_index: number;
  created_at?: string;
}

export interface BedtimeReview {
  created_at: string;
}

export interface AppState {
  currentScreen: Screen;
  hideNav: boolean;
  checkInCount: number;
  dailyTarget: number;
  reminderTimes: string[];
  currentOfferingPool: number;
  lifetimeOfferingAmount: number;
  selectedTags: string[];
  todayCounts: TodayCounts;
  timelineEntries: CheckinEntry[];
  userId: string | null;
  userEmail: string;
  category: Category;
  lifetimeXP: number;
  displayName: string;
  avatarUrl: string;
  authMode: AuthMode;
  currentSessionIndex: number;
  streakDays: number;
  successEntry: CheckinEntry | null;
  currentSlotIndex: number;
  selectedTimelineDateKey: string;
  authError: string;
  isAuthLoading: boolean;
  timerRunId: number;
}

export interface ReminderInfo {
  index: number;
  label: string;
  time: string;
  countdown: string;
}
