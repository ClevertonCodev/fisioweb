# Inativar paciente pelo cartão, com confirmação e regra de papel

**Tipo:** História
**Plano:** `../plans/clinic-pacientes-ds.md`
**Issue:** ainda não criada

## Descrição

Na v1, "Inativar paciente" inativava num clique, sem confirmação, e aparecia também para o fisioterapeuta, que recebia 403. Na lista v2 da tarefa 002, o cartão ainda não tem essa ação. Esta tarefa acrescenta inativar como quarto atalho do rodapé. A ação abre um modal de confirmação e só fica habilitada para admin e secretária. O fisioterapeuta vê o botão desabilitado, com a explicação no tooltip.

## O que construir

- **Atalho:** o rodapé do cartão do paciente ativo ganha o quarto atalho, "Inativar paciente", com ícone em cor de perigo.
- **Modal:** clicar abre um `DsModal` com o título "Inativar {nome}?" e um texto curto.
  - O texto diz que o paciente sai da lista de ativos e pode ser reativado depois.
  - O texto não promete que o paciente perde o acesso ao app, porque o `is_active` não bloqueia o login hoje.
  - "Cancelar" fecha sem fazer nada.
  - "Inativar" (botão `danger`) chama a mutation de inativar que já existe, com um id, e fica em carregamento enquanto ela roda.
- **Resultado:**
  - sucesso: toast, modal fechado, lista atualizada (queries de `['patients']` invalidadas) e o cartão aparece esmaecido com o selo "Inativo";
  - erro: toast de erro, e o modal fica aberto.
- **Papel:**
  - para o fisioterapeuta, o atalho aparece desabilitado e o tooltip diz "Apenas admin ou secretária podem inativar pacientes";
  - admin e secretária veem o atalho habilitado;
  - a regra vem de `can.bulkInactivate`, com o papel do `useAuth`.
- **Cartão já inativo:** o quarto atalho fica vazio por enquanto. Ele vira "Reativar" na tarefa 005.
- **Backend:** não muda. A tela usa o `POST /api/clinic/patients/bulk-inactivate`, que já autoriza pela `PatientPolicy::bulkInactivate` e filtra por `clinic_id`.

## Critérios de Aceite

- [x] Clicar em "Inativar paciente" abre o modal com o nome do paciente; clicar no atalho não abre o prontuário (teste).
- [x] "Inativar" chama a mutation com o id certo, mostra o toast de sucesso e fecha o modal (teste).
- [x] "Cancelar" fecha sem chamar a mutation (teste).
- [x] Erro da API mostra o toast de erro e mantém o modal aberto (teste).
- [x] Logado como fisioterapeuta, o atalho fica desabilitado, com o tooltip, e não abre o modal; como admin e como secretária, fica habilitado (teste para os três papéis).
- [x] Depois de inativar, o cartão aparece esmaecido com o selo "Inativo" (smoke test).
- [x] Como fisioterapeuta, o `POST /api/clinic/patients/bulk-inactivate` pela API direta continua devolvendo 403 (smoke test; já coberto pelo `PatientPolicyTest`).
- [x] O `bulk-inactivate` com o id de um paciente de outra clínica não inativa esse paciente (smoke test; já coberto pelo `PatientClinicIsolationTest`).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-lista-v2-em-cartoes` (cartão com rodapé de atalhos e `isActive` no domain).

## Notas de Implementação

- **Branch:** `feat/clinic-pacientes-ds`.
- **Exemplo no código:** `useBulkInactivatePatients` (mutation existente); o uso de `can.*` com `useAuth` em `UserListPage.tsx`; o `CardActions` do protótipo (c93122b) para o rodapé.
- **Skills:** `design-system` (`DsModal`, `DsTooltip`), `security`, `frontend-react`, `frontend-testing`.
- O modal é um componente da lista de pacientes que recebe o paciente e a ação. Monte-o pensando em reaproveitar para reativar na tarefa 005: muda o título, o texto, a cor do botão e a mutation.
- O botão desabilitado precisa continuar mostrando o tooltip. Confira como o `DsTooltip` funciona com um filho `disabled` (se for preciso, envolva o botão num `span`).

## Como testar na mão

1. `fisio-app build`; como admin da Clínica Cleverton (credenciais do admin da clínica no `DatabaseSeeder`), criar em `/clinica/usuarios/novo` uma secretária e um fisioterapeuta.
2. Entrar como secretária, em `/clinica/pacientes`, e clicar em "Inativar paciente" num cartão ativo: aparece o modal com o nome. Cancelar: nada muda. Confirmar: toast, e o cartão fica esmaecido com "Inativo".
3. Filtrar "Só inativos" (se a tarefa 003 já estiver pronta) ou conferir em `fisio-app psql` que `is_active = false`.
4. Entrar como fisioterapeuta: o atalho aparece desabilitado e o tooltip explica por quê.
5. Ainda como fisioterapeuta, chamar `POST /api/clinic/patients/bulk-inactivate` com o token dele: 403.
6. Como admin da Clínica Start, chamar `bulk-inactivate` com o id de um paciente da Cleverton: `count: 0`, e o paciente continua ativo.
