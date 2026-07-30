# Fincheck API

Backend serverless do Fincheck. A API atende o Web, autentica usuarios com Cognito e persiste os dados financeiros no Neon/Postgres via Drizzle.

> A reformulacao do produto para gestao de ordens de compra esta em
> planejamento. As regras aprovadas estao documentadas, mas ainda nao foram
> implementadas.

## Stack

- Node.js 22
- TypeScript
- Serverless Framework
- AWS Lambda + API Gateway HTTP API
- AWS Cognito
- Neon Postgres
- Drizzle ORM

## Modulos disponiveis hoje

- Autenticacao: cadastro, login, refresh token e recuperacao de senha
- Entidades PF/PJ com criacao e edicao
- Usuario atual: `/me`
- Contas com criacao, edicao, listagem e exclusao protegida
- Categorias
- Transacoes
- Transacoes recorrentes com materializacao automatica
- Dashboard consolidado, incluindo resumo de contas a pagar e contas a receber
- Cartoes de credito
- Contatos
- Impostos mensais

## Estrutura principal

- `src/application`: entidades, controllers, queries, services e use cases
- `src/infra`: banco, gateways, clientes AWS e templates de e-mail
- `src/main`: adapters e handlers das lambdas
- `src/shared`: configuracao, saga e tipos compartilhados
- `sls/`: definicao das funcoes e recursos do Serverless
- `docs/`: documentacao do estado atual da API

## Variaveis de ambiente locais

Use o arquivo `.env.example` como base:

- `DATABASE_URL`
- `RECURRENCE_HORIZON_DAYS`
- `DISABLE_DEFAULT_APIGW_ENDPOINT`

Os identificadores e segredos do Cognito sao resolvidos pelo `serverless.yml` em tempo de deploy.

## Scripts

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm db:generate -- --name nome_da_migracao`
- `pnpm db:migrate`
- `pnpm dev:email`

## Documentacao

- [Regras de negocio v2 - Ordens de compra](./docs/business-rules-v2.md)
- [Migracoes de banco](./docs/database-migrations.md)
- [Arquitetura](./docs/architecture.md)
- [Estado atual](./docs/current-state.md)
- [API HTTP](./docs/http-api.md)
