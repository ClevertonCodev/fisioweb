# Laravel Sail — guia deste projeto

O [Laravel Sail](https://laravel.com/docs/sail) sobe a aplicação PHP e serviços (aqui: **PostgreSQL**) via Docker, sem instalar PHP/Composer/Node na máquina host (ou com menos dependências locais).

## Pré-requisitos

- Docker Desktop ou Docker Engine + Compose
- WSL2: Docker pode rodar no Windows com integração WSL; o projeto fica acessível em `http://localhost` (porta padrão `APP_PORT=80`)

## Comandos básicos

| Objetivo | Comando |
|----------|---------|
| Subir os containers (foreground, logs no terminal) | `./vendor/bin/sail up` |
| Subir em segundo plano | `./vendor/bin/sail up -d` |
| Parar | `./vendor/bin/sail down` |
| Abrir shell dentro do container PHP | `./vendor/bin/sail shell` |
| Rodar Artisan | `./vendor/bin/sail artisan <comando>` |
| Composer | `./vendor/bin/sail composer <comando>` |
| NPM (Vite, build front) | `./vendor/bin/sail npm <comando>` |
| Testes PHPUnit | `./vendor/bin/sail test` (ou `sail artisan test`) |

**Atalho (opcional):** no fim do `~/.bashrc` / `~/.zshrc`:

```bash
alias sail='[ -f sail ] && sh sail || sh vendor/bin/sail'
```

Assim: `sail up -d`, `sail artisan migrate`, etc.

## URLs e portas (este `compose.yaml`)

- **Aplicação:** `http://localhost` (ou a porta em `APP_PORT` no `.env`, padrão `80`)
- **Vite (dev):** o mesmo mapeia `VITE_PORT` (padrão `5173`); o front em dev costuma ser `http://localhost:5173` quando você roda `sail npm run dev`

- **PostgreSQL no host:** `localhost:${FORWARD_DB_PORT}` (padrão `5432`) — útil para conectar DBeaver/DataGrip a partir do Windows/host.  
- **Dentro do Docker (Laravel → banco):** use o **nome do serviço** como host, não `127.0.0.1`.

## Banco de dados (`.env`)

Com Sail + `pgsql`, o Laravel dentro do container deve enxergar o Postgres assim:

- `DB_CONNECTION=pgsql`
- `DB_HOST=pgsql` ← nome do serviço no `compose.yaml` (não `mysql` nem `127.0.0.1`)
- `DB_PORT=5432`
- `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` alinhados com o que o Compose sobe (variáveis `POSTGRES_*` no `compose.yaml` vêm do `.env`)

Depois de subir: `./vendor/bin/sail artisan migrate` (e `db:seed` se precisar).

## Fluxo de trabalho típico

1. `./vendor/bin/sail up -d`
2. Primeira vez ou após pull: `sail composer install` e `sail npm install` (se ainda não fez no host)
3. `sail artisan migrate`
4. Front em desenvolvimento: `sail npm run dev` (e em outro terminal, se quiser, `sail composer run dev` conforme o `composer.json` do projeto)
5. `sail down` quando terminar

## Rebuild da imagem PHP

Só necessário se mudar extensões PHP do Sail ou versão: `./vendor/bin/sail build --no-cache` e de novo `sail up -d`.

## Onde a config fica

- `compose.yaml` — serviços `laravel.test` e `pgsql`
- `.env` — `APP_PORT`, `VITE_PORT`, `FORWARD_DB_PORT`, credenciais de DB, etc.

Documentação oficial: [Laravel Sail](https://laravel.com/docs/sail).
