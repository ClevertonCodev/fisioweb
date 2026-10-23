# Pacote de contexto (paridade Cursor) e manifest de skills

**Tipo:** Tarefa
**Plano:** `../plans/agy-task-harness.md`
**Issue:** ainda não criada

## Descrição

O `agy` não carrega `.cursor/rules` sozinho. Esta fatia monta o pacote de contexto versionado: núcleo das regras do fisioweb, manifest que mapeia tags de tarefa para skills do projeto, e script que gera o arquivo usado nos jobs.

## O que construir

Arquivo `.agy/skills-manifest.json` no repositório mapeando tags (ex.: `backend`, `frontend`, `security`, `testing`) para skills em `.cursor/skills/`. Conteúdo estável `docs/ai-harness/agy-context-core.md` (ou gerado uma vez) com princípios always-on: multi-tenant `clinic_id`, monólito modular, camadas frontend, `apiClient`, forms RHF+Zod. Script `bin/agy-context-pack` que recebe caminho da tarefa (ou texto), lê `AGENTS.md` e skills do manifest, e grava `agy-context.md` em diretório de evidence informado. Teste shell leve que o pacote gerado menciona `clinic_id` e `apiClient`.

## Critérios de Aceite

- [x] `.agy/skills-manifest.json` commitado e válido JSON
- [x] `bin/agy-context-pack` gera `agy-context.md` com `AGENTS.md` e pelo menos uma skill anexada conforme tags
- [x] Pacote gerado inclui menção explícita a isolamento por `clinic_id` e proibição de `fetch` direto no frontend
- [x] Teste em `tests/bin/` (ou script documentado) falha se o núcleo de paridade for removido
- [x] Definição de Pronto cumprida para tooling (teste shell rodando; evidence opcional com amostra do arquivo gerado)

## Depende de

- `001-agy-task-doctor-e-docs` (doctor e docs como referência de paths).

## Notas de Implementação

- **Branch:** `feat/agy-task-harness`
- **Exemplo no código:** `.cursor/rules/ai-harness.mdc`, `AGENTS.md`
- **Skills:** `security`, `frontend-ddd`, `architecture-paradigm-modular-monolith` (conteúdo fonte do manifest)

## Como testar na mão

Rodar `bin/agy-context-pack` apontando para esta tarefa `002`; abrir `agy-context.md` gerado e confirmar regras do fisioweb presentes.
