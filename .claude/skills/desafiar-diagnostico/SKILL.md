---
name: desafiar-diagnostico
description: "Antes de corrigir um bug, põe o diagnóstico à prova com o subagente desafiador-de-diagnostico: ele recebe primeiro só o bug e forma as próprias hipóteses, depois recebe o diagnóstico e tenta derrubá-lo, conferindo cada arquivo, linha e afirmação contra o código. Devolve CONFIRMADO, CONFIRMADO COM AJUSTES, REFUTADO ou INCONCLUSIVO. Não muda a systematic-debugging: roda entre a investigação e a correção. Fica fora do ciclo: só roda quando o usuário chama."
argument-hint: "[caminho do diagnóstico, se já estiver escrito]"
disable-model-invocation: true
---

# Desafiar diagnóstico

Na `systematic-debugging`, quem investiga o bug é quem decide a causa raiz e
quem corrige. Se a causa estiver errada, a correção trata o sintoma, o teste
passa e o bug volta por outro caminho. Esta skill põe um segundo olhar no
ponto mais barato para errar: depois da investigação e antes da correção.

**Não muda a `systematic-debugging` nem o TDD.** Rode depois da fase 1 (ou da
fase 3, se você já testou a hipótese) e antes da fase 4 (correção).

## 1. Escreva o bug e o diagnóstico separados

Monte dois textos. O primeiro **não pode** conter nada do diagnóstico, nem dica
de onde está a causa.

**Bug** (só o que se observa):

```
Sintoma: o que acontece
Esperado: o que deveria acontecer
Como reproduzir: passos, usuário e papel, clínica, dados
Ambiente: local, worktree, produção; quando começou, se souber
Evidência bruta: mensagem de erro, trecho de log, resposta da API (sem token,
senha nem dado de paciente)
```

**Diagnóstico** (o que a investigação concluiu):

```
Causa raiz: uma ou duas frases
Onde: arquivo:linha de cada ponto
Cadeia: da observação até a causa, passo a passo, cada passo com a evidência
Como foi confirmado: comandos e resultados
Lacunas: o que não foi investigado ou ficou suposto
Correção pensada: em uma frase, sem código
```

Se o diagnóstico já está num arquivo (argumento da skill), use esse arquivo.
Confira que o texto do bug não vaza a causa.

## 2. Chame o desafiador em duas mensagens

1. Ferramenta Agent com `subagent_type: "desafiador-de-diagnostico"`, contexto
   limpo, e no pedido **só o bug**. Ele devolve as hipóteses dele.
2. Continue o mesmo agente com `SendMessage` (`to`: o id que o resultado
   devolveu), mandando o diagnóstico. Ele devolve o relatório com o veredito.

No Cursor ou em outro agente que não continua um subagente: abra um subagente
novo cuja instrução é o conteúdo de `.claude/agents/desafiador-de-diagnostico.md`
e mande bug e diagnóstico juntos, nessa ordem, com a instrução de listar as
hipóteses dele antes de ler o diagnóstico. Desafiar na mesma conversa de
quem investigou não conta.

## 3. Confira o relatório

Rode você os comandos de reprodução que ele cita e confira que os resultados
batem. O relatório é uma alegação; a saída do comando é a evidência.

## 4. Decida

| Veredito | O que fazer |
|---|---|
| CONFIRMADO | siga para a fase 4 da `systematic-debugging` |
| CONFIRMADO COM AJUSTES | ajuste o diagnóstico (onde, cadeia, correção pensada) e siga |
| REFUTADO | volte para a fase 1 com as hipóteses dele; não corrija nada ainda |
| INCONCLUSIVO | rode o que ele disse que decidiria; se ainda não decidir, leve ao usuário |

Uma rodada basta na maioria dos casos. Se você refez o diagnóstico depois de
um REFUTADO, pode desafiar de novo, uma vez, com um agente novo.

## 5. Relate

- o veredito e, em uma frase, o que mudou no diagnóstico;
- as afirmações que estavam erradas, com o que o código mostra;
- a decisão (seguir, ajustar, voltar).

**Não faça `git add` nem commit.**
