"use client";

import { Pencil, Power } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Button, Card, Empty, Loading, PageTitle } from "@/components/ui";
import { substanceReferencesService, logAction } from "@/services/data";
import { useAdmin } from "@/components/providers";
import type { SubstanceReference, SubstanceReferenceRiskTag } from "@/types";
import { errorMessage, normalize } from "@/lib/utils";

const RISK_TAGS: SubstanceReferenceRiskTag[] = ["cardiovascular", "hepatic", "renal", "endocrine", "psychiatric", "dermatologic", "allergic", "metabolic", "hematologic", "unknown-long-term"];
const RISK_TAG_LABELS: Record<SubstanceReferenceRiskTag, string> = { cardiovascular: "Cardiovascular", hepatic: "Hepático", renal: "Renal", endocrine: "Endócrino", psychiatric: "Psiquiátrico", dermatologic: "Dermatológico", allergic: "Alérgico", metabolic: "Metabólico", hematologic: "Hematológico", "unknown-long-term": "Efeitos a longo prazo pouco conhecidos" };

const empty = { name: "", canonicalName: "", aliases: "", class: "", description: "", mechanismSummary: "", medicalUseSummary: "", riskTags: [] as SubstanceReferenceRiskTag[], sources: "", active: true, sortOrder: 0 };

