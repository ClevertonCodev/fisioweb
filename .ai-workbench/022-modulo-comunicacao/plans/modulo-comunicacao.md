# Módulo de e-mail (envio ao paciente, lembrete e e-mails do sistema)

Data: 2026-11-18
Fonte: `decisoes.md` desta pasta (sessões do `refinar` e do "Ataque o plano" de 2026-11-18), `HANDOFF.md`, protótipo na branch `prototype/022-emails` (`a5afbd0`) e levantamento do código.

## Problema

O sistema não manda e-mail ao paciente. Tudo o que a clínica envia (programa, questionário, aviso de consulta) sai do aparelho de quem usa: `wa.me` com texto pronto, `mailto:` que abre o programa de e-mail do computador, ou link copiado. Na agenda, marcar, remarcar ou cancelar uma consulta não avisa o paciente de jeito nenhum, embora o cadastro do paciente prometa "Recebe os lembretes da clínica". O link do questionário leva a uma página que não existe (404). Os dois e-mails que o sistema já manda (confirmação de cadastro e esqueci minha senha) saem com o layout padrão do Laravel, sem a marca IVS MED.

## Solução

Um módulo novo, `Email`, envia os e-mails pelo servidor, pela fila, todos com o mesmo layout IVS MED (variante A do protótipo: faixa azul-marinho com o logo e o nome da clínica, cartão branco, botão largo).

- Tudo o que vai ao paciente passa por um modal "Enviar ao paciente" (variante C, "Ações diretas"): uma linha por canal, cada uma com o próprio botão e status. E-mail manda pelo servidor; WhatsApp abre o WhatsApp Web com o texto pronto; Copiar link quando há link. Dá para usar os dois canais. Nada sai sem a clínica clicar.
- O modal aparece ao salvar o programa no assistente, num botão "Enviar ao paciente" no detalhe do programa, ao enviar um questionário e no questionário pendente do prontuário, e na agenda ao marcar, remarcar (inclusive arrastando) ou cancelar uma consulta com paciente ("Avisar o paciente?", com "Não avisar").
- O paciente responde o questionário numa página pública nova (variante B, "Formulário inteiro").
- A clínica pode ligar um lembrete automático por e-mail 24 h antes da consulta. O paciente pode parar de receber pelo link no rodapé do lembrete ou pedindo à clínica.
- O paciente não responde o e-mail: o texto manda ligar para a clínica e o rodapé diz que o endereço não recebe respostas.

## Histórias de Usuário

