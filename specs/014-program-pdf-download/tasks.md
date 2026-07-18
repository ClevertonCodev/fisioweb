# Tasks: Download PDF do Programa de Tratamento

**Feature**: `014-program-pdf-download` · **Plan**: [plan.md](./plan.md)

**Input**: [spec.md](./spec.md), [plan.md](./plan.md), [data-model.md](./data-model.md), [research.md](./research.md), [contracts/](./contracts/), [quickstart.md](./quickstart.md)

**Tests**: Incluídos (plan.md + critérios SC/FR verificáveis). Sem migration nova — schema/seeds já cobrem `admin_exercise_media`.

**Convenções**: Backend em `modules/`, frontend DDD em `resources/js/`. Skills: `frontend-ddd`, `api-client`, `backend-clean-code`, `architecture-paradigm-modular-monolith`, `php-testing`, `frontend-testing`, `security`.

---

## Phase 1: Setup

**Purpose**: Dependências e baseline antes de alterar código

- [x] T001 Confirmar baseline: anotar resultado de `composer run test`, `npm run test`, `npm run types` (falhas pré-existentes OK para não bloquear)
- [x] T002 QR: `ProgramPdfQrCodeGenerator` com suporte a `chillerlan/php-qrcode` quando instalado; fallback DomPDF via `api.qrserver.com` (composer require bloqueado no ambiente — rodar localmente: `composer require chillerlan/php-qrcode:^5.0`)

---

## Phase 2: Foundational (blocking)

**Purpose**: Infra compartilhada do PDF — **bloqueia US2–US4** (US1 FE pode iniciar em paralelo após T003)

- [x] T003 Em `modules/TreatmentProgram/app/Http/Controllers/TreatmentPlanController.php`, trocar injeção de `PdfService` concreto por `Modules\Pdf\Contracts\PdfGeneratorInterface` (padrão `EvolutionController`)
- [x] T004 [P] Criar helper/service puro `modules/TreatmentProgram/app/Services/ProgramPdfViewModelBuilder.php` (ou equivalente) com métodos para: URL deep link `{APP_URL}/{clinic.slug}/paciente/programas/{id}`, fallback **Novo Grupo**, lista de até 3 meses de anotações a partir de `start_date`/`end_date`, e montagem dos dados do responsável (`clinicUser` + telefone fallback `clinic.phone`)
- [x] T005 [P] Criar helper `modules/TreatmentProgram/app/Services/ProgramPdfQrCodeGenerator.php` (ou método no builder) que gera PNG/data-URI do QR a partir da URL do deep link
- [x] T006 Atualizar `downloadPdf` em `TreatmentPlanController.php` para eager-load `clinicUser`, `clinic`, `patient`, `groups.exercises.exercise.media`, `groups.exercises.exercise.videos` (e flat `exercises.*` se usado) e passar view-model/compact enriquecido para a blade

**Checkpoint**: Builder + QR + load prontos; stories de layout PDF podem começar.

---

## Phase 3: User Story 1 — Profissional baixa o PDF (Priority: P1) 🎯 MVP

**Goal**: Ação **Baixar PDF** habilitada no detalhe e no histórico; download blob via `apiClient`.

**Independent Test**: Abrir programa seedado → menu ⋮ → Baixar PDF inicia download; item não está `disabled`.

### Implementation (US1)

- [x] T007 [P] [US1] Adicionar `fetchPdfBlob(id: string): Promise<Blob>` em `ProgramsRepository` (`resources/js/application/clinic/ports.ts`) e implementar em `resources/js/infrastructure/repositories/api-clinic-programs.ts` com `GET /clinic/treatment-plans/{id}/pdf` + `responseType: 'blob'` (espelhar `api-clinic-evolutions.ts`)
- [x] T008 [US1] Criar helper `downloadProgramPdf` / `openProgramPdf` em `resources/js/application/clinic/use-programs.ts` (ou arquivo dedicado `download-program-pdf.ts` exportado no barrel `application/clinic/index.ts`), com toast de erro no falha
- [x] T009 [US1] Em `resources/js/pages/clinic/program/ProgramDetailPage.tsx`, remover `disabled` do item **Baixar PDF**, usar `cursor-pointer`, e chamar o helper de download no `onClick`
- [x] T010 [US1] Em `resources/js/pages/clinic/program/ProgramHistoryTab.tsx`, habilitar **Baixar PDF** com o mesmo helper (qualquer status já listado)

### Tests (US1)

- [x] T011 [P] [US1] Extender `resources/js/test/api-clinic-programs.test.ts` cobrindo `fetchPdfBlob` (mock `apiClient.get` com blob)
- [x] T012 [P] [US1] Feature test `modules/TreatmentProgram/tests/Feature/TreatmentPlanPdfDownloadTest.php`: clinic autenticado recebe `200` + `application/pdf`; outra clínica/`id` inválido → `404`

**Checkpoint**: MVP — download funcional com PDF atual (já com imagens seedadas).

