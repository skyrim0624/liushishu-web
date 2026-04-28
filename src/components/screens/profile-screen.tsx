import { ChangeEvent, useEffect, useRef, useState } from "react";
import { REMINDER_LABELS } from "../../constants";
import { formatCurrency } from "../../lib/date";
import { resizeAvatarFile } from "../../services/avatar";
import { notificationStatusText, requestBrowserNotifications } from "../../services/notifications";
import type { AppState, Screen } from "../../types";
import { Avatar } from "../ui/avatar";

interface ProfileScreenProps {
  state: AppState;
  levelBadge: string;
  onSaveProfileName: (displayName: string) => Promise<string>;
  onSaveAvatar: (avatarUrl: string) => Promise<string>;
  onSaveReminderTimes: (reminderTimes: string[]) => Promise<string>;
  onLogout: () => Promise<void>;
  onShowScreen: (screen: Screen, hideNav?: boolean) => void;
}

export function ProfileScreen({
  state,
  levelBadge,
  onSaveProfileName,
  onSaveAvatar,
  onSaveReminderTimes,
  onLogout,
  onShowScreen
}: ProfileScreenProps) {
  const [displayName, setDisplayName] = useState(state.displayName || "记录者");
  const [reminderTimes, setReminderTimes] = useState(state.reminderTimes);
  const [profileFeedback, setProfileFeedback] = useState("");
  const [reminderFeedback, setReminderFeedback] = useState("");
  const [notificationStatus, setNotificationStatus] = useState(notificationStatusText());
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setDisplayName(state.displayName || "记录者"), [state.displayName]);
  useEffect(() => setReminderTimes(state.reminderTimes), [state.reminderTimes]);

  const flashProfileFeedback = (message: string) => {
    setProfileFeedback(message);
    window.setTimeout(() => setProfileFeedback(""), 2200);
  };

  const flashReminderFeedback = (message: string) => {
    setReminderFeedback(message);
    window.setTimeout(() => setReminderFeedback(""), 2200);
  };

  const saveName = async () => {
    const message = await onSaveProfileName(displayName);
    flashProfileFeedback(message);
  };

  const handleAvatarUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      flashProfileFeedback("请选择图片作为头像");
      return;
    }
    try {
      const avatarUrl = await resizeAvatarFile(file);
      const message = await onSaveAvatar(avatarUrl);
      flashProfileFeedback(message);
    } catch (error) {
      const item = error as { message?: string };
      flashProfileFeedback(item.message || "头像保存失败");
    } finally {
      event.target.value = "";
    }
  };

  const saveReminders = async () => {
    const message = await onSaveReminderTimes(reminderTimes);
    flashReminderFeedback(message);
  };

  const enableNotifications = async () => {
    try {
      const message = await requestBrowserNotifications();
      setNotificationStatus(message);
    } catch {
      setNotificationStatus(notificationStatusText());
    }
  };

  return (
    <div className="screen active" id="screen-profile">
      <main className="profile-stage space-y-5 px-5 pb-24 pt-6">
        <section className="profile-identity paper-card-soft flex items-center gap-4 p-5">
          <button
            className="profile-avatar-button"
            id="btn-avatar-upload"
            onClick={() => fileInputRef.current?.click()}
            type="button"
            aria-label="更换头像"
          >
            <Avatar avatarUrl={state.avatarUrl} displayName={state.displayName} email={state.userEmail} size="profile" />
            <span className="avatar-edit-pill">换头像</span>
          </button>
          <input accept="image/*" className="hidden" onChange={handleAvatarUpload} ref={fileInputRef} type="file" />
          <div className="flex-1">
            <h2 className="text-xl font-bold text-ink" id="profile-display-name">
              {state.displayName || "记录者"}
            </h2>
            <p className="mt-1 text-sm font-bold text-muted" id="profile-level-badge">
              {levelBadge}
            </p>
            <p className="mt-2 text-xs text-muted">头像、昵称和六次提醒会同步到你的账户。</p>
          </div>
          <button
            className="flex h-10 w-10 items-center justify-center rounded-full border border-outline bg-white/80 text-muted"
            id="btn-show-tutorial"
            onClick={() => onShowScreen("tutorial", true)}
            type="button"
          >
            <span className="material-symbols-outlined">help</span>
          </button>
        </section>

        <section className="paper-card space-y-4 p-5">
          <h3 className="text-sm font-bold text-muted">个人资料</h3>
          <div className="flex gap-3">
            <input
              className="flex-1 rounded-2xl border border-outline bg-white px-4 py-3 text-base text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              id="edit-display-name"
              onChange={(event) => setDisplayName(event.target.value)}
              placeholder="修改昵称"
              type="text"
              value={displayName}
            />
            <button className="paper-btn px-5 py-3 text-base" id="btn-save-profile" onClick={() => void saveName()} type="button">
              保存
            </button>
          </div>
          {profileFeedback ? (
            <p className="text-sm text-primary" id="profile-save-feedback">
              {profileFeedback}
            </p>
          ) : null}
        </section>

        <section className="grid grid-cols-3 gap-3">
          <div className="paper-card p-4">
            <p className="text-sm font-bold text-muted">累计能量</p>
            <p className="mt-3 text-2xl font-bold text-ink" id="profile-xp">
              {state.lifetimeXP}
            </p>
          </div>
          <div className="paper-card p-4">
            <p className="text-sm font-bold text-muted">种子基金</p>
            <p className="mt-3 text-2xl font-bold text-primary">
              ¥<span id="profile-current-pool">{formatCurrency(state.currentOfferingPool)}</span>
            </p>
          </div>
          <div className="paper-card p-4">
            <p className="text-sm font-bold text-muted">历史累计</p>
            <p className="mt-3 text-2xl font-bold text-ink">
              ¥<span id="profile-lifetime-money">{formatCurrency(state.lifetimeOfferingAmount)}</span>
            </p>
          </div>
        </section>

        <section className="paper-card space-y-4 p-5" id="reminder-settings-card">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-muted">六次提醒时间</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted">网页端先保存你的六次时间，并在首页显示下一次提醒。</p>
            </div>
            <button
              className="rounded-xl border border-outline px-3 py-2 text-sm font-bold text-primary"
              id="btn-enable-notifications"
              onClick={() => void enableNotifications()}
              type="button"
            >
              通知权限
            </button>
          </div>
          <div className="rounded-xl border border-outline/50 bg-white/50 p-4 text-sm leading-relaxed text-muted">
            建议把六次放在一天自然转折点：起床后、上午开始、午间、下午转换、傍晚、睡前。每次间隔约 2-4 小时即可，按你方便的生活节奏来定。
          </div>
          <p className="text-sm text-muted" id="notification-status">
            {notificationStatus}
          </p>
          <div className="space-y-3" id="reminder-list">
            {REMINDER_LABELS.map((label, index) => (
              <div className="flex items-center gap-3" key={label}>
                <span className="w-16 text-sm font-bold text-muted">{label}</span>
                <input
                  className="flex-1 rounded-2xl border border-outline bg-white px-4 py-3 text-base text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  onChange={(event) => {
                    const next = [...reminderTimes];
                    next[index] = event.target.value;
                    setReminderTimes(next);
                  }}
                  type="time"
                  value={reminderTimes[index] || ""}
                />
              </div>
            ))}
          </div>
          <button className="paper-btn w-full py-4 text-lg" id="btn-save-reminders" onClick={() => void saveReminders()} type="button">
            保存六次提醒
          </button>
          {reminderFeedback ? (
            <p className="text-sm text-primary" id="reminder-save-feedback">
              {reminderFeedback}
            </p>
          ) : null}
        </section>

        <button
          className="w-full rounded-2xl border border-red-200 bg-red-50 py-4 text-base font-bold text-red-600"
          id="btn-logout"
          onClick={() => void onLogout()}
          type="button"
        >
          退出登录
        </button>
      </main>
    </div>
  );
}
