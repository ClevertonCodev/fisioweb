---
name: orquestrador
description: "Implementa uma tarefa de .ai-workbench/<feature>/tasks/ com dois papéis: a sessão atual é o orquestrador (planeja, confere e decide, no modelo que já está rodando) e um subagente executor-de-fatia mais barato escreve teste e código, uma fatia por vez, devolvendo o controle a cada fatia, decisão em aberto ou erro repetido. Pergunta qual executor usar: Opus low (recomendado), Sonnet high ou Opus medium. Termina na Definição de Pronto, como a implementar-tarefa. Fica fora do ciclo: só roda quando o usuário chama. Só no Claude Code."
argument-hint: "<tarefa> [opus-low | sonnet-high | opus-medium]"
disable-model-invocation: true
---

# Orquestrador

O mesmo trabalho da skill `implementar-tarefa`, dividido em dois papéis para
gastar menos cota:

- **Orquestrador:** esta sessão, no modelo e no effort que já estão rodando.
  Não se escolhe. Ele lê, planeja, confere a evidência, decide e fecha a
  Definição de Pronto. **Ele não escreve o código da fatia**, a não ser quando
  assume uma fatia (passo 5).
- **Executor:** o subagente `executor-de-fatia` (`.claude/agents/executor-de-fatia.md`),
  num modelo mais barato. Ele escreve teste e código e devolve o controle com
  um relatório.

Fica fora do ciclo do harness (`refinar` → `escrever-plano` → `criar-tarefas` →
`implementar-tarefa` → `revisao-adversaria`). É uma alternativa à
`implementar-tarefa`, que só o usuário escolhe.

**Só no Claude Code**: a skill precisa escolher o modelo e o effort do
subagente em cada chamada. Se o seu agente não consegue, pare e diga ao
usuário para usar a `implementar-tarefa`.

## 1. Escolha do executor

Se o argumento já trouxe a opção, use. Se não, pergunte com `AskUserQuestion`,
nesta ordem:

| Opção | Chamada do Agent | Quando |
|---|---|---|
| Opus low (recomendado) | `model: "opus"`, `effort: "low"` | padrão; mais barato que o Opus medium e segue o vocabulário do plano |
| Sonnet high | `model: "sonnet"`, `effort: "high"` | o mais barato por token; mais turnos e mais propenso a inventar nomes |
| Opus medium | `model: "opus"`, `effort: "medium"` | fatia com mais raciocínio de domínio |

A recomendação vem de uma medição só, na tarefa 022/008. Ela não é regra.

## 2. Prepare (orquestrador)

Faça os passos 0 e 1 da `implementar-tarefa`: leia o `README.md` da feature, a
tarefa, o plano, o `decisoes.md` e a Definição de Pronto; confira a branch
(sugira e espere confirmação); marque a tarefa `em andamento`; planeje com o
usuário e **só siga depois que ele aprovar**.

Além disso, monte duas listas que vão em todo pedido ao executor:

- **Fatias.** Grupos de comportamentos, em ordem de dependência, cada um
  pequeno o bastante para um ciclo vermelho-verde sem decisão de desenho. Por
  exemplo: migration + Model + teste de padrão; endpoint + Policy + caso de
  outra clínica; tela + teste de tela.
- **Nomes fixados.** Todo nome que o plano, o `decisoes.md` ou **outra tarefa
  da feature** já decidiu: colunas, campos de JSON, rotas, classes, contratos,
  textos de tela. Procure nas outras tarefas também (`grep` em
  `.ai-workbench/<feature>/`): uma tarefa posterior costuma citar o nome que
  esta precisa criar. Nome que ninguém decidiu, decida agora e ponha na lista.

## 3. Despache uma fatia

Chame o executor com a ferramenta Agent:

- `subagent_type: "executor-de-fatia"`;
- `model` e `effort` da opção escolhida (esta skill pede os dois de forma explícita);
- o pedido, com tudo isto:

```
Tarefa: .ai-workbench/<feature>/tasks/<tarefa>.md
Plano: .ai-workbench/<feature>/plans/<slug>.md

Fatia <n> de <total>: <comportamentos, em ordem>

Nomes fixados:
- <nome>: <o que é>

Skills da área: <lista do Skill Map>

Já pronto: <fatias anteriores, ou "nada">
```

Guarde o id do agente que o resultado devolve. Nas fatias seguintes, continue
**o mesmo executor** com `SendMessage` (`to`: esse id), que mantém o contexto.
Abra um executor novo só se o anterior não responde mais.

## 4. Confira a devolução

O relatório do executor é uma alegação. A evidência é o diff e os testes.

1. Leia o relatório e o motivo da devolução.
2. Confira com os seus olhos: `git diff` e `git status` dos arquivos citados, e
   rode você mesmo os testes que ele citou. Confira que os nomes fixados
   aparecem como vieram.
3. Se o executor fez uma pergunta, responda com uma decisão, não com uma lista de opções.

## 5. Decida uma de quatro

- **Segue:** a fatia está certa. Mande a próxima com `SendMessage`.
- **Corrige o rumo:** a fatia desviou ou o plano estava errado. Mande um plano
  revisado que diz o que desfazer, o que fazer no lugar e como verificar.
- **Assume a fatia:** faça você mesmo, no modelo do orquestrador, quando
  qualquer um destes aparecer:
  - editou código e não rodou teste;
  - o relatório diz algo que o diff ou os testes não mostram;
  - o mesmo erro voltou de novo depois de uma correção de rumo sua;
  - ficou tentando às cegas: edições sem entender o código, tentativas repetidas.

  Na dúvida, assuma. Refazer uma fatia custa uma rodada cara; aceitar uma fatia
  errada entrega uma mudança que todo mundo acha que está pronta.
- **Para:** decisão que muda o escopo ou o plano. Leve ao usuário (volte para a
  `refinar` se for o caso) e não despache nada até ele responder.

Mensagem do usuário no meio do trabalho é sempre sua: responda você, ajuste o
plano se for preciso e só então despache de novo. Nunca repasse a mensagem
direto ao executor.

## 6. Feche (orquestrador)

Com todas as fatias aceitas, siga o passo 6 da `implementar-tarefa`, no modelo
do orquestrador: `bash bin/verificar.sh`, smoke test com evidência,
`revisao-adversaria` até APROVADO, `DEFERRED.md`, critérios de aceite e status.
Correções que a revisão pedir, faça você ou despache como uma fatia nova, com a
mesma conferência do passo 4.

## 7. Relate

O mesmo relatório do passo 7 da `implementar-tarefa`, com mais quatro linhas:

- o executor usado (modelo e effort);
- quantas fatias foram despachadas;
- quantas correções de rumo você mandou;
- quantas fatias você assumiu, e por quê.

**Não faça `git add` nem commit.** Liste os arquivos e sugira a mensagem de
commit no estilo do repositório.
