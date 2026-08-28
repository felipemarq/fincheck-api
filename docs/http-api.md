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

A listagem aceita `search` e `active`. O catalogo guarda codigo opcional, nome,
marca, especificacao, embalagem, unidade normalizada e referencias opcionais de
preco. Quando informado, `code` e unico por organizacao e pode representar o
codigo ERP ou SKU. Ordens atualizam a ultima venda e aquisicoes atualizam a
ultima compra. Produtos com historico devem ser inativados.

## Cotacoes

- `POST /entities/{entityId}/quotations`
- `GET /entities/{entityId}/quotations`
- `GET /entities/{entityId}/quotations/{quotationId}`
- `PUT /entities/{entityId}/quotations/{quotationId}`
- `DELETE /entities/{entityId}/quotations/{quotationId}`
- `POST /entities/{entityId}/quotations/{quotationId}/items/{quotationItemId}/images`
- `DELETE /entities/{entityId}/quotations/{quotationId}/images/{imageId}`

A criacao recebe cliente, numero, datas, dados da empresa emitente, condicoes,
frete, desconto e itens com `productId`, quantidade e valor unitario. O servidor
valida cliente e produtos ativos, calcula os totais e preserva snapshots do
cliente, da empresa e do catalogo. O numero e unico por organizacao.

Os estados sao `DRAFT`, `SENT`, `APPROVED`, `REJECTED`, `CANCELLED` e
`EXPIRED`. A listagem aceita `search`, `customerId` e `status`.

Cada item aceita ate tres imagens JPEG, PNG ou WEBP de no maximo 3 MB. O upload
recebe `fileName`, `contentType` e `dataBase64`. Os objetos ficam em bucket S3
privado e o detalhe retorna URLs assinadas por 15 minutos. PDFs sao gerados no
Web e nao sao persistidos pela API.

## Ordens de compra

