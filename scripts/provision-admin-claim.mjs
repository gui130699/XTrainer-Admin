// Provisiona (ou remove) a custom claim `admin: true` no Firebase Authentication de uma conta,
// como parte da migração descrita em docs/SECURITY.md (Fase 15-18: autoridade administrativa
// deixa de depender só de system/config.adminUid e passa a poder ser checada também via
// request.auth.token.admin == true no Firestore Rules).
//
// NÃO roda em CI, NÃO faz parte do build, e NÃO deve rodar antes de você mesmo confirmar que a
// conta é realmente a administradora pretendida. As Firestore Rules continuam aceitando
// system/config.adminUid como autoridade válida até uma migração explícita e separada - este
// script só ADICIONA a claim, não remove a autoridade antiga.
//
// Uso (local, nunca em CI):
//   1. Autentique com Application Default Credentials, de UM dos dois jeitos:
//        gcloud auth application-default login
//      ou aponte para um service account próprio (baixado do Console, fora do repositório):
//        set GOOGLE_APPLICATION_CREDENTIALS=C:\caminho\fora-do-repo\service-account.json   (Windows)
//        export GOOGLE_APPLICATION_CREDENTIALS=/caminho/fora/do/repo/service-account.json  (macOS/Linux)
//   2. node scripts/provision-admin-claim.mjs --uid=<uid-do-admin> --yes
//      (ou --email=<email-do-admin> --yes, se preferir identificar por e-mail)
//   3. Peça para a conta sair e entrar novamente (ou chamar user.getIdToken(true)) para o novo
//      token já carregar a claim - custom claims só aparecem em tokens emitidos DEPOIS da chamada.
//   4. Confira com --verify=<uid-ou-email> antes de considerar concluído.
//
// Nunca commitar service-account*.json, private keys ou qualquer arquivo de credencial - já
// bloqueado pelo .gitignore, mas a responsabilidade de nunca colar o conteúdo aqui é sua.
import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.argv.find((value) => value.startsWith("--project="))?.split("=")[1] ?? "xtrainer-45f8d";
const uidArg = process.argv.find((value) => value.startsWith("--uid="))?.split("=")[1];
const emailArg = process.argv.find((value) => value.startsWith("--email="))?.split("=")[1];
const verifyArg = process.argv.find((value) => value.startsWith("--verify="))?.split("=")[1];
const revoke = process.argv.includes("--revoke");
const confirmed = process.argv.includes("--yes");

const app = initializeApp({ credential: applicationDefault(), projectId });
const auth = getAuth(app);
const firestore = getFirestore(app);

async function resolveUser() {
  if (uidArg) return auth.getUser(uidArg);
  if (emailArg) return auth.getUserByEmail(emailArg);
  throw new Error("Informe --uid=<uid> ou --email=<email> do administrador.");
}

if (verifyArg) {
  const user = verifyArg.includes("@") ? await auth.getUserByEmail(verifyArg) : await auth.getUser(verifyArg);
  console.log(`uid=${user.uid} email=${user.email ?? "(sem email)"} customClaims=${JSON.stringify(user.customClaims ?? {})}`);
  process.exit(0);
}

if (!confirmed) throw new Error("Operação não confirmada. Repita o comando com --yes.");

const user = await resolveUser();
const configSnapshot = await firestore.doc("system/config").get();
const configuredAdminUid = configSnapshot.exists ? configSnapshot.data()?.adminUid : undefined;
if (configuredAdminUid && configuredAdminUid !== user.uid) {
  console.warn(`Aviso: system/config.adminUid atual é "${configuredAdminUid}", diferente do uid informado ("${user.uid}"). Confirme que está provisionando a conta certa antes de prosseguir.`);
}

await auth.setCustomUserClaims(user.uid, revoke ? {} : { admin: true });
console.log(`${revoke ? "Removida" : "Concedida"} a claim admin para uid=${user.uid} (${user.email ?? "sem email"}). A conta precisa sair e entrar de novo (ou forçar getIdToken(true)) para o token atualizar.`);
