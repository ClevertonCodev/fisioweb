Texto principal + backlog rascunho
        ↓
/speckit-specify  →  spec.md (user stories P1/P2/P3)
        ↓
/speckit-clarify  →  elimina dúvidas
        ↓
/speckit-plan     →  plan.md (arquitetura Paytour)
        ↓
/speckit-tasks    →  tasks.md (20+ tarefas organizadas em fases)
        ↓
/speckit-analyze  →  audita antes de codar
        ↓
/speckit-implement (fatia P1)  →  testes  →  merge parcial
        ↓
/speckit-implement (fatia P2)  →  ...

# Spec Kit — Comandos e Referência Rápida

Guia local dos comandos do [Spec Kit](https://github.com/github/spec-kit) no Paytour.
Integração instalada: **Cursor** (`cursor-agent`).

> Use no chat do **Cursor Agent** com `/` + hífen: `/speckit-specify` (não `speckit.specify`).

---

## Fluxo principal (ordem recomendada)

| # | Comando | Para que serve |
|---|---------|----------------|
| 1 | `/speckit-constitution` | Define ou atualiza os **princípios do projeto** (multi-tenancy, naming, arquitetura). Grava em `.specify/memory/constitution.md`. Rode uma vez ou quando mudar regras globais. |
| 2 | `/speckit-specify` | Descreve **o quê** construir e **por quê** — sem stack técnica. Gera `specs/<feature>/spec.md` com user stories e requisitos. |
| 3 | `/speckit-plan` | Cria o **plano técnico**: stack Paytour, arquivos, abordagem. Gera `specs/<feature>/plan.md`. |
| 4 | `/speckit-tasks` | Quebra o plano em **tarefas acionáveis** com paths de arquivo. Gera `specs/<feature>/tasks.md`. |
| 5 | `/speckit-implement` | **Executa** as tarefas e implementa o código (PHP, Vue, testes, etc.). |

### Exemplo mínimo

```
/speckit-specify Widget de dashboard que filtra vendas pelo operador logado

/speckit-plan

/speckit-tasks

/speckit-implement
```

---

## Comandos opcionais (qualidade)

| Comando | Para que serve | Quando usar |
|---------|----------------|-------------|
| `/speckit-clarify` | Faz perguntas estruturadas para **eliminar ambiguidades** na spec | Antes do `/speckit-plan`, se a ideia ainda estiver vaga |
| `/speckit-checklist` | Gera **checklist de qualidade** da spec (completude, clareza, consistência) | Depois do specify, antes do plan |
| `/speckit-analyze` | **Audita** se spec, plan e tasks estão alinhados (lacunas, contradições) | Depois do tasks, antes do implement |
| `/speckit-taskstoissues` | Converte a lista de tarefas em **issues do GitHub** | Quando quiser rastrear no GitHub Issues |

> **Atenção:** nenhum comando acima valida se o **código implementado** está correto. Eles auditam apenas os artefatos (spec, plan, tasks).

---

## Verificação pós-implementação

O Spec Kit **não possui** um comando dedicado (ex.: `/speckit-verify`) para auditar código contra a spec. A validação de implementação fica **fora** do fluxo padrão.

### O que cada comando valida (e o que não valida)

| Comando | Valida | Não valida |
|---------|--------|------------|
| `/speckit-checklist` | Qualidade da **spec** (clareza, completude dos requisitos) | Se o código funciona |
| `/speckit-analyze` | Alinhamento entre **spec + plan + tasks** | Código implementado |
| `/speckit-implement` | Tarefas concluídas, testes e aderência à spec **no fim do próprio fluxo** | Auditoria independente depois |

### Como verificar se a implementação está correta

**1. Validação embutida no `/speckit-implement`**

Ao concluir, o implement tenta:

- Marcar todas as tarefas do `tasks.md` como `[X]`
- Conferir se as features batem com a spec
- Rodar testes e confirmar aderência ao plano

**2. Testes automatizados (Paytour)**

```bash
vendor/bin/phpunit --filter=NomeDoTest   # PHP
bash stan.sh                             # PHPStan level 5
vendor/bin/php-cs-fixer fix --dry-run    # estilo
cd frontendV2 && npm test                # Vue 3 + Vitest
```

**3. Review manual no chat**

Peça ao agente algo como:

```
Leia specs/<feature>/spec.md e tasks.md e audite se o código
implementado cobre todos os requisitos. Liste lacunas e divergências.
```

**4. Skills de review do Cursor**

| Skill | Para que serve |
|-------|----------------|
| `/review-bugbot` | Review de bugs e regressões nas mudanças locais |
| `/review-security` | Review de segurança nas mudanças locais |

**5. Hooks pós-implement (opcional, avançado)**

É possível configurar hooks em `.specify/extensions.yml` (`hooks.after_implement`) para rodar testes ou review automaticamente após o `/speckit-implement`. Isso é extensão custom — não vem pronto no fluxo padrão.

### Fluxo recomendado com verificação

```
/speckit-specify → /speckit-plan → /speckit-tasks
/speckit-analyze          ← audita documentos ANTES de codar
/speckit-implement        ← codifica + validação parcial no fim
vendor/bin/phpunit …      ← verificação real pós-implement
(review manual ou /review-bugbot)
```

---

## Extensão (helper interno)

| Comando | Para que serve |
|---------|----------------|
| `/speckit-agent-context-update` | Atualiza o bloco de contexto do agente apontando para o `plan.md` mais recente. Extensão `agent-context` (hooks automáticos desabilitados neste projeto). |

---

## Onde ficam os arquivos

| Pasta / arquivo | Para que serve |
|-----------------|----------------|
| `.specify/memory/` | Regras permanentes (constitution, backend, design system, claude memory) |
| `.specify/templates/` | Modelos vazios que o agente preenche (spec, plan, tasks) |
| `specs/<001-feature>/spec.md` | Especificação da feature |
| `specs/<001-feature>/plan.md` | Plano técnico |
| `specs/<001-feature>/tasks.md` | Lista de tarefas |
| `.cursor/skills/speckit-*` | Skills que o Cursor executa ao digitar cada comando |
| `.cursor/rules/specify-rules.mdc` | Regras Paytour aplicadas em toda conversa |

---

## Comandos no terminal (`specify` CLI)

Requer `specify` instalado (`uv tool install specify-cli`).

### Uso diário

| Comando | Para que serve |
|---------|----------------|
| `specify version` | Mostra versão do Spec Kit instalada |
| `specify check` | Verifica se git e dependências estão ok |
| `specify self check` | Verifica se há versão nova do CLI |
| `specify self upgrade` | Atualiza o CLI |

### Integrações

| Comando | Para que serve |
|---------|----------------|
| `specify integration list` | Lista integrações (Cursor, Claude, Copilot…) e qual está instalada |
| `specify integration install claude` | Instala Spec Kit para **Claude Code** (`.claude/skills/`) |
| `specify integration upgrade cursor-agent` | Atualiza skills do Cursor após upgrade do Spec Kit |
| `specify integration switch <nome>` | Troca integração padrão |

### Workflows (automação)

| Comando | Para que serve |
|---------|----------------|
| `specify workflow list` | Lista workflows instalados |
| `specify workflow run speckit` | Roda o ciclo completo automatizado (specify → plan → tasks → implement) |

### Setup inicial (já feito neste projeto)

```bash
specify init . --integration cursor-agent --force --no-git
```

---

## Regras do Paytour (consultar durante o fluxo)

| Arquivo | Conteúdo |
|---------|----------|
| `.specify/memory/constitution.md` | Princípios inegociáveis |
| `.specify/memory/paytour-backend-rules.md` | PHP, arquitetura, testes |
| `.specify/memory/design-system-rules.md` | Tokens e componentes `Ds*` (frontendV2) |
| `.specify/memory/claude/` | Memory Claude (naming `User*`, git add, módulos) |
| `.claude/skills/php-modern/` | Detalhes PHP 8.5+ |
| `.claude/skills/vue3-typescript/` | Detalhes Vue 3 + Inertia |

---

## O que você precisa lembrar

1. **Cursor** → comandos `/speckit-*` funcionam completos
2. **Claude Code** → neste projeto **não** está com integração completa (só 1 skill auxiliar em `.claude/`)
3. **Git** → `.specify/`, `specs/` e `.cursor/` estão no `.gitignore` (teste local, sem commit)
4. **Verificação** → não existe `/speckit-verify`; use testes + review manual após o implement (ver seção acima)
