<?php

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Support\Str;
use Modules\Admin\Models\Plan;
use Modules\Admin\Models\User as Operator;
use Modules\Clinic\Models\Clinic;
use Modules\Clinic\Models\ClinicUser;
use Modules\Patient\Models\Patient;

const USAGE = <<<'TXT'
Uso (no checkout principal: php ...; numa worktree: fisio-app exec php ...):
  php tools/playwright/qa-mestre/usuarios.php clinica       --clinica <id> --alvo <alvo> [--papeis administrador,fisioterapeuta,secretaria]
  php tools/playwright/qa-mestre/usuarios.php outra-clinica --alvo <alvo> [--plano Premium] [--n 1]
  php tools/playwright/qa-mestre/usuarios.php pacientes     --clinica <id> --alvo <alvo> [--quantos 1]
  php tools/playwright/qa-mestre/usuarios.php operador      --alvo <alvo>
  php tools/playwright/qa-mestre/usuarios.php limpar        --alvo <alvo>

<alvo> é a tarefa ou "feature" (ex.: 003-papel-secretaria), o mesmo da pasta qa/<alvo>/.
Tudo é idempotente: rodar de novo reativa e troca a senha, sem duplicar.
Só grava o que tem e-mail qa-<alvo>--*@exemplo.test. Nunca roda em produção.

TXT;

const EMAIL_DOMAIN = 'exemplo.test';

$root = dirname(__DIR__, 3);
chdir($root);
require $root . '/vendor/autoload.php';
$app = require $root . '/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

const ROLES = [
    'administrador'  => ClinicUser::ROLE_ADMIN,
    'fisioterapeuta' => ClinicUser::ROLE_PHYSIOTHERAPIST,
    'secretaria'     => ClinicUser::ROLE_SECRETARY,
];

if (app()->isProduction()) {
    fwrite(STDERR, "Recusado: APP_ENV=production. Os usuários QA são só para o ambiente local.\n");
    exit(1);
}

/**
 * @param  list<string>  $argv
 * @return array{command: string, options: array<string, string>}
 */
function parseArguments(array $argv): array
{
    $command = $argv[1] ?? '';
    $options = [];
    for ($i = 2; $i < count($argv); $i++) {
        if (!str_starts_with($argv[$i], '--')) {
            fail("Argumento inesperado: {$argv[$i]}");
        }
        $options[substr($argv[$i], 2)] = (string) ($argv[++$i] ?? '');
    }

    return ['command' => $command, 'options' => $options];
}

function fail(string $message): never
{
    fwrite(STDERR, $message . "\n\n" . USAGE);
    exit(1);
}

/**
 * @param  array<string, string>  $options
 */
function option(array $options, string $name, ?string $default = null): string
{
    $value = $options[$name] ?? $default;
    if (is_null($value) || $value === '') {
        fail("Falta --{$name}.");
    }

    return $value;
}

function targetSlug(string $target): string
{
    $slug = Str::slug($target);

    return empty($slug) ? fail('O --alvo ficou vazio depois de limpar os caracteres.') : $slug;
}

function qaEmail(string $target, string $suffix): string
{
    return 'qa-' . targetSlug($target) . '--' . $suffix . '@' . EMAIL_DOMAIN;
}

function qaEmailPattern(string $target): string
{
    return 'qa-' . targetSlug($target) . '--%@' . EMAIL_DOMAIN;
}

function disposablePassword(): string
{
    return 'Qa-' . bin2hex(random_bytes(4)) . '-9!';
}

function clinic(string $id): Clinic
{
    $clinic = Clinic::find((int) $id);
    if (is_null($clinic)) {
        $list = Clinic::query()->orderBy('id')->get(['id', 'name'])
            ->map(fn (Clinic $c) => "{$c->id} {$c->name}")->implode(', ');
        fail("Clínica {$id} não existe. Clínicas: {$list}");
    }

    return $clinic;
}

/**
 * @param  list<int>  $weights
 */
function checkDigit(string $base, array $weights): int
{
    $sum = 0;
    foreach (str_split($base) as $i => $digit) {
        $sum += (int) $digit * $weights[$i];
    }
    $rest = $sum % 11;

    return $rest < 2 ? 0 : 11 - $rest;
}

function validCpf(): string
{
    do {
        $base = str_pad((string) random_int(1, 999999999), 9, '0', STR_PAD_LEFT);
    } while (count(array_unique(str_split($base))) === 1);
    $base .= checkDigit($base, [10, 9, 8, 7, 6, 5, 4, 3, 2]);

    return $base . checkDigit($base, [11, 10, 9, 8, 7, 6, 5, 4, 3, 2]);
}

