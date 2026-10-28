# Casca v2 + Histórico em cartões

**Tipo:** História
**Plano:** `../plans/clinic-historico-exercicios-programas.md`
**Issue:** ainda não criada

## Descrição

`/clinica/programas/historico` em produção ainda é a lista v1. O protótipo A
(cartões iguais aos da lista de pacientes) só aparece em desenvolvimento. Esta
fatia troca a casca das abas de Programas e a listagem do Histórico para o
DS v2, com dados reais, filtros locais, chips, gaveta no celular e paginação.
Ações que gravam (PDF, duplicar, modelo, excluir) ficam para a tarefa 002;
o ⋯ pode existir desabilitado ou ausente.

## O que construir

- **Casca:** cabeçalho “Programas e exercícios”, total, botão criar programa
  (só “+” no celular) e abas Histórico / Exercícios / Programas no DS v2,
  largura máxima 1920px, tema escuro. A aba Programas lembra Nossos vs Meus
  modelos ao ir e voltar. Exercícios e Programas nesta fatia podem continuar
  com o conteúdo atual (v1 ou protótipo), desde que a casca seja a nova.
- **Histórico:** cartões do visual A — foto ou inicial, nome do paciente ou
  “(sem paciente)”, profissional, data, selo de situação (não visualizado,
  visualizado, completou, rascunho), título, quantidade de exercícios, barra
  de validade na cor do selo. Clicar no cartão abre o detalhe atual.
- **Filtros (no navegador):** busca, situação derivada, profissional,
  validade, criado entre. Chips + Limpar. Gaveta no celular. Paginação 16 /
  32 / 50. `patientId` na URL recorta a lista (atalho do prontuário).
- **Estados:** esqueleto, vazio com Limpar, clínica sem programas com convite
  para criar, erro da API.
- **Donos:** `TreatmentProgram` na API já existente (`GET` da listagem, guard
  `clinic`, filtro `clinic_id`). Sem migration. Todos os papéis da clínica
  veem a lista da própria clínica.
- **Fora desta fatia:** persistir todos os filtros na URL (só `patientId`),
  filtros novos no backend, menu ⋯ funcional.

## Critérios de Aceite

- [ ] `/clinica/programas/historico` mostra a casca v2 e os cartões A, sem
      tabela v1 dessa rota (teste da página).
- [ ] O cartão mostra paciente (ou “sem paciente”), profissional, selo,
      título, exercícios e validade; clicar abre o detalhe (teste).
- [ ] Busca e cada filtro escondem cartões que não casam; Limpar e o chip
      restauram (teste).
- [ ] `?patientId=` mostra só os programas daquele paciente (teste).
- [ ] Paginação 16/32/50 e os quatro estados (carregando, vazio filtrado,
      vazio total, erro) aparecem nos casos certos (teste).
- [ ] Abas navegam para histórico / exercícios / modelos; voltar de Meus
      modelos mantém essa subaba (teste).
- [ ] Usuário da clínica Start não vê programa da Cleverton (smoke; backend
      já isola por `clinic_id`).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-historico-exercicios-programas`
- **Exemplo no código:** lista de pacientes v2 (`PatientListPage` + chips);
  protótipo A do Histórico só como referência visual; testes em
  `ProgramsAndExercisesPage.test.tsx`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`,
  `frontend-testing`.
- Página reescrita; protótipo não é copiado para produção. A pasta
  `*-prototype` pode ficar até a tarefa 006.
- A página não importa `apiClient`. Funções de status, validade e filtro
  locais são puras e testáveis sem renderizar.

## Como testar na mão

1. Entrar na Clínica Cleverton. Abrir `/clinica/programas/historico`.
2. Ver cartões com selo e barra; trocar de aba e voltar.
3. Filtrar por “Não visualizado” e por um profissional; limpar pelo chip.
4. Abrir um cartão: cai no detalhe v1. Voltar.
5. Abrir com `?patientId=` de um paciente do seed: só os programas dele.
6. Entrar na Clínica Start: não aparece paciente/programa da Cleverton.
7. Celular 375px e tema escuro.
