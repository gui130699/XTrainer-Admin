import { addDoc,collection,doc,getCountFromServer,getDoc,getDocs,query,serverTimestamp,updateDoc,where,writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";import { DEFAULT_EXERCISES } from "@/data/default-exercises";import type { Exercise,UserProfile } from "@/types";
const all=async<T>(path:string)=>(await getDocs(collection(db,path))).docs.map(item=>({id:item.id,...item.data()}) as T);
const withoutUndefined=(data:object)=>Object.fromEntries(Object.entries(data).filter(([,value])=>value!==undefined));
export const usersService={list:()=>all<UserProfile>("users"),get:async(uid:string)=>{const item=await getDoc(doc(db,"users",uid));return item.exists()?item.data() as UserProfile:null;}};
export const exercisesService={
 list:()=>all<Exercise>("exercises"),
 save:(data:Omit<Exercise,"id">,id?:string)=>id?updateDoc(doc(db,"exercises",id),{...data,updatedAt:serverTimestamp()}):addDoc(collection(db,"exercises"),{...data,createdAt:serverTimestamp(),updatedAt:serverTimestamp()}),
 toggle:(item:Exercise)=>updateDoc(doc(db,"exercises",item.id),{active:!item.active,updatedAt:serverTimestamp()}),
 seed:async()=>{const existing=await getDocs(collection(db,"exercises")),known=new Set(existing.docs.map(item=>item.id));let created=0,updated=0;for(let start=0;start<DEFAULT_EXERCISES.length;start+=400){const batch=writeBatch(db);for(const item of DEFAULT_EXERCISES.slice(start,start+400)){batch.set(doc(db,"exercises",item.id),{...withoutUndefined(item),updatedAt:serverTimestamp(),...(known.has(item.id)?{}:{createdAt:serverTimestamp()})},{merge:true});if(known.has(item.id))updated++;else created++;}await batch.commit()}return{created,updated,total:DEFAULT_EXERCISES.length}}
};
export async function dashboard(){const count=async(path:string,activeOnly=false)=>(await getCountFromServer(activeOnly?query(collection(db,path),where("active","==",true)):query(collection(db,path)))).data().count;return{users:await count("users"),exercises:await count("exercises"),activeExercises:await count("exercises",true)};}
export async function logAction(adminUid:string,action:string,entityType:string,entityId:string,summary?:string){try{await addDoc(collection(db,"auditLogs"),{adminUid,action,entityType,entityId,summary:summary??null,timestamp:serverTimestamp()});}catch(error){console.warn("Audit log não registrado.",error);}}
