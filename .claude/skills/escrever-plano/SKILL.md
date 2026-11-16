---
name: escrever-plano
description: Transforma o resultado da skill refinar (o decisoes.md da feature e a conversa) num plano de implementação, na pasta da feature em .ai-workbench/NNN-<slug>/ (cria a pasta se ainda não existe), com README.md e plans/. Segunda etapa do ciclo (refinar, escrever-plano, criar-tarefas, implementar-tarefa, revisao-adversaria). Use quando pedirem para escrever, montar ou salvar o plano de uma funcionalidade.
---

# Escrever o plano

Junte o que já se sabe do `decisoes.md` da feature, da conversa e do código num
plano. Quando há `decisoes.md` (gravado pela skill `refinar`), ele é a fonte: a
conversa pode ter sido com outro agente ou já ter acabado. Se ele e a conversa
discordam, pergunte ao usuário qual vale.

**Não entreviste o usuário de novo**: se ainda há decisão em aberto (inclusive
na seção "Em aberto" do `decisoes.md`), volte para a skill `refinar`. A única
exceção são as perguntas pontuais do passo 5 ("Ataque o plano"), sobre furos
que o plano escrito revelou. Se forem muitas, ou se mudarem o escopo, aí também
é caso de voltar para o `refinar`.

## Passo a passo

1. **Conheça o terreno.** Explore o código da área que vai mudar, se ainda não
   explorou. Use o vocabulário que o código já usa (`Clinic`, `ClinicUser`,
   `Patient`, `TreatmentPlan`, `Appointment`, `Exercise`...). Leia o ADR de
   `docs/adr/` e as skills de `.claude/skills/` que cobrem a
   área (tabela "Skill Map" do `AGENTS.md`).

2. **Desenhe as camadas** que vão mudar, como o fisioweb é organizado:
   - **Backend** (módulo dono em `modules/<Modulo>/`): migration, Model,
     Repository + interface, Service/UseCase, DTO, FormRequest, Controller,
     Policy, rota no guard certo, job da fila, contrato público ou evento se
     outro módulo participa (skill `architecture-paradigm-modular-monolith`).
   - **Frontend** (`resources/js/`): entidade em `domain/`, port + hook React
     Query em `application/`, Repository + mapper em `infrastructure/`, página
     em `pages/{admin,clinic}/<recurso>/`, rota em `routes/`, `permissions.ts`.

   Mostre ao usuário e confirme se bate com o que ele espera. Pergunte quais
   comportamentos ele quer ver cobertos por teste.

3. **Crie a pasta da feature** `.ai-workbench/NNN-<slug>/` (slug em
   kebab-case; `NNN` é o próximo número depois do maior que existe em
   `.ai-workbench/`: `ls -d .ai-workbench/[0-9]*/`). Se a feature já tem pasta
   (a skill `refinar` cria a pasta com o `decisoes.md`), use a dela. A estrutura completa está em
   `docs/ai-harness/DEFINITION_OF_DONE.md`, seção "Pasta de trabalho".

4. **Escreva o plano** com o modelo abaixo e salve em
   `.ai-workbench/NNN-<slug>/plans/<slug>.md`. Para a data, rode
   `date '+%Y-%m-%d'`.

<modelo-do-plano>

# {Título}

Data: {data}
Fonte: {de onde veio: `decisoes.md`, conversa, reunião, documento}

## Problema

O problema do ponto de vista de quem usa.

## Solução

A solução do ponto de vista de quem usa.

## Histórias de Usuário

Uma lista numerada e LONGA, cobrindo todos os aspectos, no formato:

1. Como {quem}, quero {o quê}, para {benefício}.

## Decisões de Implementação

- Qual módulo é o dono e quais telas mudam
- Se precisa de migration, e o que acontece com o dado antigo
- Contrato de cada endpoint novo ou alterado: método, URL, guard, entrada e
  saída (envelope `data`)
- Permissões: qual papel pode fazer cada ação, e qual Policy decide
- Isolamento, obrigatório em todo plano: para cada endpoint, query ou job novo
  ou alterado, onde o filtro por `clinic_id` precisa estar (na busca do
  Repository, na Policy de posse ou nos dois) e de onde o `clinic_id` vem
  (sempre da clínica do usuário autenticado, nunca da requisição). Na área do
  paciente, o mesmo com o paciente autenticado. Se a funcionalidade não toca
  dado de clínica nem de paciente, diga isso com todas as letras
