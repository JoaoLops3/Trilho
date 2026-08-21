import { IonPage, IonContent } from "@ionic/react";
import { OrbBackground } from "./OrbBackground";

interface ScreenLoadingSkeletonProps {
  /**
   * Tipo de layout da tela para renderizar skeleton apropriado
   */
  variant?: "dashboard" | "stats" | "profile" | "agenda";
}

/**
 * Skeleton genérico de tela com animação de pulso.
 * Substitui o `<RouteFallback />` básico por algo visualmente rico.
 */
export function ScreenLoadingSkeleton({
  variant = "dashboard",
}: ScreenLoadingSkeletonProps) {
  return (
    <IonPage>
      <IonContent
        scrollY={false}
        forceOverscroll={false}
        className="ion-content-custom ion-content-auth"
      >
        <OrbBackground />

        <div className="relative z-10 flex h-full flex-col overflow-hidden pb-tab-bar md:mx-auto md:max-w-xl">
          {/* Header skeleton */}
          <div className="pt-safe px-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-obsidian-700/50 animate-pulse" />
                <div>
                  <div className="h-3 w-16 rounded-md bg-obsidian-700/50 mb-1.5 animate-pulse" />
                  <div className="h-5 w-24 rounded-md bg-obsidian-700/50 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          {/* Content skeleton based on variant */}
          <div className="flex-1 px-4 space-y-3">
            {variant === "dashboard" && <DashboardSkeleton />}
            {variant === "stats" && <StatsSkeleton />}
            {variant === "profile" && <ProfileSkeleton />}
            {variant === "agenda" && <AgendaSkeleton />}
          </div>
        </div>
      </IonContent>
    </IonPage>
  );
}

function DashboardSkeleton() {
  return (
    <>
      {/* Card principal (tarefa ativa) */}
      <div className="card-glass p-4 animate-pulse">
        <div className="flex items-center gap-3.5">
          <div className="w-20 h-20 rounded-full bg-obsidian-700/50" />
          <div className="flex-1">
            <div className="h-3 w-24 rounded-md bg-obsidian-700/50 mb-2" />
            <div className="h-5 w-36 rounded-md bg-obsidian-700/50 mb-2" />
            <div className="h-4 w-28 rounded-md bg-obsidian-800/50 mb-3" />
            <div className="flex gap-2">
              <div className="h-8 w-20 rounded-xl bg-obsidian-700/50" />
              <div className="h-8 w-20 rounded-xl bg-obsidian-800/50" />
            </div>
          </div>
        </div>
      </div>

      {/* Header "Próximas" */}
      <div className="flex items-center justify-between px-1 py-2">
        <div className="h-4 w-20 rounded-md bg-obsidian-700/50 animate-pulse" />
        <div className="h-3 w-16 rounded-md bg-obsidian-800/50 animate-pulse" />
      </div>

      {/* Lista de tarefas */}
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="card-premium p-3 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-obsidian-700/50" />
              <div className="flex-1">
                <div className="h-4 w-16 rounded-lg bg-obsidian-700/50 mb-2" />
                <div className="h-4 w-32 rounded-md bg-obsidian-700/50 mb-1" />
                <div className="h-3 w-20 rounded-md bg-obsidian-800/50" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function StatsSkeleton() {
  return (
    <>
      {/* Meta diária */}
      <div className="card-premium p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="h-3 w-24 rounded-md bg-obsidian-700/50 mb-2" />
            <div className="h-8 w-32 rounded-md bg-obsidian-700/50" />
          </div>
          <div className="w-16 h-16 rounded-full bg-obsidian-700/50" />
        </div>
        <div className="h-2 rounded-full bg-obsidian-800/50" />
      </div>

      {/* Streak do trem */}
      <div className="card-premium p-5 animate-pulse">
        <div className="h-20 rounded-xl bg-obsidian-800/30 mb-3" />
        <div className="flex gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="w-6 h-6 rounded-full bg-obsidian-700/50" />
          ))}
        </div>
      </div>

      {/* Gráfico */}
      <div className="card-premium p-5 animate-pulse">
        <div className="h-3 w-28 rounded-md bg-obsidian-700/50 mb-4" />
        <div className="h-32 rounded-lg bg-obsidian-800/30" />
      </div>
    </>
  );
}

function ProfileSkeleton() {
  return (
    <>
      {/* Header do perfil */}
      <div className="card-glass p-6 animate-pulse">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-20 h-20 rounded-full bg-obsidian-700/50" />
          <div className="flex-1">
            <div className="h-6 w-32 rounded-md bg-obsidian-700/50 mb-2" />
            <div className="h-4 w-24 rounded-md bg-obsidian-800/50" />
          </div>
        </div>
      </div>

      {/* Lista de opções */}
      <div className="space-y-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="card-premium p-4 animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-obsidian-700/50" />
              <div className="flex-1">
                <div className="h-4 w-32 rounded-md bg-obsidian-700/50" />
              </div>
              <div className="w-4 h-4 rounded-sm bg-obsidian-800/50" />
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

function AgendaSkeleton() {
  return (
    <>
      {/* Seletor de data */}
      <div className="card-glass p-4 animate-pulse mb-4">
        <div className="flex items-center justify-between">
          <div className="w-6 h-6 rounded-lg bg-obsidian-700/50" />
          <div className="h-5 w-40 rounded-md bg-obsidian-700/50" />
          <div className="w-6 h-6 rounded-lg bg-obsidian-700/50" />
        </div>
      </div>

      {/* Grupos de tarefas */}
      {[0, 1].map((group) => (
        <div key={group} className="mb-4">
          <div className="h-4 w-24 rounded-md bg-obsidian-700/50 mb-2 animate-pulse" />
          <div className="space-y-2">
            {[0, 1].map((i) => (
              <div key={i} className="card-premium p-4 animate-pulse">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-obsidian-700/50" />
                  <div className="flex-1">
                    <div className="h-4 w-32 rounded-md bg-obsidian-700/50 mb-1" />
                    <div className="h-3 w-20 rounded-md bg-obsidian-800/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
