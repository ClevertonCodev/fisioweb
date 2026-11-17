# Handoff · 2026-11-16 · Mídia protegida (feature 019)

Passagem para a sessão que vai fazer a spec. A conversa de 2026-11-16 decidiu a
direção. A próxima sessão começa pela skill `refinar`, que grava o
`decisoes.md` desta pasta (o desta sessão foi apagado, então as decisões estão
aqui) e fecha as perguntas em aberto. Depois vêm `escrever-plano`,
`criar-tarefas` e `implementar-tarefa`.

## O pedido, nas palavras do usuário

Nenhum link de vídeo, imagem ou PDF pode funcionar fora do sistema: para abrir
um arquivo, a pessoa tem que estar autenticada. Ninguém pode mandar um link
para alguém de fora nem baixar os vídeos e copiar a biblioteca. Gravar a tela
com o celular ou o computador é aceito e fica fora.

## Decisões já tomadas (2026-11-16)

- **Qual é o medo?** → Os dois: compartilhar o link com gente de fora e baixar
  ou copiar a biblioteca.
- **Esconder o link no código basta?** → Não. Tocar como `blob:` é só reforço.
  A proteção de verdade é o link não funcionar fora da sessão de quem pediu.
- **Onde ficam os arquivos?** → Tudo privado no R2: vídeos, capas, imagens de
  referência, fotos do profissional e do paciente, e PDFs. Nada tem endereço
  público permanente. Para abrir, o arquivo passa por um link assinado, gerado
  na hora só para quem tem permissão.
- **E o PDF do programa?** → O PDF não tem vídeo nem endereço de arquivo, e
  **não ganha link nem QR por exercício**. Fica só o QR do programa, que já
  existe e leva à página do programa. A proteção está nessa página, que passa a
  exigir autenticação para mostrar os vídeos (o como é a pergunta 1). Um QR
  fotografado ou encaminhado não abre nada sem login.
- **Em que ordem?** → Fase 1: fechar a porta (tudo privado, link assinado,
  login). A fase 2 (vídeo em pedaços com Cloudflare Stream e marca d'água com o
  nome da clínica) só entra se ainda houver cópia depois da fase 1.

### Fora do escopo

- Impedir gravação de tela.
- Fase 2: Cloudflare Stream (pago, cerca de US$ 5 por mês para cada 1.000
  minutos guardados, mais o uso) e marca d'água.

## Perguntas para o `refinar`

Estão na ordem em que uma depende da outra. Para cada uma vai a recomendação
que foi dada ao usuário.

1. **Login do paciente.** Hoje `GET /api/patient/programs/{publicToken}` e as
   rotas de execução e feedback abrem sem login: quem recebe o WhatsApp
   encaminhado vê os vídeos. Opções: pedir login sempre; **pedir login uma vez
   e lembrar o aparelho (sessão longa, como app de banco), a recomendada**; ou
   continuar sem login com um link que vence. O usuário disse "para funcionar
   tem que estar no sistema", mas não escolheu entre as três. É o público dele
   (pacientes mais velhos podem travar no login).
2. **Prazo do link assinado por tipo.** Vídeo precisa cobrir o tempo de
   assistir, porque cada pedido de pedaço (range) do player é conferido na hora
   e um link de 5 min trava o vídeo no meio. A recomendação é uns 30 min para
   vídeo e 5 min para imagem e PDF.
3. **Como a tela toca o vídeo.** O SPA guarda o JWT no `localStorage` e manda o
   `Authorization` pelo `apiClient`, mas um `<video src>` não manda cabeçalho.
   Opções: (a) a API devolve um link assinado do R2 e a tela usa
   `<video src=link>`; (b) **a tela baixa pelo `apiClient` e toca como
   `blob:`, o que esconde o link e vale para vídeos curtos de exercício (o seed
   usa uns 5 MB), a recomendada**; (c) endpoint nosso que faz streaming, que
   pesa no PHP e não é recomendado. Sem botão de download
   (`controlsList="nodownload"`) e sem menu de botão direito no player.
