import { useEffect, useState } from "react";
import { CATEGORY_LABELS, FULL_CIRCLE, REMINDER_LABELS, TAGS_MAP } from "../../constants";
import type { AppState } from "../../types";

interface CheckinScreenProps {
  state: AppState;
  onToggleTag: (tag: string) => void;
  onSubmit: (note: string, moneyAmount: number) => Promise<void>;
}

export function CheckinScreen({ state, onToggleTag, onSubmit }: CheckinScreenProps) {
  const [seconds, setSeconds] = useState(60);
  const [note, setNote] = useState("");
  const [moneyAmount, setMoneyAmount] = useState(10);

  useEffect(() => {
    setSeconds(60);
    setNote("");
    setMoneyAmount(10);
    const timer = window.setInterval(() => {
      setSeconds((previous) => {
        if (previous <= 1) {
          window.clearInterval(timer);
          return 0;
        }
        return previous - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [state.timerRunId]);

  const timerOffset = FULL_CIRCLE * (1 - seconds / 60);
  const selectedTags = new Set(state.selectedTags);
  const slotLabel = REMINDER_LABELS[state.currentSlotIndex] || REMINDER_LABELS[0];
  const slotTime = state.reminderTimes[state.currentSlotIndex] || state.reminderTimes[0];

  return (
    <div className="screen active" id="screen-checkin">
      <main className="checkin-stage px-5 pb-20 pt-6">
        <section className="focus-panel paper-card-soft p-5 text-center">
          <p className="text-sm tracking-[0.16em] text-muted" id="checkin-session-meta">
            本次是第 {state.currentSessionIndex} 次记录
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink" id="checkin-session-label">
            {CATEGORY_LABELS[state.category]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted" id="checkin-slot-label">
            当前时段：{slotLabel}（{slotTime}）
          </p>

          <div className="mt-6 flex items-center justify-center">
            <button
              className="relative flex h-36 w-36 items-center justify-center"
              id="timer-box"
              onClick={() => setSeconds(0)}
              type="button"
              aria-label="结束计时"
            >
              <svg className="absolute inset-0 h-full w-full -rotate-90" fill="none" viewBox="0 0 160 160">
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
                  className="text-primary transition-all duration-1000 ease-linear"
                  cx="80"
                  cy="80"
                  fill="transparent"
                  r="74"
                  stroke="currentColor"
                  strokeDasharray={FULL_CIRCLE}
                  strokeDashoffset={timerOffset}
                  strokeLinecap="round"
                  strokeWidth="7"
                  id="checkin-timer-ring"
                />
              </svg>
              <div className="relative z-10">
                <span className="block text-5xl font-bold text-primary" id="checkin-seconds">
                  {seconds}
                </span>
                <span className="text-sm font-bold text-muted">安住当下</span>
              </div>
            </button>
          </div>
        </section>

        {state.category === "wealth" ? (
          <section className="mt-5 space-y-4">
            <div className="paper-card p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-bold text-muted">本次供养金额</p>
                  <p className="mt-1 text-sm text-muted">完成供养后会进入种子基金。</p>
                </div>
                <div className="flex items-end gap-1 text-primary">
                  <span className="pb-1 text-xl">¥</span>
                  <input
                    className="w-24 border-0 bg-transparent p-0 text-right text-4xl font-bold tracking-tight text-primary outline-none focus:ring-0"
                    id="checkin-money-input"
                    onChange={(event) => setMoneyAmount(parseInt(event.target.value || "0", 10) || 0)}
                    type="number"
                    value={moneyAmount}
                  />
                </div>
              </div>
            </div>
            <TagPanel
              label="财富种子行为"
              tags={TAGS_MAP.wealth}
              selectedTags={selectedTags}
              onToggleTag={onToggleTag}
            />
          </section>
        ) : null}

        {state.category === "kindness" ? (
          <section className="mt-5 space-y-4">
            <TagPanel
              label="关系种子行为"
              tags={TAGS_MAP.kindness}
              selectedTags={selectedTags}
              onToggleTag={onToggleTag}
            />
          </section>
        ) : null}

        {state.category === "health" ? (
          <section className="mt-5 space-y-4">
            <TagPanel
              label="健康种子行为"
              tags={TAGS_MAP.health}
              selectedTags={selectedTags}
              onToggleTag={onToggleTag}
            />
          </section>
        ) : null}

        {state.category === "debug" ? (
          <section className="mt-5 space-y-4">
            <div className="paper-card p-5">
              <p className="mb-2 text-sm font-bold text-muted">需要觉察的念头</p>
              <p className="mb-4 text-sm leading-relaxed text-muted">觉知当下的念头，每一秒都在种下种子。</p>
              <div className="flex flex-wrap gap-2">
                {TAGS_MAP.debug.map((tag) => (
                  <button
                    className={`tag-chip ${selectedTags.has(tag) ? "active" : ""}`}
                    key={tag}
                    onClick={() => onToggleTag(tag)}
                    type="button"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section className="mt-5 space-y-4">
          <div className="paper-card p-5">
            <textarea
              className="h-28 w-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-ink placeholder:text-muted/60 focus:ring-0"
              id="checkin-note"
              onChange={(event) => setNote(event.target.value)}
              placeholder="写下此刻做了什么、看到什么、想提醒自己什么..."
              value={note}
            />
          </div>
          <button
            className="paper-btn w-full py-4 text-lg"
            id="btn-submit-checkin"
            onClick={() => void onSubmit(note, moneyAmount)}
            type="button"
          >
            完成播种
          </button>
        </section>
      </main>
    </div>
  );
}

interface TagPanelProps {
  label: string;
  tags: string[];
  selectedTags: Set<string>;
  onToggleTag: (tag: string) => void;
}

function TagPanel({ label, tags, selectedTags, onToggleTag }: TagPanelProps) {
  return (
    <div className="paper-card p-5">
      <p className="mb-4 text-sm font-bold text-muted">{label}</p>
      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => (
          <button
            className={`tag-chip ${selectedTags.has(tag) ? "active" : ""}`}
            key={tag}
            onClick={() => onToggleTag(tag)}
            type="button"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
