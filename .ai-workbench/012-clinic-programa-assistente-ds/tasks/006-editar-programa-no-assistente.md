# Editar programa no assistente v2 pela URL

**Tipo:** História
**Plano:** `../plans/clinic-programa-assistente-ds.md`
**Histórias:** 5, 6, 8, 21, 25, 26, 27, 29, 30, 35
**Issue:** ainda não criada

## Descrição

"Editar" no painel do programa ainda abre a `ProgramEditPage` v1, outra tela
com outro visual. Esta tarefa faz `/clinica/programas/:id/editar` abrir o mesmo
assistente v2 em modo edição, carregado pelo `id` da rota. Assim, o F5 não
perde a tela. Ao salvar, o assistente manda os `id`s de grupos e exercícios
(tarefa 001), então o histórico do paciente fica.

## O que construir

- **Rota:** `/clinica/programas/:id/editar` carrega o programa (loader e hook que já existem) e abre o assistente em modo edição. Título "Editar programa", subtítulo "Editando '…'", etapa 2. Programa inexistente ou de outra clínica cai na tela de erro (404), como hoje.
- **Dados:**
  - Grupos, exercícios com dose, título, mensagem, paciente e datas vêm do programa.
  - Na etapa 3, o paciente pode ser trocado ou tirado.
- **Salvar:**
  - `PUT` com `id` de cada grupo e exercício que já existia e sem `status` (as tarefas 001 e 002 decidem no backend).
  - Com paciente: sempre abre o diálogo de envio (link novo, se o paciente mudou).
  - Sem paciente: toast e volta ao painel do programa.
- **Datas na edição:** o início original fica, mesmo no passado; trocar só para hoje em diante; término ≥ início.
- **Etapas clicáveis:** como no novo.
- **Sair com alteração não salva** (Voltar, navegação do topo, fechar ou recarregar a aba): modal DS "Descartar alterações?". Sem alteração, sai direto. Voltar na etapa 1 vai ao painel do programa.
- **Sem rascunho automático** na edição.
- **Corte:** a `ProgramEditPage` v1 sai.
- **Isolamento:** a busca do programa é filtrada por `clinic_id` no backend (404 para outra clínica).

## Critérios de Aceite

- [ ] `/clinica/programas/:id/editar` abre o assistente na etapa 2 com os dados do programa, e o F5 mantém a tela (Vitest).
- [ ] Salvar chama o `update` com os `id`s de grupos e exercícios existentes, sem `status`; exercício novo vai sem `id` (Vitest).
- [ ] Com paciente, o diálogo de envio sempre abre; sem paciente, volta ao painel (Vitest).
- [ ] Início passado é mantido; escolher outra data passada não é possível (Vitest).
- [ ] Sair com alteração abre "Descartar alterações?"; sem alteração, sai direto (Vitest).
- [ ] Editar o programa 7 com séries registradas mantém o histórico no link do paciente (smoke, com evidência).
- [ ] Trocar o paciente mostra o link novo no diálogo, e o antigo dá "Programa não encontrado" (smoke, com evidência).
- [ ] Abrir `/clinica/programas/<id de outra clínica>/editar` mostra a tela de erro, sem dados (smoke e teste backend que já existe).
- [ ] A `ProgramEditPage` v1 não existe mais e nada a importa.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade.
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-editar-sem-apagar-historico` (`PUT` com `id`s).
- `002-status-e-link-ao-trocar-paciente` (`PUT` sem `status`, link novo).
- `004-novo-programa-de-verdade` (o assistente real).

## Notas de Implementação

- **Branch:** a mesma da tarefa 001.
- **Exemplo no código:** `resources/js/pages/clinic/program/ProgramEditPage.tsx` (o que a v1 carrega e manda); a rota `/clinica/programas/:id` em `resources/js/routes/clinic/program-routes.tsx` (loader com `ClinicLoaderError`); `useBlocker` do React Router para a confirmação ao sair.
- **Skills:** `frontend-ddd`, `frontend-react`, `design-system`, `frontend-testing`, `qa-navegador`.

## Como testar na mão

1. Como paciente, pelo link do programa 7, registre séries de um exercício.
2. Na clínica, painel do programa 7 → "Editar": abre na etapa 2 com os grupos e doses. Recarregue: continua lá.
3. Mude as repetições desse exercício e salve: o diálogo de envio abre. No link do paciente, as séries continuam.
4. Edite de novo, mude algo e clique em Voltar: "Descartar alterações?".
5. Troque o paciente e salve: o diálogo mostra outro link; o antigo dá "Programa não encontrado".
6. Logado em outra clínica, abra `/clinica/programas/7/editar`: tela de erro.
