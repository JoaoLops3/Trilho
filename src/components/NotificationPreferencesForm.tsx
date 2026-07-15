import { useEffect, useState } from "react";
import { App as CapApp } from "@capacitor/app";
import { Bell, Check, Inbox } from "lucide-react";
import { motion } from "../lib/motion";
import { useNotifications } from "../lib/notifications-context";
import {
  checkNotificationPermission,
  openSystemNotificationSettings,
  requestNotificationPermission,
  type NotificationPermissionState,
} from "../lib/native-notifications";
import {
  INBOX_NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_HINTS,
  NOTIFICATION_TYPE_LABELS,
  PUSH_NOTIFICATION_TYPES,
  type LeadMinutes,
  type NotificationPreferences,
} from "../lib/notification-preferences";
import type { NotificationType } from "../types/notification";
import { captureEvent } from "../lib/posthog";
import { ToggleSwitch } from "./ToggleSwitch";

const LEAD_OPTIONS: LeadMinutes[] = [5, 10, 15];

const PERMISSION_LABELS: Record<NotificationPermissionState, string> = {
  granted: "Ativadas no sistema",
  denied: "Bloqueadas no sistema",
  prompt: "Permissão não solicitada",
  unsupported: "Indisponível neste dispositivo",
};

function PreferenceToggle({
  label,
  hint,
  checked,
  onChange,
  disabled = false,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-4 py-2 touch-manipulation ${
        disabled ? "opacity-40" : ""
      }`}
    >
      <span className="min-w-0">
        <span className="block text-sm text-obsidian-100">{label}</span>
        {hint ? (
          <span className="mt-0.5 block text-xs text-obsidian-500">{hint}</span>
        ) : null}
      </span>
      <ToggleSwitch
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        aria-label={label}
      />
    </div>
  );
}

function SelectChip({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-medium transition-colors touch-manipulation ${
        selected
          ? "bg-mint-500/20 text-mint-400 border border-mint-500/60"
          : "bg-white/[0.04] text-obsidian-300 border border-white/10 hover:bg-white/[0.08]"
      }`}
    >
      {selected ? <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} /> : null}
      {children}
    </button>
  );
}

