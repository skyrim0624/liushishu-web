import { DEFAULT_REMINDER_TIMES, REMINDER_LABELS } from "../constants";
import type { CheckinEntry, ReminderInfo } from "../types";

export const formatCurrency = (amount: number) => Number(amount || 0).toLocaleString("zh-CN");

export const padDatePart = (value: number) => String(value).padStart(2, "0");

export const toDateKey = (date: Date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;

export const formatTimelineDateLabel = (date: Date) =>
  date.toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", weekday: "short" });

export const isSameMonth = (date: Date, target: Date) =>
  date.getFullYear() === target.getFullYear() && date.getMonth() === target.getMonth();

export const parseSelectedDate = (dateKey: string) => {
  const today = new Date();
  if (!dateKey) return today;
  const [year, month, day] = dateKey.split("-").map((item) => parseInt(item, 10));
  if (!year || !month || !day) return today;
  return new Date(year, month - 1, day);
};

export const entriesForDate = (entries: CheckinEntry[], targetDate: Date) =>
  entries.filter((entry) => toDateKey(new Date(entry.created_at || Date.now())) === toDateKey(targetDate));

export const timeToMinutes = (time: string) => {
  const [hours, minutes] = String(time || "00:00")
    .split(":")
    .map((item) => parseInt(item, 10) || 0);
  return hours * 60 + minutes;
};

export const normalizeReminderTimes = (input: unknown) => {
  if (!Array.isArray(input)) return [...DEFAULT_REMINDER_TIMES];
  const values = input
    .map((item) => (typeof item === "string" ? item : (item as { time?: string })?.time))
    .filter(Boolean) as string[];
  return DEFAULT_REMINDER_TIMES.map((time, index) => values[index] || time);
};

export const minutesToCountdown = (minutes: number) => {
  if (minutes <= 0) return "现在就是最合适的记录时刻。";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) return `${hours} 小时 ${mins} 分钟后提醒你进入下一次记录。`;
  return `${mins} 分钟后提醒你进入下一次记录。`;
};

export const getNextReminderInfo = (reminderTimes: string[]): ReminderInfo => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let chosenIndex = 0;
  let diff = 24 * 60;

  reminderTimes.forEach((time, index) => {
    const reminderMinutes = timeToMinutes(time);
    let currentDiff = reminderMinutes - nowMinutes;
    if (currentDiff < 0) currentDiff += 24 * 60;
    if (currentDiff < diff) {
      diff = currentDiff;
      chosenIndex = index;
    }
  });

  return {
    index: chosenIndex,
    label: REMINDER_LABELS[chosenIndex],
    time: reminderTimes[chosenIndex],
    countdown: minutesToCountdown(diff)
  };
};

export const getCurrentSlotInfo = (reminderTimes: string[]): ReminderInfo => {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  let slotIndex = 0;
  reminderTimes.forEach((time, index) => {
    if (nowMinutes >= timeToMinutes(time)) slotIndex = index;
  });
  return {
    index: slotIndex,
    label: REMINDER_LABELS[slotIndex],
    time: reminderTimes[slotIndex],
    countdown: ""
  };
};
