# Trabalho adiado · 016-clinic-modelos-evolucao-ds

- 2026-11-02 · `001-modelos-evolucao-ds-e-preservacao-historico` · Modelos de avaliação do admin (`admin_assessment_fields` / `clinic_assessment_answers`): as FKs ainda usam `cascadeOnDelete`, mas hoje não existe tela que edite esses modelos (conforme registrado no ADR 021). Quando a edição de modelos de avaliação do admin for criada, aplicar sincronização por `id` + `archived_at` + `restrictOnDelete`.
