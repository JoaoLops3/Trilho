import { motion } from "../lib/motion";
import { Bell } from "lucide-react";
import { useHistory } from "react-router-dom";
import { useNotifications } from "../lib/notifications-context";
import { tabNavigationState } from "../lib/tab-navigation";
import { Avatar } from "./Avatar";
import type { AvatarStyle } from "../types/avatar";

interface HeaderProps {
  greeting: string;
  userName: string;
  avatarSeed?: string | null;
  avatarStyle?: AvatarStyle;
}

export function HeaderBar({
  greeting,
  userName,
  avatarSeed,
  avatarStyle = "toon-head",
}: HeaderProps) {
  const history = useHistory();
  const { unreadCount } = useNotifications();

  return (
    <motion.header
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="flex items-center justify-between px-4 pt-safe pb-2"
    >
      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          onClick={() => history.push("/perfil")}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="relative touch-manipulation"
          aria-label="Abrir perfil"
        >
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-mint-400 to-electric-500 p-0.5 shadow-glow-mint-sm">
            {avatarSeed ? (
              <Avatar
                seed={avatarSeed}
                style={avatarStyle}
                className="w-full h-full rounded-[14px]"
                alt={`Avatar de ${userName}`}
              />
            ) : (
              <div className="w-full h-full rounded-[14px] bg-surface-primary flex items-center justify-center">
                <span className="font-display font-bold text-lg text-white">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-mint-400 border-[2px] border-surface-primary" />
        </motion.button>

        <div className="flex flex-col justify-center gap-0.5 pt-0.5">
          <p className="m-0 text-xs text-obsidian-500 font-medium tracking-wide uppercase leading-none">
            {greeting}
          </p>
          <h1 className="m-0 font-display font-semibold text-lg text-white tracking-tight leading-tight">
            {userName}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          type="button"
          onClick={() =>
            history.push("/notificacoes", tabNavigationState("home"))
          }
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative p-3 rounded-2xl bg-surface-secondary transition-colors hover:bg-surface-tertiary"
          aria-label="Abrir notificações"
        >
          <Bell className="w-5 h-5 text-obsidian-300" strokeWidth={1.5} />
          {unreadCount > 0 && (
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-coral-400" />
          )}
        </motion.button>
      </div>
    </motion.header>
  );
}
