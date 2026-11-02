# Modelos de evolução no Design System v2 e preservação de histórico (ADR 021 + ADR 020)

**Tipo:** História
**Plano:** `../plans/clinic-modelos-evolucao-ds.md`
**Histórias:** 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
**Issue:** ainda não criada

## Descrição

Unifica em uma única entrega na branch `feat/clinic-modelos-evolucao-ds` as duas partes definidas no plano e no `decisoes.md`:

1. **Parte 1 — Backend (ADR 021 + Questionários):** impede que editar um modelo de evolução (`ClinicalRecord`) ou de questionário (`ClinicQuestionnaire`) apague o histórico de itens marcados ou respostas dos pacientes, trocando o `replaceSections` por sincronização por `id` com arquivamento (`archived_at`) e `restrictOnDelete`, adicionando a rota `PATCH /api/clinic/evolution-templates/{id}/active`, ajustando as permissões por papel (admin e fisioterapeuta criam/editam/ativam; secretária só lê; só admin exclui) e implementando exclusão híbrida (física se nunca usado; soft delete preservando seções e itens se já usado).
2. **Parte 2 — Frontend v2 e links (ADR 020):** substitui a v1 e os protótipos de `/clinica/templates/evolucoes`, `/novo` e `/:id/editar` pelas telas oficiais no Design System v2 (variantes A da lista e do editor em RHF + Zod), compartilha a regra pura de `evolution-sheet-text.ts` na prévia "Experimentar", aplica botões desabilitados com motivo por papel (ADR 017), adiciona os links no `ClinicAccountMenu` e na gaveta "Nova evolução" com `?returnTo=`, e remove a v1, `TemplateSectionBuilder`, `TemplatePreview`, `evolution-template-prototype/` e `PrototypeSwitcher.tsx`.

## O que construir

### Parte 1: Backend (ADR 021 + Questionários)

- **Migrations em `modules/ClinicalRecord/database/migrations/` e `modules/ClinicQuestionnaire/database/migrations/`:**
  - `deleted_at` (`softDeletes`) em `clinic_evolution_templates`;
  - `archived_at` (`timestamp`, nullable) em `clinic_evolution_template_sections`, `clinic_evolution_template_items`, `clinic_questionnaire_sections` e `clinic_questionnaire_questions`;
  - FK `clinic_patient_evolution_checked_items.evolution_template_item_id` e `clinic_patient_questionnaire_answers.questionnaire_question_id` alteradas de `cascadeOnDelete` para `restrictOnDelete`.
- **Sincronização por `id` no `PUT`:**
  - `UpdateEvolutionTemplateRequest` e `EvolutionTemplateService::update` aceitam `sections.*.id` e `sections.*.items.*.id`, validam que pertencem ao modelo (422 se pertencerem a outro modelo ou outra clínica), atualizam no lugar quando há `id`, criam quando não há e arquivam (`archived_at = now()`) o que não veio no payload.
  - O mesmo vale para `UpdateQuestionnaireTemplateRequest` e `QuestionnaireTemplateService::update` (e `QuestionnaireTemplateEditPage` envia os `id`s existentes).
- **Ativar/desativar:**
  - `PATCH /api/clinic/evolution-templates/{id}/active` grava apenas `is_active`. Modelo do sistema ou de outra clínica responde 404.
  - `GET /api/clinic/evolution-templates` retorna modelos ativos e inativos (não deletados) da clínica + do sistema, com seções e itens não arquivados (`whereNull('archived_at')`).
- **Permissões e exclusão híbrida:**
  - `EvolutionTemplatePolicy` + `EvolutionTemplateController`: admin e fisioterapeuta criam, editam e ativam/desativam; secretária só lista e vê (403 nas escritas); só admin exclui (403 para fisioterapeuta e secretária).
  - `DELETE`: se nunca usado, apaga fisicamente (`forceDelete`); se já usado em evolução (incluindo lixeira) ou `checked_items`, faz `SoftDeletes` preservando seções e itens, e `PatientEvolution::template()` usa `withTrashed()` para continuar exibindo o modelo e os itens marcados nas evoluções antigas (mesma regra para `QuestionnaireTemplate`).

### Parte 2: Telas v2, permissões, links e limpeza (ADR 020)

- **Lista (`/clinica/templates/evolucoes`, variante A):**
  - Cartões com miniatura das seções, abas Todos / Da clínica / Do sistema, busca por nome ou item, gaveta "Experimentar" usando `evolution-sheet-text.ts`;
  - Modelo do sistema mostra "Duplicar" (abre `/:id/editar`) e não tem "Ativo" nem "Excluir";
  - "Ativo" usa `PATCH /api/clinic/evolution-templates/{id}/active`; modelo inativo exibe o selo "Inativo";
  - Ações respeitam o papel (`can.manageEvolutionTemplates`, `can.delete`) com `aria-disabled="true"` e motivo no tooltip (ADR 017).
