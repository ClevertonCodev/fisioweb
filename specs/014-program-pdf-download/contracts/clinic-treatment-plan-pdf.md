# Contract: Clinic Treatment Plan PDF Download

**Feature**: `014-program-pdf-download`  
**Module**: `TreatmentProgram`  
**Guard**: `clinic` (JWT)

## Endpoint

| Method | Path | Route name |
|--------|------|------------|
| GET | `/api/clinic/treatment-plans/{id}/pdf` | `clinic.treatment-plans.pdf` |

## Behavior

- **Auth**: `auth:clinic` obrigatório.
- **Authorization**: plano deve pertencer ao `clinic_id` do usuário autenticado; caso contrário **404** com mensagem já usada (`Plano de tratamento não encontrado.`).
- **Status**: qualquer status do plano que já seja visível na listagem/detalhe — sem filtro extra.
- **Success**: `200` com body PDF (`Content-Type: application/pdf`), `Content-Disposition: attachment` (filename slug do título).
- **Content requirements** (validáveis por inspeção do PDF):
  1. Capa: responsável (`clinicUser` foto/nome/document/email + telefone clinic fallback), QR “Acesse online” se houver paciente + slug, título, Para, tempo, período, Observações.
  2. Grupos/exercícios na ordem do plano; grupo sem nome → **Novo Grupo**; até 2 imagens `ExerciseMedia`.
  3. Até 3 páginas de anotações mensais (primeiros meses do período).

## QR URL (payload do código)

```
{APP_URL}/{clinic.slug}/paciente/programas/{id}
```

Omitir QR se `patient_id` nulo ou `clinic.slug` vazio.

## Eager load mínimo

`clinicUser`, `clinic`, `patient`, `groups.exercises.exercise.media`, `groups.exercises.exercise.videos`, e equivalentes flat `exercises.*` se usados.

## Errors

| Case | Status |
|------|--------|
| Não autenticado | 401 |
| Plano de outra clínica / inexistente | 404 |
| Falha DomPDF | 500 (mensagem genérica) |

## Frontend consumer

- `infrastructure/repositories/api-clinic-programs.ts` → `downloadPdf(id): Promise<Blob>`
- `application/clinic` helper espelhando `openEvolutionPdfInNewTab` / download blob
- UI: `ProgramDetailPage`, `ProgramHistoryTab` — ação habilitada
