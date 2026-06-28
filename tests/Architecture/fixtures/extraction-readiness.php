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
                    'status'    => 'ready',
                    'evidence'  => 'Financial code and clinic_financial_* migrations live under modules/ClinicFinance; Clinic must not write clinic_financial_* tables.',
                    'next_step' => 'Keep future finance migrations in ClinicFinance and prevent Clinic from reintroducing finance writes.',
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

        'ClinicScheduling' => [
            'target'   => 'future_microservice',
            'criteria' => [
                'data_ownership' => [
                    'status'    => 'ready',
                    'evidence'  => 'Appointment code and the clinic_appointments migration live under modules/ClinicScheduling; Clinic no longer owns scheduling rules.',
                    'next_step' => 'Keep future scheduling migrations in ClinicScheduling and prevent Clinic from reintroducing appointment writes.',
                ],
                'public_contracts' => [
                    'status'    => 'partial',
                    'evidence'  => 'REST contract preserved and SchedulingReadServiceInterface exposes a read model; no external service API is versioned yet.',
                    'next_step' => 'Version the public read/write service contracts before distributed extraction.',
                ],
                'integration_events' => [
                    'status'    => 'ready',
                    'evidence'  => 'ClinicScheduling publishes versioned Scheduled/Rescheduled/Cancelled/Completed events with IDs, minimal snapshots, and occurredAt.',
                    'next_step' => 'Add consumers only through listeners that call their own module services (GoogleCalendar and ActivityLog already do).',
                ],
                'idempotency' => [
                    'status'    => 'deferred',
                    'evidence'  => 'No distributed consumers exist yet; listeners run in-process.',
                    'next_step' => 'Add event IDs and inbox deduplication before asynchronous cross-service consumers.',
                ],
                'transaction_boundaries' => [
                    'status'    => 'partial',
                    'evidence'  => 'Write service centralizes appointment mutations and dispatches events via DB::afterCommit.',
                    'next_step' => 'Introduce explicit outbox publishing for distributed delivery.',
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
