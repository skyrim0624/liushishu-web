import { AppShell } from "./components/layout/app-shell";
import { AuthScreen } from "./components/screens/auth-screen";
import { BedtimeScreen } from "./components/screens/bedtime-screen";
import { CheckinScreen } from "./components/screens/checkin-screen";
import { HomeScreen } from "./components/screens/home-screen";
import { InsightScreen } from "./components/screens/insight-screen";
import { ProfileScreen } from "./components/screens/profile-screen";
import { SuccessScreen } from "./components/screens/success-screen";
import { TimelineScreen } from "./components/screens/timeline-screen";
import { TutorialScreen } from "./components/screens/tutorial-screen";
import { useLiushishuApp } from "./hooks/use-liushishu-app";

export function App() {
  const app = useLiushishuApp();
  const { state } = app;

  const screen = (() => {
    switch (state.currentScreen) {
      case "auth":
        return (
          <AuthScreen
            state={state}
            onLogin={app.login}
            onRegister={app.register}
            onToggleMode={app.toggleAuthMode}
          />
        );
      case "home":
        return (
          <HomeScreen
            state={state}
            onPrepareCheckin={app.prepareCheckin}
            onShowScreen={app.showScreen}
            onWithdrawOfferingPool={app.withdrawOfferingPool}
          />
        );
      case "timeline":
        return <TimelineScreen state={state} onSelectDate={app.updateSelectedTimelineDate} />;
      case "checkin":
        return <CheckinScreen state={state} onToggleTag={app.toggleTag} onSubmit={app.submitCheckin} />;
      case "success":
        return <SuccessScreen state={state} onShowScreen={app.showScreen} />;
      case "ai-insight":
        return <InsightScreen state={state} />;
      case "tutorial":
        return <TutorialScreen onShowScreen={app.showScreen} />;
      case "bedtime":
        return <BedtimeScreen onSaveBedtimeReview={app.saveBedtimeReview} />;
      case "profile":
        return (
          <ProfileScreen
            state={state}
            levelBadge={app.levelBadge}
            onLogout={app.logout}
            onSaveAvatar={app.saveAvatar}
            onSaveProfileName={app.saveProfileName}
            onSaveReminderTimes={app.saveReminderTimes}
            onShowScreen={app.showScreen}
          />
        );
      default:
        return null;
    }
  })();

  return (
    <AppShell state={state} onShowScreen={app.showScreen}>
      {screen}
    </AppShell>
  );
}
