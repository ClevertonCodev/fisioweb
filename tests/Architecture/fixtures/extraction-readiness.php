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

        'ClinicalRecord' => [
            'target'   => 'future_microservice',
            'criteria' => [
                'data_ownership' => [
                    'status'    => 'ready',
                    'evidence'  => 'Clinical record code and clinic_* prontuario migrations now live under modules/ClinicalRecord.',
                    'next_step' => 'Keep future clinical record migrations and writes in ClinicalRecord only.',
                ],
                'public_contracts' => [
                    'status'    => 'partial',
                    'evidence'  => 'ClinicalRecord consumes Admin AssessmentTemplateReadServiceInterface and keeps REST contract compatibility.',
                    'next_step' => 'Version public read contracts if external consumers appear.',
                ],
                'integration_events' => [
                    'status'    => 'ready',
                    'evidence'  => 'ClinicalRecord publishes six versioned events for assessment/evolution/patient-file mutations.',
                    'next_step' => 'Add listeners only through module services and contracts.',
                ],
                'idempotency' => [
                    'status'    => 'deferred',
                    'evidence'  => 'Events are in-process and do not yet require distributed deduplication.',
                    'next_step' => 'Add event IDs and inbox deduplication before async distributed consumers.',
                ],
                'transaction_boundaries' => [
                    'status'    => 'partial',
                    'evidence'  => 'Write services centralize mutations and publish events via DB::afterCommit.',
                    'next_step' => 'Introduce outbox publishing before service extraction.',
                ],
                'outbox_inbox_readiness' => [
                    'status'    => 'deferred',
                    'evidence'  => 'Outbox/inbox infrastructure is not required while events are local.',
                    'next_step' => 'Add outbox, inbox, retry, dead-letter and replay tooling before extraction.',
                ],
                'observability' => [
                    'status'    => 'deferred',
                    'evidence'  => 'No module-level tracing/event-delivery dashboard exists yet.',
                    'next_step' => 'Add structured logs, metrics and alerts before extraction.',
                ],
            ],
        ],

        'ClinicQuestionnaire' => [
            'target'   => 'future_microservice',
            'criteria' => [
                'data_ownership' => [
                    'status'    => 'ready',
                    'evidence'  => 'Questionnaire code and clinic_questionnaire_* migrations live under modules/ClinicQuestionnaire.',
                    'next_step' => 'Keep future questionnaire migrations and writes in ClinicQuestionnaire only.',
                ],
                'public_contracts' => [
                    'status'    => 'partial',
                    'evidence'  => 'REST contract preserved; PatientServiceInterface used for patient ownership checks.',
                    'next_step' => 'Version public service contracts if external consumers appear.',
                ],
                'integration_events' => [
                    'status'    => 'ready',
                    'evidence'  => 'ClinicQuestionnaire publishes five versioned events (template created, sent, answered, expired, cancelled).',
                    'next_step' => 'Add consumers only through listeners in their own modules (WhatsApp already listens to QuestionnaireSent).',
                ],
                'idempotency' => [
                    'status'    => 'deferred',
                    'evidence'  => 'Events are in-process and do not yet require distributed deduplication.',
                    'next_step' => 'Add event IDs and inbox deduplication before async distributed consumers.',
                ],
                'transaction_boundaries' => [
                    'status'    => 'partial',
                    'evidence'  => 'Write services centralize mutations and publish events via DB::afterCommit.',
                    'next_step' => 'Introduce outbox publishing before service extraction.',
                ],
                'outbox_inbox_readiness' => [
                    'status'    => 'deferred',
                    'evidence'  => 'Outbox/inbox infrastructure is not required while events are local.',
                    'next_step' => 'Add outbox, inbox, retry, dead-letter and replay tooling before extraction.',
                ],
                'observability' => [
                    'status'    => 'deferred',
                    'evidence'  => 'No module-level tracing/event-delivery dashboard exists yet.',
                    'next_step' => 'Add structured logs, metrics and alerts before extraction.',
                ],
            ],
        ],
    ],
];
