---
name: correcao-rapida
description: Caminho curto, fora do ciclo do harness, para bug simples ou ajuste pequeno. Escreve três linhas (hoje, esperado, continua), faz um teste vermelho, a correção mínima, roda o bin/verificar.sh e sugere o commit com as três linhas. Pula refinar, plano e tarefas; smoke test e revisão adversária viram pergunta no fim, e o code review é sempre perguntado e roda numa sessão nova. Sai para o ciclo se a correção tocar isolamento entre clínicas, permissão, migration, contrato de endpoint ou outro módulo. Use quando o usuário escolher "Vibe code" na pergunta da triagem do CLAUDE.md / AGENTS.md, ou começar o pedido com "vibe:".
---

# Correção rápida

Bug simples ou ajuste pequeno não precisa do ciclo inteiro (`refinar` →
`escrever-plano` → `criar-tarefas` → `implementar-tarefa` →
`revisao-adversaria`). Esta skill é a saída do ciclo. O processo fica curto, mas
a proteção continua: os princípios não negociáveis do `CLAUDE.md` / `AGENTS.md`
valem aqui inteiros, e a mudança continua com teste.

## Quando vale

Todas as condições, não só uma:

- bug com reprodução clara, ou ajuste pequeno de tela, texto ou regra local;
- sem migration, sem endpoint ou rota nova, sem mudar o formato da resposta de
  um endpoint;
- não mexe em Policy, guard, papel, `permissions.ts` nem no filtro por
  `clinic_id` ou por paciente;
- não cruza a fronteira entre módulos de `modules/`;
- até uns 5 arquivos de produção (testes não contam).

Essas condições são o critério da recomendação na pergunta "Vibe code ou Spec?"
da triagem. Se alguma falhar, a recomendação é Spec. Para bug de isolamento
entre clínicas, de permissão ou de dado de paciente, a recomendação é **sempre**
Spec, mesmo que a correção seja uma linha. Quem decide é o usuário: se ele
escolheu Vibe code mesmo assim, siga, e os gatilhos de "Quando sair" continuam
valendo.

Bug que aparece **durante** outro processo (uma tarefa, um smoke test, uma
revisão) não abre esta skill sozinho: ele segue a regra daquele processo.

## Fica e sai

| Fica | Pergunta no fim | Sai |
|---|---|---|
| Princípios não negociáveis | Smoke test | `refinar`, `escrever-plano`, `criar-tarefas` |
| Teste primeiro (vermelho → verde) | Revisão adversária | Pasta em `.ai-workbench/` (a não ser que a revisão adversária peça) |
| `bash bin/verificar.sh` | Code review, sempre (`bin/code-review`, sessão nova) | Definição de Pronto completa |
| Print da tela, quando ela muda | | |

## Passo a passo

### 0. Anuncie o caminho

Uma linha: "Vibe code: {bug ou ajuste}, {o quê}." Se estiver na `main`, sugira a
branch `bugfix/<slug>` e espere o usuário confirmar.

### 1. Três linhas

Antes de mexer no código, escreva no formato do bugfix:

```
Hoje:      QUANDO {condição}, o sistema {faz errado}.
Esperado:  QUANDO {condição}, o sistema DEVE {fazer certo}.
Continua:  QUANDO {condição vizinha}, o sistema DEVE CONTINUAR {fazendo o que já faz}.
```

- **Continua** é o que um conserto descuidado quebraria: o mesmo campo em
  outra tela, o outro tipo de lançamento, o papel vizinho. Pode ter mais de uma
  linha.
- Mostre as três linhas e siga. Se o "Esperado" foi suposição sua, e não algo
  que o usuário disse, pergunte antes de seguir.
- Causa ainda não está clara? Use a skill `systematic-debugging` para achar a
  causa e depois volte para cá.

### 2. Testes antes da correção

- **Esperado:** um teste que fica **vermelho** hoje, pelo motivo certo. Ele
  reproduz o bug.
- **Continua:** um teste que passa hoje e tem que continuar passando. Se um
  teste que já existe cobre isso, cite o teste em vez de escrever outro.
- A correção toca uma consulta? Rode o teste de outra clínica daquela rota. Se
  ele não existir, a mudança saiu do caminho rápido (veja "Quando sair").
