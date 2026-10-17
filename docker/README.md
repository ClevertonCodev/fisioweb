# Ambiente local com Docker

Uma pasta por tarefa, um ambiente por pasta. Cada pasta de trabalho (o checkout
principal ou um `git worktree`) sobe o próprio PHP, Postgres e worker da fila,
com banco, rede e porta só dela. Dá para ter várias tarefas de pé ao mesmo
tempo, cada uma com um agente, abertas lado a lado no navegador, sem uma mexer
no banco da outra.

## Primeira vez na máquina

1. Docker Desktop ligado.
2. O `.env` do checkout principal pronto (o de sempre, do `cp .env.example .env`):
   todo ambiente é montado a partir dele.
3. `bin/fisio-app install`: cria o comando `fisio-app` em `~/.local/bin`, que
   funciona também em branches que ainda não têm este script. Com ele instalado,
   o `bin/fisio-app` de qualquer worktree só repassa para ele: uma versão só manda
   em todos os ambientes. O comando aponta sempre para o `bin/fisio-app` do
   checkout principal, então esse checkout precisa estar numa branch que tenha o
   script.

O nome não é `container-app` porque esse comando já é o do Paytour.

A imagem do PHP é construída na primeira subida (uns 2 minutos) e reaproveitada.

## Tarefa nova, do começo ao fim

```bash
fisio-app new agenda-semanal              # pasta, branch, banco, front, editor e navegador abertos: é só codar
fisio-app new agenda-semanal bugfix/outra # ou com outra branch (existente, local ou no GitHub, ou nova)

fisio-app url                             # endereços desta pasta
fisio-app list                            # todos os ambientes e seus endereços

fisio-app remove agenda-semanal           # de qualquer pasta: apaga o ambiente e a worktree; a branch fica
fisio-app remove agenda-semanal --force   # idem, mesmo com mudança não commitada (ela se perde)
```

Se a pasta já existe, o `new` só sobe o ambiente dela e abre. Com `/` no nome,
ele já é a branch (`new bugfix/x` usa a branch `bugfix/x`); sem `/`, a branch é
`feat/<nome>`.

O `new`, em uns 2 minutos:

1. cria a worktree `../fisioweb-agenda-semanal` com a branch `feat/agenda-semanal`
   (a partir da `origin/main`, sem seguir a main);
2. copia `vendor/`, `node_modules/`, `public/build/`, `.vscode`, `.idea` e o
   `.claude/settings.local.json` do checkout principal (clone do APFS: instantâneo
   e sem ocupar espaço);
3. escreve as instruções da pasta para o agente: `CLAUDE.local.md` (Claude Code)
   e `.cursor/rules/ambiente-docker.mdc` (Cursor);
4. sobe PHP, Postgres e a fila e prepara o banco (`banco_inicial`, abaixo),
   enquanto compila o front desta branch no Mac;
5. abre o navegador e a pasta no `editor` da configuração (sem ele, o terminal
   do sistema).

Para trocar o editor só uma vez: `FISIO_APP_EDITOR=cursor fisio-app new ...`.

Nada do que o script cria aparece no `git status`, nem numa branch antiga:
`CLAUDE.local.md`, `AMBIENTE.md`, `AMBIENTES.md`, a regra do Cursor e a sua
configuração entram no `.git/info/exclude` (vale para todas as worktrees).

O `.ai-workbench/` é versionado, então cada worktree tem o seu. O que fica fora
do git nele (evidência, revisão, `DEFERRED.md`) só existe na worktree: o `remove`
copia esses arquivos para o checkout principal antes de apagar a pasta.

## Configuração: `docker/fisio-app.json`

O script lê só o `docker/fisio-app.json`, que é seu e fica fora do git. O
`docker/fisio-app.example.json` é o modelo comentado (nenhum script o lê):
copie e edite.

```bash
cp docker/fisio-app.example.json docker/fisio-app.json
```

Os comentários (linhas que começam com `//`) podem ficar no seu arquivo: o
editor marca como erro de JSON, mas o `fisio-app` os ignora. Se o arquivo estiver
quebrado, ele avisa e usa os padrões. Sem o arquivo, valem os padrões:

| Campo | Para que serve | Padrão |
|---|---|---|
| `abrir` | página que o `new` e o `fisio-app open` abrem; `{porta}` vira a porta da tarefa | `http://localhost:{porta}/clinica/login` |
| `editor` | o que o `new` abre na pasta: `cursor`, `code`, nome de app do Mac (`"Visual Studio Code"`), `terminal` (Terminal com o `claude` rodando), `tmux` (o `claude` numa janela ou sessão do tmux) ou `nenhum` | `nenhum`: o terminal do sistema |
| `banco_inicial` | com o que o banco de uma tarefa nova começa: `seed` (migrations + `DatabaseSeeder`), `copiar` (cópia do banco do checkout principal), `vazio` (só migrations) ou o caminho de um `.sql`/`.sql.gz` | `seed` |
| `manter_env` | chaves que passam com o valor real do seu `.env` mesmo que o ambiente as desligue (`MAIL_MAILER`, `WHATSAPP_ENABLED`, `TWILIO_*`), separadas por vírgula | nenhuma |

## Onde anotar portas e banco

