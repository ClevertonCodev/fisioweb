# Edição de usuário vira a tela de verdade

**Tipo:** História
**Plano:** `../plans/clinic-user-form-ds.md` (esta tarefa muda o "Fora do Escopo" também para a edição)
**Issue:** ainda não criada

## Descrição

Depois do cadastro (tarefa 003), o usuário pediu em 2026-10-20 que a
edição também vire a tela de verdade: a mesma tela do cadastro, carregando
os dados do usuário e gravando pela API. O protótipo da edição e a v1 saem.

Decisões do usuário (2026-10-20):

- **Senha igual à v1 de hoje:** quem chega à edição troca a senha direto,
  sem código por e-mail e sem a tabela de quem troca a senha de quem. O
  ADR 019 continua como desejo, sem implementação; a nota fica no ADR.
- **Isolamento entre clínicas fica para a feature 002**
  (`.ai-workbench/002-isolamento-clinicas-e-papeis/tasks/001-checagem-de-clinica-e-usuarios.md`).
  A v1 em produção já tem o mesmo vazamento; esta tela não o piora.
  **Atualização (rebase, 2026-10-20):** a PR #47 (lista de usuários v2)
  já fechou o vazamento: show, update, destroy e foto de usuário de outra
  clínica dão 404 (middleware no `ClinicUserController`), com teste. A
  mesma PR também já recusava desativar o mestre no `ClinicUserService`;
  no rebase ficou a versão dela.
- **Sem os contadores do crachá** (pacientes, programas, semana): eram
  calculados no navegador pelo protótipo da lista. Voltam quando a API de
  usuários devolver os números.

## O que construir

- **Tela:** `/clinica/usuarios/:id/editar` mostra o Crachá ao vivo sempre,
  sem `?variant=`. A v1 e a pasta `user-edit-prototype/` saem.
- **Carregar:** `useClinicUser(id)`; carregando e "não encontrado" no DS.
- **Salvar de verdade:** `PUT /api/clinic/users/{id}` (`useUpdateClinicUser`)
  com nome, e-mail e documento; função e situação só para quem gerencia
  usuários; senha só se preenchida. Foto nova: envia depois; foto removida:
  apaga. Sucesso: volta para a lista (admin) ou para o painel (os outros),
  como a v1. 422 no campo, como no cadastro. Foto que falha depois de
  salvar: o aviso do hook da foto e volta igual (os dados já foram salvos).
- **Senha:** campo opcional ("deixe em branco para manter"), sem modal de
  código, para todos que abrem a edição (como a v1).
- **Mestre:** função travada em administrador e situação travada, na tela
  e no backend: `ClinicUserService::update` passa a recusar com 422
  desativar o mestre (antes só barrava trocar a função), com teste. Um
  mestre que a v1 deixou inativo abre com a situação em "ativo", e a barra
  mostra a reativação como alteração ("situação"), com o Salvar habilitado.
- **Google Agenda:** só no próprio perfil, com conectar e desconectar de
  verdade (`useConnectGoogleCalendar`, `useDisconnectGoogleCalendar`) e o
  aviso do retorno (`?google=connected|error`). O backend do Google passa a
  aceitar voltar para `/clinica/usuarios/{id}/editar` (antes caía na lista),
  só com id numérico e sem host, com teste. Em outra pessoa, o texto de
  que só ela conecta.
- **Permissão:** quem pode o quê não muda (rota `RequireClinicUserSelfOrAdmin`; backend
  `ClinicUserService::update` tira função e situação de quem não é admin e
  recusa editar outra pessoa).

## Critérios de Aceite

- [x] Em qualquer ambiente, a edição abre o Crachá ao vivo com os dados do usuário, sem barra de protótipo; a v1 e o protótipo da edição não existem mais no código.
- [x] Salvar chama a API só com o que a pessoa pode mudar (função e situação só para admin; senha só se preenchida) e volta para a lista ou para o painel (teste).
- [x] Foto nova é enviada depois de salvar; foto removida é apagada (teste).
- [x] 422 do backend aparece no campo (teste); "Nada alterado" e Salvar desabilitado sem mudança (teste).
- [x] Senha nova salva direto, sem modal de código (teste).
- [x] Mestre: função e situação travadas na tela (teste) e no backend (422 ao desativar, teste); mestre inativo da v1 é reativado ao salvar (teste de tela e de backend).
- [x] Google: no próprio perfil, conectar e desconectar chamam a API (teste) e o retorno do OAuth volta para a edição com o aviso (teste de backend e de tela); em outra pessoa, o texto de que só ela conecta (teste).
- [x] Smoke: editar de verdade na Clínica Cleverton e conferir no banco; fisioterapeuta no próprio perfil não muda função.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `003-cadastro-vira-tela-real`.

## Notas de Implementação

- **Branch:** `feat/user-editar-cadastro`
- **Exemplo no código:** a v1 do `UserEditPage` (payload, foto, navegação) e o `GoogleCalendarConnection`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `security`.
