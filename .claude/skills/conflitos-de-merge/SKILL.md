---
name: conflitos-de-merge
description: Resolve um conflito de merge ou rebase do git em andamento no fisioweb pela intenção de cada lado, não pelo texto. Use quando o git parar com conflito (merge, rebase, cherry-pick ou stash pop), ao trazer a main para uma branch de worktree do fisio-app ou ao levar a branch de volta para a main, e em pedidos como "resolve esse conflito", "deu conflito no rebase", "merge conflict", "não consigo terminar o merge".
---

# Conflitos de merge

Origem: `conflitos-de-merge` do pacote "50 skills de IA" (Alura), adaptada ao fisioweb. Converse com o usuário em português.

O conflito que o git mostra é de **texto**: dois commits mexeram nas mesmas linhas. O conflito de verdade é de **intenção**: o que cada lado queria fazer. Resolver no texto (escolher `ours`/`theirs` no chute ou colar os dois blocos) derruba uma funcionalidade em silêncio ou traz de volta um bug que o outro lado tinha corrigido.

**Regra central:** entenda a intenção dos dois lados antes de editar, e entregue uma resolução que preserve as duas.

## Quando usar

- O git parou com conflito num `merge`, `rebase`, `cherry-pick` ou `stash pop`.
- Ao atualizar uma branch de worktree (`fisio-app new <tarefa>` cria `feat/<tarefa>`; `fisio-app new bugfix/<nome>` cria `bugfix/<nome>`) com a `main`, ou ao levar a branch de volta para a `main`. Com várias worktrees em paralelo, isso é o caso mais comum.

Não use para decidir **se** o merge deve acontecer. Isso é decisão do usuário.

## 1. Veja o estado completo

Antes de tocar em qualquer arquivo:

- **Qual operação está em curso:** `git status` diz se é merge, rebase ou cherry-pick. O rebase resolve conflito **por commit, em rodadas**: outro conflito pode aparecer no próximo commit da série.
- **O que a branch que está entrando traz.** Leia o `README.md` e o plano da feature em `.ai-workbench/<feature>/` (e o `decisoes.md`, se houver) e o `git log --oneline main..<branch>`. Esse objetivo é o critério de desempate no passo 3.
- **Quais arquivos conflitam:** `git diff --name-only --diff-filter=U`. Depois leia os marcadores (`<<<<<<<`, `=======`, `>>>>>>>`) de cada um.

> **Pegadinha do rebase:** `ours` e `theirs` vêm **invertidos** em relação ao merge. No rebase, `ours` é a base sobre a qual você está reaplicando (normalmente a `main`) e `theirs` é o **seu** commit. Confira qual é qual antes de escolher um lado pelo nome.

## 2. Recupere as duas intenções

Para cada bloco em conflito, descubra **por que** cada lado mudou aquilo:

- A mensagem do commit de cada lado: `git log --oneline --left-right --merge -- <arquivo>`, e `git log -p` ou `git blame` na região.
- A pasta da feature em `.ai-workbench/` (plano, tarefa, `decisoes.md`) e os ADRs em `docs/adr/` que a mudança cita.
- O código em volta. O bloco pode ser parte de algo maior, e resolver só ele quebra o resto.

Se a intenção de um lado for opaca (commit sem mensagem, sem feature, sem contexto), **diga ao usuário antes de adivinhar**.

## 3. Resolva preservando as duas intenções

- **Compatíveis** (o caso mais comum): a resolução costuma ser a **união** do que cada lado queria, não a escolha de um. Ex.: um lado adicionou validação a um campo, o outro renomeou o campo → a validação vai no campo renomeado.
- **Incompatíveis:** fique com o lado que casa com o objetivo do passo 1 e **registre a intenção descartada** no corpo do commit e na resposta ao usuário. Descartar em silêncio é o pior resultado.
- **Não invente comportamento.** A resolução combina ou escolhe o que **já existia** nos dois lados. Se estiver escrevendo lógica que não estava em nenhum, pare: isso é tarefa nova, não resolução.
- **Não aborte sem perguntar.** `git merge --abort` ou `git rebase --abort` só com o "sim" do usuário. Se achar que o merge não deveria acontecer (branch errada, base errada), diga isso e pergunte.

### Arquivos com regra própria neste projeto

