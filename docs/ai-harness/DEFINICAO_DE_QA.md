# Definição de QA

A Definição de Pronto (`DEFINITION_OF_DONE.md`) diz quando o código está pronto.
Este arquivo diz quando a entrega está **aceita**: cada critério de aceite foi
conferido no sistema rodando, por alguém que não escreveu o código, com prova.
E diz quando essa conferência basta e a entrega **não precisa** de uma pessoa
testando na mão antes do merge (o "QA humano").

Quem conduz é a skill `qa-aceite`. Quem testa é o subagente
`testador-de-aceite`, com a conversa limpa e sem ver o diff.

O QA de aceite fica **fora do ciclo e da Definição de Pronto**: só roda quando o
desenvolvedor chama. Nenhuma outra skill sugere nem roda o QA por conta própria.

## Por que existe

O agente encurtou o desenvolvimento, e a conferência na mão virou o gargalo.
Tarefa pequena com critério claro não precisa de uma pessoa refazendo os passos
na mão: precisa de alguém independente conferindo cada critério e deixando um
vídeo que qualquer um assiste em um minuto. O QA humano fica para o que precisa
de julgamento.

Mesmo quando a entrega vai para o QA humano, ela chega com o `QA.md` e os
vídeos. A pessoa começa do que já foi conferido, não do zero.

## 1. Sem critério, sem QA automático

O testador só confere o que está escrito. O QA é feito **por entrega** (o
`<alvo>`): uma tarefa de `tasks/`, ou todas as tarefas da feature que vão na
mesma PR. De onde vêm os critérios, nesta ordem:

| Origem | Onde estão |
|---|---|
| Tarefa do ciclo (`criar-tarefas`) | `## Critérios de Aceite` e `## Como testar na mão` do arquivo da tarefa em `.ai-workbench/<feature>/tasks/`. A feature sai do nome da branch (`feat/002-...` → `.ai-workbench/002-*`) e a lista de tarefas, do `README.md` dela |
| Correção rápida (`correcao-rapida`) | as linhas **Esperado** e **Continua** (no `README.md` da pasta pequena ou na mensagem de commit). A linha **Hoje** vira o caso que tem que ter deixado de acontecer |
| Issue do GitHub | a seção `Critérios de Aceite` do corpo da issue (`gh issue view <n>`), quando a issue nasceu do ciclo |
| Pedido sem critério escrito (bug relatado, issue escrita à mão) | não tem critério. A skill propõe os critérios a partir do pedido e **uma pessoa aprova antes** do teste |

O workbench vem antes da issue: a issue pode ter sido resumida e a tarefa do
workbench ter os critérios inteiros.

Critério que o próprio agente escreveu e ninguém aprovou não vale: seria o agente
corrigindo a própria prova.

**Critério bom** diz o que alguém vê ou recebe, e numa condição que dá para
montar: "Secretária não vê o botão Excluir paciente e o DELETE dá 403".
**Critério ruim** não dá para conferir ("a tela fica melhor") ou descreve código
("usar o service X"). Critério ruim volta para quem escreveu, com a pergunta do
que conferir.

## 2. Tipo de cada critério

| Tipo | Como se confere | Prova |
|---|---|---|
| **Tela** | fluxo no navegador com `tools/screenshot/flow.mjs --video`, com legenda por critério | trecho do vídeo (segundo) e print |
| **API** | requisição HTTP de verdade, com token de verdade (login pelo guard certo) | requisição e resposta salvas, credencial trocada por `[removido]` |
| **Teste automatizado** (o critério cita PHPUnit/Vitest, ou só um teste alcança o caso) | achar o teste, **ler** para confirmar que ele confere o que o critério diz, rodar e contar quantos rodaram | nome do teste e saída do comando |
| **Processo** ("Definição de Pronto cumprida", "ADR escrito", "SUMMARY.md com a tabela") | conferir que o arquivo ou item existe | caminho do arquivo. "Definição de Pronto cumprida" fica `FORA DO QA`: quem confere é a DoD |

Quando o critério diz como se confere, vale o que ele diz: `(PHPUnit)`,
`(Vitest)` ou `(PHPUnit + Vitest)` no fim é tipo **Teste automatizado**. Se a
mesma coisa também aparece em `## Como testar na mão`, confira dos dois jeitos.

