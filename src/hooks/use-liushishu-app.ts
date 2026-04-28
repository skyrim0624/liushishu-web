import { useCallback, useEffect, useMemo, useState } from "react";
import { DAILY_TARGET, DEFAULT_REMINDER_TIMES, EMPTY_TODAY_COUNTS } from "../constants";
import { getCurrentSlotInfo, normalizeReminderTimes, toDateKey } from "../lib/date";
import { supabase } from "../lib/supabase";
import { loadCachedTimeline, loadLocalProfile, storeCachedTimeline, storeLocalProfile } from "../services/local-storage";
import { normalizeCheckinEntry } from "../services/normalizers";
import type { AppState, Category, CheckinEntry, Screen } from "../types";

const initialState: AppState = {
  currentScreen: "auth",
  hideNav: true,
  checkInCount: 0,
  dailyTarget: DAILY_TARGET,
  reminderTimes: [...DEFAULT_REMINDER_TIMES],
  currentOfferingPool: 0,
  lifetimeOfferingAmount: 0,
  selectedTags: [],
  todayCounts: { ...EMPTY_TODAY_COUNTS },
  timelineEntries: [],
  userId: null,
  userEmail: "",
  category: "wealth",
  lifetimeXP: 0,
  displayName: "",
  avatarUrl: "",
  authMode: "login",
  currentSessionIndex: 1,
  streakDays: 0,
  successEntry: null,
  currentSlotIndex: 0,
  selectedTimelineDateKey: "",
  authError: "",
  isAuthLoading: false,
  timerRunId: 0
};

const profileIdentity = (state: Pick<AppState, "userId" | "userEmail">) => state.userId || state.userEmail || "guest";

const isMissingAvatarColumn = (error: unknown) => {
  const item = error as { message?: string; details?: string };
  const message = `${item?.message || ""} ${item?.details || ""}`;
  return /avatar_url|schema cache|column/i.test(message) && /not|missing|could not find|does not exist/i.test(message);
};

const toProfilePayload = (state: AppState) => ({
  id: state.userId,
  display_name: state.displayName || "记录者",
  avatar_url: state.avatarUrl || "",
  reminder_times: state.reminderTimes,
  current_offering_pool: state.currentOfferingPool || 0
});

const emptyHistoryPatch = {
  todayCounts: { ...EMPTY_TODAY_COUNTS },
  checkInCount: 0,
  currentSessionIndex: 1,
  timelineEntries: [],
  streakDays: 0,
  lifetimeXP: 0,
  lifetimeOfferingAmount: 0
};

