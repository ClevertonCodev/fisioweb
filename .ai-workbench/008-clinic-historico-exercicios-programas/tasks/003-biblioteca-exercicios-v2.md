# Biblioteca de exercícios v2 nas duas URLs

**Tipo:** História
**Plano:** `../plans/clinic-historico-exercicios-programas.md`
**Issue:** ainda não criada

## Descrição

A biblioteca v2 (variante D) só aparece no protótipo. Há duas URLs para a
mesma lista; uma pode ficar v1 e a outra v2. Esta fatia entrega a grade D
nas duas, com scroll infinito, filtros, favorito persistido, ficha clínica e
Enviar exercício no papel certo. “Usar em novo programa/modelo” fica para a
tarefa 004.

## O que construir

- **Rotas:** `/clinica/programas/exercicios` (com a casca das abas da 001) e
  `/clinica/exercicios` (sem as abas). Um componente de biblioteca compartilhado.
- **Grade D:** capa/vídeo, título, especialidade, região, estrela. Rolagem
  infinita. Esqueleto, vazio e erro.
- **Filtros:** busca, especialidade, região, dificuldade vão para a API
  quando o `index` já aceitar; favoritos recortam no cliente. Chips + gaveta
  no celular.
- **Favorito:** `POST` de favorite por usuário da clínica; a estrela reflete
  o estado.
- **Ficha:** modal A (vídeo, passos, fatos, dose). Sem os botões “Usar em…”
  ainda, ou visíveis desligados até a 004.
- **Enviar exercício:** botão só para quem a v1 já libera (admin da clínica);
  destino continua o fluxo v1, fora desta entrega de visual.
- **Donos:** catálogo via contrato do Admin; favorito e visibilidade no
  `Clinic` (`visible_to_clinic_id`). Guard `clinic`. Sem migration.

## Critérios de Aceite

- [ ] As duas URLs mostram a mesma grade D; a do menu de cima não tem as
      abas de Programas (teste).
- [ ] Scroll infinito pede a próxima página (teste).
- [ ] Busca/filtros da API são enviados nos params já aceitos; filtro de
      favoritos esconde os não favoritos no cliente (teste).
- [ ] Clicar na estrela chama o toggle e atualiza o cartão (teste).
- [ ] Clicar no cartão abre a ficha A (teste).
- [ ] Enviar exercício aparece só para admin da clínica (teste).
- [ ] Clínica Start não vê exercício enviado só pela Cleverton (smoke /
      PHPUnit de visibilidade se já existir).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-casca-e-historico-em-cartoes` (casca das abas em Programas)

## Notas de Implementação

- **Branch:** `feat/clinic-historico-exercicios-programas`
- **Exemplo no código:** `ExercisesPage` + `ExercisesPage.test.tsx`;
  protótipo D só como referência; `useInfiniteExercises`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `api-client`.
- A página não importa `apiClient`.

## Como testar na mão

1. Clínica Cleverton. Abrir `/clinica/programas/exercicios` e
   `/clinica/exercicios`. Conferir abas só na primeira.
2. Buscar, filtrar por especialidade, marcar favorito, recarregar: a estrela
   permanece.
3. Abrir a ficha de um exercício.
4. Admin vê Enviar exercício; fisioterapeuta não.
5. Clínica Start: biblioteca sem os envios exclusivos da Cleverton.
