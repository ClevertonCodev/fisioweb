# Handoff — Área do paciente DS v2 (3 telas restantes)

**Branch:** `feat/ds-area-paciente`  
**Worktree:** `fisioweb-ds-area-paciente` (Docker via `fisio-app`)  
**Objetivo:** Migrar as **últimas 3 telas** da jornada do paciente de v1 (`PatientNavbar` + `@/components/ui/*`) para **Design System v2** (`@/components/ds`), no mesmo padrão das telas já aprovadas nesta branch.

Três agentes/sessões podem rodar **em paralelo** — uma tarefa por arquivo, sem conflito de merge (desde que cada um edite só o seu `.tsx`).

---

## O que já está pronto (referência)

| Tela | Arquivo | Decisão do usuário |
|------|---------|-------------------|
| Login | `resources/js/pages/patient/auth/PatientLoginPage.tsx` | Opção A consolidada |
| Detalhe do programa | `resources/js/pages/patient/program/PatientProgramDetailPage.tsx` | Opção B (grid) + vídeo **quadrado 1:1** |
| Executar sessão | `resources/js/pages/patient/program/PatientProgramExecutionPage.tsx` | Opção A (Split Studio) |
| Feedback pós-sessão | `resources/js/pages/patient/program/PatientProgramFeedbackPage.tsx` | Opção B (wizard passo a passo) |

Rotas: `resources/js/routes/patient/auth-routes.tsx`, `resources/js/routes/patient/program-routes.tsx`.

---

## O que falta (escopo deste handoff)

| # | Tarefa | Arquivo | Rota |
|---|--------|---------|------|
| **001** | Lista de programas *(C escolhida; preview `?variant=C`)* | `PatientProgramListPage.tsx` | `/:clinicSlug/paciente/programas` |
| **002** | Detalhe do exercício | `PatientExerciseDetailPage.tsx` | `/:clinicSlug/paciente/programas/:publicToken/exercicios/:exerciseId` |
| **003** | Programa concluído *(protótipo A convive com v1)* | `PatientProgramSuccessPage.tsx` | `/:clinicSlug/paciente/programas/:publicToken/executar/concluido` |

Detalhes por tarefa: `tasks/001-lista-programas.md`, `tasks/002-detalhe-exercicio.md`, `tasks/003-programa-concluido.md`.

---

## Ambiente e URLs (não inventar porta)

- Porta e links: **`AMBIENTE.md`** na raiz ou **`fisio-app url`** (recrear ambiente muda a porta — **nunca** copiar porta de mensagem antiga).
- Slug de exemplo: `clinica-cleverton`. Token de programa: conferir no detalhe ou no banco desta worktree.

Links úteis (substitua `{BASE}` pelo host de `fisio-app url`, ex. `http://localhost:50626`):

- Lista (protótipo): `{BASE}/{slug}/paciente/programas?variant=A|B|C`
- Detalhe programa (referência visual): `{BASE}/{slug}/paciente/programas/{publicToken}`
- Feedback (referência wizard): `{BASE}/{slug}/paciente/programas/{publicToken}/executar/feedback`
- Sucesso: `{BASE}/{slug}/paciente/programas/{publicToken}/executar/concluido`
- Exercício: abrir um card no detalhe do programa e copiar o `exerciseId` da URL

Comandos:

```bash
fisio-app build          # depois de mudar front (não npm run dev / watch)
npm run types
bash bin/verificar.sh    # antes de considerar pronto
```

---

## Padrões obrigatórios (copiar das telas já migradas)

### Layout raiz

```tsx
<div className="flex h-full w-full flex-col overflow-y-auto bg-ds-surface-body font-ds text-ds-content-primary">
```

Evitar `h-screen` sozinho sem `overflow-y-auto` (scroll travando foi bug corrigido no login).

### Navbar

- Trocar `PatientNavbar` por **`DsPatientNavbar`** (`resources/js/components/ds/navbar/DsPatientNavbar.tsx`).
- Durante protótipo/migração: **`showPrototypeBadge`** (badge “Protótipo” no topo).
- Lista de programas: navbar **sem** `title` (modo “home” — logo IVS leva à lista se logado).
- Telas com contexto: `title`, `onBack`, opcional `current`/`total` (execução).
- **`hideAuthAction`** no login; nas demais deixar login/logout padrão do componente.

### Marca

- **IVS Fisioterapia e Saúde** — não usar “Fisioweb” na UI do paciente (`AppLogo` / textos da navbar).

### Componentes

- Preferir **`@/components/ds`**: `DsButton`, `DsBadge`, `DsEmptyState`, `DsCard` (se existir padrão na skill), tokens `bg-ds-*`, `text-ds-*`, `rounded-ds-*`.
- **Não** importar `@/components/ui/button`, `card`, `StatusBadge` na versão final.
- Status do programa: mapear `PatientProgram['status']` para **`DsBadge`** (variantes alinhadas a `design-system` — ver detalhe do programa se houver helper similar).

### Tokens de sucesso / status

