# Harness agy-task (Antigravity + Cursor)

Data: 2026-10-22
Fonte: conversa (refinar) — integração Antigravity no fisioweb sem proxy/túnel; command `/agy-task`.

## Problema

Você paga o Antigravity (Gemini / Claude via `agy`), mas o app e fluxos pesados atrapalham o dia a dia. No fisioweb, **Cursor** e **Claude Code** já “sabem” do projeto: `AGENTS.md`, regras em `.cursor/rules/*.mdc`, 32 skills em `.cursor/skills/`, ciclo ai-harness e command `/code-review`. O `agy` roda no mesmo repositório, porém **não herda** automaticamente esse pacote de contexto — se mandarmos só um prompt solto, ele não se comporta como o Cursor.

Você quer um caminho explícito (`/agy-task`) em que, ao escolher Antigravity, **o ciclo de implementação inteiro** acontece no `agy` (com edição nos arquivos), com modelos **Claude Opus 5.5 (High)** ou **Gemini 4 Argon (High)**, e o **Cursor** só confere se está certo: frontend compila; `/code-review` com achados críticos, altos ou médios devolve trabalho ao Antigravity (até 3 voltas).

## Solução

Um **harness de projeto** versionado no repo:

1. **Paridade de contexto** — antes de cada job, montar um pacote com as mesmas instruções que o agente do Cursor recebe (não depender de pasta `.agents` genérica nem de catálogo externo de skills).
2. **`bin/agy-task`** — iniciar tarefa, escolher modelo, rodar `agy -p` em modo que edita o código; jobs com log e metadados em `.ai-workbench/.../evidence/`.
3. **Commands Cursor** — `/agy-task` (disparo) e `/agy-verify` (portão: build FE + review estruturado).
4. **Loop** — se o review tiver crítico/alto/médio, reenviar correção ao `agy` até 3 vezes; depois parar e avisar você.
5. **`bin/agy-task doctor`** — validar máquina (`agy`, login, modelos, trust do workspace) antes de prometer “igual ao Cursor”.

Sem túnel, sem override de Base URL no Cursor, sem `npx antigravity-awesome-skills` no repo.

## Histórias de Usuário

1. Como desenvolvedor do fisioweb, quero rodar `/agy-task` só quando eu decidir, para o chat normal continuar no Cursor sem perguntar Antigravity a cada implementação.
2. Como desenvolvedor, quero escolher no início **Opus 5.5 High** ou **Gemini 4 Argon High**, para alinhar com a assinatura que já pago.
3. Como desenvolvedor, quero que o Antigravity implemente a tarefa inteira no repo (criar/editar arquivos), para não ficar copiando diff manualmente.
4. Como desenvolvedor, quero que o `agy` receba **AGENTS.md**, resumo das regras always-on e o texto da tarefa do `.ai-workbench`, para ele respeitar multi-tenant, módulos e camadas frontend como o Cursor.
5. Como desenvolvedor, quero que skills relevantes do projeto (ex.: `security`, `frontend-ddd`, `architecture-paradigm-modular-monolith`) entrem no job automaticamente conforme a tarefa, para não esquecer Policy e `clinic_id`.
6. Como desenvolvedor, quero logs do job (prompt hash, modelo, timestamps, stdout) em pasta de evidência gitignored, para auditar o que o Antigravity fez sem commitar dado sensível.
7. Como desenvolvedor, quero `bin/agy-task status` e `bin/agy-task result`, para acompanhar job em background como no fluxo Codex plugin (sem túnel).
8. Como desenvolvedor, quero `/agy-verify` rodar **build do frontend** (`npm run build` ou alvo acordado) e falhar cedo se o TypeScript/Vite quebrar.
9. Como desenvolvedor, quero `/agy-verify` acionar o mesmo espírito do `/code-review` com **saída estruturada** (severidades), para o script saber o que reenviar ao `agy`.
10. Como desenvolvedor, quero até **3 voltas** automáticas Antigravity → verify, para correções iterativas sem loop infinito.
11. Como desenvolvedor, quero que, após 3 falhas, o harness pare e me mostre o último review e o diff, para eu assumir no Cursor.
12. Como desenvolvedor, quero `bin/agy-task doctor` dizendo claramente o que falta (CLI, login, modelos, trust), para não perder tempo achando que “não funciona”.
13. Como desenvolvedor, quero uma skill `agy-harness` no `.cursor/skills/` espelhada em `.claude/skills/`, para o agente Cursor saber quando usar `/agy-task` vs implementação local.
14. Como mantenedor, quero o harness documentado em `docs/ai-harness/agy-task.md`, para onboarding sem reler esta conversa.
15. Como mantenedor, quero testes shell leves do empacotador de contexto (arquivos existem, manifest válido), para não quebrar paridade em refactor.
16. Como desenvolvedor, quero poder passar o caminho de uma tarefa em `.ai-workbench/<feature>/tasks/*.md`, para ligar o harness ao ciclo existente.
17. Como desenvolvedor, quero que o Antigravity **não** rode `git commit` nem `git push`, alinhado às regras globais e ao `AGENTS.md`.
18. Como desenvolvedor, quero cancelar um job em andamento (`agy-task cancel`), para não deixar processo órfão editando o repo.
19. Como desenvolvedor, quero que dados de paciente não entrem nos prompts por padrão (só paths e diff), para LGPD na evidência local.
20. Como desenvolvedor, quero continuar usando revisão adversária do repo quando o ciclo foi **no Cursor**; quando o ciclo foi `/agy-task`, o portão é verify + code-review estruturado, não duplicar subagentes sem necessidade.

