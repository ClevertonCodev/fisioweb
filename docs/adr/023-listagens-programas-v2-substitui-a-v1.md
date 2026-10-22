# ADR: As listagens v2 de Histórico, Exercícios e Modelos substituem a v1

## Contexto

Os protótipos das três listagens de Programas no design system v2 foram aprovados: Histórico em cartões (variante A), biblioteca de exercícios em grade (variante D) e modelos com mapa do corpo (variante C). Eles apareciam só em desenvolvimento (`?variant=`), com várias ações em stub (duplicar, virar modelo, excluir, usar exercício num programa novo). Em produção continuava a v1 (tabela/lista shadcn). Havia ainda duas URLs para a mesma biblioteca (`/clinica/programas/exercicios` e `/clinica/exercicios`).

## Decisão

As três listagens v2 substituem a v1 em todos os ambientes, sem feature flag e sem rota paralela. O `PrototypeSwitcher`, as pastas `program-history-prototype`, `exercise-library-prototype` e `program-models-prototype`, e o código morto da v1 dessas rotas saem. O `PrototypeSwitcher` continua no repositório porque o assistente, o detalhe do programa, a agenda e outras telas ainda usam.

Decisões de produto tomadas junto:

- **Filtros extras ficam no navegador nesta entrega.** A API já aceita busca, `status`, `patient_id`, `without_patient` nos planos e `search`/`difficulty_level` nos exercícios. Situação derivada, validade, criado entre, favoritos, especialidade/região por nome e região do modelo pelo título continuam no cliente. Levar o resto para a API fica no `DEFERRED.md` da feature.
- **Ações do Histórico e de Meus modelos são as da v1:** copiar link, PDF, texto do prontuário, duplicar, transformar em modelo, excluir rascunho (só admin, item visível e desabilitado para os outros papéis — ADR 017).
- **“Usar em novo programa/modelo” abre o assistente v1**, com o exercício já no grupo. Modelo = sem paciente, rascunho, e ao salvar cai em Meus modelos.
- **Usar modelo** carrega o detalhe e abre o mesmo assistente v1, igual à listagem antiga.
- **As duas URLs da biblioteca mostram a mesma grade D**; a do menu Exercícios não tem as abas de Programas.
- A tela é v2 pura: só `@/components/ds` e tokens `--ds-*`, dentro do `ClinicLayout`, com rolagem própria e largura máxima de 1920 px.

## Consequências

- Benefícios:
  - Um código só para cada listagem, com testes. A v1 sem a casca nova e o protótipo descartável saem juntos.
  - Fisioterapeuta e secretária entendem por que não excluem (item desabilitado), e o backend continua recusando o `DELETE`.
- Custos:
  - Sem flag, não há volta pela configuração: reverter é `git revert`.
  - Filtros que a API ainda não tem recortam só o que já carregou (histórico busca 200; biblioteca pagina de 20 em 20).
  - Região do modelo continua heurística de título/descrição.
- Regras que agentes devem preservar:
  - Não reintroduzir componente de `components/ui` (v1) nestas três listagens.
  - Não reintroduzir `?variant=` nem pasta `*-prototype` nestas rotas.
  - Excluir continua só no admin da clínica, com Policy no backend (ADR 017).
  - Assistente, detalhe e enviar exercício não mudam de visual nesta decisão.

## Alternativas descartadas

- Feature flag por plano da clínica: duas telas para manter, sem pedido de rollout gradual.
- Rota paralela (`/clinica/programas-v2`): divide os atalhos do prontuário e do menu.
- Assistente v2 nesta mesma entrega: o visual já existe em protótipo, mas ficou de fora de propósito para não misturar o corte das listagens com um fluxo de gravação novo.
