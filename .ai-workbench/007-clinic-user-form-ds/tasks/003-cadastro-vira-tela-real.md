# Cadastro de usuário vira a tela de verdade

**Tipo:** História
**Plano:** `../plans/clinic-user-form-ds.md` (esta tarefa muda o "Fora do Escopo" só para o cadastro)
**Issue:** ainda não criada

## Descrição

O cadastro de usuário (`/clinica/usuarios/novo`) já usa o Crachá ao vivo,
mas como protótipo: só em desenvolvimento, criar não grava e a v1 continua
em produção. Pedido do usuário em 2026-10-20: o cadastro passa a ser a tela
de verdade, gravando pela API, em todos os ambientes. A edição continua
protótipo (o GET/PUT de usuário vaza entre clínicas e a troca de senha com
código do ADR 019 não existe no backend).

## O que construir

- **Tela:** `/clinica/usuarios/novo` mostra o Crachá ao vivo sempre, sem
  `?variant=` e sem a barra do protótipo. A v1 do cadastro sai do código.
- **Código:** as peças compartilhadas (formulário, campos, layout, funções)
  saem da pasta `user-edit-prototype/` para `pages/clinic/user/user-form/`.
  A edição (protótipo) passa a importar de lá. O protótipo do cadastro sai.
- **Criar de verdade:** `POST /api/clinic/users` pelo `useCreateClinicUser`
  com o `toClinicUserWriteDto`; com foto, `POST /api/clinic/users/{id}/photo`
  depois de criar. Sucesso: volta para a lista de usuários. Foto que falha
  depois de criar: aviso e volta para a lista (o usuário já existe).
- **Erros do backend:** 422 (por exemplo, e-mail já usado) aparecem no
  campo certo; outros erros, no toast do hook. O botão mostra que está
  criando e não deixa enviar duas vezes.
- **Foto:** o texto de ajuda diz o que o backend aceita (JPG, PNG ou WebP,
  até 2 MB), e a tela recusa antes de criar o que passar disso, com o
  motivo visível. O recorte da v1 não vem nesta tarefa (DEFERRED).
- **Permissão:** só administrador (rota com `RequireClinicAdmin`; backend
  com Policy). Teste de backend novo: fisioterapeuta e secretário(a)
  recebem 403 no `POST /api/clinic/users`.

## Critérios de Aceite

- [x] Em qualquer ambiente, `/clinica/usuarios/novo` abre o Crachá ao vivo, sem barra de protótipo; a v1 do cadastro não existe mais no código.
- [x] Criar válido chama a API com nome, e-mail, senha, função, situação e documento, envia a foto quando houver e volta para a lista (teste).
- [x] Foto que falha depois de criar avisa e volta para a lista (teste).
- [x] 422 do backend aparece no campo (teste); enquanto cria, o botão fica ocupado (teste).
- [x] Foto acima de 2 MB ou de tipo que o backend não aceita é recusada antes de criar, com o motivo na tela (teste).
- [x] Fisioterapeuta e secretário(a) recebem 403 no `POST /api/clinic/users` (teste de backend); o usuário criado nasce na clínica de quem criou (teste existente `test_store_creates_user_in_own_clinic`).
- [x] A edição continua igual (protótipo), importando as peças da pasta nova (testes da 002 verdes).
- [x] Smoke: criar de verdade na Clínica Cleverton, conferir no banco e na lista, e que a Clínica Start não vê o usuário novo.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-novo-usuario-crachá` e `002-edicao-mesmo-layout`.

## Notas de Implementação

- **Branch:** `feat/user-editar-cadastro`
- **Exemplo no código:** a v1 do `UserNewPage` (criar + foto + navegar) e o ADR 016 (v2 substitui a v1).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `php-testing`, `security`.