export function NotificationPreferencesForm() {
  const { preferences, updatePreferences } = useNotifications();
  const [permission, setPermission] =
    useState<NotificationPermissionState>("unsupported");

  const refreshPermission = () => {
    void checkNotificationPermission().then(setPermission);
  };

  useEffect(() => {
    refreshPermission();

    let removeResume: (() => void) | undefined;
    void CapApp.addListener("resume", refreshPermission).then((handle) => {
      removeResume = () => void handle.remove();
    });

    return () => {
      removeResume?.();
    };
  }, []);

  const pushTogglesDisabled = permission !== "granted";

  const commitPreferences = (next: NotificationPreferences) => {
    updatePreferences(next);
    captureEvent("notification preferences updated", {
      lead_minutes: next.leadMinutes,
      hide_task_content: next.hideTaskContent,
      enabled_count: Object.values(next.enabled).filter(Boolean).length,
    });
  };

  const handleLeadChange = (leadMinutes: LeadMinutes) => {
    if (preferences.leadMinutes === leadMinutes) return;
    commitPreferences({ ...preferences, leadMinutes });
  };

  const handleHideTaskContentChange = (hideTaskContent: boolean) => {
    if (preferences.hideTaskContent === hideTaskContent) return;
    commitPreferences({ ...preferences, hideTaskContent });
  };

  const handleTypeToggle = (type: NotificationType, enabled: boolean) => {
    if (preferences.enabled[type] === enabled) return;
    commitPreferences({
      ...preferences,
      enabled: { ...preferences.enabled, [type]: enabled },
    });
  };

  const handleRequestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
  };

  const handleOpenSettings = () => {
    void openSystemNotificationSettings();
  };

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="card-glass p-5 space-y-4"
      >
        <div>
          <p className="m-0 text-xs font-medium uppercase tracking-wide text-obsidian-500">
            Permissão do sistema
          </p>
          <p className="m-0 mt-2 text-sm text-obsidian-200">
            {PERMISSION_LABELS[permission]}
          </p>
          <p className="m-0 mt-2 text-xs text-obsidian-500 leading-relaxed">
            O Trilho usa notificações locais para lembrar tarefas no horário,
            avisar quando o timer de foco termina e alertar se a sequência do
            dia estiver em risco — tudo no aparelho, sem servidor de push.
          </p>
        </div>
        {permission === "prompt" && (
          <button
            type="button"
            onClick={() => void handleRequestPermission()}
            className="w-full rounded-2xl border border-mint-500/30 bg-mint-500/10 py-3 text-sm font-medium text-mint-400 transition-colors hover:bg-mint-500/20 touch-manipulation"
          >
            Ativar notificações
          </button>
        )}
        {permission === "denied" && (
          <button
            type="button"
            onClick={handleOpenSettings}
            className="w-full rounded-2xl border border-mint-500/30 bg-mint-500/10 py-3 text-sm font-medium text-mint-400 transition-colors hover:bg-mint-500/20 touch-manipulation"
          >
            Abrir Configurações
          </button>
        )}
      </motion.section>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="space-y-2"
      >
        <div className="px-1">
          <p className="m-0 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-obsidian-500">
            <Bell className="h-4 w-4 shrink-0" strokeWidth={2} />
            Alertas no celular
          </p>
          <p className="m-0 mt-1 text-xs text-obsidian-500">
            Funcionam com o app fechado ou em segundo plano.
          </p>
        </div>
        <div className="card-glass p-5 space-y-3">
          <p className="m-0 text-xs font-medium uppercase tracking-wide text-obsidian-500">
            Antecedência do lembrete
          </p>
          <div className="flex gap-2">
            {LEAD_OPTIONS.map((minutes) => (
              <SelectChip
                key={minutes}
                selected={preferences.leadMinutes === minutes}
                onClick={() => handleLeadChange(minutes)}
              >
                {minutes} min
              </SelectChip>
            ))}
          </div>
          <PreferenceToggle
            label="Ocultar conteúdo da tarefa nas notificações"
            hint="Oculta o nome da tarefa na lock screen e nos alertas do celular."
            checked={preferences.hideTaskContent}
            onChange={handleHideTaskContentChange}
            disabled={pushTogglesDisabled}
          />
          <div className="border-t border-white/10 pt-3 space-y-1">
            {PUSH_NOTIFICATION_TYPES.map((type) => (
              <PreferenceToggle
                key={type}
                label={NOTIFICATION_TYPE_LABELS[type]}
                hint={NOTIFICATION_TYPE_HINTS[type]}
                checked={preferences.enabled[type]}
                onChange={(enabled) => handleTypeToggle(type, enabled)}
                disabled={pushTogglesDisabled}
              />
            ))}
          </div>
        </div>
      </motion.div>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-2"
      >
        <div className="px-1">
          <p className="m-0 flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-obsidian-500">
            <Inbox className="h-4 w-4 shrink-0" strokeWidth={2} />
            Central in-app
          </p>
          <p className="m-0 mt-1 text-xs text-obsidian-500">
            Aparecem na aba Notificações com o app aberto.
          </p>
        </div>
        <div className="card-glass p-5 space-y-1">
          {INBOX_NOTIFICATION_TYPES.map((type) => (
            <PreferenceToggle
              key={type}
              label={NOTIFICATION_TYPE_LABELS[type]}
              hint={NOTIFICATION_TYPE_HINTS[type]}
              checked={preferences.enabled[type]}
              onChange={(enabled) => handleTypeToggle(type, enabled)}
            />
          ))}
        </div>
      </motion.section>
    </div>
  );
}
