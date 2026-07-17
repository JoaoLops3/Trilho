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
import { TasksProvider, useTasks } from "./lib/tasks-context";
import { RoutinesProvider, useRoutines } from "./lib/routines-context";
import { AuthProvider, isAuthRoute } from "./lib/auth-context";
import { AuthGate } from "./components/AuthGate";
import { SyncProvider } from "./lib/sync-context";
import { ProfileProvider } from "./lib/profile-context";
import { NotificationsProvider } from "./lib/notifications-context";
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
import { LoginScreen } from "./screens/LoginScreen";
import { SignUpScreen } from "./screens/SignUpScreen";
import { ForgotPasswordScreen } from "./screens/ForgotPasswordScreen";

setupIonicReact({
  mode: "ios",
  swipeBackEnabled: true,
  hardwareBackButton: true,
});

function RouteFallback() {
  return (
    <div
      className="fixed inset-0 z-0"
      style={{ backgroundColor: "#0d0d12" }}
      aria-hidden="true"
    />
  );
}

function GlobalTaskSheet() {
  const { isNewTaskOpen, taskToEdit, closeTaskSheet, submitTask } = useTasks();
  const { createRoutine } = useRoutines();
  return (
    <NewTaskSheet
      isOpen={isNewTaskOpen}
      onClose={closeTaskSheet}
      onSubmit={submitTask}
      taskToEdit={taskToEdit}
      allowRoutineMode={!taskToEdit}
      onSubmitRoutine={(input) => createRoutine(input)}
    />
  );
}

function AppRoutes() {
  const { tasks } = useTasks();
  const location = useLocation();
  const showTabBar = !isAuthRoute(location.pathname);

  const notificationFingerprint = useMemo(
    () =>
      tasks
        .map(
          (t) => `${t.id}:${t.status}:${t.scheduledTime ?? ""}:${t.duration}`,
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
        <Suspense fallback={<RouteFallback />}>
          <IonRouterOutlet animated={false}>
            <Switch>
              <Route exact path="/" component={DashboardScreen} />
              <Route exact path="/agenda" component={AgendaScreen} />
              <Route exact path="/stats" component={StatsScreen} />
              <Route exact path="/perfil" component={ProfileScreen} />
              <Route
                exact
                path="/notificacoes"
                component={NotificationsScreen}
              />
              <Route exact path="/preferencias" component={SettingsScreen} />
              <Route exact path="/rotinas" component={RoutinesScreen} />
              <Route
                exact
                path="/privacidade"
                component={PrivacyPolicyScreen}
              />
              <Route
                exact
                path="/notificacoes/preferencias"
                component={NotificationPreferencesScreen}
              />
              <Route exact path="/login" component={LoginScreen} />
              <Route exact path="/cadastro" component={SignUpScreen} />
              <Route
                exact
                path="/recuperar-senha"
                component={ForgotPasswordScreen}
              />
            </Switch>
          </IonRouterOutlet>
        </Suspense>
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
      </IonApp>
    </MotionProvider>
  );
}

export default App;
