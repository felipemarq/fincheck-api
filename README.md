# Fincheck API

Backend serverless do Fincheck para gestao operacional de ordens de compra.
A API atende o Web, autentica usuarios com Cognito e persiste os dados no
Neon/Postgres via Drizzle.

A branch `codex/purchase-orders-v2` contem o MVP atual: receber uma ordem,
comprar os itens, registrar chegadas, entregar, faturar e acompanhar o
recebimento do cliente.

## Stack

- Node.js 22
- TypeScript
- Serverless Framework
- AWS Lambda e API Gateway HTTP API
- AWS Cognito
- Neon Postgres
- Drizzle ORM

## Modulos do MVP

- autenticacao, recuperacao de senha e renovacao de sessao
- organizacoes PF/PJ e usuario atual
- clientes
- catalogo de produtos e precos de referencia
- ordens de compra e seus itens
- aquisicoes vinculadas aos itens da ordem
- recebimentos totais e parciais de mercadoria
- entregas totais e parciais
- notas fiscais e pagamentos do cliente
- painel operacional com pendencias, custos e margens

Contas bancarias, categorias, transacoes genericas, recorrencias, cartoes,
contatos, impostos mensais e o dashboard financeiro da versao anterior nao
fazem parte do runtime nem do schema atual. A migracao
`0004_remove-legacy-finance.sql` remove as estruturas fisicas remanescentes.

## Estrutura principal

- `src/application`: entidades, controllers, queries, services e use cases
- `src/infra`: banco, gateways e templates de e-mail
- `src/main`: adapters e handlers das Lambdas
- `src/shared`: configuracao, saga e tipos compartilhados
- `sls/`: funcoes e recursos do Serverless
- `drizzle/`: migracoes versionadas
- `docs/`: regras de negocio e contratos atuais

## Ambiente

Use `.env.example` como base:

- `DATABASE_URL`
- `DISABLE_DEFAULT_APIGW_ENDPOINT` opcional

Os identificadores e segredos do Cognito sao resolvidos pelo
`serverless.yml` durante o deploy.

## Comandos

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm exec drizzle-kit check
pnpm exec serverless print
pnpm db:migrate
```

## Publicacao da V2

A migracao `0003_product-catalog.sql` deve ser aplicada antes de publicar a
API e o Web que exigem `productId` nos itens. Consulte o procedimento seguro
em [Migracoes de banco](./docs/database-migrations.md).

## Documentacao

- [Regras de negocio do MVP](./docs/business-rules-v2.md)
- [Migracoes de banco](./docs/database-migrations.md)
- [Arquitetura](./docs/architecture.md)
- [Estado atual](./docs/current-state.md)
- [API HTTP](./docs/http-api.md)
