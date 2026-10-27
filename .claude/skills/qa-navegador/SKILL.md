---
name: qa-navegador
description: Faz QA de telas do fisioweb num Chromium headless (sem abrir janela na tela do usuário) com as ferramentas de tools/screenshot/ (screenshot.mjs para print, flow.mjs para rodar um fluxo caçando erro de console, rede, Laravel e texto quebrado, frames.mjs para assistir um vídeo como storyboard) e grava vídeo com legenda quando há bug para mostrar a alguém. Use quando pedirem para testar uma tela, caçar bug, reproduzir um bug relatado, gravar o vídeo de um bug, assistir um vídeo de bug, no smoke test de tela da Definição de Pronto, ou quando o harness (.ai-workbench) achar um bug que outra pessoa precisa ver.
---

# QA no navegador

O objetivo é **achar erro**, não tirar print bonito. Você abre a tela como um
usuário, faz o fluxo, e cada erro de console, requisição 4xx/5xx, erro do
Laravel na página ou `R$ NaN` na tela vira um achado com o passo em que
apareceu.

**Nunca abra o Chrome do usuário.** Tudo aqui roda no Chromium do Playwright em
modo headless: o usuário não vê janela nenhuma. Claude in Chrome e Chrome
DevTools MCP ficam bloqueados no `.claude/settings.json`.

**Vídeo só quando há bug.** Uma rodada de QA comum não grava vídeo: gera o
`report.md` e os prints. Achou um bug que alguém precisa ver? Aí você grava o
vídeo **com legenda** (seção 5).

Três ferramentas, todas rodadas na raiz do fisioweb:

| Ferramenta | Para quê | Saída |
|---|---|---|
| `tools/screenshot/screenshot.mjs` | Print de uma URL (comparação visual, DS) | `temporary-screenshots/screenshot-N-<rótulo>.png` |
| `tools/screenshot/flow.mjs` | Rodar um fluxo caçando erro; com `--video`, gravar o bug | `report.md`, prints; com vídeo: `video.webm`, `storyboard.png` |
| `tools/screenshot/frames.mjs` | "Assistir" um vídeo (`.webm`, `.mov`, `.mp4`) | `storyboard.png` + `frames/` |

Você não assiste vídeo: você lê PNG. Por isso o `flow.mjs` e o `frames.mjs`
transformam o vídeo num **storyboard**, uma imagem com os quadros em grade e o
segundo de cada um.

## 0. Antes de começar

1. **Ambiente no ar.** No checkout principal com `composer run dev`, a URL é a
   `APP_URL` do `.env` (em geral `http://localhost:8000`). Numa worktree do
   `fisio-app`, a porta está no `AMBIENTE.md` da pasta ou em `fisio-app url`;
   nunca escreva a porta à mão. Confira:
   `curl -s -o /dev/null -w "%{http_code}\n" <url>/clinica/login` tem que dar
   `200`. `000` é ambiente fora do ar: avise o usuário, não tente subir sozinho.
2. **Front atualizado.** Numa worktree o front é servido compilado: depois de
   mexer no front, rode `fisio-app build` antes de testar, senão você testa o
   código velho.
3. **Primeira vez na máquina:** `cd tools/screenshot && npm install` (instala o
   Playwright e o Chromium dele) e
   `cp credentials.exemple.json credentials.json`, com um usuário por guard
   (`clinic` e `admin`). Os usuários e a senha estão no
   `database/seeders/DatabaseSeeder.php`.
4. **Login automático.** Se a URL cair em `/clinica/login` ou `/admin/login`, a
   ferramenta entra com o usuário daquele guard e volta para a URL, **fora do
   vídeo**. Para entrar com outro usuário (outra clínica, outro papel), prefixe
   o comando com `FISIO_LOGIN=<email> FISIO_SENHA=<senha>`. Pedir a própria
   tela de login não loga: dá para testar a tela de login também.
