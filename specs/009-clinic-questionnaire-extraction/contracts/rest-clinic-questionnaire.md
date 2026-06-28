# REST Contract — Clinic Questionnaire

Preserved paths (unchanged):

| Method | Path |
|--------|------|
| GET | `/api/clinic/questionnaire-templates` |
| POST | `/api/clinic/questionnaire-templates` |
| GET | `/api/clinic/questionnaire-templates/{id}` |
| PUT | `/api/clinic/questionnaire-templates/{id}` |
| DELETE | `/api/clinic/questionnaire-templates/{id}` |
| GET | `/api/clinic/patients/{patient}/questionnaires` |
| POST | `/api/clinic/patients/{patient}/questionnaires` |
| GET | `/api/clinic/patients/{patient}/questionnaires/{questionnaire}` |
| DELETE | `/api/clinic/patients/{patient}/questionnaires/{questionnaire}` |
| GET | `/api/questionnaires/{id}` |
| POST | `/api/questionnaires/{id}/answer` |

Response envelope: `{ "data": ... }` for reads/creates; `{ "message": ... }` for deletes.