function validCnpj(): string
{
    $base = str_pad((string) random_int(1, 99999999), 8, '0', STR_PAD_LEFT) . '0001';
    $base .= checkDigit($base, [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

    return $base . checkDigit($base, [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
}

/**
 * @return array<string, mixed>
 */
function saveClinicUser(Clinic $clinic, string $email, string $name, string $role, bool $master): array
{
    $password = disposablePassword();
    $user     = ClinicUser::withTrashed()->firstOrNew(['email' => $email]);
    if ($user->exists && $user->clinic_id !== $clinic->id) {
        fail("{$email} já existe na clínica {$user->clinic_id}. Use outro --alvo.");
    }
    $user->fill([
        'clinic_id'         => $clinic->id,
        'name'              => $name,
        'password'          => $password,
        'role'              => $role,
        'mestre'            => $master ? ClinicUser::MESTRE_YES : ClinicUser::MESTRE_NO,
        'status'            => ClinicUser::STATUS_ACTIVE,
        'email_verified_at' => now(),
        'terms_accepted_at' => now(),
    ]);
    $user->save();
    if ($user->trashed()) {
        $user->restore();
    }

    return [
        'tipo'     => 'usuário da clínica',
        'papel'    => ClinicUser::ROLES[$role],
        'mestre'   => $master,
        'clinica'  => ['id' => $clinic->id, 'nome' => $clinic->name, 'slug' => $clinic->slug],
        'login'    => $email,
        'senha'    => $password,
        'entrar'   => '/clinica/login',
    ];
}

/**
 * @param  array<string, string>  $options
 * @return list<array<string, mixed>>
 */
function createClinicUsers(array $options): array
{
    $clinic = clinic(option($options, 'clinica'));
    $target = option($options, 'alvo');
    $roles  = array_map('trim', explode(',', $options['papeis'] ?? implode(',', array_keys(ROLES))));

    $created = [];
    foreach ($roles as $role) {
        if (!array_key_exists($role, ROLES)) {
            fail("Papel \"{$role}\" não existe. Use: " . implode(', ', array_keys(ROLES)) . '.');
        }
        $created[] = saveClinicUser(
            $clinic,
            qaEmail($target, $role),
            'QA ' . $target . ' ' . ClinicUser::ROLES[ROLES[$role]],
            ROLES[$role],
            false,
        );
    }

    return $created;
}

/**
 * @param  array<string, string>  $options
 * @return list<array<string, mixed>>
 */
function createOtherClinic(array $options): array
{
    $target   = option($options, 'alvo');
    $number   = (int) option($options, 'n', '1');
    $planName = option($options, 'plano', 'Premium');
    $plan     = Plan::query()->where('name', $planName)->first();
    if (is_null($plan)) {
        fail("Plano \"{$planName}\" não existe. Planos: " . Plan::query()->pluck('name')->implode(', '));
    }

    $email                          = qaEmail($target, "clinica{$number}");
    $clinic                         = Clinic::withTrashed()->firstOrNew(['email' => $email]);
    $clinic->skipMasterUserObserver = true;
    $clinic->fill([
        'name'    => "QA {$target} Clínica {$number}",
        'slug'    => 'qa-' . targetSlug($target) . "-c{$number}",
        'plan_id' => $plan->id,
        'status'  => Clinic::STATUS_ACTIVE,
    ]);
    if (!$clinic->exists) {
        $clinic->document    = validCnpj();
        $clinic->type_person = Clinic::TYPE_PERSON_JURIDICA;
    }
    $clinic->save();
    if ($clinic->trashed()) {
        $clinic->restore();
    }

    $admin          = saveClinicUser($clinic, $email, "QA {$target} Administrador {$number}", ClinicUser::ROLE_ADMIN, true);
    $admin['plano'] = $plan->name;

    return [$admin];
}

/**
 * @param  array<string, string>  $options
 * @return list<array<string, mixed>>
 */
function createPatients(array $options): array
{
    $clinic = clinic(option($options, 'clinica'));
    $target = option($options, 'alvo');
    $count  = max(1, (int) option($options, 'quantos', '1'));

    $created = [];
    for ($n = 1; $n <= $count; $n++) {
        $email   = qaEmail($target, "paciente{$n}");
        $patient = Patient::withTrashed()->firstOrNew(['email' => $email, 'clinic_id' => $clinic->id]);
        $cpf     = $patient->cpf ?: validCpf();
        $patient->fill([
            'name'      => "QA Paciente {$n}",
            'cpf'       => $cpf,
            'password'  => $cpf,
            'is_active' => true,
            'status'    => null,
        ]);
        $patient->save();
        if ($patient->trashed()) {
            $patient->restore();
        }
        $created[] = [
            'tipo'    => 'paciente',
            'clinica' => ['id' => $clinic->id, 'nome' => $clinic->name, 'slug' => $clinic->slug],
            'nome'    => $patient->name,
            'login'   => $cpf,
            'senha'   => $cpf,
            'entrar'  => '/paciente/login',
        ];
    }

    return $created;
}

/**
 * @param  array<string, string>  $options
 * @return list<array<string, mixed>>
 */
function createOperator(array $options): array
{
    $target   = option($options, 'alvo');
    $email    = qaEmail($target, 'operador');
    $password = disposablePassword();
    Operator::query()->updateOrCreate(
        ['email' => $email],
        ['name' => "QA {$target} Operador", 'password' => $password],
    );

    return [[
        'tipo'   => 'operador do admin',
        'login'  => $email,
        'senha'  => $password,
        'entrar' => '/admin/login',
    ]];
}

/**
 * @param  array<string, string>  $options
 * @return array<string, int>
 */
function cleanUp(array $options): array
{
    $pattern = qaEmailPattern(option($options, 'alvo'));

    return [
        'usuarios_da_clinica_excluidos' => ClinicUser::query()->where('email', 'like', $pattern)->get()
            ->each(function (ClinicUser $user): void {
                $user->update(['status' => ClinicUser::STATUS_INACTIVE]);
                $user->delete();
            })->count(),
        'pacientes_excluidos'   => Patient::query()->where('email', 'like', $pattern)->get()->each->delete()->count(),
        'clinicas_excluidas'    => Clinic::query()->where('email', 'like', $pattern)->get()->each->delete()->count(),
        'operadores_apagados'   => Operator::query()->where('email', 'like', $pattern)->get()->each->delete()->count(),
    ];
}

['command' => $command, 'options' => $options] = parseArguments($argv);

$result = match ($command) {
    'clinica'       => createClinicUsers($options),
    'outra-clinica' => createOtherClinic($options),
    'pacientes'     => createPatients($options),
    'operador'      => createOperator($options),
    'limpar'        => cleanUp($options),
    default         => fail($command === '' ? 'Falta o comando.' : "Comando \"{$command}\" não existe."),
};

echo json_encode($result, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) . "\n";
