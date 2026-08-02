# API HTTP atual

Todas as rotas privadas exigem `Authorization: Bearer <token>`. As rotas
operacionais tambem recebem o `entityId` no caminho para isolar a organizacao.

## Auth

- `POST /auth/sign-up`
- `POST /auth/sign-in`
- `POST /auth/forgot-password`
- `POST /auth/forgot-password/confirm`
- `POST /auth/refresh-token`

## Usuario e organizacoes

- `GET /me`
- `POST /entities`
- `PATCH /entities/{entityId}`

Uma organizacao pode representar uma operacao PF ou PJ. A resposta de `/me`
inclui as organizacoes do usuario.

## Clientes

- `POST /entities/{entityId}/customers`
- `GET /entities/{entityId}/customers`
- `PATCH /entities/{entityId}/customers/{customerId}`

A listagem aceita `search` e `active`. O documento e unico por organizacao.
Clientes inativos permanecem no historico e nao recebem novas ordens.

## Produtos

- `POST /entities/{entityId}/products`
- `GET /entities/{entityId}/products`
- `PATCH /entities/{entityId}/products/{productId}`
- `DELETE /entities/{entityId}/products/{productId}`

A listagem aceita `search` e `active`. O catalogo guarda nome, marca,
especificacao, embalagem, unidade normalizada e referencias opcionais de
preco. Ordens atualizam a ultima venda e aquisicoes atualizam a ultima compra.
Produtos com historico devem ser inativados.

## Ordens de compra

- `POST /entities/{entityId}/purchase-orders`
- `GET /entities/{entityId}/purchase-orders`
- `GET /entities/{entityId}/purchase-orders/{purchaseOrderId}`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}`

Criacao e edicao persistem cabecalho e itens na mesma transacao. Cada item
referencia um produto e preserva seu snapshot. A listagem aceita `search`,
`customerId` e `lifecycleStatus`.

O detalhe retorna o total oficial, a soma calculada, divergencia, custos,
quantidades e progresso. Os itens deixam de ser substituiveis depois da
primeira aquisicao.

## Aquisicoes

- `POST /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions`
- `GET /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions/{acquisitionId}`

Uma aquisicao pertence a uma ordem e pode atender varios itens. Um item pode
ser atendido por varias aquisicoes. Quantidade excedente e informativa.

Os estados manuais sao `PLACED`, `IN_TRANSIT` e `CANCELLED`.
`PARTIALLY_RECEIVED` e `RECEIVED` sao derivados pelas chegadas. A
identificacao de cartao aceita somente os quatro ultimos digitos.

## Recebimentos de mercadoria

- `POST /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions/{acquisitionId}/receipts`
- `GET /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions/{acquisitionId}/receipts`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions/{acquisitionId}/receipts/{receiptId}`

Uma aquisicao aceita varias chegadas parciais. A soma recebida nao pode superar
a quantidade comprada. Uma alteracao nao pode invalidar mercadoria ja separada
para entrega.

## Entregas

- `POST /entities/{entityId}/purchase-orders/{purchaseOrderId}/deliveries`
- `GET /entities/{entityId}/purchase-orders/{purchaseOrderId}/deliveries`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}/deliveries/{deliveryId}`

Uma ordem aceita varios lotes parciais. Somente mercadoria recebida e contratada
pode ser separada. Os estados sao `PREPARING`, `DISPATCHED`, `DELIVERED`
e `CANCELLED`. `freightCost` e opcional; destinatario e rastreio nao fazem
parte do contrato do MVP.

## Notas fiscais e pagamentos

- `POST /entities/{entityId}/purchase-orders/{purchaseOrderId}/invoices`
- `GET /entities/{entityId}/purchase-orders/{purchaseOrderId}/invoices`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}/invoices/{invoiceId}`
- `POST /entities/{entityId}/purchase-orders/{purchaseOrderId}/invoices/{invoiceId}/payments`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}/invoices/{invoiceId}/payments/{paymentId}`

Uma nota pode faturar varios itens entregues. Pagamentos parciais sao aceitos e
nao podem superar o saldo. Impostos afetam a margem, mas nao reduzem
automaticamente o titulo.

## Painel operacional

- `GET /entities/{entityId}/operations-dashboard`

O retorno resume filas de compra, chegada, entrega, faturamento e recebimento,
alem de atrasos, custos, saldos e margens.

## Formato de erro

Erros de validacao seguem o formato:

```json
{
  "error": {
    "code": "VALIDATION",
    "message": [
      {
        "field": "items.0.description",
        "message": "Campo invalido"
      }
    ]
  }
}
```

Os endpoints financeiros genericos da versao anterior nao sao publicados pelo
`serverless.yml` atual.
