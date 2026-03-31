# API HTTP atual

## Auth

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `POST /auth/forgot-password`
- `POST /auth/forgot-password/confirm`
- `POST /auth/refresh-token`

## Usuario

- `GET /me`

## Contas

- `POST /accounts`
- `GET /entities/{entityId}/accounts`

## Categorias

- `GET /categories?entityId={entityId}`

## Contatos

- `POST /entities/{entityId}/contacts`
- `GET /entities/{entityId}/contacts`
- `PATCH /entities/{entityId}/contacts/{contactId}`
- `DELETE /entities/{entityId}/contacts/{contactId}`

## Transacoes

- `POST /transactions`
- `GET /transactions`
- `PATCH /transactions/{transactionId}`
- `DELETE /entities/{entityId}/transactions/{transactionId}`

Observacoes:

- `GET /transactions` aceita filtros por `entityId`, `type`, `isPaid`, `accountId`, `categoryId`, faixas de `date` e `dueDate`, alem de ordenacao por `date`, `dueDate`, `createdAt`, `value` e `name`.

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
