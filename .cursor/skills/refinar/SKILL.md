---
name: refinar
description: Entrevista o usuário sobre uma ideia, funcionalidade ou desenho até chegarem a um entendimento comum, resolvendo cada decisão em aberto, uma pergunta por vez. É a primeira etapa do ciclo (refinar, escrever-plano, criar-tarefas, implementar-tarefa, revisao-adversaria). Use quando pedirem para refinar uma ideia, especificar uma funcionalidade, testar um desenho, "me sabatine" ou antes de escrever um plano.
---

# Refinar

Entreviste o usuário sobre cada aspecto da ideia até os dois entenderem a mesma
coisa. Percorra a árvore de decisões um galho por vez, resolvendo primeiro as
decisões de que outras dependem.

## Regras

- **Uma pergunta por vez**, com a ferramenta de pergunta do agente
  (`AskUserQuestion` no Claude Code) ou, sem ela, em texto, com as opções
  numeradas. Para cada uma, dê a sua resposta recomendada como primeira opção.
- **Se o código responde, não pergunte.** Antes de perguntar como algo funciona
  hoje, procure no repositório: módulos em `modules/`, telas em
  `resources/js/pages/`, ADRs em `docs/adr/`, docs em `docs/`, as features
  anteriores em `.ai-workbench/*/` (`README.md`, `decisoes.md` e `plans/`) e as skills em
  `.claude/skills/`, `.cursor/skills/` ou `.agents/skills/` (as três canônicas).
- Pergunte o que só o usuário sabe: o que a clínica, o fisioterapeuta ou o
  paciente precisa, o que fica fora, qual comportamento é o certo quando há
  dúvida.

## O que sempre precisa sair resolvido no fisioweb

- **Quem usa:** admin do painel master, clínica (`admin`, `physiotherapist`,
  `secretary`) ou paciente? Qual papel libera cada ação?
- **Isolamento:** o que uma clínica nunca pode ver da outra, e o que um paciente
  nunca pode ver de outro paciente.
- **Onde vive:** qual módulo de `modules/` é o dono do dado e da regra
  (`Clinic`, `ClinicScheduling`, `TreatmentProgram`, `ClinicalRecord`...), ou
  se precisa de módulo novo. Se outro módulo precisa do dado, por qual contrato
  ou evento. Qual área do SPA (`pages/admin`, `pages/clinic`, área do
  paciente).
- **Dados:** precisa de migration? Mexe em tabela grande? Há dado antigo para
  converter? É dado de saúde (LGPD)?
- **Fila e integrações:** algo roda em job (PDF, upload para R2, WhatsApp,
  Google Calendar, e-mail)? Depende de funcionalidade do plano da clínica?
- **Critérios de sucesso:** como a gente sabe que funcionou, em termos que um
  teste ou uma tela consegue conferir.
- **Fora do escopo:** o que fica explicitamente para depois.

## Grave cada decisão

A conversa não é o registro: outro agente (Claude Code, Cursor, Antigravity) ou
outra sessão vai continuar daqui. Grave cada decisão em
`.ai-workbench/<feature>/decisoes.md` assim que o usuário responder, não só no
fim.

- Se a ideia já tem pasta em `.ai-workbench/`, use a dela. Se não tem, crie
  `.ai-workbench/NNN-<slug>/` na primeira resposta (o número segue a seção
  "Pasta de trabalho" de `docs/ai-harness/DEFINITION_OF_DONE.md`). A skill
  `escrever-plano` usa a mesma pasta depois.
- Cada vez que a skill roda é uma sessão nova no fim do arquivo, com a data de
  `date '+%Y-%m-%d'`. Não reescreva as sessões anteriores: se uma decisão
  mudou, registre a nova e diga qual ela substitui.
- Uma linha por decisão: a pergunta, a resposta e o porquê, quando o usuário
  disse.
- O arquivo entra no git: sem dado de paciente, nome de clínica real ou
  credencial.

<modelo-das-decisoes>

# Decisões · {Título}

## Sessão {data}

- **{Pergunta curta}** → {resposta}. {Por quê, se o usuário disse.}
- **{Pergunta curta}** → {resposta}. (Substitui a decisão de {data} sobre {tema}.)

### Fora do escopo

- {O que ficou para depois}

### Em aberto

- {Só se a sessão parou antes de fechar tudo; a próxima começa por aqui}

</modelo-das-decisoes>

## Quando parar

Quando não houver mais decisão em aberto, confira que o `decisoes.md` tem tudo o
que foi decidido e o que ficou fora, e que a seção "Em aberto" saiu ou ficou
vazia. Mostre ao usuário o caminho do arquivo e um resumo em tópicos, e sugira o
próximo passo: a skill `escrever-plano`.
