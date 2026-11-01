# Busca em todo o histórico, com filtro por tipo

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 30, 31, 32, 33
**Issue:** ainda não criada

## Descrição

O calendário só acha um lançamento pelo dia; a v1 tinha busca e filtros. A abordagem é um campo de busca no calendário que procura em todo o histórico e mostra o resultado no lugar da lista do dia, com filtro só por tipo.

## O que construir

- A listagem: `q` sem `period`/`from`/`to` busca em todo o histórico, da data mais nova para a mais antiga (com `q`, o mês atual não é imposto). Paginada.
- A busca não diferencia maiúscula: `LOWER(coluna) LIKE` com o termo em `mb_strtolower`, na descrição e no nome da categoria (o nome do paciente entra na 013).
- Filtro por tipo (entrada/saída) junto com o texto.
- Tela: campo de busca e chips de tipo; com texto, o resultado (com a data de cada um) substitui a lista do dia; "ver mais" pagina; limpar volta ao dia. Tocar num resultado abre o modal de edição.
- Sem migration.

## Critérios de Aceite

- [x] "aluguel" acha "Aluguel" de outro ano (teste com `PRAGMA case_sensitive_like = ON` dentro de `try/finally`, como o `ExerciseControllerTest`)
- [x] O filtro de tipo restringe o resultado (teste)
- [x] Outra clínica não aparece na busca (teste)
- [x] Digitar mostra os resultados com data; limpar volta ao dia; "ver mais" pagina (Vitest)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/008-busca-no-historico/`

## Depende de

- `006-lancar-editar-excluir` (Lançar, editar e excluir de verdade)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/Admin/app/Repositories/ExerciseRepository.php` (busca com LOWER), `modules/Clinic/tests/Feature/ExerciseControllerTest.php` (`test_index_search_ignores_case_like_in_postgres`)
- **Skills:** `backend-clean-code`, `php-testing`, `design-system`, `frontend-testing`

## Como testar na mão

1. Clínica A: lançar "Aluguel" em março e em outubro.
2. Em outubro, buscar "aluguel": aparecem os dois, outubro primeiro, com a data.
3. Escolher só "Saída"; limpar a busca: volta para a lista do dia.
