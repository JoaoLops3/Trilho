import { useState } from "react";
import { motion } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import {
  Bell,
  Settings,
  Lock,
  Shield,
  Trash2,
  LogOut,
  Flame,
  ChevronRight,
  ImageIcon,
  Repeat,
  Sparkles,
  type LucideIcon,
  Pencil,
} from "lucide-react";
import { OrbBackground } from "../components/OrbBackground";
import { Avatar } from "../components/Avatar";
import { AvatarPickerSheet } from "../components/AvatarPickerSheet";
import { EditDisplayNameSheet } from "../components/EditDisplayNameSheet";
import { ConfirmDeleteAccountSheet } from "../components/ConfirmDeleteAccountSheet";
import { useTasks } from "../lib/tasks-context";
import { useProfile } from "../lib/profile-context";
import {
  getShownName,
  isProfileHeaderNameTruncated,
  truncateForProfileHeader,
} from "../lib/profile-storage";
import { useAuth } from "../lib/auth-context";
import { useSync } from "../lib/sync-context";
import { tabNavigationState } from "../lib/tab-navigation";
import { APP_VERSION } from "../lib/app-brand";

interface SettingsRowProps {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  danger?: boolean;
}

function SettingsRow({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: SettingsRowProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 px-5 py-4 text-left hover:bg-white/[0.04] transition-colors touch-manipulation"
    >
      <Icon
        className={`w-5 h-5 ${danger ? "text-coral-500" : "text-obsidian-300"}`}
        strokeWidth={1.5}
      />
      <span
        className={`flex-1 text-sm font-medium ${danger ? "text-coral-500" : "text-obsidian-200"}`}
      >
        {label}
      </span>
      <ChevronRight className="w-4 h-4 text-obsidian-500" strokeWidth={1.5} />
    </button>
  );
}

function SectionLabel({
  children,
  danger = false,
}: {
  children: string;
  danger?: boolean;
}) {
  return (
    <p
      className={`mb-2 px-1 text-xs font-medium uppercase tracking-wide ${
        danger ? "text-coral-500" : "text-obsidian-500"
      }`}
    >
      {children}
    </p>
  );
}

