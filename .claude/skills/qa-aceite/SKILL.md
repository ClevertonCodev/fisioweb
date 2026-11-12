---
name: qa-aceite
description: Roda o QA de aceite de uma entrega do fisioweb (uma tarefa ou a feature da PR) antes do merge. Junta os critérios de aceite (tarefa do workbench, três linhas da correção rápida ou issue do GitHub), chama o subagente testador-de-aceite, que confere cada critério no sistema rodando sem ver o diff e grava vídeo com legenda como prova, corrige o que falhou e aplica a regra de docs/ai-harness/DEFINICAO_DE_QA.md para dizer se a entrega dispensa o QA humano. Fica fora do ciclo e da Definição de Pronto: só roda quando o usuário chama (QA de aceite, teste de critérios de aceite, "dá para pular o teste na mão?" ou vídeo de que a tarefa funciona).
disable-model-invocation: true
---

# QA de aceite

A Definição de Pronto prova que o código está certo. Esta skill prova que a
entrega faz o que prometeu, critério por critério, com alguém que não escreveu o
código conferindo. No fim ela diz se a entrega **dispensa o QA humano** ou **vai
para o QA humano**, e por quê.

A regra está em `docs/ai-harness/DEFINICAO_DE_QA.md`. Leia antes da primeira vez.

Dois papéis, como na revisão adversária:

- **Você** (esta skill) junta os critérios, prepara o ambiente e os usuários,
  corrige o que falhar e decide a recomendação. Você conhece o diff.
- **O subagente `testador-de-aceite`** testa. Ele não vê o diff nem a evidência
  do smoke test. Você nunca troca um veredito dele por conta própria.

## 0. Antes de começar

- **Código final.** O QA confere o código como vai para a PR: corrigir depois
  obriga a refazer o QA. Se a Definição de Pronto ou a revisão adversária ainda
  não passou, avise numa linha e siga se o usuário quiser. A condição 4 da
  dispensa fica "não", e a entrega vai para o QA humano.
- **Ambiente no ar**: numa worktree, `fisio-app url` dá a URL (nunca escreva a
  porta à mão); no checkout principal, a `APP_URL` do `.env`.
  `curl -s -o /dev/null -w "%{http_code}\n" <url>/clinica/login` tem que dar
  `200`. Fora do ar: avise o usuário, não suba sozinho.
- **Front compilado**: numa worktree, rode `fisio-app build` antes, senão o
  testador confere o front velho.
- **Login**: `tools/screenshot/credentials.json` preenchido (skill
  `qa-navegador`, seção 0). A clínica desse usuário `clinic` é a **clínica de
  teste**.
- **Usuários de teste**: veja a seção abaixo. Não pergunte ao usuário se existe
  outro login: crie.
- **Integrações externas**: se algum critério passa por WhatsApp, e-mail, Google
  Agenda ou upload para o R2, confirme com o usuário para onde o `.env` local
  aponta. Sem confirmação, esses critérios ficam NÃO VERIFICÁVEL (e a entrega vai
  para o QA humano de qualquer jeito, por ser área de risco).

### Usuários de teste

No ambiente local você **pode criar quantos usuários precisar**, nos três
guards: operador do admin, clínica (e usuários dela, em qualquer papel) e
paciente. Critério de papel ("a secretária não vê", "só o admin exclui") se
confere com um usuário de verdade daquele papel, nunca com o administrador.
Faltar login nunca é motivo para NÃO VERIFICÁVEL: é motivo para criar o usuário.
Não pergunte ao usuário se existe outro login: crie.

Crie **antes** de chamar os testadores, a partir dos critérios (quais guards,
quais papéis, quantas clínicas, se há paciente). Tudo com prefixo `QA` no nome e
e-mail `qa-<alvo>-<n>@exemplo.test` (minúsculo):