4. **Fotos do profissional e do paciente** também ficam privadas? O pedido diz
   "tudo". Elas aparecem em menu, agenda, dashboard, cabeçalho do programa do
   paciente e avatar do PDF: são muitos lugares e muitas chamadas. Confirmar e
   decidir se uma lista (agenda, pacientes) recebe os links em lote, como as
   prévias do prontuário (`GET /api/clinic/patients/{p}/files/previews`).
5. **QR do programa protegido.** O QR continua apontando para
   `APP_URL/{slug}/paciente/programas/{public_token}`. Confirmar o que acontece
   quando o paciente não está logado: vai para o login e volta para o programa
   depois de entrar? E o `public_token` continua no QR ou passa a ser só um
   identificador, já que o acesso depende do login?
6. **CDN `cdn-dev.ivsmed.com`.** Ampliar a regra de WAF do ADR 027 para
   bloquear tudo, tirar o domínio próprio do bucket (os links assinados usam o
   endpoint S3, não o CDN) ou usar um Worker? A recomendação é tirar o acesso
   público, porque sem endereço público não há nada a bloquear.
7. **Dados antigos.** As colunas `cdn_url`, `url`, `thumbnail_url` e
   `photo_url` guardam a URL pública. Parar de gravar e de devolver, apagar as
   colunas por migration, ou manter só o caminho (`path`)?
8. **Admin.** O painel master (revisão de vídeo, catálogo) também passa por link
   assinado? Pela regra "tudo privado", sim.

## Mapa do código (levantado em 2026-11-16)

Caminhos do backend relativos a `modules/`, do front a `resources/js/`.

| Arquivo | Quem vê | Como o link chega hoje | Onde |
|---|---|---|---|
| Vídeo e capa (`media_videos.cdn_url`, `url`, `thumbnail_url`) | Clínica | URL pública do CDN gravada no banco no upload | `Cloudflare/app/Services/CloudflareR2Service.php:59,182,344` (`generateCdnUrl`); `Media/app/Services/VideoService.php:220,280,332,428,512`; `Clinic/app/Http/Controllers/ExerciseController.php:112`; front `infrastructure/repositories/api-clinic-exercises.ts:81-82`, `api-clinic-programs.ts:93-94`, `pages/clinic/program/exercise-library/media.tsx`, `program-detail/ProgramDetailPanel.tsx:118,291` |
| Mesmo vídeo e capa | Admin | Idem | `Media/routes/admin.php:7-8`; front `api-admin-videos.ts`, `pages/admin/exercises/AdminVideoDetailPage.tsx:88`, `components/admin/exercises/AdminExerciseVideoPreview.tsx:25` |
| Mesmo vídeo e capa | Paciente e **público sem login** (por `publicToken`) | Idem (`video_url = cdn_url ?? url`) | `TreatmentProgram/routes/patient.php`; `TreatmentProgram/app/Support/PatientProgramResponseMapper.php:109-110`; front `pages/patient/program/PatientExerciseDetailPage.tsx:114-116` e `PatientProgramExecutionPage.tsx:631-634` (`<iframe src>`), `PatientProgramDetailPage.tsx:498` (`components/VideoThumb.tsx:67`, `<video>`) |
| Imagens de referência (`admin_exercise_media.cdn_url`) | Clínica, admin | URL do CDN no banco | `Admin/app/Services/ExerciseReferenceImageSyncService.php:61`; `VideoService.php:557,709` |
| Imagens no PDF do programa | Paciente | O dompdf baixa pela URL do CDN na geração (`isRemoteEnabled`) | `resources/views/pdf/clinic/treatment/treatment-plan.blade.php:443-487`; `Pdf/app/Services/PdfService.php:22-33`; `TreatmentPlanController.php:128-161` |
| QR do programa no PDF | Paciente | Aponta para a página `APP_URL/{slug}/paciente/programas/{public_token}`, não para o arquivo | `TreatmentProgram/app/Services/ProgramPdfViewModelBuilder.php:72-91`, `ProgramPdfQrCodeGenerator.php:15-35` |
| Foto do profissional (`clinic-users/photos`) | Clínica, paciente, PDF | URL do CDN no banco | `Clinic/app/Http/Controllers/ClinicUserController.php:98-99`; `PatientProgramResponseMapper.php:29`; `ProgramPdfViewModelBuilder.php:39` |
| Foto do paciente (`patients/photos`) | Clínica | URL do CDN no banco | `Clinic/app/Http/Controllers/PatientController.php:140-141`; `Clinic/app/Repositories/DashboardRepository.php:71-75`; `ClinicScheduling/app/Services/SchedulingReadService.php:21-28` |
| Prontuário (`patients/files`) | Clínica | **Já é link assinado de 300 s** (modelo a seguir) | `ClinicalRecord/app/Services/PatientFileService.php:26,43-62` |
| Comprovantes de Finanças | Clínica | **Já é link assinado de 300 s** | `ClinicFinance/app/Services/FinancialAttachmentService.php:18,81-91` |
| WhatsApp e e-mail | Paciente | Só mandam o link da página do programa ou do questionário, nunca de arquivo | `application/clinic/program-share.ts:3-27` |

