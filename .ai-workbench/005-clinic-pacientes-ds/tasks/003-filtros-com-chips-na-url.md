# Filtros da lista de pacientes com chips e gaveta no celular, na URL

**Tipo:** História
**Plano:** `../plans/clinic-pacientes-ds.md`
**Issue:** ainda não criada

## Descrição

Depois da tarefa 002, a lista v2 só tem busca e paginação. A v1 tinha filtros por data de cadastro, situação, status e profissional, e esta tarefa traz esses quatro filtros para a barra da C2. Cada filtro aplicado vira um chip (`DsFilterChips`). No celular, os filtros abrem numa gaveta. Os filtros entram na URL, como a busca e a página já entraram.

## O que construir

- **Barra (computador):** quatro dropdowns ao lado da busca, como na C2.
  - "Cadastrado entre": intervalo de datas.
  - Situação: ativos e inativos (padrão), só ativos ou só inativos.
  - Status: vários.
  - Profissional: vários, com os profissionais de `useClinicProfessionals`. Se a clínica não tiver profissionais, o dropdown não aparece.
  - Rótulos: sem nada marcado, mostra o nome do filtro; com um item, o próprio item; com vários, "Nome (n)".
- **Chips:** um por filtro aplicado, na ordem cadastro, situação, cada status, profissionais e itens por página.
  - Vários profissionais cabem num chip só, com o primeiro nome de cada um, ignorando títulos como "Dr.", "Dra.", "Prof." e "Sr.".
  - Remover um chip limpa só aquele filtro. O chip de profissionais limpa todos os profissionais.
  - "Limpar" zera os filtros e volta o `per_page` ao padrão. A busca continua.
  - A Situação padrão não vira chip.
- **Celular:** o botão "Filtros (n)" abre um `DsDrawer` de baixo, com os mesmos filtros em grupos, "Limpar" e "Ver N pacientes".
- **Estado vazio:** com filtros e sem resultado, o vazio mostra o botão "Limpar filtros".
- **Total:** com qualquer filtro aplicado, diz "encontrados".
- **URL:** as funções puras de filtros passam a ler e escrever `situacao` (`ativos` ou `inativos`), `status` (lista separada por vírgula, só `PatientStatus` válidos), `prof` (ids separados por vírgula), `de` e `ate` (datas ISO).
  - Um valor inválido é descartado: status desconhecido, data malformada, ou `ate` sem `de`.
  - Mudar um filtro volta para a página 1.
- **Listagem:** a tela traduz os filtros para os parâmetros do `GET /api/clinic/patients` que já existem (`is_active`, `statuses`, `professional_ids`, `date_from`, `date_to`).
- **Backend:** não muda. Todos os papéis filtram, e a listagem já filtra por `clinic_id`.

## Critérios de Aceite

- [x] Cada filtro muda a lista e a URL; abrir uma URL com `situacao`, `status`, `prof`, `de` e `ate` mostra os filtros marcados e os chips (teste da página).
- [x] As funções de URL descartam `status=xyz`, `de=2026-13-45`, `ate` sem `de` e `situacao=qualquer` (testes unitários).
- [x] Os chips têm o rótulo e o valor certos para cada filtro; vários profissionais viram um chip com os primeiros nomes sem títulos ("Dra. Ana Paula" vira "Ana") (teste).
- [x] Remover um chip limpa só aquele filtro; "Limpar" zera os filtros e o `per_page`, e mantém a busca (teste).
- [x] A Situação "ativos e inativos" não vira chip nem aparece na URL (teste).
- [x] Mudar qualquer filtro volta para a página 1 (teste).
- [x] Sem resultado com filtro, aparece "Limpar filtros" e ele funciona (teste).
- [x] No celular (375px), "Filtros (n)" abre a gaveta com os mesmos filtros, e "Ver N pacientes" fecha a gaveta (smoke test com captura).
- [x] Voltar do prontuário mantém os filtros e os chips (smoke test).
- [x] O filtro de profissional só lista profissionais da própria clínica, e filtrar por id de profissional de outra clínica (editando a URL) não traz paciente nenhum (smoke test).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-lista-v2-em-cartoes` (lista v2 com busca, paginação e as funções de URL).

## Notas de Implementação

- **Branch:** `feat/clinic-pacientes-ds`.
- **Exemplo no código:** o protótipo do commit c93122b (`TopFilters`, `PatientFilters`, `activeChips`, `removeChip`, `firstName`, `multiLabel`) como referência; `ExerciseFilters.test.tsx` para testar filtros.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-react`, `frontend-testing`.
- A lógica dos chips (montar a partir dos filtros e remover um) fica em função pura, testável sem renderizar.
- O `DsDatepicker` devolve `Date` ou intervalo; converta para ISO local (sem fuso), como o `toIsoDate` do protótipo.
- A tarefa 013 da feature 002 (fisioterapeuta vê só os pacientes dele) pode mudar o que o filtro de profissional significa para o fisioterapeuta. Se ela entrar antes desta, confira com o usuário se o dropdown de profissional continua aparecendo para ele.

## Como testar na mão

1. `fisio-app build`; entrar como admin da Clínica Cleverton (credenciais do admin da clínica no `DatabaseSeeder`), com pacientes em status diferentes, de mais de um profissional e com um inativo.
2. Em `/clinica/pacientes`, aplicar cada filtro e conferir a lista, o chip e a URL.
3. Marcar dois profissionais: um chip "Profissionais" com os dois primeiros nomes.
4. Remover um chip de status: só ele sai. Clicar "Limpar": zera tudo, menos a busca.
5. Abrir um prontuário e voltar: os filtros continuam.
6. Copiar a URL filtrada, abrir numa aba nova: a mesma tela.
7. Editar a URL para `status=xyz&de=2026-13-45`: a tela ignora os dois.
8. A 375px, abrir "Filtros", aplicar e "Ver N pacientes".
9. Pôr na URL `prof=` com o id do admin da Clínica Start: a lista vem vazia.
