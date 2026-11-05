# Tarefa 003 — Programa concluído / sucesso (DS v2)

**Arquivo único:** `resources/js/pages/patient/program/PatientProgramSuccessPage.tsx`  
**Rota:** `/:clinicSlug/paciente/programas/:publicToken/executar/concluido`  
**Handoff geral:** `../README.md`

## Estado atual (v1)

- Tela full-screen fundo **`#217b7e`** (teal legado, fora do DS).
- Ícone `CheckCircle2` grande, textos brancos.
- Um `Button` outline “Voltar aos programas” → `patientProgramsListPath(clinicSlug)`.
- Sem navbar; sem menção ao nome do programa.

## Entrega

1. Visual de **celebração** no DS (ex.: gradiente `--ds-gradient-brand` ou superfície success — ver banner em feedback consolidado antes de remover variantes, ou execução).
2. Mensagem clara: programa concluído + opcional subtítulo motivacional (curto).
3. CTA primário **`DsButton`**: “Voltar aos programas” (mesma navegação).
4. Layout responsivo, scroll se necessário (`overflow-y-auto`, não prender scroll).
5. Decisão UX documentada no SUMMARY: navbar sim/não (se sim, `DsPatientNavbar` minimal + `showPrototypeBadge`; se não, tela imersiva como hoje).
6. Zero `@/components/ui/*` e zero hex legado `#217b7e` / `#0175C2`.

## Fluxo

- Chega após `PatientProgramFeedbackPage` submit → `patientProgramSuccessPath(slug, publicToken)`.
- Não chama API nesta page.

## URL de teste

`{BASE}/clinica-cleverton/paciente/programas/d67de0d9-1f4d-4760-80ee-7f77f193debe/executar/concluido`

(Ou completar feedback de verdade uma vez no ambiente.)

## Checklist

- [ ] Contraste e dark mode (só na variante A, após corte).
- [ ] `fisio-app build` + `npm run types`.
- [ ] Screenshot em `../evidence/003-programa-concluido/SUMMARY.md`.

**Protótipo:** v1 **original** é o padrão (fluxo real); `?variant=A` = DS escolhido pelo usuário. Corte para só A fica para depois.

## Conflito de merge

Nenhum — só este arquivo (salvo testes).
