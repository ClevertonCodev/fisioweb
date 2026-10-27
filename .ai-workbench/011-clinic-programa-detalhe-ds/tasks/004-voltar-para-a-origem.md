# "Voltar" volta para a origem

**Tipo:** História
**Plano:** `../plans/clinic-programa-detalhe-ds.md`
**Histórias:** 32, 33, 34
**Issue:** ainda não criada

## Descrição

O protótipo não tem como voltar; a v1 tinha um botão de voltar. O usuário
decidiu ter um botão "Voltar" (à esquerda do WhatsApp), que volta para o
lugar de onde a pessoa veio: o Histórico com os mesmos filtros ou o
prontuário do paciente. Quem entra direto pela URL vai para o Histórico.

## O que construir

- O cartão do Histórico abre o programa passando a origem (`pathname + search`
  da tela atual) no `state` da navegação.
- No prontuário do paciente, o botão "Abrir programa" da gaveta de programa
  (aba Programas → clicar no programa) deixa de levar à edição e passa a abrir
  o painel `/clinica/programas/:id`, também com a origem. Editar continua a um
  clique, dentro do painel.
- O detalhe mostra o botão "Voltar" à esquerda do WhatsApp (decisão de 2026-10-26 que trocou o link acima do cartão). O botão usa a origem
  quando existe e, sem ela, `/clinica/programas/historico`.
- Duplicar (tarefa 002) repassa a mesma origem para a cópia. Assim,
  "Voltar" na cópia volta para onde a pessoa estava.
- O botão só aceita origem interna, um caminho que começa com `/clinica/`.
  Qualquer outra coisa no `state` cai no Histórico.
- Sem backend.

## Critérios de Aceite

- [x] Abrindo pelo Histórico filtrado, "Voltar" volta ao Histórico com os mesmos filtros na URL.
- [x] "Abrir programa" na gaveta do prontuário abre o painel (não mais a edição); "Voltar" volta ao prontuário.
- [x] O teste do prontuário (`PatientRecordVariantB.test.tsx` ou o da gaveta) confere o novo destino do botão.
- [x] Abrindo direto pela URL, "Voltar" leva ao Histórico.
- [x] Depois de duplicar, "Voltar" na cópia volta para a origem do original.
- [x] Uma origem no `state` que não começa com `/clinica/` é ignorada.
- [x] Os testes Vitest cobrem os casos acima (página com o router de teste e o `state`).
- [x] Um usuário de outra clínica não vê nada (a tela mostra "Programa não encontrado").
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda manualmente; `verificar.sh` com Prettier e Vitest falhando por itens que já existiam na branch (ver `DEFERRED.md`)

## Depende de

- `001-painel-do-programa-e-corte` (painel do programa v2 de verdade e corte da v1).
- `002-menu-de-acoes-do-programa` (duplicar navegando para a cópia).

## Notas de Implementação

- **Branch:** `feat/clinic-historico-exercicios-programas`
- **Exemplo no código:** `ProgramHistoryCard` (o link para o programa), `programPath` em `program-history-filters` e a gaveta de programa do prontuário (`patient-record/parts.tsx`, botão "Abrir programa").
- **Skills:** `frontend-react`, `frontend-testing`, `qa-navegador`

## Como testar na mão

1. No Histórico, filtre por um paciente e abra um programa. "Voltar" volta com o filtro.
2. No prontuário de um paciente, aba Programas, clique no programa e, na gaveta, em "Abrir programa": abre o painel (não a edição). "Voltar" volta ao prontuário.
3. Cole `/clinica/programas/<id>` numa aba nova. "Voltar" vai para o Histórico.
4. Dentro de um programa aberto pelo Histórico filtrado, duplique. Na cópia, "Voltar" volta ao Histórico filtrado.
