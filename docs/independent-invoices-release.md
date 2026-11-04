# Publicação de notas fiscais independentes — 03/11/2026

Publicação autorizada pelo usuário e concluída na conta AWS `379443323181`,
perfil `felipe`, região `sa-east-1`.

| Componente | Código publicado | Destino |
| --- | --- | --- |
| API | `cae9fa80e0b36f8f6e4db93b787435a2ba80904e` | `fincheck-api-dev-financialModule` |
| Web | `7d0499e4b9b650e692ff62916332b2a6d6372394` | `https://app.moneystack.com.br/invoices` |
| Banco | `0015_independent-invoices` | Migração aditiva, com snapshots dos dados antigos |

Branch no GitHub: `codex/independent-invoices`, nos dois repositórios.
Commits posteriores aos identificadores acima podem conter apenas documentação.

## Verificação

- 107 testes da API aprovados; typecheck, lint, Drizzle check e bundle aprovados.
- Web: lint e build aprovados. Verificação local do cadastro sem OC, preço com
  casas decimais, total, recebimento parcial e edição restrita após baixa.
- Ambiente publicado: 11 grupos de verificações com uma organização sintética
  isolada. Cadastro avulso, duplicidade 409, baixa parcial, limite de saldo,
  bloqueio financeiro, cancelamento de baixa, quitação, isolamento 403/404,
  vencidas parciais, painel por emissão, rascunhos/cancelamento, rotas legadas e
  permissões SaaS aprovados. API Gateway sem JWT retornou 401.
- Usuário, organizações e dados temporários de QA removidos. Nenhum registro
  comercial existente foi usado como alvo dessas escritas de teste.
- Comparação final dos registros anteriores: **56 notas, 154 itens e zero baixas**
  preservados, inclusive IDs, datas, números, valores e observações. A migração
  não presumiu pagamentos; a conciliação bancária permanece para a próxima etapa.
- Sessão existente: página de notas, menu, carteira com 56 registros, cadastro,
  clientes e seleção opcional de OC conferidos. Nenhuma nova nota comercial foi
  gravada nessa conferência da interface.
- HTML publicado idêntico ao build local; JS e CSS de entrada retornaram 200.
  Invalidação CloudFront `I28GB9JQW2ZRGMU12RV2Y5QHV6`: `Completed`.

## Infraestrutura e recuperação

Stack adicional: `fincheck-financial-module-dev`, `UPDATE_COMPLETE`.
Integração no API Gateway `4amsp78wdf`: `ihmp8ai`. As 12 rotas financeiras
utilizam o authorizer JWT existente. A stack principal e as Lambdas anteriores
foram preservadas; sua última atualização continua `2026-09-01T13:05:04.162Z`.

Artefato atual:
`financial-module/dev/cae9fa80e0b36f8f6e4db93b787435a2ba80904e-897b8abbc6dfa9b2.zip`.

O primeiro backup das sete associações anteriores das rotas está no diretório
local ignorado `tmp/independent-invoices/releases/20261103-222001-6c69f06711fd77b3`.
A publicação seguinte guarda também os targets do módulo já ativo. Para desfazer
a adoção do módulo, use o **primeiro** backup, conforme o procedimento de
[independent-invoices.md](independent-invoices.md), sem remover os dados novos.

HTML anterior preservado no S3:
`s3://moneystack-frontend/releases/independent-invoices/20261103-222514-7d0499e4b9b650e692ff62916332b2a6d6372394/previous-index.html`.
Assets antigos permanecem disponíveis. Sempre selecione `--profile felipe`
explicitamente também no rollback.

Os relatórios locais de deploy, QA e comparação de registros estão em
`tmp/independent-invoices/`. Não versione os backups de configuração ou de dados.
Validação final concluída em `2026-11-04T01:31:01Z` (22:31 de 03/11 em São Paulo).
