---
name: criar-tarefas
description: Quebra um plano em tarefas independentes, cada uma uma fatia vertical que atravessa todas as camadas, e salva cada tarefa em .ai-workbench/<feature>/tasks/, pronta para virar issue no GitHub. Terceira etapa do ciclo (refinar, escrever-plano, criar-tarefas, implementar-tarefa, revisao-adversaria). Use quando pedirem para quebrar um plano em tarefas, tickets, issues ou histórias.
---

# Criar tarefas

Quebre o plano (`.ai-workbench/<feature>/plans/<slug>.md` ou o que estiver na
conversa, mais o `decisoes.md` da feature, se houver) em tarefas que uma pessoa pode pegar sozinha. Se o plano só existe na
conversa, rode antes a skill `escrever-plano`, que cria a pasta da feature.

## Fatias verticais

Cada tarefa é uma **fatia vertical**: um caminho estreito, mas completo, por
todas as camadas que a funcionalidade toca. Nunca uma camada inteira de uma vez
("todas as migrations", "todo o frontend").

- Backend: migration → Model → Repository → Service → Controller + Policy →
  rota, com teste.
- Frontend: `domain/` → `infrastructure/` → `application/` → página e rota,
  com teste.
- Uma fatia pronta pode ser demonstrada ou conferida sozinha.
- Prefira muitas fatias finas a poucas grossas.

## Passo a passo

1. **Leia o plano** inteiro, e o código da área se ainda não leu.

2. **Proponha a quebra** como lista numerada. Para cada fatia:
   - **Resumo** (vira o título da issue)
   - **Tipo:** História, Tarefa ou Bug
   - **Depende de:** quais fatias precisam vir antes
   - **Histórias cobertas:** os números das histórias do plano

3. **Pergunte ao usuário:** o tamanho está certo? As dependências estão certas?
   Alguma fatia deve ser juntada ou dividida? Repita até ele aprovar.

4. **Confira a cobertura contra o plano.** Antes de salvar, monte uma tabela
   história → fatias e mostre ao usuário, com as lacunas destacadas:
   - Toda história de "Histórias de Usuário" do plano aparece em "Histórias
     cobertas" de pelo menos uma fatia. Para cada história sem fatia, crie a
     fatia ou pergunte ao usuário se ela vai para "Fora do Escopo" do plano (e
     anote lá).
   - Nenhuma fatia faz algo que o plano põe em "Fora do Escopo" nem contradiz
     "Decisões de Implementação" ou o `decisoes.md`. Se contradiz, o plano ou a
     fatia está errado: pergunte qual.

5. **Confira se cada tarefa está pronta para ser pega.** Uma tarefa só sai
   daqui se todos os critérios de aceite podem ser conferidos (um teste, um
   comando, uma tela que alguém abre) e se nada nela depende de uma decisão que
   ninguém tomou. Se faltar decisão, volte ao usuário.

6. **Salve** cada tarefa em `.ai-workbench/<feature>/tasks/NNN-<slug>.md`,
   numerada em ordem de dependência (`001-...`, `002-...`), com o modelo abaixo.
   As "Histórias cobertas" da fatia vão para o campo **Histórias**.
   A numeração é por feature: toda feature começa no `001`.

<modelo-da-tarefa>

# {Resumo}

**Tipo:** {História | Tarefa | Bug}
**Plano:** `../plans/{slug}.md`
**Histórias:** {números das histórias do plano que esta tarefa cobre: 1, 2, 5}
**Issue:** {#NNN, ou "ainda não criada"}

## Descrição

Um ou dois parágrafos: o problema e a abordagem.

## O que construir

O comportamento de ponta a ponta desta fatia, sem descrever camada por camada.
Diga o que importa aqui: qual módulo é o dono, quais telas, se precisa de
migration, qual guard e qual papel tem permissão, onde entra o filtro por
`clinic_id`, se há fila ou integração externa.

Sem caminho de arquivo e sem trecho de código.

## Critérios de Aceite

- [ ] Critério 1
- [ ] Critério 2
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `NNN-{slug}` ({resumo}), ou "Nada: pode começar já".

## Notas de Implementação

- **Branch:** `feat/{slug}` (ou `bugfix/{slug}` para bug)
- **Exemplo no código:** {1 ou 2 arquivos que já fazem algo parecido}
- **Skills:** {as skills de `.claude/skills/` / `.cursor/skills/` que cobrem esta fatia}

## Como testar na mão

Os passos para conferir a funcionalidade com o sistema no ar: qual clínica, qual
papel, qual tela ou endpoint, o que deve aparecer.

</modelo-da-tarefa>

7. **Atualize o `README.md` da feature:** uma linha por tarefa na tabela
   "Tarefas", com status `a fazer`.

8. Liste as tarefas salvas e sugira o próximo passo: criar as issues no GitHub
   (`gh issue create`, só se o usuário pedir) e depois rodar a skill
   `implementar-tarefa` na primeira sem dependência.
