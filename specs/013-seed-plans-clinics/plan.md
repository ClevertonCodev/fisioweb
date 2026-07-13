# Implementation Plan: Ajuste de Seeds — Funcionalidades, Planos, Clínicas e Mídias

**Branch**: `main` (sem branch nova, por decisão do usuário) | **Date**: 2026-07-11 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/013-seed-plans-clinics/spec.md`

## Summary

Ajustar os seeds de desenvolvimento para refletir o catálogo comercial real: 4 funcionalidades (agenda 10, programas e exercícios 15, finanças 5, app 20), 3 planos por usuário (Start 20/15 sem features; Performance 30/25 com agenda+programas+finanças; Premium 40/35 com tudo), uma clínica de demonstração por plano (Cleverton → Premium; novas Start e Performance), e URLs novas de fotos/thumbnails/vídeos do bucket R2. Abordagem: novo `PlanFeatureSeeder` no módulo Admin, ajuste do `DatabaseSeeder` raiz para criar/vincular as 3 clínicas, refatoração das chaves em `Feature::ALLOWED_KEYS`, e retarget dos demo seeders de "2 primeiras clínicas" para seleção por plano.

## Technical Context

**Language/Version**: PHP 8.2+ / Laravel 12

**Primary Dependencies**: Eloquent, seeders Laravel; models `Modules\Admin\Models\{Feature,Plan,FeaturePlan}`, `Modules\Clinic\Models\{Clinic,ClinicUser}`, `Modules\Media\Models\Video`, `Modules\Patient\Models\Patient`

**Storage**: MySQL/PostgreSQL via Eloquent; mídias servidas do Cloudflare R2 (CDN `config('cloudflare.cdn_url')`)

**Testing**: PHPUnit 11 (`composer run test`); validação manual via `php artisan migrate:fresh --seed`

**Target Platform**: Ambiente de desenvolvimento/demonstração (seeders com guarda `app()->isProduction()`)

**Project Type**: Monólito modular Laravel (backend only nesta feature; frontend intocado exceto mock estático)

**Performance Goals**: N/A (seeds de dev); seed completo deve continuar rodando em tempo razoável

**Constraints**: Seeds idempotentes (`updateOrCreate` por chave natural); nenhuma migração de schema necessária (`clinics.plan_id` e tabelas `admin_features`/`admin_plans`/`admin_feature_plans` já existem)

**Scale/Scope**: ~6 seeders tocados + 1 novo, 1 model (`Feature`), 1 mock frontend opcional

## Constitution Check

`.specify/memory/constitution.md` é o template não preenchido — sem gates formais. Aplicam-se os princípios do CLAUDE.md: monólito modular (seeder de planos/features vive em `modules/Admin`), idempotência dos seeds existentes preservada, Pint no PHP novo. **PASS** (pré e pós-design).

## Project Structure

### Documentation (this feature)

```text
specs/013-seed-plans-clinics/
├── plan.md              # Este arquivo
├── research.md          # Fase 0
├── data-model.md        # Fase 1
├── quickstart.md        # Fase 1
└── tasks.md             # Fase 2 (/speckit-tasks)
```

(`contracts/` omitido: feature é apenas seed data interno, sem interface externa nova.)

### Source Code (repository root)

```text
database/seeders/
└── DatabaseSeeder.php                          # MODIFICAR: 3 clínicas com plan_id + documento; chamar PlanFeatureSeeder

modules/Admin/
├── app/Models/Feature.php                      # MODIFICAR: ALLOWED_KEYS → agenda, programas_exercicios, financas, app
└── database/seeders/
    └── PlanFeatureSeeder.php                   # NOVO: features (valores isolados) + planos + vínculos feature_plan

modules/Clinic/database/seeders/
├── ClinicUserSeeder.php                        # MODIFICAR: foto única nova; usuários extras seguem na clínica Premium
├── ClinicPatientDataSeeder.php                 # MODIFICAR (se necessário): escopo por plano
└── DashboardDemoSeeder.php                     # MODIFICAR: retarget de limit(2) para clínicas Performance+Premium

modules/Patient/database/seeders/
└── PatientDatabaseSeeder.php                   # MODIFICAR: foto única nova; volume por plano (Start: 1 paciente básico)

modules/Media/database/seeders/
└── VideoSeeder.php                             # MODIFICAR: 2 vídeos com filenames/thumbnails novos

modules/ClinicFinance/database/seeders/
└── FinancialDemoSeeder.php                     # MODIFICAR: retarget para clínicas Performance+Premium

resources/js/infrastructure/repositories/
└── mock-features.ts                            # MODIFICAR (opcional): remover video_call para manter mock coerente
```

**Structure Decision**: Seeder novo de planos/features fica em `modules/Admin/database/seeders/` (dados são do bounded context Admin); o `DatabaseSeeder` raiz orquestra e cria as clínicas (padrão já existente). Demo seeders passam a selecionar clínicas pelo plano (`whereHas('plan', ...)` ou por e-mail conhecido) em vez de `orderBy('id')->limit(2)`.

## Fase 0 — Research

Ver [research.md](./research.md). Decisões-chave: chaves das features (`agenda`, `programas_exercicios`, `financas`, `app`), remoção de `video_call` e placeholders com limpeza de registros órfãos, ordem de seed (features/planos antes das clínicas), e estratégia de retarget dos demo seeders por plano.

## Fase 1 — Design

- [data-model.md](./data-model.md): entidades e valores exatos semeados.
- [quickstart.md](./quickstart.md): validação com `migrate:fresh --seed` + reexecução para idempotência.

## Complexity Tracking

Sem violações — nenhuma entrada necessária.
