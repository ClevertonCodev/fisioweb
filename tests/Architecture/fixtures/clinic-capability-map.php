<?php

return [
    'rules' => [
        'clinic_module_prefix' => 'Clinic',
        'legacy_modules'       => [
            'Clinic',
        ],
        'reserved_admin_candidates' => [
            'AdminFinance',
        ],
    ],

    'capabilities' => [
        'finance' => [
            'module' => 'ClinicFinance',
            'status' => 'extracted',
            'owns'   => [
                'clinic_financial_categories',
                'clinic_financial_category_overrides',
                'clinic_financial_opening_balances',
                'clinic_financial_transactions',
            ],
            'routes' => [
                '/api/clinic/finances/*',
            ],
            'collaboration' => [
                'integration_events',
                'application_services',
                'read_models',
            ],
        ],
        'scheduling' => [
            'module' => 'ClinicScheduling',
            'status' => 'extracted',
            'owns'   => [
                'clinic_appointments',
            ],
            'routes' => [
                '/api/clinic/appointments/*',
            ],
            'collaboration' => [
                'integration_events',
                'application_services',
                'read_models',
            ],
        ],
        'care' => [
            'module' => 'ClinicCare',
            'status' => 'candidate',
            'owns'   => [
                'treatment_plans',
                'evolutions',
                'questionnaires',
                'clinical_files',
            ],
            'collaboration' => [
                'integration_events',
                'application_services',
                'read_models',
            ],
        ],
        'identity' => [
            'module' => 'ClinicIdentity',
            'status' => 'candidate',
            'owns'   => [
                'clinic_users',
                'clinic_roles',
                'clinic_profile',
            ],
            'collaboration' => [
                'application_services',
                'public_dtos',
            ],
        ],
        'dashboard' => [
            'module' => 'ClinicDashboard',
            'status' => 'candidate',
            'owns'   => [
                'dashboard_read_models',
                'clinic_kpis',
            ],
            'collaboration' => [
                'read_models',
                'integration_events',
            ],
        ],
    ],
];
