# ADR: O prontuário v2 (painel B) substitui a v1 de vez

## Contexto

O protótipo do prontuário no design system v2 foi aprovado na variante B, "Painel de acompanhamento". Ele aparecia só em desenvolvimento (`?variant=`), com ações de escrita como stub, e a v1 continuava em produção. Faltava decidir como a B entra no produto.

## Decisão

A B substitui a v1 em `/clinica/pacientes/:id` em todos os ambientes, sem feature flag e sem rota paralela. A tela v1 desta rota, o `PrototypeSwitcher` desta rota e o código do painel na pasta de protótipo saem. O `PrototypeSwitcher` continua no código porque outras telas usam. A página foi reescrita com testes; o protótipo foi só referência.

Decisões de produto tomadas junto:

- **A aba fica na URL** (`tab=clinico|agenda|programas|arquivos`). Valor inválido ou `?tab=` antigo da v1 cai em Clínico. A busca e o drawer aberto não entram na URL.
- **A busca cobre só evolução, avaliação, questionário e arquivo.** Consultas e programas não somem por causa do texto.
- **Os números e o gráfico vêm das consultas já filtradas pela API** (ADR 018). O fisioterapeuta vê um aviso de que aqueles números são das consultas dele; os registros clínicos do paciente (evolução, avaliação, questionário, arquivo, programa) aparecem mesmo quando outro profissional os fez.
- **A tela é v2 pura:** só `@/components/ds` e tokens `--ds-*`, dentro do `ClinicLayout`, com rolagem própria e largura máxima de 1920 px.

## Consequências

- Benefícios:
  - Um código só para o prontuário, com testes. A v1 e o interruptor de protótipo desta rota saem juntos.
  - Quem abre o paciente vê o acompanhamento aprovado em qualquer ambiente.
- Custos:
  - Sem flag, não há volta pela configuração: reverter é `git revert`.
  - As ações que gravam (evolução, arquivo, questionário, WhatsApp, Agendar, link com token) foram fatiadas; nesta entrega os botões podem aparecer sem abrir o fluxo que grava.
- Regras que agentes devem preservar:
  - Não reintroduzir componente de `components/ui` (v1) nesta tela.
  - Não filtrar consulta nem programa por `patientId` no navegador (ADR 018).
  - Não voltar o `?variant=` nem o `PrototypeSwitcher` nesta rota.

## Alternativas descartadas

- Feature flag por plano da clínica: duas telas para manter, sem pedido de rollout gradual.
- Rota paralela (`/clinica/pacientes/:id/v2`): divide os links da lista e da agenda.
- Manter a v1 em produção e a B só em desenvolvimento: é o estado que esta decisão encerra.