5. **Só ambiente local.** O `flow.mjs` recusa host que não seja local, porque o
   roteiro clica em "Salvar" de verdade. E as ferramentas param sem logar se um
   redirecionamento sair do ambiente local.
6. **Integrações externas:** um fluxo que manda WhatsApp (Twilio), mexe no
   Google Agenda ou sobe arquivo para o R2 usa o que o `.env` local aponta.
   Antes de rodar um desses, confirme com o usuário que não vai para um
   paciente ou conta de verdade.

## 1. Escolha o modo

- **Só olhar uma tela ou comparar com o DS** → `screenshot.mjs`. O gabarito do
  design system v2 é o catálogo `/design-system`: tire o print dele como
  `reference` e o da tela como `impl`, e compare os dois PNGs.
- **Testar um fluxo, caçar bug** → roteiro + `flow.mjs`, sem vídeo.
- **Bug achado que alguém precisa ver** → roteiro com legenda +
  `flow.mjs --video` (seção 5).
- **O usuário mandou um vídeo do bug** → `frames.mjs` no arquivo, leia o
  storyboard, descreva o que viu e transforme em roteiro.
- **Tela que você ainda não conhece** → explore primeiro com o MCP `playwright`
  do `.mcp.json` (também headless): o snapshot de acessibilidade mostra os
  nomes dos botões e campos. Sem ele, leia a página em
  `resources/js/pages/`. Depois escreva o roteiro.

## 2. Escreva o roteiro

Roteiro é um `.json` (simples) ou `.mjs` (quando precisa de lógica). Guarde
**fora** da pasta de saída: o `--overwrite` apaga a pasta de saída e o roteiro
tem que sobreviver para a próxima rodada. O `flow.mjs` copia o roteiro para a
saída como `roteiro.json`.

```json
{
  "name": "cadastrar paciente",
  "baseUrl": "http://localhost:8000",
  "steps": [
    { "goto": "/clinica/pacientes" },
    { "screenshot": "lista" },
    { "click": "role=button[name=\"Novo paciente\"]" },
    { "fill": ["role=textbox[name=\"Nome completo\"]", "QA Paciente"] },
    { "fill": ["role=textbox[name=\"CPF\"]", "52998224725"] },
    { "click": "role=button[name=\"Concluir cadastro\"]" },
    { "screenshot": "depois-de-salvar" }
  ]
}
```

| Ação | Valor | Faz |
|---|---|---|
| `goto` | caminho ou URL | abre e espera a rede assentar |
| `click`, `dblclick`, `hover`, `check`, `uncheck` | seletor | interage com o primeiro que casar |
| `fill` / `type` | `[seletor, texto]` | preenche de uma vez / digita tecla a tecla (máscara de CPF e telefone, autocomplete) |
| `select` | `[seletor, valor]` | escolhe opção de `<select>` nativo (os `Ds*` e o shadcn usam popover: clique no gatilho e depois na opção) |
| `press` | `"Enter"` ou `[seletor, "Tab"]` | tecla |
| `upload` | `[seletor, caminho]` | envia arquivo (caminho relativo à raiz) |
| `wait` | ms | espera fixa (evite; prefira `waitFor`) |
| `waitFor`, `expectVisible`, `expectHidden` | seletor | espera aparecer / sumir |
| `waitForUrl`, `expectUrl` | trecho da URL | confere navegação |
| `expectText`, `expectNoText` | texto | confere o que o usuário lê |
| `eval` | expressão JS | roda na página |
| `screenshot` | rótulo | print (página inteira sem vídeo; área visível com vídeo) |
| `caption` | `"texto"` ou `["texto", ms]` | legenda no rodapé e pausa para leitura (padrão 2500 ms); `""` tira |

Campos extras em qualquer passo: `"name"` (rótulo no relatório),
`"optional": true` (falha não para o fluxo), `"timeout": 5000`,
`"secret": true` (esconde o valor do `fill` no relatório).