- **Editor (`/clinica/templates/evolucoes/novo` e `/:id/editar`, variante A):**
  - Formulário em React Hook Form + Zod com as regras do ADR 020;
  - Rodapé mostra o primeiro problema e quantos faltam (`(+N)`);
  - Envia o `id` de cada seção e item existente no `PUT`;
  - Modelo do sistema abre com alerta informativo e botão "Salvar como cópia" (`POST` sem `id`s);
  - Suporta `?returnTo=` para voltar ao prontuário ao salvar ou cancelar/voltar.
- **Links e gaveta de evolução:**
  - "Modelos de evolução" no `ClinicAccountMenu` com destaque de rota ativa;
  - "Gerenciar modelos" na gaveta "Nova evolução" com `?returnTo=`, e filtro de modelos ativos (`isActive`) na escolha da nova evolução.
- **Limpeza e documentação:**
  - Remoção da v1 das três páginas, `TemplateSectionBuilder`, `TemplatePreview`, `components/clinic/evolution-template/types.ts`, `evolution-template-prototype/`, `DEMO_TEMPLATES`, rotas `/exemploN` e `PrototypeSwitcher.tsx`;
  - Atualização de `docs/prototipos-v2.md`, `docs/adr/020-modelos-de-evolucao-v2-acesso-e-editor.md` e `docs/adr/021-editar-modelo-de-evolucao-nao-apaga-historico.md`.

## Critérios de Aceite

- [x] Editar um modelo usado numa evolução assinada mantém os `checked_items` e `free_text_value` dela (PHPUnit e smoke test).
- [x] Remover um item ou seção arquiva (`archived_at`), a nova evolução não o oferece, e a evolução antiga continua mostrando o item marcado (PHPUnit e smoke test).
- [x] Enviar `id` de seção ou item de outro modelo ou de outra clínica responde 422 (PHPUnit).
- [x] `PATCH /api/clinic/evolution-templates/{id}/active` grava apenas `is_active` e não mexe nas seções; modelo do sistema e de outra clínica respondem 404 (PHPUnit e smoke test).
- [x] `DELETE` apaga fisicamente modelo nunca usado e faz soft delete preservando seções, itens e exibição nas evoluções antigas quando já usado; mesma proteção aplicada em `ClinicQuestionnaire` (PHPUnit).
- [x] Secretária recebe 403 nas rotas de escrita (`POST`, `PUT`, `PATCH .../active`, `DELETE`) e vê os botões de escrita desabilitados com motivo no front; fisioterapeuta vê "Excluir" desabilitado com motivo e recebe 403 no `DELETE` (PHPUnit, Vitest e smoke test).
- [x] As três telas (`/clinica/templates/evolucoes`, `/novo`, `/:id/editar`) renderizam no DS v2 (variante A, `max-w-(--breakpoint-ds-xl)`), com editor em RHF + Zod, prévia "Experimentar" alinhada ao backend, "Salvar como cópia" no modelo do sistema e links no `ClinicAccountMenu` e na gaveta "Nova evolução" com `?returnTo=` (Vitest e smoke test).
- [x] A v1, `TemplateSectionBuilder`, `TemplatePreview`, `evolution-template-prototype/` e `PrototypeSwitcher.tsx` foram removidos e `docs/prototipos-v2.md` está atualizado (Vitest).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (404 no GET, PUT, PATCH e DELETE).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda quando quiser.

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-modelos-evolucao-ds`
- **Exemplo no código:** `modules/ClinicalRecord/tests/Feature/ClinicalRecordIsolationTest.php`, `resources/js/application/clinic/evolution-sheet-text.ts`, `resources/js/pages/clinic/questionnaire-template/QuestionnaireTemplateNewPage.tsx`
- **Skills:** `backend-clean-code`, `laravel-eloquent`, `php-testing`, `architecture-paradigm-modular-monolith`, `design-system`, `frontend-ddd`, `frontend-testing`, `forms-shadcn`, `qa-navegador`

## Como testar na mão

1. Criar um modelo de evolução, registrar uma evolução marcando itens e assinar.
2. Editar o modelo no editor v2, removendo um item e renomeando outro; reabrir a evolução assinada (marcação continua) e abrir nova evolução (item removido não aparece).
3. Desativar o modelo na lista e conferir que ele recebe o selo "Inativo" e some da gaveta "Nova evolução".
4. Duplicar o modelo do sistema ("Salvar como cópia").
5. Entrar como fisioterapeuta e secretária e conferir os botões desabilitados com motivo no tooltip.
6. Testar os links no menu da conta e na gaveta "Nova evolução" com retorno pelo `returnTo`, celular (390 px), tema escuro e isolamento entre clínicas (404).
