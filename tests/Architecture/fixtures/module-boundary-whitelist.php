<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Module Boundary Whitelist
    |--------------------------------------------------------------------------
    |
    | Production code exceptions must be temporary and ADR-backed. Tests,
    | factories, and seeders may appear here when they need cross-module setup
    | objects during migration.
    |
    */
    'production' => [
        // Keep empty for ClinicFinance first phase. Add only with ADR + removal path.
    ],

    'non_production' => [
        [
            'path'      => 'modules/*/tests/**',
            'reason'    => 'Feature and unit tests may compose cross-module fixtures during migration.',
            'remove_by' => 'Review after ClinicFinance route ownership is complete.',
        ],
        [
            'path'      => 'modules/*/database/factories/**',
            'reason'    => 'Factories may compose aggregate setup across module boundaries.',
            'remove_by' => 'Review after module-owned factory contracts are introduced.',
        ],
        [
            'path'      => 'modules/*/database/seeders/**',
            'reason'    => 'Seeders may create demo data across module boundaries.',
            'remove_by' => 'Review after module-owned seeding contracts are introduced.',
        ],
    ],
];