Observações:

- Os únicos links que duram dias (o QR do PDF e o WhatsApp) apontam para a
  página do programa, que pede a mídia a cada abertura. Link curto para a
  mídia não quebra esses dois.
- O PDF embute as imagens na geração. Com mídia privada, o servidor gera o
  link assinado (ou lê o arquivo do disco R2) na hora de montar o PDF.
- Se a geração local do QR falhar, o `ProgramPdfQrCodeGenerator.php:35` usa o
  `api.qrserver.com`: a URL da página do programa vai para um serviço externo.
  Vale tratar junto.
- Não existe API Resource para esses models: eles são serializados direto, e
  `cdn_url`, `url` e `thumbnail_url` saem na resposta. O prontuário esconde os
  campos no model (`$hidden`), e esse é o modelo a seguir.

## Ambiente de hoje

- Servidor `app.ivsmed.com` (Hetzner), com `APP_ENV=development` desde
  2026-11-16. O usuário diz que é ambiente de desenvolvimento e o banco pode
  ser recriado. Fora de produção, o `/log-viewer` abre sem login
  (`app/Providers/AppServiceProvider.php:45`); por isso o nginx bloqueia
  `/log-viewer` (404). Esse bloqueio ainda não está no `infra/`.
- R2: bucket `ivsdev` na conta Cloudflare do `ivsmed.com`, domínio próprio
  `cdn-dev.ivsmed.com`, `r2.dev` desligado, CORS para `app.ivsmed.com` e
  `localhost:8000`.
- A regra de WAF do ADR 027 (itens 1 e 5) está ativa no `cdn-dev.ivsmed.com` e
  bloqueia `clinics`+`finances` e `patients`+`files`; o registro está no ADR.
- O bucket antigo (`fisioweb`, em outra conta Cloudflare) ainda tem o `r2.dev`
  ligado, com uns 133 arquivos de teste, entre eles laudos e um comprovante. O
  app não usa mais esse bucket. Desligar o `r2.dev` dele ou apagá-lo é tarefa do
  usuário, nessa outra conta.
- Os vídeos e capas do seed apontam para o `cdn-dev`, mas os arquivos não estão
  no `ivsdev` (dão 404). Copiar `videos/` e `thumbnails/` do bucket antigo foi
  oferecido e não foi feito.

## Regras do projeto que pesam aqui

- É Spec, não vibe code: mexe em acesso, dado de paciente (LGPD), vários
  módulos (`Media`, `Cloudflare`, `Clinic`, `TreatmentProgram`, `Admin`, `Pdf`,
  `Patient`) e no login do paciente.
- Isolamento: link assinado só sai para quem é da clínica dona do arquivo, e um
  paciente só vê a mídia dos próprios programas. Precisa de teste do caso de
  outra clínica e de outro paciente.
- Fronteira de módulo: o contrato de gerar link fica no `Cloudflare`
  (`FileServiceInterface::createPresignedDownloadUrl`), e os outros módulos o
  usam por interface.

## Texto para colar na sessão nova

> Leia `.ai-workbench/019-midia-protegida/HANDOFF.md`. Vamos continuar a spec
> da mídia protegida: rode a skill `refinar` a partir da seção "Perguntas para
> o refinar", gravando as decisões em
> `.ai-workbench/019-midia-protegida/decisoes.md` (comece copiando para lá as
> "Decisões já tomadas" do handoff). Uma pergunta por vez, começando pelo login
> do paciente.
