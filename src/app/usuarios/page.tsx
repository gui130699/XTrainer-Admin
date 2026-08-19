"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Button, Card, Empty, Loading, PageTitle } from "@/components/ui";
import { usersService } from "@/services/data";
import type { UserProfile } from "@/types";
import { dateTime, errorMessage, normalize } from "@/lib/utils";

export default function UsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setUsers(await usersService.list()); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filtered = useMemo(() => users.filter((item) => normalize(`${item.name} ${item.email} ${item.uid}`).includes(normalize(search))), [users, search]);
  return <AdminShell><PageTitle eyebrow="USUÁRIOS" title="Usuários cadastrados" detail="Somente identificação da conta. Treinos, evolução, medidas, avaliações e fotos não são acessados."/><Card><label>Pesquisar por nome, e-mail ou UID<input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar..."/></label></Card>{error && <p className="error" role="alert">{error} <button className="text-button" onClick={() => void load()}>Tentar novamente</button></p>}{loading ? <Loading/> : <Card><div className="table"><div className="tr head"><span>Usuário</span><span>E-mail</span><span>Papel</span><span>Ação</span></div>{filtered.map((item) => <div className="tr" key={item.uid}><strong>{item.name || "Sem nome"}</strong><span>{item.email}</span><span><Badge tone={item.role === "admin" ? "warn" : "neutral"}>{item.role === "admin" ? "Administrador" : "Usuário"}</Badge></span><button className="text-button" onClick={() => setSelected(item)}>Ver cadastro</button></div>)}</div>{!filtered.length && <Empty>Nenhum usuário encontrado.</Empty>}</Card>}{selected && <Card><div className="actions"><h2>{selected.name}</h2><Button className="secondary" onClick={() => setSelected(null)}>FECHAR</Button></div><div className="detail-grid"><div><small>E-mail</small>{selected.email}</div><div><small>UID</small>{selected.uid}</div><div><small>Papel</small>{selected.role === "admin" ? "Administrador" : "Usuário"}</div><div><small>Cadastro</small>{dateTime(selected.createdAt)}</div></div></Card>}</AdminShell>;
}