1. Como fisioterapeuta, quero mandar o programa por e-mail ao paciente com um clique ao salvar no assistente, para não depender do e-mail do meu computador.
2. Como fisioterapeuta, quero reenviar o programa por e-mail ou WhatsApp a partir do detalhe do programa, para quando o paciente perder o link.
3. Como fisioterapeuta, quero ver no modal que o e-mail foi enviado e a que horas, para ter certeza de que saiu.
4. Como fisioterapeuta, quero mandar por e-mail e também abrir o WhatsApp no mesmo modal, para garantir que o paciente receba.
5. Como fisioterapeuta, quero copiar o link do programa no mesmo modal, para mandar por outro meio.
6. Como fisioterapeuta, quero ver o botão de e-mail desabilitado com "Paciente sem e-mail cadastrado" quando o paciente não tem e-mail, para saber por que não dá.
7. Como fisioterapeuta, quero que um programa em rascunho não possa ser enviado, porque o paciente ainda não tem o link.
8. Como profissional, quero mandar o link do questionário por e-mail ou WhatsApp logo depois de enviá-lo, e de novo enquanto ele estiver pendente.
9. Como secretária, quero que, ao marcar uma consulta com paciente, a agenda pergunte "Avisar o paciente?", para avisar por e-mail ou WhatsApp na hora.
10. Como secretária, quero o mesmo aviso ao remarcar uma consulta pelo modal ou arrastando no calendário, para o paciente saber do horário novo.
11. Como secretária, quero o mesmo aviso ao cancelar uma consulta, para o paciente não ir à toa.
12. Como secretária, quero poder escolher "Não avisar", para os casos em que já combinei com o paciente.
13. Como secretária, quero que editar só a observação ou o título da consulta não abra o aviso, para não incomodar.
14. Como secretária, quero que consulta sem paciente (evento vindo do Google Agenda) não abra o aviso.
15. Como fisioterapeuta, quero avisar só as minhas consultas, como hoje só posso mexer nelas.
16. Como paciente, quero receber um e-mail com a cara da clínica ("<clínica> via IVS MED"), para reconhecer quem mandou.
17. Como paciente, quero que o assunto do e-mail não mostre o nome do meu tratamento, porque ele aparece na notificação do celular.
18. Como paciente, quero ver no e-mail do programa o título, as datas, a quantidade de exercícios, a mensagem do meu fisioterapeuta e um botão "Abrir meu programa".
19. Como paciente, quero ver no e-mail do questionário o prazo, quantas perguntas são e um botão "Responder questionário".
20. Como paciente, quero ver no e-mail da consulta a data, o horário no fuso da clínica, o profissional e o endereço, com um botão "Como chegar" que abre o mapa.
21. Como paciente, quero que o e-mail de cancelamento mostre a consulta riscada e o telefone da clínica para remarcar.
22. Como paciente, quero ser chamado pelo meu apelido no e-mail quando a clínica usa meu apelido.
23. Como paciente, quero saber que não adianta responder o e-mail e que devo ligar para a clínica.
24. Como paciente, quero responder o questionário numa página só, no celular, sem login, vendo o que é obrigatório e quantas faltam.
25. Como paciente, quero que, ao tentar enviar faltando uma pergunta obrigatória, a página me leve até ela e a marque.
26. Como paciente, quero ver "Respostas enviadas" depois de enviar.
27. Como paciente, quero ver uma mensagem clara quando o prazo acabou, quando já respondi ou quando o link está errado.
28. Como mestre da clínica, quero ligar "Lembrar o paciente por e-mail antes da consulta" em Dados da clínica, para reduzir faltas.
29. Como paciente, quero receber um lembrete por e-mail 24 h antes da consulta, quando a clínica ligou o lembrete.
30. Como paciente, quero parar de receber lembretes pelo link no rodapé do lembrete, sem precisar de login.
31. Como secretária, quero ver e mudar no cadastro do paciente se ele recebe lembrete por e-mail.
32. Como paciente, quero receber um lembrete só uma vez por consulta, e um novo se a consulta for remarcada para outro horário.
33. Como dono de clínica, quero que nenhuma outra clínica consiga mandar e-mail para os meus pacientes nem disparar envio sobre um item meu.
34. Como clínica que acabou de se cadastrar, quero receber a confirmação de e-mail com a marca IVS MED.
35. Como usuário (admin ou clínica) que esqueceu a senha, quero receber o e-mail de redefinição com a marca IVS MED.
36. Como operador, quero que um envio que falhou fique registrado no log e na `failed_jobs`, sem aparecer erro na tela da clínica.
37. Como operador, quero que o log de envio não grave o e-mail do paciente.

## Decisões de Implementação

### Dono e fronteiras

- **`Email` é um módulo novo e técnico** (como `Pdf` e `Cloudflare`). Ele cuida de templates, Mailables, envio pela fila, a regra de quem recebe o lembrete, o link de sair dos lembretes e o log de envio. Ele não entra no mapa de capacidades com prefixo `Clinic`, porque também manda e-mail do sistema (admin e cadastro).
- **Os módulos de origem decidem quando e para quem.** O módulo `Email` decide como o e-mail fica. Cada origem expõe uma ação "enviar por e-mail" e, depois de autorizar, dispara um **evento de integração** só com ids. O listener do `Email` (na fila) busca o resto por **contratos públicos de leitura** dos módulos donos, como o `GoogleCalendar` faz hoje. O `Email` não importa Model nem Repository de outro módulo e não lê tabela alheia.
- **Eventos novos** (classes `final readonly`, com `version`, ids e `occurredAt`, como os que já existem; nomes no passado):
  - `TreatmentPlanEmailRequested`, no `TreatmentProgram`
  - `QuestionnaireEmailRequested`, no `ClinicQuestionnaire`
  - `AppointmentEmailRequested`, no `ClinicScheduling`, com o tipo `scheduled`, `rescheduled` ou `cancelled`
  - `AppointmentReminderDue`, no `ClinicScheduling`, disparado pelo comando de lembrete

  Todos levam `clinicId`, o id do item, `patientId` e `actorId` (quem pediu; nulo no lembrete).
