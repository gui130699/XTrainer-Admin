import type { Timestamp } from "firebase/firestore";
export const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim();
export const slugifyExerciseName=(value:string)=>normalize(value).replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
export const dateTime=(value?:Timestamp)=>value?.toDate().toLocaleString("pt-BR",{dateStyle:"short",timeStyle:"short"})??"—";
export const dateOnly=(value?:Timestamp|string)=>typeof value==="string"?value.split("-").reverse().join("/"):value?.toDate().toLocaleDateString("pt-BR")??"—";
export const kg=(value?:number)=>value==null?"—":`${value.toLocaleString("pt-BR",{maximumFractionDigits:1})} kg`;
export const duration=(seconds?:number)=>seconds==null?"—":`${Math.round(seconds/60)} min`;
export const errorMessage=(error:unknown)=>error instanceof Error?error.message:"Não foi possível concluir a operação.";
