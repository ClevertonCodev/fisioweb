# Contract: Patient Program Deep Link (QR target)

**Feature**: `014-program-pdf-download`  
**Consumers**: PDF QR code; browser do paciente  
**Auth**: guard `patient` (após login)

## URL canônica

```
{APP_URL}/{clinicSlug}/paciente/programas/{publicToken}
```

| Segment | Source |
|---------|--------|
| `clinicSlug` | `clinics.slug` |
| `publicToken` | `clinic_treatment_plans.public_token` (UUID opaco; **não** usar o `id` sequencial) |

## Behavior (mínimo nesta feature)

1. **Não autenticado**: redirecionar para login do paciente da clínica, preservando `returnUrl` = deep link.
2. **Autenticado, plano do paciente na clínica**: landing mínima OK (placeholder ou redirect interno futuro) — deve abrir contexto do programa (mesmo que UI completa venha depois).
3. **Autenticado, plano de outro paciente / outra clínica**: 404 ou mensagem de acesso negado (sem vazar existência cross-tenant).

## Out of scope

- Player completo, check-in diário digital, sync de anotações impressas.
- Magic link sem senha.

## Backend support (se necessário)

Se a landing precisar de dados: endpoint paciente para `GET /api/patient/.../treatment-plans/{id}` com isolamento por `patient_id` + `clinic_id`. Pode ser stub retornando título/status. Detalhe de implementação em `/speckit-tasks`.