export const useLiushishuApp = () => {
  const [state, setState] = useState<AppState>(initialState);

  const persistLocalProfile = useCallback((nextState: AppState) => {
    storeLocalProfile(profileIdentity(nextState), {
      displayName: nextState.displayName,
      avatarUrl: nextState.avatarUrl,
      reminderTimes: nextState.reminderTimes,
      currentOfferingPool: nextState.currentOfferingPool
    });
  }, []);

  const upsertProfile = useCallback(async (nextState: AppState) => {
    if (!nextState.userId) return;
    const payload = toProfilePayload(nextState);
    const { error } = await supabase.from("profiles").upsert([payload], { onConflict: "id" });
    if (!error) return;
    if (!isMissingAvatarColumn(error)) throw error;
    const { avatar_url: _avatarUrl, ...fallbackPayload } = payload;
    const fallback = await supabase.from("profiles").upsert([fallbackPayload], { onConflict: "id" });
    if (fallback.error) throw fallback.error;
  }, []);

  const showScreen = useCallback((screen: Screen, hideNav = false) => {
    setState((previous) => {
      const isBlocked = screen !== "auth" && !previous.userId;
      const nextScreen = isBlocked ? "auth" : screen;
      const isAuthScreen = nextScreen === "auth";
      return {
        ...previous,
        currentScreen: nextScreen,
        hideNav: hideNav || isAuthScreen
      };
    });
    requestAnimationFrame(() => {
      document.getElementById("app")?.scrollTo({ top: 0, behavior: "auto" });
      window.scrollTo({ top: 0, behavior: "auto" });
    });
  }, []);

  const loadProfile = useCallback(
    async (baseState: AppState) => {
      const identity = profileIdentity(baseState);
      const localProfile = loadLocalProfile(identity);
      let nextState: AppState = {
        ...baseState,
        displayName: localProfile.displayName || baseState.displayName || baseState.userEmail.split("@")[0] || "记录者",
        avatarUrl: localProfile.avatarUrl || baseState.avatarUrl,
        reminderTimes: normalizeReminderTimes(localProfile.reminderTimes),
        currentOfferingPool: localProfile.currentOfferingPool || baseState.currentOfferingPool
      };

      try {
        let { data, error } = await supabase
          .from("profiles")
          .select("display_name, avatar_url, reminder_times, current_offering_pool")
          .eq("id", nextState.userId)
          .maybeSingle();

        if (error && isMissingAvatarColumn(error)) {
          const fallback = await supabase
            .from("profiles")
            .select("display_name, reminder_times, current_offering_pool")
            .eq("id", nextState.userId)
            .maybeSingle();
          data = fallback.data as typeof data;
          error = fallback.error;
        }
        if (error) throw error;

        const profile = data as
          | {
              display_name?: string;
              avatar_url?: string;
              reminder_times?: unknown;
              current_offering_pool?: number;
            }
          | null;

        if (profile) {
          nextState = {
            ...nextState,
            displayName: profile.display_name || nextState.displayName,
            avatarUrl: profile.avatar_url || nextState.avatarUrl,
            reminderTimes: normalizeReminderTimes(profile.reminder_times),
            currentOfferingPool: Number(profile.current_offering_pool || 0)
          };
        } else {
          await upsertProfile(nextState);
        }
      } catch (error) {
        console.warn("Profile load failed, using local fallback.", error);
      }

      persistLocalProfile(nextState);
      setState(nextState);
      return nextState;
    },
    [persistLocalProfile, upsertProfile]
  );

  const loadHistoryAndToday = useCallback(async (baseState: AppState) => {
    if (!baseState.userId) {
      const nextState = { ...baseState, ...emptyHistoryPatch };
      setState(nextState);
      return nextState;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    try {
      const { data: checkins, error: checkinsError } = await supabase
        .from("checkins")
        .select("*")
        .eq("user_id", baseState.userId)
        .order("created_at", { ascending: false })
        .limit(300);
      if (checkinsError) throw checkinsError;

      const { data: reviews, error: reviewsError } = await supabase
        .from("bedtime_reviews")
        .select("created_at")
        .eq("user_id", baseState.userId)
        .order("created_at", { ascending: false })
        .limit(120);
      if (reviewsError) throw reviewsError;

      const entries = ((checkins || []) as Record<string, unknown>[]).map(normalizeCheckinEntry);
      const todayCounts = { ...EMPTY_TODAY_COUNTS };
      const todayEntries = entries.filter((entry) => new Date(entry.created_at || Date.now()) >= todayStart);
      todayEntries.forEach((entry) => {
        todayCounts[entry.category] = (todayCounts[entry.category] || 0) + 1;
      });

      const historyOffering = entries.reduce((sum, entry) => sum + Number(entry.money_amount || 0), 0);
      const allDates = new Set<string>();
      [...entries, ...((reviews || []) as { created_at?: string }[])].forEach((item) => {
        if (!item?.created_at) return;
        allDates.add(toDateKey(new Date(item.created_at)));
      });

      let streakDays = 0;
      const pointer = new Date();
      while (allDates.has(toDateKey(pointer))) {
        streakDays += 1;
        pointer.setDate(pointer.getDate() - 1);
      }

      let currentOfferingPool = baseState.currentOfferingPool;
      if (currentOfferingPool === 0) {
        const { data: profilePool } = await supabase
          .from("profiles")
          .select("current_offering_pool")
          .eq("id", baseState.userId)
          .maybeSingle();
        const pool = profilePool as { current_offering_pool?: number } | null;
        if (pool?.current_offering_pool != null) currentOfferingPool = Number(pool.current_offering_pool);
      }

      const nextState: AppState = {
        ...baseState,
        todayCounts,
        checkInCount: todayEntries.length,
        currentSessionIndex: Math.min(todayEntries.length + 1, DAILY_TARGET),
        timelineEntries: entries,
        lifetimeXP: entries.length * 10 + ((reviews || []) as unknown[]).length * 20,
        lifetimeOfferingAmount: historyOffering,
        currentOfferingPool,
        streakDays
      };
      storeCachedTimeline(profileIdentity(nextState), entries);
      setState(nextState);
      return nextState;
    } catch (error) {
      console.warn("Failed to load checkins from Supabase.", error);
      const cachedEntries = loadCachedTimeline(profileIdentity(baseState));
      const nextState = { ...baseState, timelineEntries: cachedEntries };
      setState(nextState);
      return nextState;
    }
  }, []);

  const onAuthSuccess = useCallback(
    async (user: { id: string; email?: string | null }) => {
      const baseState: AppState = {
        ...initialState,
        userId: user.id,
        userEmail: user.email || "",
        displayName: user.email?.split("@")[0] || "记录者",
        currentScreen: "home",
        hideNav: false
      };
      const withProfile = await loadProfile(baseState);
      const withHistory = await loadHistoryAndToday(withProfile);
      setState({ ...withHistory, currentScreen: "home", hideNav: false });
    },
    [loadHistoryAndToday, loadProfile]
  );

  const restoreSession = useCallback(async () => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession();
      if (session?.user) {
        await onAuthSuccess(session.user);
        return;
      }
    } catch (error) {
      console.warn("Session restore failed.", error);
    }

    const localProfile = loadLocalProfile("guest");
    setState((previous) => ({
      ...previous,
      displayName: localProfile.displayName,
      avatarUrl: localProfile.avatarUrl,
      reminderTimes: localProfile.reminderTimes,
      currentOfferingPool: localProfile.currentOfferingPool,
      currentScreen: "auth",
      hideNav: true
    }));
  }, [onAuthSuccess]);

  useEffect(() => {
    void restoreSession();
  }, [restoreSession]);

  const toggleAuthMode = useCallback(() => {
    setState((previous) => ({
      ...previous,
      authMode: previous.authMode === "login" ? "register" : "login",
      authError: ""
    }));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      if (!email || !password) {
        setState((previous) => ({ ...previous, authError: "请填写邮箱和密码" }));
        return;
      }
      setState((previous) => ({ ...previous, isAuthLoading: true, authError: "" }));
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.user) await onAuthSuccess(data.user);
      } catch (error) {
        const item = error as { message?: string };
        const message = item.message?.includes("Invalid login")
          ? "邮箱或密码不正确"
          : item.message || "登录失败，请重试";
        setState((previous) => ({ ...previous, authError: message }));
      } finally {
        setState((previous) => ({ ...previous, isAuthLoading: false }));
      }
    },
    [onAuthSuccess]
  );

  const register = useCallback(
    async (email: string, password: string, displayName: string) => {
      if (state.authMode === "login") {
        toggleAuthMode();
        return;
      }
      if (!email || !password) {
        setState((previous) => ({ ...previous, authError: "请填写邮箱和密码" }));
        return;
      }
      if (password.length < 6) {
        setState((previous) => ({ ...previous, authError: "密码至少需要 6 位" }));
        return;
      }

      setState((previous) => ({ ...previous, isAuthLoading: true, authError: "" }));
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user) {
          const localState: AppState = {
            ...state,
            userId: data.user.id,
            userEmail: email,
            displayName: displayName || email.split("@")[0]
          };
          persistLocalProfile(localState);
          if (data.session) {
            await onAuthSuccess(data.user);
          } else {
            setState((previous) => ({
              ...previous,
              authMode: "login",
              authError: "注册成功，请先到邮箱确认后再登录"
            }));
          }
        }
      } catch (error) {
        const item = error as { message?: string };
        const message = item.message?.includes("already registered")
          ? "该邮箱已注册，请直接登录"
          : item.message || "注册失败，请重试";
        setState((previous) => ({ ...previous, authError: message }));
      } finally {
        setState((previous) => ({ ...previous, isAuthLoading: false }));
      }
    },
    [onAuthSuccess, persistLocalProfile, state, toggleAuthMode]
  );

  const saveProfileName = useCallback(
    async (displayName: string) => {
      const nextName = displayName.trim();
      if (!nextName) return "昵称不能为空";
      const nextState = { ...state, displayName: nextName };
      setState(nextState);
      persistLocalProfile(nextState);
      try {
        await upsertProfile(nextState);
      } catch (error) {
        console.warn("Profile name save failed.", error);
      }
      return "昵称已保存";
    },
    [persistLocalProfile, state, upsertProfile]
  );

  const saveAvatar = useCallback(
    async (avatarUrl: string) => {
      const nextState = { ...state, avatarUrl };
      setState(nextState);
      persistLocalProfile(nextState);
      await upsertProfile(nextState);
      return "头像已保存";
    },
    [persistLocalProfile, state, upsertProfile]
  );

  const saveReminderTimes = useCallback(
    async (reminderTimes: string[]) => {
      const nextState = { ...state, reminderTimes: normalizeReminderTimes(reminderTimes) };
      setState(nextState);
      persistLocalProfile(nextState);
      try {
        await upsertProfile(nextState);
      } catch (error) {
        console.warn("Reminder save failed.", error);
      }
      return "六次提醒已保存";
    },
    [persistLocalProfile, state, upsertProfile]
  );

  const prepareCheckin = useCallback(
    (category: Category) => {
      const slot = getCurrentSlotInfo(state.reminderTimes);
      setState((previous) => ({
        ...previous,
        category,
        selectedTags: [],
        currentSlotIndex: slot.index,
        currentScreen: "checkin",
        hideNav: true,
        timerRunId: previous.timerRunId + 1
      }));
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "auto" }));
    },
    [state.reminderTimes]
  );

  const toggleTag = useCallback((tag: string) => {
    setState((previous) => {
      const exists = previous.selectedTags.includes(tag);
      return {
        ...previous,
        selectedTags: exists ? previous.selectedTags.filter((item) => item !== tag) : [...previous.selectedTags, tag]
      };
    });
  }, []);

  const saveCurrentOfferingPool = useCallback(
    async (nextState: AppState) => {
      persistLocalProfile(nextState);
      try {
        await upsertProfile(nextState);
      } catch (error) {
        console.warn("Saving offering pool failed.", error);
      }
    },
    [persistLocalProfile, upsertProfile]
  );

  const submitCheckin = useCallback(
    async (note: string, moneyAmount: number) => {
      const entry: CheckinEntry = {
        user_id: state.userId,
        category: state.category,
        money_amount: state.category === "wealth" ? Number(moneyAmount || 0) : 0,
        note: note.trim(),
        tags: state.selectedTags,
        session_index: state.currentSessionIndex,
        created_at: new Date().toISOString()
      };

      if (state.userId) {
        try {
          await supabase.from("checkins").insert([
            {
              user_id: entry.user_id,
              category: entry.category,
              money_amount: entry.money_amount,
              note: entry.note,
              tags: entry.tags,
              session_index: entry.session_index
            }
          ]);
        } catch (error) {
          console.warn("Checkin insert failed, keeping local state only.", error);
        }
      }

      const nextState: AppState = {
        ...state,
        timelineEntries: [entry, ...state.timelineEntries],
        todayCounts: {
          ...state.todayCounts,
          [entry.category]: (state.todayCounts[entry.category] || 0) + 1
        },
        checkInCount: Math.min(state.checkInCount + 1, DAILY_TARGET),
        currentSessionIndex: Math.min(state.checkInCount + 2, DAILY_TARGET),
        lifetimeXP: state.lifetimeXP + 10,
        lifetimeOfferingAmount: state.lifetimeOfferingAmount + entry.money_amount,
        currentOfferingPool:
          entry.category === "wealth" ? state.currentOfferingPool + entry.money_amount : state.currentOfferingPool,
        successEntry: entry,
        currentScreen: "success",
        hideNav: true
      };

      storeCachedTimeline(profileIdentity(nextState), nextState.timelineEntries);
      if (entry.category === "wealth") await saveCurrentOfferingPool(nextState);
      setState(nextState);
    },
    [saveCurrentOfferingPool, state]
  );

  const withdrawOfferingPool = useCallback(async () => {
    const amount = Number(state.currentOfferingPool || 0);
    if (amount <= 0) return "种子基金还是空的。";
    const nextState = { ...state, currentOfferingPool: 0 };
    await saveCurrentOfferingPool(nextState);
    if (state.userId) {
      try {
        await supabase.from("offering_pool_events").insert([
          {
            user_id: state.userId,
            amount,
            event_type: "withdraw"
          }
        ]);
      } catch (error) {
        console.warn("Offering pool event insert failed.", error);
      }
    }
    setState(nextState);
    return `已取出 ¥${amount.toLocaleString("zh-CN")} 用于行善，种子基金重新开始。`;
  }, [saveCurrentOfferingPool, state]);

  const saveBedtimeReview = useCallback(
    async (q1: string, q2: string, q3: string) => {
      if (state.userId) {
        try {
          await supabase.from("bedtime_reviews").insert([
            {
              user_id: state.userId,
              q1_good: q1.trim(),
              q2_bad: q2.trim(),
              q3_plan: q3.trim()
            }
          ]);
        } catch (error) {
          console.warn("Bedtime review save failed.", error);
        }
      }
      setState((previous) => ({
        ...previous,
        lifetimeXP: previous.lifetimeXP + 20
      }));
      window.setTimeout(() => showScreen("home"), 1200);
      return "晚安，好梦";
    },
    [showScreen, state.userId]
  );

  const updateSelectedTimelineDate = useCallback((dateKey: string) => {
    setState((previous) => ({ ...previous, selectedTimelineDateKey: dateKey }));
  }, []);

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.warn("Logout failed.", error);
    }
    setState({ ...initialState });
  }, []);

  const levelBadge = useMemo(() => {
    const xp = state.lifetimeXP;
    if (xp >= 700) return "Lv.5 知行合一";
    if (xp >= 350) return "Lv.4 持续精进";
    if (xp >= 150) return "Lv.3 渐入佳境";
    if (xp >= 50) return "Lv.2 开始稳定";
    return "Lv.1 刚刚起步";
  }, [state.lifetimeXP]);

  return {
    state,
    levelBadge,
    showScreen,
    login,
    register,
    toggleAuthMode,
    saveProfileName,
    saveAvatar,
    saveReminderTimes,
    prepareCheckin,
    toggleTag,
    submitCheckin,
    withdrawOfferingPool,
    saveBedtimeReview,
    updateSelectedTimelineDate,
    logout
  };
};
