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
        'clinical_record' => [
            'module' => 'ClinicalRecord',
            'status' => 'extracted',
            'owns'   => [
                'clinic_assessments',
                'clinic_assessment_answers',
                'clinic_assessment_answer_options',
                'clinic_evolution_templates',
                'clinic_evolution_template_sections',
                'clinic_evolution_template_items',
                'clinic_patient_evolutions',
                'clinic_patient_evolution_checked_items',
                'clinic_patient_files',
            ],
            'routes' => [
                '/api/clinic/patients/*/assessments*',
                '/api/clinic/patients/*/evolutions*',
                '/api/clinic/patients/*/files*',
                '/api/clinic/assessments/*',
                '/api/clinic/evolutions/*',
                '/api/clinic/evolution-templates/*',
                '/api/clinic/assessment-templates/*',
            ],
            'collaboration' => [
                'integration_events',
                'application_services',
                'read_models',
            ],
        ],
        'questionnaire' => [
            'module' => 'ClinicQuestionnaire',
            'status' => 'extracted',
            'owns'   => [
                'clinic_questionnaire_templates',
                'clinic_questionnaire_sections',
                'clinic_questionnaire_questions',
                'clinic_patient_questionnaires',
                'clinic_patient_questionnaire_answers',
            ],
            'routes' => [
                '/api/clinic/questionnaire-templates/*',
                '/api/clinic/patients/*/questionnaires*',
                '/api/questionnaires/*',
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
