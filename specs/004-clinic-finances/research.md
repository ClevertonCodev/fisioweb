# Research: Clinic Finances

**Feature**: 004-clinic-finances
**Date**: 2026-06-20

Este documento resolve as decisões deixadas em aberto no Technical Context do `plan.md` e registra as alternativas avaliadas. Decisões já fixadas no `spec.md` (clarifications) **não** são reabertas aqui — apenas referenciadas.

## R1. Biblioteca de gráficos

**Decision**: usar **Chart.js 4 + react-chartjs-2 5**, já instalados no projeto. Reutilizar (e promover) o `chart-setup.ts` criado em `resources/js/components/clinic/dashboard/` para um diretório compartilhado `resources/js/components/charts/`.

**Rationale**:
- Pedido explícito do usuário ao chamar `/speckit-plan`: "use a lib que já existe no sistema".
- O plano 003 (Dashboard) já tomou exatamente essa decisão e implementou os primeiros gráficos da clínica em `react-chartjs-2`. Padronizar Finanças na mesma stack evita dois sistemas de gráfico convivendo na clínica.
- Cobre os 3 tipos pedidos (linha, pizza, barras) com tooltips, legendas interativas, exportação para imagem (`chart.toBase64Image()`) e responsividade nativos.

**Alternatives considered**:
- **Recharts** (presente como dependência via wrapper shadcn `components/ui/chart.tsx`): bom para mini-charts declarativos, mas teríamos dois renderers no contexto clinic. Mantido apenas para `components/ui/chart.tsx`, não introduzido em Finanças.
- **Apex/ECharts**: dependência nova, contra o pedido explícito.

## R2. Geração de XLSX

**Decision**: adicionar **`openspout/openspout` ^4** (composer) e usá-lo dentro de `FinanceXlsxExporter`. Streamar para resposta HTTP via `response()->streamDownload(...)`.

**Rationale**:
- Não há lib XLSX no projeto hoje. CSV é nativo no Laravel (`fputcsv` + stream).
- Openspout é a evolução do Spout: ~10× mais leve que PhpSpreadsheet, faz streaming (constante de memória) e gera `.xlsx` válido. Adequado para listas que podem chegar a milhares de transações por exportação.
- API simples (`Writer\XLSX\Writer`), sem dependência de extensões PHP além do `zip` (já assumido pela stack).

**Alternatives considered**:
- **maatwebsite/excel** (PhpSpreadsheet): mais conhecido no ecossistema Laravel, mas pesado (~30MB), consumo de memória alto e API mais verbosa. Desnecessário para o escopo (listagem tabular simples).
- **CSV-only**: descartado — XLSX é requisito (FR-024).

## R3. Geração de PDF

**Decision**: reutilizar o módulo **`Pdf`** existente (`Modules\Pdf\Services\PdfService`), que internamente usa **`barryvdh/laravel-dompdf` ^3.1**. Templates Blade em `modules/Clinic/resources/views/finance/`.

**Rationale**:
- Toda geração de PDF do projeto já passa por esse caminho — manter a consistência.
- DomPDF é suficiente para os 2 layouts pedidos: lista tabular de transações e relatório (cards + tabela resumo + imagens dos gráficos exportadas pelo front e re-anexadas, ou cards/tabela apenas no PDF e gráfico exportado separadamente em PNG pelo usuário).

**Alternatives considered**:
- **Browserless/Headless Chrome**: maior fidelidade visual para gráficos, mas grande complexidade operacional para um relatório financeiro tabular. Não justificado.
- **Snappy (wkhtmltopdf)**: binário externo, mais frágil em deploy.

## R4. Exportar gráficos em PNG (front)

**Decision**: usar o método nativo do Chart.js `chart.toBase64Image('image/png', 1.0)` exposto via `ref` no componente; gerar download no cliente sem chamada de servidor.

**Rationale**: zero dependência adicional, gráfico exportado é exatamente o renderizado.

**Alternatives considered**: `html2canvas` (mais pesado, capturaria também elementos ao redor — desnecessário).

## R5. Persistência da preferência "Ocultar valores"

**Decision**: persistir em `localStorage` por usuário sob a chave `clinic.finance.hideValues` (boolean). Hook React `use-finance-values-visibility.ts` lê na montagem e escreve a cada toggle.

