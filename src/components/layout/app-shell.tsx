import { useEffect, type ReactNode } from "react";
import { assets } from "../../assets";
import type { AppState, Screen } from "../../types";
import { Avatar } from "../ui/avatar";
import { BedtimeNavIcon, HomeNavIcon, ProfileNavIcon, TimelineNavIcon } from "../ui/seed-icons";

interface AppShellProps {
  state: AppState;
  children: ReactNode;
  onShowScreen: (screen: Screen, hideNav?: boolean) => void;
}

const navItems: Array<{ screen: Screen; label: string; icon: ReactNode }> = [
  { screen: "home", label: "花园", icon: <HomeNavIcon /> },
  { screen: "timeline", label: "历程", icon: <TimelineNavIcon /> },
  { screen: "bedtime", label: "复盘", icon: <BedtimeNavIcon /> },
  { screen: "profile", label: "我的", icon: <ProfileNavIcon /> }
];

export function AppShell({ state, children, onShowScreen }: AppShellProps) {
  useVisualViewportHeight();

  const isAuthScreen = state.currentScreen === "auth";
  const shouldHideNav = state.hideNav || isAuthScreen;

  return (
    <div className="app-shell">
      <div className="botanical-vine-frame" aria-hidden="true">
        <span className="botanical-vine-frame__side botanical-vine-frame__side--left" />
        <span className="botanical-vine-frame__side botanical-vine-frame__side--right" />
      </div>

      <header className="app-header absolute top-0 left-0 z-50 flex h-14 w-full items-center justify-between border-b border-outline bg-surface px-5">
        <div className="flex items-center gap-3">
          <button
            className={`text-primary ${!state.hideNav || isAuthScreen ? "hidden" : ""}`}
            id="btn-global-back"
            onClick={() => onShowScreen("home")}
            aria-label="返回今日面板"
            type="button"
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>
          <img alt="" aria-hidden="true" className="brand-logo brand-logo-header" src={assets.seedBankLogo} />
          <div>
            <h1 className="text-lg font-bold tracking-[0.12em] text-primary">幸福种子银行</h1>
          </div>
        </div>
        <button
          className={`header-avatar-button ${state.hideNav || isAuthScreen ? "hidden" : ""}`}
          id="header-avatar-button"
          onClick={() => onShowScreen("profile")}
          aria-label="进入我的页面"
          type="button"
        >
          <Avatar
            avatarUrl={state.avatarUrl}
            displayName={state.displayName}
            email={state.userEmail}
            size="header"
          />
        </button>
      </header>

      <div className="relative h-full overflow-y-auto pt-14" id="app">
        {children}
      </div>

      <nav
        aria-hidden={shouldHideNav}
        className="absolute bottom-0 left-0 z-50 flex h-20 w-full items-center justify-around border-t border-outline bg-surface px-2 transition-transform duration-300"
        id="bottom-nav"
        style={{
          transform: shouldHideNav ? "translateY(100%)" : "translateY(0)",
          pointerEvents: shouldHideNav ? "none" : undefined,
          opacity: shouldHideNav ? 0 : undefined
        }}
      >
        {navItems.map((item) => {
          const active = state.currentScreen === item.screen;
          return (
            <button
              className={`nav-item flex flex-1 flex-col items-center justify-center gap-1 ${
                active ? "text-primary" : "text-muted"
              }`}
              data-target={item.screen}
              key={item.screen}
              onClick={() => onShowScreen(item.screen)}
              type="button"
            >
              {item.icon}
              <span className="text-xs font-bold">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function useVisualViewportHeight() {
  useEffect(() => {
    const root = document.documentElement;
    const viewport = window.visualViewport;

    const updateViewportHeight = () => {
      const height = Math.floor(viewport?.height || window.innerHeight);
      root.style.setProperty("--app-viewport-height", `${height}px`);
    };

    updateViewportHeight();
    window.addEventListener("resize", updateViewportHeight);
    viewport?.addEventListener("resize", updateViewportHeight);
    viewport?.addEventListener("scroll", updateViewportHeight);

    return () => {
      window.removeEventListener("resize", updateViewportHeight);
      viewport?.removeEventListener("resize", updateViewportHeight);
      viewport?.removeEventListener("scroll", updateViewportHeight);
      root.style.removeProperty("--app-viewport-height");
    };
  }, []);
}
