# Cadastro de paciente vira a tela de verdade

**Tipo:** História
**Plano:** `../plans/clinic-paciente-form-ds.md`
**Issue:** ainda não criada

## Descrição

O cadastro (`/clinica/pacientes/novo`) já tem a variante A aprovada (abas +
painel com foto e situação), mas só em desenvolvimento: o envio abre um
modal com o payload e não grava. Em produção continua a v1 shadcn. Esta
fatia promove o layout A a tela de verdade em todos os ambientes, gravando
pela API, e tira do código o protótipo, a barra de `?variant=` e a v1 do
cadastro. A edição continua v1 até a tarefa 002.

## O que construir

- **Tela:** `/clinica/pacientes/novo` mostra o layout A sempre, sem
  `?variant=` e sem a barra do protótipo. A v1 do cadastro sai.
- **Código:** as peças da variante A (seções, campos, obrigatórios, painel,
  abas) saem da pasta de protótipo para uma pasta estável do formulário de
  paciente. `DateField` vira `DsDateField` no design system. Recorte circular
  (zoom, giro, JPEG ~512px) vira componente do DS, usado por este
  formulário. Sem `PayloadModal`, sem variantes, sem envio de mentira.
- **Criar de verdade:** `POST /api/clinic/patients` pelo hook de criar, com
  o DTO já existente do formulário. Com foto, `POST` da foto depois de
  criar. Sucesso: toast e volta para a lista. Foto que falha depois de
  criar: aviso e volta para a lista (o paciente já existe).
- **Situação:** só as de quem está chegando (Em tratamento, Em treinamento,
  Em prevenção).
- **Erros:** 422 do backend no campo certo e a aba com erro abre; outros
  erros no toast. O botão mostra que está salvando e não deixa enviar duas
  vezes.
- **Foto:** recusa antes de enviar se o arquivo final (após recorte) passar
  de 2 MB ou não for JPG/PNG/WebP, com o motivo na tela. Regras alinhadas
  ao `uploadPhoto` do backend (jpeg, png, webp, até 2 MB).
- **Formulário:** React Hook Form + o `patientFormSchema` existente; não
  duplicar regra. Página não importa `apiClient`. Contêiner com largura
  máxima do DS (1920px).
- **Permissão:** admin, secretário(a) e fisioterapeuta (como hoje). Isolamento
  entre clínicas no `store` já existe (paciente nasce na clínica de quem
  criou). O `authorize` do controller fica para a tarefa 003.
- **Indicação de profissional da saúde:** permanece o bloco “ainda não
  grava”, como na v1/protótipo.

## Critérios de Aceite

- [x] Em qualquer ambiente, `/clinica/pacientes/novo` abre o layout A, sem barra de protótipo; a v1 do cadastro e a pasta do protótipo não existem mais no código.
- [x] Criar válido chama a API com os dados do formulário, envia a foto quando houver e volta para a lista (teste).
- [x] Foto que falha depois de criar avisa e volta para a lista (teste).
- [x] 422 do backend aparece no campo e a aba com erro abre (teste); enquanto cria, o botão fica ocupado (teste).
- [x] Foto acima de 2 MB ou de tipo que o backend não aceita é recusada antes de criar, com o motivo na tela (teste).
- [x] Situação no cadastro só oferece Em tratamento, Em treinamento e Em prevenção (teste).
- [x] “Próxima aba” e “Concluir cadastro” só liberam com os obrigatórios válidos (teste).
- [x] A edição continua v1 até a 002. (002 entregue na mesma leva; a edição já é v2.)
- [x] Smoke: criar de verdade na Clínica Cleverton (com foto), conferir no banco e na lista, e que a Clínica Start não vê o paciente novo.
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`).

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/clinic-paciente-form-ds` (a partir de `feat/clinic-paciente-novo-ds`)
- **Exemplo no código:** `UserNewPage` + `user-form/` (feature 007, tarefa 003); protótipo em `patient-new-prototype/` (VariantA, shared, PhotoUpload, DateField); v1 em `PatientNewPage` (`PatientNewOriginal`).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`, `forms-shadcn` (só para saber o que sai), `api-client`.

## Como testar na mão

1. Subir o app e entrar na Clínica Cleverton (admin, secretário ou fisioterapeuta).
2. Abrir `/clinica/pacientes/novo`: layout A, sem barra de variante, sem v1.
3. Tentar concluir sem obrigatórios: botão travado; preencher e avançar abas.
4. Foto inválida (tipo ou > 2 MB no resultado): recusa na tela, sem criar.
5. Cadastro válido com foto: some da tela, toast de sucesso, paciente na lista.
6. Conferir no banco (`clinic_id` da Cleverton) e, logado na Clínica Start, que o paciente não aparece.
7. (Opcional) Forçar falha no upload da foto depois do create: aviso e paciente na lista sem foto.
