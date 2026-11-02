# Modelos de evolução no Design System v2 e preservação de histórico

Data: 2026-11-02
Fonte: `decisoes.md`, `docs/adr/020-modelos-de-evolucao-v2-acesso-e-editor.md`, `docs/adr/021-editar-modelo-de-evolucao-nao-apaga-historico.md` e `docs/prototipos-v2.md`

## Problema

Hoje as três telas de modelos de evolução (`/clinica/templates/evolucoes`, `/novo` e `/:id/editar`) apresentam três problemas críticos:

1. **Perda silenciosa de histórico clínico (ADR 021):** editar qualquer modelo de evolução (`PUT /api/clinic/evolution-templates/{id}`) ou clicar em "Ativo" na lista v1 chama `EvolutionTemplateRepository::replaceSections`, que apaga e recria todas as seções e itens. Como `clinic_patient_evolution_checked_items.evolution_template_item_id` usa `cascadeOnDelete`, qualquer edição apaga em cascata os itens marcados de todas as evoluções feitas com aquele modelo (inclusive assinadas e na lixeira). O mesmo risco existe em `ClinicQuestionnaire`: `QuestionnaireTemplateRepository::replaceSections` apaga perguntas e `clinic_patient_questionnaire_answers.questionnaire_question_id` usa `cascadeOnDelete`, apagando respostas já enviadas pelos pacientes.
2. **Interruptor "Ativo" quebrado e exclusão rígida:** o service ignora `is_active` no `PUT`, e o `DELETE` recusa excluir modelos já usados em vez de permitir exclusão lógica preservando o histórico onde já foram usados.
3. **Telas escondidas e em v1/protótipo (ADR 020):** em produção as rotas ainda mostram a v1 (shadcn), o protótipo v2 usa `useState` com salvar/duplicar/excluir/ativar como stub e exemplos fixos (`DEMO_TEMPLATES`, `/exemploN`), e nenhum menu ou gaveta leva às telas (nem o `ClinicAccountMenu`, nem a gaveta "Nova evolução").

## Solução

1. **Parte 1 — Preservação de histórico e rotas no backend (ADR 021 + `ClinicQuestionnaire`):**
   - Adicionar `archived_at` em `clinic_evolution_template_sections` e `clinic_evolution_template_items`, `deleted_at` (`SoftDeletes`) em `clinic_evolution_templates`, e trocar a FK `clinic_patient_evolution_checked_items.evolution_template_item_id` de `cascadeOnDelete` para `restrictOnDelete`.
   - Sincronizar seções e itens por `id` no `PUT /api/clinic/evolution-templates/{id}`: atualizar quando tem `id`, criar quando não tem, arquivar (`archived_at = now()`) quando saiu do payload e responder `422` se um `id` não pertencer ao modelo.
   - Criar `PATCH /api/clinic/evolution-templates/{id}/active` gravando apenas `is_active` (404 para modelo do sistema ou de outra clínica).
   - Ajustar `EvolutionTemplatePolicy` e `EvolutionTemplateController`: admin e fisioterapeuta criam, editam e ativam/desativam; secretária só lista e vê (403 nas escritas); só admin exclui (403 para fisioterapeuta e secretária).
   - Exclusão híbrida no `DELETE`: se o modelo nunca foi usado (nem em `clinic_patient_evolutions` incluindo lixeira, nem em `checked_items`), apaga fisicamente (`forceDelete`); se já foi usado, faz `SoftDeletes` preservando seções e itens, e `PatientEvolution::template()` usa `withTrashed()` para continuar exibindo o modelo e os itens marcados nas evoluções antigas.
   - Na listagem e detalhe de modelos (`EvolutionTemplate`), retornar todos os modelos não excluídos da clínica (ativos e inativos, para a lista mostrar o selo "Inativo") e o do sistema, filtrando apenas seções e itens não arquivados (`whereNull('archived_at')`). Na nova evolução, oferecer apenas modelos ativos (`isActive`) e itens não arquivados; ao abrir evolução antiga (`checkedItems.item.section`), carregar itens e seções mesmo arquivados e modelo mesmo com soft delete.
   - Aplicar a mesma proteção em `ClinicQuestionnaire`: `archived_at` em `clinic_questionnaire_sections` e `clinic_questionnaire_questions`, FK `clinic_patient_questionnaire_answers.questionnaire_question_id` com `restrictOnDelete`, sincronização por `id` no `PUT /api/clinic/questionnaire-templates/{id}` (422 para `id` alheio), envio dos `id`s em `QuestionnaireTemplateEditPage` e exclusão híbrida no `DELETE` (física se nunca usado; soft delete preservando seções/perguntas se já usado).
