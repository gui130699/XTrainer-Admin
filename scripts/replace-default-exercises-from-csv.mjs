import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const expectedHeaders = ["Nome", "Nome em inglês", "Aliases", "Grupo muscular", "Subgrupo", "Equipamento", "Status", "URL do vídeo"];

function parseSemicolonCsv(source) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  const text = source.replace(/^\uFEFF/, "");

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') quoted = false;
      else cell += character;
    } else if (character === '"') quoted = true;
    else if (character === ";") {
      row.push(cell);
      cell = "";
    } else if (character === "\r" || character === "\n") {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(cell);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }

  if (quoted) throw new Error("CSV inválido: aspas não foram fechadas.");
  if (cell.length || row.length) {
    row.push(cell);
    if (row.some((value) => value.length > 0)) rows.push(row);
  }
  return rows;
}

const normalize = (value) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/\s+/g, " ");
const slugify = (value) => normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
const csvPath = resolve(process.argv[2] ?? "");

if (!process.argv[2] || !existsSync(csvPath)) throw new Error("Informe o caminho de um CSV existente.");

const parsed = parseSemicolonCsv(readFileSync(csvPath, "utf8"));
const headers = parsed.shift();
if (!headers || headers.length !== expectedHeaders.length || headers.some((value, index) => value !== expectedHeaders[index])) {
  throw new Error(`Cabeçalho inválido. Esperado: ${expectedHeaders.join(";")}`);
}
if (parsed.length !== 202) throw new Error(`O CSV deve possuir exatamente 202 exercícios; encontrados: ${parsed.length}.`);

const ids = new Set();
const names = new Set();
const exercises = parsed.map((values, index) => {
  if (values.length !== expectedHeaders.length) throw new Error(`Linha ${index + 2} possui ${values.length} colunas.`);
  const record = Object.fromEntries(headers.map((header, column) => [header, values[column].trim()]));
  const id = slugify(record.Nome);
  const normalizedName = normalize(record.Nome);
  const video = new URL(record["URL do vídeo"]);
  const query = normalize(video.searchParams.get("search_query") ?? "");
  if (!id || !record.Nome || !record["Nome em inglês"] || !record["Grupo muscular"]) throw new Error(`Linha ${index + 2} possui campo obrigatório vazio.`);
  if (ids.has(id) || names.has(normalizedName)) throw new Error(`Exercício duplicado: ${record.Nome}.`);
  if (video.hostname !== "www.youtube.com" || video.pathname !== "/results" || !query.includes("execucao correta musculacao em portugues")) {
    throw new Error(`Link de pesquisa em português inválido: ${record.Nome}.`);
  }
  if (!/^(Ativo|Inativo)$/i.test(record.Status)) throw new Error(`Status inválido: ${record.Nome}.`);
  ids.add(id);
  names.add(normalizedName);
  return {
    sortOrder: index + 1,
    name: record.Nome,
    nameEn: record["Nome em inglês"],
    ...(record.Aliases ? { aliases: record.Aliases.split(",").map((value) => value.trim()).filter(Boolean) } : {}),
    muscleGroup: record["Grupo muscular"],
    ...(record.Subgrupo ? { muscleSubgroup: record.Subgrupo } : {}),
    ...(record.Equipamento ? { equipment: record.Equipamento } : {}),
    videoUrl: video.toString(),
    active: /^Ativo$/i.test(record.Status),
  };
});

const generated = `import type { DefaultExercise } from "@/types";\nimport { slugifyExerciseName } from "@/lib/utils";\n\nconst rawExercises = ${JSON.stringify(exercises)} satisfies Omit<DefaultExercise, "id">[];\n\nexport const DEFAULT_EXERCISES: DefaultExercise[] = rawExercises.map((exercise) => ({\n  ...exercise,\n  id: slugifyExerciseName(exercise.name),\n}));\n`;
const adminRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const userRoot = resolve(adminRoot, "..", "XTrainer");
const targets = [resolve(adminRoot, "src/data/default-exercises.ts"), resolve(userRoot, "src/data/default-exercises.ts")];
for (const target of targets) {
  if (!existsSync(target)) throw new Error(`Destino não encontrado: ${target}`);
}
for (const target of targets) writeFileSync(target, generated, "utf8");

console.log(`Catálogo substituído por ${exercises.length} exercícios com links de pesquisa em português nos dois projetos.`);
