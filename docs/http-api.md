# API HTTP atual

## Auth

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `POST /auth/forgot-password`
- `POST /auth/forgot-password/confirm`
- `POST /auth/refresh-token`

## Usuario

- `GET /me`

## Entidades

- `POST /entities`
- `PATCH /entities/{entityId}`

## Contas

- `POST /accounts`
- `GET /entities/{entityId}/accounts`
- `PATCH /entities/{entityId}/accounts/{accountId}`
- `DELETE /entities/{entityId}/accounts/{accountId}`

Observacoes:

- A exclusao de contas e protegida: a API bloqueia a remocao quando a conta ainda estiver vinculada a transacoes, recorrencias, compras parceladas ou cartoes.

## Categorias

- `GET /categories?entityId={entityId}`

## Contatos

- `POST /entities/{entityId}/contacts`
- `GET /entities/{entityId}/contacts`
- `PATCH /entities/{entityId}/contacts/{contactId}`
- `DELETE /entities/{entityId}/contacts/{contactId}`

## Clientes V2

- `POST /entities/{entityId}/customers`
- `GET /entities/{entityId}/customers`
- `PATCH /entities/{entityId}/customers/{customerId}`

Observacoes:

- O documento e unico por cliente dentro da organizacao.
- A listagem aceita `search` e `active`.
- Clientes inativos permanecem no historico, mas nao recebem novas ordens.

## Ordens de compra V2

- `POST /entities/{entityId}/purchase-orders`
- `GET /entities/{entityId}/purchase-orders`
- `GET /entities/{entityId}/purchase-orders/{purchaseOrderId}`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}`

Observacoes:

- Criacao e edicao persistem o cabecalho e os itens em uma unica transacao.
- A listagem aceita `search`, `customerId` e `lifecycleStatus`.
- O detalhe informa o valor oficial, a soma dos itens e se ha divergencia.
- O progresso inicial e `PENDING_PURCHASE`; aquisicoes entram na proxima etapa.

## Transacoes

- `POST /transactions`
- `GET /transactions`
- `PATCH /transactions/{transactionId}`
- `DELETE /entities/{entityId}/transactions/{transactionId}`

Observacoes:

- `GET /transactions` aceita filtros por `entityId`, `type`, `isPaid`, `accountId`, `categoryId`, `contactId`, faixas de `date` e `dueDate`, alem de ordenacao por `date`, `dueDate`, `createdAt`, `value` e `name`.
- A listagem de transacoes tambem devolve as referencias resolvidas de conta, categoria e contato para apoiar telas operacionais no Web.

## Recorrencias

- `POST /recurring-transactions`
- `GET /recurring-transactions`
- `PATCH /recurring-transactions/{recurringTransactionId}`
- `DELETE /entities/{entityId}/recurring-transactions/{recurringTransactionId}`

## Dashboard

- `GET /dashboard`

Observacoes:

- A secao `settlements` do dashboard resume contas a pagar e contas a receber em aberto, vencidas, para hoje e para os proximos dias.

## Outros modulos expostos

- `POST /credit-cards`
- `GET /credit-cards`
- `PATCH /credit-cards/{creditCardId}`
- `PUT /entities/{entityId}/tax-rates/{year}/{month}`
