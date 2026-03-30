# Arquitetura da API

## Visão geral

O Fincheck API segue uma organização em camadas:

- `controller`: valida entrada e define o shape da resposta HTTP
- `use case`: coordena regras de negócio
- `query`: monta leituras agregadas para dashboard e listagens
- `repository`: persiste e consulta dados no banco
- `gateway`: integrações externas, como Cognito
- `adapter`: faz a ponte entre API Gateway/Lambda e os controllers

## Fluxo HTTP

1. O API Gateway recebe a requisição.
2. O handler em `src/main/functions/*` chama `lambdaHttpAdapter`.
3. O adapter resolve o controller via DI.
4. O controller valida `body`, `params` e `query`.
5. O controller chama o use case ou query.
6. A resposta é serializada e devolvida para o API Gateway.

## Autenticação

- O Cognito protege as rotas privadas com JWT no API Gateway.
- O `preTokenGenerationTrigger` injeta o `internalId` do usuário local no token.
- O backend usa esse `internalId` para mapear o usuário da aplicação.

## Persistência

- O banco é Postgres no Neon.
- O schema principal fica em `src/infra/database/neon/schema.ts`.
- A modelagem já cobre mais domínio do que a UI atual: contas, entidades, categorias, transações, recorrências, cartões, contatos, parcelamento, impostos, idempotência e auditoria.

## Rotinas assíncronas

- A criação de recorrências já materializa transações futuras dentro de um horizonte.
- A lambda `recurringMaterializeDaily` completa esse horizonte diariamente via EventBridge.

## Observações importantes

- A API usa uma `Saga` simples no cadastro para compensar efeitos colaterais quando uma etapa falha.
- A materialização de recorrências usa `seriesKey` para evitar duplicidade.
- O schema do banco já está pronto para módulos ainda não expostos no Web.
