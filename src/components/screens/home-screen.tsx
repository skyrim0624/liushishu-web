import type { ReactNode } from "react";
import { CATEGORY_LABELS, DAILY_TARGET, FULL_CIRCLE } from "../../constants";
import { formatCurrency, getNextReminderInfo } from "../../lib/date";
import type { AppState, Category, Screen } from "../../types";
import { HealthIcon, KindnessIcon, WealthIcon } from "../ui/seed-icons";

interface HomeScreenProps {
  state: AppState;
  onPrepareCheckin: (category: Category) => void;
  onWithdrawOfferingPool: () => Promise<string>;
  onShowScreen: (screen: Screen, hideNav?: boolean) => void;
}

export function HomeScreen({ state, onPrepareCheckin, onWithdrawOfferingPool, onShowScreen }: HomeScreenProps) {
  const nextReminder = getNextReminderInfo(state.reminderTimes);
  const ratio = Math.min(state.checkInCount / state.dailyTarget, 1);
  const progressOffset = FULL_CIRCLE * (1 - ratio);

  const withdraw = async () => {
    const message = await onWithdrawOfferingPool();
    const target = document.getElementById("withdraw-feedback");
    if (!target) return;
    target.textContent = message;
    target.classList.remove("hidden");
    window.setTimeout(() => target.classList.add("hidden"), 2200);
  };

  const openReminderSettings = () => {
    onShowScreen("profile");
    window.setTimeout(() => {
      document.getElementById("reminder-settings-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  };

  return (
    <div className="screen active" id="screen-home">
      <main className="home-stage space-y-5 px-5 pb-24 pt-5">
        <section className="home-heading flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-sm tracking-[0.12em] text-muted">六时书今日面板</p>
            <h2 className="text-2xl font-bold text-ink" id="greeting-text">
              你好，{state.displayName || "记录者"}
            </h2>
            <p className="max-w-[260px] text-sm leading-relaxed text-muted">源于古老智慧·六时书的种子觉知与实践工具</p>
          </div>
          <div className="rounded-full border border-outline bg-white/80 px-4 py-2 text-sm font-bold text-primary">
            已坚持 <span>{state.streakDays}</span> 天
          </div>
        </section>

        <section className="dune-hero home-echo-card paper-card-soft overflow-hidden p-5" id="btn-quick-flash">
          <button
            className="home-echo-summary w-full cursor-pointer text-left"
            onClick={() => onPrepareCheckin("wealth")}
            type="button"
          >
            <div className="space-y-2">
              <p className="text-xs tracking-[0.18em] text-muted">TODAY / 六次提醒</p>
              <h3 className="text-xl font-bold text-ink">
                第 <span id="home-ring-done">{state.checkInCount}</span> / <span id="home-ring-total">{state.dailyTarget}</span>{" "}
                次记录
              </h3>
              <p className="text-sm text-muted" id="today-session-text">
                {state.checkInCount >= DAILY_TARGET
                  ? "今天六次记录已经完成，晚些时候做睡前复盘。"
                  : `今天已完成 ${state.checkInCount} 次，下一次推荐在“${nextReminder.label}”时段继续记录。`}
              </p>
            </div>
            <div className="home-progress-dial relative flex h-24 w-24 items-center justify-center">
              <svg className="h-full w-full -rotate-90" fill="none" viewBox="0 0 160 160">
                <circle
                  className="text-outline/50"
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="74"
                  stroke="currentColor"
                  strokeDasharray="6 6"
                  strokeWidth="3"
                />
                <circle
                  className="text-primary transition-all duration-700"
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="74"
                  stroke="currentColor"
                  strokeDasharray={FULL_CIRCLE}
                  strokeDashoffset={progressOffset}
                  strokeLinecap="round"
                  strokeWidth="7"
                  id="home-ring-progress"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold text-primary" id="current-session-index">
                  {state.currentSessionIndex}
                </span>
                <span className="text-xs text-muted">当前轮次</span>
              </div>
            </div>
          </button>

          <div className="home-next-reminder mt-5 grid grid-cols-[1fr_auto] gap-4 rounded-2xl bg-white/70 p-4">
            <div>
              <p className="text-xs tracking-[0.18em] text-muted">NEXT REMINDER</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-3xl font-bold text-primary" id="next-reminder-time">
                  {nextReminder.time}
                </span>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary" id="next-reminder-label">
                  {nextReminder.label}
                </span>
              </div>
              <p className="mt-2 text-sm text-muted" id="next-reminder-countdown">
                {nextReminder.countdown}
              </p>
            </div>
            <button
              className="rounded-2xl border border-outline bg-surface px-4 py-3 text-sm font-bold text-primary transition active:scale-95"
              id="next-reminder-settings"
              onClick={openReminderSettings}
              type="button"
            >
              调整六次提醒
            </button>
          </div>
        </section>

        <section className="seed-overview grid grid-cols-3 gap-3">
          <SeedCard
            category="wealth"
            count={state.todayCounts.wealth}
            icon={<WealthIcon />}
            tone="bg-primary/10"
            onPrepareCheckin={onPrepareCheckin}
          />
          <SeedCard
            category="kindness"
            count={state.todayCounts.kindness}
            icon={<KindnessIcon />}
            tone="bg-secondary/10"
            onPrepareCheckin={onPrepareCheckin}
          />
          <SeedCard
            category="health"
            count={state.todayCounts.health}
            icon={<HealthIcon />}
            tone="bg-green-700/10"
            onPrepareCheckin={onPrepareCheckin}
          />
        </section>

        <button
          className="introspection-row paper-card flex w-full items-start gap-4 p-4 text-left transition active:scale-95"
          id="seed-debug"
          onClick={() => onPrepareCheckin("debug")}
          type="button"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-tertiary/10">
            <span className="material-symbols-outlined text-tertiary">self_improvement</span>
          </div>
          <div>
            <p className="text-lg font-bold text-ink">{CATEGORY_LABELS.debug}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted">觉知当下的念头，每一秒都在种下种子。</p>
          </div>
        </button>

        <section className="offering-card paper-card p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs tracking-[0.18em] text-muted">种子基金</p>
              <h3 className="mt-1 text-xl font-bold text-ink">种子基金</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">
                每一次善意行动，都会在这里累积成一份力量。可阶段性取出，用于布施、助人或支持善缘。
              </p>
            </div>
            <button
              className="whitespace-nowrap rounded-xl border border-outline px-4 py-3 text-sm font-bold text-primary transition active:scale-95"
              id="btn-withdraw-pool"
              onClick={() => void withdraw()}
              type="button"
            >
              取出行善
            </button>
          </div>
          <div className="mt-5 flex items-end gap-2">
            <span className="pb-1 text-2xl text-primary">¥</span>
            <span className="text-4xl font-bold tracking-tight text-primary" id="home-offering-pool">
              {formatCurrency(state.currentOfferingPool)}
            </span>
          </div>
          <p className="mt-3 hidden text-sm text-primary" id="withdraw-feedback" />
        </section>

        <button
          className="insight-preview paper-card w-full p-5 text-left transition active:scale-95"
          onClick={() => onShowScreen("ai-insight", true)}
          type="button"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs tracking-[0.18em] text-muted">一周回望</p>
              <h3 className="mt-1 text-lg font-bold text-ink">智慧周报</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">用本周记录回看哪些种子正在稳定发生作用。</p>
            </div>
            <span className="material-symbols-outlined text-muted">arrow_forward_ios</span>
          </div>
        </button>
      </main>
    </div>
  );
}

interface SeedCardProps {
  category: Exclude<Category, "debug">;
  count: number;
  icon: ReactNode;
  tone: string;
  onPrepareCheckin: (category: Category) => void;
}

function SeedCard({ category, count, icon, tone, onPrepareCheckin }: SeedCardProps) {
  return (
    <button
      className="paper-card p-4 text-left transition active:scale-95"
      id={`seed-${category}`}
      onClick={() => onPrepareCheckin(category)}
      type="button"
    >
      <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-2xl ${tone}`}>{icon}</div>
      <p className="text-2xl font-bold text-ink" id={`seed-${category}-count`}>
        {count}
      </p>
      <p className="mt-1 text-sm font-bold text-muted">{CATEGORY_LABELS[category]}</p>
    </button>
  );
}
