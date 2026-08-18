# Documentação do XTrainer Admin

## Arquitetura

Aplicação Next.js App Router exportada estaticamente para `/XTrainer-Admin`. Firebase Web SDK conecta diretamente ao projeto compartilhado `xtrainer-45f8d`. `Providers` observa Auth e valida `system/config.adminUid`; `AdminShell` protege todas as áreas internas.

## Rotas

- `/login`: login exclusivo do administrador.
- `/`: indicadores de usuários e exercícios.
- `/usuarios`: perfis Firestore, pesquisa e dados cadastrais.
- `/exercicios`: listagem, cadastro, edição, ativação/desativação e seed idempotente.

Treinos, sessões, evolução, peso e avaliações não possuem rotas administrativas. Esses dados são gerenciados exclusivamente pelo próprio usuário no XTrainer.

## Componentes, services e tipos

`AdminShell`, `Providers` e componentes de UI concentram navegação, guard e apresentação. `src/services/auth.ts` valida o administrador. `src/services/data.ts` concentra todas as operações Firestore e logs administrativos. Os contratos em `src/types` foram mantidos compatíveis com o XTrainer.

## Permissões

O administrador pode ler os perfis em `users` e administrar `exercises`. Treinos, sessões, pesos, avaliações e arquivos pessoais permanecem acessíveis somente ao respectivo usuário. `exercises` e `auditLogs` são escritos apenas pelo administrador.

## Deploy e limitações

O GitHub Actions publica o export estático. O painel não possui backend e, portanto, não lista/desativa/exclui contas Auth. Paginação por cursor e funções confiáveis são melhorias futuras.
