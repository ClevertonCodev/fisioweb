# Quickstart — Validation Guide: Clinical Record Extraction

Guia de validação end-to-end. Implementação detalhada fica em `tasks.md`.

## Pré-requisitos

- `composer install` concluído.
- `.env` com DB local.
- Após criar o módulo: `composer dump-autoload`.

## 1. Módulo registrado

```bash
php artisan module:list
grep ClinicalRecord modules_statuses.json
```

Esperado: módulo habilitado; provider **não** em `bootstrap/providers.php`.

## 2. Rotas REST preservadas

```bash
php artisan route:list --path=clinic/assessments
php artisan route:list --path=clinic/evolutions
php artisan route:list --path=clinic/evolution-templates
php artisan route:list --path=clinic/assessment-templates
php artisan route:list --path=clinic/patients
```

Esperado: rotas de prontuário com owners em `Modules\ClinicalRecord\Http\Controllers\*`. Nenhuma rota de prontuário apontando para `Modules\Clinic\Http\Controllers\{Assessment,Evolution,PatientFile,EvolutionTemplate,SharedAssessmentTemplate}*`.

```bash
php artisan route:list --path=clinic | grep -E 'assessment|evolution|files'
```

Esperado: sem duplicatas.

## 3. Formatador

```bash
./vendor/bin/pint
```

## 4. Fitness tests (arquitetura)

```bash
vendor/bin/phpunit tests/Architecture
```

Esperado:

- `ModuleBoundaryTest`: `ClinicalRecord` sem imports privados cross-module em produção.
- `ExtractionReadinessTest`: migrations de prontuário em `modules/ClinicalRecord/database/migrations`, ausentes em `modules/Clinic/database/migrations`.
- Capability map: `clinical_record` → `extracted`.

## 5. Testes do módulo

```bash
vendor/bin/phpunit modules/ClinicalRecord/tests
```

Esperado: Feature (PatientFile, routes compatibility), Unit (policies, events), todos verdes sem relaxar asserções HTTP/JSON.

## 6. Migrate fresh + seed

```bash
php artisan migrate:fresh --seed
```

Esperado: 9 tabelas de prontuário criadas; `EvolutionTemplateSeeder` popula template sistema; `ClinicPatientDataSeeder` popula assessments/evolutions/files demo.

## 7. Suíte completa

```bash
composer run test
```

## 8. Documentação

Verificar existência/atualização:

- `docs/adr/009-clinical-record-extraction.md`
- `docs/architecture/clinic-capability-map.md`
- `docs/architecture/extraction-readiness-checklist.md`

## Critérios de aceite (spec)

| ID | Validação |
|----|-----------|
| SC-001/002 | route:list + frontend inalterado |
| SC-003 | `modules/ClinicalRecord/tests` verde |
| SC-004 | `tests/Architecture` verde |
| SC-005 | migrate:fresh --seed ok |
| SC-006 | grep vazio por regra de prontuário em `modules/Clinic/app` (exceto seeders adaptados) |
| SC-007 | testes de eventos afterCommit |
| SC-008 | fluxo manual: criar avaliação → assinar → evolução → anexar arquivo |
