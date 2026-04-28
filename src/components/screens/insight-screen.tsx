import { formatCurrency } from "../../lib/date";
import type { AppState } from "../../types";

interface InsightScreenProps {
  state: AppState;
}

export function InsightScreen({ state }: InsightScreenProps) {
  const insights = [
    `本周你已经累计完成 ${state.timelineEntries.length} 次记录，真正有效的是你持续回来觉知这一点。`,
    `财富种子累计历史供养 ¥${formatCurrency(state.lifetimeOfferingAmount)}，种子基金还有 ¥${formatCurrency(
      state.currentOfferingPool
    )}。`,
    "关系、健康、觉察三条线都值得平衡推进。试着在下一轮刻意补上今天最少的一类种子。"
  ];

  return (
    <div className="screen active" id="screen-ai-insight">
      <main className="insight-stage space-y-6 px-5 pb-24 pt-8">
        <section className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10">
            <span className="material-symbols-outlined text-3xl text-primary">psychology</span>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-ink">智慧周报</h2>
          <p className="mt-1 text-sm text-muted">用一周记录看见种子如何发芽</p>
        </section>

        <section className="paper-card p-5">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-primary" />
            <span className="text-sm font-bold text-primary">本周洞察</span>
          </div>
          <div className="mt-4 space-y-3" id="ai-report-content">
            {insights.map((text) => (
              <div className="rounded-2xl border border-outline bg-white/80 p-4 text-sm leading-relaxed text-muted" key={text}>
                {text}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
