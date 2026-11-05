# Tarefa 001 — Lista de programas (DS v2)

**Arquivo único:** `resources/js/pages/patient/program/PatientProgramListPage.tsx`  
**Rota:** `/:clinicSlug/paciente/programas`  
**Handoff geral:** `../README.md`

## Estado atual (v1)

- `PatientNavbar` + `Button`, `Card`, `StatusBadge` de `@/components/ui/*`.
- `h-screen` + `bg-background`.
- Lista de cards com status, exercícios, profissional, período.
- Refresh via `usePatientPrograms().refetch`.

## Entrega

1. Layout DS v2 com `DsPatientNavbar` (`showPrototypeBadge`, sem `title` — home da área).
2. Header “Meus programas” com estilo DS (tipografia `text-ds-h*`, eyebrow opcional).
3. Botão atualizar com `DsButton` (icon-only ou tertiary).
4. Cards de programa com `DsBadge` por status (mesmas labels PT: Disponível, Disponível em breve, Indisponível, Concluído, Inativo).
5. Loading: spinner + texto DS; empty: preferir `DsEmptyState` + ícone.
6. Clique no card → `patientProgramDetailPath` (comportamento idêntico).
7. Zero imports de `@/components/ui/*` e zero `PatientNavbar`.

## Referência visual

- `PatientProgramDetailPage.tsx` — tokens, badges, cards arredondados.
- Opcional criar 2–3 variantes (cards empilhados vs lista compacta vs hero + cards) se o usuário pedir protótipo; senão uma UI forte já no DS.

## URL de teste

`{BASE}/clinica-cleverton/paciente/programas` — ver `AMBIENTE.md`.

## Checklist

- [ ] Mobile: cards legíveis, refresh acessível.
- [ ] Dark mode (`ds-dark:*` onde necessário).
- [ ] `fisio-app build` + `npm run types`.
- [ ] Screenshot em `../evidence/001-lista-programas/SUMMARY.md`.

## Conflito de merge

Nenhum — só este arquivo (salvo testes novos em `resources/js/test/`).
