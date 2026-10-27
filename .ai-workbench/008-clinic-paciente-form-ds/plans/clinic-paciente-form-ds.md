# Cadastro e edição de paciente da clínica no DS v2 (variante A)

Data: 2026-10-21
Fonte: conversa de refinamento (skill `refinar`) + especificação do usuário.
Referências: protótipo em `patient-new-prototype/` (variante A), feature
`.ai-workbench/007-clinic-user-form-ds/` (tarefas 003–004), ADR 016 (v2
substitui v1).

## Problema

O cadastro e a edição de paciente ainda usam telas v1 (shadcn), enquanto o
design aprovado (variante A — abas, painel com foto e situação) só aparece em
desenvolvimento como protótipo que não grava. Quem cadastra em produção não vê
o layout novo; quem testa o protótipo acha que salvou e não salvou. Há duas
implementações do mesmo formulário (`patientFormSchema`), manutenção duplicada e
risco de divergência de validação e de UX.

## Solução

`/clinica/pacientes/novo` e `/clinica/pacientes/:id/editar` passam a ser telas
v2 de verdade: mesma variante A, React Hook Form + `patientFormSchema`, hooks de
`application/` (sem `apiClient` na página). Cadastro cria pelo `POST`, envia
foto depois se houver; edição carrega pelo `GET` detalhado, salva pelo `PUT`,
troca ou remove foto. A v1, a pasta `patient-new-prototype/`, o
`PayloadModal`, o `PrototypeSwitcher` e `?variant=` nessas rotas saem. Peças
reutilizáveis vão para `pages/clinic/patient/patient-form/` e, quando fizer
sentido para outras telas v2, para `@/components/ds`.

## Histórias de Usuário

1. Como administrador, secretário(a) ou fisioterapeuta da clínica, quero abrir o cadastro de paciente e ver o layout com abas e painel lateral, para preencher com o desenho aprovado em qualquer ambiente.
2. Como quem cadastra, quero que os campos obrigatórios (nome, documento quando brasileiro, nascimento, celular, e-mail) travem “Próxima aba” e “Concluir cadastro” até estarem válidos, para não enviar cadastro incompleto.
3. Como quem cadastra, quero escolher foto com recorte circular, zoom e giro, e enviar JPEG recortado (~512px), para a foto no prontuário ficar consistente.
4. Como quem cadastra, quero ver na situação só “Em tratamento”, “Em treinamento” e “Em prevenção”, para não marcar Alta/Cancelado/Óbito em quem está chegando.
5. Como quem cadastra, quero concluir o cadastro e ir para a lista de pacientes com toast de sucesso, para continuar o fluxo de trabalho (decisão de refinamento 2026-10-21).
6. Como quem cadastra, se a foto falhar depois de criar o paciente, quero aviso claro e o paciente já existente na lista, para tentar a foto na edição.
7. Como quem edita, quero a mesma tela do cadastro carregada com os dados do paciente, para não reaprender outro layout.
8. Como quem edita, quero todas as situações (`PATIENT_STATUS_OPTIONS`), para registrar alta, cancelamento ou óbito quando aplicável.
9. Como quem edita, quero o botão principal “Salvar alterações”, esqueleto enquanto carrega e estado de paciente não encontrado no 404, para saber onde estou e quando o link está errado.
10. Como quem edita, após salvar com sucesso, quero ir ao prontuário do paciente (`/clinica/pacientes/:id`), como na v1 hoje.
11. Como quem edita, quero trocar ou remover a foto existente, com os mesmos avisos da v1 se o upload ou a remoção falhar depois do PUT.
12. Como quem preenche, quero erro 422 do backend no campo certo e a aba com erro em foco, para corrigir sem caçar o problema.
13. Como quem preenche, quero outros erros em toast e o botão mostrando que está salvando sem permitir duplo envio.
14. Como quem escolhe foto, quero recusa antes do envio se passar de 2 MB ou não for JPG/PNG/WebP, com o motivo visível na tela (alinhado ao backend).
15. Como clínica A, não quero que usuário da clínica B edite paciente ou troque foto de paciente de B (404 ou isolamento já existente + teste de upload).
16. Como desenvolvedor, quero uma pasta `patient-form/` estável e sem código de protótipo, para a lista e o prontuário evoluírem sem arrastar `PayloadModal` ou variantes descartadas.

## Decisões de Implementação

**Donos e telas**

