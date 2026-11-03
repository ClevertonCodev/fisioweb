# Code review em sessão separada

Fonte única do passo de code review. As skills `correcao-rapida` (no fim de
toda correção) e `revisao-adversaria` (uma vez por feature, depois do APROVADO)
perguntam **"Gostaria de fazer code review?"** e, com o sim, seguem este
arquivo. Quem escreveu o código não revisa o próprio código no mesmo contexto.

## Rodar

Rode `bin/code-review` (nível `high`, o diff atual da branch; aceita outro nível
e um alvo: `bin/code-review medium`, `bin/code-review high <branch|PR|caminho>`).

- O script abre uma **sessão nova e separada** do Claude Code (`claude -p`, só
  leitura), sem o contexto desta, e grava o relatório em
  `.ai-workbench/code-review/review/` (fora do git), com os achados agrupados em
  Crítico, Alto, Médio e Menor e a contagem no fim.
- Leva vários minutos. No Claude Code, rode em segundo plano. No Cursor e no
  Antigravity é o mesmo script, e o agente espera terminar.
- Sem o CLI `claude` na máquina, o script avisa e o usuário abre a sessão nova
  por conta própria.
- Se o script sair com FALHOU (sessão com erro ou sem saída), mostre o motivo
  ao usuário. Não trate como "sem achados".

## Mostrar e perguntar

A sessão separada não aparece para o usuário: ela só acha os problemas e grava
o relatório. Tudo o que o usuário vê acontece **na sessão que disparou o
script**:

1. Leia o relatório e mostre a contagem e os achados de cada grupo.
2. Pergunte **"Deseja corrigir?"**, com as opções: Críticos e Altos (a
   recomendada, se houver algum), todos, escolher quais, ou não.

## Corrigir

- Corrija o que o usuário escolheu com teste primeiro: teste vermelho que prova
  o achado, correção, verde.
- Achado que você contesta: diga por quê, com a prova (um comando, uma linha do
  código), e deixe o usuário decidir.
- No fim, `bash bin/verificar.sh`.
- O que ele não quiser corrigir agora vai para o `DEFERRED.md` da feature, ou
  da raiz quando não há feature.