- `POST /entities/{entityId}/purchase-orders`
- `GET /entities/{entityId}/purchase-orders`
- `GET /entities/{entityId}/purchase-orders/{purchaseOrderId}`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}`
- `GET /entities/{entityId}/purchase-order-items`

Criacao e edicao persistem cabecalho e itens na mesma transacao. Cada item
referencia um produto e preserva seu snapshot. A listagem aceita `search`,
`customerId`, `lifecycleStatus`, `progress`, `operationalStatus`, `issuedFrom`
e `issuedTo`. As duas datas de emissao usam `YYYY-MM-DD`, devem ser informadas
em conjunto e sao inclusivas. O filtro de progresso usa a etapa geral calculada
depois das quantidades de compra, recebimento e entrega. `operationalStatus`
reproduz os indicadores do painel e aceita `PENDING_PURCHASE`,
`AWAITING_RECEIPT`, `READY_FOR_DELIVERY`, `IN_DELIVERY` e `DELAYED`.

O detalhe retorna o total oficial, a soma calculada, divergencia, custos,
quantidades e progresso. Os itens deixam de ser substituiveis depois da
primeira aquisicao.

A fila de itens retorna somente linhas de ordens ativas e aceita `purchaseOrderItemId`,
`search`, `customerId`, `status`, `deadline`, `sort`, `page` e `pageSize`. Os estados de
compras e recebimento sao `PENDING_PURCHASE`, `PARTIALLY_PURCHASED`,
`PURCHASED`, `PARTIALLY_RECEIVED` e `RECEIVED`. A resposta inclui contadores
gerais e paginacao, sem exigir que o cliente carregue todas as ordens.

## Aquisicoes

- `POST /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions`
- `GET /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions/{acquisitionId}`
- `POST /entities/{entityId}/supplier-purchases`
- `GET /entities/{entityId}/supplier-purchases`
- `PATCH /entities/{entityId}/supplier-purchases/{acquisitionId}`

As rotas aninhadas preservam o fluxo rapido dentro de uma ordem. As rotas
`supplier-purchases` registram o pedido real do fornecedor e aceitam linhas com
`productId` e `allocations[]`. Cada alocacao informa `purchaseOrderItemId` e
`allocatedQuantity`, permitindo que um carrinho atenda varias ordens. Frete,
despesas, desconto, forma de pagamento e parcelas sao gravados uma unica vez.

O retorno inclui os produtos comprados, destinos com ordem e cliente, custos
rateados por destino e quantidades ainda sem alocacao. A listagem global aceita
`search` e `status`.

Os estados manuais sao `PLACED`, `IN_TRANSIT` e `CANCELLED`.
`PARTIALLY_RECEIVED` e `RECEIVED` sao derivados pelas chegadas. A
forma de pagamento aceita `PIX`, `CREDIT_CARD`, `DEBIT_CARD`, `BOLETO`,
`BANK_TRANSFER`, `CASH` e `OTHER`. Credito exige `creditCardId`,
`installmentCount` e `firstPaymentDueAt`; boleto exige o vencimento.

O `PATCH` e parcial e deve receber somente os campos alterados. Dados
descritivos, como fornecedor, canal, comprador e observacoes, podem ser
corrigidos mesmo depois de um recebimento ou do pagamento de uma parcela.
Depois do primeiro recebimento, itens e situacao ficam bloqueados. Se uma
parcela de cartao ou boleto ja foi paga, valores, configuracao de pagamento e
itens tambem ficam bloqueados para preservar o historico financeiro. Pedidos
cancelados sao imutaveis.

## Cartoes e contas a pagar

- `POST /entities/{entityId}/credit-cards`
- `GET /entities/{entityId}/credit-cards`
- `PATCH /entities/{entityId}/credit-cards/{creditCardId}`
- `GET /entities/{entityId}/payables`
- `PATCH /entities/{entityId}/payables/{payableId}`
- `POST /entities/{entityId}/payables/card-statements/settle`

Cartoes guardam nome, titular, banco, bandeira, quatro ultimos digitos, cor,
fechamento, vencimento, limite opcional e situacao. Numero completo e CVV nunca
fazem parte do contrato.

A aquisicao gera as contas automaticamente. Credito cria de 1 a 36 parcelas
mensais abertas; boleto cria uma conta aberta; meios imediatos criam um registro
pago no ato. A listagem aceita `status`, `creditCardId`, `search`, `dueFrom` e
`dueTo`, retorna indicadores e permite marcar uma conta como paga ou reabri-la.
O fechamento mensal recebe `creditCardId`, `year`, `month` e `paidAt` opcional.
Ele marca como pagas somente as parcelas abertas daquele cartao cujo vencimento
pertence ao mes informado; parcelas pagas, canceladas ou de outros meses nao
sao alteradas.

## Recebimentos de mercadoria

- `POST /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions/{acquisitionId}/receipts`
- `GET /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions/{acquisitionId}/receipts`
- `PATCH /entities/{entityId}/purchase-orders/{purchaseOrderId}/acquisitions/{acquisitionId}/receipts/{receiptId}`

Uma aquisicao aceita varias chegadas parciais. A soma recebida por destino nao
pode superar a quantidade alocada para a ordem. Uma alteracao nao pode invalidar mercadoria ja separada
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
alem de atrasos, custos, saldos e margens. `issuedFrom` e `issuedTo` filtram as
ordens pela data de emissao, com inicio e fim inclusivos no formato
`YYYY-MM-DD`. Sem esses parametros, o endpoint preserva a visao geral de todas
as ordens ativas.

## Acompanhamento pessoal de saude

- `GET /me/body-weights`
- `PUT /me/body-weights/{measuredOn}`
- `DELETE /me/body-weights/{measuredOn}`
- `GET /me/health-profile`
- `PUT /me/health-profile`
- `GET /me/daily-calories`
- `PUT /me/daily-calories/{loggedOn}`
- `DELETE /me/daily-calories/{loggedOn}`

Todas as rotas exigem Cognito e a feature `BODY_WEIGHT` vinculada ao usuario.
Elas nao recebem `entityId` nem `userId`: o proprietario e sempre derivado do
token. As listagens aceitam `from` e `to` no formato `YYYY-MM-DD`; cada `PUT`
diario cria ou atualiza o registro daquela data. Pesos aceitam ate tres casas
decimais entre 20 e 500 kg. Calorias sao inteiras entre 0 e 20.000 kcal.

O perfil guarda meta de peso e data-alvo opcionais. Altura, nascimento,
coeficiente sexual da equacao e nivel de atividade alimentam a estimativa de
energia. O gasto em repouso usa Mifflin-St Jeor e o gasto diario multiplica essa
base por um fator representativo do nivel de atividade: `1.55` para
sedentario/leve, `1.75` para ativo/moderado e `2.20` para intenso/vigoroso. Um
gasto diario manual opcional substitui a estimativa nos balancos.

Cada caloria listada retorna o gasto calculado com a ultima pesagem disponivel
naquela data e `balanceKcal`. Valor positivo representa deficit estimado;
valor negativo representa superavit. Dias sem calorias nao sao criados nem
tratados como consumo zero, e o resumo informa quantos dias possuem calculo.
As equacoes sao estimativas para adultos, nao prescricoes clinicas. Referencias:
[Mifflin-St Jeor](https://pubmed.ncbi.nlm.nih.gov/2305711/) e
[FAO/WHO/UNU sobre PAL](https://www.fao.org/4/y5686e/y5686e07.htm).

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

Os endpoints financeiros genericos da versao anterior continuam fora do
`serverless.yml`; somente o financeiro vinculado a operacao atual e publicado.