---

## Phase 4: User Story 2 — Capa com responsável, QR e resumo (Priority: P1)

**Goal**: Capa estilo Vedius: foto/nome/credencial/contatos do responsável, QR “Acesse online”, título, Para, tempo, período, Observações.

**Independent Test**: PDF de programa com paciente + `clinicUser` com foto; QR aponta para deep link; sem paciente → sem QR.

### Deep link paciente (US2)

- [x] T013 [US2] Registrar rota SPA `{clinicSlug}/paciente/programas/:programId` (arquivo em `resources/js/routes/` adequado) que: se paciente autenticado e plano acessível → landing mínima; senão → redirect login paciente com `returnUrl` (ver [contracts/patient-program-deep-link.md](./contracts/patient-program-deep-link.md))
- [x] T014 [P] [US2] Criar página mínima `resources/js/pages/patient/PatientProgramDeepLinkPage.tsx` (ou sob path acordado) — placeholder/título do programa ou mensagem de acesso; sem portal completo
- [x] T015 [P] [US2] Se necessário para a landing: stub `GET` paciente do plano em `modules/Patient/` (ou contrato TreatmentProgram→Patient) com isolamento `patient_id` + `clinic_id`

### PDF capa (US2)

- [x] T016 [US2] Redesign da capa em `resources/views/pdf/clinic/treatment/treatment-plan.blade.php`: header com foto/`photo_url` ou iniciais do `clinicUser`, nome, `document` como credencial, email, telefone (fallback clinic), bloco QR com legenda “Acesse online” quando `qrUrl` presente
- [x] T017 [US2] Garantir na capa: título, “Para: {paciente|—}”, tempo estimado (`duration_minutes`), período + dias, seção **Observações** sempre presente (`notes` ?? `message`)
- [x] T018 [US2] Integrar `ProgramPdfQrCodeGenerator` / builder no `downloadPdf` para omitir QR quando sem paciente ou sem `clinic.slug`

### Tests (US2)

- [x] T019 [P] [US2] Em `TreatmentPlanPdfDownloadTest.php` (ou teste unitário do builder): assert URL deep link; PDF com paciente contém marcador/string do QR path; plano sem paciente gera PDF sem falha e sem exigir QR

**Checkpoint**: Capa + deep link atendem FR-003/FR-004/SC-004.

---

## Phase 5: User Story 3 — Exercícios agrupados com imagens (Priority: P1)

**Goal**: Grupos com **Novo Grupo** se nome vazio; até 2 imagens; parâmetros; ordem do programa.

**Independent Test**: Grupo sem nome → “Novo Grupo”; exercício seedado mostra 2 imagens R2.

### Implementation (US3)

- [x] T020 [US3] No blade `treatment-plan.blade.php` (e/ou builder), se `trim(group.name)` vazio → exibir **Novo Grupo**
- [x] T021 [US3] Confirmar/ajustar layout de exercício: até 2 imagens empilhadas de `ExerciseMedia` (`type=image`), fallback thumbnail vídeo, nome, descrição, parâmetros (freq/séries/reps/descanso/esforço quando existirem), `page-break-inside: avoid`
- [x] T022 [US3] Garantir ordem de grupos/exercícios igual à do plano (`sort_order`) no loop da blade/builder

### Tests (US3)

- [x] T023 [P] [US3] Teste unitário do builder ou Feature PDF: grupo com `name` `"   "` resolve para **Novo Grupo**; exercício com 2 `ExerciseMedia` inclui ambas as `cdn_url` no HTML renderizado ( DomPDF raw ou assert no view data)

**Checkpoint**: Corpo do programa no PDF alinhado à spec/imagens.

---

## Phase 6: User Story 3b — Cadastro imagens no admin (Priority: P1)

**Goal**: Admin anexa 0–2 imagens de referência em Vídeos novo/editar; persiste em `ExerciseMedia` (+ staging `video.metadata` se preciso).

**Independent Test**: Upload 2 imagens no admin → PDF do exercício mostra as novas URLs.

### Backend (US3b)

- [x] T024 [US3b] Implementar sync de reference images no módulo Admin (service + contrato) gravando em `admin_exercise_media` (max 2, `type=image`, `sort_order` 0..1) e opcionalmente `media_videos.metadata.reference_images` — ver [contracts/admin-exercise-reference-images.md](./contracts/admin-exercise-reference-images.md)
- [x] T025 [US3b] Expor endpoint admin (PUT vídeo ou exercício) em `modules/Admin/routes/admin.php` + Controller/FormRequest com validação max 2 + MIME; propagar para exercícios ligados ao `video_id`
- [x] T026 [US3b] Reutilizar fluxo presigned R2 existente do Media para upload das imagens (não inventar storage paralelo)

### Frontend (US3b)

