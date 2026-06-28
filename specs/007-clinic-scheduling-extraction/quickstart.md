# Quickstart — Validation Guide: Clinic Scheduling Extraction

Guia de validação end-to-end. Não contém implementação — apenas como provar que a extração está correta.

## Pré-requisitos

- `composer install && npm install` já feitos.
- `.env` configurado, DB local acessível.
- Após criar o módulo, rodar `composer dump-autoload` (registra PSR-4 de `Modules\ClinicScheduling`).

## 1. Módulo registrado

```bash
php artisan module:list            # ClinicScheduling deve aparecer habilitado
grep ClinicScheduling modules_statuses.json   # "ClinicScheduling": true
```
Esperado: módulo listado e habilitado; provider NÃO está em `bootstrap/providers.php`.

## 2. Rotas REST preservadas

```bash
php artisan route:list --path=clinic/appointments
```
Esperado: 6 rotas (`index, store, show, update, status, cancel`) com os mesmos paths/métodos de antes, e **action owner** em `Modules\ClinicScheduling\Http\Controllers\AppointmentController`. Nenhuma rota de appointments apontando para `Modules\Clinic`.

```bash
php artisan route:list --path=clinic | grep -i appointment   # nenhuma duplicada
```

## 3. Formatador

```bash
./vendor/bin/pint
```
Esperado: sem alterações pendentes / estilo conforme.

## 4. Fitness tests (arquitetura)

```bash
vendor/bin/phpunit tests/Architecture
```
Esperado (verde):
- `ModuleBoundaryTest`: `ClinicScheduling` não importa Models/Repositories privados de outros módulos.
- `ClinicScopedModuleNamingTest`: `scheduling` usa nome `ClinicScheduling` e o módulo existe em disco.
- `ExtractionReadinessTest`: migrations `clinic_appointments` vivem em `modules/ClinicScheduling` e não em `modules/Clinic`; readiness criteria presentes.

## 5. Testes do módulo

```bash
vendor/bin/phpunit modules/ClinicScheduling/tests
```
Esperado: todos os testes de agendamento (movidos de Clinic) + `SchedulingRouteCompatibilityTest` + testes de eventos passam, sem relaxar asserções de HTTP/JSON.

## 6. Migrate fresh + seed (local/dev)

```bash
php artisan migrate:fresh --seed
```
Esperado: sobe sem erro; tabela `clinic_appointments` criada a partir da migration em `modules/ClinicScheduling`; dados de agendamento populados (factory/seed).

## 7. Suíte completa (regressão)

```bash
composer run test
```
Esperado: verde — incluindo testes de GoogleCalendar (push/pull via listener) e Dashboard/Occupancy (via read model público).

## Critérios de aceite (mapeados à spec)

- SC-001/002/003: rotas, shapes e testes preservados; frontend sem mudança.
- SC-004: fitness tests verdes.
- SC-005: `migrate:fresh --seed` ok.
- SC-006: nenhum código de regra de agendamento remanescente em `Clinic` (grep por `AppointmentService`/`Appointment::` em `modules/Clinic/app` deve dar vazio, exceto adaptações via contrato público/listener).
- SC-007: cada caso de uso despacha seu evento afterCommit com snapshot mínimo.
