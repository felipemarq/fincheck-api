# Notas fiscais independentes

Branch: `codex/independent-invoices`.

Notas fiscais pertencem à organização e possuem cliente, itens, vencimento e
recebimentos próprios. `purchaseOrderId` é opcional. O cadastro pela OC continua
disponível, com as validações de saldo para faturamento já existentes.

O cliente e as descrições/unidades dos itens são preservados na nota. A migração
`0015_independent-invoices` preenche esses dados nas notas existentes sem recriar
IDs, alterar valores ou marcar títulos como pagos. As colunas novas permitem
escritas dos handlers antigos durante a implantação; as leituras usam a OC como
fallback somente quando o snapshot ainda não existe.

As notas emitidas alimentam os indicadores fiscais pelo período de emissão da
própria nota, inclusive sem OC ou com OC encerrada. Rascunhos e canceladas ficam
fora dos totais. Recebimentos confirmados reduzem o saldo; pagamentos cancelados
não reduzem o saldo. Impostos são custos fiscais e as deduções reduzem o recebível,
mantendo a regra financeira anterior. Margens/custos de compras continuam sendo
calculados a partir das OCs, sem presumir custo para uma nota avulsa.

O envelhecimento dos títulos segue o calendário de `America/Sao_Paulo`. O filtro
de vencidas inclui os saldos parcialmente recebidos. Os resumos globais não mudam
com filtros da listagem; as listas e o painel atualizam a cada minuto e após uma
alteração.

## API

Novas rotas com JWT no authorizer Cognito existente:

- `GET/POST /entities/{entityId}/invoices`
- `PATCH /entities/{entityId}/invoices/{invoiceId}`
- `POST /entities/{entityId}/invoices/{invoiceId}/payments`
- `PATCH /entities/{entityId}/invoices/{invoiceId}/payments/{paymentId}`

As cinco rotas equivalentes sob `purchase-orders/{purchaseOrderId}/invoices`,
`GET /entities/{entityId}/receivables` e
`GET /entities/{entityId}/operations-dashboard` continuam com o mesmo contrato.

Sem OC, informe `customerId` e itens com `description`, `originalUnit`,
`invoicedQuantity` e `unitPrice`. Com OC, o cliente vem da ordem e os itens precisam
de `purchaseOrderItemId`. A nota não pode mudar silenciosamente de OC na edição.
Após recebimentos, somente vencimento e observações podem mudar. Números de nota
continuam únicos por organização; quantidades têm três casas, preços seis e
recebimentos duas. Importação de XML/PDF e conciliação de extrato ficam para a
próxima atividade.

## Permissões e implantação

`FinancialAccessService` reproduz as permissões conferidas no código SaaS em
produção em 03/11/2026. OWNER, ADMIN e FINANCE alteram notas e recebimentos.
Os demais papéis consultam notas; a carteira financeira é acessível a OWNER,
ADMIN, FINANCE e VIEWER. Membros suspensos não acessam. A ausência de tabelas SaaS
na baseline de testes permite apenas o proprietário legado.

Não publique a stack principal `fincheck-api-dev` desta baseline. Ela tem recursos
de autenticação/equipe mais recentes em produção. O módulo adicional
`fincheck-financial-module-dev` cria uma Lambda, integração e cinco rotas novas;
o script redireciona somente as sete rotas financeiras existentes para a nova
integração, preservando authorizer, código das Lambdas anteriores e demais
recursos. Essas sete associações devem ser reconciliadas antes de uma futura
publicação da stack principal; não as substitua pela configuração antiga.

Os scripts verificam perfil `felipe`, conta `379443323181`, região `sa-east-1`.
O migrador obtém a conexão da configuração da Lambda dessa conta, salva uma cópia
dos registros e schema em `tmp/independent-invoices/database-before.json`, aplica
somente a migração nova em transação e compara os registros financeiros anteriores.
Não executa migrações antigas ausentes em produção.

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm typecheck
corepack pnpm lint
corepack pnpm test
corepack pnpm exec drizzle-kit check
node scripts/buildFinancialModule.mjs
node scripts/migrateIndependentInvoices.mjs --inspect
node scripts/migrateIndependentInvoices.mjs
./scripts/deployFinancialModule.ps1
```

O deploy só deve acontecer com a publicação autorizada pelo usuário. Os testes
locais usam Postgres PGlite em memória. A validação cobre migração, cadastros via
HTTP, isolamento, permissões SaaS, pagamentos parciais, bloqueios financeiros,
duplicidade, busca e indicadores sem duplicação.

## Rollback

`tmp/independent-invoices/api-release.json` aponta o diretório de cada publicação.
`previous-routes.json` guarda os sete targets anteriores. Restaure esses targets
com `aws apigatewayv2 update-route`, sempre com `--profile felipe`. O frontend
preserva o HTML e os assets anteriores no S3. Não reverta as colunas/tabelas nem
exclua notas novas; isso mantém os dados e permite republicar o módulo corrigido.
