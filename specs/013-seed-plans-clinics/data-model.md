# Data Model: Seeds — Funcionalidades, Planos, Clínicas e Mídias

Nenhuma migração de schema. Apenas dados semeados nas tabelas existentes.

## admin_features (`Modules\Admin\Models\Feature`)

| key | name | value_isolated | type |
|-----|------|---------------|------|
| `agenda` | Agenda | 10.00 | bool |
| `programas_exercicios` | Programas e Exercícios | 15.00 | bool |
| `financas` | Finanças | 5.00 | bool |
| `app` | App | 20.00 | bool |

- `ALLOWED_KEYS` do model passa a conter exatamente essas 4 chaves (remove `video_call` e `teste1..10`).
- Seed remove registros com chaves fora do conjunto, incluindo vínculos `admin_feature_plans` associados.
- Idempotência: `updateOrCreate(['key' => ...])`.

## admin_plans (`Modules\Admin\Models\Plan`)

| name | type_charge | value_month | value_year |
|------|-------------|-------------|------------|
| Start | `por_usuario` | 20.00 | 15.00 |
| Performance | `por_usuario` | 30.00 | 25.00 |
| Premium | `por_usuario` | 40.00 | 35.00 |

- Idempotência: `updateOrCreate(['name' => ...])`.

## admin_feature_plans (`Modules\Admin\Models\FeaturePlan`)

| Plano | Funcionalidades vinculadas |
|-------|---------------------------|
| Start | (nenhuma) |
| Performance | agenda, programas_exercicios, financas |
| Premium | agenda, programas_exercicios, financas, app |

- Seed sincroniza os vínculos (remove os que não pertencem mais ao plano).

## clinics (`Modules\Clinic\Models\Clinic`)

| name | email (chave natural) | document | plan |
|------|----------------------|----------|------|
| Clínica Cleverton | `clevertonsantoscodev@gmail.com` (mantido) | 856.283.250-23 | Premium |
| Clínica Start | `start@fisioweb.local` | 726.868.590-40 | Start |
| Clínica Performance | `performance@fisioweb.local` | 74.760.866/0001-37 | Performance |

- `plan_id` resolvido por nome do plano; formato do documento segue o padrão de armazenamento vigente.

## clinic_users

- 1 admin por clínica nova: mesmo e-mail da clínica, `role=admin`, `mestre=yes`, `status=active`, senha `12345678`.
- Usuários extras de demonstração (ClinicUserSeeder) permanecem na clínica Premium; fotos com a URL única nova.

## Volume de dados de demonstração por clínica

| Clínica | Pacientes | Agenda/Dashboard | Financeiro | Programas/Prontuários |
|---------|-----------|------------------|------------|----------------------|
| Premium | massa completa (50) | sim | sim | sim |
| Performance | sim | sim | sim | sim (módulos do plano) |
| Start | 1 paciente básico | não | não | não |

## Mídias

- **Foto única** (pacientes + clinic users): `patients/photos/2cc94b05-8e9c-465a-b42a-6c40b473bf59_1783781535.png` (URL completa = `{cdn}/…`).
- **Vídeos** (`media_videos`, ids 1 e 2 preservados — referenciados por `ExerciseSeeder`):

| Vídeo | filename (path `videos/`) | thumbnail (path `thumbnails/videos/`) |
|-------|--------------------------|----------------------------------------|
| 1 | `bf6fd593-97ff-4bc2-be31-469a5e0a6c00_1783782291.mp4` | `31fa195c-d9f5-49e6-bb57-78da4d32b932_1783558953.png` |
| 2 | `7cb1e772-ea99-4564-9478-82198e60d9eb_1783558952.mp4` | `139645c7-fa38-4679-a24c-2c3113a8fecc_1783782292.jpeg` |

- URLs completas montadas com `config('cloudflare.cdn_url')` (default `https://pub-c505783a14d2470eb49d00e4e17df019.r2.dev`).
