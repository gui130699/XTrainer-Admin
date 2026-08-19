import type { Metadata,Viewport } from "next";import "./globals.css";import { Providers } from "@/components/providers";import { InstallAppButton } from "@/components/install-app-button";
const basePath=process.env.GITHUB_ACTIONS==="true"?"/XTrainer-Admin":"";
const buildVersion=process.env.GITHUB_SHA??"local";
const versioned=(path:string)=>`${basePath}${path}?v=${buildVersion}`;
export const metadata:Metadata={title:"XTrainer Admin",description:"Painel administrativo do XTrainer",manifest:versioned("/manifest.webmanifest"),icons:{icon:[{url:versioned("/xtrainer-admin-icon-192.png"),sizes:"192x192",type:"image/png"},{url:versioned("/xtrainer-admin-icon-512.png"),sizes:"512x512",type:"image/png"}],shortcut:versioned("/xtrainer-admin-icon-192.png"),apple:{url:versioned("/xtrainer-admin-icon-192.png"),sizes:"192x192",type:"image/png"}},appleWebApp:{capable:true,title:"XTrainer Admin",statusBarStyle:"black-translucent"}};
export const viewport:Viewport={themeColor:"#22d3ee"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Providers><InstallAppButton/>{children}</Providers></body></html>}