**Seletores**, do melhor para o pior: `role=button[name="Concluir cadastro"]`,
`role=textbox[name="E-mail"]`, `text=Salvar`, `[data-testid=...]`,
`input[placeholder*="Pesquisar"]`. Classe do Tailwind quebra à toa. Os
componentes `Ds*` (telas v2) e os do shadcn (v1) têm rótulo acessível: prefira
`role=...[name=...]`. No roteiro `.json`, `role=x[name="..."]` vira
`getByRole` (o mesmo dos testes): o nome casa por trecho, sem diferenciar
maiúscula, então "Nome completo" acha o campo "Nome completo*". Os nomes de
verdade estão no snapshot de acessibilidade do MCP `playwright`; não chute.

Com lógica (laço, condição), use `.mjs`:

```js
export const name = 'filtrar pacientes'
export const baseUrl = 'http://localhost:8000'
export const loginUrl = '/clinica/pacientes'

export default async function ({ page, step, shot, caption, url }) {
  await step('abrir lista', () => page.goto(url('/clinica/pacientes')))
  await caption('1/2  Lista de pacientes da clínica.', { ms: 3000 })
  for (const status of ['Só ativos', 'Só inativos']) {
    await step(`filtrar ${status}`, async () => {
      await page.goto(url('/clinica/pacientes'))
      await page.getByRole('button', { name: 'Situação', exact: true }).click()
      await page.getByRole('menuitemradio', { name: status }).click()
    })
    await shot(`status-${status}`)
  }
}
```

`step(nome, fn, { optional })` mede o tempo, inspeciona a página depois e tira
print se falhar. `shot(rótulo)` tira print. `caption(texto, { ms })` põe a
legenda. `page` é o `Page` do Playwright.

## 3. Rode

```bash
node tools/screenshot/flow.mjs <roteiro.json>
```

Opções que mais importam:

- `--base URL` → base dos caminhos relativos (a porta da worktree, por exemplo).
- `--out DIR --overwrite` → onde salvar (padrão: `temporary-screenshots/flows/<data>-<nome>/`).
- `--video` → grava `video.webm` + `storyboard.png`. **Só para bug** (seção 5).
- `--read-only` → barra toda requisição de escrita (POST/PUT/PATCH/DELETE) e
  lista no relatório o que seria enviado. Atenção: a tela pode reclamar da
  escrita barrada (`AxiosError: Network Error`); isso é efeito do bloqueio, não
  bug, e o relatório avisa.
- `--width 375 --height 812` → celular.
- `--trace` → `trace.zip` para o humano abrir com `npx playwright show-trace`.
- `--headed --slowmo 300` → abre uma janela na tela do usuário. **Só quando ele
  pedir para assistir**; o padrão é headless.
- `--dismiss-dialogs` → responde "Cancelar" nos `confirm()` (padrão: aceita).

Saída `0` quer dizer que o fluxo chegou ao fim, **não** que está sem bug. Saída
`1` quer dizer que um passo falhou: o print `NN-falhou-<passo>.png` mostra onde.

## 4. Leia o resultado e cace

1. **`report.md`**: resultado, tabela de passos com o segundo de cada um, e a
   tabela de achados.
2. **Prints dos passos** onde precisar de detalhe.
3. Com vídeo, **`storyboard.png`**: procure o que o detector não pega (layout
   quebrado, skeleton que não some, toast de erro que pisca e some, dado errado).
   Para um momento exato: `node tools/screenshot/frames.mjs video.webm --at 8,17`.

O que o `flow.mjs` detecta sozinho:

