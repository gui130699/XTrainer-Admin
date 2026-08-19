import { createRequire } from "node:module";
import { DEFAULT_TRAINING_METHODS } from "../src/data/default-training-methods";

const require = createRequire(import.meta.url);
async function main() {
const firebaseAuth = require("firebase-tools/lib/auth");
const firebaseApi = require("firebase-tools/lib/apiv2");
const projectId = process.argv.find((value) => value.startsWith("--project="))?.split("=")[1] ?? "xtrainer-45f8d";
const accounts = firebaseAuth.getAllAccounts();
if (!accounts.length) throw new Error("Nenhuma conta autenticada no Firebase CLI.");
firebaseAuth.setActiveAccount({}, accounts[0]);
const accessToken = await firebaseApi.getAccessToken();
const resourceRoot = `projects/${projectId}/databases/(default)`;
const databaseRoot = `https://firestore.googleapis.com/v1/${resourceRoot}`;

async function request(url: string, options: RequestInit = {}) {
  const response = await fetch(url, { ...options, headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json", ...options.headers } });
  if (!response.ok) throw new Error(`Firestore ${response.status}: ${await response.text()}`);
  const text = await response.text();
  return text ? JSON.parse(text) : {};
}

function value(input: unknown): object {
  if (input === null) return { nullValue: null };
  if (typeof input === "string") return { stringValue: input };
  if (typeof input === "boolean") return { booleanValue: input };
  if (typeof input === "number") return Number.isInteger(input) ? { integerValue: String(input) } : { doubleValue: input };
  if (Array.isArray(input)) return { arrayValue: { values: input.map(value) } };
  if (typeof input === "object") return { mapValue: { fields: fields(input as Record<string, unknown>) } };
  throw new Error(`Valor não serializável: ${String(input)}`);
}
function fields(input: Record<string, unknown>) { return Object.fromEntries(Object.entries(input).filter(([, item]) => item !== undefined).map(([key, item]) => [key, value(item)])); }
type FirestoreValue = { nullValue?: null; stringValue?: string; booleanValue?: boolean; integerValue?: string; doubleValue?: number; timestampValue?: string; arrayValue?: { values?: FirestoreValue[] }; mapValue?: { fields?: Record<string, FirestoreValue> } };
function decode(input: FirestoreValue): unknown {
  if ("nullValue" in input) return null;
  if ("stringValue" in input) return input.stringValue;
  if ("booleanValue" in input) return input.booleanValue;
  if ("integerValue" in input) return Number(input.integerValue);
  if ("doubleValue" in input) return Number(input.doubleValue);
  if ("timestampValue" in input) return input.timestampValue;
  if (input.arrayValue) return (input.arrayValue.values ?? []).map(decode);
  if (input.mapValue) return Object.fromEntries(Object.entries(input.mapValue.fields ?? {}).map(([key, item]) => [key, decode(item)]));
  return undefined;
}
const stable = (item: unknown): unknown => Array.isArray(item) ? item.map(stable) : item && typeof item === "object" ? Object.fromEntries(Object.entries(item).sort(([a], [b]) => a.localeCompare(b)).map(([key, value]) => [key, stable(value)])) : item;
const behavior = (item: Record<string, unknown>) => JSON.stringify(stable({ engine: item.engine, capabilities: item.capabilities, exerciseRules: item.exerciseRules, configFields: item.configFields, defaults: item.defaults }));

const currentPage = await request(`${databaseRoot}/documents/trainingMethods?pageSize=300`);
const current = new Map((currentPage.documents ?? []).map((document: { name: string; fields: Record<string, unknown> }) => [document.name.split("/").at(-1), document.fields]));
const now = new Date().toISOString();
const writes = DEFAULT_TRAINING_METHODS.map((method) => {
  const stored = current.get(method.id) as Record<string, FirestoreValue> | undefined;
  const decoded = stored ? Object.fromEntries(Object.entries(stored).map(([key, item]) => [key, decode(item)])) : null;
  const storedVersion = Number(decoded?.version ?? method.version);
  const payload = { ...method, active: typeof decoded?.active === "boolean" ? decoded.active : method.active, version: decoded ? storedVersion + (behavior(decoded) === behavior(method as unknown as Record<string, unknown>) ? 0 : 1) : method.version, createdAt: typeof decoded?.createdAt === "string" ? decoded.createdAt : now, updatedAt: now };
  const encoded = fields(payload);
  encoded.createdAt = { timestampValue: payload.createdAt };
  encoded.updatedAt = { timestampValue: now };
  return { update: { name: `${resourceRoot}/documents/trainingMethods/${method.id}`, fields: encoded } };
});
await request(`${databaseRoot}/documents:commit`, { method: "POST", body: JSON.stringify({ writes }) });
const verification = await request(`${databaseRoot}/documents/trainingMethods?pageSize=300`);
const ids = new Set((verification.documents ?? []).map((document: { name: string }) => document.name.split("/").at(-1)));
const missing = DEFAULT_TRAINING_METHODS.filter((method) => !ids.has(method.id));
if (missing.length) throw new Error(`Verificação falhou: ${missing.length} métodos ausentes.`);
console.log(`Firestore ${projectId}: ${DEFAULT_TRAINING_METHODS.length} métodos padrão sincronizados; métodos personalizados foram preservados.`);
}

void main();
