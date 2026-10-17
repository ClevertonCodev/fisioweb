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
  anteriores em `.ai-workbench/*/` (`README.md` e `plans/`) e as skills em
  `.claude/skills/` ou `.cursor/skills/` (ambas canônicas).
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

## Quando parar

Quando não houver mais decisão em aberto, resuma em tópicos o que foi decidido e
o que ficou fora, e sugira o próximo passo: a skill `escrever-plano`.
