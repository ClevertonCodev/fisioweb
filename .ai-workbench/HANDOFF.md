# Handoff · 2026-10-30

Passagem de uma sessão do Claude Code para a próxima. A parte 1 é o que ficou
pendente. A parte 2 é o pedido novo: as telas de Finanças. No fim está o texto
para colar na sessão nova.

---

## Parte 1 · O que ficou pendente: feature 012 (assistente de programa)

**Telas:** `/clinica/programas/novo` e `/clinica/programas/:id/editar`. É a
mesma tela, o assistente em três etapas do protótipo A, também usada para criar
e editar modelo (`?modelo=1`).

**Situação:** as 7 tarefas estão implementadas e a revisão adversária rodou 3
rodadas (14 Major corrigidos). O `bash bin/verificar.sh` passa, menos as 4
falhas que já existiam antes da feature (3 em `Architecture` e 1 em
`ExerciseLibraryPage.test.tsx`, "grade D"). **Nada foi commitado**: são uns 77
arquivos alterados na branch `feat/clinic-programa-assistente-ds`.

**Onde está tudo:** `.ai-workbench/012-clinic-programa-assistente-ds/`
(`README.md`, `decisoes.md`, `tasks/`, `review/000-feature-012/`) e o ADR
`docs/adr/025-editar-programa-nao-apaga-historico-e-troca-link-ao-trocar-paciente.md`.

### Três decisões que o usuário ainda precisa tomar

| # | Decisão | Opções |
|---|---------|--------|
| 1 | Um rascunho que já tinha paciente, salvo de novo com esse paciente, **vira ativo** (é enviado). O agente decidiu isso na revisão e falta o usuário confirmar (`decisoes.md`, sessão 2026-10-28). | Confirmar. Ou mantê-lo como rascunho e trocar o diálogo por "Salvo como rascunho", sem link. |
| 2 | A correção do Major da rodada 3 (busca sem diferenciar maiúsculas no Postgres) não foi vista por nenhum revisor. | Aceitar como está ou rodar uma 4ª revisão só nessa correção. |
| 3 | Commit da 012. | Antes de commitar, listar os arquivos. Ficam de fora `evidence/`, `review/` e o `DEFERRED.md` da feature. |

> A sessão nova deve resolver estas três **antes** de começar Finanças, porque
> Finanças precisa de uma branch nova.

---

## Parte 2 · O pedido novo: Finanças de verdade no DS v2

### O que o usuário pediu

> Fazer as três telas de Finanças (**Lançamentos**, **Relatório** e
> **Configurações**) com tudo o que existe no protótipo, todas as
> funcionalidades: nova entrada, nova saída, tudo o que está dentro do
> protótipo. O que o protótipo **não** tem, ou não deixa claro, o Claude
> **pergunta** ao usuário, para os dois descobrirem juntos o que fazer.

### O protótipo escolhido

- **Código:** `resources/js/pages/clinic/finances/finance-prototype/`
  - `FinancePrototype.tsx`: a casca, com as abas e o resumo do mês.
  - `VariantC.tsx`: Lançamentos no "Calendário de caixa" (variante C, a escolhida).
  - `TransactionModal.tsx`: nova entrada, nova saída e editar lançamento.
  - `modals.tsx`: exportar (já real) e saldo inicial.
  - `ReportTab.tsx`: o relatório.
  - `SettingsTab.tsx`: as configurações.
  - `parts.tsx` e `data.ts`: as peças em comum.
- **Hoje abre com `?variant=C`** em `FinancesPage`, `FinancesCategoriesPage` e
  `FinancesTrashPage`. A aba vem de `?aba=lancamentos|relatorio|configuracoes`,
  e `/clinica/financas/categorias` e `/lixeira` abrem Configurações já na seção
  certa.
- **Descrição e pendências:** `docs/prototipos-v2.md`, seção "Finanças".
- **Memória:** `prototipo-financas-v2.md`.

### O que tem em cada tela (tudo isso entra)

**Lançamentos (calendário de caixa)**
- O mês em grade, com o que entrou e o que saiu em cada dia. O dia escolhido lista os lançamentos ao lado.
- Embaixo, "a receber" e "a pagar", com os atrasados marcados e um botão para dar baixa (recebido ou pago).
- Resumo do mês: o disponível em destaque e o saldo inicial editável.
- **Nova entrada** e **Nova saída**: tipo, valor, categorias mais usadas em chips, forma de pagamento, taxa da maquininha com o líquido calculado, status, data, descrição e observação.
- Editar o lançamento, e excluir (vai para a lixeira).
- Exportar (Excel, PDF, CSV), que já funciona.

**Relatório**
- Dia a dia, os últimos 12 meses, a divisão por categoria e uma tabela.
- Cores: entradas `--ds-chart-c1` (azul), saídas `--ds-chart-negative` (vermelho), já validadas para daltonismo. Verde com vermelho falhou.

**Configurações**
- Categorias: criar, ligar e desligar, excluir.
- Saldo inicial do mês.
- Lixeira, com restaurar.
- Repasses aos profissionais, que aparece **bloqueado** (plano avançado).

