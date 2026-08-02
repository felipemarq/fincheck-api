# Arquitetura da API

## Visao geral

O Fincheck API e um backend serverless organizado em camadas:

- `controller`: valida entrada e define a resposta HTTP
- `use case`: coordena regras de negocio e autorizacao
- `query`: monta leituras agregadas
- `repository`: persiste e consulta dados no Postgres
- `gateway`: integra servicos externos, como Cognito
- `adapter`: conecta API Gateway e Lambda aos controllers

## Fluxo HTTP

1. O API Gateway recebe a requisicao e valida o JWT nas rotas privadas.
2. O handler em `src/main/functions` carrega `reflect-metadata`.
3. O `lambdaHttpAdapter` resolve o controller pelo registro de dependencias.
4. O controller valida `body`, `params` e `query` com Zod.
5. O use case valida o acesso do usuario a organizacao e executa a regra.
6. O repository grava ou consulta o Neon dentro da transacao necessaria.
7. O adapter serializa a resposta ou o erro padronizado.

## Autenticacao e isolamento

- Cognito emite os tokens usados pelo API Gateway.
- `preTokenGenerationTrigger` injeta o `internalId` do usuario local.
- `OrganizationAccessService` valida que o usuario e dono da organizacao.
- Clientes, produtos, ordens e eventos operacionais carregam `entityId`.
- IDs relacionados sao validados dentro da mesma organizacao e ordem.

A entidade existente representa a organizacao operadora. Ela pode ser PF ou PJ
sem alterar o restante do fluxo.

## Dominio operacional

O agregado principal e a ordem de compra. Seus itens apontam para produtos do
catalogo e preservam snapshots dos dados comerciais usados na venda.

O ciclo e composto por eventos separados:

1. aquisicao registra onde, por quem e por quanto um item foi comprado
2. recebimento registra a chegada total ou parcial da mercadoria
3. entrega separa e conclui lotes enviados ao cliente
4. nota fiscal registra o faturamento dos itens entregues
5. pagamento registra o recebimento total ou parcial da nota

Totais, progresso, saldo e margens sao derivados desses eventos. Cancelamentos
preservam o historico e deixam de compor os calculos quando definido pelas
regras de dominio.

## Persistencia e migracoes

- O schema Drizzle fica em `src/infra/database/neon/schema.ts`.
- As migracoes versionadas ficam em `drizzle/`.
- `0000` e a baseline para bancos novos.
- `0001`, `0002` e `0003` adicionam o ciclo operacional e o catalogo.

O schema atual contem somente usuarios, organizacoes e as tabelas do ciclo
operacional. A migracao `0004_remove-legacy-finance.sql` remove contas,
categorias, contatos, cartoes, transacoes, recorrencias, parcelamentos,
impostos e as estruturas auxiliares da versao anterior.

## Integracoes

O runtime atual usa:

- Cognito para autenticacao
- API Gateway HTTP API
- AWS Lambda
- Neon/Postgres
- e-mail do Cognito para recuperacao de senha

Nao ha rotina agendada de recorrencias nem integracoes de S3, SQS ou DynamoDB
no MVP atual.
