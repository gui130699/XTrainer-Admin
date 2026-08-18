import { readFileSync } from "node:fs";
import { after, before, test } from "node:test";
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";
import { collection, doc, getDoc, getDocs, setDoc, updateDoc } from "firebase/firestore";

let environment;
let admin;
let userA;
let userB;

before(async () => {
  environment = await initializeTestEnvironment({ projectId: "xtrainer-45f8d", firestore: { rules: readFileSync("firestore.rules", "utf8") } });
  await environment.withSecurityRulesDisabled(async context => {
    const database = context.firestore();
    await setDoc(doc(database, "system", "config"), { initialized: true, adminUid: "admin" });
    await setDoc(doc(database, "users", "admin"), { uid: "admin", name: "Admin", email: "admin@test.dev", role: "admin" });
    await setDoc(doc(database, "users", "user-a"), { uid: "user-a", name: "A", email: "a@test.dev", role: "user" });
    await setDoc(doc(database, "users", "user-b"), { uid: "user-b", name: "B", email: "b@test.dev", role: "user" });
    await setDoc(doc(database, "exercises", "supino"), { name: "Supino", muscleGroup: "Peito", active: true });
    for (const path of ["workouts/work-a", "workoutSessions/session-a", "bodyWeights/weight-a", "physicalAssessments/assessment-a"]) await setDoc(doc(database, path), { ownerId: "user-a", status: "active", name: path, date: "2026-08-17" });
  });
  admin = environment.authenticatedContext("admin").firestore();
  userA = environment.authenticatedContext("user-a").firestore();
  userB = environment.authenticatedContext("user-b").firestore();
});

after(async () => environment?.cleanup());

test("usuário lê o próprio perfil, mas não o perfil de outro", async () => {
  await assertSucceeds(getDoc(doc(userA, "users", "user-a")));
  await assertFails(getDoc(doc(userA, "users", "user-b")));
});

test("usuário lê exercícios, mas não altera a biblioteca", async () => {
  await assertSucceeds(getDoc(doc(userA, "exercises", "supino")));
  await assertFails(updateDoc(doc(userA, "exercises", "supino"), { active: false }));
});

test("usuário cria workout somente para si e não troca ownerId", async () => {
  await assertSucceeds(setDoc(doc(userA, "workouts", "new-a"), { ownerId: "user-a", name: "Treino A" }));
  await assertFails(setDoc(doc(userA, "workouts", "new-b"), { ownerId: "user-b", name: "Treino B" }));
  await assertFails(updateDoc(doc(userA, "workouts", "work-a"), { ownerId: "user-b" }));
});

test("isolamento vale para sessão, peso e avaliação", async () => {
  for (const path of ["workoutSessions/session-a", "bodyWeights/weight-a", "physicalAssessments/assessment-a"]) {
    await assertSucceeds(getDoc(doc(userA, path)));
    await assertFails(getDoc(doc(userB, path)));
  }
});

test("administrador vê usuários e exercícios, mas não dados pessoais", async () => {
  await assertSucceeds(getDocs(collection(admin, "users")));
  await assertSucceeds(updateDoc(doc(admin, "exercises", "supino"), { active: false }));
  for (const name of ["workouts", "workoutSessions", "bodyWeights", "physicalAssessments"]) await assertFails(getDocs(collection(admin, name)));
  await assertFails(setDoc(doc(admin, "workouts", "admin-for-b"), { ownerId: "user-b", name: "Criado pelo admin" }));
  await assertFails(updateDoc(doc(admin, "workoutSessions", "session-a"), { status: "cancelled" }));
  await assertSucceeds(setDoc(doc(admin, "auditLogs", "log-1"), { adminUid: "admin", action: "test" }));
});
