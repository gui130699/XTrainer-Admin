import { browserSessionPersistence, setPersistence, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { SystemConfig } from "@/types";
export async function getSystemConfig(){const snap=await getDoc(doc(db,"system","config"));return snap.exists()?snap.data() as SystemConfig:null;}
export async function loginAdmin(email:string,password:string){
  // Sessão administrativa nunca sobrevive ao fechamento do navegador (fechar a aba = logout na
  // próxima abertura), ao contrário da persistência padrão do Firebase Auth (indexedDB, dura
  // entre reinícios). Aguardado aqui, antes do signIn, para não correr risco de o login
  // completar usando a persistência anterior por causa de uma race condition.
  await setPersistence(auth, browserSessionPersistence);
  const credential=await signInWithEmailAndPassword(auth,email,password);const config=await getSystemConfig();if(!config||config.adminUid!==credential.user.uid){await signOut(auth);throw Error("Esta conta não possui permissão administrativa.");}return credential.user;
}
export const logout=()=>signOut(auth);
