# Foto do profissional privada

**Tipo:** História
**Plano:** `../plans/midia-protegida.md`
**Histórias:** 16, 17, 20, 24
**Issue:** ainda não criada

## Descrição

A foto do usuário da clínica fica em `clinic_users.photo_url`, com o endereço fixo do CDN. Ela aparece no menu, na lista e no formulário de usuário, no cabeçalho do programa do paciente e no PDF. Esta tarefa guarda só o caminho e manda link assinado de 5 minutos.

## O que construir

- Migration do módulo `Clinic`: `clinic_users` perde `photo_url` e ganha `photo_path`. Sem conversão de dado.
- O upload e a remoção de foto gravam e apagam pelo caminho.
- `ClinicUser` serializa `photo_url` assinado (5 min, nulo sem foto) e esconde `photo_path`. Isso vale para a lista, o detalhe, o `me` da clínica e o cabeçalho do programa do paciente.
- O seed de usuários grava só o caminho.
- Telas: menu da conta, dropdown do usuário, lista e formulário de usuário, e o cabeçalho do programa do paciente, todos com a imagem protegida. Se a foto do menu não carregar, a imagem protegida pede o `me` de novo.
- Guard `clinic`. As regras de quem envia e remove foto ficam como estão (Policy de usuário), e o `clinic_id` vem da clínica autenticada. Nenhuma rota nova.
- O avatar do PDF fica para a tarefa 008.

## Critérios de Aceite

- [x] A coluna `clinic_users.photo_url` não existe mais, `photo_path` existe, e `migrate:fresh --seed` roda sem erro.
- [x] Nenhuma resposta de usuário, `me` ou programa do paciente traz `photo_path` ou o host do CDN; `photo_url` tem assinatura e prazo de 5 min.
- [x] Enviar e remover foto funcionam, e a foto nova aparece no menu e na lista.
- [x] Papel sem permissão continua recebendo 403 nas rotas de foto (regressão).
- [x] A clínica B não recebe foto de usuário da clínica A.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Um paciente não vê nem altera nada de outro paciente
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-video-e-imagem-protegidos-na-clinica` (imagem protegida).

## Notas de Implementação

- **Branch:** `feat/midia-protegida`
- **Exemplo no código:** o upload de foto no controller de usuários da clínica e o link assinado do prontuário.
- **Skills:** `laravel-eloquent`, `php-testing`, `frontend-ddd`, `frontend-testing`, `design-system`.
- A sessão guarda a foto do usuário logado. Confira se ela fica no `localStorage` e se o link vencido dispara o novo pedido do `me`.

## Como testar na mão

1. Como `admin` da clínica A, troque a foto de um usuário. Ela aparece na lista, no formulário e, para o próprio usuário, no menu.
2. A resposta da API traz `photo_url` assinado e não traz `photo_path`.
3. Abra o programa de um paciente atendido por esse profissional: a foto aparece no cabeçalho.
4. Como clínica B, a foto do usuário da A não aparece.
