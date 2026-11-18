# Deferido · 019 Mídia protegida

Itens achados na conferência de 2026-11-17 que não entraram nas correções.

## A decidir

- **Foto do profissional no cabeçalho do programa do paciente.** A API manda
  `professional_photo_url` (`PatientProgramResponseMapper.php:29`), mas
  `PatientProgramDetailPage.tsx` só mostra nome e CREFITO. Já era assim na
  `main`. A tarefa 006 cita esse lugar: decidir se a tela passa a mostrar a foto
  (com `ProtectedImage`) ou se o campo sai da resposta.
- **Foto do seed entre tabelas.** `ClinicUserSeeder` e `PatientDatabaseSeeder`
  usam o mesmo objeto (`patients/photos/2cc94b05…png`). Trocar ou remover foto
  agora só apaga o arquivo quando nenhum registro **da mesma tabela** usa o
  caminho. Se todos os profissionais do seed tirarem a foto, o último apaga o
  arquivo que os pacientes do seed ainda usam. Só acontece no banco de dev;
  conserto: o seed do profissional apontar para um objeto em
  `clinic-users/photos/`.
- **Tirar o domínio `cdn-dev.ivsmed.com` do bucket — é a única proteção que
  falta, e é manual.** O smoke de 2026-11-17 mostrou
  `https://cdn-dev.ivsmed.com/videos/<arquivo>` abrindo com 200, sem login.
  Todo link assinado entregue pela API leva o caminho do arquivo em claro, e o
  `filename`/`original_filename` também. Então tirar o `filename` da resposta
  **não fecha nada**: enquanto o domínio existir, qualquer link assinado vira um
  endereço permanente. O único conserto é o passo 1 de
  `docs/operacao/cloudflare-fechar-leitura-publica.md`, no painel da Cloudflare.
  Depois dele, o `filename` na resposta deixa de importar.
- **403 por papel nas rotas de foto do paciente.** `PatientPolicy::update`
  devolve `true` para qualquer papel da clínica, então nenhum papel recebe 403
  ali. O critério da tarefa 007 supõe uma regra de papel que não existe.

## Conferir no smoke

- **iOS Safari no primeiro play.** O `video.play()` roda depois do download
  assíncrono, fora do gesto do usuário. O Safari pode recusar o primeiro toque.
- **Renovação só no 403.** Se a resposta de erro do R2 vier sem cabeçalho CORS,
  o axios vê erro de rede e o player mostra erro em vez de pedir link novo.

## Riscos aceitos

- **Upload com `visibility: public`.** `CloudflareR2Service` ainda passa
  `public` no upload. O R2 ignora (ADR 030); fica só o sinal errado no código.

## Da revisão adversária (2026-11-17)

- **Upload de foto fora do service deixa arquivo órfão** (rodada 2, achado
  005, REAL-FORA-DO-ESCOPO: já era assim na `main`). `PatientController` e
  `ClinicUserController` sobem o arquivo e só depois chamam `replacePhoto`. Se a
  gravação falhar, o arquivo novo fica no bucket sem dono; dois uploads ao mesmo
  tempo leem a mesma foto anterior e o arquivo do primeiro nunca é apagado.
  Conserto: `replacePhoto` recebe o `UploadedFile`, sobe e apaga o novo se a
  gravação falhar.
- **2026-11-17 (revisão adversária, rodada 6, ACHADO-004) · Programa novo a partir de modelo com exercício desativado não recupera a mídia.**
  No montador de um programa ainda não salvo, a origem (`useProgramItemMedia`)
  devolve `null`, e `GET /api/clinic/exercises/{id}` dá 404 para exercício
  desativado pelo admin. Depois do prazo do link (capa 5 min, vídeo 30 min), a
  capa e o vídeo desse exercício somem até recarregar a página. Salvar esse
  programa já é recusado (`ensureExercisesVisibleToClinic`). Conserto: no
  programa novo vindo de modelo, usar o modelo de origem como `ItemMediaSource`.
