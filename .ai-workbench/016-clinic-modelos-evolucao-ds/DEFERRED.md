# Trabalho adiado · 016-clinic-modelos-evolucao-ds

- 2026-11-02 · `001-modelos-evolucao-ds-e-preservacao-historico` · Modelos de avaliação do admin (`admin_assessment_fields` / `clinic_assessment_answers`): as FKs ainda usam `cascadeOnDelete`, mas hoje não existe tela que edite esses modelos (conforme registrado no ADR 021). Quando a edição de modelos de avaliação do admin for criada, aplicar sincronização por `id` + `archived_at` + `restrictOnDelete`.

## Code review de 2026-11-02 — aceitos como estão pelo usuário (erros menores)

- Exclusão híbrida de modelo de evolução e de questionário sem transação nem lock (`EvolutionTemplateRepository::delete`, `QuestionnaireTemplateRepository::delete`): evolução criada no meio pode deixar o modelo meio apagado.
- Rascunho com modelo inativo mostra os itens marcáveis, mas a API recusa item novo de modelo inativo (`evolution-form/shared.ts`, `availableTemplates`).
- `returnTo` / `destination` vão para o `navigate()` sem conferir que começam com `/clinica/` (`EvolutionTemplateListPage.tsx`, editor).
- Ordenação de seções e itens repetida em `TryTemplate.tsx`, `evolution-sheet-text.ts` e `evolution-form/shared.ts`.
- Edição no lugar do rótulo de pergunta já respondida muda o que as respostas antigas mostram (decisão do ADR 021; guardar o texto junto da resposta mudaria o ADR) — aguarda decisão do usuário.
- 2026-11-02 · correcoes-code-review (revisão adversária) · Fechar o composer de evolução pelo X, Esc ou clique no fundo descarta o que foi escrito sem confirmação (`EvolutionFormModal.tsx`, `onOpenChange` do modal de fora; vem do protótipo 92574ab). Reaproveitar o `leaveConfirmOpen` do "Gerenciar modelos". Nota: `touched` liga ao clicar no modo que já está ativo (só gera confirmação a mais).
- 2026-11-02 · correcoes-code-review (revisão adversária) · Questionário respondido filtra perguntas por `created_at <= answered_at`: pergunta criada enquanto o paciente respondia aparece como não respondida, e pergunta respondida movida para seção nova aparece na seção nova.
- 2026-11-02 · correcoes-code-review (smoke test) · Pergunta criada no mesmo segundo da resposta aparece no questionário respondido (`PatientQuestionnaireRepository::find`, `created_at <= answered_at` com precisão de segundo). Correção provável: `<`. Menor, aceito pelo usuário.
- 2026-11-02 · correcoes-code-review (smoke test) · Item arquivado muda de posição na folha do rascunho: o editor renumera o `sort_order` dos itens que ficam e o arquivado empata; `withArchivedCheckedItems` o põe no fim. Salvar sem mexer regrava o texto na ordem nova. Menor, aceito pelo usuário.
- 2026-11-02 · correcoes-code-review (smoke test) · Rascunho de modelo excluído abre com o select vazio e a folha mostra o markdown cru (`**Seção:**`), porque `c.generated` vai num `<p>` em `EvolutionFormModal.tsx` (já existia).
- 2026-11-02 · correcoes-code-review (revisão adversária) · Trocar o modelo do rascunho pela API sem `checked_item_ids` nem `generated_text` apaga os itens mas mantém o texto do modelo anterior (`EvolutionService::update`). Só pela API; a tela sempre manda o texto. Menor, aceito pelo usuário.
