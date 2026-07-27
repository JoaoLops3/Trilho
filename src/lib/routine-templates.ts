import type { RoutineTemplateInput } from "../types/routine";

export type RoutineFocus = "estudos" | "trabalho" | "saude" | "equilibrio";
export type RoutineIntensity = "leve" | "completa";

export interface RoutinePreset {
  focus: RoutineFocus;
  intensity: RoutineIntensity;
  items: RoutineTemplateInput[];
}

export const ROUTINE_FOCUS_OPTIONS: {
  id: RoutineFocus;
  label: string;
  hint: string;
}[] = [
  {
    id: "estudos",
    label: "Estudos",
    hint: "Blocos curtos para estudar sem se esgotar",
  },
  {
    id: "trabalho",
    label: "Trabalho",
    hint: "Começar, avançar e encerrar o dia com clareza",
  },
  {
    id: "saude",
    label: "Saúde",
    hint: "Movimento, pausas e cuidado em doses pequenas",
  },
  {
    id: "equilibrio",
    label: "Equilíbrio",
    hint: "Um pouco de foco, um pouco de descanso",
  },
];

export const ROUTINE_INTENSITY_OPTIONS: {
  id: RoutineIntensity;
  label: string;
  hint: string;
}[] = [
  {
    id: "leve",
    label: "Leve",
    hint: "3 momentos no dia — um ponto de partida",
  },
  {
    id: "completa",
    label: "Completa",
    hint: "5 momentos no dia — um pouco mais de estrutura",
  },
];

const WEEKDAYS = [1, 2, 3, 4, 5];
const EVERY_DAY = [0, 1, 2, 3, 4, 5, 6];

function item(
  title: string,
  category: RoutineTemplateInput["category"],
  minutes: number,
  scheduledTime: string,
  weekdays: number[] = WEEKDAYS,
  priority: RoutineTemplateInput["priority"] = "medium",
): RoutineTemplateInput {
  return {
    title,
    category,
    duration: minutes * 60,
    priority,
    scheduledTime,
    weekdays,
  };
}

const PRESETS: Record<RoutineFocus, Record<RoutineIntensity, RoutineTemplateInput[]>> = {
  estudos: {
    leve: [
      item("Bloco de estudo", "Focus", 20, "09:00", WEEKDAYS, "high"),
      item("Pausa sem tela", "Saúde", 15, "09:30"),
      item("Revisar o que ficou", "Focus", 15, "14:00"),
    ],
    completa: [
      item("Abrir o material", "Focus", 15, "09:00"),
      item("Bloco de estudo", "Focus", 25, "09:20", WEEKDAYS, "high"),
      item("Pausa sem tela", "Saúde", 15, "09:50"),
      item("Segundo bloco", "Focus", 20, "14:00", WEEKDAYS, "high"),
      item("Anotar o próximo passo", "Criativo", 15, "20:00"),
    ],
  },
  trabalho: {
    leve: [
      item("Definir as 3 prioridades", "Focus", 15, "09:00", WEEKDAYS, "high"),
      item("Bloco de foco", "Focus", 25, "09:30", WEEKDAYS, "high"),
      item("Encerrar o dia", "Focus", 15, "17:30"),
    ],
    completa: [
      item("Definir as 3 prioridades", "Focus", 15, "09:00", WEEKDAYS, "high"),
      item("Bloco de foco", "Focus", 25, "09:30", WEEKDAYS, "high"),
      item("Pausa sem tela", "Saúde", 15, "10:00"),
      item("Segundo bloco de foco", "Focus", 20, "14:00", WEEKDAYS, "high"),
      item("Encerrar o dia", "Focus", 15, "17:30"),
    ],
  },
  saude: {
    leve: [
      item("Movimento leve", "Saúde", 20, "08:00", EVERY_DAY, "high"),
      item("Pausa sem tela", "Saúde", 15, "14:00", EVERY_DAY),
      item("Desligar um pouco", "Entretenimento", 20, "21:00", EVERY_DAY),
    ],
    completa: [
      item("Movimento leve", "Saúde", 20, "08:00", EVERY_DAY, "high"),
      item("Beber água e respirar", "Saúde", 15, "10:00", EVERY_DAY),
      item("Pausa sem tela", "Saúde", 15, "14:00", EVERY_DAY),
      item("Caminhada curta", "Saúde", 20, "18:00", EVERY_DAY),
      item("Desligar um pouco", "Entretenimento", 20, "21:00", EVERY_DAY),
    ],
  },
  equilibrio: {
    leve: [
      item("Um bloco de foco", "Focus", 20, "09:00", WEEKDAYS, "high"),
      item("Pausa sem tela", "Saúde", 15, "12:00", EVERY_DAY),
      item("Algo que você gosta", "Entretenimento", 20, "20:00", EVERY_DAY),
    ],
    completa: [
      item("Um bloco de foco", "Focus", 20, "09:00", WEEKDAYS, "high"),
      item("Pausa sem tela", "Saúde", 15, "10:00", EVERY_DAY),
      item("Movimento leve", "Saúde", 15, "12:30", EVERY_DAY),
      item("Segundo bloco de foco", "Focus", 20, "15:00", WEEKDAYS),
      item("Algo que você gosta", "Entretenimento", 20, "20:00", EVERY_DAY),
    ],
  },
};

export function getRoutinePreset(
  focus: RoutineFocus,
  intensity: RoutineIntensity,
): RoutinePreset {
  return {
    focus,
    intensity,
    items: PRESETS[focus][intensity].map((entry) => ({ ...entry })),
  };
}
