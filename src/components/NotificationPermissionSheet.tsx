import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "../lib/motion";
import { Bell } from "lucide-react";
import { useTasks } from "../lib/tasks-context";

export function NotificationPermissionSheet() {
  const {
    notificationPermissionPromptOpen,
    dismissNotificationPermissionPrompt,
    confirmNotificationPermissionPrompt,
  } = useTasks();

  return createPortal(
    <AnimatePresence>
      {notificationPermissionPromptOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-end justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={dismissNotificationPermissionPrompt}
          />

          <motion.div
            className="relative z-10 w-full max-w-xl rounded-t-[28px] border border-white/10 bg-[#14141c] px-5 pt-6 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 420, damping: 36 }}
          >
            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-white/15" />

            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-mint-500/10 border border-mint-500/20">
                <Bell className="h-5 w-5 text-mint-400" />
              </div>
              <h2 className="m-0 font-display text-xl font-semibold text-white">
                Lembretes no horário
              </h2>
            </div>

            <p className="mt-3 text-sm text-obsidian-400 leading-relaxed">
              Quer receber lembretes quando suas tarefas chegarem no horário,
              quando o timer terminar e se a sequência do dia estiver em risco?
            </p>

            <div className="mt-6 space-y-3">
              <button
                type="button"
                onClick={() => void confirmNotificationPermissionPrompt()}
                className="w-full rounded-2xl border border-mint-500/30 bg-mint-500/10 py-3.5 text-sm font-medium text-mint-400 transition-colors hover:bg-mint-500/20 touch-manipulation"
              >
                Ativar lembretes
              </button>

              <button
                type="button"
                onClick={dismissNotificationPermissionPrompt}
                className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 text-sm font-medium text-obsidian-300 transition-colors hover:bg-white/[0.08] touch-manipulation"
              >
                Agora não
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
