---
name: qa-mestre
description: "QA de aceite por modo de uma entrega do fisioweb (uma tarefa ou a feature da PR). /qa-mestre testes = lê e roda os testes dos critérios; tela = critérios de tela e API com vídeo; prototipo = compara com o protótipo e com o checklist de tela v2; quebrar = campos inválidos por tipo e tentativas de quebrar; acesso = papel, outra clínica e outro paciente. Sem modo, pergunta quais rodar e mostra o custo. Usuários QA pelo tools/playwright/qa-mestre/usuarios.php. No fim diz se a entrega dispensa o QA humano (docs/ai-harness/DEFINICAO_DE_QA.md). Fica fora do ciclo e da Definição de Pronto: só roda quando o usuário chama."
argument-hint: "[testes] [tela] [prototipo] [quebrar] [acesso]  (vazio = pergunta quais)"
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

## Modos

O QA roda **por modo**. Cada modo faz só a sua parte, e o usuário paga só pelo
que pediu:

| Modo | O que faz | Tokens (estimativa) |
|---|---|---|
| `testes` | lê e roda os testes automatizados dos critérios | ~60 mil |
| `tela` | confere os critérios de Tela e API, com vídeo | ~80 a 120 mil por tela |
| `prototipo` | compara a tela com o protótipo e com o checklist de tela v2 | ~50 a 100 mil por tela |
| `quebrar` | campos inválidos por tipo (`campos.mjs`) e até 5 tentativas de quebrar | ~30 a 50 mil por tela |
| `acesso` | só os critérios de papel, de outra clínica e de outro paciente, com usuários QA | ~60 a 80 mil |

- **Chamada:** `/qa-mestre prototipo` roda só esse modo; `/qa-mestre testes tela`
  junta dois. Sem modo, pergunte quais rodar (`AskUserQuestion` com
  `multiSelect: true`; no Cursor, em texto com os modos numerados), uma opção por
  modo, com o custo na descrição. A ferramenta aceita até 4 opções: com os
  cinco, junte `quebrar` e `acesso` numa opção ou pergunte em texto.
- **A preparação é comum** (passos 1 e 2) e roda uma vez, criando só o que os
  modos escolhidos precisam: usuário QA só para `tela`, `quebrar` e `acesso`;
  protótipo só para `prototipo`; nada de usuário para `testes`.
- **O `QA.md` acumula.** Cada modo grava a sua parte; o que não rodou aparece
  como "não rodado". Chamada de novo com o `QA.md` existente, mostre o que já
  rodou e ofereça os modos que faltam.
- **A recomendação só sai** quando já rodaram `testes` e `tela`, e `acesso` se
  houver critério de papel, de outra clínica ou de outro paciente (passo 6).
  Antes disso, o `QA.md` diz "QA parcial: rodou <modos>" e não recomenda. Um
  modo sozinho nunca dispensa o QA humano.

