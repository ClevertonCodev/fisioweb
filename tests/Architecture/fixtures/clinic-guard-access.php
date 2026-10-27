<?php

/**
 * Trechos usados por ClinicGuardAccessTest para provar que a varredura detecta
 * acesso direto ao guard `clinic` (e não confunde com outros guards).
 */
return [
    'violations' => [
        "\$user = Auth::guard('clinic')->user();",
        '$id = Auth::guard("clinic")->id();',
        "\$token = auth('clinic')->login(\$user);",
        "\$user = auth()->guard('clinic')->user();",
        "\$user = \$request->user('clinic');",
        "\$user = request()->user( 'clinic' );",
    ],
    'allowed' => [
        '$user = $this->clinicUser();',
        '$clinicId = $this->clinicId();',
        "\$admin = Auth::guard('admin')->user();",
        "\$patient = auth('patient')->user();",
        '// comentário citando a palavra clinic e o método guard',
    ],
];