1. **Usuário da clínica:** logado como um administrador da clínica, em
   Usuários → Novo usuário (`/clinica/usuarios/novo`), pela tela, com o nome
   `QA <alvo> <papel>`, a função do papel (Administrador, Fisioterapeuta,
   Secretário(a)) e uma senha descartável no próprio formulário. O usuário
   criado pela clínica já entra com essa senha.
2. **Clínica:** logado como operador do admin, em Clínicas → Nova
   (`/admin/clinicas/nova`), pela tela, com o nome `QA <alvo> Clínica <n>` e o
   e-mail QA. A clínica nasce com o usuário mestre (administrador) nesse e-mail,
   sem senha conhecida: na edição da clínica, em "Gerar link de primeiro
   acesso", copie o link, abra e defina uma senha descartável. Escolha o plano
   que o critério pede (o plano decide as funcionalidades liberadas). Para um
   caso simples de "outra clínica", as clínicas extras do seeder
   (`database/seeders/DatabaseSeeder.php`, um administrador cada) também
   servem.
3. **Paciente:** cadastre pela tela da clínica certa, com o nome
   `QA Paciente <n>` e um CPF válido de teste. O paciente entra em
   `/paciente/login` com o CPF, e a senha inicial é o próprio CPF (só os
   números). Para "um paciente não vê dado de outro", crie dois.
4. **Operador do admin:** não há tela de cadastro. Crie pelo Eloquent, com uma
   senha descartável (o model faz o hash):
   `fisio-app artisan tinker --execute="Modules\Admin\Models\User::create(['name' => 'QA <alvo> Operador <n>', 'email' => 'qa-<alvo>-op<n>@exemplo.test', 'password' => '<senha>']);"`
   (no checkout principal, `php artisan tinker --execute=...`). É a **única**
   escrita fora da tela que o QA faz.
5. **Passe ao testador** o login e a senha de cada usuário QA, com o guard, o
   papel e a clínica. Ele usa `FISIO_LOGIN=<e-mail> FISIO_SENHA=<senha>` no
   comando do `flow.mjs`. As senhas do `credentials.json` e do seeder nunca vão
   no pedido nem na conversa: o testador lê o `credentials.json`, e para o
   administrador de uma clínica do seeder diga só "o administrador da clínica
   <slug> do seeder".

**Para gastar menos:** um usuário QA por testador, que troca de função pela
tela entre um cenário e outro.

No fim do QA, diga ao usuário o que ficou criado no banco local: operadores,
clínicas, usuários e pacientes `QA ...`.

## 1. Ache a entrega e as tarefas

A feature sai do nome da branch (`feat/002-isolamento-...` →
`.ai-workbench/002-*`). O `<alvo>` é:

- a tarefa que o usuário nomeou (`003-papel-secretaria`); ou
- `feature`, quando o QA cobre todas as tarefas da feature que vão na PR (a
  lista e o status estão no `README.md` da feature); ou
- `000-<slug>`, numa correção rápida sem arquivo de tarefa.

Sem como decidir, pergunte.

## 2. Junte os critérios

Na ordem de `DEFINICAO_DE_QA.md`, seção 1:

1. **Tarefas do workbench**: copie `## Critérios de Aceite` e `## Como testar na
   mão` de cada tarefa do alvo.
2. **Correção rápida**: as linhas Esperado e Continua (do `README.md` da pasta
   pequena ou da mensagem de commit). A linha Hoje vira o critério "isto não
   acontece mais".
3. **Issue do GitHub** (`gh issue view <n>`): a seção de critérios, se houver.
4. **Nada disso**: proponha os critérios a partir do pedido e do que a tarefa
   mudou, no formato "Quando X, o sistema Y", e **pergunte ao usuário** se
   estão certos. Só siga com a aprovação, e registre quem aprovou.

Grave em `.ai-workbench/<feature>/qa/<alvo>/criterios.md`, numerados C1, C2...,
**com o texto como está na origem**, e a origem de cada um. Os passos de "Como
testar na mão" entram numa seção à parte, como roteiro sugerido, não como
critério.