- **Contratos públicos novos ou ampliados** (interface em `Contracts/Public`, DTO em `Data/Public`):
  - `Patient`: contato do paciente. Devolve nome, apelido quando a clínica usa apelido, e-mail, celular e se recebe lembrete por e-mail. É sempre filtrado por `clinicId` + `patientId`.
  - `Patient`: escrita para desligar o lembrete, por `clinicId` + `patientId`.
  - `Clinic`: contato da clínica. Devolve nome, telefone, endereço (rua, número, cidade, UF), fuso e se o lembrete está ligado.
  - `Clinic`: nome e papel do profissional (`clinicUserId` dentro da clínica).
  - `TreatmentProgram`: os dados do programa para o e-mail. Devolve título, mensagem ao paciente, início, fim, quantidade de exercícios, status, paciente e o `share_url` montado pelo próprio módulo, como hoje.
  - `ClinicQuestionnaire`: os dados do envio para o e-mail. Devolve título do modelo, quantidade de perguntas, `expires_at`, status, paciente e `share_url`.
  - `ClinicScheduling`: o `AppointmentReadService` que já existe (`getSnapshotById`) serve. O listener confere que o `clinicId` do snapshot é o do evento.
- **Novo ADR** em `docs/adr/`: o módulo `Email`, os eventos de integração "…EmailRequested" e `AppointmentReminderDue`, e a regra "a origem autoriza, o `Email` monta e envia".

### Endpoints novos e alterados

Todos com guard `clinic` e middleware `clinic.guard`, envelope `data`, e limite de **5 por minuto por usuário** (429 depois disso). Nenhum deles grava dado: só disparam o evento e respondem **202** com `{ data: { queued: true } }`.

| Ação | Método e URL | Regra |
|---|---|---|
| Programa por e-mail | `POST /api/clinic/treatment-plans/{id}/email` | Policy `view` do `TreatmentPlan`; outra clínica dá 404; programa sem paciente ou em rascunho dá 422; paciente sem e-mail dá 422 |
| Questionário por e-mail | `POST /api/clinic/patients/{patient}/questionnaires/{questionnaire}/email` | Policy `view` do `PatientQuestionnaire`; paciente ou envio de outra clínica dá 404; envio que não é pendente ou já venceu dá 422; paciente sem e-mail dá 422 |
| Consulta por e-mail | `POST /api/clinic/appointments/{id}/email`, corpo `{ kind: scheduled \| rescheduled \| cancelled }` | Policy da consulta (o fisioterapeuta só as próprias); outra clínica dá 404; consulta sem paciente dá 422; `cancelled` exige consulta cancelada e os outros dois exigem consulta não cancelada (422); paciente sem e-mail dá 422 |

- **`GET /api/questionnaires/{token}` (público):** passa a devolver também o nome da clínica (`clinic_name`). Continua sem `clinicUser`, como manda o ADR 023.
- **422 do GET e do POST públicos:** ganha `reason` (`answered` ou `expired`) além do `message`, para a página diferenciar os estados.
- **`PUT /api/clinic/profile`:** aceita e devolve o campo novo da chave do lembrete. A regra de quem edita continua a mesma: admin mestre.
- **Cadastro e edição do paciente** (`POST`/`PUT` de pacientes): aceitam e devolvem o campo novo do lembrete. Ele é opcional e ligado por padrão.
- **Sair dos lembretes (público, sem guard):** `POST /api/email/reminders/unsubscribe` com `{ token }`. O token é um HMAC de `clinicId` + `patientId` com a chave da aplicação, comparado com `hash_equals`, o mesmo jeito da confirmação de cadastro (`ClinicRegistrationService`). Token inválido dá 404 e não muda nada. Token válido desliga o campo do paciente pelo contrato de escrita do `Patient` e responde 200 (idempotente). O link do e-mail abre uma página do SPA com o botão "Não quero mais receber lembretes", que faz o POST. Um GET direto que descadastrasse seria acionado pelos programas que abrem links sozinhos.

### Dados (migrations)

