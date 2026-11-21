---
name: testes-independentes
description: "Depois que uma tarefa foi implementada com TDD, chama o subagente escritor-de-testes, que escreve testes dos critérios de aceite sem ler o diff, tirando o resultado esperado só da tarefa, do plano e das outras tarefas da feature. Roda esses testes contra a implementação e faz a triagem de cada falha: bug no código, teste errado ou critério ambíguo. Não muda o ciclo da implementar-tarefa: roda depois do passo 5 e antes da Definição de Pronto. Fica fora do ciclo: só roda quando o usuário chama."
argument-hint: "<feature>/<tarefa> [base]"
disable-model-invocation: true
---

# Testes independentes

Na `implementar-tarefa`, quem escreve o teste é quem escreve o código. Os
testes saem bons, mas descrevem o comportamento que o implementador imaginou.
Esta skill põe um segundo autor, o subagente `escritor-de-testes`
(`.claude/agents/escritor-de-testes.md`), que lê só o que foi pedido e escreve
os testes dos critérios de aceite sem ver o que foi feito.

**Não substitui nem muda o TDD.** O ciclo vermelho-verde da
`implementar-tarefa` continua igual. Esta skill roda depois do passo 5
("Prove que os testes testam") e antes do passo 6 (Definição de Pronto). Ela
só acrescenta testes; quando um deles acha um bug, o teste dele já é o
vermelho, e a correção segue o mesmo ciclo.

## 1. Escopo

- A feature é a pasta `.ai-workbench/NNN-<slug>/` e a tarefa é o arquivo dela
  em `tasks/`.
- A **base** é o commit de antes da tarefa. Padrão: o ponto em que a branch
  saiu da `main` (`git merge-base main HEAD`). Se a branch tem mais de uma
  tarefa, pergunte ao usuário qual commit é a base desta.
- Confira que a implementação terminou o passo 5 da `implementar-tarefa`. Se
  ainda está no meio do ciclo vermelho-verde, pare: rodar agora só mostraria o
  que ainda não foi feito.

## 2. Nomes que a tarefa não decide

Procure nos critérios, no plano, no `decisoes.md` e nas outras tarefas da
feature (`grep` em `.ai-workbench/<feature>/`) os nomes de que um teste precisa:
coluna, campo do JSON, rota, texto de tela.

- **Decidido em alguma fonte:** não passe nada ao escritor. Ele acha sozinho,
  e é justamente aí que ele pode pegar um nome trocado.
- **Decidido em fonte nenhuma:** passe o nome que a implementação usou. Não é
  vazamento: a tarefa deixou a escolha para quem implementa.

## 3. Chame o escritor

Ferramenta Agent com `subagent_type: "escritor-de-testes"`, contexto limpo, e
no pedido:

```
Tarefa: .ai-workbench/<feature>/tasks/<tarefa>.md
Base: <commit>
Nomes que a tarefa não decide: <lista, ou "nenhum">
```

No Cursor ou em outro agente, abra um subagente novo cuja instrução é o
conteúdo inteiro de `.claude/agents/escritor-de-testes.md` seguido do pedido.
Escrever esses testes na mesma conversa de quem implementou não conta.

## 4. Confira o relatório

- Rode você os arquivos que ele criou e confira que o resultado bate.
- Se ele diz que leu algo da implementação, anote: os testes daquele trecho
  valem menos.

## 5. Triagem de cada falha

Para cada teste que falhou, leia o teste, a fonte que ele cita e o código, e
classifique:

| Classe | Quando | O que fazer |
|---|---|---|
| **BUG** | o código contraria a fonte | corrija o código (o teste é o vermelho) e rode de novo |
| **TESTE ERRADO** | o teste leu a fonte errado, ou chamou o sistema de um jeito que a base não suporta | corrija o teste, citando o trecho da fonte que mostra o erro |
| **AMBÍGUO** | a fonte permite as duas leituras | pergunte ao usuário, grave a resposta no `decisoes.md` da feature e ajuste o lado que perdeu |
| **NOME** | o código usou um nome diferente do que uma fonte decidiu | é BUG, a não ser que o usuário diga que a fonte está velha; nesse caso corrija a fonte e o teste |

**Nunca ajuste o resultado esperado de um teste do escritor para bater com o
código sem uma fonte que diga isso.** Se a triagem está em dúvida entre BUG e
TESTE ERRADO, é AMBÍGUO: pergunte.

## 6. O que fazer com os arquivos

Pergunte ao usuário:

- **Manter:** os arquivos `*AceiteTest.php` e `*.aceite.test.tsx` passam a
  fazer parte da suíte e entram no diff da tarefa;
- **Descartar:** apague os arquivos e fique só com as correções que a triagem gerou.

Depois siga para o passo 6 da `implementar-tarefa` (Definição de Pronto).

## 7. Relate

- testes escritos, quantos passaram e quantos falharam;
- cada falha com a classe da triagem e o que foi feito;
- o que o escritor leu da implementação sem querer;
- critérios que ficaram sem teste.

**Não faça `git add` nem commit.**