2. **Parte 2 — Telas v2, permissões e links de acesso (ADR 020):**
   - Substituir a v1 e a pasta `evolution-template-prototype/` pelas telas oficiais no Design System v2 (`@/components/ds`, largura máxima `max-w-(--breakpoint-ds-xl)`):
     - `/clinica/templates/evolucoes`: variante A ("Cartões com prévia"), abas Todos / Da clínica / Do sistema, busca por nome ou item, miniatura das seções, gaveta "Experimentar" usando a regra pura de `evolution-sheet-text.ts`, interruptor "Ativo" via `PATCH .../active`, selo "Inativo", "Duplicar" no modelo do sistema abrindo `/:id/editar`, e botões "Novo modelo", "Duplicar", "Editar", "Ativo" e "Excluir" respeitando o papel (`can.*`) com `aria-disabled="true"` e motivo no tooltip (ADR 017).
     - `/clinica/templates/evolucoes/novo` e `/:id/editar`: variante A ("Montar e ver ao vivo") em React Hook Form + Zod, enviando `id` de cada seção e item existente no `PUT`, rodapé com o primeiro problema e quantos faltam (`(+N)`), prévia ao vivo ao lado, e modo "Salvar como cópia" (`POST`) com alerta informativo quando aberto no modelo do sistema.
   - Adicionar os links de entrada:
     - "Modelos de evolução" ("Itens prontos que viram texto no prontuário") no `ClinicAccountMenu` para todos os perfis, com destaque quando a rota começa com `/clinica/templates/evolucoes`;
     - "Gerenciar modelos" ao lado do seletor de modelo na gaveta "Nova evolução" (`EvolutionFormModal`), passando `?returnTo=` e voltando para lá ao salvar ou cancelar/voltar.
   - Remover a v1 das três páginas, `TemplateSectionBuilder`, `TemplatePreview`, `components/clinic/evolution-template/types.ts`, a pasta `evolution-template-prototype/`, `DEMO_TEMPLATES`, as rotas `/exemploN` e `resources/js/pages/clinic/PrototypeSwitcher.tsx`.

## Histórias de Usuário

1. Como fisioterapeuta ou administrador da clínica, quero editar um modelo de evolução já utilizado em evoluções (em rascunho, assinadas ou na lixeira) sem perder os itens marcados nem os complementos dessas evoluções.
2. Como fisioterapeuta ou administrador da clínica, quero que itens e seções removidos de um modelo sejam arquivados para não aparecerem em novas evoluções, mas continuem visíveis nas evoluções antigas onde foram marcados.
3. Como fisioterapeuta ou administrador da clínica, quero ativar e desativar um modelo da clínica em rota própria (`PATCH /api/clinic/evolution-templates/{id}/active`) sem reenviar nem alterar suas seções, fazendo o modelo inativo sumir da gaveta de "Nova evolução" e permanecer na lista com o selo "Inativo".
4. Como administrador da clínica, quero excluir um modelo da clínica sabendo que, se ele nunca foi usado, será removido de vez e, se já foi usado em alguma evolução, será excluído logicamente (`SoftDeletes`) continuando visível nas evoluções já escritas.
5. Como fisioterapeuta ou secretária da clínica, quero ver o botão "Excluir" desabilitado (`aria-disabled="true"`) com tooltip explicando que apenas administradores podem excluir modelos (ADR 017).
6. Como secretária da clínica, quero consultar e experimentar os modelos de evolução, vendo as ações de criar, editar, duplicar e ativar/desativar desabilitadas com motivo no tooltip e bloqueadas com 403 no backend.
7. Como fisioterapeuta ou administrador da clínica, quero visualizar a lista de modelos de evolução em `/clinica/templates/evolucoes` na variante A ("Cartões com prévia" no DS v2), filtrando por abas (Todos, Da clínica, Do sistema) e buscando por nome ou item, e experimentar qualquer modelo numa gaveta que monta o texto exatamente como no prontuário.
8. Como fisioterapeuta ou administrador da clínica, quero criar e editar modelos em `/clinica/templates/evolucoes/novo` e `/:id/editar` na variante A ("Montar e ver ao vivo" no DS v2) com React Hook Form + Zod, vendo no rodapé o primeiro problema de validação e quantos faltam, e testando o modelo ao vivo ao lado.
9. Como fisioterapeuta ou administrador da clínica, quero duplicar o modelo do sistema clicando em "Duplicar" na lista para abrir o editor com o aviso "Modelo do sistema" e salvá-lo como cópia da minha clínica (`POST`), levando apenas seções e itens não arquivados.
10. Como usuário da clínica, quero chegar à lista de modelos de evolução pelo menu da conta (`ClinicAccountMenu`) e pela gaveta "Nova evolução" ("Gerenciar modelos" com `?returnTo=`), voltando ao prontuário ao salvar ou cancelar/voltar.
11. Como fisioterapeuta ou administrador da clínica, quero que editar ou excluir um modelo de questionário (`ClinicQuestionnaire`) também preserve as perguntas e respostas dos questionários já enviados aos pacientes.
12. Como equipe de engenharia, quero que uma clínica nunca veja, edite, ative/desative, exclua ou injete `id`s de seções/itens de outra clínica (respondendo 404 para modelo alheio/sistema e 422 para `id` de seção/item alheio), e que o código legado v1, `evolution-template-prototype/` e `PrototypeSwitcher.tsx` sejam removidos.

