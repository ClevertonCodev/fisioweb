# Phase 0 — Research: Dashboard da Clínica com Widgets por Papel

Decisões técnicas que resolvem os pontos em aberto do plano. Nenhuma `NEEDS CLARIFICATION` permanece (as 5 ambiguidades foram fechadas em `/speckit-clarify`, ver `spec.md → Clarifications`). As decisões abaixo cobrem _como_ implementar.

---

## 1. Biblioteca de gráficos: Chart.js vs `recharts` já instalado

- **Decision**: Usar **Chart.js + `react-chartjs-2`** para os dois gráficos (Captação = rosca/barras; Taxa de ocupação = barras). Adicionar as duas deps ao `package.json`.
- **Rationale**: O usuário pediu Chart.js explicitamente. Encapsular em `PatientAcquisitionChart.tsx`/`OccupancyRateChart.tsx` (registrando só os controllers usados — `BarController`, `DoughnutController`, `CategoryScale`, `LinearScale`, `ArcElement`, `Tooltip`, `Legend`) para tree-shaking.
- **Alternatives considered**: `recharts` (já é dependência) evitaria bundle novo, mas contraria o pedido explícito. Registrado como alternativa caso o time prefira não adicionar deps; a decisão pode ser revista nas tasks sem afetar contratos (os gráficos consomem os mesmos DTOs).

## 2. Visibilidade por papel — onde mora a regra

- **Decision**: Um Value Object **`DashboardScope`** construído a partir do `ClinicUser` autenticado + um parâmetro de query `scope` (`clinic` | `mine`). Resolve para um conjunto de filtros (`clinicId`, e opcionalmente `clinicUserId`). Regra:
  - `secretary` → sempre `clinic` (ignora `scope=mine`; o `clinic_user_id` não é aplicado).
  - `admin` → `clinic` por padrão; `scope=mine` aplica `clinic_user_id = admin.id`.
  - `physiotherapist` → **sempre** `clinic_user_id = self.id` (qualquer `scope` recebido é ignorado/forçado).
- **Rationale**: Centraliza a decisão de escopo (FR-002/003/004/005) num único ponto testável, evitando repetir `if role` em cada widget. Backend é a autoridade (SC-004): o `scope` do cliente é uma _sugestão_, nunca uma autorização.
- **Alternatives considered**: Policy por widget (excesso de boilerplate para leitura agregada); resolver escopo no controller (espalha a regra). Rejeitados por duplicação.

## 3. "Pacientes ativos" — definição da query

- **Decision**: `status NOT IN ('obito','cancelado','alta')` sobre `patients` da clínica (e `clinic_user_id` quando escopo `mine`/fisio). Os 3 status ativos são `em_tratamento`, `em_treinamento`, `em_prevencao` (fonte: `resources/js/domain/clinic/patient.ts`).
- **Rationale**: Espelha FR-006 e o enum de status já existente no front. Usar `NOT IN` (em vez de `IN` dos ativos) é resiliente a novos status "ativos".
- **Alternatives considered**: usar `patients.is_active` (boolean) — rejeitado: semântica diferente (inativação manual), não cobre óbito/alta.

## 4. "Consultas hoje" e "Próximas consultas"

- **Decision**: `clinic_appointments` com `starts_at` no intervalo `[hoje 00:00, hoje 23:59:59]` no **timezone da clínica** (`clinics.timezone`), `status != 'cancelled'`. "Consultas hoje" = `count`. "Próximas consultas" = mesmas linhas ordenadas por `starts_at ASC`, **limit 5**, com `patient` eager-loaded (nome, foto) e `status`/`title`.
- **Rationale**: FR-007/010/010a + clarificação (todas de hoje, passadas+futuras, ~5 itens). Timezone: converter o "dia" para UTC usando `clinics.timezone` antes de filtrar `starts_at` (coluna datetime).
- **Alternatives considered**: filtrar por `>= now()` (só futuras) — rejeitado pela clarificação (Option A: inclui passadas).

## 5. "Programas ativos"

- **Decision**: `clinic_treatment_plans.status = 'active'`, cujo `patient` esteja ativo (`status NOT IN (obito,cancelado,alta)`), e cuja vigência intersecte o mês corrente: `start_date <= fimDoMes AND (end_date IS NULL OR end_date >= inicioDoMes)`. Escopo por papel via `clinic_user_id`.
- **Rationale**: FR-008 + Assumption de vigência. Join/`whereHas('patient')` para o status do paciente.
- **Alternatives considered**: contar todos os `active` sem checar paciente — rejeitado pelo edge case explícito.

