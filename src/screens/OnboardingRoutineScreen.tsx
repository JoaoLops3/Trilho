import { useEffect, useMemo, useState } from "react";
import { motion } from "../lib/motion";
import { IonPage, IonContent } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { Check, ChevronLeft, Clock, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import { OrbBackground } from "../components/OrbBackground";
import { NewTaskSheet } from "../components/NewTaskSheet";
import { useRoutines } from "../lib/routines-context";
import { useTasks } from "../lib/tasks-context";
import { captureEvent } from "../lib/posthog";
import { formatDuration } from "../lib/task-duration";
import {
  hasSeenRoutineOnboarding,
  markRoutineOnboardingSeen,
} from "../lib/routine-onboarding";
import {
  getRoutinePreset,
  ROUTINE_FOCUS_OPTIONS,
  ROUTINE_INTENSITY_OPTIONS,
  type RoutineFocus,
  type RoutineIntensity,
} from "../lib/routine-templates";
import {
  formatRoutineDedupeMessage,
  partitionRoutineInputs,
} from "../lib/routine-dedupe";
import { tabNavigationState } from "../lib/tab-navigation";
import type { RoutineTemplate, RoutineTemplateInput } from "../types/routine";

type Step = "welcome" | "focus" | "intensity" | "preview";

const STEP_ORDER: Step[] = ["welcome", "focus", "intensity", "preview"];
const DEFAULT_WEEKDAYS = [1, 2, 3, 4, 5];

function SelectChip({
  selected,
  onClick,
  label,
  hint,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-2xl border px-4 py-3.5 text-left transition-colors touch-manipulation ${
        selected
          ? "border-mint-500/60 bg-mint-500/20"
          : "border-white/[0.12] bg-white/[0.06] hover:bg-white/[0.09]"
      }`}
    >
      <span className="flex items-center gap-2">
        {selected ? (
          <Check className="h-4 w-4 shrink-0 text-mint-400" strokeWidth={2.5} />
        ) : null}
        <span
          className={`text-sm font-medium ${
            selected ? "text-mint-400" : "text-obsidian-100"
          }`}
        >
          {label}
        </span>
      </span>
      {hint ? (
        <span className="mt-1 block text-xs text-obsidian-400">{hint}</span>
      ) : null}
    </button>
  );
}

function StepIndicator({ step }: { step: Step }) {
  const index = STEP_ORDER.indexOf(step);
  const current = index + 1;
  const total = STEP_ORDER.length;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {STEP_ORDER.map((s, i) => (
          <span
            key={s}
            className={`h-1.5 rounded-full transition-all ${
              i === index
                ? "w-5 bg-mint-400"
                : i < index
                  ? "w-1.5 bg-mint-400/50"
                  : "w-1.5 bg-white/15"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-obsidian-400 tabular-nums">
        Etapa {current} de {total}
      </span>
    </div>
  );
}

function toDraftRoutine(
  item: RoutineTemplateInput,
  index: number,
): RoutineTemplate {
  return {
    ...item,
    id: `draft-${index}`,
    active: true,
    createdAt: new Date().toISOString(),
  };
}

/** Conteúdo no topo do espaço livre (sem vão artificial); botão no rodapé. */
function StepBody({ children, footer }: { children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <div className="flex flex-1 flex-col justify-start pt-2 pb-4">{children}</div>
      <div className="shrink-0 pt-4 pb-2">{footer}</div>
    </div>
  );
}

export function OnboardingRoutineScreen() {
  const history = useHistory();
  const { routines, applyRoutineTemplates } = useRoutines();
  const { tasks } = useTasks();
  const [step, setStep] = useState<Step>("welcome");
  const [focus, setFocus] = useState<RoutineFocus | null>(null);
  const [intensity, setIntensity] = useState<RoutineIntensity | null>(null);
  const [previewItems, setPreviewItems] = useState<RoutineTemplateInput[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const isAdditive =
    hasSeenRoutineOnboarding() ||
    routines.length > 0 ||
    tasks.length > 0;

  useEffect(() => {
    captureEvent("routine onboarding viewed", {
      from_profile: isAdditive,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const preset = useMemo(() => {
    if (!focus || !intensity) return null;
    return getRoutinePreset(focus, intensity);
  }, [focus, intensity]);

  useEffect(() => {
    if (preset) {
      setPreviewItems(preset.items.map((entry) => ({ ...entry })));
    }
  }, [preset]);

  const finishToDashboard = () => {
    markRoutineOnboardingSeen();
    history.replace("/");
  };

  const handleSkip = () => {
    captureEvent("routine onboarding skipped", {
      step,
      from_profile: isAdditive,
    });
    finishToDashboard();
  };

  const handleConfirm = () => {
    if (!focus || !intensity || previewItems.length === 0) return;

    const result = partitionRoutineInputs(previewItems, routines);

    if (result.allDuplicates) {
      captureEvent("routine onboarding duplicates blocked", {
        focus,
        intensity,
        duplicate_count: result.duplicateCount,
        from_profile: isAdditive,
      });
      return;
    }

    applyRoutineTemplates(result.fresh);
    const eventName = isAdditive
      ? "routine preset applied from profile"
      : "routine onboarding completed";
    captureEvent(eventName, {
      focus,
      intensity,
      item_count: result.freshCount,
      skipped_duplicates: result.duplicateCount,
    });
    finishToDashboard();
  };

  const removePreviewItem = (index: number) => {
    setPreviewItems((prev) => prev.filter((_, i) => i !== index));
  };

  const openAddItem = () => {
    setEditingIndex(null);
    setIsSheetOpen(true);
  };

  const openEditItem = (index: number) => {
    setEditingIndex(index);
    setIsSheetOpen(true);
  };

  const closeSheet = () => {
    setIsSheetOpen(false);
    setEditingIndex(null);
  };

  const handleSheetSubmit = (input: RoutineTemplateInput) => {
    const weekdays =
      input.weekdays.length > 0
        ? input.weekdays
        : (previewItems[0]?.weekdays ?? DEFAULT_WEEKDAYS);
    const next: RoutineTemplateInput = { ...input, weekdays };

    if (editingIndex !== null) {
      setPreviewItems((prev) =>
        prev.map((item, i) => (i === editingIndex ? next : item)),
      );
    } else {
      setPreviewItems((prev) => [...prev, next]);
    }
  };

  const routineToEdit =
    editingIndex !== null && previewItems[editingIndex]
      ? toDraftRoutine(previewItems[editingIndex], editingIndex)
      : null;

  const goToIntensity = () => {
    if (!focus) return;
    setStep("intensity");
  };

  const goToPreview = () => {
    if (!focus || !intensity) return;
    setStep("preview");
  };

  const dedupe = useMemo(
    () => partitionRoutineInputs(previewItems, routines),
    [previewItems, routines],
  );
  const duplicateIndexSet = useMemo(
    () => new Set(dedupe.duplicateIndexes),
    [dedupe.duplicateIndexes],
  );
  const dedupeMessage = formatRoutineDedupeMessage(dedupe);

  const goToMyRoutines = () => {
    markRoutineOnboardingSeen();
    history.replace("/rotinas", tabNavigationState("profile"));
  };

  return (
    <IonPage>
      <IonContent scrollY={true} className="ion-content-custom">
        <OrbBackground />

        <div className="relative z-10 flex min-h-screen flex-col pb-8 md:mx-auto md:max-w-xl">
          <div className="flex items-center justify-between gap-3 px-4 pt-safe">
            <div className="flex min-w-0 items-center gap-3">
              <motion.button
                type="button"
                onClick={() => {
                  if (step === "welcome") {
                    if (isAdditive) {
                      history.goBack();
                    } else {
                      handleSkip();
                    }
                    return;
                  }
                  if (step === "focus") setStep("welcome");
                  else if (step === "intensity") setStep("focus");
                  else if (step === "preview") setStep("intensity");
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-secondary text-obsidian-200 transition-colors hover:bg-surface-tertiary touch-manipulation"
                aria-label="Voltar"
              >
                <ChevronLeft className="h-5 w-5" strokeWidth={2} />
              </motion.button>
              <StepIndicator step={step} />
            </div>
          </div>

          <div className="flex flex-1 flex-col px-4 pt-4 pb-4">
            {step === "welcome" && (
              <motion.div
                key="welcome"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-1 flex-col"
              >
                <StepBody
                  footer={
                    <button
                      type="button"
                      onClick={() => setStep("focus")}
                      className="btn-primary w-full touch-manipulation"
                    >
                      Continuar
                    </button>
                  }
                >
                  <h1 className="m-0 font-display text-3xl font-semibold tracking-tight text-white">
                    {isAdditive
                      ? "Montar nova rotina"
                      : "Vamos montar sua rotina"}
                  </h1>
                  <p className="mt-3 text-sm leading-relaxed text-obsidian-400">
                    {isAdditive
                      ? "Escolha um ponto de partida. Vamos somar à sua rotina atual — nada do que você já tem será apagado."
                      : "Um ponto de partida, não uma prescrição. Poucos blocos curtos para o dia começar com algo útil — e você ajusta depois."}
                  </p>
                </StepBody>
              </motion.div>
            )}

            {step === "focus" && (
              <motion.div
                key="focus"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-1 flex-col"
              >
                <StepBody
                  footer={
                    <button
                      type="button"
                      onClick={goToIntensity}
                      disabled={!focus}
                      className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70 touch-manipulation"
                    >
                      Continuar
                    </button>
                  }
                >
                  <h1 className="m-0 font-display text-2xl font-semibold tracking-tight text-white">
                    Qual o foco principal?
                  </h1>
                  <p className="mt-2 text-sm text-obsidian-400">
                    Escolha o que mais faz sentido agora. Dá para mudar depois.
                  </p>
                  <div className="mt-6 space-y-2.5">
                    {ROUTINE_FOCUS_OPTIONS.map((option) => (
                      <SelectChip
                        key={option.id}
                        selected={focus === option.id}
                        onClick={() => setFocus(option.id)}
                        label={option.label}
                        hint={option.hint}
                      />
                    ))}
                  </div>
                </StepBody>
              </motion.div>
            )}

            {step === "intensity" && (
              <motion.div
                key="intensity"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-1 flex-col"
              >
                <StepBody
                  footer={
                    <button
                      type="button"
                      onClick={goToPreview}
                      disabled={!intensity}
                      className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70 touch-manipulation"
                    >
                      Ver sugestão
                    </button>
                  }
                >
                  <h1 className="m-0 font-display text-2xl font-semibold tracking-tight text-white">
                    Quanto no primeiro dia?
                  </h1>
                  <p className="mt-2 text-sm text-obsidian-400">
                    Menos é mais no começo. Você pode adicionar depois.
                  </p>
                  <div className="mt-6 space-y-2.5">
                    {ROUTINE_INTENSITY_OPTIONS.map((option) => (
                      <SelectChip
                        key={option.id}
                        selected={intensity === option.id}
                        onClick={() => setIntensity(option.id)}
                        label={option.label}
                        hint={option.hint}
                      />
                    ))}
                  </div>
                </StepBody>
              </motion.div>
            )}

            {step === "preview" && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35 }}
                className="flex flex-1 flex-col"
              >
                <h1 className="m-0 font-display text-2xl font-semibold tracking-tight text-white">
                  Sua rotina sugerida
                </h1>
                <p className="mt-2 text-sm text-obsidian-400">
                  {isAdditive
                    ? "Ajuste horários, adicione ou remova itens. Vamos somar à sua rotina atual — sem duplicar o que já existe."
                    : "Ajuste horários, adicione ou remova itens antes de começar."}
                </p>

                {dedupeMessage ? (
                  <div
                    role="status"
                    className={`mt-4 rounded-2xl border px-4 py-3 text-sm leading-relaxed ${
                      dedupe.allDuplicates
                        ? "border-mint-500/30 bg-mint-500/10 text-mint-400"
                        : "border-white/10 bg-white/[0.04] text-obsidian-300"
                    }`}
                  >
                    {dedupeMessage}
                  </div>
                ) : null}

                {previewItems.length === 0 ? (
                  <div className="card-glass mt-6 p-5 text-center text-sm text-obsidian-400">
                    Nenhum item ainda. Adicione algo para montar sua rotina, ou
                    comece do zero.
                  </div>
                ) : (
                  <div className="card-glass mt-6 divide-y divide-white/5 overflow-hidden">
                    {previewItems.map((entry, index) => {
                      const alreadyExists = duplicateIndexSet.has(index);
                      return (
                        <div
                          key={`${entry.title}-${entry.scheduledTime}-${index}`}
                          className={`flex items-start gap-2 px-4 py-3.5 ${
                            alreadyExists ? "opacity-60" : ""
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="m-0 truncate text-sm font-medium text-obsidian-100">
                                {entry.title}
                              </p>
                              {alreadyExists ? (
                                <span className="shrink-0 rounded-md bg-mint-500/15 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-mint-400">
                                  Já na sua rotina
                                </span>
                              ) : null}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-obsidian-400">
                              {entry.scheduledTime ? (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" strokeWidth={2} />
                                  {entry.scheduledTime}
                                </span>
                              ) : (
                                <span className="text-obsidian-500">
                                  Sem horário
                                </span>
                              )}
                              <span>{formatDuration(entry.duration)}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => openEditItem(index)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-obsidian-400 transition-colors hover:bg-white/[0.08] hover:text-obsidian-200 touch-manipulation"
                            aria-label={`Editar ${entry.title}`}
                          >
                            <Pencil className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <button
                            type="button"
                            onClick={() => removePreviewItem(index)}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-coral-500/25 bg-coral-500/10 text-coral-400 transition-colors hover:bg-coral-500/20 touch-manipulation"
                            aria-label={`Remover ${entry.title}`}
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                <button
                  type="button"
                  onClick={openAddItem}
                  className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-white/25 bg-transparent py-3 text-sm font-medium text-obsidian-300 transition-colors hover:border-white/40 hover:bg-white/[0.04] hover:text-obsidian-200 touch-manipulation"
                >
                  <Plus className="h-4 w-4" strokeWidth={2} />
                  Adicionar item
                </button>

                <div className="mt-auto space-y-3 pt-8">
                  {dedupe.allDuplicates ? (
                    <button
                      type="button"
                      onClick={goToMyRoutines}
                      className="btn-primary w-full touch-manipulation"
                    >
                      Ir para Minhas rotinas
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleConfirm}
                      disabled={previewItems.length === 0 || dedupe.freshCount === 0}
                      className="btn-primary w-full disabled:cursor-not-allowed disabled:opacity-70 touch-manipulation"
                    >
                      {dedupe.freshCount > 0 && dedupe.duplicateCount > 0
                        ? `Adicionar ${dedupe.freshCount} ${dedupe.freshCount === 1 ? "novo" : "novos"}`
                        : isAdditive
                          ? "Adicionar à minha rotina"
                          : "Começar com isso"}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </div>

          <div className="px-4 pb-safe">
            <button
              type="button"
              onClick={handleSkip}
              className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-white/20 bg-white/[0.04] py-3 text-sm text-obsidian-400 transition-colors hover:border-white/30 hover:bg-white/[0.06] hover:text-obsidian-300 touch-manipulation"
            >
              <RotateCcw className="h-3.5 w-3.5" strokeWidth={2} />
              Começar do zero
            </button>
          </div>
        </div>

        <NewTaskSheet
          isOpen={isSheetOpen}
          onClose={closeSheet}
          onSubmit={() => {}}
          routineOnly
          routineToEdit={routineToEdit}
          onSubmitRoutine={(input) => handleSheetSubmit(input)}
        />
      </IonContent>
    </IonPage>
  );
}