- `clinics` (módulo `Clinic`): booleano da chave do lembrete por e-mail, **padrão desligado**.
- `patients` (módulo `Patient`): booleano "recebe lembrete de consulta por e-mail", **padrão ligado**.
- Tabela do módulo `Email` para os lembretes enviados: `clinic_id`, `appointment_id`, `starts_at` do horário lembrado e quando foi enviado, com único em (`appointment_id`, `starts_at`). Remarcar muda o `starts_at` e permite um lembrete novo.
- Dado antigo: os padrões cobrem tudo; não há conversão. Nenhuma tabela grande é reescrita.
- O e-mail e o celular do paciente são dado pessoal, e o título do programa ou do questionário pode ser dado de saúde. Por isso o assunto do e-mail não leva dado clínico e o log não grava o e-mail.

### Envio e templates

- **Layout único (variante A)** em componente Blade do módulo `Email`, em HTML de e-mail (tabelas, estilo inline, 600px, responsivo).
  - O logo vai como PNG embutido no e-mail (anexo inline), não como link, para aparecer no Gmail e no Outlook.
  - Os e-mails da clínica levam no cabeçalho o nome da clínica e "via IVS MED". Os do sistema levam só "IVS MED".
- **Remetente:** sempre `naoresponda@ivsmed.com`. O nome é "<clínica> via IVS MED" nos e-mails ao paciente e "IVS MED" nos do sistema.
- **Sem Reply-To.** Nenhum texto pede para responder. O rodapé diz "Este endereço não recebe respostas" e mostra o telefone e o endereço da clínica.
- **Assunto sem dado clínico.** Exemplos:
  - "Seu programa de exercícios está disponível · <clínica>"
  - "Consulta marcada para 20/11 às 14:00 · <clínica>"

  O título do programa ou do questionário vai só no corpo.
- **Os 8 e-mails:**
  - **Programa enviado:** título, início, válido até, número de exercícios, mensagem do profissional em citação com nome e papel, botão "Abrir meu programa".
  - **Questionário enviado:** título, prazo, número de perguntas, botão "Responder questionário".
  - **Consulta marcada:** data, horário, profissional, local, botão "Como chegar".
  - **Consulta remarcada:** só o horário novo, sem o anterior; data, horário, profissional, local, "Como chegar".
  - **Consulta cancelada:** data e horário riscados, sem botão, telefone para remarcar.
  - **Lembrete:** "Sua consulta é amanhã", data, horário, profissional, local, "Como chegar", link "Não quero mais receber lembretes".
  - **Confirmação de cadastro** e **esqueci minha senha**, com os textos de hoje.
- **"Como chegar"** é o link de busca do Google Maps (`api=1&query=`) com rua, número, cidade e UF da clínica, sem chave de API. Ele só aparece quando a clínica tem endereço.
- **Saudação:** "Olá, <apelido>!" quando o paciente usa apelido; senão, o primeiro nome. **Datas e horas** no fuso da clínica (`clinics.timezone`), em português.
- **Os 2 e-mails do sistema:** o provider do `Email` aponta o tema de e-mail das notificações do Laravel (`MailMessage`) para o layout IVS MED. A `VerifyClinicEmailNotification` (já na fila pelo `SendClinicEmailVerificationJob`) e o `ResetPassword` ganham o visual sem a origem depender do `Email`. O reset de senha passa a ser enviado pela fila. As traduções de `lang/pt_BR.json` (feature 021) continuam valendo.
- **Fila:** listeners `ShouldQueue` com 3 tentativas e espera de 10, 30 e 60 s, como os jobs que já existem. Falha final cai na `failed_jobs`.
- **Log:** "envio feito" e "envio falhou" com o tipo de e-mail, `clinic_id`, id do item e `patient_id`, sem o e-mail.
- **Teste de envio de verdade:** só no smoke, para uma caixa Gmail, com o SMTP do Resend no `.env` local. O código não controla a cota do Resend (plano grátis, 100 por dia).

### Lembrete

- **Comando de hora em hora no `ClinicScheduling`**, registrado no provider do módulo como os de `ClinicFinance` e `GoogleCalendar`, com `withoutOverlapping` e `onOneServer`.
  - Ele acha as consultas com paciente, com status `scheduled` ou `confirmed`, que começam entre 23 h e 24 h depois da rodada, e dispara um `AppointmentReminderDue` por consulta.
  - Consulta marcada a menos de 23 h do horário não recebe lembrete.
- **O listener do `Email`** confere:
  - a chave da clínica ligada;
  - o paciente com e-mail e com o lembrete ligado;
  - que o par (`appointment_id`, `starts_at`) ainda não foi lembrado.

  Só então grava na tabela de lembretes enviados e envia. A gravação usa o índice único, para dois disparos não mandarem dois e-mails.
