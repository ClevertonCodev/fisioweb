# Modelos com mapa do corpo e ações

**Tipo:** História
**Plano:** `../plans/clinic-historico-exercicios-programas.md`
**Issue:** ainda não criada

## Descrição

A aba Programas em produção ainda é a v1 (lista + detalhe). O protótipo C
(mapa do corpo + sessões) é só de desenvolvimento, e o ⋯ dos Meus modelos
é stub. Esta fatia entrega a listagem C com dados reais, Usar modelo de
verdade e o ⋯ (editar, duplicar, excluir) nos modelos da clínica.

## O que construir

- **Rotas:** `/clinica/programas/modelos` e `/meus-modelos`, com a casca da
  001. Seletor Nossos / Meus na linha dos filtros, sem linha extra.
- **Mapa:** silhueta com contagem por região; clicar filtra. Região continua
  heurística (título, descrição, exercícios), sem migration.
- **Sessão:** especialidade, título, resumo, barra dos blocos, fila de
  exercícios, ver exercícios. Nossos = catálogo Admin (contrato público).
  Meus = listagem `without_patient` da própria clínica.
- **Usar modelo:** carrega o detalhe (grupos) e abre o assistente v1, igual
  à v1.
- **⋯ só em Meus modelos:** Editar (edição v1), Duplicar (cópia sem
  paciente), Excluir com modal. Excluir: só admin dispara; outros veem
  desabilitado (mesmo `DsActionsMenu` da 002).
- Busca, especialidade, chips, gaveta no celular.
- Guard `clinic`. Sem migration.

## Critérios de Aceite

- [ ] Nossos modelos vêm do catálogo; Meus modelos só planos da clínica sem
      paciente (teste; troca de seletor muda a origem).
- [ ] Clicar numa região do mapa reduz a lista (teste da heurística: um
      título conhecido cai na região esperada; sem exigir 100% dos títulos).
- [ ] Usar modelo navega ao assistente v1 com grupos e exercícios (teste).
- [ ] Nossos modelos não mostram o ⋯ (teste).
- [ ] Em Meus: Editar, Duplicar e Excluir (admin) funcionam; outros papéis
      não disparam o `DELETE` (teste).
- [ ] Clínica Start não vê Meus modelos da Cleverton (smoke / PHPUnit).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-casca-e-historico-em-cartoes` (casca)
- `002-acoes-reais-do-historico` (`DsActionsMenu` e regra de excluir)

## Notas de Implementação

- **Branch:** `feat/clinic-historico-exercicios-programas`
- **Exemplo no código:** `ProgramasTab` (origens e “Criar programa”);
  protótipo C só como referência; hooks
  `useInfiniteClinicProgramsLibrary` e `useInfiniteMyPrograms`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `security`.

## Como testar na mão

1. Clínica Cleverton. `/clinica/programas/modelos`: mapa + sessões do
   catálogo. Clicar em Lombar: a lista muda.
2. Usar modelo: assistente v1 com os exercícios.
3. Meus modelos: ⋯ editar, duplicar, excluir (admin). Fisioterapeuta: excluir
   desabilitado.
4. Clínica Start: Meus modelos não lista o da Cleverton.
