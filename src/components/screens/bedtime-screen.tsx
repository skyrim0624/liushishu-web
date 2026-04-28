import { useState } from "react";

interface BedtimeScreenProps {
  onSaveBedtimeReview: (q1: string, q2: string, q3: string) => Promise<string>;
}

export function BedtimeScreen({ onSaveBedtimeReview }: BedtimeScreenProps) {
  const [q1, setQ1] = useState("");
  const [q2, setQ2] = useState("");
  const [q3, setQ3] = useState("");
  const [buttonText, setButtonText] = useState("保存并入睡");

  const save = async () => {
    const message = await onSaveBedtimeReview(q1, q2, q3);
    setButtonText(message);
    window.setTimeout(() => setButtonText("保存并入睡"), 1200);
  };

  return (
    <div className="screen active" id="screen-bedtime">
      <main className="bedtime-stage px-5 pb-24 pt-8">
        <section className="paper-card-soft p-5 text-center">
          <h2 className="text-2xl font-bold leading-relaxed text-ink">入睡前想一遍今天种下了什么好的种子，带着感恩入睡</h2>
        </section>

        <section className="mt-5 space-y-4">
          <ReviewQuestion
            icon="volunteer_activism"
            label="今天种下了哪些好的种子？"
            onChange={setQ1}
            placeholder="回想今天的布施、善意、帮助、关怀..."
            value={q1}
          />
          <ReviewQuestion
            icon="psychology_alt"
            label="今天有没有需要觉察和清理的念头？"
            onChange={setQ2}
            placeholder="比如评判、急躁、嫉妒、拖延或逃避..."
            value={q2}
          />
          <ReviewQuestion
            icon="rocket_launch"
            label="明天想继续种下什么种子？"
            onChange={setQ3}
            placeholder="写下明天要持续的一个行动或提醒。"
            value={q3}
          />
        </section>

        <button className="paper-btn mt-5 w-full py-4 text-lg" id="btn-bedtime-done" onClick={() => void save()} type="button">
          {buttonText}
        </button>
      </main>
    </div>
  );
}

interface ReviewQuestionProps {
  icon: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

function ReviewQuestion({ icon, label, placeholder, value, onChange }: ReviewQuestionProps) {
  return (
    <div className="paper-card p-5">
      <label className="mb-3 flex items-center gap-2 text-sm font-bold text-muted">
        <span className="material-symbols-outlined text-base">{icon}</span>
        {label}
      </label>
      <textarea
        className="h-24 w-full resize-none border-0 bg-transparent p-0 text-base leading-relaxed text-ink placeholder:text-muted/60 focus:ring-0"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}
