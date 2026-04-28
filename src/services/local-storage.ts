import { DEFAULT_REMINDER_TIMES } from "../constants";
import { normalizeReminderTimes } from "../lib/date";
import type { CheckinEntry } from "../types";

export interface LocalProfile {
  displayName: string;
  avatarUrl: string;
  reminderTimes: string[];
  currentOfferingPool: number;
}

export const localProfileKey = (identity: string, suffix: string) =>
  `liushishu:${identity || "guest"}:${suffix}`;

export const parseJsonArray = (value: string | null) => {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

export const loadLocalProfile = (identity: string): LocalProfile => {
  const localName = localStorage.getItem(localProfileKey(identity, "displayName")) || "";
  const localAvatarUrl = localStorage.getItem(localProfileKey(identity, "avatarUrl")) || "";
  const localTimes = parseJsonArray(localStorage.getItem(localProfileKey(identity, "reminderTimes")));
  const localPool = parseInt(localStorage.getItem(localProfileKey(identity, "currentOfferingPool")) || "0", 10);

  return {
    displayName: localName,
    avatarUrl: localAvatarUrl,
    reminderTimes: normalizeReminderTimes(localTimes || DEFAULT_REMINDER_TIMES),
    currentOfferingPool: Number.isNaN(localPool) ? 0 : localPool
  };
};

export const storeLocalProfile = (identity: string, profile: LocalProfile) => {
  localStorage.setItem(localProfileKey(identity, "displayName"), profile.displayName || "");
  localStorage.setItem(localProfileKey(identity, "avatarUrl"), profile.avatarUrl || "");
  localStorage.setItem(localProfileKey(identity, "reminderTimes"), JSON.stringify(profile.reminderTimes));
  localStorage.setItem(localProfileKey(identity, "currentOfferingPool"), String(profile.currentOfferingPool || 0));
};

export const loadCachedTimeline = (identity: string) =>
  (parseJsonArray(localStorage.getItem(localProfileKey(identity, "timelineEntries"))) || []) as CheckinEntry[];

export const storeCachedTimeline = (identity: string, entries: CheckinEntry[]) => {
  localStorage.setItem(localProfileKey(identity, "timelineEntries"), JSON.stringify(entries.slice(0, 50)));
};
