# Handoff · 2026-11-18 · Módulo de comunicação (e-mails) — feature 022

Passagem para a sessão que vai fazer a spec. A conversa de 2026-11-18 configurou o
envio de e-mail de verdade e fez o levantamento de tudo que o sistema deveria
mandar. A próxima sessão começa pela skill **`refinar`, junto com a skill
`prototype`**: cada e-mail decidido no refinar ganha o seu **template
prototipado** (ramo UI do `prototype`, variantes por `?variant=`), para o
usuário escolher a cara dos e-mails antes do plano. O `refinar` grava as
decisões no `decisoes.md` desta pasta. Depois vêm `escrever-plano`,
`criar-tarefas` e `implementar-tarefa`.

## O pedido, nas palavras do usuário

Criar um **módulo de e-mail** que tenha os templates e seja usado pelo resto do
sistema. A clínica (ou outro módulo) **dispara um evento**, o evento chega no
módulo de e-mail e ele envia. Não é um e-mail só: tem que mandar e-mail quando
enviar um programa para o paciente e vários outros tipos.

## O que já existe (estado em 2026-11-18)

### Envio de e-mail

- Provedor: **Resend**, plano grátis (3.000/mês, 100/dia), conta `ivsmedcorp`,
  região São Paulo. Domínio `ivsmed.com` verificado (DKIM, SPF em `send.`,
  DMARC `p=none` na Cloudflare).
- Remetente: **IVS MED `<naoresponda@ivsmed.com>`**. `APP_NAME="IVS MED"` no
  servidor.
- Laravel manda por SMTP (`smtp.resend.com:587`). Fila: Redis com worker
  `queue:work`. **Depois de mudar o `.env` do servidor: `config:cache` e
  `queue:restart`** (o worker guarda a config antiga).
- Caixas da empresa (`cleverton@ivsmed.com` etc.) ainda não existem: o plano é
  o Zoho Mail grátis. O domínio principal ainda tem MX nulo e SPF `-all`.

### E-mails que o sistema manda hoje (só 2)

| E-mail | Onde |
|---|---|
| Confirmação de cadastro da clínica | `modules/Clinic/app/Notifications/VerifyClinicEmailNotification.php`, via `SendClinicEmailVerificationJob` (`ClinicRegistrationService.php:79`, `:120`, reenvio `:170`) |
| Esqueci minha senha (admin e clínica) | `ResetPassword` padrão do Laravel em `app/Http/Controllers/BasePasswordResetController.php:26-33` |

Os dois usam o layout padrão do Laravel. A feature **021** (`.ai-workbench/021-email-nome-ivs-med/`)
traduziu os dois para português (`lang/pt_BR.json`) e trocou "Fisioweb" pelo
nome do app no assunto. **Pré-requisito: a 021 ainda não foi commitada nem
publicada** em 2026-11-18. Conferir antes de começar.

### Como a clínica "envia" hoje (sem servidor)

Tudo que vai ao paciente sai pelo aparelho de quem usa: `wa.me` com texto
pronto, `mailto:` ou link copiado. Os textos prontos estão no front:

- `resources/js/application/clinic/program-share.ts:3-27` (programa)
- `resources/js/pages/clinic/patient/patient-record/share.ts:7-43` (questionário, WhatsApp)
- `resources/js/components/clinic/dashboard/dashboard-format.ts:129-133` (aniversário)

Servem de base para o texto dos templates.

## Levantamento: onde caberia e-mail

### 1. Paciente (o principal)

| Situação | Gancho que já existe | Observação |
|---|---|---|
| Programa enviado/ativado → link do programa | evento `TreatmentPlanActivated` (`TreatmentPlanService.php:96-97`), sem listener | O assistente tem o campo "Mensagem para o paciente" (`DetailsStep.tsx:631-643`) |
| Programa com link novo (troca de paciente, ADR 025) | `TreatmentPlanService.php:141-147` | O link antigo dá 404 |
| Programa concluído/arquivado | `TreatmentPlanCompleted` / `TreatmentPlanArchived` (`:169-183`) | Baixa prioridade |
| Questionário enviado → link | evento `QuestionnaireSent` (`PatientQuestionnaireService.php:69`), sem listener | **Bloqueio:** a página do paciente para responder o questionário **não existe no front** (o link cai num 404; ver `.ai-workbench/DEFERRED.md`, item de 2026-11-12) |
| Lembrete de questionário perto de vencer | não existe (precisa de cron) | `expires_at` |
| Paciente cadastrado → acesso à área do paciente | `PatientService.php:37-56`, sem evento | Senha inicial = CPF (ou e-mail sem CPF). Nada é comunicado |
| Paciente esqueceu a senha | fluxo não existe | |
| Consulta marcada | `AppointmentScheduledNotificationJob` (`AppointmentService.php:40`) só faz log, com TODO de canal | `patient_id` pode ser null (evento do Google) |
| Consulta remarcada / cancelada | `AppointmentRescheduled` / `AppointmentCancelled` (`AppointmentService.php:49-89`) | |
| Lembrete de consulta (24 h antes) | não existe (precisa de schedule) | O cadastro do paciente promete "Recebe os lembretes da clínica" (`patient-form/fields.tsx:366-371`) |
| Recibo de pagamento | `FinancialTransactionService.php:149` (`changeStatus` → recebido) | |