## Decisões de Implementação

- **Módulos donos no backend:**
  - `Modules\ClinicalRecord` é dono de `clinic_evolution_templates`, `clinic_evolution_template_sections`, `clinic_evolution_template_items`, `clinic_patient_evolutions` e `clinic_patient_evolution_checked_items`.
  - `Modules\ClinicQuestionnaire` é dono de `clinic_questionnaire_templates`, `clinic_questionnaire_sections`, `clinic_questionnaire_questions`, `clinic_patient_questionnaires` e `clinic_patient_questionnaire_answers`.
- **Migrations:**
  - `modules/ClinicalRecord/database/migrations/`:
    - Adiciona `deleted_at` (`softDeletes`) em `clinic_evolution_templates`;
    - Adiciona `archived_at` (`timestamp`, nullable) em `clinic_evolution_template_sections` e `clinic_evolution_template_items`;
    - Troca a FK `clinic_patient_evolution_checked_items.evolution_template_item_id` de `cascadeOnDelete()` para `restrictOnDelete()`.
  - `modules/ClinicQuestionnaire/database/migrations/`:
    - Adiciona `archived_at` (`timestamp`, nullable) em `clinic_questionnaire_sections` e `clinic_questionnaire_questions`;
    - Troca a FK `clinic_patient_questionnaire_answers.questionnaire_question_id` de `cascadeOnDelete()` para `restrictOnDelete()`.
- **Contratos HTTP (`auth:clinic`, `clinic.guard`, envelope `data`):**
  - `GET /api/clinic/evolution-templates`: lista modelos do sistema e da clínica autenticada (ativos e inativos, não deletados), com `sections` e `items` filtrados por `whereNull('archived_at')` e ordenados por `sort_order`.
  - `GET /api/clinic/evolution-templates/{id}`: retorna o modelo (sistema ou da clínica autenticada) com seções e itens não arquivados; 404 para outra clínica ou inexistente.
  - `POST /api/clinic/evolution-templates`: cria modelo da clínica (`is_system = false`, `is_active = true`); requer `authorize('create', EvolutionTemplate::class)` (admin e fisioterapeuta; 403 para secretária).
  - `PUT /api/clinic/evolution-templates/{id}`: atualiza modelo da clínica; 404 para modelo do sistema ou de outra clínica; requer `authorize('update', $template)` (403 para secretária). Aceita `sections.*.id` e `sections.*.items.*.id` opcionais (inteiros). Se qualquer `id` de seção não pertencer ao modelo ou qualquer `id` de item não pertencer ao modelo, retorna `422` (`ValidationException`). Sincroniza em transação: atualiza existentes (e desarquiva se estivesse arquivado), cria novos, e arquiva (`archived_at = now()`) as seções e itens do modelo que não vieram no payload.
  - `PATCH /api/clinic/evolution-templates/{id}/active`: recebe `{ is_active: boolean }` (`UpdateEvolutionTemplateActiveRequest`); 404 para modelo do sistema ou de outra clínica; requer `authorize('update', $template)` (403 para secretária); atualiza apenas `is_active` sem tocar nas seções/itens.
  - `DELETE /api/clinic/evolution-templates/{id}`: 404 para modelo do sistema ou de outra clínica; requer `authorize('delete', $template)` (apenas admin; 403 para fisioterapeuta e secretária). Se o modelo possui evoluções vinculadas (incluindo `withTrashed()`) ou itens referenciados em `checked_items`, executa `$template->delete()` (`SoftDeletes`) sem apagar seções nem itens; caso contrário, apaga itens, seções e faz `forceDelete()` no modelo.
  - `PUT /api/clinic/questionnaire-templates/{id}` e `DELETE /api/clinic/questionnaire-templates/{id}`: sincronizam seções e perguntas por `id` (arquivando com `archived_at` o que saiu e recusando com 422 `id` de outro questionário/clínica) e fazem soft delete preservando seções/perguntas quando já houver envios/respostas.
