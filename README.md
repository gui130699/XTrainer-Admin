# XTrainer Admin

PWA administrativa separada para consultar identificação de usuários cadastrados e administrar a biblioteca global de exercícios do XTrainer. Não possui Firebase próprio e não acessa dados corporais ou de treino.

## Escopo

- dashboard com totais de usuários, exercícios e exercícios ativos;
- lista pesquisável de contas mostrando somente nome, e-mail, UID, papel e data de cadastro;
- cadastro, edição e ativação/desativação de exercícios;
- substituição integral do catálogo pelo dataset canônico de 202 exercícios com pesquisas em português;
- exportação CSV da lista filtrada com proteção contra CSV Injection;
- auditoria visível de criação, edição, toggle, importação e exportação;
- botão de instalação PWA.

Não há abas de treinos, sessões, evolução ou avaliações. As coleções privadas `workouts`, `workoutSessions`, `bodyWeights` e `physicalAssessments` são negadas ao administrador pelas Rules.

## Autorização

O login usa Firebase Authentication, mas a autorização usa exclusivamente:

```text
system/config.adminUid == request.auth.uid
```

Não existe cadastro público de admin nem troca de `adminUid` pelo navegador. Provisione `system/config` pelo Console Firebase ou Admin SDK em ambiente confiável. Nunca coloque Service Account ou Admin SDK no frontend.

## Desenvolvimento e validação

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run check:firebase-contract
npm run build
```

Os testes de Rules exigem Java 21. O contrato compartilhado compara `firestore.rules`, `firestore.indexes.json`, `storage.rules`, `src/types/index.ts` e `src/data/default-exercises.ts` com o XTrainer.

## Firebase compartilhado

Os dois repositórios apontam para `xtrainer-45f8d`. O arquivo de configuração canônico deve permanecer idêntico nos dois e é bloqueado pelo CI se houver drift. Consulte `FIRESTORE_SCHEMA.md` e `CONTRATO_COMPARTILHADO.md`.

O comando de substituição sobrescreve os 202 documentos canônicos, ativa todos eles e remove exercícios que não pertencem ao dataset. Os IDs determinísticos são preservados para não quebrar referências de treinos e históricos. Antes da migração remota, a rotina salva um backup local recuperável em `backups/`.

Todos os links canônicos abrem pesquisas do YouTube em português com o padrão “execução correta musculação em português”. O gerador valida quantidade, cabeçalho, campos obrigatórios, duplicidades e os 202 links antes de alterar o código.

Para gerar o catálogo nos dois projetos a partir de outro CSV compatível:

```bash
npm run replace:exercise-library -- "C:\\caminho\\catalogo.csv"
```

Para aplicar a substituição integral na coleção remota, com backup automático em `backups/`:

```bash
npm run replace:firestore-exercises -- --project=xtrainer-45f8d --yes
```

## Deploy

Pushes em `main` validam o projeto e publicam `out/` em `https://gui130699.github.io/XTrainer-Admin/`. Configure os secrets `NEXT_PUBLIC_FIREBASE_*` no GitHub e autorize `gui130699.github.io` no Firebase Authentication.

O deploy do Pages não publica Rules, indexes ou Storage Rules. Após revisão manual:

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage --project xtrainer-45f8d
```

O cache deste PWA usa somente o prefixo `xtrainer-admin-`.

O Admin usa o ícone azul do XTrainer com escudo administrativo no aplicativo instalado, favicon, login, barra lateral desktop e cabeçalho mobile. O manifesto fornece versões `192x192`, `512x512` e uma variante `maskable` com margem segura para launchers adaptativos.

## Métodos de treino dinâmicos

A rota `/metodos` gerencia o catálogo global com wizard visual, esquemas seguros, defaults, versão, ordem, duplicação e ativação. A rota `/sistema` resume a integridade do contrato. Consulte [RELATORIO_IMPLEMENTACAO_METODOS.md](RELATORIO_IMPLEMENTACAO_METODOS.md).