Correção rápida sem pasta no workbench: crie a pasta pequena como a
`correcao-rapida` cria para a revisão (`.ai-workbench/NNN-<slug>/` com o
`README.md` das três linhas).

## 3. Divida em fatias e chame os testadores em paralelo

O QA demora: cada tela leva de 10 a 18 minutos (vídeo, conferência dos quadros,
passada de quebrar). Em série, uma entrega de 12 critérios leva uns 45 minutos;
em paralelo, o tempo da fatia mais lenta. **Divida sempre que houver mais de uma
tela ou mais de uns 5 critérios.**

Como fatiar:

- **Uma fatia por tela** (ou por grupo pequeno de telas do mesmo fluxo). Ex.:
  "usuários", "prontuário", "agenda", "área do paciente".
- **Uma fatia só de teste automatizado**: todos os critérios `(PHPUnit)`/
  `(Vitest)` e os que só um teste alcança. É a mais rápida (3 a 5 minutos). Só
  ela roda teste, para os testadores de tela não disputarem CPU com a suíte; o
  PHPUnit usa SQLite em memória, então não há banco de teste compartilhado para
  atrapalhar.
- **Critérios que trocam de clínica, de papel ou de paciente no mesmo cenário
  ficam juntos** numa fatia (isolamento, "outra clínica não vê"), para um
  testador só montar o cenário.
- **Um usuário QA por fatia de tela** (seção "Usuários de teste").

**Pergunte quantos testadores.** Com os critérios classificados e as fatias
montadas, recomende quantos testadores rodar e pergunte ao operador
(`AskUserQuestion`), com as opções 2, 3, 4 e 5 e a recomendação marcada. Siga a
escolha: com menos testadores, junte fatias.

Escreva a divisão no `criterios.md` (seção `## Fatias`: fatia, critérios,
usuário) e chame **todos os testadores na mesma mensagem**, para rodarem ao mesmo
tempo.

Cada fatia grava o seu `QA-<fatia>.md` na pasta de QA (ex.: `QA-usuarios.md`,
`QA-testes.md`). **Só você escreve o `QA.md`**, juntando as fatias no passo 4.

`subagent_type: "testador-de-aceite"`. Em todo pedido vão:

- o caminho da pasta de QA e do `criterios.md`;
- **a fatia**: quais critérios são dela e o nome do arquivo de saída
  (`QA-<fatia>.md`);
- se a fatia roda teste automatizado ou não;
- a URL base do ambiente;
- os usuários QA desta fatia: papel, clínica, login e senha descartável (e o
  CPF do paciente QA, se a fatia passa pela área do paciente);
- se as integrações externas estão liberadas e para onde apontam;
- a rodada e, da segunda em diante, quais critérios refazer.

Entrega pequena (uma tela, até uns 5 critérios): um testador só, com saída
`QA.md`, sem perguntar.

**Não mande**: o diff, o resumo do que você fez, a evidência do smoke test, a
sua opinião sobre o que vai passar. Quanto menos ele souber da implementação,
mais o teste vale.

## 4. Leia o resultado e junte as fatias

Leia cada `QA-<fatia>.md` e confira pelo menos um PASSOU de Tela por amostragem
(o quadro do vídeo no segundo citado). PASSOU sem prova que abre volta para o
testador como NÃO VERIFICÁVEL.

Escreva o `QA.md` com **uma tabela só**, C1 a Cn em ordem, com o veredito e a
prova de cada critério, e um link para o `QA-<fatia>.md` de onde veio. Junte
também os achados fora dos critérios e o que não foi testado. As fatias ficam
como detalhe.

Fatia que voltou NÃO VERIFICÁVEL por falta de usuário de um papel: crie o
usuário (seção "Usuários de teste") e refaça a fatia na próxima rodada.

## 5. Corrija o que falhou

Cada FALHOU tem uma de três causas:

