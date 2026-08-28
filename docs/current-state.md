# Estado atual da API

## Escopo ativo

A branch `codex/purchase-orders-v2` concentra o runtime no fluxo operacional
de ordens de compra. Os modulos ativos sao:

- autenticacao e usuario atual
- organizacoes PF/PJ
- clientes
- produtos com codigo ERP/SKU opcional e unico por organizacao
- cotacoes comerciais com itens, snapshots e imagens opcionais
- ordens e itens
- fila paginada de itens operacionais por compra e recebimento
- pedidos a fornecedores simples ou agrupados e recebimentos por destinacao
- cartoes de credito identificados de forma segura
- parcelas e contas a pagar geradas pelas aquisicoes
- entregas
- notas fiscais e pagamentos
- painel operacional
- acompanhamento pessoal de peso habilitado individualmente por usuario

As rotas e implementacoes da antiga gestao financeira generica foram retiradas.
Contas, categorias, contatos, transacoes, recorrencias, impostos mensais e o
dashboard antigo continuam fora do runtime. Cartoes e contas a pagar retornaram
como modulos novos e estritamente vinculados ao fluxo operacional de compras.

## Fluxo implementado

1. o usuario entra e seleciona uma organizacao
2. cadastra o cliente comprador
3. cadastra produtos ou usa o cadastro rapido dentro da cotacao ou da ordem
4. prepara a cotacao com precos, condicoes e imagens opcionais e exporta o PDF
5. quando a venda e confirmada, cadastra manualmente a ordem de compra
6. cria a ordem e informa quantidades e precos de venda
7. registra uma compra rapida para uma ordem ou um pedido do fornecedor com
   produtos destinados a varias ordens
8. informa forma de pagamento, cartao, parcelas e vencimentos da aquisicao
9. acompanha as contas a pagar e pode quitar uma fatura mensal inteira por cartao
10. registra chegadas totais ou parciais
11. registra lotes de entrega
12. registra notas fiscais sobre itens entregues
13. registra recebimentos totais ou parciais
14. acompanha pendencias, custos, saldos e margem no painel, com periodo
    opcional pela data de emissao das ordens
15. pesquisa e opera itens de todas as ordens ativas em uma fila unificada

## Regras relevantes

- todos os dados operacionais sao isolados por organizacao
- numeros de cotacao sao unicos por organizacao
- cotacoes podem ser revisadas ou excluidas antes da conversao futura em ordem
- cotacoes preservam snapshots de cliente, empresa e produto
- totais de cotacao sao calculados no servidor em centavos
- cada item de cotacao aceita ate tres imagens privadas de 3 MB
- produtos com historico sao inativados, nao excluidos
- os itens preservam snapshots do produto usado na ordem
- itens nao podem ser substituidos depois da primeira aquisicao
- aquisicoes, recebimentos, entregas e pagamentos aceitam parcialidade
- cancelamentos preservam o historico
- o total oficial da ordem fica separado da soma calculada dos itens
- frete de entrega e opcional
- destinatario e rastreio nao fazem parte do MVP
- pagamentos nao podem superar o saldo da nota
- compras no credito exigem um cartao ativo, parcelas e primeiro vencimento
- boleto exige vencimento; PIX, debito, transferencia e dinheiro sao pagos no ato
- parcelas usam centavos inteiros e preservam exatamente o custo da aquisicao
- a edicao de um pedido ao fornecedor e parcial: correcoes descritivas nao
  recriam parcelas; recebimentos bloqueiam itens e situacao; parcelas pagas de
  cartao ou boleto bloqueiam valores, pagamento e itens
- faturas de cartao sao agrupadas pelo mes de vencimento e a quitacao mensal
  altera somente parcelas abertas do cartao selecionado
- frete, desconto e despesas de pedidos compartilhados sao rateados sem perda
  de centavos entre as destinacoes
- quantidades nao destinadas ficam fora dos custos e quantidades das ordens
- cartoes nunca armazenam numero completo ou codigo de seguranca
- a margem projetada usa todo o valor contratado e os custos conhecidos
- a margem com custo conhecido considera apenas o valor de venda proporcional
  as quantidades que ja possuem compra registrada
- a fila de itens considera apenas aquisicoes nao canceladas e recebimentos
  confirmados

## Banco de dados

O schema atual possui 23 tabelas e 9 enums. As tabelas operacionais pertencem
ao MVP da empresa e as duas tabelas pessoais ficam isoladas por usuario. A
migracao `0004_remove-legacy-finance.sql` removeu 11 tabelas e 3 enums da
versao financeira anterior depois da confirmacao de que estavam vazios e sem
dependencias vindas das tabelas operacionais.

O banco configurado para desenvolvimento foi atualizado em uma unica transacao
e conferido depois da aplicacao. O journal `drizzle.__drizzle_migrations` foi
inicializado na `0004`, permitindo que as proximas migracoes usem
`pnpm db:migrate` normalmente sem tentar recriar a baseline.

A migracao `0003_product-catalog.sql` deve ser aplicada antes do deploy do
catalogo e dos itens com `productId` obrigatorio.

`0005_product-code.sql` adiciona o codigo ERP/SKU opcional. A migracao
`0006_operational-payables.sql` cria `credit_cards`, `payables` e o vinculo de
parcelamento nas aquisicoes.

`0007_supplier-purchase-allocations.sql` cria as destinacoes entre produtos
comprados e itens de ordem, preservando automaticamente os registros antigos.

`0008_quotations.sql` cria cotacoes, itens, imagens e o enum de situacao. Os
arquivos ficam em bucket S3 privado; o banco guarda somente metadados e chaves.

`0009_personal-weight-tracking.sql` cria as permissoes de features pessoais e
o historico de pesagens diarias sem depender da organizacao ativa.

## Qualidade atual

- validacao HTTP com Zod
- injecao de dependencias com `reflect-metadata`
- testes de schemas e regras operacionais
- typecheck e lint configurados
- migracoes Drizzle verificaveis
- configuracao Serverless imprimivel antes do deploy
- imagens de cotacao em bucket privado com URL assinada temporaria
- exclusao de item ou cotacao tambem remove suas imagens privadas do bucket
- funcoes com 256 MB por padrao e 512 MB nos fluxos de ordens, aquisicoes,
  recebimentos, entregas, notas fiscais e dashboard

## Fora do MVP

- anexos de ordens, compras, entregas e notas fiscais
- armazenamento do arquivo PDF gerado
- OCR e importacao automatica de ordens
- estoque excedente reutilizavel entre ordens
- conciliacao bancaria
- fluxo de caixa generico
- relatorios avancados e exportacoes consolidadas

O proximo passo recomendado e validar o ciclo completo com cotacoes e ordens
reais antes de iniciar qualquer funcionalidade pos-MVP.
