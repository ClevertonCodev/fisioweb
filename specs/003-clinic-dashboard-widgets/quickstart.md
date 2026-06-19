# Quickstart — Validação do Dashboard da Clínica

Guia para provar que a feature funciona ponta a ponta. Detalhes de schema em [data-model.md](./data-model.md); endpoints em [contracts/dashboard.md](./contracts/dashboard.md).

## Pré-requisitos

```bash
composer install && npm install
npm install chart.js react-chartjs-2     # nova dep do front (research §1)
# Após editar create_clinics_table e criar create_clinic_activities_table:
php artisan migrate:fresh --seed         # convenção dev (sem migrations incrementais)
composer run dev                         # Laravel + queue + Vite
```

## Dados de teste mínimos

Em uma clínica com `timezone` `America/Sao_Paulo`, crie via seeder/factory:
- 1 `admin` **que atende** (tem pacientes/consultas), 1 `secretary`, 2 `physiotherapist` (P1, P2).
- Pacientes em todos os status (incl. `obito`, `cancelado`, `alta` para validar exclusão), alguns com `birth_date` no mês corrente, vários `referral_source` (incl. nulo), distribuídos em 3 anos de `created_at`.
- Consultas de hoje (passadas e futuras, uma `cancelled`), divididas entre P1/P2/admin.
- Programas `active`/`completed`/`draft`, de pacientes ativos e inativos.

## Cenários de validação (mapeados a User Stories)

### US1 — Painel admin/secretário (P1)
1. Login admin → `GET /clinic/dashboard`.
   - **Esperado**: `cards.active_patients` = nº de pacientes com status ∉ {obito,cancelado,alta}; `appointments_today` = consultas de hoje não canceladas; `active_programs` conforme FR-008; `available_exercises.count`/`categories_count` preenchidos.
   - `upcoming_appointments` ≤ 5, ordenadas por horário, incluindo as já passadas de hoje.
2. Clique em cada **Ação rápida** → leva à tela correta; "Agendar consulta" abre o modal "Nova consulta" na Agenda (SC-005).

### US2 — Fisioterapeuta restrito (P1)
3. Login P1 → `GET /clinic/dashboard`.
   - **Esperado**: cards e listas contam **apenas** registros de P1. `viewer.can_view_activities=false`, `can_toggle_scope=false`.
4. `GET /clinic/dashboard/activities` como P1 → **403** (FR-023/SC-004).
5. `GET /clinic/dashboard/occupancy-rate?clinic_user_id=<P2>` como P1 → resposta volta para **P1** (param ignorado, FR-005/SC-004).

### US3 — Toggle do admin (P2)
6. Admin `GET /clinic/dashboard?scope=mine` → cards/listas contam só os registros do admin; `scope=clinic` (default) volta ao total. Secretário com `scope=mine` → ignorado (continua total).

### US4 — Taxa de ocupação (P2)
7. `GET /clinic/dashboard/occupancy-rate?granularity=daily&clinic_user_id=<P1>` → `buckets` = dias do mês; `occupied_rate ∈ [0,1]`. Repetir com `weekly` (12 semanas) e `monthly` (meses do ano) — eixos mudam (FR-019b, SC-007).
8. Validar cálculo: numa janela default (08–18, seg–sex = 10h/dia) com 5h de consultas num dia útil → `rate ≈ 0.5` naquele bucket.

### US5 — Aniversariantes + WhatsApp (P2)
9. `birthdays.items` ordenados por dia, escopados por papel; `can_message=false` quando paciente sem telefone; botão abre `https://wa.me/<phone>`.

### US6 — Captação 3 anos (P3)
10. `GET /clinic/dashboard/patient-acquisition` → `years=[corrente,−1,−2]`, `sources[].per_year` + `total` + `percent_total`; pacientes sem origem em `"Não informado"`; fisioterapeuta vê só os seus.

### US7 — Atividades recentes (P3)
11. Criar paciente, programa, concluir consulta → `GET /clinic/dashboard/activities` (admin) lista os 8 tipos relevantes, `created_at DESC`, com descrição e ator. Dia sem ações → `items: []` (empty state, FR-024).
12. Verificar gravação: cada ação dispara `ActivityLogger` no Service correspondente (research §11).

## Checagens não-funcionais
- **SC-003**: agregador responde e pinta cards/próximas consultas em ≤ 2 s.
- **SC-006**: forçar erro num sub-endpoint (ex.: ocupação) e confirmar que os demais widgets continuam renderizando (cada hook tem `queryKey` próprio).
- **SC-001**: nenhuma string/valor fixo remanescente em `DashboardPage.tsx` (mocks removidos).

## Testes automatizados a rodar
```bash
composer run test   # Feature: autorização por papel (US2/US4/US7), contagens (US1); Unit: OccupancyRateService, DashboardScope, ActivityLogger
npm run test        # hooks use-dashboard, repository mapping snake→camel, render de widgets (loading/empty/error)
npm run types && npm run lint
```