- **O servidor precisa do `schedule:run` no cron** (o mesmo de que `ClinicFinance` e `GoogleCalendar` já dependem). O `composer run dev` local não roda o scheduler: no smoke, roda-se o comando à mão.

### Permissões

| Ação | Quem pode | Quem decide |
|---|---|---|
| Programa por e-mail | Quem pode ver o programa da clínica: os três papéis, como hoje | `TreatmentPlanPolicy` |
| Questionário por e-mail | Os três papéis | `PatientQuestionnairePolicy` |
| Consulta por e-mail | Admin e secretária em qualquer consulta; fisioterapeuta só nas próprias | `AppointmentPolicy` |
| Ligar o lembrete | Admin mestre, como os outros dados da clínica | `UpdateClinicProfileRequest` |
| Mudar o lembrete do paciente | Quem já edita o paciente | Regra atual de edição do paciente |

- No front, o botão "Enviar ao paciente" segue o ADR 017: aparece desabilitado, com o motivo, quando falta permissão ou contato. A decisão de verdade é do backend.

### Isolamento

- **Os três endpoints "…/email":**
  - O `clinic_id` vem sempre do usuário autenticado (`auth:clinic`), nunca da requisição.
  - A busca do item filtra por `clinic_id` no Repository do módulo dono, como os endpoints vizinhos já fazem (item de outra clínica dá 404).
  - A Policy de posse vem em seguida (o fisioterapeuta só as próprias consultas).
  - No questionário, o paciente da URL também é conferido contra a clínica e contra o envio.
- **Evento:** carrega o `clinicId` já validado.
- **Listener do `Email`:**
  - Chama cada contrato público com `clinicId` + id.
  - Cada contrato filtra por `clinic_id` na própria busca.
  - Se o item não pertencer à clínica do evento, o listener não envia e registra no log.
- **Comando de lembrete:** percorre todas as clínicas, mas cada evento leva o `clinicId` da própria consulta, e o listener lê paciente e clínica só por esse `clinicId`.
- **Sair dos lembretes:** o token amarra `clinicId` + `patientId`, e o contrato de escrita do `Patient` filtra pelos dois. Um token não desliga paciente de outra clínica.
- **Páginas públicas:**
  - O questionário segue achando o envio só pelo `public_token` (ADR 023) e não devolve dado do profissional.
  - A página de sair dos lembretes não mostra dado do paciente.

### Frontend

- **Componente compartilhado "Enviar ao paciente" (variante C),** com uma linha por canal:
  - **E-mail:** chama o endpoint da origem e mostra "Enviado <hora>" e "Reenviar".
  - **WhatsApp:** abre `wa.me` com o texto pronto e mostra "Aberto <hora>".
  - **Copiar link:** só quando há link.
  - **Rodapé:** "Fechar", ou "Não avisar" na agenda; vira "Concluir" depois de um envio.
  - **Erro da API:** aparece como toast; a clínica não vê detalhe técnico.
- **Onde ele entra:**
  - No assistente de programa, no lugar do diálogo "Programa enviado", mantendo as fases salvando e erro.
  - No detalhe do programa, como botão "Enviar ao paciente" no lugar do botão solto de WhatsApp.
  - No questionário, depois de enviar e no questionário pendente do prontuário, no lugar dos botões Copiar, WhatsApp e `mailto:`.
  - Na agenda, depois de marcar com paciente, de remarcar (modal ou arrasto) quando início ou fim mudou, e de cancelar.
- **Os textos de WhatsApp** continuam montados no front: os de programa e questionário que já existem, mais os novos de consulta marcada, remarcada e cancelada. O `mailto:` sai.
- **Camadas** (skill `frontend-ddd`):
  - Em `application/`: um hook de mutation por tipo de envio e o port.
  - Em `infrastructure/`: um método por tipo no repositório de cada recurso.
  - O mapper da consulta passa a ler o e-mail e o celular do paciente, que a API já devolve.
- **Formulário do paciente:**
  - Chave "Receber lembrete de consulta por e-mail".
  - A dica do celular deixa de dizer "Recebe os lembretes da clínica" e passa a "Usado para enviar programas e avisos pelo WhatsApp".