| Achado | Costuma ser |
|---|---|
| `erro JS` | bug: exceção não tratada no front (ou efeito do `--read-only`) |
| `HTTP 5xx` | bug no backend; a stack está em `storage/logs/laravel.log` ou em `fisio-app logs` |
| `erro do Laravel na página` | `SQLSTATE`, exceção do Illuminate/Symfony ou stack trace renderizado na tela |
| `HTTP 4xx` | 403/404 inesperado = bug; 422 de validação = esperado se você mandou dado inválido; 401 = sessão perdida |
| `console.error` / `console.warning` | aviso do React (key, act, prop inválida) ou ruído de biblioteca |
| `texto quebrado na tela` | `undefined`, `NaN`, `R$ NaN`, `[object Object]`, `Invalid date` |
| `diálogo` | `confirm()`/`alert()` que apareceu, com o texto |
| `saiu do ambiente local` | redirecionou para fora (Google, produção) |

**Ruído antigo não é seu bug.** Antes de culpar a mudança, veja se o achado
acontece numa tela que você não tocou. Se for anterior à mudança, registre no
`DEFERRED.md` da raiz de `.ai-workbench/` e siga.

Depois do caminho feliz, **tente quebrar**:

- **Outra clínica (o mais importante):** rode o mesmo fluxo com
  `FISIO_LOGIN`/`FISIO_SENHA` de um usuário de outra clínica do seeder e abra
  a URL de um registro da primeira clínica. Tem que dar 403/404 e a tela não
  pode mostrar nenhum dado dela.
- **Papel menor:** usuário que não é admin da clínica não vê nem faz o que não
  deve (o backend nega; a tela só esconde).
- **Vazio e inválido:** salvar sem preencher; CPF e telefone inválidos; data no
  passado; valor `0`, negativo e muito grande; acentos e emoji.
- **Duplo envio:** `dblclick` em "Salvar" e conferir que não criou dois.
- **Navegação:** recarregar no meio, voltar depois de salvar, abrir a URL de
  edição direto, filtros que vivem na URL.
- **Lista:** filtro sem resultado, paginação na última página, ordenação.
- **Celular:** 375×812, procure rolagem horizontal e botão fora da tela.
- **Tema escuro** nas telas v2: troque o tema e procure texto sem contraste.
- **Dinheiro e data:** formato `R$ 1.234,56`, fuso, virada de dia.

## 5. Vídeo de bug

Grave quando houver um bug confirmado que **outra pessoa precisa ver**: o
usuário pediu, o bug vai para o `DEFERRED.md`, ou a decisão é de uma pessoa.
Não grave bug que você mesmo corrige na mesma tarefa: aí a prova é o teste que
falhava e passou a passar.

**Onde fica:** `.ai-workbench/<NNN-slug>/bugs/<slug-do-bug>/`, com o roteiro na
raiz e o vídeo em `video/` (a pasta `bugs/` está no `.gitignore`):

```bash
node tools/screenshot/flow.mjs .ai-workbench/<NNN-slug>/bugs/<slug>/roteiro.json \
  --video --out .ai-workbench/<NNN-slug>/bugs/<slug>/video --overwrite
```

Fora do harness, use `temporary-screenshots/bugs/<slug>/` do mesmo jeito.

**Como o vídeo convence:**

- **Legenda numerada em cada etapa** (`"1/4  ..."`), dizendo o que a pessoa está
  vendo e por que importa. Frase curta, uma ideia por legenda, 3 a 4 segundos
  cada. Quem assiste não leu o código.
- **Usuário comum**, com o papel que tem o problema.
- **Primeiro o normal, depois o bug.** Mostre o que o usuário deveria ver e em
  seguida o que acontece.
- **Um caso de controle** quando der: o mesmo passo com um dado que funciona,
  para mostrar que a diferença é o bug e não o ambiente.
- **Ache os dados pela tela**, não consultando o banco.
- **`--read-only`** quando o bug aparece só lendo: nada é gravado no banco.

**Antes de entregar, confira os quadros.** Leia o `storyboard.png` e, para cada
legenda, o quadro do segundo dela (`frames.mjs video.webm --at ...`; os segundos
estão em "Legendas do vídeo" no `report.md`). Clique que não aconteceu, legenda
que não bate com a tela ou passo que falhou: corrija o roteiro e grave de novo.

