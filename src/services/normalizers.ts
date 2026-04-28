import { CATEGORY_ALIASES } from "../constants";
import type { Category, CheckinEntry } from "../types";

export const normalizeCategory = (category: unknown): Category => {
  const value = String(category || "wealth");
  if (value === "wealth" || value === "kindness" || value === "health" || value === "debug") return value;
  return CATEGORY_ALIASES[value] || "wealth";
};

export const normalizeCheckinEntry = (entry: Record<string, unknown>): CheckinEntry => ({
  id: typeof entry.id === "string" ? entry.id : undefined,
  user_id: typeof entry.user_id === "string" ? entry.user_id : null,
  category: normalizeCategory(entry.category),
  money_amount: Number(entry.money_amount || 0),
  note: typeof entry.note === "string" ? entry.note : "",
  tags: Array.isArray(entry.tags) ? entry.tags.map(String) : [],
  session_index: Number(entry.session_index || 1),
  created_at: typeof entry.created_at === "string" ? entry.created_at : undefined
});
