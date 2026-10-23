# Núcleo de contexto fisioweb (jobs agy)

Regras always-on para o Antigravity ao trabalhar neste repositório. Equivalente ao que o Cursor carrega via `AGENTS.md` e `.cursor/rules/`.

## Isolamento multi-tenant

- Todo recurso da clínica é filtrado por **`clinic_id`**. Uma clínica nunca vê nem altera dados de outra.
- Paciente (guard `patient`) só acessa os próprios dados.
- Model carregado por id passa por **Policy** que valida posse. Não confiar em `clinic_id` vindo do body da requisição.

## Backend

- Código de negócio em **`modules/<Modulo>/`**, não em `app/Modules`.
- Não importar Model/Repository interno de outro módulo para regra de negócio; usar contrato público ou evento.
- Controller fino → Service/UseCase → Repository → Model. Validação em FormRequest; autorização em Policy + guard (`admin` vs `clinic`).

## Frontend

- Camadas: `domain/` (puro) → `application/` → `infrastructure/` → `pages/`. Loader chama `application/`; página **não** importa `apiClient`.
- HTTP **somente** via **`apiClient`** — **proibido `fetch` direto** no SPA.
- Form com 2+ campos: **React Hook Form + Zod**.
- `domain/` em camelCase; sem `ApiXxx`, sem `_at` em entidades de negócio.

## Git e segurança operacional

- Não executar `git commit`, `git push` nem ler/commitar `.env` ou segredos.
- Não incluir dado real de paciente em prompts ou logs.

## Verificação

- Antes de declarar pronto: testes do escopo (`composer run test`, `npm run test`) e `bash bin/verificar.sh` quando aplicável.
