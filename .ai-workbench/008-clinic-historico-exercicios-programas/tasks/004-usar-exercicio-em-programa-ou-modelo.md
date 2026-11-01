# Usar exercício em novo programa ou modelo

**Tipo:** História
**Plano:** `../plans/clinic-historico-exercicios-programas.md`
**Issue:** ainda não criada

## Descrição

A ficha do exercício ainda não inicia um programa ou um modelo. Esta fatia
liga os dois botões ao assistente **v1** já existente: o exercício vai
pré-selecionado; “modelo” pula o paciente e, ao salvar, cai em Meus modelos.

## O que construir

- **Usar em novo programa:** navega para o assistente v1 com um programa
  sintético (um grupo, aquele exercício). O fluxo de paciente no fim continua
  o de hoje.
- **Usar em novo modelo:** o mesmo assistente, sem passo de paciente,
  grava `patient_id` nulo e status rascunho, redireciona para
  `/clinica/programas/meus-modelos`.
- Sem tela v2 do assistente. Sem endpoint novo: `POST` de treatment-plan
  já aceita paciente nulo.
- Guard `clinic`. Qualquer papel que já cria programa pode usar os dois
  botões.

## Critérios de Aceite

- [ ] “Usar em novo programa” abre `/clinica/programas/novo` com o exercício
      já na lista/grupos (teste de navegação + estado).
- [ ] “Usar em novo modelo” abre o mesmo assistente em modo sem paciente
      (teste).
- [ ] Salvar o modelo cria um plano sem paciente e a navegação final é
      Meus modelos (teste e/ou smoke).
- [ ] Salvar o programa com paciente continua o fluxo atual (não quebra o
      assistente existente; teste de regressão mínimo).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `003-biblioteca-exercicios-v2` (ficha no ar)

## Notas de Implementação

- **Branch:** `feat/clinic-historico-exercicios-programas`
- **Exemplo no código:** `ProgramNewPage` já lê `location.state.program`;
  `ProgramasTab` “Criar programa” com `state: { program }`.
- **Skills:** `frontend-ddd`, `frontend-testing`, `frontend-react`.
- Combinar um sinal `asModel` (ou equivalente) no estado de navegação; o
  nome fecha na implementação, o comportamento não.

## Como testar na mão

1. Clínica Cleverton. Abrir um exercício da biblioteca.
2. Usar em novo programa: o assistente v1 abre com aquele exercício; dá
   para escolher paciente e salvar.
3. Usar em novo modelo: assistente sem paciente; salvar; cai em Meus
   modelos com o novo item.
