# Desativar, reativar e excluir pelo drawer

**Tipo:** História
**Plano:** `../plans/clinic-usuarios-ds.md`
**Issue:** ainda não criada

## Descrição

Na lista v2 da tarefa 002 o drawer só edita de verdade. Desativar, reativar e excluir ou não existem ou eram stub no protótipo. Esta tarefa liga as três ações à API, cada uma com modal de confirmação, e aplica as travas de mestre e de último administrador ativo que a tarefa 001 já protege no backend.

## O que construir

- **Desativar / reativar:** no rodapé do drawer. Ativo mostra "Desativar"; inativo mostra "Reativar". Clicar abre `DsModal` com o nome. O texto de desativar pode dizer que a pessoa perde o acesso (o login da clínica já barra inativo; Revisto em 2026-10-20 na revisão adversária: ADR 022: a sessão aberta também é cortada). Cancelar fecha sem chamar a API. Confirmar manda `PUT` só com `{ status }` (0 ou 1), fica em carregamento, fecha em sucesso, toast, lista atualizada. Cartão inativo continua esmaecido (já na 002); a ação do drawer vira Reativar.
- **Excluir:** botão destrutivo no drawer, ausente no mestre e no último admin ativo. Modal com o nome. Confirmar manda `DELETE`, toast, drawer fecha, a pessoa some da lista.
- **Travas na tela:** mestre sem Excluir e com Desativar desabilitado (motivo visível: é o dono da conta). Último admin ativo com as mesmas travas de desativar e excluir. A API já recusa 422.
- **Erro:** toast de erro e modal aberto.
- Guard `clinic`, só administrador. Sem endpoint novo. Pode correr em paralelo com a 003. (Revisto em 2026-10-20 na revisão adversária: ADR 022.) Excluir virou soft delete, com a migration de `deleted_at`.

## Critérios de Aceite

- [x] "Desativar" abre o modal com o nome; Cancelar não chama o update; Confirmar chama o update com o id e `status` inativo, mostra toast e fecha (teste).
- [x] No cartão inativo, o drawer mostra "Reativar"; confirmar manda `status` ativo (teste).
- [x] "Excluir" abre o modal com o nome; Cancelar não chama o destroy; Confirmar chama o destroy com o id certo e mostra toast (teste).
- [x] Erro da API mostra toast de erro e mantém o modal aberto (teste).
- [x] Drawer do mestre: sem Excluir; Desativar desabilitado (teste).
- [x] Drawer do último admin ativo: sem Excluir; Desativar desabilitado (teste).
- [x] Depois de desativar, o cartão fica esmaecido com "Inativo"; depois de excluir, some da lista (smoke test).
- [x] `PUT` de status no mestre ou no último admin ativo, e `DELETE` nos dois, pela API direta, continuam 422 (smoke test; coberto pela 001).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-listagem-e-put-parcial` (PUT só com `status`, 422 de mestre e último admin, DELETE já existente).
- `002-lista-v2-em-cartoes` (drawer com rodapé reservado).

Pode correr em paralelo com `003-mudar-funcao`.

## Notas de Implementação

- **Branch:** `feat/user-listagem-ds`
- **Exemplo no código:** `useUpdateClinicUser` e `useDeleteClinicUser`; o `DsModal` de inativar da lista de pacientes (confirmação com nome, botão em carregamento, toast); o drawer do protótipo C (layout dos botões, sem os stubs).
- **Skills:** `design-system` (`DsModal`, `DsButton`), `frontend-react`, `frontend-testing`, `security`.
- Monte um modal reaproveitável para desativar e reativar: muda título, texto, cor do botão e o `status` enviado.
- Não reintroduza o botão "Pedir para ativar as duas etapas".
- Toast de update genérico pode ficar específico ("Usuário desativado." / "Usuário reativado.") nesta chamada.

## Como testar na mão

1. `fisio-app build`. Como admin da Clínica Cleverton, criar um fisioterapeuta extra se precisar.
2. Abrir o drawer dele: Desativar, confirmar. Toast; cartão esmaecido; a pessoa não entra mais em `/clinica/login`.
3. No mesmo cartão: Reativar, confirmar. Volta a aparecer Ativo e o login funciona.
4. Excluir um não-mestre que não é o último admin: some da lista. Conferir no `fisio-app psql` que o registro ficou com `deleted_at` preenchido e `status = 0` (soft delete, ADR 022).
5. Drawer do mestre: sem Excluir, Desativar desabilitado.
6. Como admin da Clínica Start, `PUT`/`DELETE` no id de um usuário da Cleverton: 404, registro intacto.