| Causa | O que fazer |
|---|---|
| **Bug da entrega** | corrija como na `implementar-tarefa`: primeiro um teste que reproduz, depois a correção. Rode `bash bin/verificar.sh` (fora da hora em que a fatia de testes roda). Se mudou comportamento de backend, uma rodada focada da `revisao-adversaria` |
| **Teste não confere o critério** ou **sem teste** | escreva ou corrija o teste, veja ficar vermelho com o código quebrado e verde com o certo |
| **Critério errado ou ambíguo** | não é com você: leve ao usuário. Se ele mudar o critério, registre no `criterios.md` quem mudou e quando |

Contestar um veredito pode, **uma vez**, levando a saída de um comando que o
testador não viu. Se ele mantiver, uma pessoa decide.

Depois de corrigir, chame de novo só as fatias que têm critério para refazer, só
com os critérios que falharam e os critérios de Tela da mesma tela. **No máximo
3 rodadas.** Sobrou FALHOU: vai para o QA humano com o `QA.md` como está.

Achado fora dos critérios: Crítico ou Major da entrega, corrija como bug da
entrega. De outra área, registre no `DEFERRED.md` da raiz de `.ai-workbench/` e
avise o usuário.

## 6. Decida a recomendação

Passe pela seção 4 de `DEFINICAO_DE_QA.md`, condição por condição. As áreas de
risco você confere no diff (`git diff --stat main...HEAD` e os arquivos
tocados), porque o testador não viu o diff.

Acrescente ao fim do `QA.md`:

```markdown
## Recomendação

**Dispensa o QA humano** | **Vai para o QA humano**

| Condição | Resultado |
|---|---|
| 1. Todos PASSOU ou FORA DO QA | sim / não: C3 FALHOU |
| 2. Origem dos critérios válida | sim / não |
| 3. Sem achado Crítico ou Major | sim / não |
| 4. Definição de Pronto e revisão adversária | sim / não |
| 5. Fora das áreas de risco | sim / não: mexe em <área> (`arquivo`) |
| 6. Até 8 critérios de Tela e API | sim / não: N |

**Para o QA humano olhar** (quando vai): o que precisa de olho humano, em uma
lista curta. Ex.: "aparência da tela nova no celular e no tema escuro", "C5 não
verificável sem WhatsApp de verdade".
```

## 7. Relate

Diga ao usuário: a recomendação, a contagem por veredito, o que foi corrigido nas
rodadas, os usuários e pacientes `QA ...` que ficaram criados e onde está a
pasta.

**Tudo deste QA fica dentro de `qa/<alvo>/`** da feature (ex.:
`.ai-workbench/002-isolamento-clinicas-e-papeis/qa/feature/`), inclusive um
relato da rodada (tempo, fatias, o que atrapalhou), se o usuário pedir: grave em
`qa/<alvo>/RELATO.md`. Nunca na raiz do `.ai-workbench/`.

Depois, **pergunte** se ele quer:

- **Comentar na PR** (`gh pr comment`) o resumo do `QA.md` (vereditos e
  recomendação, sem os caminhos locais e sem dado pessoal): mostre a prévia e só
  publique com a aprovação.
- **Os vídeos** nunca vão para a PR, a issue ou uma mensagem por conta própria:
  mostram dado da clínica local e às vezes de paciente. Diga quais `video.webm`
  existem e deixe a pessoa decidir para onde vão.

## Cuidados

- **QA não é smoke test.** O smoke test (Definição de Pronto) é o seu: caça erro
  enquanto você implementa. O QA é de outro, por critério, no fim. Não troque um
  pelo outro, e não passe a evidência de um para o outro.
- **Não afrouxe o critério para passar.** Se o sistema não faz o que o critério
  diz, ou se corrige o sistema ou uma pessoa muda o critério.
- O vídeo grava de verdade no banco do ambiente. Os dados de teste usam
  prefixo `QA`. Diga ao usuário o que ficou criado.
- Depois do merge, apague `qa/<alvo>/` junto com `evidence/` e `review/`.
