# Foto do paciente privada

**Tipo:** História
**Plano:** `../plans/midia-protegida.md`
**Histórias:** 18, 19, 20, 24
**Issue:** ainda não criada

## Descrição

A foto do paciente, dado pessoal (LGPD), fica em `patients.photo_url` com o endereço fixo do CDN. Ela aparece na lista de pacientes, na edição, no dashboard, na agenda e no `me` da área do paciente. Esta tarefa guarda só o caminho e manda link assinado de 5 minutos.

## O que construir

- Migration do módulo `Patient`: `patients` perde `photo_url` e ganha `photo_path`. Sem conversão de dado.
- O upload e a remoção de foto do paciente gravam e apagam pelo caminho.
- `Patient` serializa `photo_url` assinado (5 min, nulo sem foto) e esconde `photo_path`.
- Os lugares que montam a resposta à mão também assinam: o repositório do dashboard da clínica e o serviço de leitura da agenda (contrato público da `ClinicScheduling`). Uma lista recebe os links na própria resposta, sem uma chamada por foto.
- O seed de pacientes grava só o caminho.
- Telas: avatar da lista de pacientes, edição do paciente, dashboard e agenda, todos com a imagem protegida.
- Guard `clinic` (e `patient` no `me`). O `clinic_id` vem da clínica autenticada, e as queries do dashboard e da agenda já filtram por ele. Nenhuma rota nova.

## Critérios de Aceite

- [x] A coluna `patients.photo_url` não existe mais, `photo_path` existe, e `migrate:fresh --seed` roda sem erro.
- [x] Nenhuma resposta de paciente, dashboard, agenda ou `me` do paciente traz `photo_path` ou o host do CDN; `photo_url` tem assinatura e prazo de 5 min.
- [x] Enviar e remover foto do paciente funcionam, e a foto nova aparece na lista.
- [x] Papel sem permissão continua recebendo 403 nas rotas de foto do paciente (regressão).
- [x] A clínica B não recebe foto de paciente da clínica A na lista, na agenda nem no dashboard.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Um paciente não vê nem altera nada de outro paciente
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `002-video-e-imagem-protegidos-na-clinica` (imagem protegida).

## Notas de Implementação

- **Branch:** `feat/midia-protegida`
- **Exemplo no código:** as prévias do prontuário, que mandam os links em lote numa resposta só, e o upload de foto no controller de pacientes da clínica.
- **Skills:** `architecture-paradigm-modular-monolith` (contrato da agenda), `laravel-eloquent`, `php-testing`, `frontend-testing`, `design-system`.

## Como testar na mão

1. Como `secretary` da clínica A, troque a foto de um paciente. Ela aparece na lista, na edição, na agenda (num agendamento dele) e no dashboard.
2. As respostas trazem `photo_url` assinado e não trazem `photo_path`.
3. Como clínica B, a foto desse paciente não aparece em nenhuma resposta.
