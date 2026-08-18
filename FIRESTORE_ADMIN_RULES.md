# Firestore Rules compartilhadas

O arquivo `firestore.rules` deste repositório é canônico para XTrainer e XTrainer Admin.

## Política

- `system/config`: leitura necessária ao login; criação apenas no primeiro bootstrap; mudança apenas pelo admin.
- `users`: próprio perfil ou admin; usuário comum não eleva o papel.
- `exercises`: leitura autenticada; escrita somente admin.
- `workouts`: somente o dono; o próprio usuário cria e administra seus treinos.
- `workoutSessions`, `bodyWeights`, `physicalAssessments`: somente o dono; o administrador não consulta dados pessoais.
- `auditLogs`: leitura e criação somente admin.

## Publicação

As regras afetam o aplicativo principal. Execute testes e só então publique:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project xtrainer-45f8d
```

Os índices do XTrainer foram preservados porque continuam necessários ao aplicativo principal, mesmo sem uso pelo painel administrativo.
