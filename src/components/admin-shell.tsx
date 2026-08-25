"use client";
import Link from "next/link";import { usePathname,useRouter } from "next/navigation";import { Dumbbell,Home,LogOut,Menu,Settings,SlidersHorizontal,Tags,Users,X } from "lucide-react";import { useEffect,useRef,useState } from "react";import { useAdmin } from "./providers";import { logout } from "@/services/auth";import { Loading } from "./ui";import { AdminAppLogo } from "./admin-app-logo";import { ThemeToggle } from "./theme-toggle";
const links=[[/^\/$/,"/","Dashboard",Home],[/^\/usuarios/,"/usuarios","Usuários",Users],[/^\/exercicios/,"/exercicios","Exercícios",Dumbbell],[/^\/grupos-musculares/,"/grupos-musculares","Grupos musculares",Tags],[/^\/metodos/,"/metodos","Métodos de treino",SlidersHorizontal],[/^\/sistema/,"/sistema","Sistema",Settings]] as const;

// Sessão privilegiada não pode ficar aberta indefinidamente num computador esquecido. Após
// INACTIVITY_LIMIT_MS sem nenhuma interação, a conta é deslogada automaticamente; um aviso
// aparece WARNING_BEFORE_MS antes, com opção de continuar conectado.
const INACTIVITY_LIMIT_MS = 20 * 60 * 1000;
const WARNING_BEFORE_MS = 2 * 60 * 1000;
const ACTIVITY_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;

function useInactivityLogout(active: boolean, onWarn: (secondsLeft: number) => void, onExpire: () => void) {
  const lastActivityRef = useRef(0);
  useEffect(() => {
    if (!active) return;
    const markActive = () => { lastActivityRef.current = Date.now(); };
    markActive();
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, markActive, { passive: true }));
    const interval = window.setInterval(() => {
      const idleFor = Date.now() - lastActivityRef.current;
      if (idleFor >= INACTIVITY_LIMIT_MS) { onExpire(); return; }
      if (idleFor >= INACTIVITY_LIMIT_MS - WARNING_BEFORE_MS) onWarn(Math.ceil((INACTIVITY_LIMIT_MS - idleFor) / 1000));
    }, 5000);
    return () => { ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, markActive)); window.clearInterval(interval); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onWarn/onExpire são recriadas a cada render no AdminShell; só o efeito de (re)ligar os listeners deve depender de `active`.
  }, [active]);
  return () => { lastActivityRef.current = Date.now(); };
}

export function AdminShell({children}:{children:React.ReactNode}){
  const{user,admin,loading}=useAdmin(),router=useRouter(),path=usePathname(),[open,setOpen]=useState(false);
  const [expiryWarningSeconds, setExpiryWarningSeconds] = useState<number|null>(null);
  const resetInactivity = useInactivityLogout(Boolean(user && admin), (secondsLeft) => setExpiryWarningSeconds(secondsLeft), () => { setExpiryWarningSeconds(null); void logout().then(() => router.replace("/login")); });
  if(loading)return <Loading text="Verificando acesso..."/>;
  if(!user||!admin){if(typeof window!=="undefined")router.replace("/login");return <Loading text="Acesso administrativo necessário."/>}
  return <div className="shell">
    <button className="menu-button" onClick={()=>setOpen(true)} aria-label="Abrir menu"><Menu/></button>
    <Link className="mobile-admin-brand" href="/" aria-label="XTrainer Admin - início"><AdminAppLogo size={38}/></Link>
    {open&&<button className="overlay" onClick={()=>setOpen(false)} aria-label="Fechar menu"/>}
    <aside className={open?"open":""}>
      <div className="brand"><AdminAppLogo size={48}/><button onClick={()=>setOpen(false)} aria-label="Fechar"><X/></button></div>
      <nav>{links.map(([pattern,href,label,Icon])=><Link className={pattern.test(path)?"active":""} href={href} key={href} onClick={()=>setOpen(false)}><Icon size={18}/>{label}</Link>)}</nav>
      <div className="account"><small>Administrador</small><strong>{user.email}</strong><ThemeToggle className="sidebar-theme-toggle"/><button onClick={async()=>{await logout();router.replace("/login")}}><LogOut size={16}/> Sair</button></div>
    </aside>
    <main>{children}</main>
    {expiryWarningSeconds!==null && <div className="session-expiry-warning" role="alertdialog" aria-label="Aviso de expiração de sessão">
      <span>Sua sessão vai expirar por inatividade em {Math.ceil(expiryWarningSeconds/60)} min.</span>
      <button onClick={() => { resetInactivity(); setExpiryWarningSeconds(null); }}>CONTINUAR CONECTADO</button>
    </div>}
  </div>;
}
