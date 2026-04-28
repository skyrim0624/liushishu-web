import { CATEGORY_LABELS } from "../../constants";
import { formatCurrency } from "../../lib/date";
import type { AppState, Screen } from "../../types";

interface SuccessScreenProps {
  state: AppState;
  onShowScreen: (screen: Screen, hideNav?: boolean) => void;
}

export function SuccessScreen({ state, onShowScreen }: SuccessScreenProps) {
  const entry = state.successEntry;
  const isWealth = entry?.category === "wealth";
  const detail = entry?.note || (entry?.tags.length ? entry.tags.slice(0, 4).join("、") : "已完成本次记录。");

  return (
    <div className="screen active" id="screen-success">
      <main className="success-stage flex min-h-[88vh] flex-col items-center justify-center px-6 pb-24 pt-10 text-center">
        <div className="paper-card flex h-32 w-32 items-center justify-center rounded-full">
          <span className="material-symbols-outlined text-6xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>
            add_task
          </span>
        </div>
        <h2 className="mt-8 text-3xl font-bold text-ink" id="success-title">
          记录完成
        </h2>
        <p className="mt-2 text-base text-muted">
          {isWealth ? "这一份供养已经进入你的种子基金。" : "这一刻已经加入你的六时书轨迹。"}
        </p>

        <div className="paper-card-soft mt-8 w-full max-w-sm p-5 text-left">
          <p className="text-sm font-bold text-primary">本次记录</p>
          <p className="mt-3 text-base text-ink">{entry ? CATEGORY_LABELS[entry.category] : "本次记录"}</p>
          {isWealth ? (
            <div className="mt-3 flex items-end gap-2">
              <span className="pb-1 text-xl text-primary">¥</span>
              <span className="text-3xl font-bold text-primary" id="success-money">
                {formatCurrency(entry?.money_amount || 0)}
              </span>
            </div>
          ) : null}
          <p className="mt-3 text-sm leading-relaxed text-muted">{detail}</p>
        </div>

        <button
          className="paper-btn mt-8 w-full max-w-sm py-4 text-lg"
          id="btn-success-home"
          onClick={() => onShowScreen("home")}
          type="button"
        >
          回到今日面板
        </button>
      </main>
    </div>
  );
}
