# Documentação do XTrainer Admin

## Arquitetura

Aplicação Next.js App Router exportada estaticamente para `/XTrainer-Admin`. Firebase Web SDK conecta diretamente ao projeto compartilhado `xtrainer-45f8d`. `Providers` observa Auth e valida `system/config.adminUid`; `AdminShell` protege todas as áreas internas.

## Rotas

- `/login`: login exclusivo do administrador.
- `/`: indicadores reais e atividade recente.
- `/usuarios`: perfis Firestore, pesquisa e detalhes relacionados.
- `/exercicios`: CRUD, ativação, seed idempotente e proteção contra exclusão referenciada.
- `/treinos`: criação para usuário, edição, arquivamento e exclusão sem cascata.
- `/sessoes`: filtros, snapshot detalhado e cancelamento confirmado de sessão ativa.
- `/evolucao`: peso por usuário, gráfico e CRUD administrativo.
- `/avaliacoes`: consulta de avaliações, medidas e campos existentes.
- `/sistema`: projeto Firebase, administrador, biblioteca e versão.

## Componentes, services e tipos

`AdminShell`, `Providers` e componentes de UI concentram navegação, guard e apresentação. `src/services/auth.ts` valida o administrador. `src/services/data.ts` concentra todas as operações Firestore e logs administrativos. Os contratos em `src/types` foram mantidos compatíveis com o XTrainer.

## Permissões

Usuários comuns continuam restritos aos próprios dados. O administrador recebe leitura administrativa e as escritas usadas pelo painel. `ownerId` não pode ser trocado por usuários comuns. `exercises` e `auditLogs` são escritos apenas pelo administrador.

## Deploy e limitações

O GitHub Actions publica o export estático. O painel não possui backend e, portanto, não lista/desativa/exclui contas Auth. Paginação por cursor e funções confiáveis são melhorias futuras.
