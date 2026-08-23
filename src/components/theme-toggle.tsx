"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

const STORAGE_KEY = "xtrainer-admin-theme";
type Theme = "dark" | "light";

export function ThemeToggle({ className = "" }: { className?: string }) {
  // O servidor sempre renderiza "dark" (sem acesso a localStorage durante o build estatico).
  // Sincronizamos com o tema real apos a hidratacao, evitando divergencia servidor/cliente.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sincroniza com o atributo ja aplicado pelo script anti-flash em <head>, executado antes da hidratacao.
    setTheme(document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark");
  }, []);

  function toggle() {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem(STORAGE_KEY, next); } catch { /* armazenamento indisponivel */ }
  }

  return <button type="button" className={`theme-toggle-button ${className}`} onClick={toggle} aria-label={theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"} title={theme === "light" ? "Tema escuro" : "Tema claro"} suppressHydrationWarning>
    {theme === "light" ? <Moon size={17}/> : <Sun size={17}/>}
  </button>;
}