export default function SubstanceReferencesPage() {
  const { user } = useAdmin();
  const [items, setItems] = useState<SubstanceReference[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [editing, setEditing] = useState<SubstanceReference | null | undefined>(undefined);
  const [form, setForm] = useState(empty);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [warning, setWarning] = useState("");
  const [error, setError] = useState("");

  async function reload() {
    setLoading(true);
    setError("");
    try { setItems(await substanceReferencesService.list()); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => void reload(), 0);
    return () => window.clearTimeout(timer);
  }, []);

  const filtered = useMemo(() => items
    .filter((item) => !status || String(item.active) === status)
    .filter((item) => normalize([item.name, item.canonicalName, ...(item.aliases ?? [])].filter(Boolean).join(" ")).includes(normalize(search)))
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, "pt-BR")), [items, search, status]);

  function open(item?: SubstanceReference) {
    setEditing(item ?? null);
    setForm(item ? {
      name: item.name,
      canonicalName: item.canonicalName ?? "",
      aliases: (item.aliases ?? []).join(", "),
      class: item.class ?? "",
      description: item.description,
      mechanismSummary: item.mechanismSummary ?? "",
      medicalUseSummary: item.medicalUseSummary ?? "",
      riskTags: item.riskTags,
      sources: (item.sources ?? []).join("\n"),
      active: item.active,
      sortOrder: item.sortOrder,
    } : { ...empty, sortOrder: items.length + 1 });
    setMessage(""); setWarning(""); setError("");
  }

  async function audit(action: string, entityId: string, summary?: string) {
    if (!user) return;
    try { await logAction(user.uid, action, "substanceReference", entityId, summary); }
    catch { setWarning("A ação principal foi concluída, mas o log de auditoria não pôde ser registrado."); }
  }

  async function save(event: React.FormEvent) {
    event.preventDefault(); setError(""); setWarning("");
    try {
      const payload = {
        name: form.name.trim(),
        canonicalName: form.canonicalName.trim() || undefined,
        aliases: form.aliases.split(",").map((value) => value.trim()).filter(Boolean),
        class: form.class.trim() || undefined,
        description: form.description.trim(),
        mechanismSummary: form.mechanismSummary.trim() || undefined,
        medicalUseSummary: form.medicalUseSummary.trim() || undefined,
        riskTags: form.riskTags,
        sources: form.sources.split("\n").map((value) => value.trim()).filter(Boolean),
        active: form.active,
        isSystem: editing?.isSystem ?? false,
        sortOrder: form.sortOrder,
      };
      const result = await substanceReferencesService.save(payload, editing?.id);
      const entityId = editing?.id ?? (result && "id" in result ? result.id : "new");
      await audit(editing ? "substanceReference.update" : "substanceReference.create", entityId, form.name);
      setEditing(undefined); setMessage("Substância salva com sucesso."); await reload();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  async function toggle(item: SubstanceReference) {
    setError(""); setWarning("");
    try {
      await substanceReferencesService.toggle(item);
      await audit("substanceReference.toggle", item.id, `${item.name}: ${item.active ? "inativo" : "ativo"}`);
      setMessage(`${item.name} foi ${item.active ? "desativado" : "ativado"}.`);
      await reload();
    } catch (reason) { setError(errorMessage(reason)); }
  }

  function toggleRiskTag(tag: SubstanceReferenceRiskTag) {
    setForm((current) => ({ ...current, riskTags: current.riskTags.includes(tag) ? current.riskTags.filter((item) => item !== tag) : [...current.riskTags, tag] }));
  }

  return <AdminShell><PageTitle eyebrow="BIBLIOTECA EDUCATIVA" title="Substâncias" detail="Catálogo de referência educativa. Não inclui dose, intervalo, ciclo nem combinação recomendada." action={<Button onClick={() => open()}>+ NOVA SUBSTÂNCIA</Button>}/>
    {message && <p className="success" role="status">{message}</p>}{warning && <p className="warning" role="alert">{warning}</p>}{error && <p className="error" role="alert">{error}</p>}
    <Card><div className="filters"><label>Pesquisar<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, canônico ou alias"/></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos</option><option value="true">Ativas</option><option value="false">Inativas</option></select></label></div></Card>

    {editing !== undefined && <Card><h2>{editing ? "Editar substância" : "Cadastrar substância"}</h2><form onSubmit={save}>
      <div className="form-grid">
        <label>Nome<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label>
        <label>Nome canônico<input value={form.canonicalName} onChange={(event) => setForm({ ...form, canonicalName: event.target.value })}/></label>
        <label>Aliases<input value={form.aliases} onChange={(event) => setForm({ ...form, aliases: event.target.value })} placeholder="Separados por vírgula"/></label>
        <label>Classe<input value={form.class} onChange={(event) => setForm({ ...form, class: event.target.value })}/></label>
        <label>Ordem<input type="number" value={form.sortOrder} onChange={(event) => setForm({ ...form, sortOrder: Number(event.target.value) })}/></label>
        <label>Estado<select value={String(form.active)} onChange={(event) => setForm({ ...form, active: event.target.value === "true" })}><option value="true">Ativa</option><option value="false">Inativa</option></select></label>
      </div>
      <label>Descrição<textarea required value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })}/></label>
      <label>Função/mecanismo geral<textarea value={form.mechanismSummary} onChange={(event) => setForm({ ...form, mechanismSummary: event.target.value })}/></label>
      <label>Uso médico/histórico<textarea value={form.medicalUseSummary} onChange={(event) => setForm({ ...form, medicalUseSummary: event.target.value })}/></label>
      <fieldset className="risk-tag-fieldset"><legend>Categorias de risco conhecidas</legend>{RISK_TAGS.map((tag) => <label className="check-label" key={tag}><input type="checkbox" checked={form.riskTags.includes(tag)} onChange={() => toggleRiskTag(tag)}/>{RISK_TAG_LABELS[tag]}</label>)}</fieldset>
      <label>Fontes (uma por linha)<textarea value={form.sources} onChange={(event) => setForm({ ...form, sources: event.target.value })} placeholder="Ex.: WADA Prohibited List — S1"/></label>
      <div className="actions"><Button>SALVAR</Button><button type="button" className="text-button" onClick={() => setEditing(undefined)}>Cancelar</button></div>
    </form></Card>}

    {loading ? <Loading/> : <Card><div className="table"><div className="tr head"><span>Substância</span><span>Classe</span><span>Status</span><span>Ações</span></div>{filtered.map((item) => <div className="tr" key={item.id}><strong>{item.name}</strong><span>{item.class ?? "—"}</span><Badge tone={item.active ? "good" : "neutral"}>{item.active ? "Ativa" : "Inativa"}</Badge><div className="actions"><button className="action-button edit-action" onClick={() => open(item)}><Pencil size={15}/>Editar</button><button className={`action-button ${item.active ? "disable-action" : "enable-action"}`} aria-label={`${item.active ? "Desativar" : "Ativar"} ${item.name}`} onClick={() => void toggle(item)}><Power size={15}/><span className="action-label">{item.active ? "Desativar" : "Ativar"}</span></button></div></div>)}</div>{!filtered.length && <Empty>Nenhuma substância encontrada.</Empty>}</Card>}
  </AdminShell>;
}
