# ADR: IMPORTANTE — pendências antes do deploy de Finanças (feature 013)

**Status:** pendente, aberto em 2026-11-01. Fecha quando os itens abaixo
estiverem feitos e cada um tiver a data e quem fez anotados aqui. O item 5 entrou
em 2026-11-10, com os arquivos do prontuário (feature 002, tarefa 016).

## Contexto

A feature 013 (Finanças no DS v2, `.ai-workbench/013-clinic-financas-ds/`) foi
implementada e passou por 3 rodadas de revisão adversária em 2026-11-01. Quatro
coisas ficaram de fora do código. A primeira é configuração do Cloudflare, sem a
qual o comprovante não pode ir para produção. As outras três são decisões que só
o dono do produto pode tomar. Este ADR junta as quatro num lugar que vai para o
git, para nenhuma se perder entre a PR e o deploy.

## Decisão: o que deve ser feito

### 1. Criar a regra de WAF do comprovante no Cloudflare (bloqueia o deploy)

**Por quê.** O comprovante de um lançamento fica no mesmo bucket R2 que o CDN
serve em público (decisão do usuário em 2026-11-01, ADR 026, decisão 6). A API
nunca devolve a URL pública, mas o link assinado de 5 minutos mostra o caminho do
arquivo (`clinics/{clínica}/finances/transactions/{lançamento}/{uuid}.pdf`).
Sem a regra, quem viu o link uma vez (histórico do navegador, link encaminhado,
print, log de proxy) troca o domínio pelo do CDN e abre o arquivo **para sempre,
sem login**, até com o lançamento na lixeira. Comprovante costuma ter nome e
dado de pagamento de paciente (LGPD). Nenhum teste do PHP enxerga essa regra.

**Passo a passo** (painel do Cloudflare, na zona do domínio do CDN):

