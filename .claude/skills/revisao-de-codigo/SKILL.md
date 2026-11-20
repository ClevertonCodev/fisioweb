---
name: revisao-de-codigo
description: Revisão experimental de um conjunto de mudanças (branch, PR, commits ou working tree) por lentes independentes (correção, design, segurança, testes e intenção) em subagentes paralelos, com verificação de cada achado antes de reportar e um veredito. Fora do ciclo do harness; só roda quando o usuário chamar.
disable-model-invocation: true
---

# Revisão de código por lentes

Origem: `revisao-de-codigo` do pacote "50 skills de IA" (Alura), com poucas adaptações ao fisioweb. Responda em português.

**Experimental, fora do ciclo do harness.** Não substitui a `revisao-adversaria` (portão da Definição de Pronto) nem o `bin/code-review` (uma vez por feature) e não conta para a Definição de Pronto. Não grave nada em `.ai-workbench/` e não edite código: o resultado é só o relatório na conversa.

Revisa o diff entre o que mudou e uma **base**. Em vez de uma leitura única, o trabalho é dividido em **lentes independentes** que rodam em **subagentes paralelos** (contextos separados não se contaminam). Cada achado passa por uma **verificação adversária** antes de entrar no relatório, e o resultado sai **ordenado por gravidade**, não por lente.

Três princípios:

- **Ordene por gravidade, não por revisor.** O autor quer uma lista do que corrigir, não cinco relatórios para costurar.
- **Verifique antes de reportar.** Um achado falso custa caro: manda o autor caçar um problema que não existe.
- **Dê um veredito.** Uma revisão que não diz "pode seguir" ou "não faça merge" devolve a decisão ao autor.

## Quando usar

- Revisar uma **branch**, um **PR**, **commits** específicos ou mudanças **não commitadas**.
- Pedidos como "revise desde a `main`", "faça um code review dessas mudanças", "o que tem de errado aqui?".

## Quando não usar

- Auditoria de segurança do código inteiro: use a `security-audit`. Esta skill revisa um diff.
- Gerar ou refatorar código: ela avalia mudanças que já existem.
- Sem diff, não há o que revisar.

## Processo

### 1. Delimite o que revisar

A base pode ser uma branch, tag, commit, `main`, `HEAD~3`. Se o usuário não disser, escolha e **avise qual escolheu**:

- working tree sujo → o que está pendente: `git diff HEAD`;
- working tree limpo → a branch atual contra a `main`: `git diff main...HEAD`.

Valide **uma vez** antes de abrir subagentes:

- `git rev-parse <base>`: se falhar, pare com uma mensagem clara.
- `git diff --stat <base>...HEAD` e `git log <base>..HEAD --oneline`.
- **Diff vazio, pare.**

### 2. Reúna o contexto

Colete uma vez e repasse a todas as lentes:

- **Intenção:** o que a mudança tenta fazer. Fontes, nesta ordem: a tarefa e o plano em `.ai-workbench/<feature>/` (`tasks/`, `plans/`, `decisoes.md`), a descrição do PR, as mensagens de commit. Se nada disso existir, pergunte ao usuário em uma linha.
- **Convenções:** os "Princípios não-negociáveis" e o "Code Style" do `AGENTS.md`, e a seção "Regras do fisioweb" de `docs/ai-harness/DEFINITION_OF_DONE.md`. **Deixe passar o que a tooling já garante**: Pint (`pint.json`), ESLint, Prettier, `tsc` e a suíte `tests/Architecture/` (fronteira entre módulos, acesso por guard da clínica, nomes de módulo).
- **Raio de impacto:** leia o código **em volta** das linhas alteradas. Um "null não tratado" pode já estar tratado no chamador.

### 3. Revise por lentes, em paralelo

Abra os subagentes **numa única mensagem**, um por lente (no Claude Code, ferramenta Agent com `subagent_type: "general-purpose"`). Use só as lentes que fazem sentido para o diff:

