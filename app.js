const SUPABASE_URL = "https://ntzbtmnzwapgxwocffkc.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_AA3ce9gBNn7fRTyzGeOh1g_YcIF5TO_";

const DAILY_TARGET = 6;
const REMINDER_LABELS = ["起床后", "上午", "午间", "下午", "傍晚", "睡前"];
const DEFAULT_REMINDER_TIMES = ["07:00", "10:00", "12:30", "15:30", "18:30", "21:30"];
const FULL_CIRCLE = 464.96;
const CATEGORY_LABELS = {
    wealth: "财富种子",
    kindness: "关系种子",
    health: "健康种子",
    debug: "觉察 / 清理负面种子"
};
const CATEGORY_ALIASES = {
    money: "wealth",
    love: "kindness",
    clean: "debug"
};
const TAGS_MAP = {
    wealth: [
        "布施金钱", "帮人赚钱", "分享机会", "成就他人", "支持他人", "公平交易",
        "不占便宜", "守信守约", "愿意付出", "尊重价值", "赞叹富足", "随喜他人"
    ],
    kindness: [
        "照顾老人", "促成姻缘", "陪伴孤独", "倾听他人", "安抚情绪",
        "给予温暖", "鼓励支持", "理解包容", "赞美他人", "守护关系", "化解冲突", "祝福爱情"
    ],
    health: [
        "助人就医", "赠人良药", "分享智慧", "引导康复", "安抚病苦", "陪伴病者",
        "供养医者", "布施食物", "放生护命", "发愿健康", "回向众生", "减轻痛苦"
    ],
    debug: [
        "嫉妒比较", "愤怒对立", "拖延逃避", "评判别人", "觉得自己不够", "急躁失控",
        "只想索取", "习惯抱怨", "不愿承担", "嘴上答应心里抗拒"
    ]
};

window.state = {
    currentScreen: "auth",
    checkInCount: 0,
    dailyTarget: DAILY_TARGET,
    reminderTimes: [...DEFAULT_REMINDER_TIMES],
    currentOfferingPool: 0,
    lifetimeOfferingAmount: 0,
    tags: new Set(),
    todayCounts: { wealth: 0, kindness: 0, health: 0, debug: 0 },
    timelineEntries: [],
    user_id: null,
    user_email: "",
    category: "wealth",
    lifetimeXP: 0,
    displayName: "",
    authMode: "login",
    currentSessionIndex: 1,
    streakDays: 0,
    successEntry: null,
    currentSlotIndex: 0
};

window.showScreen = function(id, hideNav = false) {
    const screens = document.querySelectorAll(".screen");
    const navItems = document.querySelectorAll(".nav-item");
    const bottomNav = document.getElementById("bottom-nav");
    const btnGlobalBack = document.getElementById("btn-global-back");
    const headerMenu = document.getElementById("header-menu-icon");
    const target = document.getElementById(`screen-${id}`);

    screens.forEach((screen) => screen.classList.remove("active"));
    if (target) target.classList.add("active");

    navItems.forEach((item) => {
        const active = item.dataset.target === id;
        item.classList.toggle("text-primary", active);
        item.classList.toggle("text-muted", !active);
        const icon = item.querySelector(".material-symbols-outlined");
        if (icon) {
            icon.style.fontVariationSettings = active ? "'FILL' 1" : "'FILL' 0";
        }
    });

    const isAuthScreen = id === "auth";
    if (bottomNav) bottomNav.style.transform = (hideNav || isAuthScreen) ? "translateY(100%)" : "translateY(0)";
    if (btnGlobalBack) btnGlobalBack.classList.toggle("hidden", !hideNav || isAuthScreen);
    if (headerMenu) headerMenu.textContent = hideNav ? "" : "person";

    window.state.currentScreen = id;
    window.scrollTo({ top: 0, behavior: "smooth" });
};