## Decisões de Implementação

### Paridade com Cursor / Claude Code (o ponto que você questionou)

O Cursor aplica `.cursor/rules/*.mdc` e skills sem você pedir. O `agy` **não** faz isso sozinho neste repo hoje. A paridade **não** é “criar `.agents/skills` e pronto” (isso é layout do ecossistema Antigravity/instaladores genéricos; no seu Mac `~/.gemini/antigravity-cli/skills` nem existe e o CLI já funciona).

A paridade **é** um **pacote de contexto versionado**:

| Fonte no fisioweb | Como o harness entrega ao `agy` |
|-------------------|----------------------------------|
| `AGENTS.md` / `CLAUDE.md` | Incluídos no início do prompt do job (ou arquivo anexo referenciado com `@` se o CLI suportar leitura de paths no workspace) |
| Regras always-on (`ai-harness`, `fisioweb-skills`, princípios multi-tenant) | `docs/ai-harness/agy-context-core.md` **gerado ou mantido** a partir das rules — uma vez por release do harness, não 1.340 skills genéricas |
| Tarefa | Corpo do `tasks/NNN-*.md` ou argumento do command |
| Skills por escopo | Manifest `.agy/skills-manifest.json` no repo listando quais `SKILL.md` do projeto anexar quando a tarefa menciona backend, frontend, security, etc. |
| Command review | Template de saída JSON/markdown em `.cursor/commands/agy-verify.md` espelhando `code-review.md` |

Artefatos novos no git (proposta):

- `bin/agy-task` — CLI principal (subcomandos: `doctor`, `start`, `verify`, `fix-loop`, `status`, `result`, `cancel`).
- `bin/agy-context-pack` — monta `evidence/.../agy-context.md` a partir do manifest + tarefa.
- `.agy/skills-manifest.json` — mapa tags → paths em `.cursor/skills/`.
- `docs/ai-harness/agy-task.md` — manual do fluxo.
- `.cursor/commands/agy-task.md` e `agy-verify.md`.
- `.cursor/skills/agy-harness/SKILL.md` (+ espelho `.claude/skills/`).

**Não** commitar: logs completos com PII, tokens, pasta `evidence/` dos jobs.

Opcional fase 2 (só se a paridade por prompt não bastar em teste real): `agy plugin import` ou link simbólico controlado de **subconjunto** das skills do projeto para `~/.gemini/antigravity-cli/skills` via script `doctor --link-skills` (opt-in, documentado). Default continua **prompt pack** no repo.

### Execução `agy`

- Modelos fixos no harness: `claude-opus-5-5-high`, `gemini-4-argon-high` (confirmados com `agy models` em 2026-10-22).
- Implementação: `agy -p` com `--mode accept-edits` e `--dangerously-skip-permissions` **somente** dentro de `agy-task start` (nunca no verify).
- Review read-only no verify: Cursor agent segue `code-review.md`; o harness consome arquivo `review.json` ou seção parseável que o command obriga a gerar.
- Timeout configurável (default acima de 5m para tarefas grandes).
- Working directory: raiz do git (`git rev-parse --show-toplevel`).

### Portão Cursor (`agy-verify`)

1. `npm run build` (frontend compila).
2. Invocar mentalmente as regras de `code-review.md`; o command `agy-verify` exige relatório com severidades: `critical`, `high`, `medium`, `low`, `info`.
3. **Reabrir `agy`** se existir ≥1 achado em critical/high/medium, com prompt contendo só esses achados + paths, até 3 iterações.
4. `low`/`info` não disparam loop automático (podem ir para SUMMARY humano).