**Escreva um `BUG.md`** ao lado do roteiro, para quem vai receber:

```markdown
# <título curto do bug>

- **O que acontece:** uma ou duas frases, sem jargão.
- **Impacto:** quem é afetado e o que pode dar errado.
- **Como reproduzir:** os passos (o roteiro faz o mesmo: `roteiro.json`).
- **Vídeo:** `video/video.webm` (N s); legendas em `video/report.md`.
- **Causa provável:** arquivo:linha, se já souber.
- **O que não foi verificado:** o que ficou de fora.
```

**Cuidado com o vídeo.** Ele mostra dado de paciente (nome, CPF, telefone, dado
clínico), que é dado sensível. Fica em `.ai-workbench/` ou
`temporary-screenshots/` (ambos fora do git). Diga ao usuário onde está e deixe
com ele decidir para quem mandar; nunca anexe em PR, issue ou mensagem por
conta própria. Para mostrar para fora, prefira gravar com pacientes de
demonstração do seeder.

## 6. No harness (`.ai-workbench`)

- **Smoke test de tela** (Definição de Pronto): o `flow.mjs` **sem** vídeo, com
  `--out .ai-workbench/<feature>/evidence/<tarefa>/frontend/<fluxo> --overwrite`,
  é a evidência de cada fluxo: `report.md` mais os prints. Rode também o caso de
  outra clínica. Cite no `SUMMARY.md` o resultado e os achados de cada
  `report.md`.
- **`revisao-adversaria`**: um achado confirmado como `REAL-FORA-DO-ESCOPO`, ou
  um Crítico/Major que vai para o usuário decidir, e que dá para mostrar no
  navegador → vídeo de bug (seção 5) e o caminho do `BUG.md` na entrada do
  `DEFERRED.md` ou no relato ao usuário.
- **Pedido do usuário** ("grava um vídeo desse bug"): seção 5 direto.

## 7. Cuidados

- **Nada de senha no roteiro.** O login é automático por
  `tools/screenshot/credentials.json` (fora do git) ou `FISIO_LOGIN`/`FISIO_SENHA`.
  Se o fluxo precisar de outra senha, use `"secret": true` e não guarde o
  roteiro com ela.
- **O roteiro grava de verdade** (sem `--read-only`). Prefira dados com prefixo
  `QA` e diga ao usuário o que ficou criado no banco local.
- **Limpe ao terminar:** apague `temporary-screenshots/` e `.playwright-mcp/`
  do que não for evidência.
- **Limites:** o vídeo cobre a aba principal (popups viram achado `nova aba`);
  `.mov`/`.mp4` no `frames.mjs` precisam do Google Chrome instalado (abre
  headless, sem janela); sem áudio; o OAuth do Google sai do ambiente local e
  não é gravável.

## Se der erro

| Sintoma | Causa provável |
|---|---|
| `Não consegui abrir ...` | ambiente fora do ar, porta errada, ou redirecionou para fora do ambiente local |
| `O login (clinic) não saiu da tela de login` | `credentials.json` ou `FISIO_LOGIN`/`FISIO_SENHA` errados, usuário inativo ou excluído, banco sem seeder |
| `Caiu no login (...) sem credencial` | falta o guard `clinic` ou `admin` no `credentials.json` |
| `Recusado: ... não é ambiente local` | URL de produção/homologação no roteiro ou no `--base` |
| `A pasta ... já tem arquivos` | falta `--overwrite` (de propósito: não apaga evidência sem pedir) |
| Timeout em `click` | seletor não casa ou elemento coberto; veja o print `falhou-` |
| Tela sem a sua mudança | worktree com front compilado velho: `fisio-app build` |
| Quadro encolhido no vídeo | print de página inteira com vídeo ligado (o `flow.mjs` já evita) |
| `Playwright não encontrado` | `cd tools/screenshot && npm install` |
