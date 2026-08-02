# Estado atual da API

## Escopo ativo

A branch `codex/purchase-orders-v2` concentra o runtime no fluxo operacional
de ordens de compra. Os modulos ativos sao:

- autenticacao e usuario atual
- organizacoes PF/PJ
- clientes
- produtos
- ordens e itens
- aquisicoes e recebimentos de mercadoria
- entregas
- notas fiscais e pagamentos
- painel operacional

As rotas e implementacoes da antiga gestao financeira generica foram retiradas.
Isso inclui contas, categorias, contatos, cartoes, transacoes, recorrencias,
impostos mensais e o dashboard antigo.

## Fluxo implementado

1. o usuario entra e seleciona uma organizacao
2. cadastra o cliente comprador
3. cadastra produtos ou usa o cadastro rapido dentro da ordem
4. cria a ordem e informa quantidades e precos de venda
5. registra uma ou mais aquisicoes para cada item
6. registra chegadas totais ou parciais
7. registra lotes de entrega
8. registra notas fiscais sobre itens entregues
9. registra pagamentos totais ou parciais
10. acompanha pendencias, custos, saldo e margem no painel

## Regras relevantes

- todos os dados operacionais sao isolados por organizacao
- produtos com historico sao inativados, nao excluidos
- os itens preservam snapshots do produto usado na ordem
- itens nao podem ser substituidos depois da primeira aquisicao
- aquisicoes, recebimentos, entregas e pagamentos aceitam parcialidade
- cancelamentos preservam o historico
- o total oficial da ordem fica separado da soma calculada dos itens
- frete de entrega e opcional
- destinatario e rastreio nao fazem parte do MVP
- pagamentos nao podem superar o saldo da nota
- custos e margens sao derivados dos eventos operacionais

## Banco de dados

O schema atual possui 15 tabelas e 7 enums, todos pertencentes ao MVP. A
migracao `0004_remove-legacy-finance.sql` removeu 11 tabelas e 3 enums da
versao financeira anterior depois da confirmacao de que estavam vazios e sem
dependencias vindas das tabelas operacionais.

O banco configurado para desenvolvimento foi atualizado em uma unica transacao
e conferido depois da aplicacao. O journal `drizzle.__drizzle_migrations` foi
inicializado na `0004`, permitindo que as proximas migracoes usem
`pnpm db:migrate` normalmente sem tentar recriar a baseline.

A migracao `0003_product-catalog.sql` deve ser aplicada antes do deploy do
catalogo e dos itens com `productId` obrigatorio.

## Qualidade atual

- validacao HTTP com Zod
- injecao de dependencias com `reflect-metadata`
- testes de schemas e regras operacionais
- typecheck e lint configurados
- migracoes Drizzle verificaveis
- configuracao Serverless imprimivel antes do deploy

## Fora do MVP

- anexos e armazenamento de PDFs
- OCR e importacao automatica de ordens
- estoque excedente reutilizavel entre ordens
- conciliacao bancaria
- fluxo de caixa generico
- relatorios avancados e exportacao

O proximo passo recomendado e validar o ciclo completo com cotacoes e ordens
reais antes de iniciar qualquer funcionalidade pos-MVP.