### Integração ai-harness

- Jobs ficam em `.ai-workbench/<feature>/evidence/agy-task-<job-id>/` quando a tarefa informar feature; senão `.ai-workbench/_agy-jobs/<job-id>/` (ambos já cobertos pelo gitignore de `evidence/` ou entrada explícita em `.gitignore` para `_agy-jobs` se necessário).
- `SUMMARY.md` por job: modelo, voltas, veredito verify, link para logs.

### Segurança

- Harness nunca envia `.env` ao prompt.
- Diff pode conter segredos acidentalmente: `doctor` avisa se arquivos sensíveis aparecem no `git diff`.
- Processo `agy` com auto-approve só roda via `bin/agy-task`, não em scripts CI.

## Fatias Verticais

1. **Doctor + documentação** — `bin/agy-task doctor`, `docs/ai-harness/agy-task.md`, critérios de “pronto para usar”.
2. **Pacote de contexto** — `.agy/skills-manifest.json`, `bin/agy-context-pack`, teste shell do manifest; amostra de `agy-context.md` em evidence de smoke.
3. **Start job** — `agy-task start` (modelo, tarefa, background, log); command `/agy-task`.
4. **Verify** — `agy-task verify` + command `/agy-verify` + formato estruturado de review.
5. **Loop de correção** — `agy-task fix-loop` (máx. 3); integração com `status`/`result`/`cancel`.
6. **Skill + alinhamento** — `agy-harness` skill, nota no `ai-harness.mdc` ou `fisioweb-skills` apontando o command (uma linha, sem duplicar DoD inteiro).

Ordem: 1 → 2 → 3 → 4 → 5 → 6.

## Testes

- **Shell:** `tests/bin/agy-context-pack_test.sh` ou PHPUnit não se aplica; usar script em `tests/bin/` executado por `bash bin/verificar.sh` só se integrarmos ao verificar (decisão na tarefa 2: pelo menos rodar manualmente na evidence do smoke).
- **Smoke manual (evidence):** job mínimo “criar arquivo marker em `storage/app/agy-smoke-.gitignore`” ou editar comentário em arquivo de teste já existente; rodar verify; documentar em `evidence/agy-task-smoke/SUMMARY.md`.
- **Paridade:** diff de checklist — o pacote de contexto deve citar `clinic_id`, `apiClient`, camadas `domain/application/infrastructure` (assert no teste shell por `grep` no `agy-context.md` gerado).
- **Loop:** simular `review.json` com um `high` e contar que `fix-loop` chama `agy` no máximo 3 vezes (mock `agy` com script fake em teste).

Comandos:

```bash
bin/agy-task doctor
bin/agy-context-pack --task .ai-workbench/009-agy-task-harness/tasks/...
npm run build
```

## Fora do Escopo

- Proxy Antigravity ↔ Cursor (OpenAI Base URL, Cloudflare tunnel, “hamster”/rat proxies).
- Instalar `antigravity-awesome-skills` no repo ou em `.cursor/skills`.
- Substituir o Cursor como IDE principal ou como default de implementação no chat.
- Perguntar Cursor vs Antigravity fora do command `/agy-task`.
- Revisão adversária automática com subagentes **dentro** do mesmo fluxo agy (portão é code-review estruturado + build).
- PHPUnit/lint backend no portão mínimo v1 (pode entrar em `agy-verify --full` depois).
- MCP servers novos para o Antigravity.
- CI rodando `agy` (só máquina do desenvolvedor com login Google).

## Notas

### “Igual ao Cursor” — expectativa honesta

- **Igual nas regras:** sim, se o pacote de contexto + manifest estiverem corretos e o `doctor` passar.
- **Igual na UX:** não — você alterna entre terminal (`agy`) e Cursor (verify); não há painel único.
- **Igual em ferramentas:** o `agy` tem conjunto próprio de tools; o harness não replica Bugbot nem subagentes Cursor, só o **portão** que você definiu.

Se após o smoke a paridade falhar (ex.: ignora `clinic_id`), a correção é **ajustar `agy-context-core.md` e o manifest**, não instalar 1.340 skills genéricas.

### Referência de modelo mental

Inspirado no [codex-plugin-cc](https://github.com/openai/codex-plugin-cc) (jobs locais, status/result), mas sem app server Codex e **com** camada extra de contexto do fisioweb que o Codex plugin não precisava neste repo.

### Ambiente já validado (2026-10-22)

- `agy` 1.1.28 em `/opt/homebrew/bin/agy`
- `agy -p` e modelos Opus/Argon High disponíveis
- `~/.gemini/antigravity-cli/` presente com sessão
