import { addDoc, collection, doc, getCountFromServer, getDoc, getDocs, query, serverTimestamp, updateDoc, where, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { DEFAULT_EXERCISES } from "@/data/default-exercises";
import type { Exercise, SeedResult, SubstanceReference, UserProfile } from "@/types";

const all = async <T>(path: string) => (await getDocs(collection(db, path))).docs.map((item) => ({ id: item.id, ...item.data() }) as T);
const withoutUndefined = (data: object) => Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

function validateDefaultExercises() {
  if (DEFAULT_EXERCISES.length !== 202) throw new Error("O dataset padrão deve possuir exatamente 202 exercícios.");
  const ids = new Set<string>();
  const names = new Set<string>();
  const orders = new Set<number>();
  for (const item of DEFAULT_EXERCISES) {
    const normalizedName = item.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
    const video = new URL(item.videoUrl);
    const videoSearch = (video.searchParams.get("search_query") ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if (!item.id || !item.name || !item.muscleGroup || video.hostname !== "www.youtube.com" || video.pathname !== "/results" || !videoSearch.includes("execucao correta musculacao em portugues")) throw new Error(`Exercício inválido: ${item.name || item.id}`);
    if (ids.has(item.id) || names.has(normalizedName) || orders.has(item.sortOrder)) throw new Error(`Duplicidade no dataset: ${item.name}`);
    ids.add(item.id);
    names.add(normalizedName);
    orders.add(item.sortOrder);
  }
  for (let order = 1; order <= 202; order += 1) if (!orders.has(order)) throw new Error(`Ordem padrão ausente: ${order}`);
}

export const usersService = {
  list: () => all<UserProfile>("users"),
  get: async (uid: string) => {
    const item = await getDoc(doc(db, "users", uid));
    return item.exists() ? item.data() as UserProfile : null;
  },
};

export const exercisesService = {
  list: () => all<Exercise>("exercises"),
  save: (data: Omit<Exercise, "id" | "createdAt" | "updatedAt">, id?: string) => id
    ? updateDoc(doc(db, "exercises", id), { ...withoutUndefined(data), updatedAt: serverTimestamp() })
    : addDoc(collection(db, "exercises"), { ...withoutUndefined(data), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
  toggle: (item: Exercise) => updateDoc(doc(db, "exercises", item.id), { active: !item.active, updatedAt: serverTimestamp() }),
  seed: async (): Promise<SeedResult> => {
    validateDefaultExercises();
    const existing = await getDocs(collection(db, "exercises"));
    const existingById = new Map(existing.docs.map((item) => [item.id, item.data()]));
    const canonicalIds = new Set(DEFAULT_EXERCISES.map((item) => item.id));
    const stale = existing.docs.filter((item) => !canonicalIds.has(item.id));
    const result: SeedResult = { total: DEFAULT_EXERCISES.length, created: 0, updated: 0, deleted: stale.length, skipped: 0, errors: 0 };
    for (let start = 0; start < DEFAULT_EXERCISES.length; start += 400) {
      const batch = writeBatch(db);
      for (const item of DEFAULT_EXERCISES.slice(start, start + 400)) {
        const existingData = existingById.get(item.id);
        const { id, ...canonical } = item;
        batch.set(doc(db, "exercises", id), withoutUndefined({
          ...canonical,
          createdAt: existingData?.createdAt ?? serverTimestamp(),
          updatedAt: serverTimestamp(),
        }));
        if (existingData) result.updated += 1;
        else result.created += 1;
      }
      await batch.commit();
    }
    for (let start = 0; start < stale.length; start += 400) {
      const batch = writeBatch(db);
      for (const item of stale.slice(start, start + 400)) batch.delete(item.ref);
      await batch.commit();
    }
    return result;
  },
};

export const substanceReferencesService = {
  list: () => all<SubstanceReference>("substanceReferences"),
  save: (data: Omit<SubstanceReference, "id" | "createdAt" | "updatedAt">, id?: string) => id
    ? updateDoc(doc(db, "substanceReferences", id), { ...withoutUndefined(data), updatedAt: serverTimestamp() })
    : addDoc(collection(db, "substanceReferences"), { ...withoutUndefined(data), createdAt: serverTimestamp(), updatedAt: serverTimestamp() }),
  toggle: (item: SubstanceReference) => updateDoc(doc(db, "substanceReferences", item.id), { active: !item.active, updatedAt: serverTimestamp() }),
};

export async function dashboard() {
  const count = async (path: string, activeOnly = false) => (await getCountFromServer(activeOnly ? query(collection(db, path), where("active", "==", true)) : query(collection(db, path)))).data().count;
  const [users, exercises, activeExercises, trainingMethods, activeTrainingMethods] = await Promise.all([count("users"), count("exercises"), count("exercises", true), count("trainingMethods"), count("trainingMethods", true)]);
  return { users, exercises, activeExercises, trainingMethods, activeTrainingMethods };
}

export function logAction(adminUid: string, action: string, entityType: string, entityId: string, summary?: string) {
  return addDoc(collection(db, "auditLogs"), { adminUid, action, entityType, entityId, summary: summary ?? null, timestamp: serverTimestamp() });
}
