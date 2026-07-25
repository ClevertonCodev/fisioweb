# Quickstart: Patient Program Experience

**Feature**: `015-patient-program-experience`  
Validação ponta a ponta após implementação (ver [contracts/patient-programs-rest.md](./contracts/patient-programs-rest.md) e [data-model.md](./data-model.md)).

## Prerequisites

- App local com `composer install` + `npm install`, `.env` com JWT
- `php artisan migrate:fresh --seed` (ou migrate + seeders TreatmentPlan/Patient)
- Paciente de seed com ao menos um `TreatmentPlan` `active` + `public_token` + grupos/exercícios + clínica com `slug`
- Guard JWT `patient` funcional (`POST /api/patient/auth/login`)

## Backend validation

```bash
# Testes filtrados da feature
vendor/bin/phpunit --filter=PatientProgram

# Smoke manual
export TOKEN=…           # JWT patient (só para rotas autenticadas)
export PUBLIC_TOKEN=…
export CLINIC_SLUG=…     # ex. clinica-cleverton
export APP_URL=http://localhost:8000

# Detalhe PÚBLICO — sem Bearer (SC-002)
curl -s "$APP_URL/api/patient/programs/$PUBLIC_TOKEN" | jq .

# Lista — exige auth
curl -s -H "Authorization: Bearer $TOKEN" \
  "$APP_URL/api/patient/programs" | jq .

# View / execução — exige auth
curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  "$APP_URL/api/patient/programs/$PUBLIC_TOKEN/view" | jq .

curl -s -X POST -H "Authorization: Bearer $TOKEN" \
  "$APP_URL/api/patient/programs/$PUBLIC_TOKEN/executions" | jq .

# series / unfinished / feedback / complete — ver contrato REST
```

### Expected outcomes

| Step | Expected |
|------|----------|
| GET detalhe **sem** Bearer | `200` com dados do programa (token válido, não-draft) |
| GET detalhe token inválido / draft | `404` |
| Lista | Só planos do paciente logado; sem draft; sem JWT → `401` |
| View / executions / feedback / complete sem JWT | `401` |
| View 2× (autenticado) | Idempotente; detalhe ainda funciona se view falhar (SC-005 — manual/FE) |
| Executions 2× | Mesmo `id`, `resumed: true` na segunda |
| Feedback com dimensão off | `422` |
| Feedback OK + complete | `patient_completed_count` +1; status FE `completed` |
| Complete 2× | `already_completed: true`; contador estável |
| Cross-patient/cross-clinic em **escritas**/lista | `404` |
| Share URL clínica | `$APP_URL/$CLINIC_SLUG/paciente/programas/$PUBLIC_TOKEN` |

## Frontend validation

```bash
npm run types
npm run test -- --filter=patient-program   # se houver testes
composer run dev                           # ou npm run dev + artisan serve
```

1. **Sem login**: abrir `$APP_URL/$CLINIC_SLUG/paciente/programas/$PUBLIC_TOKEN` → redireciona para `/detalhe-programa?id=$PUBLIC_TOKEN` e mostra o programa  
2. Na clínica: “Copiar o link do programa” → clipboard = deep link com `clinicSlug` (não `/detalhe-programa`)  
3. Login paciente da clínica do seed  
4. Abrir `/$CLINIC_SLUG/paciente/programas` — lista real (sem mock)  
5. Iniciar exercícios → registrar carga → (opcional) não finalizados → feedback → conclusão → sucesso  
6. Confirmar que mutações `/api/patient/*` enviam Bearer do guard `patient`; GET detalhe funciona sem Bearer  

## Architecture checklist (manual review)

- [ ] Nenhum `use Modules\TreatmentProgram\Models` em `modules/Patient`
- [ ] Controllers patient sem `DB::` / Eloquent direto
- [ ] UseCases em `Services/PatientProgram/*` com RepositoryInterface
- [ ] `GET /{publicToken}` sem middleware `auth:patient`; demais rotas com auth
- [ ] Pages FE sem import de `apiClient`