- Colaboração entre módulos: contrato público, DTO ou evento
- Fila, integrações externas e cache, quando se aplicam
- Decisões de arquitetura e o que foi trocado pelo quê (se criar fronteira nova,
  prever um ADR em `docs/adr/`)

Sem caminho de arquivo e sem trecho de código: ficam velhos rápido. A exceção é
um trecho que define uma decisão melhor do que texto (o formato de um tipo, uma
máquina de estados); nesse caso, só a parte que importa.

## Fatias Verticais

A entrega quebrada em fatias, em ordem de dependência. Cada fatia atravessa
todas as camadas de ponta a ponta (migration, Repository, Service, Controller,
Policy, tela, testes) e pode ser demonstrada sozinha. Esta seção alimenta a
skill `criar-tarefas`.

## Testes

- Como os testes rodam: `php artisan test --filter=...`,
  `vendor/bin/phpunit modules/<Modulo>/tests` e `npm run test`
- Que padrões já existem e serão copiados (`actingAs($user, 'clinic')`,
  factories, `RefreshDatabase`, `Queue::fake`): cite um teste existente parecido
- Quais comportamentos serão testados, incluindo o de outra clínica e o de papel
  sem permissão

## Fora do Escopo

O que fica de fora, dito com todas as letras.

## Notas

Qualquer outra coisa que importe.

</modelo-do-plano>

5. **Ataque o plano antes de seguir.** Releia o plano e o `decisoes.md`
   juntos, como quem quer derrubar o plano, não item por item. Procure:
   - **Contradição:** duas decisões que, sozinhas, fazem sentido, mas juntas
     são impossíveis (uma história pede o que uma decisão proíbe, uma fatia
     depende de outra que vem depois).
   - **Termo vago:** palavra que daria duas implementações diferentes
     ("recentes", "grande", "rápido", "ativos"). Troque por número ou regra.
   - **Suposição não conferida:** "a API já devolve X", "o Model já tem Y",
     "a tela já filtra Z". Confira no código. Se o código não confirma, a
     suposição vira decisão ou tarefa.
   - **Regra só no front:** validação ou limite que o plano põe na tela e não
     no backend.
   - **Isolamento sem lugar:** endpoint, query ou job do plano sem dizer onde
     fica o filtro por `clinic_id`, ou com o `clinic_id` vindo da requisição.
   - **Borda faltando:** lista vazia, limite, dado antigo sem o campo novo,
     duas pessoas editando ao mesmo tempo, outra clínica, papel sem permissão.
   - **Conflito com ADR** de `docs/adr/`.

   Cada achado vira uma pergunta ao usuário, uma por vez, com a sua resposta
   recomendada. Grave a resposta no `decisoes.md` (sessão nova, como na skill
   `refinar`) e ajuste o plano. Se forem muitas perguntas, ou se alguma mudar o
   escopo, volte para a skill `refinar`. Sem achado, diga isso em uma linha.

6. **Escreva o `README.md` da feature** com o modelo abaixo. Ele é o índice:
   as próximas skills atualizam a tabela de tarefas.

<modelo-do-readme>

# {NNN} · {Título}

{Uma frase: o problema e quem ganha com a solução.}

- **Status:** planejada | em andamento | em revisão | concluída
- **Branch:** `feat/{slug}`
- **Plano:** [`plans/{slug}.md`](plans/{slug}.md)
- **Decisões:** [`decisoes.md`](decisoes.md) (quando a skill `refinar` gravou)
- **Módulos:** {módulos de `modules/` e áreas do SPA que mudam}

## Tarefas

| Tarefa | Status | Issue | PR |
|---|---|---|---|
| (a skill `criar-tarefas` preenche) | | | |

## Pastas

- `decisoes.md`, `plans/`, `tasks/`: no git.
- `evidence/`, `review/`, `DEFERRED.md`: locais, fora do git.

</modelo-do-readme>

7. Diga ao usuário onde a feature foi criada e sugira o próximo passo: a skill
   `criar-tarefas`.
