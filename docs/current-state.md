# Estado atual da API

## O que está sólido

- Estrutura por camadas está consistente.
- `typecheck` e `lint` estão habilitados no repositório.
- Fluxos principais de auth, contas, transações, recorrências e dashboard já existem.
- O modelo de dados já foi desenhado pensando em expansão do produto.

## O que o frontend usa hoje

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `POST /auth/refresh-token`
- `GET /me`
- `POST /accounts`
- `GET /entities/{entityId}/accounts`
- `GET /categories`
- `GET/POST/PATCH` de cartões
- `GET/POST/PATCH/DELETE` de transações
- `GET/POST/PATCH/DELETE` de recorrências
- `GET /dashboard`

## O que já existe mas ainda não virou produto completo

- Cartões de crédito
- Impostos mensais
- Contatos
- Parcelamento
- Idempotência
- Auditoria

## Correções estruturais aplicadas neste pacote

- Ajuste do fluxo de signup para registrar compensações no momento correto.
- Correção do `package.json`, `.env.example` e baseline de lint.
- Limpeza da documentação herdada do scaffold.

## Próximo passo recomendado

Fechar a experiência do core financeiro antes de abrir novos módulos:

1. consolidar contas, transações e recorrências
2. estabilizar contratos com o Web
3. abrir cartões e impostos como próximos módulos visíveis