## 6. "Exercícios disponíveis" + categorias

- **Decision**: Contagem **global** (não escopada por clínica — catálogo é do Admin): exercícios ativos (`Exercise::active()`) que possuem mídia de vídeo, e número de **categorias distintas**. Categoria = `body_region_id` (model `BodyRegion`), que é o agrupamento mais próximo de "categoria" no catálogo.
- **Rationale**: FR-009 ("não escopável por papel"). "vídeos" = exercícios com `media` (HasMany `admin_exercise_media`). `BodyRegion` é o eixo de categorização visível ao usuário (mock: "15 categorias").
- **Open follow-up (tasks)**: confirmar se "categoria" deve ser `BodyRegion` ou `PhysioArea`. Decisão default: `BodyRegion`. Não afeta contrato (campo `categories_count`).
- **Alternatives considered**: contar `media_videos` diretamente — rejeitado: nem todo vídeo é exercício de catálogo.

## 7. Aniversariantes do mês

- **Decision**: `patients` com `MONTH(birth_date) = mês corrente` (timezone clínica), `birth_date NOT NULL`, ordenados por `DAY(birth_date)`. Escopo por papel. Retornar `name`, `photo_url`, `birth_date` (dia), `phone` (para habilitar/desabilitar WhatsApp). Botão usa link `https://wa.me/<phone>` (sanitizar dígitos); desabilitado quando `phone` vazio.
- **Rationale**: FR-012/013/014. `wa.me` é o caminho mais simples e não exige backend (abre WhatsApp do operador); o módulo WhatsApp/Twilio é para envio automatizado, não para "abrir conversa" manual.
- **Alternatives considered**: disparar `SendWhatsAppMessageJob` — rejeitado: a ação é "iniciar conversa" manual do operador, não mensagem automática.

## 8. Captação de pacientes (comparação 3 anos)

- **Decision**: Agrupar `patients` por `referral_source` (origem), base temporal = `created_at` (data de cadastro). Para cada um dos 3 anos (corrente, −1, −2) e para o consolidado, retornar `{ source, count, percent }`. `referral_source` nulo/vazio → bucket `"Não informado"`. Escopo por papel.
- **Rationale**: FR-015/016/017 + clarificação (base = cadastro; 3 anos separados + consolidado). Backend devolve a matriz pronta `anos × origens` para o gráfico comparativo não precisar recomputar.
- **Alternatives considered**: base = primeira consulta — rejeitada na clarificação (Option A: data de cadastro).

## 9. Taxa de ocupação — cálculo e janela de atendimento

- **Decision**: Nova config por clínica (colunas em `clinics`): `working_start` (TIME, default `08:00`), `working_end` (TIME, default `18:00`), `working_days` (JSON array de 1..7 ISO, default seg–sex `[1,2,3,4,5]`). Serviço `OccupancyRateService`:
  - **denominador** de um bucket = soma, para cada dia atendido do bucket, de `(working_end − working_start)`.
  - **numerador** = soma das durações (`ends_at − starts_at`) das consultas não canceladas daquele `clinic_user_id` no bucket.
  - `rate = numerador / denominador` (0 quando denominador 0).
  - Buckets por granularidade (FR-019b): **Diária** = cada dia do mês corrente; **Semanal** = últimas 12 semanas (ISO week); **Mensal** = cada mês do ano corrente.
  - Resumo (`occupied_rate`) = numerador total ÷ denominador total no range da granularidade.
- **Rationale**: Fecha a clarificação Q1+Q5. Janela na própria `clinics` evita tabela nova; default sensato cobre clínica não configurada (FR-019a). Edição da janela fica fora do escopo do dashboard (config da clínica) — esta feature só **lê**.
- **Alternatives considered**: janela por fisioterapeuta (mais preciso, muito mais esforço — rejeitado na clarificação); tabela `clinic_settings` dedicada (overkill para 3 campos).

## 10. Seletor de fisioterapeuta (ocupação) + papéis

- **Decision**: Endpoint de ocupação aceita `clinic_user_id`. Validação no backend: `admin`/`secretary` podem passar qualquer `clinic_user_id` da clínica; `physiotherapist` é **forçado** ao próprio id (param ignorado). A lista de fisioterapeutas do seletor reusa `GET /clinic/users/professionals` (já existe). "Admin que atende" aparece na lista apenas se tiver agendamentos (subconsulta/`whereHas('appointments')`).
- **Rationale**: FR-020 + edge case "admin que não atende". Reaproveita endpoint existente de profissionais.