- `AMBIENTE.md` na pasta da tarefa: endereços, porta do app e do Postgres,
  usuário, senha e URL de conexão;
- `AMBIENTES.md` no checkout principal: uma linha por tarefa, no ar ou parada.

As portas só mudam quando os containers são recriados (`down` + `up`, ou um `up`
depois de mudar o compose) ou o Docker reinicia. Na dúvida, `fisio-app url` (uma
tarefa) ou `fisio-app list` (todas) leem de novo e reescrevem os arquivos.

## Comandos (de dentro da pasta)

```bash
fisio-app up                          # sobe e roda as migrations (o banco inicial só entra na criação)
fisio-app url | open                  # endereços e portas | abre a página "abrir" da configuração
fisio-app test --filter=PatientTest   # php artisan test dentro do container
fisio-app verificar                   # bin/verificar.sh (no Mac)
fisio-app artisan route:list          # php artisan dentro do container
fisio-app exec php -v                 # qualquer comando dentro do container
fisio-app migrate                     # migrations no banco desta pasta
fisio-app watch                       # desenvolvimento: Vite ao vivo; Ctrl+C para
fisio-app build                       # front compilado (npm run build)
fisio-app psql                        # cliente do Postgres; db: endereço para abrir no TablePlus/DBeaver
fisio-app db-copiar                   # APAGA o banco desta pasta e copia o do checkout principal
fisio-app db-import dump.sql.gz       # APAGA o banco desta pasta e importa o arquivo
fisio-app reset                       # APAGA o banco desta pasta e roda migrate:fresh --seed
fisio-app status | logs | stop
fisio-app logs queue                  # o que o worker da fila está processando
fisio-app down                        # derruba e APAGA o banco desta pasta
```

## Front

O front roda no Mac, com o `node_modules` da pasta (se o `package-lock.json` da
branch for outro, o `fisio-app` roda `npm ci` antes).

- Fora do `watch`, o Laravel serve o `public/build` desta pasta: depois de mudar
  o front, `fisio-app build`.
- `fisio-app watch` sobe o Vite numa porta livre só desta tarefa (5173, 5174...).
  O Vite escreve o `public/hot` da pasta, o Laravel do container lê esse arquivo
  e o navegador carrega o front direto do Vite, com recarga ao vivo. No Ctrl+C o
  `public/hot` some e a página volta para o front compilado.

## Como funciona

- O nome do projeto no Docker Compose vem do nome da pasta:
  `fisioweb-agenda-semanal` tem containers, rede e volume próprios. O checkout
  principal é `fisioweb-principal`, porque `fisioweb` já é o projeto do
  `compose_pgsql.yaml` (o Postgres de quem roda o Laravel direto no Mac).
- Nenhuma porta é fixa: o Docker escolhe uma livre quando o container é criado.
  Pergunte ao `fisio-app url`.
- Um banco por ambiente, `fisioweb`. O PHPUnit usa SQLite em memória (o
  `phpunit.xml` força), então testar não apaga o que você montou no navegador.
- O `.env` do container é gerado a cada `up` a partir do `.env` do checkout
  principal, com o banco, a fila e a URL deste ambiente. `APP_KEY`, `JWT_SECRET`,
  R2 e Google passam como estão. O que fala com gente de verdade é desligado:
  `WHATSAPP_ENABLED=false` com as credenciais do Twilio vazias, e e-mail no log
  (`MAIL_MAILER=log`). Exceções só pelo `manter_env`.
- Numa worktree, o `.env` da pasta no Mac é o mesmo do container, mas com o
  Postgres pela porta que o Docker deu. Assim `php artisan`, `tinker` e o PHPUnit
  no Mac também usam o banco desta pasta. Com o ambiente parado, ele aponta para
  um host que não existe, para não cair no banco de outro ambiente. O `.env` do
  checkout principal nunca é tocado.
- Valores do `.env` que começam pela `APP_URL` do principal passam a usar a URL
  deste ambiente (o `GOOGLE_REDIRECT_URI`, por exemplo). O Google só aceita
  redirects cadastrados, então o login do Google Agenda só funciona no ambiente
  cuja URL estiver cadastrada no console do Google.
- Cada ambiente tem o próprio cookie de sessão (`SESSION_COOKIE`), porque cookies
  não separam por porta. O JWT da SPA fica no `localStorage`, que já é separado
  por porta.
- Fila como em produção (`QUEUE_CONNECTION=database`): o container `queue` roda
  `php artisan queue:work` e é religado sozinho.
- Numa worktree, o `.git` é um arquivo que aponta para o `.git` do checkout
  principal pelo caminho do Mac: o compose monta esse `.git` no mesmo caminho
  dentro do container (só leitura), para o `git ls-files` dos testes de
  arquitetura funcionar.
- A infraestrutura (este compose e o `dev.Dockerfile`) vem da pasta onde está o
  script, e o código, da pasta onde o comando roda.

## Imagem

`dev.Dockerfile`: imagem local do `bin/fisio-app` (PHP 8.5 com pgsql, gd, intl,
zip, bcmath, exif e pcntl), construída na máquina (nativa no Mac com chip
Apple). Para reconstruir depois de mudar o Dockerfile:
`docker build -f docker/dev.Dockerfile -t fisioweb-dev-local:php8.5 docker`.