- Ajuste só visual (texto, cor, espaçamento), sem lógica, dispensa teste novo.
  O print do passo 5 serve de prova.

Comandos: `php artisan test --filter=NomeDoTest` ou `npx vitest run <arquivo>`.
Confira quantos testes rodaram: zero é filtro errado.

### 3. Corrija o mínimo

Só o necessário para o teste do "Esperado" ficar verde. Não refatore em volta,
não renomeie e não arrume "já que estou aqui". Se achar outro problema, anote no
`.ai-workbench/DEFERRED.md` da raiz.

### 4. Prove que o teste testa

Desfaça a correção, veja o teste do "Esperado" ficar vermelho e refaça a
correção.

### 5. Confira

- `bash bin/verificar.sh` sem FALHOU.
- A tela mudou? Tire um print com
  `node tools/screenshot/screenshot.mjs '<url>' <nome>` (skill `qa-navegador`),
  mostre ao usuário e apague o arquivo depois.

### 6. Smoke test e revisão adversária?

Faça as duas perguntas juntas (`AskUserQuestion` no Claude Code, ou em texto
com as opções numeradas), cada uma com a sua recomendação e o motivo:

- **"Rodar smoke test?"** Recomende "sim" quando a mudança aparece numa tela ou
  num fluxo. O smoke simula um usuário no Chromium headless (skill
  `qa-navegador`, `flow.mjs`).
- **"Rodar revisão adversária?"** Recomende "sim" quando a mudança mexe no
  backend.

Rode o que o usuário escolher, nesta ordem:

1. **Revisão escolhida:** crie primeiro a pasta pequena
   `.ai-workbench/NNN-<slug>/`, só com o `README.md`, com as três linhas e a
   lista de arquivos alterados. `NNN` é o próximo número depois do maior que
   existe (`ls -d .ai-workbench/[0-9]*/`), como numa feature; confira de novo
   logo antes de criar, porque outro agente pode ter pegado o número. Use
   `000-<slug>` como tarefa (seção "Pasta de trabalho" da Definição de
   Pronto). A revisão precisa dela para gravar as rodadas.
2. **Smoke escolhido:** rode o fluxo da correção e o caso vizinho do
   "Continua". Com a pasta, a evidência vai para `evidence/000-<slug>/` com o
   `SUMMARY.md`. Sem a pasta, mostre o resultado na conversa e apague os
   arquivos gerados.
3. **Revisão escolhida:** rode a skill `revisao-adversaria`, apontando o
   `README.md` como a descrição da tarefa e dizendo que ela veio da
   `correcao-rapida`. Se o smoke foi pulado, diga isso ao revisor.

### 7. Code review, sempre

Com smoke ou sem smoke, com revisão ou sem revisão, pergunte por último:
**"Gostaria de fazer code review?"** Esta pergunta é sempre desta skill: a
`revisao-adversaria` chamada no passo 6 não pergunta.

Com o sim, siga `docs/ai-harness/CODE_REVIEW.md`: rodar `bin/code-review` numa
sessão separada, mostrar os achados aqui, perguntar "Deseja corrigir?" e
corrigir com teste primeiro.

### 8. Relate

O que mudou, com qual teste provou e o resultado do `verificar.sh`. **Não faça
`git add` nem commit.** Sugira a mensagem no estilo do repositório, com as três
linhas no corpo:

```
corrige {o quê}

Hoje: ...
Esperado: ...
Continua: ...
```

## Quando sair para o ciclo

Pare assim que descobrir, no meio do caminho, qualquer um destes:

- a causa está no backend e envolve permissão, papel ou isolamento;
- precisa de migration, ou de mudar a entrada ou a saída de um endpoint;
- a correção passa de uns 5 arquivos ou atravessa módulos;
- não dá para reproduzir o bug num teste;
- o usuário discorda do "Esperado": isso é decisão de produto.

Diga o motivo numa linha e pergunte se ele quer passar para Spec. Não troque de
caminho sem a resposta. Se ele escolher Spec, as três linhas, a causa e o teste
vermelho vão para a skill `refinar` como ponto de partida. Não apague o teste
vermelho.

## Atalhos

- `vibe:` no começo do pedido escolhe este caminho sem a pergunta da triagem.
  Se o pedido bate num gatilho de "Quando sair", diga qual e pergunte.
- `spec:` vai direto para o ciclo, sem a pergunta.
