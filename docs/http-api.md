# API HTTP atual

## Auth

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `POST /auth/forgot-password`
- `POST /auth/forgot-password/confirm`
- `POST /auth/refresh-token`

## Usuário

- `GET /me`

## Contas

- `POST /accounts`
- `GET /entities/{entityId}/accounts`

## Categorias

- `GET /categories?entityId={entityId}`

## Transações

- `POST /transactions`
- `GET /transactions`
- `PATCH /transactions/{transactionId}`
- `DELETE /entities/{entityId}/transactions/{transactionId}`

## Recorrências

- `POST /recurring-transactions`
- `GET /recurring-transactions`
- `PATCH /recurring-transactions/{recurringTransactionId}`
- `DELETE /entities/{entityId}/recurring-transactions/{recurringTransactionId}`

## Dashboard

- `GET /dashboard`

## Outros módulos já expostos

- `POST /credit-cards`
- `GET /credit-cards`
- `PATCH /credit-cards/{creditCardId}`
- `POST /taxes`