- **Dados da clínica:** chave "Lembrar o paciente por e-mail antes da consulta (24 h)", editável só pelo mestre.
- **Página pública do questionário (variante B)** em `/:clinicSlug/paciente/questionarios/:token`, com domínio, port, hook, repositório e mapper próprios.
  - Estados: pendente, enviado, vencido, já respondido e link inválido (404).
  - O envio mostra o erro do backend se o 422 vier no POST.
- **Página pública de sair dos lembretes**, com o botão de confirmar e as mensagens de sucesso e de link inválido.

## Fatias Verticais

1. **Módulo `Email`, layout IVS MED e os 2 e-mails do sistema.**
   - Módulo registrado, com providers, testes de arquitetura passando e o ADR.
   - Componente de layout (variante A) com o logo embutido.
   - Tema das notificações do Laravel apontando para ele.
   - Reset de senha pela fila.
   - Demonstração: confirmação de cadastro e esqueci minha senha (admin e clínica) chegando com a marca IVS MED.
2. **Modal "Enviar ao paciente" + programa por e-mail.**
   - Contratos de contato do paciente, de contato da clínica, do profissional e do programa.
   - Endpoint, evento, listener e template do programa.
   - Componente do modal C e uso no assistente e no detalhe do programa.
   - Demonstração: salvar um programa, enviar por e-mail, ver "Enviado" e o e-mail chegar.
3. **Página pública de resposta do questionário (variante B).**
   - GET público com `clinic_name` e `reason` no 422.
   - Página com todos os estados.
   - Demonstração: abrir o link do questionário e responder.
4. **Questionário por e-mail.**
   - Contrato do envio, endpoint, evento, listener e template.
   - Modal C ao enviar e no questionário pendente do prontuário.
   - Depende das fatias 2 e 3.
5. **Agenda: avisar o paciente por e-mail.**
   - Endpoint com `kind`, evento, listener e os 3 templates de consulta.
   - Mapper com o contato do paciente.
   - Modal C ao marcar, remarcar (modal e arrasto, só quando o horário muda) e cancelar.
   - Depende da fatia 2.
6. **Configuração do lembrete.**
   - Migrations em `clinics` e `patients`.
   - Chave em Dados da clínica e no formulário do paciente; dica nova do celular.
   - Os contratos de contato passam a devolver os dois campos.
7. **Disparo do lembrete e sair dos lembretes.**
   - Comando de hora em hora e `AppointmentReminderDue`.
   - Listener com a tabela de lembretes enviados e o template do lembrete.
   - Token, endpoint público e página de sair.
   - Depende das fatias 5 e 6.

## Testes

**Como rodar:**
- Por módulo: `vendor/bin/phpunit modules/Email/tests` (e o de cada módulo tocado).
- Arquitetura: `vendor/bin/phpunit --testsuite Architecture`.
- Front: `npm run test`.
- Tudo de uma vez, nos arquivos que mudaram: `bash bin/verificar.sh`.

**Padrões a copiar:**
- Outra clínica dando 404 com `actingAs($user, 'clinic')`:
  - `modules/ClinicScheduling/tests/Feature/AppointmentUpdateStatusTest.php`
  - `modules/ClinicQuestionnaire/tests/Feature/PatientQuestionnaireIsolationTest.php`
  - `modules/TreatmentProgram/tests/Feature/TreatmentPlanIsolationTest.php`
- Evento disparado com `Event::fake`: `modules/ClinicScheduling/tests/Unit/Events/AppointmentServiceEventsTest.php`.
- Job na fila e notificação:
  - `modules/ClinicScheduling/tests/Feature/AppointmentStoreTest.php` (`Queue::fake`)
  - `modules/Clinic/tests/Feature/ClinicRegistrationTest.php` (`Notification::fake`)
  - Para os Mailables, usar `Mail::fake` (ainda não há exemplo no projeto).
- Comando agendado: `modules/ClinicFinance/tests/Feature/FinanceRecurrenceTest.php`, que confere a expressão do schedule, `withoutOverlapping` e `onOneServer`, e roda o comando com `travelTo`.
- Fronteiras: `tests/Architecture/ModuleBoundaryTest.php` ganha o módulo `Email` (sem `use` de Model, Repository ou interface de Repository de outro módulo), e o `ExtractionReadinessTest` confere que os eventos novos não referenciam Model.

