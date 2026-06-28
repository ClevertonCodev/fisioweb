<?php

return [
    'required_criteria' => [
        'data_ownership',
        'public_contracts',
        'integration_events',
        'idempotency',
        'transaction_boundaries',
        'outbox_inbox_readiness',
        'observability',
    ],

    'modules' => [
        'ClinicFinance' => [
            'target'   => 'future_microservice',
            'criteria' => [
                'data_ownership' => [
                    'status'    => 'partial',
                    'evidence'  => 'Financial code owns clinic_financial_* behavior; historical migrations still live under modules/Clinic/database/migrations.',
                    'next_step' => 'Move future finance migrations to ClinicFinance and keep Clinic from writing clinic_financial_* tables.',
                ],
                'public_contracts' => [
                    'status'    => 'partial',
                    'evidence'  => 'REST contract and internal DTO directory exist; no external service API is versioned yet.',
                    'next_step' => 'Version application service contracts before distributed extraction.',
                ],
                'integration_events' => [
                    'status'    => 'ready',
                    'evidence'  => 'ClinicFinance publishes versioned event classes with IDs, minimal snapshots, and occurredAt.',
                    'next_step' => 'Add consumers only through listeners that call their own module services.',
                ],
                'idempotency' => [
                    'status'    => 'deferred',
                    'evidence'  => 'No distributed consumers exist yet.',
                    'next_step' => 'Add event IDs and inbox deduplication before asynchronous cross-service consumers.',
                ],
                'transaction_boundaries' => [
                    'status'    => 'partial',
                    'evidence'  => 'Write services centralize financial mutations inside ClinicFinance.',
                    'next_step' => 'Introduce explicit after-commit/outbox publishing for distributed delivery.',
                ],
                'outbox_inbox_readiness' => [
                    'status'    => 'deferred',
                    'evidence'  => 'Laravel events are local-process integration events today.',
                    'next_step' => 'Add outbox, inbox, retries, dead-letter handling, and replay tooling.',
                ],
                'observability' => [
                    'status'    => 'deferred',
                    'evidence'  => 'No module-level correlation IDs or event delivery dashboards yet.',
                    'next_step' => 'Add structured logs, trace IDs, metrics, and alerting before extraction.',
                ],
            ],
        ],
    ],
];
