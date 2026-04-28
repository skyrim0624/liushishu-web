import { FormEvent, useState } from "react";
import { assets } from "../../assets";
import type { AppState } from "../../types";

interface AuthScreenProps {
  state: AppState;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (email: string, password: string, displayName: string) => Promise<void>;
  onToggleMode: () => void;
}

export function AuthScreen({ state, onLogin, onRegister, onToggleMode }: AuthScreenProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const isRegister = state.authMode === "register";

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isRegister) {
      void onRegister(email.trim(), password, displayName.trim());
      return;
    }
    void onLogin(email.trim(), password);
  };

  return (
    <div className="screen active" id="screen-auth">
      <main className="auth-stage flex min-h-[86vh] items-center justify-center px-8 py-8">
        <form className="w-full max-w-sm space-y-8" onSubmit={submit}>
          <div className="space-y-3 text-center">
            <img alt="" aria-hidden="true" className="brand-logo brand-logo-hero mx-auto mb-4" src={assets.seedBankLogo} />
            <h2 className="text-3xl font-bold text-ink">播种新思</h2>
            <p className="text-base leading-relaxed text-muted">在六个时段里，照看今天的善意、觉察与行动。</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-bold text-muted" htmlFor="auth-email">
                邮箱
              </label>
              <input
                className="w-full rounded-2xl border border-outline bg-white px-4 py-4 text-base text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                id="auth-email"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                type="email"
                value={email}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-bold text-muted" htmlFor="auth-password">
                密码
              </label>
              <input
                className="w-full rounded-2xl border border-outline bg-white px-4 py-4 text-base text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                id="auth-password"
                onChange={(event) => setPassword(event.target.value)}
                placeholder="至少 6 位"
                type="password"
                value={password}
              />
            </div>
            <div className={isRegister ? "" : "hidden"}>
              <label className="mb-2 block text-sm font-bold text-muted" htmlFor="auth-display-name">
                你的昵称
              </label>
              <input
                className="w-full rounded-2xl border border-outline bg-white px-4 py-4 text-base text-ink outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                id="auth-display-name"
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="别人怎么称呼你？"
                type="text"
                value={displayName}
              />
            </div>
          </div>

          {state.authError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 text-center text-sm text-red-700" id="auth-error">
              {state.authError}
            </div>
          ) : null}

          <div className="space-y-3">
            <button
              className={`paper-btn w-full py-4 text-lg ${isRegister ? "hidden" : ""}`}
              disabled={state.isAuthLoading}
              id="btn-auth-login"
              type="submit"
            >
              登录
            </button>
            <button
              className={`w-full rounded-2xl border border-outline bg-white py-4 text-lg font-bold text-ink transition active:scale-95 ${
                isRegister ? "paper-btn border-0 bg-transparent text-white" : ""
              }`}
              disabled={state.isAuthLoading}
              id="btn-auth-register"
              type={isRegister ? "submit" : "button"}
              onClick={isRegister ? undefined : onToggleMode}
            >
              {isRegister ? "创建账号" : "注册新账号"}
            </button>
          </div>

          <p className="cursor-pointer text-center text-sm text-muted" onClick={onToggleMode}>
            {isRegister ? "已有账号？" : "还没有账号？"}
            <span className="font-bold text-primary" id="auth-toggle-link">
              {isRegister ? "去登录" : "去注册"}
            </span>
          </p>
        </form>
      </main>
    </div>
  );
}
