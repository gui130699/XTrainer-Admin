import type { Metadata,Viewport } from "next";import "./globals.css";import { Providers } from "@/components/providers";import { InstallAppButton } from "@/components/install-app-button";
const basePath=process.env.GITHUB_ACTIONS==="true"?"/XTrainer-Admin":"";
export const metadata:Metadata={title:"XTrainer Admin",description:"Painel administrativo do XTrainer",manifest:`${basePath}/manifest.webmanifest`,icons:{icon:`${basePath}/icon-192.png`,apple:`${basePath}/icon-192.png`},appleWebApp:{capable:true,title:"XTrainer Admin",statusBarStyle:"black-translucent"}};
export const viewport:Viewport={themeColor:"#22d3ee"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Providers><InstallAppButton/>{children}</Providers></body></html>}
