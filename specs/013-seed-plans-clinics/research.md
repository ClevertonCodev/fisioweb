# Research: Ajuste de Seeds — Funcionalidades, Planos, Clínicas e Mídias

**Date**: 2026-07-11

## R1 — Chaves das funcionalidades

- **Decision**: `agenda`, `programas_exercicios`, `financas`, `app` (snake_case ASCII, sem acento). `Feature::ALLOWED_KEYS` passa a conter exatamente essas 4; `KEY_VIDEO_CALL` e `teste1..10` removidos. Seeder deleta registros de `admin_features` com chaves fora do novo conjunto (e cascata/limpeza dos `admin_feature_plans` órfãos).
- **Rationale**: Clarificação da sessão 2026-07-11; chaves ASCII evitam problemas de encoding em validação e URLs.
- **Alternatives considered**: manter `video_call` (rejeitado pelo usuário); adicionar sem remover placeholders (rejeitado — lixo em demo).
- **Impacto colateral**: `mock-features.ts` no frontend referencia `video_call`; atualizar para coerência (é mock estático, sem lógica dependente).

## R2 — Onde vive o seeder de planos/features

- **Decision**: Novo `Modules\Admin\Database\Seeders\PlanFeatureSeeder`, chamado pelo `DatabaseSeeder` raiz **antes** da criação/atualização das clínicas (clínicas precisam de `plan_id`).
- **Rationale**: Planos/features pertencem ao bounded context Admin (tabelas `admin_*`); segue o padrão dos seeders existentes do módulo.
- **Alternatives considered**: semear inline no `DatabaseSeeder` raiz (rejeitado — viola separação por módulo).

## R3 — Associação clínica → plano

- **Decision**: Usar o campo existente `clinics.plan_id` (fillable em `Modules\Clinic\Models\Clinic`, relação `plan()` BelongsTo). `DatabaseSeeder` resolve os planos por nome e passa `plan_id` no `updateOrCreate` de cada clínica.
- **Rationale**: Mecanismo já existe; nenhuma migração necessária.

## R4 — Identidade e idempotência das clínicas

- **Decision**: Chave natural = e-mail. Cleverton mantém `clevertonsantoscodev@gmail.com` (atualiza documento → `856.283.250-23` normalizado como armazenado hoje, e `plan_id` → Premium). Novas: `start@fisioweb.local` (doc `726.868.590-40`, plano Start) e `performance@fisioweb.local` (doc `74.760.866/0001-37`, plano Performance), cada uma com `ClinicUser` admin (`role` ADMIN, `mestre` YES, `status` ACTIVE, senha `12345678`).
- **Nota**: conferir na implementação se `document` é armazenado com ou sem máscara (o seed atual usa `00000000000` sem máscara) e seguir o padrão vigente.

## R5 — Retarget dos demo seeders

- **Decision**: Substituir seleções `Clinic::query()->orderBy('id')->limit(2)` (em `DashboardDemoSeeder`, `FinancialDemoSeeder`, `PatientDatabaseSeeder`) e `Clinic::all()` (`ClinicPatientDataSeeder`) por seleção explícita por e-mail/plano:
  - **Premium** (Cleverton): massa completa — pacientes (50), dashboard/agenda, financeiro, programas de tratamento, prontuários.
  - **Performance**: dados dos módulos do plano — pacientes + agenda (`DashboardDemoSeeder`), financeiro (`FinancialDemoSeeder`), programas (`TreatmentPlanSeeder`/`ClinicPatientDataSeeder`).
  - **Start**: apenas clínica + admin + 1 paciente básico (criado no `DatabaseSeeder` raiz ou com volume mínimo no `PatientDatabaseSeeder`).
- **Rationale**: Clarificação (réplica proporcional ao plano). Seleção por e-mail conhecido é estável e independe de ordem de IDs.
- **Alternatives considered**: manter `limit(2)` (frágil — passaria a pegar clínicas erradas com 3 clínicas).

## R6 — Mídias (fotos, thumbnails, vídeos)

- **Decision**:
  - Fotos: constantes `PHOTOS` de `PatientDatabaseSeeder` e `ClinicUserSeeder` reduzidas a um único arquivo `2cc94b05-8e9c-465a-b42a-6c40b473bf59_1783781535.png` (a lógica `% count(PHOTOS)` continua funcionando com 1 item).
  - Vídeos (`VideoSeeder`): vídeo 1 → arquivo `bf6fd593-...mp4` + thumbnail `31fa195c-...png`; vídeo 2 → `7cb1e772-...mp4` + thumbnail `139645c7-...jpeg`. `updateOrCreate` é chaveado por `filename`, então trocar o filename cria registros novos — o seeder deve atualizar os registros existentes (ids 1 e 2, referenciados por `ExerciseSeeder`) em vez de criar novos, ou remover os antigos preservando os vínculos de exercício.
- **Rationale**: URLs fornecidas pelo usuário; ids 1 e 2 são contrato implícito com `ExerciseSeeder` (comentário no `DatabaseSeeder`).

## R7 — Guardas de produção

- **Decision**: Manter `app()->isProduction()` como guarda nos seeders demo; `PlanFeatureSeeder` e clínicas base seguem o comportamento atual do `DatabaseSeeder` (sem guarda), pois planos/features são dados de catálogo legítimos.
