# Estado atual da API

## O que esta solido

- Estrutura por camadas consistente.
- `typecheck` e `lint` habilitados no repositorio.
- Fluxos principais de auth, contas, transacoes, recorrencias, dashboard, contatos e resumo financeiro ja existem.
- O modelo de dados foi desenhado pensando em expansao do produto.

## O que o frontend usa hoje

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `POST /auth/refresh-token`
- `POST /auth/forgot-password`
- `POST /auth/forgot-password/confirm`
- `GET /me`
- `POST /entities`
- `PATCH /entities/{entityId}`
- `POST /accounts`
- `GET /entities/{entityId}/accounts`
- `GET /categories`
- `GET/POST/PATCH` de cartoes
- `GET/POST/PATCH/DELETE` de contatos
- `GET/POST/PATCH/DELETE` de transacoes
- `GET/POST/PATCH/DELETE` de recorrencias
- `PUT` de impostos mensais
- `GET /dashboard`, incluindo a secao `settlements` para contas a pagar/receber

## O que ja existe mas ainda nao virou produto completo

- Visoes e filtros mais ricos de contas a pagar/receber
- Parcelamento
- Idempotencia
- Auditoria
- Investimentos e relatorios

## Correcoes estruturais aplicadas na base

- Ajuste do fluxo de signup para registrar compensacoes no momento correto.
- Correcao do `package.json`, `.env.example` e baseline de lint.
- Limpeza da documentacao herdada do scaffold.
- Alinhamento dos contratos usados pelo Web.

## Proximo passo recomendado

1. Consolidar relatorios e filtros mais ricos no dominio financeiro.
2. Expor os modulos ainda modelados no banco, como investimentos e parcelamento.
3. Adicionar testes de contrato e cobertura minima de use cases criticos.