### O que hoje é só de mentira (precisa virar real)

Todas estas ações mostram um toast "Protótipo: … não foi salvo":

| Ação | Onde está no protótipo | API que já existe (`modules/ClinicFinance/routes/clinic.php`) |
|------|------------------------|------------------------------------------------------------|
| Lançar e editar | `TransactionModal.tsx` | `POST` / `PUT /clinic/finances/transactions` |
| Excluir (lixeira) | `TransactionModal.tsx` | `DELETE /clinic/finances/transactions/{id}` |
| Dar baixa na lista de pendências | `VariantC.tsx` | não há rota própria; hoje só pelo `PUT` (campo `status`) |
| Restaurar da lixeira | `SettingsTab.tsx` | `POST /transactions/{id}/restore` |
| Criar, ligar/desligar e excluir categoria | `SettingsTab.tsx` | `POST categories`, `POST categories/{id}/toggle-active`, `DELETE categories/{id}` |
| Salvar o saldo inicial | `modals.tsx` | `PUT /clinic/finances/opening-balance` |
| Pedir os repasses | `SettingsTab.tsx` | **não existe** |

Todas as rotas estão atrás de `clinic.admin`.

### Pontos em aberto (perguntar ao usuário, um por vez, na skill `refinar`)

1. **Repasses aos profissionais:** fica bloqueado como no protótipo, vira de verdade, ou sai da tela?
2. **Dar baixa:** só um clique que marca como recebido/pago, ou pergunta data e forma de pagamento? Ganha rota própria no backend?
3. **Mês com mais de 50 lançamentos:** a lista da API pagina em no máximo 50 e o protótipo busca só 2 páginas (até 100). É preciso decidir como buscar o mês inteiro (rota por período, limite maior, ou outra forma).
4. **Porcentagem por categoria:** o `category-breakdown` calcula sobre entradas + saídas juntas, e o relatório recalcula por tipo. A API passa a mandar separado por tipo?
5. **A v1:** sai inteira, como na 012? A v1 são `components/clinic/finances/*` e as páginas antigas, e o `?variant=` sai junto.
6. **Quem pode:** hoje só o administrador da clínica (`clinic.admin`). Continua assim?
7. **Branch:** sai da `main` ou da 012 (depende do commit da parte 1)?
8. Qualquer outra coisa que aparecer no protótipo sem regra clara: perguntar, nunca inventar.

### Como trabalhar (preferências do usuário)

- **Sempre em pt-BR.**
- **Seguir o ciclo:** `refinar` → `escrever-plano` → `criar-tarefas` → `implementar-tarefa`. A feature nova é a **013** em `.ai-workbench/013-clinic-financas-ds/`.
- **No `refinar`:** uma pergunta por vez, mostrando print da tela quando ajudar, e cada decisão gravada no `decisoes.md`.
- **No `implementar-tarefa`:** fazer **todas as tarefas em sequência**, sem pedir aprovação de cada plano. Parar só com dúvida real.
- **Revisão adversária:** só quando o usuário pedir. Quando pedir, usar vários revisores em paralelo, um por ângulo.
- **Telas v2:** usam `@/components/ds` (skill `design-system`), com o contêiner em `max-w-(--breakpoint-ds-xl)`.
- **Backend:** é a fonte de verdade, com isolamento por `clinic_id` e teste do caso "outra clínica". Seguir as skills `backend-clean-code` e `architecture-paradigm-modular-monolith`.
- **Navegador:** só headless, com `tools/screenshot` (skill `qa-navegador`). Nunca o Chrome do usuário. Ao terminar, apagar os dados criados no smoke e os artefatos temporários.
- **Git:** nada de `git add` ou commit sem o usuário pedir. Sugerir a mensagem e listar os arquivos.
- **Ambiente:** se o `composer run dev` não estiver rodando, abrir o Docker, rodar `docker start fisioweb-pgsql` e depois `composer run dev`.

---

## Texto para colar na sessão nova

```text
Leia o .ai-workbench/HANDOFF.md inteiro antes de qualquer coisa.

1. Comece pela Parte 1: me pergunte as três decisões pendentes da feature 012
   (rascunho com paciente vira ativo, 4ª revisão da correção da busca, commit)
   e faça o que eu responder.

2. Depois, a Parte 2: vamos fazer as telas de Finanças de verdade no DS v2,
   Lançamentos, Relatório e Configurações, com TUDO o que existe no protótipo
   (resources/js/pages/clinic/finances/finance-prototype/, variante C):
   nova entrada, nova saída, editar, excluir, dar baixa, lixeira com
   restaurar, categorias, saldo inicial, exportar e o relatório completo.
   Tudo o que hoje é toast "Protótipo: não foi salvo" tem que gravar de verdade.

3. O que o protótipo não tem ou não deixa claro, você me pergunta, uma
   pergunta por vez, começando pelos "Pontos em aberto" do handoff.

Siga o ciclo refinar → escrever-plano → criar-tarefas → implementar-tarefa
(feature 013) e as preferências da seção "Como trabalhar".
```