document.addEventListener("DOMContentLoaded", () => {
    let supabase;
    try {
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    } catch (error) {
        console.warn("Supabase unavailable, using local-only fallback.", error);
    }

    const qs = (id) => document.getElementById(id);
    const localProfileKey = (suffix) => {
        const identity = window.state.user_id || window.state.user_email || "guest";
        return `liushishu:${identity}:${suffix}`;
    };
    const normalizeCategory = (category) => CATEGORY_ALIASES[category] || category || "wealth";
    const normalizeReminderTimes = (input) => {
        if (!Array.isArray(input)) return [...DEFAULT_REMINDER_TIMES];
        const values = input.map((item) => typeof item === "string" ? item : item?.time).filter(Boolean);
        return DEFAULT_REMINDER_TIMES.map((time, index) => values[index] || time);
    };
    const parseJsonArray = (value) => {
        if (!value) return null;
        if (Array.isArray(value)) return value;
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : null;
        } catch {
            return null;
        }
    };
    const formatCurrency = (amount) => Number(amount || 0).toLocaleString("zh-CN");
    const setText = (id, value) => {
        const el = qs(id);
        if (el) el.textContent = value;
    };
    const setHtml = (id, value) => {
        const el = qs(id);
        if (el) el.innerHTML = value;
    };
    const flashMessage = (id, message) => {
        const el = qs(id);
        if (!el) return;
        el.textContent = message;
        el.classList.remove("hidden");
        setTimeout(() => el.classList.add("hidden"), 2200);
    };
    const timeToMinutes = (time) => {
        const [h, m] = String(time || "00:00").split(":").map((item) => parseInt(item, 10) || 0);
        return h * 60 + m;
    };
    const minutesToCountdown = (minutes) => {
        if (minutes <= 0) return "现在就是最合适的记录时刻。";
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hours > 0) return `${hours} 小时 ${mins} 分钟后提醒你进入下一次记录。`;
        return `${mins} 分钟后提醒你进入下一次记录。`;
    };
    const getNextReminderInfo = () => {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        let chosenIndex = 0;
        let diff = 24 * 60;
        for (let i = 0; i < window.state.reminderTimes.length; i += 1) {
            const reminderMinutes = timeToMinutes(window.state.reminderTimes[i]);
            let currentDiff = reminderMinutes - nowMinutes;
            if (currentDiff < 0) currentDiff += 24 * 60;
            if (currentDiff < diff) {
                diff = currentDiff;
                chosenIndex = i;
            }
        }
        return {
            index: chosenIndex,
            label: REMINDER_LABELS[chosenIndex],
            time: window.state.reminderTimes[chosenIndex],
            countdown: minutesToCountdown(diff)
        };
    };
    const getCurrentSlotInfo = () => {
        const now = new Date();
        const nowMinutes = now.getHours() * 60 + now.getMinutes();
        let slotIndex = 0;
        for (let i = 0; i < window.state.reminderTimes.length; i += 1) {
            if (nowMinutes >= timeToMinutes(window.state.reminderTimes[i])) slotIndex = i;
        }
        return {
            index: slotIndex,
            label: REMINDER_LABELS[slotIndex],
            time: window.state.reminderTimes[slotIndex]
        };
    };
    const storeLocalProfile = () => {
        localStorage.setItem(localProfileKey("displayName"), window.state.displayName || "");
        localStorage.setItem(localProfileKey("reminderTimes"), JSON.stringify(window.state.reminderTimes));
        localStorage.setItem(localProfileKey("currentOfferingPool"), String(window.state.currentOfferingPool || 0));
    };
    const loadLocalProfile = () => {
        const localName = localStorage.getItem(localProfileKey("displayName"));
        const localTimes = parseJsonArray(localStorage.getItem(localProfileKey("reminderTimes")));
        const localPool = parseInt(localStorage.getItem(localProfileKey("currentOfferingPool")) || "0", 10);
        if (localName) window.state.displayName = localName;
        window.state.reminderTimes = normalizeReminderTimes(localTimes || window.state.reminderTimes);
        window.state.currentOfferingPool = Number.isNaN(localPool) ? 0 : localPool;
    };
    const updateDisplayName = () => {
        const name = window.state.displayName || "记录者";
        setText("greeting-text", `你好，${name}`);
        setText("profile-display-name", name);
        if (qs("edit-display-name")) qs("edit-display-name").value = name;
    };
    const updateLevelBadge = () => {
        const xp = window.state.lifetimeXP;
        let level = 1;
        let title = "刚刚起步";
        if (xp >= 50) { level = 2; title = "开始稳定"; }
        if (xp >= 150) { level = 3; title = "渐入佳境"; }
        if (xp >= 350) { level = 4; title = "持续精进"; }
        if (xp >= 700) { level = 5; title = "知行合一"; }
        setText("profile-level-badge", `Lv.${level} ${title}`);
    };
    const renderReminderInputs = () => {
        window.state.reminderTimes.forEach((time, index) => {
            const input = qs(`reminder-time-${index}`);
            if (input) input.value = time;
        });
    };
    const renderHome = () => {
        const nextReminder = getNextReminderInfo();
        const ratio = Math.min(window.state.checkInCount / window.state.dailyTarget, 1);
        setText("home-ring-done", String(window.state.checkInCount));
        setText("home-ring-total", String(window.state.dailyTarget));
        setText("current-session-index", String(window.state.currentSessionIndex));
        setText("next-reminder-time", nextReminder.time);
        setText("next-reminder-label", nextReminder.label);
        setText("next-reminder-countdown", nextReminder.countdown);
        setText("seed-wealth-count", String(window.state.todayCounts.wealth));
        setText("seed-kindness-count", String(window.state.todayCounts.kindness));
        setText("seed-health-count", String(window.state.todayCounts.health));
        setText("home-offering-pool", formatCurrency(window.state.currentOfferingPool));
        setText("streak-count", String(window.state.streakDays));
        setText("today-session-text", window.state.checkInCount >= DAILY_TARGET
            ? "今天六次记录已经完成，晚些时候做睡前复盘。"
            : `今天已完成 ${window.state.checkInCount} 次，下一次推荐在“${nextReminder.label}”时段继续记录。`);
        const ring = qs("home-ring-progress");
        if (ring) ring.style.strokeDashoffset = String(FULL_CIRCLE * (1 - ratio));
    };
    const renderProfile = () => {
        setText("profile-xp", String(window.state.lifetimeXP));
        setText("profile-current-pool", formatCurrency(window.state.currentOfferingPool));
        setText("profile-lifetime-money", formatCurrency(window.state.lifetimeOfferingAmount));
        updateLevelBadge();
        renderReminderInputs();
        updateNotificationStatus();
    };
    const openReminderSettings = () => {
        window.showScreen("profile");
        requestAnimationFrame(() => {
            const card = qs("reminder-settings-card");
            if (card) card.scrollIntoView({ behavior: "smooth", block: "start" });
        });
    };
    const renderCalendar = () => {
        const grid = qs("calendar-grid");
        if (!grid) return;
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const countByDay = {};
        window.state.timelineEntries.forEach((entry) => {
            const date = new Date(entry.created_at || Date.now());
            const day = date.getDate();
            countByDay[day] = (countByDay[day] || 0) + 1;
        });

        setText("timeline-month-label", `${today.getFullYear()} 年 ${today.getMonth() + 1} 月记录`);
        setText("timeline-total-count", `本月 ${window.state.timelineEntries.length} 次记录`);
        grid.innerHTML = "";
        for (let i = 0; i < monthStart.getDay(); i += 1) {
            const blank = document.createElement("div");
            blank.className = "aspect-square rounded-xl bg-transparent";
            grid.appendChild(blank);
        }
        for (let day = 1; day <= daysInMonth; day += 1) {
            const level = Math.min(countByDay[day] || 0, 4);
            const tones = [
                "bg-surface",
                "bg-primary/10",
                "bg-primary/25",
                "bg-primary/40",
                "bg-primary text-white"
            ];
            const cell = document.createElement("div");
            cell.className = `flex aspect-square items-center justify-center rounded-xl text-sm ${tones[level]}`;
            cell.textContent = String(day);
            grid.appendChild(cell);
        }
    };
    const renderTimeline = () => {
        const container = qs("timeline-detail");
        if (!container) return;
        renderCalendar();
        setText("timeline-today-label", new Date().toLocaleDateString("zh-CN", { month: "numeric", day: "numeric", weekday: "short" }));
        if (!window.state.timelineEntries.length) {
            container.innerHTML = `<div class="rounded-2xl border border-outline bg-white/70 p-4 text-sm leading-relaxed text-muted">还没有记录，从首页开始第一轮六时书吧。</div>`;
            return;
        }
        const items = window.state.timelineEntries.slice(0, 8).map((entry) => {
            const date = new Date(entry.created_at || Date.now());
            const time = date.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", hour12: false });
            const label = CATEGORY_LABELS[normalizeCategory(entry.category)] || "记录";
            const detail = entry.note || (Array.isArray(entry.tags) && entry.tags.length ? entry.tags.slice(0, 3).join("、") : "写下了一个新的提醒。");
            const slotText = entry.session_index ? `第 ${entry.session_index} 次` : "已记录";
            return `
                <div class="rounded-2xl border border-outline bg-white/80 p-4">
                    <div class="flex items-start justify-between gap-3">
                        <div>
                            <p class="text-sm text-muted">${time}</p>
                            <h4 class="mt-1 text-base font-bold text-ink">${label}</h4>
                        </div>
                        <span class="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">${slotText}</span>
                    </div>
                    <p class="mt-3 text-sm leading-relaxed text-muted">${detail}</p>
                </div>
            `;
        }).join("");
        container.innerHTML = items;
    };
    const renderWeeklyInsights = () => {
        const container = qs("ai-report-content");
        if (!container) return;
        const insights = [
            `本周你已经累计完成 ${window.state.timelineEntries.length} 次记录，真正有效的是你持续回来觉知这一点。`,
            `财富种子累计历史供养 ¥${formatCurrency(window.state.lifetimeOfferingAmount)}，当前供养池还有 ¥${formatCurrency(window.state.currentOfferingPool)}。`,
            `关系、健康、觉察三条线都值得平衡推进。试着在下一轮刻意补上今天最少的一类种子。`
        ];
        container.innerHTML = insights.map((text) => `<div class="rounded-2xl border border-outline bg-white/80 p-4 text-sm leading-relaxed text-muted">${text}</div>`).join("");
    };
    const renderSuccess = () => {
        const entry = window.state.successEntry;
        if (!entry) return;
        const category = normalizeCategory(entry.category);
        setText("success-title", "记录完成");
        setText("success-label", CATEGORY_LABELS[category] || "本次记录");
        const successMoneyRow = qs("success-money-row");
        if (category === "wealth") {
            if (successMoneyRow) successMoneyRow.classList.remove("hidden");
            setText("success-money", formatCurrency(entry.money_amount || 0));
            setText("success-summary", "这一份供养已经进入你的当前供养池。");
        } else {
            if (successMoneyRow) successMoneyRow.classList.add("hidden");
            setText("success-summary", "这一刻已经加入你的六时书轨迹。");
        }
        const detail = entry.note || (Array.isArray(entry.tags) && entry.tags.length ? entry.tags.slice(0, 4).join("、") : "已完成本次记录。");
        setText("success-detail", detail);
    };
    const updateNotificationStatus = () => {
        const target = qs("notification-status");
        if (!target || !("Notification" in window)) return;
        if (Notification.permission === "granted") {
            target.textContent = "浏览器通知已开启。网页打开时，后续可以承接系统通知能力。";
        } else if (Notification.permission === "denied") {
            target.textContent = "浏览器通知已被拒绝，可在浏览器设置里重新开启。";
        } else {
            target.textContent = "尚未申请浏览器通知权限。";
        }
    };
    const readReminderInputs = () => {
        const values = DEFAULT_REMINDER_TIMES.map((fallback, index) => {
            const input = qs(`reminder-time-${index}`);
            return input?.value || fallback;
        });
        return normalizeReminderTimes(values);
    };
    const showAuthError = (message) => {
        const el = qs("auth-error");
        if (!el) return;
        el.textContent = message;
        el.classList.remove("hidden");
    };
    const clearAuthError = () => qs("auth-error")?.classList.add("hidden");
    const setAuthLoading = (loading) => {
        ["btn-auth-login", "btn-auth-register"].forEach((id) => {
            const button = qs(id);
            if (button) {
                button.disabled = loading;
                button.style.opacity = loading ? "0.6" : "1";
            }
        });
    };
    const toggleAuthMode = () => {
        const isLogin = window.state.authMode === "login";
        window.state.authMode = isLogin ? "register" : "login";
        qs("auth-name-field")?.classList.toggle("hidden", !isLogin);
        qs("btn-auth-login")?.classList.toggle("hidden", isLogin);
        if (qs("btn-auth-register")) qs("btn-auth-register").textContent = isLogin ? "创建账号" : "注册新账号";
        if (qs("auth-toggle-hint")) {
            qs("auth-toggle-hint").innerHTML = isLogin
                ? '已有账号？<span class="font-bold text-primary" id="auth-toggle-link">去登录</span>'
                : '还没有账号？<span class="font-bold text-primary" id="auth-toggle-link">去注册</span>';
            qs("auth-toggle-link")?.addEventListener("click", toggleAuthMode);
        }
        clearAuthError();
    };
    const resetStateForLogout = () => {
        window.state.checkInCount = 0;
        window.state.currentOfferingPool = 0;
        window.state.lifetimeOfferingAmount = 0;
        window.state.todayCounts = { wealth: 0, kindness: 0, health: 0, debug: 0 };
        window.state.tags = new Set();
        window.state.timelineEntries = [];
        window.state.lifetimeXP = 0;
        window.state.displayName = "";
        window.state.user_id = null;
        window.state.user_email = "";
        window.state.currentSessionIndex = 1;
        window.state.reminderTimes = [...DEFAULT_REMINDER_TIMES];
        window.state.authMode = "login";
        updateDisplayName();
        renderHome();
        renderProfile();
        renderTimeline();
    };

    async function loadProfile() {
        loadLocalProfile();
        if (!supabase || !window.state.user_id) {
            updateDisplayName();
            renderProfile();
            return;
        }
        try {
            const { data, error } = await supabase
                .from("profiles")
                .select("display_name, reminder_times, current_offering_pool")
                .eq("id", window.state.user_id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                window.state.displayName = data.display_name || window.state.displayName || window.state.user_email.split("@")[0] || "记录者";
                window.state.reminderTimes = normalizeReminderTimes(data.reminder_times);
                window.state.currentOfferingPool = Number(data.current_offering_pool || 0);
            } else {
                window.state.displayName = window.state.displayName || window.state.user_email.split("@")[0] || "记录者";
                await supabase.from("profiles").upsert([{
                    id: window.state.user_id,
                    display_name: window.state.displayName,
                    reminder_times: window.state.reminderTimes,
                    current_offering_pool: 0
                }], { onConflict: "id" });
            }
        } catch (error) {
            console.warn("Profile load failed, using local fallback.", error);
        }
        storeLocalProfile();
        updateDisplayName();
        renderProfile();
    }

    async function loadHistoryAndToday() {
        const todayCounts = { wealth: 0, kindness: 0, health: 0, debug: 0 };
        const emptyResult = {
            checkInCount: 0,
            lifetimeXP: 0,
            lifetimeOfferingAmount: 0,
            currentOfferingPool: window.state.currentOfferingPool,
            timelineEntries: [],
            streakDays: 0
        };

        if (!supabase || !window.state.user_id) {
            window.state.todayCounts = todayCounts;
            window.state.checkInCount = 0;
            window.state.currentSessionIndex = 1;
            window.state.timelineEntries = [];
            window.state.streakDays = 0;
            window.state.lifetimeXP = 0;
            window.state.lifetimeOfferingAmount = 0;
            renderHome();
            renderTimeline();
            renderWeeklyInsights();
            renderProfile();
            return emptyResult;
        }

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const todayIso = todayStart.toISOString();
        try {
            const { data: checkins, error: checkinsError } = await supabase
                .from("checkins")
                .select("*")
                .eq("user_id", window.state.user_id)
                .order("created_at", { ascending: false })
                .limit(300);
            if (checkinsError) throw checkinsError;

            const { data: reviews, error: reviewsError } = await supabase
                .from("bedtime_reviews")
                .select("created_at")
                .eq("user_id", window.state.user_id)
                .order("created_at", { ascending: false })
                .limit(120);
            if (reviewsError) throw reviewsError;

            const entries = checkins || [];
            entries.forEach((entry) => {
                entry.category = normalizeCategory(entry.category);
            });

            const todayEntries = entries.filter((entry) => new Date(entry.created_at) >= todayStart);
            todayEntries.forEach((entry) => {
                todayCounts[entry.category] = (todayCounts[entry.category] || 0) + 1;
            });

            const historyOffering = entries.reduce((sum, entry) => sum + Number(entry.money_amount || 0), 0);
            const allDates = new Set();
            [...entries, ...(reviews || [])].forEach((item) => {
                if (!item?.created_at) return;
                const key = new Date(item.created_at).toISOString().slice(0, 10);
                allDates.add(key);
            });
            let streakDays = 0;
            const pointer = new Date();
            while (allDates.has(pointer.toISOString().slice(0, 10))) {
                streakDays += 1;
                pointer.setDate(pointer.getDate() - 1);
            }

            window.state.todayCounts = todayCounts;
            window.state.checkInCount = todayEntries.length;
            window.state.currentSessionIndex = Math.min(todayEntries.length + 1, DAILY_TARGET);
            window.state.timelineEntries = entries;
            window.state.lifetimeXP = entries.length * 10 + (reviews?.length || 0) * 20;
            window.state.lifetimeOfferingAmount = historyOffering;
            window.state.streakDays = streakDays;

            if (window.state.currentOfferingPool === 0) {
                const { data: profilePool } = await supabase
                    .from("profiles")
                    .select("current_offering_pool")
                    .eq("id", window.state.user_id)
                    .maybeSingle();
                if (profilePool?.current_offering_pool != null) {
                    window.state.currentOfferingPool = Number(profilePool.current_offering_pool);
                }
            }

            renderHome();
            renderTimeline();
            renderWeeklyInsights();
            renderProfile();
            return {
                ...emptyResult,
                checkInCount: todayEntries.length,
                lifetimeXP: window.state.lifetimeXP,
                lifetimeOfferingAmount: historyOffering,
                timelineEntries: entries,
                streakDays
            };
        } catch (error) {
            console.warn("Failed to load checkins from Supabase.", error);
            const cachedTimes = parseJsonArray(localStorage.getItem(localProfileKey("timelineEntries"))) || [];
            window.state.timelineEntries = cachedTimes;
            renderTimeline();
            renderHome();
            renderWeeklyInsights();
            renderProfile();
            return emptyResult;
        } finally {
            localStorage.setItem(localProfileKey("timelineEntries"), JSON.stringify(window.state.timelineEntries.slice(0, 50)));
        }
    }

    async function onAuthSuccess(user) {
        window.state.user_id = user.id;
        window.state.user_email = user.email || "";
        loadLocalProfile();
        if (!window.state.displayName) {
            window.state.displayName = user.email?.split("@")[0] || "记录者";
        }
        await loadProfile();
        await loadHistoryAndToday();
        updateDisplayName();
        renderHome();
        renderProfile();
        window.showScreen("home");
    }

    async function saveProfileName() {
        const newName = qs("edit-display-name")?.value?.trim();
        if (!newName) return;
        window.state.displayName = newName;
        updateDisplayName();
        storeLocalProfile();
        if (supabase && window.state.user_id) {
            try {
                await supabase.from("profiles").upsert([{
                    id: window.state.user_id,
                    display_name: newName,
                    reminder_times: window.state.reminderTimes,
                    current_offering_pool: window.state.currentOfferingPool
                }], { onConflict: "id" });
            } catch (error) {
                console.warn("Profile name save failed.", error);
            }
        }
        flashMessage("profile-save-feedback", "昵称已保存");
    }

    async function saveReminderTimes() {
        window.state.reminderTimes = readReminderInputs();
        storeLocalProfile();
        if (supabase && window.state.user_id) {
            try {
                await supabase.from("profiles").upsert([{
                    id: window.state.user_id,
                    display_name: window.state.displayName || "记录者",
                    reminder_times: window.state.reminderTimes,
                    current_offering_pool: window.state.currentOfferingPool
                }], { onConflict: "id" });
            } catch (error) {
                console.warn("Reminder save failed.", error);
            }
        }
        renderHome();
        renderProfile();
        flashMessage("reminder-save-feedback", "六次提醒已保存");
    }

    function updateCheckinTags(category) {
        const grid = qs(`${category}-tags-grid`);
        if (!grid) return;
        grid.innerHTML = "";
        TAGS_MAP[category].forEach((tag) => {
            const button = document.createElement("button");
            button.type = "button";
            button.textContent = tag;
            button.className = `tag-chip ${window.state.tags.has(tag) ? "active" : ""}`;
            button.addEventListener("click", () => {
                if (window.state.tags.has(tag)) {
                    window.state.tags.delete(tag);
                } else {
                    window.state.tags.add(tag);
                }
                updateCheckinTags(category);
            });
            grid.appendChild(button);
        });
    }

    let timerInt = null;
    function startTimer() {
        if (timerInt) clearInterval(timerInt);
        const ring = qs("checkin-timer-ring");
        const secondsEl = qs("checkin-seconds");
        if (!ring || !secondsEl) return;
        let seconds = 60;
        ring.style.strokeDashoffset = "0";
        secondsEl.textContent = "60";
        timerInt = setInterval(() => {
            seconds -= 1;
            secondsEl.textContent = String(Math.max(seconds, 0));
            ring.style.strokeDashoffset = String(FULL_CIRCLE * (1 - seconds / 60));
            if (seconds <= 0) {
                clearInterval(timerInt);
                timerInt = null;
            }
        }, 1000);
    }

    function prepareCheckin(category) {
        window.state.category = category;
        window.state.tags = new Set();
        const slot = getCurrentSlotInfo();
        window.state.currentSlotIndex = slot.index;
        document.querySelectorAll("[id^='panel-']").forEach((panel) => panel.classList.add("hidden"));
        qs(`panel-${category}`)?.classList.remove("hidden");
        setText("checkin-session-meta", `本次是第 ${window.state.currentSessionIndex} 次记录`);
        setText("checkin-session-label", CATEGORY_LABELS[category] || "记录");
        setText("checkin-slot-label", `当前时段：${slot.label}（${slot.time}）`);
        if (qs("checkin-note")) qs("checkin-note").value = "";
        if (qs("checkin-money-input")) qs("checkin-money-input").value = "10";
        updateCheckinTags(category);
        window.showScreen("checkin", true);
        startTimer();
    }

    async function saveCurrentOfferingPool() {
        storeLocalProfile();
        if (!supabase || !window.state.user_id) return;
        try {
            await supabase.from("profiles").upsert([{
                id: window.state.user_id,
                display_name: window.state.displayName || "记录者",
                reminder_times: window.state.reminderTimes,
                current_offering_pool: window.state.currentOfferingPool
            }], { onConflict: "id" });
        } catch (error) {
            console.warn("Saving offering pool failed.", error);
        }
    }

    async function submitCheckin() {
        if (timerInt) {
            clearInterval(timerInt);
            timerInt = null;
        }

        const category = window.state.category;
        const moneyAmount = category === "wealth" ? parseInt(qs("checkin-money-input")?.value || "0", 10) || 0 : 0;
        const note = qs("checkin-note")?.value?.trim() || "";
        const tags = Array.from(window.state.tags);
        const entry = {
            user_id: window.state.user_id,
            category,
            money_amount: moneyAmount,
            note,
            tags,
            session_index: window.state.currentSessionIndex
        };

        if (supabase && window.state.user_id) {
            try {
                await supabase.from("checkins").insert([entry]);
            } catch (error) {
                console.warn("Checkin insert failed, keeping local state only.", error);
            }
        }

        entry.created_at = new Date().toISOString();
        window.state.timelineEntries.unshift(entry);
        window.state.todayCounts[category] = (window.state.todayCounts[category] || 0) + 1;
        window.state.checkInCount = Math.min(window.state.checkInCount + 1, DAILY_TARGET);
        window.state.currentSessionIndex = Math.min(window.state.checkInCount + 1, DAILY_TARGET);
        window.state.lifetimeXP += 10;
        window.state.lifetimeOfferingAmount += moneyAmount;
        if (category === "wealth") {
            window.state.currentOfferingPool += moneyAmount;
            await saveCurrentOfferingPool();
        }

        window.state.successEntry = entry;
        localStorage.setItem(localProfileKey("timelineEntries"), JSON.stringify(window.state.timelineEntries.slice(0, 50)));
        renderHome();
        renderProfile();
        renderTimeline();
        renderWeeklyInsights();
        renderSuccess();
        window.showScreen("success", true);
    }

    async function withdrawOfferingPool() {
        const amount = Number(window.state.currentOfferingPool || 0);
        if (amount <= 0) {
            flashMessage("withdraw-feedback", "当前供养池还是空的。");
            return;
        }
        window.state.currentOfferingPool = 0;
        await saveCurrentOfferingPool();
        if (supabase && window.state.user_id) {
            try {
                await supabase.from("offering_pool_events").insert([{
                    user_id: window.state.user_id,
                    amount,
                    event_type: "withdraw"
                }]);
            } catch (error) {
                console.warn("Offering pool event insert failed.", error);
            }
        }
        renderHome();
        renderProfile();
        flashMessage("withdraw-feedback", `已取出 ¥${formatCurrency(amount)}，当前供养池重新开始。`);
    }

    async function saveBedtimeReview() {
        const q1 = qs("bedtime-q1")?.value?.trim() || "";
        const q2 = qs("bedtime-q2")?.value?.trim() || "";
        const q3 = qs("bedtime-q3")?.value?.trim() || "";
        if (supabase && window.state.user_id) {
            try {
                await supabase.from("bedtime_reviews").insert([{
                    user_id: window.state.user_id,
                    q1_good: q1,
                    q2_bad: q2,
                    q3_plan: q3
                }]);
            } catch (error) {
                console.warn("Bedtime review save failed.", error);
            }
        }
        window.state.lifetimeXP += 20;
        renderProfile();
        renderHome();
        const button = qs("btn-bedtime-done");
        if (button) {
            const original = button.textContent;
            button.textContent = "晚安，好梦";
            setTimeout(() => {
                button.textContent = original;
                window.showScreen("home");
            }, 1200);
        }
    }

    async function requestBrowserNotifications() {
        if (!("Notification" in window)) {
            setText("notification-status", "当前浏览器不支持通知。");
            return;
        }
        try {
            const permission = await Notification.requestPermission();
            if (permission === "granted") {
                new Notification("愿望加速器", { body: "通知权限已开启，后续可承接六次提醒。" });
            }
        } catch (error) {
            console.warn("Notification permission request failed.", error);
        }
        updateNotificationStatus();
    }

    qs("btn-auth-login")?.addEventListener("click", async () => {
        clearAuthError();
        const email = qs("auth-email")?.value?.trim();
        const password = qs("auth-password")?.value;
        if (!email || !password) {
            showAuthError("请填写邮箱和密码");
            return;
        }
        setAuthLoading(true);
        try {
            if (!supabase) throw new Error("当前环境无法登录云端账号");
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });
            if (error) throw error;
            if (data?.user) await onAuthSuccess(data.user);
        } catch (error) {
            const message = error.message?.includes("Invalid login") ? "邮箱或密码不正确" : (error.message || "登录失败，请重试");
            showAuthError(message);
        }
        setAuthLoading(false);
    });

    qs("btn-auth-register")?.addEventListener("click", async () => {
        clearAuthError();
        if (window.state.authMode === "login") {
            toggleAuthMode();
            return;
        }
        const email = qs("auth-email")?.value?.trim();
        const password = qs("auth-password")?.value;
        const displayName = qs("auth-display-name")?.value?.trim();
        if (!email || !password) {
            showAuthError("请填写邮箱和密码");
            return;
        }
        if (password.length < 6) {
            showAuthError("密码至少需要 6 位");
            return;
        }
        setAuthLoading(true);
        try {
            if (!supabase) throw new Error("当前环境无法注册云端账号");
            const { data, error } = await supabase.auth.signUp({ email, password });
            if (error) throw error;
            if (data?.user) {
                window.state.displayName = displayName || email.split("@")[0];
                window.state.user_email = email;
                storeLocalProfile();
                if (data.session) {
                    await onAuthSuccess(data.user);
                } else {
                    showAuthError("注册成功，请先到邮箱确认后再登录");
                    toggleAuthMode();
                }
            }
        } catch (error) {
            const message = error.message?.includes("already registered") ? "该邮箱已注册，请直接登录" : (error.message || "注册失败，请重试");
            showAuthError(message);
        }
        setAuthLoading(false);
    });

    qs("auth-toggle-link")?.addEventListener("click", toggleAuthMode);
    qs("btn-save-profile")?.addEventListener("click", saveProfileName);
    qs("btn-save-reminders")?.addEventListener("click", saveReminderTimes);
    qs("btn-enable-notifications")?.addEventListener("click", requestBrowserNotifications);
    qs("btn-submit-checkin")?.addEventListener("click", submitCheckin);
    qs("btn-home-next-record")?.addEventListener("click", (event) => {
        event.stopPropagation();
        prepareCheckin("wealth");
    });
    qs("next-reminder-settings")?.addEventListener("click", openReminderSettings);
    qs("next-reminder-settings")?.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            openReminderSettings();
        }
    });
    qs("seed-wealth")?.addEventListener("click", () => prepareCheckin("wealth"));
    qs("seed-kindness")?.addEventListener("click", () => prepareCheckin("kindness"));
    qs("seed-health")?.addEventListener("click", () => prepareCheckin("health"));
    qs("seed-debug")?.addEventListener("click", () => prepareCheckin("debug"));
    qs("btn-withdraw-pool")?.addEventListener("click", withdrawOfferingPool);
    qs("btn-success-home")?.addEventListener("click", () => window.showScreen("home"));
    qs("btn-goto-ai")?.addEventListener("click", () => {
        renderWeeklyInsights();
        window.showScreen("ai-insight", true);
    });
    qs("btn-show-tutorial")?.addEventListener("click", () => window.showScreen("tutorial", true));
    qs("btn-tutorial-back")?.addEventListener("click", () => window.showScreen("home"));
    qs("btn-bedtime-done")?.addEventListener("click", saveBedtimeReview);
    qs("timer-box")?.addEventListener("click", () => {
        if (timerInt) {
            clearInterval(timerInt);
            timerInt = null;
            setText("checkin-seconds", "0");
            if (qs("checkin-timer-ring")) qs("checkin-timer-ring").style.strokeDashoffset = String(FULL_CIRCLE);
        }
    });
    qs("btn-global-back")?.addEventListener("click", () => window.showScreen("home"));
    qs("btn-logout")?.addEventListener("click", async () => {
        if (supabase) {
            try {
                await supabase.auth.signOut();
            } catch (error) {
                console.warn("Logout failed.", error);
            }
        }
        resetStateForLogout();
        if (qs("auth-email")) qs("auth-email").value = "";
        if (qs("auth-password")) qs("auth-password").value = "";
        window.showScreen("auth");
    });

    document.querySelectorAll(".nav-item").forEach((button) => {
        button.addEventListener("click", () => {
            const target = button.dataset.target;
            window.showScreen(target);
        });
    });

    if (supabase) {
        (async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    await onAuthSuccess(session.user);
                } else {
                    loadLocalProfile();
                    updateDisplayName();
                    renderHome();
                    renderProfile();
                    renderTimeline();
                    renderWeeklyInsights();
                }
            } catch (error) {
                console.warn("Session restore failed.", error);
                loadLocalProfile();
                updateDisplayName();
                renderHome();
                renderProfile();
                renderTimeline();
                renderWeeklyInsights();
            }
        })();
    } else {
        loadLocalProfile();
        updateDisplayName();
        renderHome();
        renderProfile();
        renderTimeline();
        renderWeeklyInsights();
    }
});
