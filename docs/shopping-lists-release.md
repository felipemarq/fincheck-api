# Publicação de listas de compras — 04/10/2026

Publicação concluída e validada no domínio de produção.

| Componente | Versão publicada | Destino |
| --- | --- | --- |
| API | `096bfcf4ff47ac399fd049ccdfb2a39146c8b1a7` | Lambda `fincheck-api-dev-shoppingLists` |
| Frontend | `720d55538700cc20987525ca5fca04b259c48c2f` | `https://app.moneystack.com.br/shopping-lists` |
| Banco | `0014_shopping-lists` | Duas tabelas e registro no journal existente |

Branches publicadas: `codex/shopping-lists` em ambos os repositórios.
Commits posteriores a esses identificadores podem conter apenas a documentação
da entrega.

## Infraestrutura

- Stack adicional `fincheck-shopping-lists-dev`: `CREATE_COMPLETE`.
- Lambda: `Active`, atualização `Successful`, Node.js 22.
- API Gateway existente `4amsp78wdf`: nove rotas com autorização JWT.
- Artefato: `shopping-lists/dev/096bfcf4ff47ac399fd049ccdfb2a39146c8b1a7-1008338ed2484096.zip`
  no bucket de deploy existente.
- Stack principal `fincheck-api-dev` preservada: sua última atualização continua
  sendo `2026-09-01T13:05:04.162Z`.
- Frontend publicado às `2026-10-04T05:10:42Z` (02:10 de São Paulo).
- Distribuição `E25QMGVM17EIA6`, invalidação `I81XD1NZKZVSYB1X3AZKBSIJYH`:
  `Completed`.

## Verificação

- API: typecheck, lint, 95 testes, Drizzle check e bundle Lambda aprovados.
- Web: lint e build aprovados.
- Interface local: item somente com link, compra integrada e checklist testados
  no navegador; versão mobile sem rolagem horizontal.
- Produção: conta Cognito temporária com JWT real, `/me`, proteção 401,
  isolamento 403, detalhes opcionais, edição, check/desfazer, conflito 409,
  compra com OC, compra avulsa, parcelas financeiras, repetição idempotente,
  exclusão de item, arquivar/reabrir e contadores aprovados.
- O pedido integrado apareceu no endpoint existente de fornecedores; a OC
  existente contabilizou a quantidade comprada e o financeiro registrou o valor.
- Contas e registros temporários de QA removidos após a verificação. Nenhum dado
  de organização real foi alterado por esses testes.
- HTML servido em `/shopping-lists` idêntico ao build local; JS e CSS retornam
  HTTP 200. A página publicada foi aberta com a sessão existente e não apresentou
  erros ou avisos no console.

## Rollback

O HTML anterior foi preservado no mesmo bucket, e os assets antigos permanecem
disponíveis. Para restaurar a interface anterior:

```powershell
aws s3 cp s3://moneystack-frontend/releases/shopping-lists/20261004-021033-720d55538700cc20987525ca5fca04b259c48c2f/previous-index.html s3://moneystack-frontend/index.html --content-type text/html --cache-control no-cache,no-store,must-revalidate --region sa-east-1
aws cloudfront create-invalidation --distribution-id E25QMGVM17EIA6 --paths '/*'
```

Preserve a stack adicional e as tabelas para manter listas e vínculos de compras.
Não faça deploy da stack principal a partir da baseline V2: a produção possui
recursos SaaS mais recentes que o remoto. Consulte [shopping-lists.md](shopping-lists.md)
antes de consolidar a infraestrutura.
