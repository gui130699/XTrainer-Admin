import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const firebaseAuth = require("firebase-tools/lib/auth");
const firebaseApi = require("firebase-tools/lib/apiv2");
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const projectId = process.argv.find((value) => value.startsWith("--project="))?.split("=")[1] ?? "xtrainer-45f8d";
const confirmed = process.argv.includes("--yes");

if (!confirmed) throw new Error("Operação destrutiva não confirmada. Execute novamente com --yes.");

const source = readFileSync(resolve(root, "src/data/default-exercises.ts"), "utf8");
const startMarker = "const rawExercises = ";
const endMarker = " satisfies Omit<DefaultExercise";
const start = source.indexOf(startMarker);
const end = source.indexOf(endMarker, start);
if (start < 0 || end < 0) throw new Error("Não foi possível ler o catálogo canônico.");
const rawExercises = JSON.parse(source.slice(start + startMarker.length, end));

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const exercises = rawExercises.map((item) => ({ ...item, id: slugify(item.name) }));
if (exercises.length !== 202 || new Set(exercises.map((item) => item.id)).size !== 202) throw new Error("Catálogo canônico inválido.");

const accounts = firebaseAuth.getAllAccounts();
if (!accounts.length) throw new Error("Nenhuma conta autenticada no Firebase CLI. Execute firebase login.");
firebaseAuth.setActiveAccount({}, accounts[0]);
const accessToken = await firebaseApi.getAccessToken();
const resourceRoot = `projects/${projectId}/databases/(default)`;
const databaseRoot = `https://firestore.googleapis.com/v1/${resourceRoot}`;

async function request(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...options.headers },
  });
  if (!response.ok) throw new Error(`Firestore ${response.status}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

async function listExercises() {
  const documents = [];
  let pageToken = "";
  do {
    const suffix = pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : "";
    const page = await request(`${databaseRoot}/documents/exercises?pageSize=300${suffix}`);
    documents.push(...(page.documents ?? []));
    pageToken = page.nextPageToken ?? "";
  } while (pageToken);
  return documents;
}

const current = await listExercises();
const backupDirectory = resolve(root, "backups");
mkdirSync(backupDirectory, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupPath = resolve(backupDirectory, `exercises-before-replace-${stamp}.json`);
writeFileSync(backupPath, JSON.stringify({ projectId, exportedAt: new Date().toISOString(), documents: current }, null, 2), "utf8");

const currentById = new Map(current.map((document) => [document.name.split("/").at(-1), document]));
const canonicalIds = new Set(exercises.map((item) => item.id));
const now = new Date().toISOString();
const stringValue = (value) => ({ stringValue: value });
const fieldsFor = (exercise) => ({
  name: stringValue(exercise.name),
  nameEn: stringValue(exercise.nameEn),
  ...(exercise.aliases?.length ? { aliases: { arrayValue: { values: exercise.aliases.map(stringValue) } } } : {}),
  muscleGroup: stringValue(exercise.muscleGroup),
  ...(exercise.muscleSubgroup ? { muscleSubgroup: stringValue(exercise.muscleSubgroup) } : {}),
  ...(exercise.equipment ? { equipment: stringValue(exercise.equipment) } : {}),
  videoUrl: stringValue(exercise.videoUrl),
  sortOrder: { integerValue: String(exercise.sortOrder) },
  active: { booleanValue: exercise.active },
  createdAt: currentById.get(exercise.id)?.fields?.createdAt ?? { timestampValue: now },
  updatedAt: { timestampValue: now },
});

const writes = exercises.map((exercise) => ({
  update: {
    name: `${resourceRoot}/documents/exercises/${exercise.id}`,
    fields: fieldsFor(exercise),
  },
}));
for (const document of current) {
  const id = document.name.split("/").at(-1);
  if (!canonicalIds.has(id)) writes.push({ delete: document.name });
}

for (let index = 0; index < writes.length; index += 400) {
  await request(`${databaseRoot}/documents:commit`, { method: "POST", body: JSON.stringify({ writes: writes.slice(index, index + 400) }) });
}

const replaced = await listExercises();
const replacedById = new Map(replaced.map((document) => [document.name.split("/").at(-1), document]));
const mismatched = exercises.filter((item) => {
  const fields = replacedById.get(item.id)?.fields;
  const aliases = fields?.aliases?.arrayValue?.values?.map((value) => value.stringValue) ?? [];
  return !fields
    || fields.name?.stringValue !== item.name
    || fields.nameEn?.stringValue !== item.nameEn
    || fields.muscleGroup?.stringValue !== item.muscleGroup
    || fields.videoUrl?.stringValue !== item.videoUrl
    || fields.active?.booleanValue !== item.active
    || Number(fields.sortOrder?.integerValue) !== item.sortOrder
    || JSON.stringify(aliases) !== JSON.stringify(item.aliases ?? []);
});
if (replaced.length !== 202 || mismatched.length) throw new Error(`Verificação final falhou: ${replaced.length} documentos e ${mismatched.length} divergências.`);

console.log(`Firestore ${projectId}: ${current.length} documentos anteriores substituídos pelos 202 exercícios canônicos.`);
console.log(`Backup recuperável: ${backupPath}`);