- Dado e regras de paciente: módulo `Patient` (model, service); HTTP e Policy
  no módulo `Clinic` (`PatientController`, rotas `auth:clinic`).
- SPA: `PatientNewPage`, `PatientEditPage` finos (loader de dados + `onSave`);
  layout e campos em `pages/clinic/patient/patient-form/` (espelhando o padrão
  `user-form/` da feature 007).
- Tela v2 pura: só `Ds*` e tokens `--ds-*`, `ClinicLayout`, contêiner com
  `max-w-(--breakpoint-ds-xl)` (1920px), rolagem no corpo da página como no
  protótipo.
- **Sem migration**; formulário continua em `patientFormSchema` /
  `toPatientWriteDto` / `toPatientUpdateDto` / `toPatientFormValues` em
  `application/clinic/patient-form.ts` (não duplicar regras no Zod).

**Uma tela, dois modos (`create` | `edit`)**

- Layout da variante A extraído do protótipo: painel lateral (foto, situação,
  pendências) + cartão com `DsTabs` e seções de `SECTIONS`.
- Cadastro: `patientFormDefaults`, `STATUS_OPTIONS` restrito (3 situações).
  Edição: valores de `toPatientFormValues(detail)`, `PATIENT_STATUS_OPTIONS`
  completo; foto inicial via URL do detalhe (`photoUrl`) até o usuário trocar
  ou remover.
- Títulos e CTAs: cadastro — “Concluir cadastro”; edição — “Salvar alterações”.
  Voltar: cadastro → lista; edição → prontuário do paciente.

**Promoção para o design system**

- `DateField` do protótipo → `DsDateField` em `resources/js/components/ds/`
  (data digitada DD/MM/AAAA + calendário com mês/ano em select), export no
  barrel do DS, testes de comportamento no pacote de testes do DS ou do
  formulário conforme padrão existente.
- Recorte de foto: extrair `PhotoCropModal` + lógica de recorte para componentes
  DS (ex.: `DsPhotoCropModal` + `DsAvatarPhotoField` ou nome alinhado ao
  catálogo do `design-system`), usados pelo formulário de paciente. O JPEG
  recortado (~512px) continua sendo o `File` enviado à API; validação de tipo e
  2 MB no arquivo **final** (após recorte), espelhando
  `clinic-user-photo-rules.ts` → novo `patient-photo-rules.ts` em
  `application/clinic/`.
- Não misturar componentes v1 (`components/ui`) nessas páginas.

**Envio, foto e erros**

- Página chama `onSave` passado ao hook do formulário; hooks
  `useCreatePatient`, `useUpdatePatient`, `useUploadPatientPhoto`,
  `useDeletePatientPhoto` permanecem em `application/`.
- Fluxo criar: `POST /api/clinic/patients` → se `photo.file`, `POST
  /api/clinic/patients/{id}/photo` → navegar para `/clinica/pacientes` + toast
  sucesso; falha só na foto → toast warning (texto alinhado à v1) e mesmo
  redirecionamento para a lista.
- Fluxo editar: `PUT` → upload ou `DELETE` foto conforme mudança → navegar para
  prontuário + toast; falhas de foto/remoção como na v1 (warning + ir ao
  prontuário).
- 422: reutilizar `getValidationErrors` (`application/clinic/validation-errors.ts`)
  como em `user-form/form.ts`; `setError` nos campos do schema; abrir a primeira
  seção com erro via `firstSectionWithError` (já no protótipo).
- `isSubmitting` / `isPending` dos mutations: desabilitar botões e mostrar label
  de carregamento (criar / enviar foto / salvar).

**Endpoints (sem mudança de contrato)**

- `POST /api/clinic/patients` — guard `clinic`, body validado em
  `StorePatientRequest`, resposta `{ data: Patient }` 201.
- `GET /api/clinic/patients/{id}` — detalhe para edição (já usado por
  `usePatientDetail`).
- `PUT /api/clinic/patients/{id}` — `UpdatePatientRequest`, `{ data }`.
- `POST /api/clinic/patients/{id}/photo` — multipart `photo`, jpeg/png/webp,
  max 2048 KB.
- `DELETE /api/clinic/patients/{id}/photo` — já chama `authorize('update')`.

**Permissões e isolamento**

- Manter a intenção atual de `PatientPolicy`: **admin, secretário(a) e
  fisioterapeuta** podem `create` e `update` (testes unitários já documentam).
  Não restringir a só administrador (diferente de usuários da clínica).
