import { Capacitor } from "@capacitor/core";
import { App as CapApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { IonApp, IonRouterOutlet, setupIonicReact } from "@ionic/react";
import { IonReactRouter } from "@ionic/react-router";
import { Route, Switch, useLocation } from "react-router-dom";
import { Suspense, lazy, useEffect, useMemo } from "react";
const DashboardScreen = lazy(() =>
  import("./screens/DashboardScreen").then((m) => ({
    default: m.DashboardScreen,
  })),
);
import { CustomTabBar } from "./components/CustomTabBar";
import { NewTaskSheet } from "./components/NewTaskSheet";
import { NativeNotificationBridge } from "./components/NativeNotificationBridge";
import { ScreenLoadingSkeleton } from "./components/ScreenLoadingSkeleton";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { TasksProvider, useTasks } from "./lib/tasks-context";
import { RoutinesProvider, useRoutines } from "./lib/routines-context";
import { AuthProvider, isAuthRoute } from "./lib/auth-context";
import { AuthGate } from "./components/AuthGate";
import { SyncProvider } from "./lib/sync-context";
import { ProfileProvider } from "./lib/profile-context";
import { NotificationsProvider } from "./lib/notifications-context";
import { ToastProvider } from "./lib/toast-context";
import { ImportLocalDataSheet } from "./components/ImportLocalDataSheet";
import { NotificationPermissionSheet } from "./components/NotificationPermissionSheet";
import { AnalyticsConsentSheet } from "./components/AnalyticsConsentSheet";
import { syncNativeSchedulesFromStorage } from "./lib/native-notifications";
import { handleAuthDeepLink } from "./lib/auth-deeplink";
import { captureException } from "./lib/posthog";
import { MotionProvider } from "./lib/motion";

const AgendaScreen = lazy(() =>
  import("./screens/AgendaScreen").then((m) => ({ default: m.AgendaScreen })),
);
const StatsScreen = lazy(() =>
  import("./screens/StatsScreen").then((m) => ({ default: m.StatsScreen })),
);
const ProfileScreen = lazy(() =>
  import("./screens/ProfileScreen").then((m) => ({ default: m.ProfileScreen })),
);
const NotificationsScreen = lazy(() =>
  import("./screens/NotificationsScreen").then((m) => ({
    default: m.NotificationsScreen,
  })),
);
const SettingsScreen = lazy(() =>
  import("./screens/SettingsScreen").then((m) => ({
    default: m.SettingsScreen,
  })),
);
const NotificationPreferencesScreen = lazy(() =>
  import("./screens/NotificationPreferencesScreen").then((m) => ({
    default: m.NotificationPreferencesScreen,
  })),
);
const PrivacyPolicyScreen = lazy(() =>
  import("./screens/PrivacyPolicyScreen").then((m) => ({
    default: m.PrivacyPolicyScreen,
  })),
);
const RoutinesScreen = lazy(() =>
  import("./screens/RoutinesScreen").then((m) => ({
    default: m.RoutinesScreen,
  })),
);
const OnboardingRoutineScreen = lazy(() =>
  import("./screens/OnboardingRoutineScreen").then((m) => ({
    default: m.OnboardingRoutineScreen,
  })),
);
import { LoginScreen } from "./screens/LoginScreen";
import { SignUpScreen } from "./screens/SignUpScreen";
import { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen";

setupIonicReact({
  mode: "ios",
  swipeBackEnabled: true,
  hardwareBackButton: true,
});

function GlobalTaskSheet() {
  const {
    isNewTaskOpen,
    taskToEdit,
    createTaskDatePrefill,
    closeTaskSheet,
    submitTask,
  } = useTasks();
  const { createRoutine } = useRoutines();
  return (
    <NewTaskSheet
      isOpen={isNewTaskOpen}
      onClose={closeTaskSheet}
      onSubmit={submitTask}
      taskToEdit={taskToEdit}
      defaultScheduledDate={createTaskDatePrefill ?? undefined}
      allowRoutineMode={!taskToEdit}
      onSubmitRoutine={(input) => createRoutine(input)}
    />
  );
}

function AppRoutes() {
  const { tasks } = useTasks();
  const location = useLocation();
  const isOnboarding = location.pathname === "/rotina/montar";
  const showTabBar = !isAuthRoute(location.pathname) && !isOnboarding;

  const notificationFingerprint = useMemo(
    () =>
      tasks
        .map(
          (t) =>
            `${t.id}:${t.status}:${t.scheduledTime ?? ""}:${t.scheduledDate ?? ""}:${t.duration}`,
        )
        .join("|"),
    [tasks],
  );

  useEffect(() => {
    void syncNativeSchedulesFromStorage(tasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationFingerprint]);

  return (
    <>
      <AuthGate>
        <IonRouterOutlet animated={false}>
          <Switch>
            <Route
              exact
              path="/"
              render={() => (
                <ErrorBoundary context="dashboard">
                  <Suspense
                    fallback={<ScreenLoadingSkeleton variant="dashboard" />}
                  >
                    <DashboardScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/agenda"
              render={() => (
                <ErrorBoundary context="agenda">
                  <Suspense
                    fallback={<ScreenLoadingSkeleton variant="agenda" />}
                  >
                    <AgendaScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/stats"
              render={() => (
                <ErrorBoundary context="stats">
                  <Suspense fallback={<ScreenLoadingSkeleton variant="stats" />}>
                    <StatsScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/perfil"
              render={() => (
                <ErrorBoundary context="profile">
                  <Suspense
                    fallback={<ScreenLoadingSkeleton variant="profile" />}
                  >
                    <ProfileScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/notificacoes"
              render={() => (
                <ErrorBoundary context="notifications">
                  <Suspense
                    fallback={<ScreenLoadingSkeleton variant="dashboard" />}
                  >
                    <NotificationsScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/preferencias"
              render={() => (
                <ErrorBoundary context="settings">
                  <Suspense
                    fallback={<ScreenLoadingSkeleton variant="profile" />}
                  >
                    <SettingsScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/rotinas"
              render={() => (
                <ErrorBoundary context="routines">
                  <Suspense
                    fallback={<ScreenLoadingSkeleton variant="agenda" />}
                  >
                    <RoutinesScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/rotina/montar"
              render={() => (
                <ErrorBoundary context="routines-onboarding">
                  <Suspense
                    fallback={<ScreenLoadingSkeleton variant="agenda" />}
                  >
                    <OnboardingRoutineScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/privacidade"
              render={() => (
                <ErrorBoundary context="privacy">
                  <Suspense
                    fallback={<ScreenLoadingSkeleton variant="profile" />}
                  >
                    <PrivacyPolicyScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/notificacoes/preferencias"
              render={() => (
                <ErrorBoundary context="notification-preferences">
                  <Suspense
                    fallback={<ScreenLoadingSkeleton variant="profile" />}
                  >
                    <NotificationPreferencesScreen />
                  </Suspense>
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/login"
              render={() => (
                <ErrorBoundary context="login">
                  <LoginScreen />
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/cadastro"
              render={() => (
                <ErrorBoundary context="signup">
                  <SignUpScreen />
                </ErrorBoundary>
              )}
            />
            <Route
              exact
              path="/recuperar-senha"
              render={() => (
                <ErrorBoundary context="password-recovery">
                  <ForgotPasswordScreen />
                </ErrorBoundary>
              )}
            />
          </Switch>
        </IonRouterOutlet>
      </AuthGate>
      {showTabBar ? <CustomTabBar /> : null}
      <GlobalTaskSheet />
      <NativeNotificationBridge />
      <ImportLocalDataSheet />
      <NotificationPermissionSheet />
      <AnalyticsConsentSheet />
    </>
  );
}

function App() {
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      document.documentElement.classList.add("native-platform");
    }
  }, []);

  useEffect(() => {
    const initNative = async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch (err) {
        if (
          err instanceof Error &&
          err.message &&
          !err.message.includes("not implemented")
        ) {
          captureException(err);
        }
      }
    };

    initNative();

    const backListener = CapApp.addListener("backButton", ({ canGoBack }) => {
      if (canGoBack) {
        window.history.back();
      } else {
        CapApp.exitApp();
      }
    });

    const urlListener = CapApp.addListener("appUrlOpen", (event) => {
      void handleAuthDeepLink(event.url);
    });

    return () => {
      void backListener.then((l) => l.remove());
      void urlListener.then((l) => l.remove());
    };
  }, []);

  return (
    <MotionProvider>
      <IonApp>
        <ToastProvider>
          <AuthProvider>
            <SyncProvider>
              <ProfileProvider>
                <RoutinesProvider>
                  <TasksProvider>
                    <NotificationsProvider>
                      <IonReactRouter>
                        <AppRoutes />
                      </IonReactRouter>
                    </NotificationsProvider>
                  </TasksProvider>
                </RoutinesProvider>
              </ProfileProvider>
            </SyncProvider>
          </AuthProvider>
        </ToastProvider>
      </IonApp>
    </MotionProvider>
  );
}

export default App;
