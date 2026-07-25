# Quickstart: Patient Program Experience

**Feature**: `015-patient-program-experience`  
Validação ponta a ponta após implementação (ver [contracts/patient-programs-rest.md](./contracts/patient-programs-rest.md) e [data-model.md](./data-model.md)).

## Prerequisites

- App local com `composer install` + `npm install`, `.env` com JWT
- `php artisan migrate:fresh --seed` (ou migrate + seeders TreatmentPlan/Patient)
- Paciente de seed com ao menos um `TreatmentPlan` `active` + `public_token` + grupos/exercícios
- Guard JWT `patient` funcional (`POST /api/patient/auth/login`)

## Backend validation

```bash
# Testes filtrados da feature (ajustar nome da classe após /speckit-tasks)
vendor/bin/phpunit --filter=PatientProgram

# Smoke manual (substituir TOKEN e PUBLIC_TOKEN)
export TOKEN=…
export PUBLIC_TOKEN=…

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/patient/programs | jq .

curl -s -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/patient/programs/$PUBLIC_TOKEN | jq .

curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/patient/programs/$PUBLIC_TOKEN/view | jq .

curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  http://localhost/api/patient/programs/$PUBLIC_TOKEN/executions | jq .

# series / unfinished / feedback / complete — ver contrato REST
```

### Expected outcomes

| Step | Expected |
|------|----------|
| Lista | Só planos do paciente logado; sem draft |
| Detalhe outro paciente | `404` |
| View 2× | Idempotente; detalhe ainda funciona se view falhar |
| Executions 2× | Mesmo `id`, `resumed: true` na segunda |
| Feedback com dimensão off | `422` |
| Feedback OK + complete | `patient_completed_count` +1; status FE `completed` |
| Complete 2× | `already_completed: true`; contador estável |
| Cross-clinic token | `404` |

## Frontend validation

```bash
npm run types
npm run test -- --filter=patient-program   # se houver testes
composer run dev                           # ou npm run dev + artisan serve
```

1. Login paciente da clínica do seed  
2. Abrir `/{clinicSlug}/paciente/programas` — lista real (sem mock)  
3. Deep link `/{clinicSlug}/paciente/programas/{publicToken}` — detalhe  
4. Iniciar exercícios → registrar carga → (opcional) não finalizados → feedback → conclusão → sucesso  
5. Confirmar que `apiClient` envia Bearer do guard `patient` em `/api/patient/*`

## Architecture checklist (manual review)

- [ ] Nenhum `use Modules\TreatmentProgram\Models` em `modules/Patient`
- [ ] Controllers patient sem `DB::` / Eloquent direto
- [ ] UseCases em `Services/PatientProgram/*` com RepositoryInterface
- [ ] Pages FE sem import de `apiClient`
