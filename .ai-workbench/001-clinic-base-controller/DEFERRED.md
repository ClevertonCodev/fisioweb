# Adiado · 001 Controller base para o guard clinic

Decidido no refinamento de 2026-10-13.

- **Checagem de posse em helper ou Policy:** o padrão "buscar recurso → comparar `clinic_id` → 404" continua repetido nos controllers. Mexe em autorização; precisa de feature própria com teste de outra clínica em cada endpoint.
- **Padronizar 404:** hoje mistura `abort_if(..., 404)` com `response()->json(['message' => ...], 404)`, e as mensagens variam.
- **Guards `admin` e `patient`:** só 2 usos diretos (`ExerciseReviewController`); não compensa um controller base agora.
- **Queries Eloquent nos controllers:** `ClinicUserController` e `DashboardController` consultam models direto; deveriam passar por Service/Repository.
- **Cast de `clinic_id` nos models:** nenhum model faz cast para inteiro; a feature resolve com `(int)` explícito na comparação.
