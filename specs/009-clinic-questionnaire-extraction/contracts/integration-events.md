# Integration Events — Clinic Questionnaire

All events are `final readonly` with `version`, IDs, minimal snapshot, and `CarbonImmutable occurredAt`.

## QuestionnaireTemplateCreated

`version`, `templateId`, `clinicId`, `title`, `occurredAt`

## QuestionnaireSent

`version`, `patientQuestionnaireId`, `clinicId`, `patientId`, `clinicUserId`, `templateId`, `modality`, `status`, `expiresAt`, `occurredAt`

## QuestionnaireAnswered

`version`, `patientQuestionnaireId`, `clinicId`, `patientId`, `templateId`, `status`, `answeredAt`, `occurredAt`

## QuestionnaireExpired

`version`, `patientQuestionnaireId`, `clinicId`, `patientId`, `status`, `occurredAt`

## QuestionnaireCancelled

`version`, `patientQuestionnaireId`, `clinicId`, `patientId`, `status`, `occurredAt`

## Consumers

- `WhatsApp`: `QuestionnaireSent` → `SendQuestionnaireWhatsAppListener` (modality `remoto`)
