import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { mapAuthError } from "./auth-errors";
import { getAuthRedirectPath } from "./app-url";
import {
  clearAuthParamsFromUrl,
  clearPasswordRecoveryPending,
  markPasswordRecoveryPending,
  readPasswordRecoveryPending,
} from "./auth-deeplink";
import { loadProfile, saveProfile } from "./profile-storage";
import { clearAllLocalAppData } from "./user-data-export";
import { captureEvent, identifyUser, resetAnalyticsUser } from "./posthog";
import { getSupabase, isSupabaseConfigured } from "./supabase";

/** Rota da tela de definir nova senha após o link de recovery (iOS + web). */
export const NEW_PASSWORD_PATH = "/nova-senha";

interface AuthResult {
  error: string | null;
  needsEmailConfirmation?: boolean;
}

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authConfigured: boolean;
  /** Sessão veio do link de recuperação — deve concluir em /nova-senha. */
  passwordRecoveryPending: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (
    email: string,
    password: string,
    displayName: string,
  ) => Promise<AuthResult>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<AuthResult>;
  resetPassword: (email: string) => Promise<AuthResult>;
  updatePassword: (password: string) => Promise<AuthResult>;
  clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return ctx;
}

function getDisplayNameFromUser(user: User): string | null {
  const raw = user.user_metadata?.display_name;
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  return trimmed.length > 0 ? trimmed : null;
}

async function ensureProfileRow(user: User): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  const metaName = getDisplayNameFromUser(user);

  const { data: existing } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", user.id)
    .maybeSingle();

  if (!existing) {
    await supabase.from("profiles").upsert(
      {
        id: user.id,
        ...(metaName ? { display_name: metaName } : {}),
      },
      { onConflict: "id" },
    );
    if (metaName) {
      const local = loadProfile();
      saveProfile({ ...local, accountName: metaName });
    }
    return;
  }

  if (metaName && existing.display_name === "Alex") {
    await supabase
      .from("profiles")
      .update({ display_name: metaName })
      .eq("id", user.id);
    const local = loadProfile();
    saveProfile({ ...local, accountName: metaName });
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured());
  const [passwordRecoveryPending, setPasswordRecoveryPending] = useState(() =>
    readPasswordRecoveryPending(),
  );

  const clearPasswordRecovery = useCallback(() => {
    clearPasswordRecoveryPending();
    setPasswordRecoveryPending(false);
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        void ensureProfileRow(data.session.user);
        identifyUser(data.session.user.id);
      }
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      if (event === "PASSWORD_RECOVERY") {
        markPasswordRecoveryPending();
        setPasswordRecoveryPending(true);
        clearAuthParamsFromUrl();
      }

      if (event === "SIGNED_IN" && nextSession?.user) {
        void ensureProfileRow(nextSession.user);
        identifyUser(nextSession.user.id);
        captureEvent("auth signed in");
      }

      if (event === "SIGNED_OUT") {
        clearPasswordRecoveryPending();
        setPasswordRecoveryPending(false);
        resetAnalyticsUser();
        captureEvent("auth signed out");
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string): Promise<AuthResult> => {
      const supabase = getSupabase();
      if (!supabase) {
        return { error: "Conta na nuvem não configurada neste ambiente." };
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      return { error: mapAuthError(error) };
    },
    [],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      displayName: string,
    ): Promise<AuthResult> => {
      const supabase = getSupabase();
      if (!supabase) {
        return {
          error: "Conta na nuvem não configurada neste ambiente.",
          needsEmailConfirmation: false,
        };
      }

      const trimmedName = displayName.trim();

      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: getAuthRedirectPath("/login"),
          data: { display_name: trimmedName },
        },
      });

      if (error) {
        return { error: mapAuthError(error), needsEmailConfirmation: false };
      }

      const needsEmailConfirmation = !data.session && Boolean(data.user);
      if (data.session?.user) {
        await ensureProfileRow(data.session.user);
        const local = loadProfile();
        saveProfile({
          ...local,
          accountName: trimmedName,
          nickname: local.nickname,
        });
        captureEvent("auth signed up");
      } else if (needsEmailConfirmation) {
        captureEvent("auth signed up", { pending_email_confirmation: true });
      }

      return { error: null, needsEmailConfirmation };
    },
    [],
  );

  const signOut = useCallback(async (): Promise<void> => {
    const supabase = getSupabase();
    if (!supabase) return;

    const hadSession = Boolean(session?.user ?? user);
    clearPasswordRecoveryPending();
    setPasswordRecoveryPending(false);

    if (hadSession) {
      clearAllLocalAppData();
    }

    await supabase.auth.signOut();
  }, [session, user]);

  const deleteAccount = useCallback(async (): Promise<AuthResult> => {
    const supabase = getSupabase();
    if (!supabase) {
      return { error: "Conta na nuvem não configurada neste ambiente." };
    }

    const { error } = await supabase.rpc("delete_own_account");
    if (error) {
      return {
        error: error.message.includes("Not authenticated")
          ? "Sessão expirada. Faça login novamente."
          : "Não foi possível excluir a conta. Tente novamente.",
      };
    }

    clearAllLocalAppData();
    clearPasswordRecoveryPending();
    setPasswordRecoveryPending(false);
    await supabase.auth.signOut();
    captureEvent("auth account deleted");
    return { error: null };
  }, []);

  const resetPassword = useCallback(
    async (email: string): Promise<AuthResult> => {
      const supabase = getSupabase();
      if (!supabase) {
        return { error: "Conta na nuvem não configurada neste ambiente." };
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          // iOS: deep link deve abrir a tela de nova senha, não o login.
          redirectTo: getAuthRedirectPath(NEW_PASSWORD_PATH),
        },
      );

      return { error: mapAuthError(error) };
    },
    [],
  );

  const updatePassword = useCallback(
    async (password: string): Promise<AuthResult> => {
      const supabase = getSupabase();
      if (!supabase) {
        return { error: "Conta na nuvem não configurada neste ambiente." };
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        return { error: mapAuthError(error) };
      }

      clearPasswordRecoveryPending();
      setPasswordRecoveryPending(false);
      captureEvent("auth password updated");
      return { error: null };
    },
    [],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      isAuthenticated: Boolean(user),
      authConfigured: isSupabaseConfigured(),
      passwordRecoveryPending,
      signIn,
      signUp,
      signOut,
      deleteAccount,
      resetPassword,
      updatePassword,
      clearPasswordRecovery,
    }),
    [
      user,
      session,
      isLoading,
      passwordRecoveryPending,
      signIn,
      signUp,
      signOut,
      deleteAccount,
      resetPassword,
      updatePassword,
      clearPasswordRecovery,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const AUTH_ROUTE_PREFIXES = [
  "/login",
  "/cadastro",
  "/recuperar-senha",
  NEW_PASSWORD_PATH,
];

export function isAuthRoute(pathname: string): boolean {
  return AUTH_ROUTE_PREFIXES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