Usar classes que existem em `resources/css/ds/tokens.css` (ex.: `bg-ds-status-success-surface`, `border-ds-status-success-border`, `text-ds-status-success-content`, `bg-ds-success-100 text-ds-white`). **Não** inventar utilitários inexistentes (ex. `bg-ds-status-positive-text` que quebrou checks na execução).

### Fluxo de protótipo (como o usuário trabalhou nesta branch)

1. Opcional: **3 variantes** A/B/C com `?variant=` + barra switcher (pasta `*-variants/` temporária).
2. Usuário escolhe uma letra.
3. **Consolidar** na page oficial, **apagar** variantes e switcher.
4. `fisio-app build` + smoke no navegador.

Para sessões paralelas, pode ir direto ao DS v2 “final” ou fazer protótipo — alinhar com o que o usuário pedir na sessão.

### Camadas frontend

- Página usa hooks de **`@/application/patient/`** (`usePatientPrograms`, `usePatientProgram`) — **não** importar `apiClient` na page.
- Paths: **`@/application/patient/patient-program-paths.ts`**.

### Backend

- **Sem** endpoints novos, migrations ou mudança de contrato API para estas telas — só UI.

---

## Comportamento funcional a preservar

### 001 — Lista

- `usePatientPrograms()` + botão atualizar (`refetch`).
- Card clicável → `patientProgramDetailPath(slug, program.publicToken)`.
- Badge por `program.status`: available, scheduled, unavailable, completed, inactive.
- Metadados: contagem de exercícios, profissional, período (datas `pt-BR`).
- Empty e loading states.

### 002 — Detalhe exercício

- `usePatientProgram(publicToken)`; achar exercício em `program.groups[].exercises` por `exerciseId`.
- Vídeo: iframe se `videoUrl`; senão empty.
- Blocos: prescrição, frequência (days/period), orientações (`notes`).
- Footer fixo: **Sair** (`navigate(-1)`), **Iniciar exercícios** → `patientProgramExecutePath(slug, publicToken, exercise.id)` (query `startAt`).
- **Alinhar vídeo quadrado 1:1** com detalhe do programa / execução (não manter só `aspect-video` 16:9 se o restante da jornada é quadrado).

### 003 — Sucesso

- Tela estática pós-feedback; CTA **Voltar aos programas** → `patientProgramsListPath(clinicSlug)`.
- Substituir fundo fixo `#217b7e` e `Button` v1 por DS (gradiente/marca IVS, `DsButton`).
- Navbar: decidir se full-bleed celebratório **sem** navbar ou com `DsPatientNavbar` mínimo — seguir tom das outras telas “fim de fluxo”.

---

## Arquivos que NÃO devem ser editados (salvo necessidade)

- Outras pages patient já migradas (evitar regressão).
- `PatientNavbar.tsx` v1 — pode ficar até ninguém importar; **não** expandir uso.
- Rotas PHP / Policies — fora de escopo.

---

## Testes

- Procurar testes existentes: `resources/js/test/**/*patient*`.
- Se a tarefa alterar comportamento visível, atualizar ou adicionar Vitest mínimo (skill `frontend-testing`).
- Rodar `bash bin/verificar.sh` no fim.

---

## Definição de pronto (por tarefa)

- [ ] Page só DS v2 (sem `@/components/ui/*` na page).
- [ ] Scroll e mobile ok.
- [ ] `npm run types` ok.
- [ ] `fisio-app build` ok.
- [ ] Evidência: screenshot em `.ai-workbench/017-patient-area-ds-restante/evidence/<tarefa>/` + `SUMMARY.md` curto (caso de outra clínica: N/A para UI pura, dizer isso).
- [ ] Revisão adversária: opcional para UI sem auth/backend; se o usuário pedir merge, rodar skill `revisao-adversaria`.

---

## Quando as 3 terminarem (follow-up único)

1. Remover **`showPrototypeBadge`** de todas as pages patient (ou só quando o usuário pedir “tirar protótipo”).
2. Avaliar apagar **`PatientNavbar.tsx`** se zero imports.
3. Atualizar `.ai-workbench/DEFERRED.md` se algo ficou fora.

---

## Skills

- `design-system` — tokens, componentes Ds*
- `frontend-ddd` — camadas
- `frontend-react` — hooks
- `qa-navegador` — smoke headless
- `prototype` — se fizer A/B/C

---

## Prompt sugerido para colar em cada sessão paralela

**Lista (001):**

> Migra `PatientProgramListPage.tsx` para DS v2 seguindo `.ai-workbench/017-patient-area-ds-restante/tasks/001-lista-programas.md` e o README da feature. Branch feat/ds-area-paciente. Ambiente Docker: `fisio-app build` após front.

**Exercício (002):**

> Migra `PatientExerciseDetailPage.tsx` para DS v2 seguindo `.ai-workbench/017-patient-area-ds-restante/tasks/002-detalhe-exercicio.md`. Vídeo quadrado 1:1 como no detalhe do programa.

**Sucesso (003):**

> Migra `PatientProgramSuccessPage.tsx` para DS v2 seguindo `.ai-workbench/017-patient-area-ds-restante/tasks/003-programa-concluido.md`. Substituir teal legado por tokens DS.