| Arquivo | Como resolver |
|---|---|
| `composer.lock` | Não edite à mão. Resolva o `composer.json` primeiro, pegue o lock de um dos lados (`git checkout --ours composer.lock` no merge) e rode `composer update <pacotes que o outro lado adicionou ou mudou>`. Dependência nova só entra se já foi aprovada na branch de origem (regra do `AGENTS.md`). |
| `package-lock.json` | Resolva o `package.json` primeiro e rode `npm install --package-lock-only`, que regera o lock a partir dos dois lados. Mesma regra de aprovação. |
| Migrations em `modules/*/database/migrations/` | Raramente dão conflito de texto, porque cada uma é um arquivo novo. O risco é **semântico**: duas branches alterando a mesma tabela, ou a ordem pelo timestamp não ser a ordem em que as mudanças fazem sentido. Leia as migrations novas dos dois lados juntas. Nunca edite migration que já rodou na `main`: se precisar ajustar, crie outra. |
| `.ai-workbench/NNN-<slug>/` | Duas worktrees podem ter criado features com o **mesmo número** em pastas diferentes: não há conflito de texto, mas o número repete. Renumere a pasta da branch que está entrando para o próximo livre e atualize as referências a ela. O que está no `.gitignore` (`evidence/`, `review/`, `qa/`) não entra no merge. |
| `lang/pt_BR.json`, `lang/pt_BR/*.php`, `modules_statuses.json`, rotas, `permissions.ts` e `AGENTS.md` | Os dois lados costumam só **acrescentar** entradas: a resolução é manter as duas, sem chave repetida. Em `permissions.ts`, confira que a permissão nova de cada lado continua com os papéis que ele queria. |
| Provider de módulo (`modules/*/app/Providers/`) | Mantenha os bindings dos dois lados. Se os dois ligam a mesma interface a classes diferentes, é incompatível: volte ao passo 3. |

## 4. Confira que as duas intenções sobreviveram

Resolvido no texto não quer dizer correto.

1. **Conflito que o git não marcou.** Blocos sem sobreposição de texto podem ser incompatíveis: um lado renomeou um método, o outro adicionou uma chamada ao nome antigo. Releia a combinação inteira dos arquivos que os dois lados tocaram, não só onde havia marcador. `git diff --name-only main...<branch>` e `git diff --name-only <branch>...main` mostram o que cada lado mexeu.
2. **Nenhum marcador sobrou:** `git diff --check` e `grep -rn '^<<<<<<<\|^>>>>>>>' modules app resources routes tests lang`.
3. **As verificações do projeto, nesta ordem:**
   - `vendor/bin/pint --dirty --format agent`
   - `npm run types`
   - `bash bin/verificar.sh`
   - `composer run test`, que inclui a suíte `tests/Architecture/` (fronteira entre módulos, acesso por guard da clínica, nomes de módulo). Merge é um jeito comum de furar a fronteira sem perceber.
   - `npm run test`

   Passar nos testes dos dois lados é o mínimo: eles podem não cobrir a interação entre as duas mudanças. Se a interação tem regra de negócio, rode o teste mais estreito que a cobre ou peça um smoke test (skill `qa-navegador`).
4. **Banco da worktree.** Se entraram migrations do outro lado, rode `fisio-app migrate` na worktree antes de testar no navegador, e `fisio-app build` se o front mudou.

Se algo quebrar e a causa não for óbvia, use a skill `systematic-debugging`. Não saia mudando o código até passar.

## 5. Feche

- `git add` nos arquivos resolvidos e finalize: `git commit` (merge ou cherry-pick) ou `git rebase --continue` (rebase).
- **Rebase:** volte aos passos 2 a 4 a cada rodada, até o rebase terminar de reaplicar todos os commits.
- No corpo do commit, registre o que não for óbvio: qual intenção ganhou e por quê, e o que foi descartado. Quem der `git blame` naquela linha depois precisa entender a decisão sem refazer a investigação.
- Não faça `push` sem o usuário pedir.

## Resultado esperado

Diga ao usuário, em tópicos:

1. Quais arquivos tinham conflito e, para cada um, a intenção de cada lado e como ficou.
2. Qualquer intenção descartada e o motivo.
3. As verificações do passo 4 que rodaram e o resultado de cada uma, e as que foram puladas, com o motivo.
