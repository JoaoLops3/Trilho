import { motion } from "../lib/motion";
import { Check } from "lucide-react";
import {
  DAILY_GOAL_PRESETS,
  formatDailyGoalLabel,
} from "../lib/daily-goal";
import { useProfile } from "../lib/profile-context";
import { useSync } from "../lib/sync-context";
import { useAuth } from "../lib/auth-context";
import { captureEvent } from "../lib/posthog";

export function DailyGoalSettings() {
  const { profile, setProfile } = useProfile();
  const { pushProfileNow } = useSync();
  const { isAuthenticated } = useAuth();

  const handleSelect = (minutes: number) => {
    if (profile.dailyGoalMinutes === minutes) return;
    const next = { ...profile, dailyGoalMinutes: minutes };
    setProfile(next);
    if (isAuthenticated) {
      void pushProfileNow(next);
    }
    captureEvent("daily goal updated", {
      daily_goal_minutes: minutes,
      daily_goal_hours: minutes / 60,
    });
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.06 }}
      className="space-y-2"
    >
      <div className="px-1">
        <p className="m-0 text-xs font-medium uppercase tracking-wide text-obsidian-500">
          Meta de foco diária
        </p>
        <p className="m-0 mt-1 text-xs text-obsidian-500">
          Sua meta, seu ritmo. Sem julgamento.
        </p>
      </div>
      <div className="card-glass p-5 space-y-3">
        <div className="flex flex-wrap gap-2">
          {DAILY_GOAL_PRESETS.map((minutes) => {
            const selected = profile.dailyGoalMinutes === minutes;
            return (
              <button
                key={minutes}
                type="button"
                onClick={() => handleSelect(minutes)}
                className={`min-w-[3.25rem] flex flex-1 items-center justify-center gap-1.5 rounded-2xl py-2.5 text-sm font-medium transition-colors touch-manipulation ${
                  selected
                    ? "bg-mint-500/20 text-mint-400 border border-mint-500/60"
                    : "bg-white/[0.04] text-obsidian-300 border border-white/10 hover:bg-white/[0.08]"
                }`}
              >
                {selected ? (
                  <Check className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
                ) : null}
                {formatDailyGoalLabel(minutes)}
              </button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
}