### 2. Equipe da clínica

| Situação | Gancho | Quem recebe |
|---|---|---|
| Usuário novo (convite/boas-vindas) | `ClinicUserService.php:35-45`, sem evento | profissional novo (hoje o admin define a senha) |
| Primeiro acesso do mestre | `MasterFirstAccessService.php:21,44` | mestre (hoje o operador copia o link e manda por WhatsApp) |
| Questionário respondido | `QuestionnaireAnswered` (`PatientQuestionnaireService.php:102`), sem listener | profissional que enviou |
| Paciente relatou dor alta no programa | `SubmitPatientProgramFeedbackService.php:48` | profissional responsável |
| Exercício enviado para revisão | `ExerciseSubmissionService.php:19` | admin do sistema |
| Exercício aprovado / recusado (com motivo) | `ExerciseSubmissionService.php:45,50,71` | profissional que enviou |
| Mídia proposta aprovada / recusada | `ExerciseMediaProposalService.php:67,80` | profissional |
| Google Agenda desconectou / falhou | `GoogleCalendarService.php:155-170` (falha calada), jobs `failed()` | profissional |

### 3. Segurança da conta

| Situação | Gancho |
|---|---|
| Senha trocada | `app/Traits/TracksPasswordChange.php:14` |
| E-mail trocado (avisar o antigo, reconfirmar o novo) | `ClinicUserService.php:86` |
| Código por e-mail para trocar senha | ADR 019 (adiado por falta de e-mail) |
| Suporte entrou na conta da clínica | `ClinicImpersonationService.php:22` |

### 4. Financeiro e administração

Clínica cancelada/reativada (`ClinicService.php:45,55`); plano vencendo (não
modelado: não há data de vencimento).

## O que ajuda o desenho

- **Eventos já disparados e sem ouvinte:** `QuestionnaireSent/Answered/Expired/Cancelled`,
  `TreatmentPlanCreated/Activated/Completed/Archived`,
  `AppointmentScheduled/Rescheduled/Cancelled/Completed`,
  `FinancialTransactionRecorded/Updated`. Um módulo novo pode escutar sem mexer
  na origem (skill `architecture-paradigm-modular-monolith`).
- **Faltam eventos:** usuário da clínica criado/desativado/e-mail trocado,
  paciente criado, exercício aprovado/recusado, clínica criada/cancelada.
- `Patient` **não é `Notifiable`** (usar o trait ou `Notification::route('mail', ...)`).
  `Patient.email` é obrigatório no cadastro, mas `nullable` no update.
- `ClinicUser` **não tem telefone**: WhatsApp para a equipe exigiria campo novo.
- O módulo `modules/WhatsApp` citado no `AGENTS.md` e nos ADRs 010/011 **não
  existe**.
- O menu "Notificações" (`/clinica/notificacoes`, `/admin/notificacoes`) não tem
  rota.
- Pendência anotada (`.ai-workbench/DEFERRED.md`): conferir se o envio da
  confirmação é mesmo síncrono. O cadastro usa job na fila; o reenvio talvez não.

## Direção sugerida (a confirmar no refinar)

- Módulo novo, nome sugerido **Comunicação** (`modules/Communication`?), que
  escuta eventos dos outros módulos, escolhe o template e envia **pela fila**.
- Templates num lugar só, com a **marca IVS MED** (logo, cores, rodapé em
  português) no lugar do layout padrão do Laravel. Os 2 e-mails de hoje migram
  para ele.
- Canal: só e-mail na primeira fase; o desenho deixa espaço para WhatsApp
  depois.
- Começar pelos e-mails do paciente que já têm gancho: programa enviado,
  questionário enviado (depende da página de resposta) e agenda.

## Perguntas para o refinar

1. Quais e-mails entram na primeira fase, e quais ficam para depois?
2. Nome e fronteira do módulo: quem é dono do texto de cada e-mail (o módulo
   de origem ou o de comunicação)? O que vai no payload do evento?
3. O paciente pode recusar e-mail? Preferência por canal por paciente/clínica?
4. O envio é automático ao ativar o programa, ou a clínica escolhe na tela
   ("enviar por e-mail" ao lado do WhatsApp)?
5. Remetente: sempre `naoresponda@ivsmed.com` com o nome da clínica no
   "De"? Responder vai para o e-mail da clínica (`Reply-To`)?
6. Lembrete de consulta: quanto tempo antes, e o paciente confirma pelo e-mail?
7. A página de resposta do questionário entra nesta feature ou antes dela?
8. Histórico de envios (o que foi mandado, quando, se falhou): precisa? Vira o
   menu "Notificações"?

## Protótipo dos templates (skill `prototype`, ramo UI)

Depois de fechar a lista de e-mails da primeira fase, prototipar **o template
de cada e-mail**, com variantes por `?variant=` e a barra flutuante do ramo UI.
Sugestão: uma rota de desenvolvimento que renderiza cada e-mail com dado fictício
(ex.: `/dev/emails/<tipo>?variant=a`), para ver no navegador o HTML que o
paciente receberia. Antes de escolher a variante, mandar um de teste para
uma caixa real (Gmail), porque e-mail renderiza diferente do navegador.
Conferir também no celular. O protótipo é descartável e vai para uma branch
própria, como diz a skill.