Guia rápido para quem chama a skill (modos, comandos, login):
`tools/playwright/qa-mestre/README.md`.

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
- **Login**: `tools/playwright/credentials.json` preenchido (skill
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

Crie **antes** de chamar os testadores, a partir dos critérios (quais papéis,
quantas clínicas, se há paciente ou operador), e só para os modos que precisam
(`tela`, `quebrar`, `acesso`). Use o script pronto,
`tools/playwright/qa-mestre/usuarios.php`, que grava pelos Models (senha com
hash), só mexe no que tem e-mail `qa-<alvo>--*@exemplo.test` e pode rodar de
novo sem duplicar (reativa e troca a senha). Nunca `INSERT` direto. Numa
worktree, prefixe com `fisio-app exec`; no checkout principal, rode `php` direto.

**Pergunte o id da clínica ao usuário** antes de rodar (`AskUserQuestion`; no
Cursor, em texto). O script lista as clínicas quando o id não existe:
`php tools/playwright/qa-mestre/usuarios.php clinica --clinica 0 --alvo x`.

| Precisa de | Comando |
|---|---|
| Usuário da clínica em cada papel (administrador, fisioterapeuta, secretária) | `php tools/playwright/qa-mestre/usuarios.php clinica --clinica <id> --alvo <alvo>` |
| Só alguns papéis | o mesmo, com `--papeis secretaria,fisioterapeuta` |
| Outra clínica, com o administrador mestre e senha conhecida | `php tools/playwright/qa-mestre/usuarios.php outra-clinica --alvo <alvo> [--plano Start\|Performance\|Premium] [--n 2]` (padrão: Premium; o plano decide as funcionalidades liberadas) |
| Paciente (login com CPF; a senha é o CPF, como no cadastro de verdade) | `php tools/playwright/qa-mestre/usuarios.php pacientes --clinica <id> --alvo <alvo> [--quantos 2]` |
| Operador do admin | `php tools/playwright/qa-mestre/usuarios.php operador --alvo <alvo>` |
| Limpar no fim | `php tools/playwright/qa-mestre/usuarios.php limpar --alvo <alvo>` (exclui, com soft delete, usuários, pacientes e clínicas `qa-<alvo>--*`, e apaga os operadores) |

O script devolve um JSON com tipo, papel, clínica, login, senha e onde entrar.
Ele é a **única** gravação fora da tela que o QA faz. Trocar a função de um
usuário QA no meio de um cenário pode ser pela tela (Usuários, arrastar para
outra função), como um administrador faria.

**Passe ao testador** o login e a senha de cada usuário QA, com o guard, o
papel e a clínica. Ele usa `FISIO_LOGIN=<e-mail> FISIO_SENHA=<senha>` no
comando do `flow.mjs`. As senhas do `credentials.json` e do seeder nunca vão
no pedido nem na conversa.

**Para gastar menos:** um usuário QA por fatia de tela.

No fim do QA, diga ao usuário o que ficou criado e ofereça o `limpar` do alvo.

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

### Protótipo (modo `prototipo`)

Só quando o modo `prototipo` foi escolhido. A entrega cria uma tela nova ou
redesenha uma tela? Você vê isso no diff e na tarefa. Sem tela nova, diga isso
e não rode o modo (`DEFINICAO_DE_QA.md`, seção 3, "Tela nova").

1. **Ache o protótipo**, nesta ordem:
   - **Imagem** salva na pasta da feature ou anexada à tarefa ou à issue: copie
     para `qa/<alvo>/prototipo/<tela>-prototipo.png`.
   - **Rota com `?variant=`** que ainda está no código (o protótipo de tela do
     fisioweb mora na própria rota até o corte; skill `prototype`, `UI.md`):
     `git grep -n "variant" -- resources/js/pages/<área>/`. O `fisio-app build`
     desliga o `?variant=`: compile com
     `NODE_ENV=development npx vite build --mode development` e, no fim, volte
     com `fisio-app build`.
   - **Commit do protótipo** citado no `decisoes.md`, no plano ou no `README.md`
     da feature, quando o protótipo já saiu do código: pergunte ao usuário se
     ele quer subir uma worktree nesse commit (`fisio-app new`) só para os
     prints, ou se manda uma imagem.

   Não achou nada? Pergunte ao usuário. Se não existir, registre "sem
   protótipo" no `criterios.md` e siga sem a comparação.
2. **Confira que a rota abre a variante certa**: um print rápido com
   `screenshot.mjs`. Variante que não existe cai na variante padrão.
3. **Escreva no `criterios.md`** a seção `## Protótipo`: tela, origem (rota com
   `?variant=`, commit ou imagem), a rota da tela entregue, como abrir
   (`--click`) e os tamanhos.
4. **Por padrão, só o estado principal de cada tela, em 1280×720, no tema
   claro.** 375×812 só se o protótipo tiver celular; tema escuro e outros
   estados (vazio, erro, cada etapa de um assistente) só quando o usuário
   pedir: pergunte junto com o plano, com o custo. Comparar todos os estados
   nos dois tamanhos custou ~285 mil tokens numa tela só, no piloto do Paytour.
5. **Checklist de tela v2 acima do protótipo.** O testador também confere a
   tela contra o que se vê do checklist de tela v2 da skill `design-system`
   (componentes `Ds*` e não shadcn, fonte Poppins, tema escuro sem quebra,
   contêiner até a largura máxima de 1920). Item quebrado é achado de DS,
   Major, mesmo quando o protótipo mostra igual à tela. Mande no pedido o
   caminho da skill.
6. **Diferenças de propósito.** Se a feature tem decisões que se afastam do
   protótipo (no `decisoes.md` ou no plano), elas são suas, não do testador: na
   hora de mostrar os achados, marque como "de propósito (decisão <id>)" o que
   bater com uma decisão.

## 3. Divida em fatias e chame os testadores em paralelo

Uma fatia é um modo numa tela (ou num grupo de telas do mesmo fluxo). Só entram
os modos escolhidos.

O QA demora: cada tela leva de 10 a 18 minutos (vídeo, conferência dos quadros,
passada de quebrar). Em série, uma entrega de 12 critérios leva uns 45 minutos;
em paralelo, o tempo da fatia mais lenta. **Divida sempre que houver mais de uma
tela ou mais de uns 5 critérios.**

Como fatiar:

- **Uma fatia por tela** (ou por grupo pequeno de telas do mesmo fluxo). Ex.:
  "usuários", "prontuário", "agenda", "área do paciente".
- **Uma fatia só de teste automatizado** (modo `testes`): todos os critérios
  `(PHPUnit)`/`(Vitest)` e os que só um teste alcança. É a mais rápida (3 a 5
  minutos). Só ela roda teste, para os testadores de tela não disputarem CPU
  com a suíte; o PHPUnit usa SQLite em memória, então não há banco de teste
  compartilhado para atrapalhar.
- **Critérios que trocam de clínica, de papel ou de paciente no mesmo cenário
  ficam juntos** numa fatia (modo `acesso`: isolamento, "outra clínica não vê"),
  para um testador só montar o cenário.
- **Um usuário QA por fatia de tela** (seção "Usuários de teste").
- **No máximo 5 fatias**, uma por testador. Passou disso, junte telas do mesmo
  fluxo.

### Mostre o plano e pergunte quais fatias rodar

Com as fatias montadas, mostre o plano numa tabela, uma linha por fatia:

| Fatia | Modo | Critérios | O que faz | Usuário | Tempo | Tokens |
|---|---|---|---|---|---|---|
| testes | `testes` | C2, C5, C9 | roda PHPUnit/Vitest | n/a | 3 a 5 min | ~60 mil |
| usuários | `tela` | C1, C3, C4 | vídeo | QA secretária | 10 a 15 min | ~100 mil |
| prontuário | `prototipo` | — | estado principal, 1280, claro | QA administrador | 5 a 10 min | ~60 mil |

"O que faz" diz o que pesa: vídeo, teste automatizado, API, protótipo (e quais
estados), celular, tema escuro. Embaixo da tabela, uma linha com o tempo em
paralelo (o da fatia mais lenta) e o **total de tokens** (a soma das fatias).

Depois, **uma pergunta só** (`AskUserQuestion` com `multiSelect: true`): "Quais
fatias eu rodo?", uma opção por fatia, com os critérios, o tempo e os tokens na
descrição, e todas recomendadas. A ferramenta aceita até 4 opções: com 5
fatias, ou no Cursor, pergunte em texto, com as fatias numeradas, e o usuário
responde quais rodar. A resposta livre ("Outra") serve para ajustar o plano:
juntar ou separar fatias, trocar o usuário. Ajustou? Mostre o plano de novo e
pergunte de novo.

**Fatia que o usuário não escolheu não é aprovada.** Os critérios dela entram
no `QA.md` como NÃO VERIFICÁVEL, com o motivo "pulado pelo operador", e por
isso a entrega vai para o QA humano (condição 1 da seção 4 de
`DEFINICAO_DE_QA.md`). Na pergunta de uma rodada seguinte, ofereça rodar as
fatias puladas.

Escreva o plano no `criterios.md` (seção `## Fatias`: fatia, modo, critérios,
usuário, rodou ou foi pulada) e chame **todos os testadores escolhidos na mesma
mensagem**, para rodarem ao mesmo tempo.

Cada fatia grava o seu `QA-<fatia>.md` na pasta de QA (ex.: `QA-usuarios.md`,
`QA-testes.md`). **Só você escreve o `QA.md`**, juntando as fatias no passo 4.

`subagent_type: "testador-de-aceite"`. Na fatia do modo `testes`, passe também
`model: "sonnet"`: ler e rodar teste não precisa do modelo maior. Os modos de
tela ficam no modelo padrão. Em todo pedido vão:

- o caminho da pasta de QA e do `criterios.md`;
- **o modo e a fatia**: quais critérios são dela e o nome do arquivo de saída
  (`QA-<fatia>.md`). O testador faz só o que o modo pede;
- **o teto**: "no máximo <N> fluxos e uns 40 usos de ferramenta; chegou no teto,
  entregue o que tem e diga o que ficou de fora";
- se a fatia roda teste automatizado ou não;
- a URL base do ambiente;
- os usuários QA desta fatia: guard, papel, clínica, login e senha descartável
  (e o CPF do paciente QA, se a fatia passa pela área do paciente);
- se as integrações externas estão liberadas e para onde apontam;
- modo `quebrar`: a URL e os cliques para chegar em cada formulário (`--click`)
  e, em formulário de etapas, o clique de cada etapa (`--etapa`), para o
  `tools/playwright/qa-mestre/campos.mjs`;
- modo `prototipo`: a origem do protótipo de cada tela da fatia (rota com
  `?variant=` ou o PNG em `prototipo/`), a rota da tela entregue, como abrir
  (`--click`), os tamanhos, o tema e os estados (por padrão, só o principal);
- a rodada e, da segunda em diante, quais critérios refazer.

Entrega pequena (uma tela, até uns 5 critérios): um testador só, com saída
`QA.md`. Mostre o plano numa linha e rode, sem perguntar.

**Não mande**: o diff, o resumo do que você fez, a evidência do smoke test, a
sua opinião sobre o que vai passar. Quanto menos ele souber da implementação,
mais o teste vale.

## 4. Leia o resultado e junte as fatias

Leia de cada `QA-<fatia>.md` só a tabela de vereditos, os achados e o que não
foi testado; o resto é detalhe para quem quiser abrir. Confira pelo menos um
PASSOU de Tela por amostragem: primeiro pelo `report.md` do fluxo (legendas,
`expect` e erros); abra o quadro do vídeo só se o texto não bastar. PASSOU sem
prova que abre volta para o testador como NÃO VERIFICÁVEL. Ler imagem custa
caro: no piloto do Paytour, as conferências por imagem pesaram tanto quanto uma
fatia.

Escreva o `QA.md` com **uma tabela só**, C1 a Cn em ordem, com o veredito e a
prova de cada critério, e um link para o `QA-<fatia>.md` de onde veio. Junte
também os achados fora dos critérios, a comparação com o protótipo (uma seção
`## Comparação com o protótipo`, com os achados de todas as telas) e o que não
foi testado. As fatias ficam como detalhe.

Confira um achado de protótipo por amostragem: abra os dois prints de **um**
achado e veja se a diferença está lá.

Fatia que voltou NÃO VERIFICÁVEL por falta de usuário de um papel: crie o
usuário (seção "Usuários de teste") e refaça a fatia na próxima rodada.

### Mostre a rodada e pergunte

Ao fim de **cada** rodada, antes de corrigir qualquer coisa, mostre ao usuário:

- a rodada (1, 2 ou 3) e a contagem por veredito;
- cada FALHOU e NÃO VERIFICÁVEL numa linha, com a causa que você vê (bug da
  entrega, teste fraco, critério errado, falta de usuário);
- os achados Crítico e Major, fora dos critérios e de protótipo;
- o que pretende corrigir e quais fatias voltariam a rodar, com o tempo e os
  tokens aproximados.

Tudo PASSOU ou FORA DO QA, sem achado Crítico ou Major? Não há o que perguntar:
vá para o passo 6.

Senão, pergunte (`AskUserQuestion`; no Cursor, em texto com as opções
numeradas), com a recomendação marcada:

1. **Corrigir e rodar a rodada <N+1>**: passo 5 e, depois, as fatias de novo.
2. **Só corrigir**: passo 5 e para. O usuário chama a skill de novo quando
   quiser a próxima rodada.
3. **Parar aqui**: nada de correção. Vá para o passo 6; a entrega vai para o QA
   humano com o `QA.md` como está.

Critério errado ou ambíguo entra na mesma conversa: diga qual e pergunte como
fica o texto. Na terceira rodada, a opção 1 não existe: é o teto.

Chamada de novo com `qa/<alvo>/QA.md` já existente, a skill continua de onde
parou: lê o `criterios.md` e o `QA.md`, diz em que rodada está e o que falta, e
pergunta se roda a próxima.

## 5. Corrija o que falhou

Cada FALHOU tem uma de três causas:

| Causa | O que fazer |
|---|---|
| **Bug da entrega** | corrija como na `implementar-tarefa`: primeiro um teste que reproduz, depois a correção. Rode `bash bin/verificar.sh` (fora da hora em que a fatia de testes roda). Se mudou comportamento de backend, uma rodada focada da `revisao-adversaria`, com um `revisor-adversario` só, `model: "sonnet"` e o escopo nos arquivos da correção |
| **Teste não confere o critério** ou **sem teste** | escreva ou corrija o teste, veja ficar vermelho com o código quebrado e verde com o certo |
| **Critério errado ou ambíguo** | não é com você: leve ao usuário. Se ele mudar o critério, registre no `criterios.md` quem mudou e quando |

Contestar um veredito pode, **uma vez**, levando a saída de um comando que o
testador não viu. Se ele mantiver, uma pessoa decide.

Depois de corrigir, siga a escolha do usuário. Se ele pediu a próxima rodada,
chame de novo só as fatias que têm critério para refazer, só com os critérios
que falharam, os critérios de Tela da mesma tela e os achados corrigidos.
**Rodada seguinte é sempre focada**: pedido curto, a lista exata do que refazer
e teto menor (uns 20 usos de ferramenta). No piloto do Paytour, a rodada 2
assim gastou de 3 a 4 vezes menos que a rodada 1. Se pediu só a correção, diga
o que foi corrigido e pare. **No máximo 3 rodadas**, cada uma com a pergunta do
passo 4. Sobrou FALHOU: vai para o QA humano com o `QA.md` como está.

Achado fora dos critérios: Crítico ou Major da entrega, corrija como bug da
entrega. De outra área, registre no `DEFERRED.md` da raiz de `.ai-workbench/` e
avise o usuário.

Achado de protótipo Major: corrija a tela para ficar como o protótipo, e a
fatia compara de novo na próxima rodada. Se a diferença parece de propósito (o
protótipo ficou velho), não corrija: leve ao usuário e registre no `QA.md` quem
decidiu. Minor não trava: vai na lista "Para o QA humano olhar".

## 6. Decida a recomendação

Faltou rodar `testes` ou `tela` (ou `acesso`, com critério de papel, de outra
clínica ou de outro paciente)? Não recomende: escreva no fim do `QA.md` "**QA
parcial**: rodou <modos>; falta <modos> para recomendar" e pare aqui.

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
| 3. Sem achado Crítico ou Major (fora dos critérios ou de protótipo) | sim / não |
| 4. Definição de Pronto e revisão adversária | sim / não |
| 5. Fora das áreas de risco | sim / não: mexe em <área> (`arquivo`) |
| 6. Até 8 critérios de Tela e API | sim / não: N |

**Para o QA humano olhar** (quando vai): o que precisa de olho humano, em uma
lista curta. Ex.: "aparência da tela nova no celular e no tema escuro", "C5 não
verificável sem WhatsApp de verdade".
```

## 7. Relate

Diga ao usuário: a recomendação (ou "QA parcial"), os modos que rodaram, a
contagem por veredito, o que foi corrigido nas rodadas, os usuários, clínicas e
pacientes `QA ...` que ficaram criados e onde está a pasta.

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
- **Limpar os usuários QA** do alvo (`usuarios.php limpar --alvo <alvo>`).

## Cuidados

- **QA não é smoke test.** O smoke test (Definição de Pronto) é o seu: caça erro
  enquanto você implementa. O QA é de outro, por critério, no fim. Não troque um
  pelo outro, e não passe a evidência de um para o outro.
- **Não afrouxe o critério para passar.** Se o sistema não faz o que o critério
  diz, ou se corrige o sistema ou uma pessoa muda o critério.
- O vídeo grava de verdade no banco do ambiente. Os dados de teste usam
  prefixo `QA`. Diga ao usuário o que ficou criado.
- Depois do merge, apague `qa/<alvo>/` junto com `evidence/` e `review/`.
