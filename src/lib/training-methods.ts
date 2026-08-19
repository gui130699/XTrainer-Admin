import { DEFAULT_TRAINING_METHODS } from "@/data/default-training-methods";
import type { TrainingMethod, TrainingMethodCategory, TrainingMethodConfigField, TrainingMethodEngine, TrainingMethodSnapshot } from "@/types";

export const TRAINING_METHOD_CATEGORY_LABELS: Record<TrainingMethodCategory, string> = { traditional: "Tradicional", warmup: "Aquecimento", group: "Combinados", intensity: "Intensidade", progression: "Progressão", tempo: "Cadência", failure: "Falha", time: "Tempo", advanced: "Avançado" };
export const TRAINING_METHOD_ENGINE_LABELS: Record<TrainingMethodEngine, string> = { normal: "Séries normais", group: "Grupo", drop: "Drop-set", "rest-pause": "Rest-pause", cluster: "Cluster", progression: "Progressão", "top-backoff": "Top/back-off", tempo: "Tempo", failure: "Falha", amrap: "AMRAP", isometric: "Isometria", partials: "Parciais", "myo-reps": "Myo-reps", time: "Por tempo" };
export const TRAINING_METHOD_FIELD_TYPE_LABELS: Record<TrainingMethodConfigField["type"], string> = { number: "Número", integer: "Inteiro", percentage: "Percentual", seconds: "Segundos", reps: "Repetições", boolean: "Sim/não", select: "Seleção", text: "Texto", tempo: "Tempo", load: "Carga" };
export const TRAINING_METHOD_ENGINES = Object.keys(TRAINING_METHOD_ENGINE_LABELS) as TrainingMethodEngine[];
export const TRAINING_METHOD_CATEGORIES = Object.keys(TRAINING_METHOD_CATEGORY_LABELS) as TrainingMethodCategory[];
export const TRAINING_METHOD_FIELD_TYPES = Object.keys(TRAINING_METHOD_FIELD_TYPE_LABELS) as TrainingMethodConfigField["type"][];
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function normalTrainingMethod() { return clone(DEFAULT_TRAINING_METHODS[0]); }
export function snapshotMethod(method?: TrainingMethod | TrainingMethodSnapshot): TrainingMethodSnapshot {
  const value = method ?? normalTrainingMethod();
  const snapshot = clone(value) as TrainingMethod;
  delete snapshot.createdAt;
  delete snapshot.updatedAt;
  return clone(snapshot);
}
export function validateTrainingMethod(method: TrainingMethod) {
  const errors: string[] = [];
  if (!method.id.trim() || !/^[a-z0-9-]+$/.test(method.id)) errors.push("O ID deve usar apenas letras minúsculas, números e hífen.");
  if (!method.name.trim()) errors.push("Informe o nome.");
  if (!method.shortDescription.trim()) errors.push("Informe a descrição curta.");
  if (!TRAINING_METHOD_ENGINES.includes(method.engine)) errors.push("Motor inválido.");
  if (method.exerciseRules.minExercises < 1 || method.exerciseRules.maxExercises < method.exerciseRules.minExercises) errors.push("Limites de exercícios inválidos.");
  const keys = new Set<string>();
  for (const item of method.configFields) {
    if (!/^[a-z][a-zA-Z0-9]*$/.test(item.key)) errors.push(`Chave inválida: ${item.key || "vazia"}.`);
    if (keys.has(item.key)) errors.push(`Chave duplicada: ${item.key}.`);
    keys.add(item.key);
    if (!TRAINING_METHOD_FIELD_TYPES.includes(item.type)) errors.push(`Tipo de campo inválido em ${item.key}.`);
    if (item.type === "select" && !item.options?.length) errors.push(`O campo ${item.label} precisa de opções.`);
  }
  return errors;
}