**Rationale**:
- Preferência puramente de UI/cliente; não precisa ir ao backend (FR-023 fala em "entre sessões do mesmo usuário").
- Padrão de "device-local preference" alinhado com outros toggles do projeto (sidebar collapse etc.).
- Evita migration e endpoint só para isso.

**Alternatives considered**:
- Salvar em `user_preferences` no backend: mais robusto entre dispositivos, mas exige tabela/endpoint novos sem requisito real (a preferência de privacidade tipicamente é por dispositivo — ex.: "estou no consultório com paciente").
- `sessionStorage`: perde entre abas e sessões — fere FR-023.

## R6. Cálculo de saldo (cards do mês)

**Decision**: calcular em runtime no `FinanceSummaryService`, agregando direto no SQL. Sem snapshot materializado.

Para um período `(year, month)`:

```
inicial   = PeriodOpeningBalance(clinic, year, month).valor  (default 0)
recebidas = Σ value where type=entrada AND status=recebido AND period
pendentes_entrada = Σ value where type=entrada AND status=pendente AND period
pagas     = Σ value where type=saida   AND status=pago      AND period
pendentes_saida   = Σ value where type=saida   AND status=pendente AND period

disponivel = inicial + recebidas - pagas
previsto   = disponivel + pendentes_entrada - pendentes_saida
```

**Rationale**: agregados pesam pouco com índices em (`clinic_id, date`); manter snapshot adiciona invalidação. Atende SC-002 com folga.

**Alternatives considered**: `MonthlyBalanceSnapshot` materializado (rejeitado nesta versão — complexidade de invalidação > ganho de performance no volume previsto).

## R7. Modelagem de categorias (seed global + custom + override de desativação)

**Decision**: três tabelas:
1. `clinic_financial_categories` — categorias globais (seed) **e** custom da clínica (`clinic_id` nullable). `origin` enum `system|custom`. Categorias `system` não podem ser excluídas por clínica.
2. `clinic_financial_category_overrides` — registra desativação local de categoria `system` por uma clínica específica (clinic_id + category_id + active=false).
3. Para categorias `custom` de uma clínica, a coluna `active` da própria `clinic_financial_categories` é a fonte de verdade.

Visibilidade efetiva para uma clínica = (`system` ativas - overrides=false dessa clínica) ∪ (`custom` dessa clínica com active=true).

**Rationale**: solução clássica para SaaS multi-tenant com catálogo seed compartilhado mais opt-out por tenant. Evita explodir a tabela copiando o seed para cada clínica.

**Alternatives considered**:
- Copiar seed para cada nova clínica: simples mas duplica dados e exige migração de novos itens do seed para todas as clínicas.
- Lista única `(clinic_id NULLABLE)` sem override e clínica simplesmente "ignora" no cliente: quebra filtros do backend e exportações.

## R8. Soft delete permanente — implementação

**Decision**: `SoftDeletes` trait do Eloquent em `FinancialTransaction` com `deleted_at`. Coluna extra `deleted_by_user_id` (FK para `users`/`clinic_users` conforme convenção do módulo) preenchida no `FinancialTransactionService::softDelete`. **Sem agendamento de purga** — nenhuma rota de "force delete", nenhum job. Tela `FinancesTrashPage` lista `onlyTrashed()` e expõe somente `restore`.

**Rationale**: cumpre FR-007 / FR-007a / FR-007b / FR-007c exatamente; aproveita ferramentaria do Laravel; queries normais já filtram excluídas via global scope do `SoftDeletes`.

## R9. Tela de configurações financeiras vs. tela de categorias

**Decision**: duas rotas distintas para clareza de UX:
- `/clinica/financas` (página principal, com Tabs Finanças/Relatório + menu de opções com Filtros / Exportar / Configurações).
- `/clinica/financas/categorias` (gestão CRUD de categorias custom + toggle ativação de categorias seed).
- `/clinica/financas/lixeira` (lista de transações excluídas + restaurar).

O painel de "Configurações" abre como **drawer/dialog** dentro de `/clinica/financas` (não rota), exibindo o aviso de repasses (CTA upsell) + link para `/clinica/financas/categorias` + link para `/clinica/financas/lixeira`.

