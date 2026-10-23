# agy-task doctor e documentação do fluxo

**Tipo:** Tarefa
**Plano:** `../plans/agy-task-harness.md`
**Issue:** ainda não criada

## Descrição

Antes de rodar jobs no Antigravity, o desenvolvedor precisa saber se a máquina está pronta (CLI, login, modelos, workspace). Esta fatia entrega o subcomando `doctor` e o manual em `docs/ai-harness/`, base para todas as outras tarefas do harness.

## O que construir

Um comando `bin/agy-task doctor` (ou estrutura inicial do `bin/agy-task` só com `doctor`) que verifica: `agy` no PATH e versão mínima; modelos `claude-opus-5-5-high` e `gemini-4-argon-high` listados; indício de sessão em `~/.gemini/antigravity-cli/`; repositório git na raiz do fisioweb; aviso se `.env` aparecer em diff pendente. Saída clara OK/FALHOU por item. Documentação `docs/ai-harness/agy-task.md` descrevendo o fluxo completo (visão geral, pré-requisitos, comandos previstos, o que não é paridade com Cursor).

## Critérios de Aceite

- [x] `bin/agy-task doctor` existe e retorna código de saída 0 quando o ambiente validado em 2026-10-22 está ok
- [x] `doctor` falha com mensagem acionável se `agy` não estiver instalado
- [x] `docs/ai-harness/agy-task.md` existe e linka o plano da feature 009
- [x] Documentação deixa explícito que não usa túnel nem override de modelo no Cursor
- [x] Definição de Pronto cumprida para escopo de tooling (`docs/ai-harness/DEFINITION_OF_DONE.md` — itens de app/clínica não se aplicam; smoke/evidence documentada se houver teste manual do doctor)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/agy-task-harness`
- **Exemplo no código:** `bin/verificar.sh`, `bin/verificar-skills.sh`
- **Skills:** nenhuma de domínio; seguir estilo dos scripts em `bin/`

## Como testar na mão

Na raiz do fisioweb, rodar `bin/agy-task doctor` com `agy` instalado e logado; conferir saída verde. Renomear temporariamente o binário ou usar PATH vazio e conferir mensagem de erro útil.