export function ProfileScreen() {
  const { streak } = useTasks();
  const { profile } = useProfile();
  const { isAuthenticated, user, signOut, deleteAccount } = useAuth();
  const { isSyncing } = useSync();
  const history = useHistory();
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const [isEditNameOpen, setIsEditNameOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const openAvatarPicker = () => setIsAvatarPickerOpen(true);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      history.replace("/login");
      window.location.reload();
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setIsDeletingAccount(true);
    try {
      const { error } = await deleteAccount();
      if (error) {
        setDeleteError(error);
        return;
      }
      setIsDeleteSheetOpen(false);
      history.replace("/");
      window.location.reload();
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const shownName = getShownName(profile);
  const headerName = truncateForProfileHeader(shownName);

  return (
    <IonPage>
      <IonContent scrollY={true} className="ion-content-custom">
        <OrbBackground />

        <div className="relative z-10 min-h-screen pb-32 md:mx-auto md:max-w-xl">
          <div className="px-4 pt-safe pb-2 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="flex flex-col items-center text-center"
            >
              <motion.button
                type="button"
                onClick={openAvatarPicker}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                aria-label="Alterar avatar"
                className="mt-4 w-20 h-20 rounded-3xl bg-gradient-to-br from-mint-400 to-electric-500 p-0.5 touch-manipulation shadow-glow-mint-md"
              >
                <div className="w-full h-full rounded-[22px] bg-surface-primary flex items-center justify-center overflow-hidden">
                  {profile.avatarSeed ? (
                    <Avatar
                      seed={profile.avatarSeed}
                      style={profile.avatarStyle}
                      className="w-full h-full rounded-[22px]"
                      alt="Avatar do perfil"
                    />
                  ) : (
                    <span className="font-display font-bold text-3xl text-white">
                      {shownName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
              </motion.button>
              <h1 className="mt-4 mb-0 inline-flex max-w-[min(calc(16rem+2.5rem),calc(100vw-4rem))] items-center gap-1.5 font-display font-semibold text-2xl leading-none text-white tracking-tight">
                <span
                  className="inline-flex shrink-0 items-center justify-center p-0.5 invisible pointer-events-none"
                  aria-hidden="true"
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.75} />
                </span>
                <span
                  className="min-w-0 flex-1 truncate text-center"
                  title={
                    isProfileHeaderNameTruncated(shownName)
                      ? shownName
                      : undefined
                  }
                >
                  {headerName}
                </span>
                <button
                  type="button"
                  onClick={() => setIsEditNameOpen(true)}
                  aria-label="Editar nome"
                  className="inline-flex shrink-0 items-center justify-center p-0.5 text-obsidian-500 hover:text-obsidian-300 transition-colors touch-manipulation"
                >
                  <Pencil className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </h1>
              {isAuthenticated && user?.email ? (
                <p className="text-obsidian-400 text-sm mt-1">
                  {user.email}
                  {isSyncing ? (
                    <span className="block text-xs text-mint-400/80 mt-1">
                      Sincronizando…
                    </span>
                  ) : null}
                </p>
              ) : (
                <p className="text-obsidian-500 text-sm mt-1">
                  Um dia de cada vez,
                  <br />
                  no trilho.
                </p>
              )}
              <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10">
                <Flame className="w-3.5 h-3.5 text-coral-400" strokeWidth={2} />
                <span className="text-xs font-medium text-obsidian-200">
                  {streak} {streak === 1 ? "dia" : "dias"} de sequência
                </span>
              </div>
            </motion.div>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
            >
              <SectionLabel>Preferências</SectionLabel>
              <div className="card-glass divide-y divide-white/5 overflow-hidden">
                <SettingsRow
                  icon={ImageIcon}
                  label="Alterar avatar"
                  onClick={openAvatarPicker}
                />
                <SettingsRow
                  icon={Repeat}
                  label="Minhas rotinas"
                  onClick={() =>
                    history.push("/rotinas", tabNavigationState("profile"))
                  }
                />
                <SettingsRow
                  icon={Sparkles}
                  label="Montar nova rotina"
                  onClick={() =>
                    history.push(
                      "/rotina/montar",
                      tabNavigationState("profile"),
                    )
                  }
                />
                <SettingsRow
                  icon={Bell}
                  label="Notificações"
                  onClick={() =>
                    history.push("/notificacoes", tabNavigationState("profile"))
                  }
                />
                <SettingsRow
                  icon={Settings}
                  label="Preferências"
                  onClick={() =>
                    history.push("/preferencias", tabNavigationState("profile"))
                  }
                />
              </div>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
            >
              <SectionLabel>Conta</SectionLabel>
              <div className="card-glass divide-y divide-white/5 overflow-hidden">
                <SettingsRow
                  icon={Lock}
                  label="Trocar senha"
                  onClick={() => history.push("/recuperar-senha")}
                />
                <SettingsRow
                  icon={Shield}
                  label="Política de Privacidade"
                  onClick={() =>
                    history.push("/privacidade", tabNavigationState("profile"))
                  }
                />
                <SettingsRow
                  icon={Trash2}
                  label="Excluir conta"
                  danger
                  onClick={() => {
                    setDeleteError(null);
                    setIsDeleteSheetOpen(true);
                  }}
                />
              </div>
              <p className="mt-3 text-center text-xs text-obsidian-500">
                Versão {APP_VERSION}
              </p>
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex justify-center"
            >
              <button
                type="button"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-coral-500/40 bg-coral-500/10 px-6 py-2.5 text-sm font-medium text-coral-400 hover:bg-coral-500/20 transition-colors touch-manipulation disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" strokeWidth={1.5} />
                {isSigningOut ? "Saindo…" : "Sair"}
              </button>
            </motion.section>
          </div>
        </div>

        <AvatarPickerSheet
          isOpen={isAvatarPickerOpen}
          onClose={() => setIsAvatarPickerOpen(false)}
        />
        <EditDisplayNameSheet
          isOpen={isEditNameOpen}
          onClose={() => setIsEditNameOpen(false)}
        />
        <ConfirmDeleteAccountSheet
          isOpen={isDeleteSheetOpen}
          isDeleting={isDeletingAccount}
          error={deleteError}
          onClose={() => {
            if (!isDeletingAccount) setIsDeleteSheetOpen(false);
          }}
          onConfirm={() => void handleDeleteAccount()}
        />
      </IonContent>
    </IonPage>
  );
}
