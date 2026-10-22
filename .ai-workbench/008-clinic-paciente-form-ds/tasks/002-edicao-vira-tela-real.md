# Edição de paciente vira a tela de verdade

**Tipo:** História
**Plano:** `../plans/clinic-paciente-form-ds.md`
**Issue:** ainda não criada

## Descrição

Depois do cadastro (tarefa 001), a edição (`/clinica/pacientes/:id/editar`)
ainda é v1. Não houve protótipo próprio: o pedido é o mesmo layout A do
cadastro, carregado com os dados do paciente, gravando de verdade. A v1 da
edição sai.

## O que construir

- **Tela:** `/clinica/pacientes/:id/editar` usa o mesmo layout do cadastro,
  sempre, sem `?variant=`. A v1 da edição sai. Componentes v1 do formulário
  de paciente saem se ninguém mais os usar.
- **Carregar:** hook de detalhe do paciente; esqueleto de carregamento;
  estado de “paciente não encontrado” no 404 (paciente inexistente ou de
  outra clínica).
- **Salvar de verdade:** `PUT /api/clinic/patients/{id}` pelo hook de
  atualizar. Foto nova: envia depois. Foto removida: apaga. Sucesso: toast
  e vai ao prontuário. Foto ou remoção que falha depois do PUT: aviso e
  mesmo destino (os dados já foram salvos).
- **Situação:** todas as opções (`PATIENT_STATUS_OPTIONS`), inclusive Alta,
  Cancelado e Óbito.
- **CTA:** botão principal “Salvar alterações”; voltar para o prontuário.
- **Erros:** 422 no campo certo e a aba com erro abre; outros no toast. O
  botão mostra que está salvando e não deixa enviar duas vezes.
- **Foto:** mesma recusa de tipo/tamanho da 001, com motivo na tela.
- **Permissão:** os três papéis, como hoje. Isolamento do `PUT` já existe
  (404 para outra clínica). `authorize` no controller fica para a 003.

## Critérios de Aceite

- [x] Em qualquer ambiente, a edição abre o layout A com os dados do paciente, sem barra de protótipo; a v1 da edição não existe mais no código.
- [x] Salvar chama o PUT, envia foto nova ou remove a atual quando for o caso, e vai ao prontuário (teste).
- [x] Foto que falha depois de salvar avisa e vai ao prontuário (teste); remoção que falha, o mesmo.
- [x] 422 do backend aparece no campo e a aba com erro abre (teste); enquanto salva, o botão fica ocupado (teste).
- [x] Situação na edição oferece todas as opções, inclusive Alta, Cancelado e Óbito (teste).
- [x] Esqueleto enquanto carrega; 404 mostra “paciente não encontrado” (teste).
- [x] O botão principal diz “Salvar alterações” (teste).
- [x] Smoke: editar de verdade na Clínica Cleverton (dados + foto), conferir no banco e no prontuário; a Clínica Start não vê nem altera esse paciente.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- `001-cadastro-vira-tela-real` (o layout e as peças do formulário já existem).

## Notas de Implementação

- **Branch:** `feat/clinic-paciente-form-ds`
- **Exemplo no código:** `UserEditPage` (feature 007, tarefa 004: skeleton, 404, PUT + foto); v1 em `PatientEditPage` (payload, foto, remoção, navegação ao prontuário).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `api-client`.

## Como testar na mão

1. Na Clínica Cleverton, abrir a edição de um paciente existente.
2. Conferir esqueleto, depois os dados (incluindo foto, se houver).
3. Mudar nome e situação (ex.: Alta); salvar: toast e prontuário atualizado.
4. Trocar a foto e, em outro passe, remover: refletir no prontuário.
5. Abrir um id inexistente ou de outra clínica: “paciente não encontrado”.
6. Logado na Clínica Start, o paciente da Cleverton não aparece; o PUT via API em id da outra clínica continua 404.
