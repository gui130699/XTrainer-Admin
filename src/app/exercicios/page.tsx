"use client";

import { Download, ExternalLink, Pencil, Power } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Button, Card, ConfirmDialog, Empty, Loading, PageTitle } from "@/components/ui";
import { exercisesService, logAction } from "@/services/data";
import { useAdmin } from "@/components/providers";
import type { Exercise } from "@/types";
import { errorMessage, normalize } from "@/lib/utils";

const empty = { name: "", nameEn: "", aliases: "", muscleGroup: "", videoUrl: "", active: true };
const isSearchVideo = (value: string) => /youtube\.com\/results\?search_query=/i.test(value);

function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+\-@]/.test(text.trimStart())) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

export default function ExercisesPage() {
  const { user } = useAdmin();
  const [items, setItems] = useState<Exercise[]>([]);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<Exercise | null | undefined>(undefined);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");
  const [confirmSeed, setConfirmSeed] = useState(false);

  async function reload() {
    setLoading(true);
    setError("");
    try { setItems(await exercisesService.list()); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, []);
  const groups = useMemo(() => [...new Set(items.map((item) => item.muscleGroup))].sort(), [items]);
  const filtered = useMemo(() => items.filter((item) => !group || item.muscleGroup === group).filter((item) => !status || String(item.active) === status).filter((item) => normalize([item.name, item.nameEn, ...(item.aliases ?? [])].filter(Boolean).join(" ")).includes(normalize(search))).sort((a, b) => a.name.localeCompare(b.name, "pt-BR")), [items, search, group, status]);

  function open(item?: Exercise) {
    setEditing(item ?? null);
    setForm(item ? { name: item.name, nameEn: item.nameEn ?? "", aliases: (item.aliases ?? []).join(", "), muscleGroup: item.muscleGroup, videoUrl: item.videoUrl ?? "", active: item.active } : empty);
    setMessage(""); setWarning(""); setError("");
  }

  async function audit(action: string, entityId: string, summary?: string) {
    if (!user) return;
    try { await logAction(user.uid, action, "exercise", entityId, summary); }
    catch { setWarning("A ação principal foi concluída, mas o log de auditoria não pôde ser registrado."); }
  }

  async function exportExercises() {
    const headers = ["Nome", "Nome em inglês", "Aliases", "Grupo muscular", "Subgrupo", "Equipamento", "Status", "URL do vídeo"];
    const rows = filtered.map((item) => [item.name, item.nameEn, (item.aliases ?? []).join(", "), item.muscleGroup, item.muscleSubgroup, item.equipment, item.active ? "Ativo" : "Inativo", item.videoUrl]);
    const csv = `\uFEFF${[headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\r\n")}`;
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `xtrainer-exercicios-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click(); link.remove(); URL.revokeObjectURL(url);
    setMessage(`Lista exportada: ${filtered.length} exercício${filtered.length === 1 ? "" : "s"}.`);
    await audit("exercise.export", "list", `${filtered.length} exercícios`);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(""); setWarning("");
    try {
      const result = await exercisesService.save({ name: form.name.trim(), nameEn: form.nameEn.trim() || undefined, aliases: form.aliases.split(",").map((value) => value.trim()).filter(Boolean), muscleGroup: form.muscleGroup.trim(), videoUrl: form.videoUrl.trim() || undefined, active: form.active }, editing?.id);
      const entityId = editing?.id ?? (result && "id" in result ? result.id : "new");
      await audit(editing ? "exercise.update" : "exercise.create", entityId, form.name);
      setEditing(undefined); setMessage("Exercício salvo com sucesso."); await reload();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  async function seed() {
    setConfirmSeed(false);
    setSeeding(true); setError(""); setWarning("");
    try {
      const result = await exercisesService.seed();
      await audit("exercise.replace", "default-library", `${result.created} criados; ${result.updated} substituídos; ${result.deleted} removidos`);
      setMessage(`Catálogo substituído: ${result.created} criados, ${result.updated} substituídos e ${result.deleted} antigos removidos. Todos os links agora pesquisam em português.`);
      await reload();
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setSeeding(false); }
  }

  async function toggle(item: Exercise) {
    setError(""); setWarning("");
    try {
      await exercisesService.toggle(item);
      await audit("exercise.toggle", item.id, `${item.name}: ${item.active ? "inativo" : "ativo"}`);
      setMessage(`${item.name} foi ${item.active ? "desativado" : "ativado"}.`);
      await reload();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  return <AdminShell><PageTitle eyebrow="BIBLIOTECA" title="Exercícios" detail="Liste, cadastre, edite e desative exercícios da biblioteca global." action={<div className="actions"><Button className="export-button" onClick={() => void exportExercises()} disabled={loading || !filtered.length}><Download size={16}/>EXPORTAR LISTA</Button><Button className="secondary" onClick={() => setConfirmSeed(true)} disabled={seeding}>{seeding ? "SUBSTITUINDO..." : "SUBSTITUIR CATÁLOGO"}</Button><Button onClick={() => open()}>+ NOVO EXERCÍCIO</Button></div>}/>
    {message && <p className="success" role="status">{message}</p>}{warning && <p className="warning" role="alert">{warning}</p>}{error && <p className="error" role="alert">{error}</p>}
    <Card><div className="filters"><label>Pesquisar<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, inglês ou alias"/></label><label>Grupo<select value={group} onChange={(event) => setGroup(event.target.value)}><option value="">Todos</option>{groups.map((value) => <option key={value}>{value}</option>)}</select></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option><option value="true">Ativos</option><option value="false">Inativos</option></select></label></div></Card>
    {editing !== undefined && <Card><h2>{editing ? "Editar exercício" : "Cadastrar exercício"}</h2><form onSubmit={save}><div className="form-grid"><label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label>Nome em inglês<input value={form.nameEn} onChange={(event) => setForm({ ...form, nameEn: event.target.value })}/></label><label>Aliases<input value={form.aliases} onChange={(event) => setForm({ ...form, aliases: event.target.value })} placeholder="Separados por vírgula"/></label><label>Grupo muscular<input required value={form.muscleGroup} onChange={(event) => setForm({ ...form, muscleGroup: event.target.value })}/></label><label>URL do vídeo<input type="url" value={form.videoUrl} onChange={(event) => setForm({ ...form, videoUrl: event.target.value })}/>{isSearchVideo(form.videoUrl) && <small>Este link abre uma pesquisa de vídeos no YouTube.</small>}</label><label>Estado<select value={String(form.active)} onChange={(event) => setForm({ ...form, active: event.target.value === "true" })}><option value="true">Ativo</option><option value="false">Inativo</option></select></label></div><div className="actions"><Button>SALVAR</Button><button type="button" className="text-button" onClick={() => setEditing(undefined)}>Cancelar</button></div></form></Card>}
    {loading ? <Loading/> : <Card><div className="table"><div className="tr head"><span>Exercício</span><span>Grupo</span><span>Status</span><span>Ações</span></div>{filtered.map((item) => <div className="tr" key={item.id}><strong>{item.name}</strong><span>{item.muscleGroup}</span><Badge tone={item.active ? "good" : "neutral"}>{item.active ? "Ativo" : "Inativo"}</Badge><div className="actions exercise-actions">{item.videoUrl && <a className="action-button video-action" href={item.videoUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={15}/>Vídeo</a>}<button className="action-button edit-action" onClick={() => open(item)}><Pencil size={15}/>Editar</button><button className={`action-button ${item.active ? "disable-action" : "enable-action"}`} aria-label={`${item.active ? "Desativar" : "Ativar"} ${item.name}`} onClick={() => void toggle(item)}><Power size={15}/><span className="action-label">{item.active ? "Desativar" : "Ativar"}</span></button></div></div>)}</div>{!filtered.length && <Empty>Nenhum exercício encontrado.</Empty>}</Card>}<ConfirmDialog open={confirmSeed} title="Substituir completamente o catálogo?" description="Os 202 exercícios serão sobrescritos pelos dados do CSV, todos ficarão ativos e qualquer exercício fora da nova lista será removido. Treinos e históricos existentes serão preservados." confirmLabel="SUBSTITUIR 202" busy={seeding} onCancel={() => setConfirmSeed(false)} onConfirm={() => void seed()}/>
  </AdminShell>;
}
