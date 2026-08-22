"use client";

import { Pencil, Power, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Button, Card, Empty, Loading, PageTitle } from "@/components/ui";
import { muscleGroupsService, logAction } from "@/services/data";
import { useAdmin } from "@/components/providers";
import type { MuscleGroup } from "@/types";
import { errorMessage } from "@/lib/utils";

const empty = { name: "", active: true };

export default function MuscleGroupsPage() {
  const { user } = useAdmin();
  const [items, setItems] = useState<MuscleGroup[]>([]);
  const [editing, setEditing] = useState<MuscleGroup | null | undefined>(undefined);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try { setItems((await muscleGroupsService.list()).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.name.localeCompare(b.name, "pt-BR"))); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  function open(item?: MuscleGroup) {
    setEditing(item ?? null);
    setForm(item ? { name: item.name, active: item.active } : empty);
    setMessage(""); setWarning(""); setError("");
  }

  async function audit(action: string, entityId: string, summary?: string) {
    if (!user) return;
    try { await logAction(user.uid, action, "muscleGroup", entityId, summary); }
    catch { setWarning("A ação principal foi concluída, mas o log de auditoria não pôde ser registrado."); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(""); setWarning("");
    try {
      await muscleGroupsService.save({ name: form.name.trim(), active: form.active }, editing?.id);
      await audit(editing ? "muscleGroup.update" : "muscleGroup.create", editing?.id ?? "new", form.name);
      setEditing(undefined); setMessage("Grupo muscular salvo com sucesso."); await reload();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  async function toggle(item: MuscleGroup) {
    setError(""); setWarning("");
    try {
      await muscleGroupsService.toggle(item);
      await audit("muscleGroup.toggle", item.id, `${item.name}: ${item.active ? "inativo" : "ativo"}`);
      setMessage(`${item.name} foi ${item.active ? "desativado" : "ativado"}.`);
      await reload();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  async function importFromExercises() {
    setImporting(true); setError(""); setWarning("");
    try {
      const result = await muscleGroupsService.seedFromExercises();
      await audit("muscleGroup.import", "exercises", `${result.created} criados; ${result.skipped} já existentes`);
      setMessage(result.created ? `Catálogo atualizado: ${result.created} grupo${result.created === 1 ? "" : "s"} importado${result.created === 1 ? "" : "s"} a partir dos exercícios existentes.` : "Nenhum grupo novo encontrado nos exercícios existentes.");
      await reload();
    } catch (reason) { setError(errorMessage(reason)); }
    finally { setImporting(false); }
  }

  return <AdminShell><PageTitle eyebrow="BIBLIOTECA" title="Grupos musculares" detail="Cadastro central de grupos musculares usado ao classificar exercícios." action={<div className="actions"><Button className="secondary" onClick={() => void importFromExercises()} disabled={importing}><RotateCw size={16}/>{importing ? "IMPORTANDO..." : "IMPORTAR DOS EXERCÍCIOS"}</Button><Button onClick={() => open()}>+ NOVO GRUPO</Button></div>}/>
    {message && <p className="success" role="status">{message}</p>}{warning && <p className="warning" role="alert">{warning}</p>}{error && <p className="error" role="alert">{error}</p>}
    {editing !== undefined && <Card><h2>{editing ? "Editar grupo muscular" : "Cadastrar grupo muscular"}</h2><form onSubmit={save}><div className="form-grid"><label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label>Estado<select value={String(form.active)} onChange={(event) => setForm({ ...form, active: event.target.value === "true" })}><option value="true">Ativo</option><option value="false">Inativo</option></select></label></div><div className="actions"><Button>SALVAR</Button><button type="button" className="text-button" onClick={() => setEditing(undefined)}>Cancelar</button></div></form></Card>}
    {loading ? <Loading/> : <Card><div className="table"><div className="tr head"><span>Grupo muscular</span><span>Status</span><span>Ações</span></div>{items.map((item) => <div className="tr" key={item.id}><strong>{item.name}</strong><Badge tone={item.active ? "good" : "neutral"}>{item.active ? "Ativo" : "Inativo"}</Badge><div className="actions exercise-actions"><button className="action-button edit-action" onClick={() => open(item)}><Pencil size={15}/>Editar</button><button className={`action-button ${item.active ? "disable-action" : "enable-action"}`} aria-label={`${item.active ? "Desativar" : "Ativar"} ${item.name}`} onClick={() => void toggle(item)}><Power size={15}/><span className="action-label">{item.active ? "Desativar" : "Ativar"}</span></button></div></div>)}</div>{!items.length && <Empty>Nenhum grupo muscular cadastrado. Use &quot;Importar dos exercícios&quot; para começar a partir do catálogo atual.</Empty>}</Card>}
  </AdminShell>;
}
