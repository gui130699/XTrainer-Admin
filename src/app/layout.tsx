import type { Metadata } from "next";import "./globals.css";import { Providers } from "@/components/providers";
export const metadata:Metadata={title:"XTrainer Admin",description:"Painel administrativo do XTrainer"};
export default function Layout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body><Providers>{children}</Providers></body></html>}
