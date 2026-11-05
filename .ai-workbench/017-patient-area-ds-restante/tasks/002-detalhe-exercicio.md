# Tarefa 002 — Detalhe do exercício (DS v2)

**Arquivo único:** `resources/js/pages/patient/program/PatientExerciseDetailPage.tsx`  
**Rota:** `/:clinicSlug/paciente/programas/:publicToken/exercicios/:exerciseId`  
**Handoff geral:** `../README.md`

## Estado atual (v1)

- Header sticky custom + `Button` shadcn.
- Vídeo **`aspect-video` (16:9)** iframe.
- Blocos `bg-slate-50` prescrição / frequência / orientações.
- Footer fixo: Sair + Iniciar (`patientProgramExecutePath` com `exercise.id` como `startAt`).
- Loading/erro com `bg-slate-50`, sem navbar DS.

## Entrega

1. `DsPatientNavbar` com `title="Detalhes"` ou nome do exercício, `onBack={() => navigate(-1)}`, `showPrototypeBadge`.
2. Player **quadrado 1:1** (`aspect-square`, bordas `rounded-ds-2xl`) — alinhar a `PatientProgramDetailPage` / execução.
3. Seções prescrição / frequência / orientações com cards DS (`border-ds-border-default`, `bg-ds-surface-default`).
4. Chips de dias/período com estilo DS (não `bg-blue-100` hardcoded).
5. Footer sticky DS: `DsButton` secondary “Sair”, primary “Iniciar exercícios” + ícone.
6. Estados loading/404 com `DsEmptyState` / spinner DS.
7. Zero `@/components/ui/*`.

## Dados

- Hook: `usePatientProgram(publicToken)`.
- Resolver exercício: loop em `program.groups` (já existe).
- Domain: `PatientExercise`, `ExercisePrescription` em `@/domain/patient/program`.

## URL de teste

1. Abrir detalhe do programa.
2. Clicar em um exercício → copiar URL com `exerciseId`.

Programa exemplo: token `d67de0d9-1f4d-4760-80ee-7f77f193debe`.

## Checklist

- [ ] iframe acessível (`allowFullScreen`, placeholder se sem vídeo).
- [ ] Footer não cobre conteúdo (`pb-*` no main).
- [ ] `fisio-app build` + `npm run types`.
- [ ] Screenshot em `../evidence/002-detalhe-exercicio/SUMMARY.md`.

## Conflito de merge

Nenhum — só este arquivo (salvo testes).
