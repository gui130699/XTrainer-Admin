import { collection, doc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { DEFAULT_TRAINING_METHODS } from "@/data/default-training-methods";
import { db } from "@/lib/firebase";
import { snapshotMethod, validateTrainingMethod } from "@/lib/training-methods";
import type { SeedResult, TrainingMethod } from "@/types";

const clean = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const stable = (value: unknown): unknown => Array.isArray(value) ? value.map(stable) : value && typeof value === "object" ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, item]) => [key, stable(item)])) : value;
const behavior = (item: TrainingMethod) => JSON.stringify(stable({ engine: item.engine, capabilities: item.capabilities, exerciseRules: item.exerciseRules, configFields: item.configFields, defaults: item.defaults }));
export const trainingMethodsService = {
  list: async () => (await getDocs(collection(db, "trainingMethods"))).docs.map((item) => ({ id: item.id, ...item.data() } as TrainingMethod)).sort((a, b) => a.order - b.order || a.name.localeCompare(b.name, "pt-BR")),
  save: async (method: TrainingMethod, previous?: TrainingMethod | null) => {
    const errors = validateTrainingMethod(method);
    if (errors.length) throw new Error(errors.join(" "));
    const changed = previous ? behavior(method) !== behavior(previous) : false;
    const version = previous ? previous.version + (changed ? 1 : 0) : Math.max(1, method.version || 1);
    await setDoc(doc(db, "trainingMethods", method.id), { ...clean(snapshotMethod({ ...method, version })), createdAt: previous?.createdAt ?? serverTimestamp(), updatedAt: serverTimestamp() }, { merge: false });
    return version;
  },
  toggle: (method: TrainingMethod) => updateDoc(doc(db, "trainingMethods", method.id), { active: !method.active, updatedAt: serverTimestamp() }),
  duplicate: async (method: TrainingMethod, existingIds: Set<string>) => {
    let suffix = 1;
    let id = `${method.id}-copia`;
    while (existingIds.has(id)) id = `${method.id}-copia-${++suffix}`;
    const copy: TrainingMethod = { ...clean(snapshotMethod(method)), id, name: `${method.name} (cópia)`, active: false, system: false, version: 1, order: method.order + 1 };
    await trainingMethodsService.save(copy, null);
    return copy;
  },
  seed: async (): Promise<SeedResult> => {
    const existing = await getDocs(collection(db, "trainingMethods"));
    const byId = new Map(existing.docs.map((item) => [item.id, item.data()]));
    const result: SeedResult = { total: DEFAULT_TRAINING_METHODS.length, created: 0, updated: 0, deleted: 0, skipped: 0, errors: 0 };
    const batch = writeBatch(db);
    for (const method of DEFAULT_TRAINING_METHODS) {
      const stored = byId.get(method.id);
      const storedMethod = stored ? { id: method.id, ...stored } as TrainingMethod : null;
      const version = storedMethod ? Number(storedMethod.version ?? 1) + (behavior(storedMethod) === behavior(method) ? 0 : 1) : method.version;
      const next = { ...clean(snapshotMethod(method)), active: stored?.active ?? method.active, version, createdAt: stored?.createdAt ?? serverTimestamp(), updatedAt: serverTimestamp() };
      batch.set(doc(db, "trainingMethods", method.id), next);
      if (stored) result.updated++;
      else result.created++;
    }
    await batch.commit();
    return result;
  },
};