- [x] T027 [P] [US3b] Adicionar 2 slots opcionais de imagem de referência em `resources/js/pages/admin/exercises/AdminVideoCreatePage.tsx` (além do thumbnail)
- [x] T028 [US3b] Mesmos slots em `resources/js/pages/admin/exercises/AdminVideoEditPage.tsx` + carregar imagens existentes se houver
- [x] T029 [US3b] Repository/hook admin (`resources/js/infrastructure/repositories/…` + `application/admin/…`) chamando o endpoint via `apiClient`; invalidar queries relevantes no sucesso

### Tests (US3b)

- [x] T030 [P] [US3b] Feature test Admin: PUT com 2 paths válidos cria/atualiza 2 `ExerciseMedia`; 3 imagens → `422`; 0 imagens limpa/permite vazio

**Checkpoint**: Cadastro admin + seeds cobrem o caminho feliz do PDF.

---

## Phase 7: User Story 4 — Anotações mensais (Priority: P2)

**Goal**: Páginas “Anotações de {Mês}” com checkbox + dia + linha; teto 3 primeiros meses do período.

**Independent Test**: Período 2 meses → 2 páginas; 5 meses → 3 páginas.

### Implementation (US4)

- [x] T031 [US4] Completar cálculo de meses no `ProgramPdfViewModelBuilder` (máx. 3 primeiros; dias do período por mês; weekday pt-BR abreviado)
- [x] T032 [US4] Renderizar páginas de anotações ao final de `treatment-plan.blade.php` com título, texto de orientação (marcar dias / dores/dificuldades), grid/colunas de dias com checkbox + linha; omitir se sem `start_date`/`end_date`

### Tests (US4)

- [x] T033 [P] [US4] Teste unitário do builder: intervalo de 5 meses retorna exatamente 3 entradas; 1 mês → 1; sem datas → lista vazia

**Checkpoint**: US4 completa o PDF de referência.

---

## Phase 8: Polish & Cross-Cutting

- [x] T034 [P] Rodar `./vendor/bin/pint` nos PHP alterados; `npm run format` / `npm run types` / `npm run lint` nos TS/TSX alterados
- [x] T035 Executar cenários do [quickstart.md](./quickstart.md) manualmente (download, QR, Novo Grupo, anotações, admin imagens)
- [x] T036 [P] Confirmar que `ExerciseSeeder` continua populando 2 URLs R2 em `admin_exercise_media` após qualquer mudança de sync
- [x] T037 Rodar `composer run test` e `npm run test` nos suites tocados; corrigir regressões introduzidas pela feature

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** → sem deps
- **Phase 2 (Foundational)** → após Setup; bloqueia US2–US4
- **Phase 3 (US1)** → pode começar após T003 (interface PDF); FE não depende do builder completo
- **Phase 4 (US2)** → após Phase 2
- **Phase 5 (US3)** → após Phase 2 (pode paralelo a US2 no blade com cuidado de merge)
- **Phase 6 (US3b)** → após Setup; paraleliza com US1/US2 se não tocar a mesma blade
- **Phase 7 (US4)** → após Phase 2 (ideal após US2 capa estável)
- **Phase 8** → após stories desejadas

### User Story Dependencies

| Story | Depende de | Notas |
|-------|------------|-------|
| US1 | T003 (leve) | MVP isolado |
| US2 | Phase 2 + deep link | QR + capa |
| US3 | Phase 2 | Blade exercícios; seeds já ajudam |
| US3b | Setup | Independente do download FE |
| US4 | Phase 2 (+ builder meses) | P2 |

### Parallel Opportunities

```bash
# Após Phase 2:
# Dev A: US1 (T007–T012)
# Dev B: US2 deep link (T013–T015) + capa (T016–T019)
# Dev C: US3b admin (T024–T030)

# Em paralelo dentro de US1:
T007 ports/repo  ||  T011 vitest
# Depois T008–T010 pages

# US3 + US4 no mesmo blade: serializar ou um dono do arquivo
```

---

## Parallel Example: User Story 1

```bash
Task: "T007 [P] [US1] fetchPdfBlob em ports + api-clinic-programs.ts"
Task: "T011 [P] [US1] Vitest fetchPdfBlob"
Task: "T012 [P] [US1] Feature TreatmentPlanPdfDownloadTest.php"
# Then sequential:
Task: "T008 helper downloadProgramPdf"
Task: "T009 ProgramDetailPage enable"
Task: "T010 ProgramHistoryTab enable"
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Phase 1 → T003 → Phase 3 (US1)
2. **STOP**: validar download com PDF seedado
3. Demo valor imediato

### Incremental

1. US1 download → demo  
2. US2 capa+QR → demo  
3. US3 Novo Grupo/imagens polish → demo  
4. US3b admin upload → demo  
5. US4 anotações → demo  
6. Polish + quickstart

---

## Notes

- Todas as tasks usam formato `- [ ] Txxx …` com path de arquivo
- Sem migration nova; refresh/seed OK em dev
- Não enviar PDF por WhatsApp/e-mail
- Anotações: teto **3 meses**
- Próximo comando sugerido: `/speckit-analyze` ou `/speckit-implement`