- **Histórico de evoluções e questionários:**
  - `PatientEvolution::template()` usa `withTrashed()`.
  - `EvolutionRepository::findForClinic` e `listByPatient` carregam `template` com `withTrashed()` e `checkedItems.item.section` sem filtrar `archived_at`, garantindo que evoluções antigas mostrem os itens marcados e o nome do modelo mesmo após arquivamento de itens ou exclusão lógica do modelo.
  - `PatientQuestionnaireRepository::find` continua carregando `template` com `withTrashed()`, e as respostas carregam a pergunta mesmo arquivada; `listForClinic` e `find` de `QuestionnaireTemplateRepository` carregam apenas seções e perguntas com `whereNull('archived_at')`.
- **Camadas no frontend (`resources/js/`):**
  - `application/clinic/permissions.ts`: adiciona `can.manageEvolutionTemplates(role)` (`role === 'admin' || role === 'physiotherapist'`) e mantém `can.delete(role)` (`role === 'admin'`).
  - `application/clinic/ports.ts`, `infrastructure/repositories/api-clinic-evolutions.ts`, `application/clinic/use-evolutions.ts`:
    - `EvolutionTemplateWriteDto` passa a aceitar `id?: number` em cada seção e em cada item;
    - `EvolutionsRepository` ganha `setTemplateActive(id: string, isActive: boolean): Promise<EvolutionTemplate>`;
    - Novo hook `useToggleEvolutionTemplateActive()`.
  - `pages/clinic/evolution-template/`:
    - `EvolutionTemplateListPage.tsx`: lista v2 na variante A ("Cartões com prévia"), sem `?variant=`, sem `DEMO_TEMPLATES`, com abas Todos / Da clínica / Do sistema, busca por nome ou item, gaveta `DsDrawer` com `TryTemplate` (usando `itemLine` de `@/application/clinic/evolution-sheet-text`), interruptor `DsSwitch` ("Ativo") chamando `useToggleEvolutionTemplateActive`, modal `DsModal` de confirmação de exclusão, suporte a `?returnTo=` (botão de voltar para o prontuário quando veio de lá e repasse do `returnTo` para `/novo` e `/:id/editar`), e botões desabilitados com `aria-disabled="true"` + tooltip com motivo para papéis sem permissão (ADR 017).
    - `EvolutionTemplateNewPage.tsx`, `EvolutionTemplateEditPage.tsx` e pasta `pages/clinic/evolution-template/evolution-template-editor/`: editor v2 na variante A ("Montar e ver ao vivo") com React Hook Form (`useForm`, `useFieldArray`) + Zod, preservando o `id` do banco em seções e itens existentes, exibindo no rodapé o primeiro problema e `(+N)` para os demais, prévia ao vivo `TryTemplate` ao lado, modo "Salvar como cópia" (`useCreateEvolutionTemplate`) quando `template.isSystem` for `true`, e retorno para `returnTo ?? '/clinica/templates/evolucoes'` ao salvar ou cancelar/voltar.
  - `pages/clinic/patient/evolution-form/`:
    - Filtra `templates` por `t.isActive` para que modelos inativos não apareçam na escolha de nova evolução (mantendo o modelo vinculado caso esteja editando um rascunho cujo modelo foi desativado depois);
    - Em `TemplateSelect`, exibe o link/botão "Gerenciar modelos" que navega para `/clinica/templates/evolucoes?returnTo=/clinica/pacientes/${patientId}` (mesmo quando ainda não há modelos ativos da clínica).
  - `components/clinic/ClinicAccountMenu.tsx`:
    - Adiciona o item "Modelos de evolução" ("Itens prontos que viram texto no prontuário") apontando para `/clinica/templates/evolucoes`, visível para todos os perfis e destacado quando `location.pathname.startsWith('/clinica/templates/evolucoes')`.

## Fatias Verticais

Conforme instruído pelo usuário, toda a entrega fica em **uma única tarefa** (`001-modelos-evolucao-ds-e-preservacao-historico`) dividida em duas partes sequenciais com commit ao fim de cada parte:

