"use client";
import { useEffect, useState } from "react";
import { AdminShell } from "@/components/admin-shell";
import { Badge, Card, Loading, PageTitle } from "@/components/ui";
import { getSystemConfig } from "@/services/auth";
import { trainingMethodsService } from "@/services/training-methods";

export default function SystemPage() {
  const [state, setState] = useState<{ initialized: boolean; methods: number; engines: number } | null>(null);
  useEffect(() => { void Promise.all([getSystemConfig(), trainingMethodsService.list()]).then(([config, methods]) => setState({ initialized: config?.initialized === true, methods: methods.length, engines: new Set(methods.map((item) => item.engine)).size })); }, []);
  return <AdminShell><PageTitle eyebrow="INTEGRIDADE" title="Sistema" detail="Estado dos contratos globais usados pelos dois PWAs."/>{!state ? <Loading/> : <div className="metrics"><Card><span>Inicialização segura</span><strong><Badge tone={state.initialized ? "good" : "warn"}>{state.initialized ? "OK" : "Pendente"}</Badge></strong></Card><Card><span>Métodos publicados</span><strong>{state.methods}</strong></Card><Card><span>Motores em uso</span><strong>{state.engines}</strong></Card></div>}<Card><h2>Separação de responsabilidades</h2><p>O administrador controla usuários, exercícios e definições globais dos métodos. Treinos, sessões, evolução e avaliações permanecem privados e são criados somente pelo próprio usuário.</p></Card></AdminShell>;
}
