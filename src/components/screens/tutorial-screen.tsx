import type { Screen } from "../../types";

interface TutorialScreenProps {
  onShowScreen: (screen: Screen, hideNav?: boolean) => void;
}

const sections = [
  {
    title: "1. 六次记录怎么做",
    body: "每天固定六个提醒时间。到了时间，就用 1 分钟写下这一个时段你种下了什么种子。首页会显示你今天进行到第几次。"
  },
  {
    title: "2. 四个入口分别何时用",
    body: "财富种子记录供养、分享机会、成就他人。关系种子记录陪伴、倾听、关怀。健康种子记录助人就医、减轻痛苦。觉察入口记录嫉妒、评判、拖延等需要清理的念头。"
  },
  {
    title: "3. 睡前复盘怎么写",
    body: "睡前回想今天种下了哪些好种子，有没有需要清理的念头，明天还想继续种什么。带着感恩结束这一天。"
  },
  {
    title: "4. 种子基金和取出行善是什么意思",
    body: "每次财富记录中的供养金额会进入种子基金。你可以阶段性点击“取出行善”，把当前基金归零重新开始，用于布施、助人或支持善缘；历史累计不会被清掉。"
  }
];

export function TutorialScreen({ onShowScreen }: TutorialScreenProps) {
  return (
    <div className="screen active" id="screen-tutorial">
      <main className="guide-stage space-y-6 px-5 pb-24 pt-8">
        <section className="text-center">
          <h2 className="text-2xl font-bold text-ink">怎么使用幸福种子银行？</h2>
          <p className="mt-2 text-base text-muted">把六时书变成每天都能完成的固定动作。</p>
        </section>

        <section className="space-y-4">
          {sections.map((section) => (
            <div className="paper-card p-5" key={section.title}>
              <h3 className="text-lg font-bold text-ink">{section.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{section.body}</p>
            </div>
          ))}
        </section>

        <button className="paper-btn w-full py-4 text-lg" id="btn-tutorial-back" onClick={() => onShowScreen("home")} type="button">
          回到记录
        </button>
      </main>
    </div>
  );
}