## 11. Log de atividades — modelo e instrumentação

- **Decision**: Tabela `clinic_activities` (`clinic_id`, `clinic_user_id` nullable=ator, `type` string/enum, `description` string, `subject_type`/`subject_id` nullable=morph leve, `created_at`). Enum `ActivityType` com os 8 tipos de FR-022b. Serviço `ActivityLogger` (interface + bind) chamado dentro dos Services de domínio, **após** a transação, mapeando:
  | Evento (FR-022b) | Ponto de instrumentação |
  |---|---|
  | novo paciente | `Patient\Services\PatientService::create` |
  | paciente editado | `PatientService::update` |
  | programa criado | `Clinic\Services\TreatmentPlanService::create` |
  | programa concluído | `TreatmentPlanService::update` quando `status → completed` |
  | consulta agendada | `Clinic\Services\AppointmentService::create` |
  | consulta concluída | `AppointmentService::updateStatus` quando `→ completed` |
  | consulta cancelada | `AppointmentService::cancel` |
  | exercícios adicionados | `TreatmentPlanService::addExercise` (escopo clínico; catálogo Admin fica fora) |
- **Rationale**: FR-022a/b (Q3=B). Instrumentar nos Services (não nos controllers) mantém a gravação junto da regra de negócio e cobre todos os caminhos. `ator` = usuário autenticado no momento (`Auth::guard('clinic')`).
- **Alternatives considered**: derivar o feed de `created_at`/`updated_at` dos registros (Q3 Option B descartada); usar `spatie/activitylog` (dependência nova desnecessária para 8 tipos).
- **Edge / escopo**: o feed (FR-023) é só admin/secretário, sempre escopo de **clínica inteira** (não filtra por ator), do **dia corrente** (`created_at` em hoje, timezone clínica).

## 12. Forma do endpoint — agregador vs sub-endpoints

- **Decision**: Um **agregador** `GET /clinic/dashboard` que devolve em uma resposta os widgets "baratos e iniciais" (cards + próximas consultas + aniversariantes + flags de papel/permissões de UI), para cumprir SC-003 (≤2s, 1 round-trip) e SC-006 (cada bloco com seu próprio estado no front via seleção do cache). Widgets "pesados/parametrizáveis" ficam em **sub-endpoints** dedicados, carregados sob demanda pelo seu próprio hook:
  - `GET /clinic/dashboard/occupancy-rate?granularity=&clinic_user_id=`
  - `GET /clinic/dashboard/patient-acquisition?scope=`
  - `GET /clinic/dashboard/activities` (admin/secretário)
  - cards/listas escopáveis aceitam `?scope=clinic|mine` (admin) — recomputados ao alternar o toggle.
- **Rationale**: equilibra 1ª pintura rápida (agregador) com recomputo isolado dos gráficos/feed ao mudar filtros (FR-021, SC-007) sem rebuscar tudo. Cada sub-endpoint tem seu `queryKey` no React Query → falha isolada (SC-006).
- **Alternatives considered**: tudo num endpoint (recomputa tudo a cada filtro, viola SC-006/007); um endpoint por card (excesso de round-trips na 1ª pintura, viola SC-003).

## 13. Camadas do frontend

- **Decision**: `domain/clinic/dashboard.ts` (tipos camelCase puros). `application/clinic/ports.ts` ganha `DashboardRepository`; `use-dashboard.ts` expõe um hook por widget (`useDashboardSummary`, `useOccupancyRate`, `usePatientAcquisition`, `useRecentActivities`) com `queryKey` próprio. `infrastructure/repositories/api-clinic-dashboard.ts` faz HTTP + mapeia snake→camel. `DashboardPage` compõe os componentes na ordem do FR-027; cada widget trata loading/empty/error localmente (Skeleton/EmptyState) — SC-006.
- **Rationale**: princípios 2/3/4 do CLAUDE.md. Hooks separados garantem degradação graciosa e recomputo independente.

---

## Resumo das novas dependências / migrations

- **Frontend dep**: `chart.js`, `react-chartjs-2`.
- **Migration editada**: `create_clinics_table` (+`working_start`, `working_end`, `working_days`).
- **Migration nova**: `create_clinic_activities_table`.
- **Reaplicar schema**: `php artisan migrate:fresh` (convenção dev — sem migrations incrementais).