- **Correção:** bug de lógica, exceção não tratada, caso de borda, off-by-one, condição de corrida, invariante quebrada, vazamento de recurso. A lente de maior valor.
- **Design e clareza:** nome que não diz o que a coisa faz, lógica duplicada dentro da mudança, abstração para uma necessidade que o diff não tem, função fazendo coisas sem relação, código morto. São juízos, não regras duras.
- **Segurança:** entrada não confiável chegando a um ponto sensível (injeção, path traversal), segredo no código, autorização ausente. Neste projeto, principalmente: query sem filtro por `clinic_id`, model carregado por id sem Policy que compare `clinic_id`, `clinic_id`/`clinic_user_id`/`patient_id` vindo da requisição sem validar a posse, rota fora de `auth:admin`, `auth:clinic` ou `auth:patient`, papel (`admin`, `physiotherapist`, `secretary`) decidido só no front (`permissions.ts`, `RequireClinicAdmin`) sem o endpoint protegido, paciente vendo dado de outro paciente, dado do paciente (LGPD) em log ou resposta que não precisa dele, erro vazando detalhe interno.
- **Testes e contrato:** o comportamento novo tem teste que **afirma** algo? Endpoint da clínica tem teste de outra clínica e do papel sem permissão? Mudança no formato da resposta atualizou o mapeamento e os tipos do front (`infrastructure/` e `domain/`)?
- **Intenção:** o diff faz o que a intenção pediu, sem faltar nada e sem sobrar nada (scope creep)? Pule se não houver intenção.

**Pedido de cada lente** (troque `[LENTE]` e `[O QUE PROCURAR]`):

> Você revisa **só a lente [LENTE]** das mudanças neste repositório. Não edite nenhum arquivo. Rode `git diff <base>...HEAD` e leia os arquivos afetados para ter contexto (não só as linhas alteradas). Intenção da mudança: `[intenção]`. Convenções: `AGENTS.md` e a seção "Regras do fisioweb" de `docs/ai-harness/DEFINITION_OF_DONE.md`.
> Reporte **só** achados de [LENTE]: [O QUE PROCURAR]. Para cada achado: `arquivo:linha`, gravidade (`blocker` | `ajustar` | `nit`), o que está errado em uma frase, o trecho citado e a correção sugerida. **Ignore o que Pint, ESLint, Prettier, tsc e a suíte Architecture já pegam.** No máximo os ~7 achados mais reais. Se não houver nada, responda "nada a apontar". Responda em português.

### 4. Verifique antes de reportar

Cada achado candidato passa por um cético, também em paralelo (um subagente por achado, ou um para um lote pequeno):

> Tente **refutar** este achado: `[achado + trecho]`. Ele é real, ou o código em volta ou o chamador já trata o caso? É coisa que a tooling pega? A "duplicação" é mesmo a mesma lógica? Responda **confirmado** (confiança alta ou média) ou **refutado** (com o motivo). Na dúvida, refute. Exceção: achado de isolamento entre clínicas, guard, papel ou dado de paciente só é refutado com prova (um comando ou a linha que trata o caso); sem prova, fica confirmado. Não edite nenhum arquivo.

Descarte o que não for confirmado.

### 5. Reporte por gravidade, com veredito

Junte **só os achados confirmados**, ordenados por gravidade:

- 🔴 **Blocker:** comportamento errado, perda de dado, brecha de segurança ou quebra num caminho realista. O merge espera.
- 🟡 **Ajustar:** defeito real ou problema claro de design que não quebra produção, mas deve ser corrigido.
- 🟢 **Nit:** menor, estético ou preferência.

Cada achado: **`arquivo:linha`**, o que está errado, por que importa, a correção sugerida e a confiança.

Feche com a contagem e o **veredito**:

- **Pedir mudanças:** algum 🔴, ou vários 🟡.
- **Aprovar com ressalvas:** nenhum 🔴, alguns 🟡 ou 🟢.
- **Aprovar:** nenhum 🔴 e nada relevante a ajustar.

## Formato do relatório

```markdown
# Code review · <base>...HEAD (<n> commits, <n> arquivos)

Lentes: correção, design, segurança, testes, intenção · candidatos: <n> · confirmados: <n>

## 🔴 Blocker (<n>)
- **`modules/Patient/app/Repositories/PatientRepository.php:42`**: `find()` busca por id sem filtrar por `clinic_id`, então a clínica A lê paciente da clínica B. → filtre pela clínica do usuário autenticado e cubra com teste de outra clínica. *(confiança alta)*

## 🟡 Ajustar (<n>)
- ...

## 🟢 Nit (<n>)
- ...

---
**Resumo:** 1 blocker · 0 a ajustar · 0 nit.
**Veredito: pedir mudanças.** O isolamento entre clínicas precisa sair antes do merge.
```

Mostre também quantos candidatos foram refutados na verificação: é o dado que diz se a skill está gerando ruído. Se nenhuma lente achou nada confirmado, diga isso e dê o veredito **Aprovar**.

## Por que lentes separadas e verificação

- **Lentes não se contaminam.** Quem caça falha de segurança não se distrai com nome de variável, e quem caça duplicação não inventa brecha.
- **Gravidade, não autor.** A skill entrega uma lista única, ordenada pelo que dói.
- **Verificar é o diferencial.** O passo de refutação separa revisão útil de lista de palpites.
