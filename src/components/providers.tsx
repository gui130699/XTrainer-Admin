"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "@/lib/firebase";
import { getSystemConfig } from "@/services/auth";

type State = { user: User | null; admin: boolean; loading: boolean };
const Context = createContext<State>({ user: null, admin: false, loading: true });

async function registerPwaUpdate() {
  if (!("serviceWorker" in navigator)) return;
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  const buildVersion = process.env.NEXT_PUBLIC_BUILD_VERSION ?? "local";
  const hadController = Boolean(navigator.serviceWorker.controller);
  let refreshing = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || refreshing) return;
    refreshing = true;
    window.location.reload();
  });
  const registration = await navigator.serviceWorker.register(`${basePath}/sw.js?v=${buildVersion}`, { updateViaCache: "none" });
  await registration.update();
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ user: null, admin: false, loading: true });
  useEffect(() => {
    void registerPwaUpdate().catch(() => undefined);
    return onAuthStateChanged(auth, async (user) => {
      if (!user) { setState({ user: null, admin: false, loading: false }); return; }
      try {
        const config = await getSystemConfig();
        setState({ user, admin: config?.adminUid === user.uid, loading: false });
      } catch { setState({ user, admin: false, loading: false }); }
    });
  }, []);
  return <Context.Provider value={state}>{children}</Context.Provider>;
}

export const useAdmin = () => useContext(Context);