- **Correção de segurança:** chamar `$this->authorize('create', Patient::class)`
  em `store`, `$this->authorize('update', $patient)` em `update` e
  `uploadPhoto` (hoje só `deletePhoto` autoriza). Isolamento entre clínicas
  continua no controller (`clinic_id` → 404), como em
  `PatientClinicIsolationTest`.
- Frontend: rotas de paciente **sem** `RequireClinicAdmin` (igual hoje); não
  adicionar `can.*` novo em `permissions.ts` salvo alinhamento futuro com ADR de
  papéis.
- Teste novo de feature: clínica A não consegue `POST` foto em paciente da
  clínica B (404). Opcional: repetir para `PUT` se não redundante com teste
  existente.

**Limpeza**

- Remover `PatientNewOriginal`, imports de `patient-new-prototype`, pasta
  `patient-new-prototype/` inteira.
- Remover componentes v1 em `components/clinic/patient/form/*` se só eram usados
  por `PatientNewPage` / `PatientEditPage` v1.
- `PrototypeSwitcher` permanece no repo para outras rotas; só sai do cadastro de
  paciente.

## Fatias Verticais

Ordem sugerida para a skill `criar-tarefas`:

1. **Extrair formulário DS + cadastro real** — Mover layout A e campos para
   `patient-form/`; promover `DsDateField` e componentes de foto ao DS;
   `patient-photo-rules.ts`; `PatientNewPage` grava pela API; testes Vitest
   (validação local, foto recusada, 422 nos campos, submit desabilitado,
   redirecionamento mockado); remover protótipo e v1 do cadastro.

2. **Edição no mesmo layout** — `PatientEditPage` com skeleton, 404 (`DsEmptyState`
   ou padrão da 007), modo `edit`, status completo, foto existente +
   remoção/upload; testes Vitest de carga e salvar; remover v1 da edição.

3. **Backend: authorize + isolamento de foto** — `PatientController` store/update/
   uploadPhoto com Policy; teste em `PatientClinicIsolationTest` (ou
   `PatientControllerTest`) para upload cross-clinic; PHPUnit verde.

Cada fatia deve fechar com testes da fatia e sem deixar rota pela metade (após
1 só cadastro v2; após 2 cadastro + edição v2).

## Testes

**Como rodar**

- Backend: `vendor/bin/phpunit --filter=PatientClinicIsolationTest` e
  `modules/Clinic/tests/Feature/PatientControllerTest.php`
- Frontend: `npm run test -- patient-form` (ou paths dos arquivos novos)

**Padrões a copiar**

- 422 nos campos: `resources/js/pages/clinic/user/user-form/form.ts` +
  `getValidationErrors`
- Foto antes do envio: `clinic-user-photo-rules.ts` + testes do user-form
- Isolamento: `modules/Clinic/tests/Feature/PatientClinicIsolationTest.php`
- Edição loading/404: `UserEditPage.tsx`

**Comportamentos cobertos**

- Cadastro válido chama create + upload opcional e navega para lista
- Foto inválida (tipo/tamanho) bloqueada na UI com mensagem
- 422 mapeado para campo e aba correta
- Edição: skeleton, 404, PUT + foto/remoção, navegação ao prontuário
- Backend: authorize nos três métodos; upload de foto em paciente de outra
  clínica → 404

**Smoke (Definição de Pronto)**

- Criar paciente na Clínica Cleverton com foto; conferir na lista e no banco;
  clínica Start não vê o registro.
- Editar paciente de outra clínica via API continua 404 (teste automatizado).

## Fora do Escopo

- Indicação de profissional da saúde (bloco tracejado “ainda não grava”) —
  permanece como na v1/protótipo; sem campo no backend.
- Protótipos de prontuário, programas e demais rotas com `PrototypeSwitcher`.
- Mudar quais papéis podem cadastrar paciente (permanece os três papéis atuais).
- Excluir paciente (`destroy`) ou mudar regras de inativação em massa.
- Feature flag ou rota paralela v1/v2 (ADR 016: v2 substitui v1).
- Recorte de foto no cadastro de **usuário** (continua DEFERRED na 007).

## Notas

- Branch de trabalho provável: evoluir `feat/clinic-paciente-novo-ds` ou renomear
  para `feat/clinic-paciente-form-ds` antes do PR.
- Mensagens de toast de sucesso/erro podem reutilizar textos da v1 para
  consistência.
- Após implementação: `bash bin/verificar.sh` antes de declarar pronto; revisão
  adversária conforme harness.
