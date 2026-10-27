# ADR: A lista de pacientes v2 (cartões C2) substitui a v1 de vez

## Contexto

O protótipo da lista de pacientes no design system v2 foi aprovado na variante C2 (commit c93122b): um cartão por paciente, atalhos no rodapé, filtros numa barra acima dos cartões e chips para os filtros aplicados. Ele aparecia só em desenvolvimento (`?variant=`), com o "Inativar" como stub, e a v1 em tabela continuava em produção. Faltava decidir como a C2 entra no produto e o que a v1 fazia que a C2 não faz.

## Decisão

A C2 substitui a v1 em `/clinica/pacientes` em todos os ambientes, sem feature flag e sem rota paralela. A `PatientListOriginal`, a pasta do protótipo e o uso do `PrototypeSwitcher` nessa rota saem. O `PrototypeSwitcher` continua no código porque a agenda usa. A página foi reescrita com testes; o protótipo foi só referência.

Decisões de produto tomadas junto:

- **Inativar é individual**, pelo quarto atalho do cartão. A seleção em massa da v1 não veio para a C2 e está no `DEFERRED.md` da feature.
- **Inativar e reativar pedem confirmação** num `DsModal` com o nome do paciente. A v1 inativava num clique. O texto não promete que o paciente perde acesso ao app, porque o `is_active` não bloqueia o login (ver ADR 014).
- **Paciente inativo continua na lista** por padrão: a situação padrão é "ativos e inativos". O cartão do inativo aparece esmaecido (nome e diagnóstico, não os selos), com o selo "Inativo", e o atalho vira "Reativar". Os outros atalhos continuam funcionando.
- **Os atalhos mantêm os destinos da v1:** o prontuário pelo nome (link esticado sobre o cartão inteiro, focável pelo teclado), mais programas, agendamentos e edição.
- A tela é v2 pura: só `@/components/ds` e tokens `--ds-*`, dentro do `ClinicLayout`, com rolagem própria e largura máxima de 1920 px.

## Consequências

- Benefícios:
  - Um código só para a lista de pacientes, com testes. A v1 sem testes e o protótipo descartável saem juntos.
  - Inativar por engano ficou mais difícil (confirmação), e o inativo ficou visível e reversível na própria lista.
- Custos:
  - Quem usava a seleção em massa da v1 perde esse recurso até ele ser desenhado para os cartões.
  - Sem flag, não há volta pela configuração: reverter é `git revert`.
  - A busca do backend usa `like`, que no Postgres diferencia maiúsculas ("kiel" não acha "Kiel"), igual à v1. Na tela nova, com a busca em destaque, isso aparece mais. Está no `DEFERRED.md` da feature.
- Regras que agentes devem preservar:
  - Não reintroduzir componente de `components/ui` (v1) nesta tela.
  - Ação nova no cartão segue o rodapé de atalhos (ícone com tooltip) e a regra de papel do ADR 017.
  - Mudança de situação do paciente sempre com confirmação na tela e com Policy no backend (ADR 014).

## Alternativas descartadas

- Feature flag por plano da clínica: duas telas para manter, sem pedido de rollout gradual.
- Rota paralela (`/clinica/pacientes-v2`): divide os links (prontuário, agenda) entre duas listas.
- Checkbox de seleção em cada cartão, ou um "modo seleção": não foi prototipado e muda o desenho aprovado; ficou para depois.
- Abrir só com ativos: esconderia o inativo de quem procura por ele; a escolha foi mostrar os dois e marcar o inativo.
