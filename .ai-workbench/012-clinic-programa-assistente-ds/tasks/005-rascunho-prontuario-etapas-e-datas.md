# Novo programa: rascunho automático, entrada pelo prontuário, etapas clicáveis, datas e Voltar

**Tipo:** História
**Plano:** `../plans/clinic-programa-assistente-ds.md`
**Histórias:** 2, 7, 15, 16, 28, 29, 31
**Issue:** ainda não criada

## Descrição

A v1 do novo programa guarda um rascunho automático no servidor e oferece
Restaurar ou Descartar ao voltar. O protótipo não tem isso. Também não lê o
paciente vindo do prontuário, não deixa clicar nas etapas e o Voltar sempre
leva ao Histórico.

Esta tarefa completa o novo programa com o rascunho automático só onde ele faz
sentido, o paciente vindo do prontuário, as etapas clicáveis, as regras de data
do novo e o "Voltar" para a origem.

## O que construir

- **Rascunho automático** (`program-drafts`, módulo `TreatmentProgram`, sem mudança no backend):
  - Só no novo vazio e no novo pelo prontuário; nunca na edição, no modelo, vindo de exercício ou de "Usar modelo".
  - Faixa DS no topo: "Rascunho salvo às HH:MM", com Restaurar e Descartar.
  - Restaurar repõe etapa e grupos; salvar o programa apaga o rascunho.
- **Pelo prontuário:** com `?patientId=`, a etapa 3 já vem com o paciente escolhido (só paciente da clínica; o backend valida).
- **Etapas clicáveis:** com pelo menos um exercício no programa, clicar em 1, 2 ou 3 no topo vai direto para a etapa. Sem exercício, só a etapa 1.
- **Datas no novo:**
  - O início vem hoje e não aceita antes de hoje.
  - O término não aceita antes do início.
  - Os atalhos de 30, 60 e 90 dias continuam.
- **Voltar na etapa 1:** volta para a origem. Vindo do prontuário, volta ao prontuário; vindo de outro lugar, para onde a pessoa estava (Histórico, aba Exercícios, Modelos); entrando direto, para o Histórico. Mesmo mecanismo da tarefa 004 da feature 011.
- **Sair do novo:** sai direto, sem confirmação (o rascunho guarda).

## Critérios de Aceite

- [x] Rascunho salvo aparece com Restaurar e Descartar no novo vazio e no novo pelo prontuário (Vitest).
- [x] O rascunho não aparece nem é salvo vindo de exercício ou de "Usar modelo" (Vitest).
- [x] Restaurar repõe etapa e grupos; salvar o programa apaga o rascunho (Vitest).
- [x] Com `?patientId=`, a etapa 3 abre com o paciente escolhido (Vitest).
- [x] Clicar nas etapas leva direto, só com exercício no programa (Vitest).
- [x] Início antes de hoje e término antes do início são recusados no novo (Vitest).
- [x] Voltar na etapa 1 vai ao prontuário quando veio de lá, e ao Histórico entrando direto (Vitest).
- [x] Smoke no navegador: rascunho restaurado depois de recarregar a página e entrada pelo prontuário, com evidência.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (o rascunho é por usuário da clínica; paciente de outra clínica dá 422 no backend).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda manualmente.

## Depende de

- `004-novo-programa-de-verdade` (o assistente real).

## Notas de Implementação

- **Branch:** a mesma da tarefa 001.
- **Exemplo no código:** `resources/js/application/clinic/use-program-draft.ts` e `resources/js/test/use-program-draft.test.tsx`; `programBackPath` em `resources/js/application/clinic/program-detail.ts`; `PatientRecordScreen` (de onde sai o `?patientId=`).
- **Skills:** `frontend-ddd`, `frontend-react`, `design-system`, `frontend-testing`, `qa-navegador`.

## Como testar na mão

1. Programas → "Criar programa", marque três exercícios e recarregue a página: a faixa "Rascunho salvo às …" aparece; Restaurar volta os três.
2. No prontuário de um paciente → "Novo programa": na etapa 3, o paciente já está escolhido. Voltar na etapa 1 volta ao prontuário.
3. Com exercícios marcados, clique no "3" do topo: vai direto para "Paciente e envio".
4. Tente escolher início ontem: o calendário não deixa.
5. Abra um exercício → "Usar em novo programa": nenhuma faixa de rascunho.
