# Fincheck API

Backend serverless do Fincheck. A aplicação expõe a API HTTP usada pelo Web, autentica usuários com Cognito e persiste os dados financeiros no Neon/Postgres via Drizzle.

## Stack

- Node.js 22
- TypeScript
- Serverless Framework
- AWS Lambda + API Gateway HTTP API
- AWS Cognito
- Neon Postgres
- Drizzle ORM

## Módulos disponíveis hoje

- Autenticação: cadastro, login, refresh token e recuperação de senha
- Usuário atual: `/me`
- Contas
- Categorias
- Transações
- Transações recorrentes com materialização automática
- Dashboard consolidado
- Cartões de crédito
- Impostos mensais

## Estrutura principal

- `src/application`: entidades, controllers, queries, services e use cases
- `src/infra`: banco, gateways, clientes AWS e templates de e-mail
- `src/main`: adapters e handlers das lambdas
- `src/shared`: configuração, saga e tipos compartilhados
- `sls/`: definição das funções e recursos do Serverless
- `docs/`: documentação do estado atual da API

## Variáveis de ambiente locais

Use o arquivo `.env.example` como base:

- `DATABASE_URL`
- `RECURRENCE_HORIZON_DAYS`
- `DISABLE_DEFAULT_APIGW_ENDPOINT`

Os identificadores e segredos do Cognito são resolvidos pelo `serverless.yml` em tempo de deploy.

## Scripts

- `pnpm typecheck`
- `pnpm lint`
- `pnpm dev:email`

## Documentação

- [Arquitetura](./docs/architecture.md)
- [Estado atual](./docs/current-state.md)
- [API HTTP](./docs/http-api.md)
