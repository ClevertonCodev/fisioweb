---
trigger: always_on
description: Onde ficam skills, subagentes e regras do fisioweb no Antigravity
---

# Fisioweb no Antigravity

O `AGENTS.md` da raiz vale aqui inteiro (stack, comandos, princípios, ciclo de
trabalho e Definição de Pronto). Ele foi escrito para o Cursor; no Antigravity,
traduza os caminhos assim:

| Onde o texto diz | No Antigravity |
|---|---|
| `.cursor/skills/<nome>/` ou `.claude/skills/<nome>/` | `.agents/skills/<nome>/` (mesmo conteúdo; use `/<nome>` ou ative pela descrição) |
| `.cursor/agents/` ou `.claude/agents/` | `.agents/agents/` — subagentes `revisor-adversario` e `verificador-de-achados` |
| `.cursor/rules/` | `.agents/rules/` |

**Skills:** as três árvores (`.claude/skills/`, `.cursor/skills/`,
`.agents/skills/`) são canônicas, pastas reais, sem symlink. Ao criar ou
alterar uma skill, faça a mesma mudança nas três e rode
`bash bin/verificar-skills.sh`.

**Leia o `SKILL.md` relevante antes de implementar** (mapa no `AGENTS.md`).
Quando houver `references/`, carregue só o arquivo necessário.

**Revisão adversária:** a skill `revisao-adversaria` chama os dois subagentes
de `.agents/agents/`, cada um numa conversa limpa (não passe o histórico desta).
Revisão feita na mesma conversa de quem escreveu o código não conta.

**Git:** não rode `git commit` nem `git push` sem o usuário pedir. Nunca leia
nem commite `.env` ou segredos, e não ponha dado real de paciente em prompt,
log ou evidência.

Responda ao usuário em português do Brasil.
