import { signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { SystemConfig } from "@/types";
export async function getSystemConfig(){const snap=await getDoc(doc(db,"system","config"));return snap.exists()?snap.data() as SystemConfig:null;}
export async function loginAdmin(email:string,password:string){const credential=await signInWithEmailAndPassword(auth,email,password);const config=await getSystemConfig();if(!config||config.adminUid!==credential.user.uid){await signOut(auth);throw Error("Esta conta não possui permissão administrativa.");}return credential.user;}
export const logout=()=>signOut(auth);