O critério de outra clínica ("um usuário da clínica B não vê nem altera nada da
clínica A") passa de dois jeitos: tentando pela tela ou pela API com um usuário
de outra clínica (403/404 esperado, e nenhum dado na tela) ou com o teste de
outra clínica daquela rota, lido e rodado. O mesmo vale para "um paciente não vê
dado de outro paciente".

Critério de papel (`admin`, `physiotherapist`, `secretary`) se confere com um
usuário de verdade daquele papel, nunca com o administrador. No ambiente local,
a skill e o testador criam quantos usuários `QA ...` precisarem, nos três
guards: operador do admin, clínica (e usuários dela em qualquer papel) e
paciente. Faltar login não justifica NÃO VERIFICÁVEL.

## 3. Veredito por critério

Cada critério sai com um veredito só:

- **PASSOU**: conferido, com prova que outra pessoa abre e vê.
- **FALHOU**: o sistema não faz o que o critério diz. Vai junto o que aconteceu e
  o trecho do vídeo ou a saída.
- **NÃO VERIFICÁVEL**: não deu para conferir aqui. Vai junto o motivo: precisa de
  WhatsApp, e-mail ou Google Agenda de verdade, de dado que não dá para montar,
  ou o critério é ambíguo. Falta de login não é motivo: cria-se o usuário.
- **FORA DO QA**: critério de processo que outra etapa confere.

"O fluxo rodou sem erro" não é PASSOU. PASSOU é ver, na tela ou na resposta, a
coisa que o critério promete.

Além dos critérios, o testador faz uma passada curta tentando quebrar cada tela
tocada (vazio, inválido, duplo clique, celular, tema escuro nas telas v2). O que
ele achar entra como **achado fora dos critérios**, com gravidade (Crítico,
Major, Minor).

## 4. Quando dispensa o QA humano

A entrega **dispensa o QA humano** quando **todas** as condições valem:

1. Todo critério está PASSOU ou FORA DO QA. Nenhum FALHOU nem NÃO VERIFICÁVEL.
2. Os critérios vieram de uma das origens da seção 1. Os propostos pelo agente
   precisam ter sido aprovados por uma pessoa.
3. Nenhum achado fora dos critérios é Crítico ou Major.
4. A Definição de Pronto passou, incluindo a revisão adversária APROVADO.
5. A mudança **não** toca nenhuma área de risco:
   - isolamento entre clínicas: filtro por `clinic_id`, Policy, escopo de
     consulta (mudança no filtro, não só o critério padrão de outra clínica);
   - papel e permissão: `role`, `permissions.ts`, `RequireClinicAdmin`,
     middleware ou guard (`admin`, `clinic`, `patient`), "entrar como"
     (impersonation);
   - autenticação: login, senha, primeiro acesso, JWT e refresh;
   - dado do paciente: área do paciente (guard `patient`), prontuário,
     evolução, avaliação, questionário, arquivos do paciente (LGPD);
   - migration que altera ou move dado existente;
   - contrato de endpoint (formato da resposta, rota pública com token como a
     do questionário);
   - plano, funcionalidade liberada por plano, finanças e comprovante;
   - integração externa: WhatsApp (Twilio), Google Agenda, R2, e-mail;
   - mensagem enviada ao paciente (WhatsApp, e-mail) ou PDF entregue a ele;
   - tela nova ou redesenho de tela (v2): a aparência pede um olhar humano.
6. Tem até uns 8 critérios de Tela e API. Mais que isso já não é tarefa pequena.

Faltou uma condição: **vai para o QA humano**, com o `QA.md` dizendo qual
condição falhou. Com risco, quem decide é sempre uma pessoa, por menor que seja
a mudança.

O agente **recomenda**. Quem faz o merge é uma pessoa.

## 5. Onde fica a prova

`.ai-workbench/<feature>/qa/<alvo>/`:

```text
qa/<alvo>/
├── criterios.md        os critérios como estão na origem, numerados C1, C2...
├── roteiros/           um roteiro por tela ou fluxo, fora da pasta de saída
├── <fluxo>/            saída do flow.mjs: video.webm, storyboard.png, report.md, prints
├── api/C<n>.txt        requisição e resposta, credencial trocada por [removido]
├── QA-<fatia>.md       o relatório de cada testador, quando o QA é dividido em fatias
├── RELATO.md           relato da rodada (tempo, fatias, o que atrapalhou), quando pedido
└── QA.md               a tabela de vereditos e a recomendação: o arquivo que as pessoas leem
```

`<alvo>` é o nome do arquivo da tarefa sem `.md` (`003-papel-secretaria`), como
na Definição de Pronto. QA da feature inteira usa `feature`. Correção pequena
sem arquivo de tarefa usa `000-<slug>`.

O vídeo mostra dado da clínica local, às vezes de paciente. A pasta `qa/` fica
fora do git (`.gitignore`) e só sai da máquina pela mão de uma pessoa. O `QA.md`
não leva nome de paciente, CPF, e-mail, telefone, dado clínico nem senha: é o
único arquivo que pode ir para a PR ou a issue.

Apague `qa/<alvo>/` depois do merge, junto com `evidence/` e `review/`.

## 6. O que o QA automático não substitui

- **Aceite do produto**: a pessoa que pediu confirmando que era isso que queria.
- **Ambiente de verdade**: o teste roda no ambiente local. WhatsApp, e-mail,
  Google Agenda, R2 de produção, fila em produção e dados reais de outra escala
  ficam com o QA humano ou com o monitoramento.
- **Regressão longe da mudança**: o testador confere os critérios e as telas
  tocadas, não o sistema inteiro.
