import type { Timestamp } from "firebase/firestore";
export const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
export const slugifyExerciseName=(value:string)=>normalize(value).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
export const dateTime=(value?:Timestamp)=>value?.toDate().toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})??"—";
export const dateOnly=(value?:Timestamp|string)=>typeof value==="string"?value.split("-").reverse().join("/"):value?.toDate().toLocaleDateString("pt-BR")??"—";
export const kg=(value?:number)=>value==null?"—":`${value.toLocaleString("pt-BR",{maximumFractionDigits:1})} kg`;
export const duration=(seconds?:number)=>seconds==null?"—":`${Math.round(seconds/60)} min`;
export const errorMessage=(error:unknown)=>{const code=typeof error==="object"&&error!==null&&"code" in error?String(error.code).replace(/^firestore\//,""):"";if(code==="permission-denied")return"Sua conta não possui permissão para esta operação.";if(code==="unauthenticated")return"Sua sessão expirou. Entre novamente.";if(code==="unavailable"||code==="network-request-failed")return"Sem conexão com o servidor. Verifique sua internet e tente novamente.";if(code==="failed-precondition")return"A configuração do banco ainda não está pronta. Publique os índices do Firestore.";const message=error instanceof Error?error.message:"";return message&&!/^(Firebase|Function|Missing or insufficient permissions)/i.test(message)?message:"Não foi possível concluir a operação."};
