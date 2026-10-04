# Listas de compras

Links de pesquisa e instruções da equipe ficam em listas compartilhadas pela
organização. Um item pode conter somente um link HTTP/HTTPS. Título, produto,
OC, item da OC, quantidade, preço unitário estimado, loja, prioridade, prazo e
observações são opcionais. É possível adicionar até 100 links por requisição.

O check simples registra data e responsável, sem movimentar compras ou contas
a pagar. Pode ser desfeito. A ação de registrar compra utiliza a configuração
existente de pagamento, catálogo, destinações e rateios. Check, pedido, produtos,
destinações e parcelas são gravados em um único comando SQL atômico. Se uma
parcela falhar, o comando inteiro é revertido. O controle de versão impede que
compras concorrentes dupliquem o pedido. Repetir uma compra já vinculada retorna
o mesmo pedido. A referência do preço do catálogo é atualizada depois.

Itens vinculados a pedidos são preservados. Correções e cancelamentos do pedido
são feitos no módulo de fornecedores; não se desfaz o pedido pelo checkbox.
Uma lista pode ser arquivada e reaberta sem apagar seu histórico.

## Permissões

As listas seguem a equipe já existente na produção:

| Ação | Papéis |
| --- | --- |
| Consultar | OWNER, ADMIN, COMMERCIAL, OPERATIONS, FINANCE, VIEWER |
| Criar/editar listas e itens | OWNER, ADMIN, COMMERCIAL, OPERATIONS |
| Marcar comprado / registrar pedido | OWNER, ADMIN, OPERATIONS |

Associações suspensas não permitem acesso. Na baseline V2, que não possui equipe,
somente o proprietário da organização acessa. Todas as leituras e alterações
validam a organização, a lista e os IDs relacionados. A API exige `version` nas
alterações de item e devolve 409 quando outro membro já alterou o registro.

## API HTTP

Base: `/entities/{entityId}/shopping-lists`

| Método | Sufixo | Ação |
| --- | --- | --- |
| GET | base | Listas, contadores e estimativa |
| POST | base | Criar lista com `name` obrigatório e `notes` opcional |
| GET | `/{shoppingListId}` | Lista e itens com nomes dos responsáveis |
| PATCH | `/{shoppingListId}` | Editar nome/notas, arquivar/reabrir |
| POST | `/{shoppingListId}/items` | Incluir `{ items: [{ url, ... }] }` |
| PUT | `/{shoppingListId}/items/{itemId}` | Substituir detalhes, com `version` |
| DELETE | `/{shoppingListId}/items/{itemId}` | Excluir item não vinculado, body `{ version }` |
| PATCH | `/{shoppingListId}/items/{itemId}/check` | `{ purchased: true/false, version }` |
| POST | `/{shoppingListId}/items/{itemId}/purchase` | `{ version, purchase: <contrato createAcquisition> }` |

Apenas `url` é obrigatório em um item novo. Na compra real, produto, quantidade,
data, responsável e forma de pagamento seguem as regras existentes. Quando o
item da lista informa uma OC, a compra deve incluir uma destinação para essa OC.

## Publicação e compatibilidade

Bases remotas desta implementação:

- API: `origin/codex/purchase-orders-v2`, `c276213`.
- Web: `origin/feature/saas-foundation`, `afba87d`.

Na inspeção de 04/10/2026, a stack `fincheck-api-dev` atendia o domínio de
produção e continha equipe, identidade da organização e funções de autenticação
mais recentes que o código remoto da API. Publicar a stack inteira a partir
desta baseline removeria esses recursos. Por isso, a implantação deste módulo
usa a stack adicional `fincheck-shopping-lists-dev`, com as nove rotas no API
Gateway existente, seu JWT authorizer e sua role Lambda. A stack principal e
suas funções permanecem preservadas. Essa separação está versionada no script
de deploy; não é necessário reconstruir a infraestrutura existente.

Não inclua simultaneamente `sls/functions/shoppingLists.yml` na stack principal:
essas rotas pertencem à stack adicional. Antes de uma futura consolidação,
sincronize o código SaaS da produção e transfira os recursos entre stacks.

`0014_shopping-lists.sql` é uma migração aditiva: cria apenas duas tabelas,
índices e relacionamentos. O número evita colisão com as migrações 0011–0013
presentes em produção e ausentes nesta baseline. O snapshot e a entrada do
journal seguem a sequência local do Drizzle. O migrador dedicado aplica somente
esta migração e registra seu hash no journal existente; não reaplica a baseline
nem migrações destrutivas antigas. Salva antes uma cópia do schema e journal
em `tmp/schema-before-shopping-lists.json`.

```powershell
pnpm install --frozen-lockfile
npm run typecheck
npm run lint
npm test
node node_modules/drizzle-kit/bin.cjs check
node scripts/migrateShoppingLists.mjs
./scripts/deployShoppingLists.ps1
```

Os scripts também podem ser executados com `npm run`.
O deploy consulta a configuração da Lambda existente sem imprimir segredos e
usa um ZIP identificado por commit/hash. Os arquivos gerados ficam em `tmp/`,
ignorado pelo Git. Requer AWS CLI e credenciais da conta configurada.

O Web é compilado com a URL de API de produção e publicado no bucket
`moneystack-frontend`, com invalidação da distribuição `E25QMGVM17EIA6`.
Publique os novos assets antes de substituir o `index.html`; preserve os assets
anteriores para sessões abertas e rollback.

## Validação e rollback

Os testes de integração usam Postgres PGlite em memória e aplicam as migrações
versionadas. Cobrem persistência, isolamento, papéis, vínculos, check/desmarcação,
conflitos, compra avulsa, destinações, parcelas, falhas atômicas, repetição de
requisições e concorrência. Não acessam nem alteram dados reais.

Para voltar a interface, republique o build anterior e invalide o CloudFront.
O módulo adicional pode permanecer ativo sem afetar a interface anterior. Para
voltar apenas sua API, atualize a stack adicional com o ZIP anterior. Não apague
as tabelas: isso preserva as listas e os vínculos de compras já registrados.

O backup do frontend anterior fica no diretório local `tmp/pre-shopping-lists-web`
do repositório Web. As informações da publicação e a validação em produção são
registradas em `docs/shopping-lists-release.md` após o deploy.
