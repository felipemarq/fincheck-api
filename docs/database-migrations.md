# Migracoes de banco

## Baseline da V2

A pasta `drizzle/` passa a ser a fonte versionada das migracoes do Fincheck V2.
A migracao `0000_purchase_orders_v2_foundation.sql` representa uma baseline
completa para um banco novo e inclui as estruturas historicas existentes naquele
momento e as tabelas de clientes e ordens de compra.

`0001_acquisitions.sql` e a primeira migracao incremental da V2. Ela cria as
tabelas de aquisicoes e itens adquiridos, seus indices, relacionamentos e o enum
de situacao operacional.

`0002_operations-cycle.sql` adiciona recebimentos, entregas, notas fiscais e
pagamentos. `0003_product-catalog.sql` cria o catalogo, converte os itens das
ordens existentes em produtos e somente depois torna `product_id` obrigatorio.

`0004_remove-legacy-finance.sql` encerra a transicao: remove contas, categorias,
contatos, cartoes, compras parceladas, parcelas, transacoes, recorrencias,
impostos, idempotencia e auditoria da versao anterior, alem dos tres enums que
eram usados somente por essas tabelas.

`0005_product-code.sql` adiciona o codigo ERP/SKU opcional ao catalogo e garante
que um codigo preenchido nao se repita dentro da mesma organizacao.

`0006_operational-payables.sql` cria os cartoes operacionais e as contas a pagar,
adiciona o enum de situacao das parcelas e vincula cartao, quantidade de
parcelas e primeiro vencimento as aquisicoes. Nenhuma credencial de pagamento e
armazenada.

`0007_supplier-purchase-allocations.sql` transforma a aquisicao em pedido ao
fornecedor. Ela torna a ordem de origem opcional, vincula cada linha ao produto
e cria `acquisition_item_allocations` para distribuir quantidades entre ordens.
A migracao converte automaticamente cada vinculo antigo em uma destinacao
equivalente antes de remover a coluna anterior e amplia a unicidade dos itens
de recebimento para considerar tambem a ordem de destino.

`0008_quotations.sql` cria `quotations`, `quotation_items` e
`quotation_item_images`, alem do enum `quotation_status`. Os itens preservam
snapshots comerciais e as imagens guardam somente metadados e a chave do
objeto privado no S3.

`0009_personal-weight-tracking.sql` cria as features pessoais por usuario e o
historico diario de peso. A migracao e aditiva e nao altera tabelas
operacionais. A chave unica `(user_id, measured_on)` garante uma pesagem por
dia para cada usuario.

## Regra de seguranca

Nao execute a migracao `0000` diretamente sobre o banco legado existente. Como
as tabelas antigas foram criadas antes da adocao de migracoes, a baseline
tentaria cria-las novamente.

Para um ambiente novo:

1. Configure `DATABASE_URL` para um banco vazio dedicado a V2.
2. Execute `pnpm db:migrate`.
3. Valide a criacao das tabelas antes do deploy da API.

Para aproveitar um banco legado:

1. Crie e valide um backup.
2. Registre a baseline como ja aplicada no historico de migracoes.
3. Gere uma migracao incremental contendo somente as estruturas V2.
4. Revise o SQL antes de executar.

Nenhuma migracao deve ser aplicada em producao automaticamente a partir de uma
maquina de desenvolvimento.

Antes da aplicacao da `0004`, todas as tabelas removidas foram verificadas como
vazias e sem chaves estrangeiras vindas das tabelas do MVP. A execucao ocorreu
em uma unica transacao para garantir rollback integral em caso de falha.

O banco de desenvolvimento existente nao possuia o journal do Drizzle porque a
baseline havia sido aplicada antes da adocao do migrador. Depois da `0004`, o
journal `drizzle.__drizzle_migrations` foi inicializado com essa versao como a
ultima aplicada. O comando `pnpm db:migrate` foi executado em seguida e validou
o estado sem reaplicar as migracoes anteriores.

Para publicar o catalogo, a ordem obrigatoria e:

1. Fazer backup e aplicar `0003_product-catalog.sql`.
2. Validar que nenhum `purchase_order_items.product_id` ficou nulo.
3. Publicar a API com os endpoints de produtos.
4. Publicar o Web com a selecao obrigatoria do catalogo.

Para publicar o financeiro operacional, aplique a `0006` antes do deploy das
funcoes `creditCards`, `payables` e das aquisicoes atualizadas.

Para publicar pedidos agrupados, aplique a `0007` antes das novas funcoes
`supplierPurchases`. O SQL deve concluir o backfill de `product_id` e das
destinacoes antes de tornar o produto obrigatorio.

Para publicar cotacoes:

1. Fazer backup e aplicar `0008_quotations.sql`.
2. Executar o deploy Serverless para criar o bucket privado e as funcoes.
3. Validar criacao, detalhe e upload de uma imagem na API.
4. Publicar o Web com as rotas `/quotations`.

O bucket possui politica de retencao no CloudFormation. Remover a stack nao
apaga automaticamente as imagens comerciais.

Para publicar o acompanhamento pessoal de peso:

1. Aplicar `0009_personal-weight-tracking.sql` antes da API.
2. Habilitar a feature somente para a conta autorizada com
   `pnpm feature:grant -- usuario@exemplo.com BODY_WEIGHT`.
3. Publicar a API e validar que `/me` retorna `BODY_WEIGHT` em `features`.
4. Publicar o Web com a rota privada `/me/peso`.

## Comandos

- `pnpm exec drizzle-kit generate --name nome_da_migracao`
- `pnpm db:migrate`

Toda alteracao futura em `schema.ts` deve vir acompanhada de uma nova migracao.
