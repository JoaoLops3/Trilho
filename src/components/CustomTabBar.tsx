import { motion } from "../lib/motion";
import { Home, Calendar, BarChart, User, Plus } from "lucide-react";
import { useHistory, useLocation } from "react-router-dom";
import { captureEvent } from "../lib/posthog";
import { useTasks } from "../lib/tasks-context";
import { resolveActiveTab, type TabId } from "../lib/tab-navigation";

interface TabItem {
  id: TabId;
  icon: React.ElementType;
  label: string;
  path: string;
}

const tabs: TabItem[] = [
  { id: "home", icon: Home, label: "Início", path: "/" },
  { id: "schedule", icon: Calendar, label: "Agenda", path: "/agenda" },
  { id: "stats", icon: BarChart, label: "Stats", path: "/stats" },
  { id: "profile", icon: User, label: "Perfil", path: "/perfil" },
];

function TabButton({
  tab,
  isActive,
  onSelect,
}: {
  tab: TabItem;
  isActive: boolean;
  onSelect: (tab: TabItem) => void;
}) {
  const Icon = tab.icon;

  return (
    <motion.button
      onClick={() => onSelect(tab)}
      whileTap={{ scale: 0.9 }}
      className="relative flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-colors touch-manipulation"
      role="tab"
      aria-selected={isActive}
      aria-label={tab.label}
      aria-controls={`${tab.id}-panel`}
      id={`${tab.id}-tab`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTabBg"
          className="absolute inset-0 rounded-2xl bg-white/5"
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          aria-hidden="true"
        />
      )}

      <div className="relative z-10">
        <Icon
          className={`w-5 h-5 transition-colors ${isActive ? "text-mint-400" : "text-obsidian-500"}`}
          strokeWidth={isActive ? 2 : 1.5}
          aria-hidden="true"
        />
      </div>

      <span
        className={`text-[10px] font-medium tracking-wide uppercase ${isActive ? "text-white" : "text-obsidian-500"}`}
      >
        {tab.label}
      </span>

      {isActive && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.1 }}
          className="absolute -top-1 flex flex-col gap-[2px]"
          aria-hidden="true"
        >
          <span className="block h-[1.5px] w-3 rounded-full bg-mint-400" />
          <span className="block h-[1.5px] w-3 rounded-full bg-mint-400/70" />
        </motion.div>
      )}
    </motion.button>
  );
}

export function CustomTabBar() {
  const history = useHistory();
  const location = useLocation();
  const { openNewTask } = useTasks();

  const activeTab = resolveActiveTab(
    location.pathname,
    location.state as { activeTab?: TabId } | undefined,
  );

  const handleSelect = (tab: TabItem) => {
    captureEvent("tab changed", {
      tab: tab.id,
      tab_label: tab.label,
    });
    if (location.pathname !== tab.path) {
      history.push(tab.path);
    }
  };

  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2);

  return (
    <motion.nav
      initial={{ opacity: 0, y: 100 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.2 }}
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{ paddingBottom: "max(env(safe-area-inset-bottom), 0.5rem)" }}
      role="navigation"
      aria-label="Navegação principal"
    >
      <div className="mx-4 md:mx-auto md:max-w-xl">
        <div
          className="rounded-3xl shadow-lg px-2 py-2 tab-bar-surface"
          role="tablist"
          aria-label="Menu principal do aplicativo"
        >
          <div className="flex items-center justify-around">
            {leftTabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onSelect={handleSelect}
              />
            ))}

            <motion.button
              onClick={() => {
                captureEvent("add task tapped");
                openNewTask();
              }}
              whileTap={{ scale: 0.9 }}
              aria-label="Adicionar nova tarefa"
              className="relative flex items-center justify-center p-2 rounded-2xl transition-colors touch-manipulation"
            >
              <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-gradient-to-br from-mint-400 to-emerald-500 shadow-glow-mint-fab">
                <Plus
                  className="w-6 h-6 text-obsidian-950"
                  strokeWidth={2.5}
                  aria-hidden="true"
                />
              </div>
            </motion.button>

            {rightTabs.map((tab) => (
              <TabButton
                key={tab.id}
                tab={tab}
                isActive={activeTab === tab.id}
                onSelect={handleSelect}
              />
            ))}
          </div>
        </div>
      </div>
    </motion.nav>
  );
}

export type { TabId } from "../lib/tab-navigation";