**Comportamentos testados:**
- **Isolamento e papéis:**
  - Os três endpoints dão 404 para item de outra clínica.
  - O fisioterapeuta não envia consulta de outro profissional.
  - Paciente sem e-mail dá 422.
  - Programa em rascunho dá 422; questionário respondido ou vencido dá 422.
  - O tipo da consulta incoerente com o status dá 422.
  - O limite de 5 por minuto dá 429.
  - Os contratos públicos não devolvem paciente nem clínica de outro `clinic_id`.
  - O token de sair dos lembretes não desliga paciente de outra clínica.
- **Conteúdo do e-mail (`Mail::fake` + render):**
  - Destinatário e "De: <clínica> via IVS MED".
  - Sem Reply-To e assunto sem o título.
  - Link certo e data no fuso da clínica.
  - Apelido na saudação.
  - "Como chegar" só com endereço; cancelada sem botão.
  - Os e-mails do sistema com o layout novo e os textos em português.
  - O log sem o e-mail do paciente.
- **Lembrete:**
  - Janela de 23 a 24 h; status marcada ou confirmada; consulta sem paciente fica de fora.
  - Clínica desligada não manda; paciente com lembrete desligado ou sem e-mail não recebe.
  - Não repete na rodada seguinte; remarcar para outro horário gera lembrete novo.
  - O comando está agendado de hora em hora com `withoutOverlapping`.
  - Token adulterado não muda nada; token válido desliga e é idempotente.
- **Telas (Vitest):**
  - Modal C: botão de e-mail desabilitado sem e-mail; "Enviado <hora>" e "Reenviar" depois do envio; "Não avisar" na agenda; erro em toast.
  - Agenda: abre o modal só quando o horário mudou e só com paciente.
  - Página do questionário: obrigatória sem resposta bloqueia e rola até ela; envio mostra "Respostas enviadas"; estados vencido, já respondido e link inválido.
  - Chaves no formulário do paciente e em Dados da clínica (desabilitada para quem não é mestre).
  - Página de sair dos lembretes.

## Fora do Escopo

- WhatsApp pelo servidor (Twilio, Meta). O WhatsApp continua no `wa.me`, no aparelho de quem usa.
- Tabela de histórico de envios e o menu "Notificações" (`/clinica/notificacoes`, `/admin/notificacoes`).
- Cron que lê a `failed_jobs` ou os logs e avisa o admin geral.
- Controle de cota do Resend. A troca para o plano Pro fica com o usuário, quando houver clínica de verdade.
- Confirmar presença pelo e-mail do lembrete e escolher a antecedência (fica 24 h fixo).
- Mostrar o horário anterior no e-mail de remarcação.
- Nome do profissional na página pública do questionário.
- E-mails para a equipe da clínica: convite de usuário, primeiro acesso do mestre, questionário respondido, dor alta, exercício aprovado ou recusado, mídia, Google Agenda desconectado.
- E-mails de segurança da conta: senha trocada, e-mail trocado, código para trocar senha, suporte entrou na conta.
- Acesso do paciente à área dele (senha inicial) e "esqueci minha senha" do paciente.
- Programa concluído ou arquivado, lembrete de questionário perto de vencer, recibo de pagamento, clínica cancelada ou reativada.

## Notas

- **Protótipo de referência** na branch `prototype/022-emails` (`a5afbd0`): e-mails em `/prototipo/emails` (layout A), modal em `send-to-patient-prototype/VariantC` e página do questionário em `questionnaire-answer-prototype` (`VariantB`). É referência visual, não código para copiar: a implementação é reescrita com testes.
- **Antes do deploy:**
  - Conferir no servidor o cron do `schedule:run`.
  - Conferir as chaves de e-mail do Resend já usadas desde 2026-11-18.
  - Depois de mudar o `.env` do servidor: `config:cache` e `queue:restart`.
- **Dado exposto que não vem desta feature:** a resposta da API de consultas devolve o paciente inteiro (com CPF). Esta feature passa a usar só o e-mail e o celular de lá. Vale anotar no `DEFERRED.md` para enxugar a resposta depois.
- O e-mail chega no Gmail com o logo embutido; o protótipo confirmou que o envio com anexo inline funciona pelo mailer `log`. O envio real para o Gmail fica para o smoke da fatia 2.
