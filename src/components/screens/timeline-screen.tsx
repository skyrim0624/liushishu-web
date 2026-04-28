import { CATEGORY_LABELS } from "../../constants";
import { entriesForDate, formatTimelineDateLabel, isSameMonth, parseSelectedDate, toDateKey } from "../../lib/date";
import type { AppState } from "../../types";

interface TimelineScreenProps {
  state: AppState;
  onSelectDate: (dateKey: string) => void;
}

export function TimelineScreen({ state, onSelectDate }: TimelineScreenProps) {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const selectedDate = parseSelectedDate(state.selectedTimelineDateKey);
  const selectedKey = toDateKey(selectedDate);
  const monthEntries = state.timelineEntries.filter((entry) => isSameMonth(new Date(entry.created_at || Date.now()), today));
  const selectedEntries = entriesForDate(state.timelineEntries, selectedDate);
  const countByDay: Record<number, number> = {};

  monthEntries.forEach((entry) => {
    const date = new Date(entry.created_at || Date.now());
    const day = date.getDate();
    countByDay[day] = (countByDay[day] || 0) + 1;
  });

  return (
    <div className="screen active" id="screen-timeline">
      <main className="timeline-stage space-y-6 px-5 pb-24 pt-8">
        <section className="text-center">
          <p className="text-sm tracking-[0.18em] text-muted">TIME ECHO</p>
          <h2 className="mt-1 text-2xl font-bold text-ink">
            {today.getFullYear()} 年 {today.getMonth() + 1} 月记录
          </h2>
        </section>

        <section className="paper-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted">六时书热力图</h3>
            <span className="text-sm text-muted">本月 {monthEntries.length} 次记录</span>
          </div>
          <div className="grid grid-cols-7 gap-1" id="calendar-grid">
            {Array.from({ length: monthStart.getDay() }).map((_, index) => (
              <div className="calendar-cell calendar-blank aspect-square rounded-xl bg-transparent" key={`blank-${index}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, index) => {
              const day = index + 1;
              const level = Math.min(countByDay[day] || 0, 4);
              const cellDate = new Date(today.getFullYear(), today.getMonth(), day);
              const cellKey = toDateKey(cellDate);
              const isSelected = cellKey === selectedKey;
              const isToday = cellKey === toDateKey(today);
              const isFuture = cellDate > todayStart;
              const tones = ["bg-surface", "bg-primary/10", "bg-primary/25", "bg-primary/40", "bg-primary text-white"];

              return (
                <button
                  aria-label={`${today.getMonth() + 1} 月 ${day} 日${
                    countByDay[day] ? `，${countByDay[day]} 次记录` : "，暂无记录"
                  }`}
                  aria-pressed={isSelected}
                  className={[
                    "calendar-cell",
                    "flex aspect-square items-center justify-center rounded-xl text-sm transition",
                    tones[level],
                    isSelected ? "is-selected" : "",
                    isToday ? "is-today" : "",
                    isFuture ? "is-future" : ""
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  disabled={isFuture}
                  key={cellKey}
                  onClick={() => onSelectDate(cellKey)}
                  type="button"
                >
                  {day}
                </button>
              );
            })}
          </div>
        </section>

        <section className="paper-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-sm font-bold text-muted">当日记录</h3>
            <span className="text-sm text-primary">{formatTimelineDateLabel(selectedDate)}</span>
          </div>
          <div className="space-y-4" id="timeline-detail">
            {selectedEntries.length ? (
              selectedEntries.map((entry, index) => {
                const date = new Date(entry.created_at || Date.now());
                const time = date.toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                  hour12: false
                });
                const detail = entry.note || (entry.tags.length ? entry.tags.slice(0, 3).join("、") : "写下了一个新的提醒。");
                return (
                  <div className="rounded-2xl border border-outline bg-white/80 p-4" key={`${entry.created_at}-${index}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm text-muted">{time}</p>
                        <h4 className="mt-1 text-base font-bold text-ink">{CATEGORY_LABELS[entry.category]}</h4>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                        {entry.session_index ? `第 ${entry.session_index} 次` : "已记录"}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-muted">{detail}</p>
                  </div>
                );
              })
            ) : (
              <div className="rounded-2xl border border-outline bg-white/70 p-4 text-sm leading-relaxed text-muted">
                这一天还没有记录。可以回到首页开始一次六时书，或点选其他有颜色的日期查看记录。
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
