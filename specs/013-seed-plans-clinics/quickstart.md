# Quickstart: Validação dos Seeds

## Pré-requisitos

- `.env` configurado com banco de desenvolvimento (nunca produção — seeders demo têm guarda `isProduction`).
- Dependências instaladas (`composer install`).

## Rodar

```bash
php artisan migrate:fresh --seed
```

## Validar (tinker ou SQL)

```bash
php artisan tinker
```

```php
// Funcionalidades: 4 registros, valores 10/15/5/20
Modules\Admin\Models\Feature::pluck('value_isolated', 'key');
// => ['agenda' => 10.00, 'programas_exercicios' => 15.00, 'financas' => 5.00, 'app' => 20.00]

// Planos: 3, por usuário, valores corretos
Modules\Admin\Models\Plan::get(['name', 'type_charge', 'value_month', 'value_year']);

// Vínculos: Start=0, Performance=3, Premium=4
Modules\Admin\Models\Plan::withCount('featurePlans')->pluck('feature_plans_count', 'name');

// Clínicas: 3, cada uma com plano e documento corretos
Modules\Clinic\Models\Clinic::with('plan:id,name')->get(['id', 'name', 'email', 'document', 'plan_id']);

// Fotos: todas com a URL única nova
Modules\Patient\Models\Patient::whereNotNull('photo_url')->where('photo_url', 'not like', '%2cc94b05%')->count(); // => 0
Modules\Clinic\Models\ClinicUser::whereNotNull('photo_url')->where('photo_url', 'not like', '%2cc94b05%')->count(); // => 0

// Vídeos: 2, com novos arquivos/thumbnails, ids 1 e 2 preservados
Modules\Media\Models\Video::get(['id', 'filename', 'thumbnail_path']);
```

## Idempotência

```bash
php artisan db:seed   # segunda execução
```

Repetir as consultas: contagens de features (4), planos (3), clínicas (3) e vídeos (2) não mudam.

## Testes e lint

```bash
composer run test
./vendor/bin/pint
```

## Expectativas de UI (spot-check)

- Login admin → planos/funcionalidades listados com os novos valores.
- Login `start@fisioweb.local` / `12345678` → clínica quase vazia (1 paciente).
- Login clínica Cleverton → massa completa; fotos e thumbnails carregando do R2.
