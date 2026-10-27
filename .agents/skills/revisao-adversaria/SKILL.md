---
name: revisao-adversaria
description: Roda o ciclo de revisão adversária do fisioweb no diff atual. Chama o subagente revisor-adversario, passa cada achado pelo verificador-de-achados, corrige todo Crítico e Major confirmado (ou contesta uma vez com a saída de um comando novo) e repete até o veredito recalculado ser APROVADO, no máximo 3 rodadas. É o portão de revisão da Definição de Pronto e a última etapa do ciclo (refinar, escrever-plano, criar-tarefas, implementar-tarefa, revisao-adversaria). Use antes de dizer que uma tarefa está pronta e antes de abrir a PR, ou quando pedirem para revisar, atacar ou testar o diff a fundo.
---

# Revisão adversária

Dois subagentes, cada um com a conversa limpa: o `revisor-adversario` ataca o
diff e o `verificador-de-achados` julga cada achado. Esta skill conduz o ciclo, as
correções e a parada. O lugar dela no fluxo está em
`docs/ai-harness/DEFINITION_OF_DONE.md`, seção "Revisão adversária".

## Como chamar os subagentes

As instruções de cada um ficam em `.claude/agents/<nome>.md`, a fonte única.

| Agente | Como chamar |
|---|---|
| Claude Code | ferramenta Agent com `subagent_type: "revisor-adversario"` ou `"verificador-de-achados"` |
| Cursor | o subagente de mesmo nome em `.cursor/agents/` |
| Antigravity | o subagente de mesmo nome em `.agents/agents/` (`invoke_subagent`) |
| Codex ou outro | um subagente novo, sem o histórico desta conversa, cuja instrução é o conteúdo inteiro de `.claude/agents/<nome>.md` seguido do pedido |

Se o seu agente não consegue abrir subagente, pare e diga ao usuário: a
revisão feita na mesma conversa de quem escreveu o código não conta como
revisão adversária.

## Regras

- Crítico e Major **confirmados pelo verificador** travam. Repita até o veredito
  recalculado ser APROVADO.
- Minor não trava: guarde para a descrição da PR.
- **No máximo 3 rodadas do revisor.** O verificador e a contestação não contam.
  Se depois da terceira ainda sobrar Crítico ou Major, pare e leve para o
  usuário com as provas. Não siga em frente sozinho.
- Você nunca descarta um achado por conta própria.

## O ciclo

1. **Escopo.** A base é `main`, a não ser que o usuário diga outra. A feature é
   a pasta `.ai-workbench/NNN-<slug>/` e a tarefa é o arquivo dela em `tasks/`
   sem `.md` (seção "Pasta de trabalho" da Definição de Pronto). Abaixo,
   `<pasta>` é `.ai-workbench/<feature>`. Confira com
   `git diff --stat main...HEAD` e `git status`.

2. **Antes da primeira rodada.** Rode `bash bin/verificar.sh` e corrija o que
   falhar. Para cada teste novo, quebre o código que ele protege, veja ficar
   vermelho e desfaça. Releia comentários e mensagens de commit que você
   escreveu.

3. **Chame o revisor** (`revisor-adversario`). Cinco coisas
   vão em **todo** pedido:
   - os ângulos da rodada (na primeira, os cinco);
   - a branch base;
   - a feature e a tarefa, com o caminho de `<pasta>/tasks/<tarefa>.md`;
   - o smoke test: "evidência em `<pasta>/evidence/<tarefa>/`" ou
     "smoke test pulado: <motivo>". O revisor não lê o seu relatório final, então
     um pulo que ninguém contou para ele parece etapa esquecida;
   - a partir da segunda rodada, o caminho do `resolvidos.md`.

4. **Chame o verificador** (`verificador-de-achados`) com o
   relatório inteiro do revisor, a base e a tarefa. Se houver descrição da
   tarefa, copie o texto como foi escrito, sem resumir, para
   `<pasta>/review/<tarefa>/tarefa.md` e passe o caminho. Ele devolve uma
   decisão por achado e o veredito recalculado.

5. **Registre** as decisões em `<pasta>/review/<tarefa>/decisoes.md` (rodada,
   achado, decisão, gravidade final). Achados `FALSO` e `REBAIXADO` vão também
   para `<pasta>/review/<tarefa>/resolvidos.md`, com a prova, para o revisor não
   levantar de novo sem motivo. Achados `REAL-FORA-DO-ESCOPO` são de código que
   a feature não criou: vão para o `.ai-workbench/DEFERRED.md` da raiz, com a
   data (`date '+%Y-%m-%d'`), a feature e `(revisão adversária)`. `OPCIONAL` vai para a lista de Minor da PR.

6. **Se o veredito recalculado for APROVADO,** pare e vá para "Saída".

7. **Corrija cada Crítico e Major confirmado.** Antes de corrigir, pergunte qual
   é o formato geral do erro e procure esse formato no resto do diff. Se discordar
   de um achado, conteste **uma vez**: rode um comando que o verificador não
   tinha visto e chame um verificador novo com o achado, a decisão anterior e a
   saída. Confirmado de novo, a decisão é do usuário.

8. **Correção mudou comportamento?** Refaça o smoke test só dos fluxos afetados
   e atualize a evidência. Rode `bash bin/verificar.sh` de novo.

9. **Nova rodada.** Os ângulos são `seguranca` e `regras-fisioweb` (sempre),
   mais `estrutura` se a correção mexeu em migration, model, fronteira de módulo
   ou listagem, mais `lacuna-de-verificacao` se mudou comportamento, mais os
   ângulos que acharam problema. Na dúvida, os cinco. Volte ao passo 3.

**Pare antes do limite** se a correção de uma rodada criou o problema da
seguinte duas vezes seguidas. Dê nome ao tipo de erro, procure no diff todos os
lugares onde ele aparece e, se a solução mudar o escopo, leve a decisão para o
usuário agora.

## Saída

Diga ao usuário:

- o veredito final e quantas rodadas rodaram;
- cada Crítico e Major e como foi resolvido;
- a lista de Minor, pronta para a descrição da PR;
- o que foi para o `DEFERRED.md` da raiz;
- qualquer coisa que ficou para o usuário decidir.

Nada de `<pasta>/review/` ou `<pasta>/evidence/` vai para a PR,
para uma issue ou para mensagem: essas pastas podem ter dado de paciente.
