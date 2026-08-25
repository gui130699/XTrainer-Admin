# Modelo de segurança — XTrainer Admin

Atualizado em 25/08/2026, como parte da auditoria de hardening (branch `security/hardening-v1`).
Este é o painel administrativo; ele compartilha o projeto Firebase (`xtrainer-45f8d`) e o
contrato de dados (`npm run check:firebase-contract`) com o app do usuário, `XTrainer`. O
modelo de segurança completo (arquitetura, Auth, Firestore, incident response) está documentado
em `XTrainer/docs/SECURITY.md` — este arquivo cobre só o que é específico do Admin.

Este documento não contém segredos.

## Autoridade administrativa

Hoje: `isAdmin()` nas Firestore Rules verifica `system/config.adminUid == request.auth.uid`.
`users/{uid}.role` nunca concede privilégio administrativo por si só.

Migração para custom claims preparada, não ativada:

```bash
# Local, nunca em CI. Requer Application Default Credentials (gcloud auth application-default
# login) ou GOOGLE_APPLICATION_CREDENTIALS apontando para um service account fora do repositório.
node scripts/provision-admin-claim.mjs --uid=<uid-do-admin> --yes
```

Depois de provisionar, a conta precisa sair e entrar de novo (ou `getIdToken(true)`) para o
token carregar a claim. As Rules só devem passar a exigir a claim depois de confirmado que ela
está presente no token real (`--verify=<uid>`).

## Dados locais neste painel

- `initializeFirestore(..., { localCache: memoryLocalCache() })` — nunca persiste em disco;
  qualquer dado consultado (mesmo agregados/contagens do dashboard) desaparece ao fechar ou
  recarregar a aba. O Admin nunca lê dados privados de usuário (workouts, sessões, peso,
  avaliações) — só o catálogo global e identificação mínima de conta.
- `browserSessionPersistence` no Auth: fechar o navegador encerra a sessão administrativa.
- Timeout de inatividade: 20 minutos sem interação (pointer/teclado/touch) faz logout
  automático, com aviso 2 minutos antes.

## Privilégios de leitura

O Admin não lê e não deve nunca ler, direta ou indiretamente:
`workouts`, `workoutSessions`, `bodyWeights`, `physicalAssessments`,
`exerciseSubstitutionPreferences`. A mesma filosofia se aplica a qualquer coleção privada futura
(`userExercises`, `cycles`, `cycleApplications`, `cycleCheckins`, `labResults`) — owner-only,
sem exceção administrativa, salvo requisito explicitamente aprovado e documentado depois.

`exerciseRequests` (quando implementado) é a única exceção prevista: o Admin pode ler porque é
um workflow de moderação, não dado pessoal.

## Auditoria

`auditLogs` é append-only nas Rules (`create = admin`, `update/delete = false` sempre).
`logAction()` deve registrar identificadores (ex.: `exercise.update` + ID do exercício), nunca
o conteúdo de dados pessoais de terceiros.

## Script de provisionamento

`scripts/provision-admin-claim.mjs` usa `firebase-admin` (devDependency, não entra no bundle do
app — confirmado via build) com Application Default Credentials. Nunca commitar
`service-account*.json` nem colar o conteúdo de uma credencial em nenhum arquivo do
repositório — já bloqueado pelo `.gitignore`.