1. **Normalização de URL.** Rules → Settings → URL Normalization:
   - tipo de normalização **Cloudflare** (não o RFC-3986, que não junta `//`
     nem troca `\` por `/`);
   - **Normalize incoming URLs** ligado.
2. **Regra de bloqueio.** Security → WAF → Custom rules → Create rule:
   - nome: `bloqueia comprovantes de Finanças no CDN`;
   - expressão (Edit expression), trocando `<host>` pelo host do
     `CLOUDFLARE_CDN_URL` do `.env` de produção. Se houver mais de um domínio
     ligado ao bucket, todos entram no `in {...}`:

     ```
     (http.host in {"<host>"}
       and lower(url_decode(http.request.uri.path, "r")) contains "clinics"
       and lower(url_decode(http.request.uri.path, "r")) contains "finances")
     ```

   - ação: **Block**;
   - salvar e conferir que ela está **ativa** e na ordem certa (nenhuma regra
     anterior com *Skip* que a pule).

   O `url_decode(..., "r")` decodifica de forma recursiva (`%2F`, `%252F`, `%66`),
   e a regra procura só as palavras, sem a barra: um `finances%2F...` ou um
   `clinics%2F1/...` não escapam. Nenhuma outra pasta do bucket (`patients/`,
   `clinic-users/`, `images/`, `videos/`, `thumbnails/`) tem as duas palavras.
3. **Desligar o `r2.dev`.** R2 → bucket → Settings → Public Development URL
   (`pub-<id>.r2.dev`): **desligado**. O `r2.dev` não passa pelo WAF da zona,
   então a regra não o cobre.
4. **Conferir com `curl`** (de qualquer máquina, sem login). `--path-as-is`
   impede o `curl` de arrumar o caminho antes de mandar. O arquivo nem precisa
   existir: o WAF responde antes do bucket. **Todas as linhas do laço têm que dar
   403**; um 404 quer dizer que a regra não pegou.

   ```bash
   CDN="https://<host>"   # o CLOUDFLARE_CDN_URL de produção
   for p in \
     "/clinics/1/finances/transactions/1/x.pdf" \
     "/clinics/1/finances%2Ftransactions/1/x.pdf" \
     "/clinics%2F1/finances/transactions/1/x.pdf" \
     "/clinics%252F1%252Ffinances/transactions/1/x.pdf" \
     "//clinics/1/finances/transactions/1/x.pdf" \
     "/clinics/1/%66inances/transactions/1/x.pdf" \
     "/CLINICS/1/FINANCES/transactions/1/x.pdf"; do
     printf '%s %s\n' "$(curl --path-as-is -s -o /dev/null -w '%{http_code}' "$CDN$p")" "$p"
   done

   # r2.dev desligado: não pode responder 200.
   curl --path-as-is -s -o /dev/null -w '%{http_code}\n' "https://pub-<id>.r2.dev/clinics/1/finances/transactions/1/x.pdf"

   # A regra não pega o resto do bucket: um vídeo ou foto que existe continua 200.
   curl -s -o /dev/null -w '%{http_code}\n' "$CDN/<caminho de um vídeo conhecido>"
   ```

5. **Teste de ponta a ponta** (só com autorização, porque grava no bucket de
   verdade): numa clínica de teste, anexar um PDF a um lançamento, abrir pelo
   botão (link assinado: tem que abrir), copiar o caminho do link, montar
   `$CDN/<caminho>` e abrir sem login (tem que dar 403). Apagar o comprovante e
   o lançamento no fim. Um HEIC de iPhone também vale a pena conferir.
6. **Anotar** a data, quem fez e a saída do `curl` neste ADR e na nota
   "PRÉ-REQUISITO DE DEPLOY, PENDENTE" da decisão 6 do ADR 026, e marcar `[x]` no
   critério da regra de WAF em
   `.ai-workbench/013-clinic-financas-ds/tasks/014-comprovantes.md`.

Refazer a conferência do passo 4 sempre que o domínio do CDN mudar, que a regra
for editada ou que alguém mexer nas configurações do bucket.

### 2. Decidir: o "a receber" do resumo conta as atrasadas?

**O problema.** No topo de Finanças, o resumo do mês mostra "+ R$ X a receber" /
"a pagar" e a previsão de fim de mês, calculados só com as pendências **do mês na
tela** (`FinanceSummaryService::summary`, `applyPeriodFilter`). Ao lado, as
listas "A receber" e "A pagar" mostram as do mês **e todas as atrasadas de meses
anteriores** (`overdue_until`, decisão de 2026-10-30: "para nada vencido ficar
escondido"). Com uma entrada pendente de setembro, a mesma tela de outubro mostra
dois valores diferentes de "a receber".

**Opções:**

- **A (recomendada): o resumo soma também as atrasadas.** Fica coerente com a
  decisão de não esconder o que venceu. A previsão de fim de mês passa a contar o
  que está atrasado.
  - Backend: em `FinanceSummaryService::summary`, as pendências (`income.pending`,
    `expense.pending`) passam a vir de `sumNetForClinic` com `overdue_until` = fim
    do mês da tela (o mesmo total que a lista mostra), em vez do mês só; a
    previsão usa esses valores.
  - Front: nenhum texto muda, ou o rótulo vira "a receber (com atrasados)".
  - Teste: entrada pendente de setembro aparece em `income.pending` do resumo de
    outubro, com o mesmo valor do `meta.netTotal` da lista.
- **B: o resumo continua só do mês, e o rótulo deixa isso claro.** "a receber
  neste mês"; a lista ganha um aviso "inclui R$ Y atrasado". Mexe só no front
  (`finance-parts.tsx`, `PendingList.tsx`), sem mudar números.

### 3. Decidir: restaurar uma pendente da série antiga pode duplicar o mês?

**O problema.** Ao editar uma recorrência com "Este e os próximos", a série
antiga é encerrada e as pendentes dela vão para a lixeira; a série nova gera as
ocorrências no lugar (ADR 026, decisão 4). Se alguém restaurar da lixeira uma
dessas pendentes antigas, o mês fica com **dois lançamentos** da mesma conta (a
restaurada e a da série nova). Hoje nada avisa nem impede. Restaurar a pendente
de uma exclusão "esta e as próximas" tem o mesmo efeito quando a série continua.

**Opções:**

- **A (recomendada): bloquear com 409.** Ao restaurar, se o lançamento é de uma
  série encerrada antes da data dele (`ends_on < date`) e já existe ocorrência
  ativa daquela série nova no mesmo mês, responder 409 "Esta ocorrência foi
  substituída pela nova regra da repetição. Edite a ocorrência que está no
  calendário." A tela mostra a mensagem num toast.
  - Backend: `FinancialTransactionService::restore` confere a série antes de
    restaurar (no próprio módulo, `FinancialSeriesRepository`).
  - Teste: dividir uma série, restaurar uma pendente antiga → 409 e nada muda;
    restaurar um lançamento avulso continua 200.
- **B: deixar restaurar, mas avisar na Lixeira.** O item ganha o selo
  "Substituído pela nova regra" e um aviso no toast depois de restaurar.
- **C: aceitar como está** e registrar no DEFERRED que é responsabilidade de
  quem restaura.

### 4. Decidir: o `DEFERRED.md` das features entra no git?

**O problema.** A Definição de Pronto
(`docs/ai-harness/DEFINITION_OF_DONE.md`, seção "Pasta de trabalho") e o modelo
de README da skill `escrever-plano` dizem que os dois `DEFERRED.md` (o da raiz e
o de cada feature) ficam no `.gitignore` e nunca entram num commit, porque podem
ter dado de paciente. Mas o `.gitignore` só ignora `evidence/` e `review/`, e 19
`DEFERRED.md` já estão rastreados no git. O da 013 entraria no próximo
`git add .ai-workbench/013-*` sem ninguém decidir.

**Opções:**

- **A (recomendada): seguir a regra escrita e tirar do git.** Protege contra
  dado de paciente que alguém escreva no adiado.
  - Acrescentar ao `.gitignore`, junto das outras linhas do ai-harness:
    `/.ai-workbench/DEFERRED.md` e `/.ai-workbench/*/DEFERRED.md`.
  - `git rm --cached` nos 19 arquivos rastreados (eles ficam no disco). O
    histórico do git continua com as versões antigas; se alguma tiver dado de
    paciente, isso pede limpeza do histórico à parte.
  - Conferir com `git check-ignore -v .ai-workbench/013-clinic-financas-ds/DEFERRED.md`.
- **B: aceitar que o DEFERRED vai para o git.** Corrigir a Definição de Pronto,
  o modelo de README da `escrever-plano` (nas três árvores de skills, rodando
  `bash bin/verificar-skills.sh`) e o README das features, e acrescentar a regra
  "o DEFERRED nunca tem dado de paciente, e-mail, senha ou token".

### 5. Estender a regra de WAF aos arquivos do prontuário (bloqueia o deploy da feature 002)

**Por quê.** Desde a tarefa 016 da feature 002
(`.ai-workbench/002-isolamento-clinicas-e-papeis/`), o laudo e o exame do
paciente seguem o caminho do comprovante: a API não grava nem devolve o
`cdn_url` e o arquivo só abre pelo link assinado de 5 minutos de
`GET /api/clinic/patients/{paciente}/files/{arquivo}/url`. O arquivo continua no
mesmo bucket que o CDN serve em público, e o link assinado mostra o caminho
(`patients/files/{uuid}.pdf`). Sem a regra, quem viu o link uma vez troca o
domínio pelo do CDN e abre o laudo para sempre, sem login. É dado de saúde
(LGPD). Os arquivos antigos, gravados antes da 016, também ficam em
`patients/files/` e passam a ser cobertos pela mesma regra.

**Passo a passo** (o mesmo painel e a mesma zona do item 1):

1. A normalização de URL do item 1, passo 1, vale para esta regra também.
2. **Regra de bloqueio.** Security → WAF → Custom rules: editar a regra do item 1
   (ou criar outra com a mesma ação) para bloquear também o caminho que tem
   `patients` e `files`. Com as duas numa regra só, a expressão fica:

   ```
   (http.host in {"<host>"}
     and (
       (lower(url_decode(http.request.uri.path, "r")) contains "clinics"
         and lower(url_decode(http.request.uri.path, "r")) contains "finances")
       or
       (lower(url_decode(http.request.uri.path, "r")) contains "patients"
         and lower(url_decode(http.request.uri.path, "r")) contains "files")
     ))
   ```

   - ação: **Block**; nome sugerido:
     `bloqueia comprovantes e arquivos do prontuário no CDN`.
   - A foto do paciente (`patients/photos/`) não tem `files` no caminho e
     continua pública, como decidido na feature 002 (fora do escopo). Nenhuma
     outra pasta do bucket tem `patients` e `files` juntas; mudar a pasta dos
     arquivos do prontuário exige mudar a regra junto.
3. **`r2.dev` desligado** (item 1, passo 3). Sem isso, a regra não cobre o
   arquivo do prontuário, porque o `r2.dev` não passa pelo WAF da zona.
4. **Conferir com `curl`**, como no item 1, passo 4. **Todas as linhas têm que dar
   403**:

   ```bash
   CDN="https://<host>"   # o CLOUDFLARE_CDN_URL de produção
   for p in \
     "/patients/files/x.pdf" \
     "/patients%2Ffiles/x.pdf" \
     "/patients%252Ffiles/x.pdf" \
     "//patients/files/x.pdf" \
     "/patients/%66iles/x.pdf" \
     "/PATIENTS/FILES/x.pdf"; do
     printf '%s %s\n' "$(curl --path-as-is -s -o /dev/null -w '%{http_code}' "$CDN$p")" "$p"
   done

   # A foto do paciente continua pública: uma que existe dá 200.
   curl -s -o /dev/null -w '%{http_code}\n' "$CDN/patients/photos/<foto conhecida>"
   ```

5. **Teste de ponta a ponta** (só com autorização, porque grava no bucket de
   verdade): no prontuário de um paciente de teste, enviar um PDF e abrir pelo
   botão (tem que abrir), copiar o caminho do link, montar `$CDN/<caminho>` e
   abrir sem login (tem que dar 403). Apagar o arquivo no fim e conferir que o
   objeto saiu do bucket.
6. **Anotar** a data, quem fez e a saída do `curl` aqui, e marcar o item no
   checklist de deploy da PR da feature 002.

## Consequências

- Enquanto o item 1 não estiver feito, Finanças pode ir para produção **sem** a
  parte de comprovante; com ela, não. A descrição da PR da 013 precisa citar este
  ADR.
- Enquanto o item 5 não estiver feito, a feature 002 não vai para produção: o
  arquivo do prontuário continuaria abrindo pelo CDN para quem viu um link
  assinado. A descrição da PR da 002 precisa citar este ADR no checklist de
  deploy.
- Os itens 2, 3 e 4 não bloqueiam o deploy, mas cada decisão vira uma tarefa
  pequena (com teste) e uma linha no `decisoes.md` da feature 013.
- Quem fechar um item anota aqui a data, a opção escolhida e o commit.

## Relacionados

- [ADR 026](026-financas-liquido-saldo-encadeado-e-series.md): decisão 6 (comprovante e regra de WAF) e decisão 4 (séries e "este e os próximos").
- Feature `.ai-workbench/013-clinic-financas-ds/` (`decisoes.md`, sessão 2026-11-01; tarefa 014).
- `docs/ai-harness/DEFINITION_OF_DONE.md`, seção "Pasta de trabalho".
