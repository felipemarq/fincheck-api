# Migracoes de banco

## Baseline da V2

A pasta `drizzle/` passa a ser a fonte versionada das migracoes do Fincheck V2.
A migracao `0000_purchase_orders_v2_foundation.sql` representa uma baseline
completa para um banco novo e inclui tanto as estruturas legadas preservadas
temporariamente quanto as tabelas de clientes e ordens de compra.

## Regra de seguranca

Nao execute a migracao `0000` diretamente sobre o banco legado existente. Como
as tabelas antigas foram criadas antes da adocao de migracoes, a baseline
tentaria cria-las novamente.

Para um ambiente novo:

1. Configure `DATABASE_URL` para um banco vazio dedicado a V2.
2. Execute `pnpm db:migrate`.
3. Valide a criacao das tabelas antes do deploy da API.

Para aproveitar um banco legado:

1. Crie e valide um backup.
2. Registre a baseline como ja aplicada no historico de migracoes.
3. Gere uma migracao incremental contendo somente as estruturas V2.
4. Revise o SQL antes de executar.

Nenhuma migracao deve ser aplicada em producao automaticamente a partir de uma
maquina de desenvolvimento.

## Comandos

- `pnpm db:generate -- --name nome_da_migracao`
- `pnpm db:migrate`

Toda alteracao futura em `schema.ts` deve vir acompanhada de uma nova migracao.