1. **Parte 1 — Backend ADR 021 + Questionários:** migrations (`archived_at`, `SoftDeletes`, `restrictOnDelete`), sincronização por `id` no `PUT` com validação 422 de posse, rota `PATCH /api/clinic/evolution-templates/{id}/active`, permissões na Policy/Controller (secretária só lê; admin/fisio criam/editam/ativam; só admin exclui), exclusão híbrida (física se nunca usado, soft delete se usado com `withTrashed()` nas evoluções), mesma proteção em `ClinicQuestionnaire` (incluindo envio de `id`s em `QuestionnaireTemplateEditPage`), e suíte completa de testes PHPUnit.
2. **Parte 2 — Telas v2, permissões, links e corte da v1/protótipo (ADR 020):** lista v2 e editor v2 (RHF + Zod) em `@/components/ds`, prévia "Experimentar" compartilhando `evolution-sheet-text.ts`, botões desabilitados com motivo por papel (ADR 017), links no `ClinicAccountMenu` e na gaveta "Nova evolução" com `?returnTo=`, filtro de modelos ativos na nova evolução, remoção da v1, de `TemplateSectionBuilder`/`TemplatePreview`/`types.ts`, de `evolution-template-prototype/` e de `PrototypeSwitcher.tsx`, atualização de `docs/prototipos-v2.md` e ADRs 020/021, testes Vitest e smoke test no navegador headless.

## Testes

- **Backend (`./vendor/bin/phpunit modules/ClinicalRecord/tests modules/ClinicQuestionnaire/tests`):**
  - Editar um modelo usado numa evolução assinada mantém os `checked_items` e `free_text_value` dela;
  - Remover um item ou seção no `PUT` arquiva (`archived_at` preenchido), a listagem/detalhe do modelo não devolve o item arquivado para novas evoluções, e a evolução antiga continua devolvendo o item marcado;
  - Enviar `id` de seção ou item de outro modelo ou de outra clínica no `PUT` responde `422`;
  - `PATCH /api/clinic/evolution-templates/{id}/active` grava apenas `is_active` e não altera nem arquiva seções/itens;
  - Modelo do sistema e modelo de outra clínica respondem `404` no `PUT`, no `PATCH .../active` e no `DELETE` (e `GET` de outra clínica responde `404`);
  - Secretária recebe `403` em `POST`, `PUT`, `PATCH .../active` e `DELETE`, mas consegue `GET` na lista e no detalhe; fisioterapeuta consegue `POST`, `PUT` e `PATCH .../active` e recebe `403` no `DELETE`;
  - `DELETE` em modelo nunca usado apaga fisicamente do banco; `DELETE` em modelo já usado em evolução faz soft delete (`deleted_at` preenchido), mantém seções e itens no banco e a evolução antiga continua exibindo o modelo e seus `checked_items`;
  - Editar um `QuestionnaireTemplate` já respondido mantém as respostas (`clinic_patient_questionnaire_answers`), arquiva perguntas removidas e recusa `id` de pergunta/seção de outro questionário com `422`.
- **Frontend (`npx vitest run`):**
  - `EvolutionTemplateListPage.test.tsx`: renderiza cartões com seções em miniatura, abas e busca; abre a gaveta "Experimentar" e monta o texto no formato do prontuário (`evolution-sheet-text.ts`); modelo do sistema mostra "Duplicar" (que navega para `/:id/editar`) e não mostra "Ativo" nem "Excluir"; interruptor "Ativo" chama `PATCH .../active` e exibe selo "Inativo"; admin exclui modelo no modal; fisioterapeuta vê "Excluir" com `aria-disabled="true"` e tooltip; secretária vê "Novo modelo", "Duplicar", "Editar", "Ativo" e "Excluir" desabilitados com motivo; respeita `?returnTo=`.
  - `EvolutionTemplateEditorPage.test.tsx`: valida com RHF + Zod (nome, seção, título da seção, item, nome e texto do prontuário), mostra o primeiro problema e `(+N)` no rodapé, atualiza a prévia "Experimente" ao vivo, envia os `id`s de seções e itens existentes no `PUT`, salva modelo do sistema como cópia (`POST` sem `id`s) exibindo o alerta "Modelo do sistema", e volta para `returnTo` ao salvar ou cancelar.
  - Links e corte (`evolution-template-v2-cut.test.ts`, `ClinicTopbar.test.tsx`, `PatientRecordPage.test.tsx`): link "Modelos de evolução" no `ClinicAccountMenu`, link "Gerenciar modelos" com `?returnTo=` na gaveta "Nova evolução", filtro de modelos inativos na nova evolução, e confirmação de que `evolution-template-prototype/`, `PrototypeSwitcher.tsx`, `TemplateSectionBuilder` e `TemplatePreview` foram removidos e as páginas não importam `apiClient` nem `@/components/ui/*`.

## Fora do Escopo

- Modelos de avaliação do admin (`admin_assessment_fields` / `clinic_assessment_answers`), pois ainda não existe tela de edição para eles (conforme ADR 021).
