# Checklist de segurança — XTrainer Admin

Checklist específico deste repositório. A versão completa e compartilhada (GitHub, Google
Cloud, Firestore, Auth, App Check) está em `XTrainer/docs/SECURITY-CHECKLIST.md` — os itens são
os mesmos para os dois repositórios, já que compartilham o mesmo projeto Firebase.

## Específico do Admin

- [x] `persistentLocalCache` substituído por `memoryLocalCache`
- [x] `browserSessionPersistence` no Auth, aguardado antes do login (sem race condition)
- [x] Timeout de inatividade de 20 min, aviso 2 min antes
- [x] Tema claro/escuro com toggle próprio (`xtrainer-admin-theme` no localStorage, separado do
      XTrainer)
- [x] `scripts/provision-admin-claim.mjs` criado (`firebase-admin` como devDependency,
      confirmado que não entra no bundle do app via build)
- [ ] Custom claim `admin: true` efetivamente provisionada na conta administrativa real
- [ ] Firestore Rules atualizadas para aceitar a claim (só depois do item acima)
- [x] `.env.example` corrigido para conter só nomes de variável (tinha valores reais
      preenchidos — eram públicos, mas fora do padrão pedido)
- [x] `firestore.rules` sincronizado com XTrainer (`npm run check:firebase-contract` passa)
- [x] `tests/firestore.security-adversarial.test.mjs` copiado e passando (mesmas 51
      verificações/60+ asserções do XTrainer, contra as mesmas Rules)

## Itens compartilhados (ver XTrainer/docs/SECURITY-CHECKLIST.md para detalhe)

- [ ] Publicar `firestore.rules`/`firestore.indexes.json` em produção
- [ ] E-mail verificado obrigatório para login administrativo
- [ ] Política de senha forte no Console
- [ ] MFA (TOTP) na conta administrativa
- [ ] App Check: registrar reCAPTCHA Enterprise, habilitar em modo Monitor
- [ ] Revisão de IAM/API key restrictions/domínios autorizados no Google Cloud Console
- [ ] 2FA/passkey/recovery codes na conta GitHub
