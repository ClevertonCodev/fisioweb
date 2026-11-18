# ADR: Mídia sem endereço público, só com link assinado que vence

**Status:** aceito em 2026-11-16 (feature 019).

## Contexto

Vídeo, capa, imagem de referência, foto de profissional, foto de paciente,
arquivo do prontuário e comprovante viviam no mesmo bucket R2. Vários deles
tinham um endereço fixo no domínio `cdn-dev.ivsmed.com`, gravado em coluna
(`url`, `cdn_url`, `thumbnail_url`, `photo_url`). Quem copiava o endereço abria
o arquivo fora do sistema, sem login, para sempre. O R2 ignora o `visibility`
do disco: o que abre o bucket para o mundo é o domínio próprio, não a flag do
Laravel.

O link assinado do comprovante e do prontuário (ADR 026 e ADR 027) já existia,
mas o domínio público continuava servindo o resto, e a regra de WAF só cobria
`clinics`+`finances` e `patients`+`files`.

## Decisão

1. **Nenhum arquivo tem endereço público no código.** `FileServiceInterface`
   não tem `getFileUrl` nem `getFileCdnUrl`. `uploadFile`, `uploadFileAs`,
   `uploadFromPath` e `uploadMultipleFiles` devolvem caminho, nome, tipo e
   tamanho, nunca `url` nem `cdn_url`. Saíram `cloudflare.cdn_url`, o `url` do
   disco `r2` e `CLOUDFLARE_CDN_URL` do `.env.example`. As colunas públicas
   saíram de `media_videos`, `admin_exercise_media`, `clinic_patient_files`,
   `clinic_users` e `patients`. `clinic_financial_attachments` já não tinha
   `cdn_url`; continua sem.
2. **O prazo depende do tipo.** `SignedMediaUrlInterface`: vídeo e capa, 30
   minutos (`forVideo`); imagem, foto e arquivo que não é vídeo, 5 minutos
   (`forImage`). O link é gerado na hora, em memória, e não é gravado.
3. **Quem serializa é o model.** `Video`, `ExerciseMedia`, `ClinicUser` e
   `Patient` resolvem o assinador ao virar array (`video_url`, `thumbnail_url`,
   `photo_url`). A alternativa, um API Resource em cada endpoint, mexia em
   dezenas de controllers. `photo_url` só aparece quando a consulta trouxe
   `photo_path`: uma lista que seleciona só `id` e `name` não ganha foto nula.
   O `metadata` do vídeo não sai cru: `VideoMetadataPresenter` troca cada imagem
   pelo link assinado e esconde caminho, proposta e chave de upload. O admin
   que precisa da proposta usa `toAdminArray()`, ainda sem caminho.
4. **O vídeo baixa como `blob:`.** O player pede o arquivo pelo link assinado
   por `downloadProtectedMedia` (`resources/js/application/protected-media.ts`),
   que usa o `storageClient`, um axios sem interceptor e sem `Authorization` — o R2 recusa o link se o JWT
   for junto. O `<video>` recebe um `blob:` que o componente revoga ao sair, com
   `controlsList="nodownload"` e sem menu de contexto. O `blob:` vale para o
   arquivo, identificado pelo caminho do link sem a assinatura: cada resposta
   traz uma assinatura nova para o mesmo vídeo, e trocar de vídeo no mesmo
   player baixa o novo. Imagem usa o link direto e, se der erro, pede um link
   novo uma vez.
5. **A página do paciente sem login é risco aceito.** Quem tem o link do
   programa abre o vídeo enquanto o link assinado vale (30 minutos a partir da
   resposta). Não há sessão de paciente nessa página. O QR do PDF é gerado no
   processo (`chillerlan/php-qrcode`); não há fallback para um gerador externo.
6. **O teste de arquitetura** `tests/Architecture/NoPublicMediaUrlTest` varre o
   código de produção, a config, as rotas, as views, o `infra/` e o
   `.env.example`, e falha com `getFileCdnUrl`, `getFileUrl`, `generateCdnUrl`,
   `cdn_url`, `CLOUDFLARE_CDN_URL`, `Storage::disk(...)->url(`, `*.r2.dev`,
   `api.qrserver.com` ou um host `cdn*.ivsmed.com`. Os outros módulos usam só
   `Modules\Cloudflare\Contracts\` (`ModuleBoundaryTest`).
7. **Fechar o bucket é passo de painel**, fora do código:
   `docs/operacao/cloudflare-fechar-leitura-publica.md`. Até ele rodar, um
   caminho conhecido ainda abre pelo domínio, e todo link assinado entregue
   leva o caminho do arquivo: tirar o caminho da resposta não fecha nada
   enquanto o domínio existir.

## Consequências

- Copiar o endereço do vídeo no player copia um `blob:` que não abre em outra
  aba. Copiar o link assinado da rede abre o arquivo só até o prazo.
- A capa usa o prazo de vídeo (30 minutos), o mesmo do `video_url`, porque as
  duas saem juntas na serialização do vídeo.
- A regra de WAF do ADR 027 perde o objeto quando o domínio sair (nota naquele
  ADR). Os itens de `reference_images` não têm mais `cdn_url` (nota no ADR 029).
- O disco `r2` segue com `visibility` `public`. No R2 isso não abre nem fecha
  leitura; quem abre é o domínio próprio.

### Regras que agentes devem preservar

- Código de produção não cita `cdn-dev.ivsmed.com` nem chama `getFileUrl` ou
  `getFileCdnUrl`.
- Arquivo do bucket só sai por `SignedMediaUrlInterface` ou por
  `createPresignedDownloadUrl`. Coluna nova não guarda URL pública.
- Leitura do R2 no browser passa pelo `storageClient`, nunca pelo `apiClient`.
- `photo_url` não entra no array quando `photo_path` não foi selecionado.
