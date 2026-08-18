# XTrainer Admin

Painel administrativo separado do XTrainer, construído com Next.js, TypeScript e Firebase Web SDK. O painel não possui banco próprio.

> **IMPORTANTE:** XTrainer e XTrainer Admin utilizam o mesmo Firebase: `xtrainer-45f8d`. Authentication, Firestore e Storage são compartilhados. Este repositório passa a ser a fonte canônica das regras compartilhadas; qualquer mudança deve permanecer compatível com o aplicativo principal.

## Segurança e autenticação

O login utiliza Firebase Authentication. Depois da autenticação, o painel lê `system/config` e só autoriza o UID igual a `adminUid`. Contas comuns são desconectadas. As Firestore Rules são a camada final e concedem acesso administrativo através da mesma função `isAdmin()`.

O frontend não usa Admin SDK, Service Account nem chaves privadas. A lista de usuários vem de `users/{uid}`; o Firebase Web SDK não permite listar ou excluir contas Auth de terceiros.

## Collections compartilhadas

`system/config`, `users`, `exercises`, `workouts`, `workoutSessions`, `bodyWeights`, `physicalAssessments` e `auditLogs`. A biblioteca padrão é uma cópia controlada do dataset canônico de 202 exercícios do XTrainer e mantém IDs determinísticos.

## Desenvolvimento local

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run build
```

Acesse `http://localhost:3000`. Copie `.env.example` para `.env.local` se quiser substituir a configuração pública de fallback.

## Deploy

Pushes em `main` executam lint, typecheck e build, publicando `out/` no GitHub Pages em `https://gui130699.github.io/XTrainer-Admin/`. O domínio `gui130699.github.io` precisa estar autorizado no Firebase Authentication; isso deve ser confirmado no Console.

As regras afetam os dois aplicativos. Antes de publicá-las, valide o XTrainer principal:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project xtrainer-45f8d
```

Storage só deve ser publicado após confirmar que o bucket está habilitado.

## Limitações

- Não administra diretamente contas do Firebase Auth.
- Não troca `adminUid` pela interface.
- Consultas administrativas são carregadas sob demanda; paginação por cursor é uma evolução para bases grandes.
- Funções administrativas que exijam ambiente confiável devem usar Cloud Functions no futuro, nunca Admin SDK no navegador.