**Rationale**: separar telas com listagens próprias (categorias, lixeira) evita modais excessivamente complexos; configurações leves continuam in-page.

## R10. Autorização — admin-only

**Decision**: cada controller financeiro usa `authorizeResource` apontando para `FinancialTransactionPolicy` / `FinancialCategoryPolicy`. As Policies retornam `true` apenas para administradores da clínica autenticada (campo de papel existente no módulo Clinic — alinhar com a função `is_admin` / `role === 'admin'` já adotada em `ClinicUserPolicy`). Em adição, registrar middleware `clinic.admin` no grupo de rotas `/clinic/finances/*` para defesa em profundidade (rejeita não-admin antes de instanciar Policies).

No front: usar `RequireClinicAdmin` (skill `security`) ao redor das rotas finance do `clinic-routes`.

**Rationale**: dupla camada (middleware + Policy) garante 403 em qualquer rota mesmo se o controller esquecer `authorize`. Frontend só esconde — backend protege.

## R11. Timezones e agrupamento mensal

**Decision**: todos os filtros/agregados por período usam `clinics.timezone` (coluna existente, mesma convenção do plano 003). Conversão feita no backend ao construir as queries — datas viajam no JSON como ISO 8601 UTC, mas filtros `period=YYYY-MM` são interpretados como mês completo na timezone da clínica.

**Rationale**: evita o problema clássico de transação criada às 23h do dia 30 aparecer no mês seguinte para o navegador em UTC-3.

## R12. Cache de listagem

**Decision**: cache `Cache::tags(["clinic:{$id}:finance"])` por (clinic_id + hash de filtros + página) com TTL 60 s, invalidado em qualquer `store/update/destroy/restore` do `FinancialTransactionService`. Tags facilitam invalidação coletiva.

**Rationale**: opcional para MVP, mas barato e já cobre cenário de múltiplas abas/refresh seguidas que são comuns na tela financeira.

## R13. Estratégia de testes (resumo)

- **Backend Feature tests** cobrem: contratos REST (códigos HTTP, payloads `{ data: ... }`), autorização admin-only (não-admin = 403), multi-tenant (clínica A não vê dados da B), soft delete + restore, cálculo do summary com saldo inicial, agregados do report, exportação retornando bytes coerentes (asserts mínimos por formato).
- **Backend Unit tests** isolam `FinanceSummaryService` e `FinanceReportService` com Mockery dos repositórios.
- **Frontend** segue skill `frontend-testing`: repositório com `vi.mock('@/infrastructure/apiClient')`, hooks com `renderHook` + `QueryClientProvider`, dialog/table com `userEvent`.

## R14. Acessibilidade e responsividade

**Decision**:
- Tabela com `aria-sort`, navegação por teclado em todas as ações (`<Button variant="ghost">`).
- Drawer de filtros usa o componente já existente `<Sheet />` do shadcn (recolhível em tablet/mobile conforme FR-043).
- Cards e gráficos em grid `md:grid-cols-2 lg:grid-cols-4` com `min-w-0` para não estourar em viewport pequena.
- Toggle "Ocultar valores" tem `aria-pressed` e label oculto para leitor de tela.

## Resolved unknowns checklist

- [x] Chart library → Chart.js + react-chartjs-2 (existente)
- [x] XLSX library → openspout/openspout (nova dep composer)
- [x] PDF generation → módulo `Pdf` + dompdf (existente)
- [x] PNG export do gráfico → `chart.toBase64Image` no front
- [x] Persistência do "ocultar valores" → localStorage por usuário
- [x] Cálculo saldo → runtime SQL agregado (sem snapshot)
- [x] Modelagem categorias → seed + custom + overrides
- [x] Soft delete permanente → SoftDeletes sem purga, FK deleted_by
- [x] Estrutura de telas (rotas separadas vs in-page) → 3 rotas + drawer de settings
- [x] Autorização → Policies + middleware `clinic.admin` + `RequireClinicAdmin` no front
- [x] Timezones → clinics.timezone aplicado nos filtros server-side
- [x] Cache → tag-based 60s, invalidado em mutations
