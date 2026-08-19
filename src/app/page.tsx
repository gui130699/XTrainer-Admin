"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AdminShell } from "@/components/admin-shell";
import { Card, Loading, PageTitle } from "@/components/ui";
import { dashboard } from "@/services/data";
import { errorMessage } from "@/lib/utils";

type Metrics = Awaited<ReturnType<typeof dashboard>>;

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try { setMetrics(await dashboard()); }
    catch (reason) { setError(errorMessage(reason)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return <AdminShell><PageTitle eyebrow="VISÃO GERAL" title="Painel administrativo" detail="Gerencie usuários, exercícios e métodos de treino globais."/>{error && <p className="error" role="alert">{error} <button className="text-button" onClick={() => void load()}>Tentar novamente</button></p>}{loading ? <Loading/> : metrics && <div className="metrics"><Card><span>Usuários cadastrados</span><strong>{metrics.users}</strong><Link className="text-button" href="/usuarios">Ver usuários</Link></Card><Card><span>Exercícios na biblioteca</span><strong>{metrics.exercises}</strong><Link className="text-button" href="/exercicios">Gerenciar exercícios</Link></Card><Card><span>Exercícios ativos</span><strong>{metrics.activeExercises}</strong><Link className="text-button" href="/exercicios">Abrir biblioteca</Link></Card><Card><span>Métodos ativos</span><strong>{metrics.activeTrainingMethods}/{metrics.trainingMethods}</strong><Link className="text-button" href="/metodos">Gerenciar métodos</Link></Card></div>}<Card><h2>Escopo do administrador</h2><p>Este painel administra contas, exercícios e métodos globais. Treinos, sessões, evolução e avaliações continuam privados no XTrainer do usuário.</p></Card></AdminShell>;
}
