# Estado atual da API

## O que esta solido

- Estrutura por camadas consistente.
- `typecheck` e `lint` habilitados no repositorio.
- Fluxos principais de auth, entidades, contas, transacoes, recorrencias, dashboard, contatos e resumo financeiro ja existem.
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
- `PATCH /entities/{entityId}/accounts/{accountId}`
- `DELETE /entities/{entityId}/accounts/{accountId}`
- `GET /categories`
- `GET/POST/PATCH` de cartoes
- `GET/POST/PATCH/DELETE` de contatos
- `GET/POST/PATCH/DELETE` de transacoes
- `GET/POST/PATCH/DELETE` de recorrencias
- `PUT` de impostos mensais
- `GET /dashboard`, incluindo a secao `settlements` para contas a pagar/receber

## O que ja existe mas ainda nao virou produto completo

- Relatorios
- Investimentos
- Parcelamento
- Idempotencia
- Auditoria

## Correcoes estruturais aplicadas na base

- Ajuste do fluxo de signup para registrar compensacoes no momento correto.
- Correcao do `package.json`, `.env.example` e baseline de lint.
- Limpeza da documentacao herdada do scaffold.
- Alinhamento dos contratos usados pelo Web.
- Gestao de contas expandida com edicao e exclusao protegida contra vinculos financeiros.

## Proximo passo recomendado

1. Consolidar relatorios e visoes gerenciais por entidade.
2. Expor os modulos ainda modelados no banco, como investimentos e parcelamento.
3. Adicionar testes de contrato e cobertura minima de use cases criticos.
