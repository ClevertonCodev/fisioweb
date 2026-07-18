# Quickstart: Download PDF do Programa

**Feature**: `014-program-pdf-download`  
**Date**: 2026-07-16

## Prerequisites

- App local com DB seedado (`php artisan migrate:refresh --seed` se necessário)
- Login clínica: `clevertonsantoscodev@gmail.com` / `12345678` (seed padrão)
- Programas seedados em Clínica Cleverton (TreatmentPlanSeeder)
- Exercícios seedados com 2 `ExerciseMedia` (URLs R2)

## Validação P1 — Baixar PDF

1. `composer run dev` (API + Vite).
2. Abrir `/clinica/programas/{id}` de um programa seedado.
3. Menu ⋮ → **Baixar PDF** (deve estar habilitado).
4. Arquivo baixa/abre: capa + exercícios com até 2 imagens + anotações (se houver período).

**Esperado**: sem item `disabled`; PDF `application/pdf`; imagens R2 visíveis no DomPDF.

## Validação P1 — Capa / QR

1. Programa **com paciente** e clínica com `slug`.
2. Baixar PDF → capa com foto/nome do `clinicUser` (ou iniciais).
3. Ler QR “Acesse online” → URL `{origin}/{slug}/paciente/programas/{id}`.
4. Programa **sem paciente** → PDF sem QR; “Para: —” (ou equivalente).

## Validação P1 — Novo Grupo

1. Plano com grupo `name` vazio ou só espaços (ajustar via tinker/API se preciso).
2. PDF mostra título **Novo Grupo**.

## Validação P1 — Imagens admin

1. Admin → Vídeos → novo ou editar.
2. Anexar 0–2 imagens de referência + salvar.
3. Exercício ligado ao vídeo deve refletir as imagens no próximo PDF.

## Validação P2 — Anotações (teto 3)

1. Plano com período de 1 mês → 1 página “Anotações de …”.
2. Período cruzando 2 meses → 2 páginas.
3. Período > 3 meses → exatamente 3 páginas (primeiros meses).

## Automated checks (após implementação)

```bash
# Backend (filtrar testes da feature quando existirem)
composer run test
# ou: vendor/bin/phpunit --filter=TreatmentPlanPdf

# Frontend
npm run test
npm run types
```

## References

- [spec.md](./spec.md)
- [contracts/clinic-treatment-plan-pdf.md](./contracts/clinic-treatment-plan-pdf.md)
- [contracts/admin-exercise-reference-images.md](./contracts/admin-exercise-reference-images.md)
- [contracts/patient-program-deep-link.md](./contracts/patient-program-deep-link.md)
- [data-model.md](./data-model.md)
