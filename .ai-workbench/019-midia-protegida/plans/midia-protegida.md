# Mídia protegida

Data: 2026-11-16
Fonte: `decisoes.md` desta pasta (conversa de direção e sessão do `refinar` de 2026-11-16), `HANDOFF.md` e levantamento do código.

## Problema

Todo vídeo, capa, imagem de referência e foto do sistema tem um endereço fixo no `cdn-dev.ivsmed.com`. Quem abre um vídeo no fisioweb pode copiar esse endereço ("copiar endereço do vídeo") e mandar para qualquer pessoa: ele abre fora do sistema, sem login, para sempre. Com esses endereços, alguém consegue baixar a biblioteca de exercícios inteira. A foto do paciente, que é dado pessoal, também fica aberta para quem tiver o endereço.

## Solução

Nenhum arquivo tem mais endereço público. O bucket fica fechado, e cada tela recebe, a cada abertura, um endereço assinado que vence: 30 minutos para vídeo e capa de vídeo, 5 minutos para imagem de referência, foto e PDF. Um endereço copiado para de abrir logo depois.

Para quem usa, a tela continua igual:

- O vídeo mostra a capa e só é baixado inteiro quando a pessoa aperta play. Depois disso ele toca da memória: o paciente pode pausar, fazer as séries e voltar horas depois sem travar.
- Se o endereço vencer antes de o arquivo carregar, a tela pede um novo sozinha.
- O player não tem botão de download nem menu de botão direito.
- A página do programa do paciente continua abrindo sem login pelo link do WhatsApp e pelo QR do PDF. Risco aceito: quem recebe esse link encaminhado vê os vídeos daquele programa.

## Histórias de Usuário

1. Como dono da biblioteca de exercícios, quero que nenhum vídeo tenha endereço que funcione fora do sistema, para que ninguém copie a biblioteca.
2. Como fisioterapeuta, quero ver os vídeos da biblioteca da clínica tocando como hoje, para montar programas sem perceber diferença.
3. Como fisioterapeuta, quero ver a capa de cada vídeo na biblioteca sem esperar baixar o vídeo, para a lista abrir rápido.
4. Como fisioterapeuta, quero que o vídeo só seja baixado quando eu apertar play, para a biblioteca não pesar na internet da clínica.
5. Como fisioterapeuta, quero ver as imagens de referência de um exercício na biblioteca e no envio de exercício, como hoje.
6. Como fisioterapeuta que enviou um exercício, quero ver a prévia do vídeo, da capa e das imagens que enviei, para conferir antes da aprovação.
7. Como fisioterapeuta, quero ver os vídeos e as capas no detalhe, no histórico e nos modelos de programa, como hoje.
8. Como operador do painel admin, quero ver e revisar vídeos, capas e imagens de referência do catálogo, das propostas de mídia e dos programas modelo, como hoje.
9. Como operador do painel admin, quero comparar a mídia atual e a proposta de uma clínica (ADR 029) com as duas abrindo por endereço que vence.
10. Como paciente, quero abrir meu programa pelo link do WhatsApp ou pelo QR do PDF e ver os vídeos, sem precisar de login.
11. Como paciente, quero pausar o vídeo, fazer a série e voltar depois sem o vídeo travar ou dar erro.
12. Como paciente, quero que, ao reabrir o programa no dia seguinte, os vídeos toquem normalmente.
13. Como paciente com internet lenta, quero que o vídeo continue carregando mesmo se demorar mais do que o prazo do endereço.
14. Como dono da clínica, quero que um endereço de vídeo copiado da página do paciente pare de abrir em até 30 minutos.
15. Como dono da clínica, quero que o player não ofereça botão de baixar nem menu de botão direito.
16. Como fisioterapeuta, quero ver minha foto e a dos colegas no menu, na lista de usuários e no formulário de usuário, como hoje.
17. Como paciente, quero ver a foto do meu fisioterapeuta no cabeçalho do programa, como hoje.
18. Como fisioterapeuta, quero ver a foto dos pacientes na lista, na agenda, no dashboard e na edição do paciente, como hoje.
19. Como paciente, quero que minha foto não tenha endereço público, para que ela não circule fora da clínica.
20. Como clínica, quero enviar e remover foto de usuário e de paciente como hoje, com a foto nova aparecendo logo depois.
21. Como fisioterapeuta, quero gerar o PDF do programa com as imagens dos exercícios e a foto do profissional, como hoje.
22. Como paciente, quero que o QR do PDF continue levando à página do meu programa.
23. Como clínica, quero que o endereço do programa do paciente nunca vá para um serviço de fora do sistema, nem quando o QR falha.
24. Como clínica B, nunca quero receber endereço de vídeo, capa, imagem ou foto privada da clínica A.
25. Como paciente, nunca quero que a página do meu programa traga mídia de exercício de outro programa.
26. Como operador, quero que o domínio `cdn-dev.ivsmed.com` deixe de servir qualquer arquivo, para não sobrar porta aberta.
27. Como desenvolvedor, quero que o código não tenha mais como gerar endereço público de arquivo, para que ninguém reabra a porta sem perceber.
28. Como desenvolvedor, quero que o seed grave só caminhos de arquivo, para o banco recriado já nascer no formato novo.

## Decisões de Implementação

### Dono do link assinado

- O módulo **Cloudflare** é o dono. Ganha um contrato público pequeno, só de leitura assinada por tipo de mídia (vídeo, imagem). Os prazos (vídeo 30 min, imagem 5 min) ficam nele, num lugar só. Por dentro, ele usa o `createPresignedDownloadUrl` que já existe. Os outros módulos dependem só da interface.
- Prontuário e Finanças continuam como estão (5 min, já usam link assinado).
- O `FileServiceInterface` perde tudo o que produz endereço público: `getFileUrl`, `getFileCdnUrl` e os campos `url`/`cdn_url` do retorno de `uploadFile`, `uploadFromPath` e `uploadMultipleFiles`. Saem também a configuração `cloudflare.cdn_url` e o `url` do disco `r2`.

### Dados (migration, sem conversão)

O banco de dev pode ser recriado, então não há conversão de dado antigo. Cada migration só apaga ou cria colunas, no módulo dono da tabela.

| Tabela (módulo) | Sai | Fica ou entra |
|---|---|---|
| `media_videos` (Media) | `url`, `cdn_url`, `thumbnail_url` | `path`, `thumbnail_path` (já existem) |
| `metadata.reference_images` e `proposed_reference_images` do vídeo (Media) | `cdn_url` de cada item | `file_path` |
| `admin_exercise_media` (Admin) | `cdn_url` | `file_path` (já existe) |
| `clinic_users` (Clinic) | `photo_url` | `photo_path` (nova) |
| `patients` (Patient) | `photo_url` | `photo_path` (nova) |
| `clinic_patient_files` (ClinicalRecord) | `cdn_url` (já nulo) | `file_path` |
| `clinic_financial_attachments` (ClinicFinance) | `cdn_url` | caminho que já existe |

Os seeders (`VideoSeeder`, `ExerciseSeeder`, `ClinicUserSeeder`, `PatientDatabaseSeeder`) gravam só o caminho.

### Contrato das respostas

- **Nenhum endpoint novo e nenhuma rota muda.** O link assinado vai junto da resposta que já mostra a mídia. Os nomes que o front já lê continuam:
  - vídeo: `video_url` e `thumbnail_url`, os dois com link assinado de 30 min. Os vídeos deixam de expor `path`, `url`, `cdn_url` e `thumbnail_path`;
  - imagem de referência: `url` (5 min), com `file_path` escondido, tanto em `admin_exercise_media` quanto nos itens de `reference_images` e `proposed_reference_images` dentro do `metadata` do vídeo. O `metadata` não sai mais cru: a serialização troca cada item pelo link assinado e tira `file_path`, `proposed_thumbnail_path` e qualquer outro caminho;
  - fotos: `photo_url` (5 min) ou `null`, com `photo_path` escondido.
- Os models que são serializados direto (`Video`, `ExerciseMedia`, `ClinicUser`, `Patient`) ganham um campo calculado que assina o caminho na hora da serialização, e as colunas de caminho ficam em `$hidden`, como o `PatientFile` já faz. Lugares que montam a resposta à mão também assinam: o mapper do programa do paciente, o `DashboardRepository`, o `SchedulingReadService` (contrato público da agenda) e o `VideoService` (propostas). Assim o link sai do mesmo jeito em qualquer resposta que carregue o model, inclusive em relação carregada junto.
- Troca registrada: o model passa a resolver o assinador do container na serialização. A alternativa, API Resource para cada endpoint, mexia em dezenas de controllers. O ADR desta feature registra essa troca.

### Permissões e isolamento

- **Nenhuma regra de acesso muda.** Quem recebe um link assinado é exatamente quem já recebia o endereço fixo: a mesma rota, a mesma Policy, o mesmo filtro. O que muda é o que vai na resposta.
- Clínica: o `clinic_id` continua vindo da clínica do usuário autenticado (guard `clinic`), nos Repositories que já filtram (`Exercise::scopeVisibleToClinic` na biblioteca, busca de vídeo por dono no Media, pacientes e usuários por clínica). O plano não cria query nova. Os testes provam que o link de mídia privada da clínica A não aparece em nenhuma resposta da clínica B: biblioteca, vídeo enviado e pendente, foto de usuário, foto de paciente, agenda e dashboard.
- Paciente (sem login): `GET /api/patient/programs/{publicToken}` continua sem login, e o `public_token` é a única chave. O mapper só assina a mídia dos exercícios daquele programa. Teste: a resposta só traz a mídia dos exercícios daquele programa, e um token inexistente devolve 404 como hoje (o `public_token` é único no sistema; a rota não tem clínica).
- Admin (guard `admin`): continua vendo tudo o que já via, agora com link assinado.

### Telas (SPA)

- **Baixar sem o JWT.** O `apiClient` põe `Authorization` em toda chamada, inclusive com URL absoluta, e o R2 recusa link assinado com esse cabeçalho. O vídeo é baixado por um cliente próprio do armazenamento em `infrastructure/`, sem interceptor e sem token, como o `viaCepClient` já faz para uma API de fora. O `apiClient` continua sendo o único caminho para a API do fisioweb. A skill `api-client` registra a exceção.
- **Vídeo protegido** (componente compartilhado, usado na clínica, no admin e no paciente): mostra a capa e, no play, baixa o vídeo inteiro pelo link assinado e toca como `blob:`. Libera o `blob:` ao desmontar, usa `controlsList="nodownload"` e bloqueia o menu de contexto. Se o download responde 403 (link vencido), pede o link novo à tela, que refaz a query que trouxe o vídeo, e tenta uma vez. Substitui o `<video src>` do `VideoThumb` e os `<iframe src>` das páginas do paciente.
- **Imagem protegida** (capa, imagem de referência, foto): `<img src>` com o link assinado. Se não carregar, pede o link novo uma vez, refazendo a query dona. Fica sem `blob:`, porque a decisão de esconder o endereço vale para o vídeo.
- O domínio do front não muda de nome (`videoUrl`, `thumbnailUrl`, `photoUrl`). Os mappers da `infrastructure/` passam a ler `video_url` no lugar de `cdn_url ?? url`.
- Sessão (menu e cabeçalho): a foto do usuário logado vem do `me`. Se a foto não carregar, a imagem protegida pede o `me` de novo.

### PDF do programa

- Geração continua síncrona. As imagens dos exercícios e a foto do profissional vão para o template com link assinado de 5 min, gerado na hora de montar o PDF, e o dompdf baixa na hora (`isRemoteEnabled` continua).
- O QR continua apontando para a página do programa. Sai o fallback do `api.qrserver.com`: se a geração local do QR falhar, o PDF sai sem QR e o erro vai para o log, sem o token.

### Cloudflare (painel, fora do código)

- Tirar o domínio próprio `cdn-dev.ivsmed.com` do bucket `ivsdev`, com o `r2.dev` desligado. O bucket fica sem leitura pública.
- CORS do bucket: `GET` para as origens do app, além do `PUT` que o upload já usa. O CORS não protege nada aqui (quem protege é a assinatura), então pode abrir para as portas sorteadas das worktrees do `fisio-app`.
- A regra de WAF do ADR 027 perde o objeto quando o domínio sai. O ADR 027 registra isso.

### Arquitetura

- O ADR 029 muda o formato dos itens de `reference_images` (sai `cdn_url`): registrar a nota no ADR 029.
- ADR novo (030): mídia privada, sem endereço público; link assinado por tipo com prazo; serialização pelo model; vídeo baixado como `blob:` por cliente sem JWT; página do paciente sem login como risco aceito.
- Teste de arquitetura: nenhum código de produção chama `getFileCdnUrl`/`getFileUrl` (os métodos deixam de existir) nem cita o host do CDN.

## Fatias Verticais

1. **Vídeos e capas privados na clínica.** Contrato de link assinado no Cloudflare; `media_videos` sem `url`, `cdn_url` e `thumbnail_url`; upload e confirmação do vídeo gravam só o caminho; `Video` serializa `video_url` e `thumbnail_url` assinados; seed só com caminho; cliente de armazenamento e componentes de vídeo e imagem protegidos; biblioteca, envio de exercício, detalhe, histórico, montagem e modelos de programa da clínica. Para nenhuma tela quebrar entre as fatias, esta já troca **todos** os leitores do vídeo (mappers do admin e mapper do programa do paciente) para `video_url`/`thumbnail_url`: o link assinado toca direto no `<video src>` e no `iframe` até as fatias 2 e 4 trocarem o player.
2. **Painel admin.** Catálogo, detalhe e edição de vídeo, revisão de exercício e propostas de mídia (ADR 029), programas modelo do admin, todos com vídeo e imagem protegidos.
3. **Imagens de referência.** `admin_exercise_media` sem `cdn_url`; `reference_images` e `proposed_reference_images` só com `file_path`; sincronização (`ExerciseReferenceImageSyncService`) sem endereço; serialização assinada na clínica e no admin.
4. **Área do paciente.** O mapper do programa assina vídeo e capa; `iframe` e `VideoThumb` trocados pelo vídeo protegido; o link é renovado ao vencer; teste de outro programa e de outra clínica.
5. **Foto do profissional.** `clinic_users.photo_path` no lugar de `photo_url`; upload e remoção; `ClinicUser` serializa `photo_url` assinado; menu, lista e formulário de usuário, sessão (`me`) e cabeçalho do programa do paciente.
6. **Foto do paciente.** `patients.photo_path` no lugar de `photo_url`; upload e remoção; lista de pacientes, edição, dashboard (`DashboardRepository`), agenda (`SchedulingReadService`) e a foto na área do paciente.
7. **PDF do programa.** Imagens e foto por link assinado na montagem do PDF; fim do fallback `api.qrserver.com`.
8. **Fechar a porta.** `FileServiceInterface` sem endereço público; `cdn_url` sai de `clinic_patient_files` e `clinic_financial_attachments`; `cloudflare.cdn_url` e o `url` do disco saem; teste de arquitetura; ADR 030 e atualização do ADR 027; skill `api-client`; roteiro do painel Cloudflare (tirar o domínio, CORS) para o usuário executar.

## Testes

- Rodam com `php artisan test --filter=...`, `vendor/bin/phpunit modules/<Modulo>/tests`, `npm run test` e `bash bin/verificar.sh`.
- Padrões copiados: `modules/ClinicalRecord/tests/Feature/PatientFileSignedLinkTest.php` e `modules/ClinicFinance/tests/Feature/FinanceAttachmentTest.php` (link assinado com prazo, `actingAs($user, 'clinic')`, factories, `RefreshDatabase`); `modules/Cloudflare/tests/Unit/CloudflareR2PresignedDownloadTest.php` (assinatura e prazo no Cloudflare); `tests/Architecture/ModuleBoundaryTest.php` (fronteira); `resources/js/test/patient-area-v2-pages.test.tsx` (páginas do paciente com `vi.mock` do repositório).
- Comportamentos que o usuário pediu como teste:
  - **Nenhum endereço fixo sai:** nenhuma resposta de biblioteca, vídeo, admin, programa do paciente, usuário, paciente, agenda e dashboard traz o host do CDN, `cdn_url`, `path` ou `photo_path`; os links trazem assinatura e prazo; as colunas antigas não existem mais.
  - **Outra clínica não recebe:** a clínica B não recebe link de vídeo pendente ou privado, foto de usuário nem foto de paciente da clínica A; o programa de um paciente não traz mídia de outro programa; token inexistente dá 404.
  - **Vídeo não trava (front):** com o download devolvendo 403, o componente pede link novo e toca; o `blob:` é liberado ao desmontar; o vídeo não é baixado antes do play; o player tem `nodownload` e bloqueia o menu de contexto.
  - **Prazo certo por tipo:** vídeo e capa com 30 min, imagem de referência e foto com 5 min.
- Também: papel sem permissão continua recebendo 403 como hoje nas rotas de foto e de vídeo (regressão); o PDF sai com imagem e QR, e sem chamada ao `api.qrserver.com` quando o QR local falha.

## Fora do Escopo

- Login do paciente na página do programa (decidido: continua sem login).
- Impedir gravação de tela.
- Fase 2: Cloudflare Stream e marca d'água com o nome da clínica.
- Desligar o `r2.dev` ou apagar o bucket antigo `fisioweb`, na outra conta Cloudflare: tarefa do usuário.
- Bloqueio do `/log-viewer` no `infra/`.
- Copiar os vídeos e capas do bucket antigo para o `ivsdev`.
- Mudar o Prontuário e as Finanças, que já usam link assinado (só sai a coluna `cdn_url` sobrando).

## Notas

- Os vídeos e capas do seed não existem no `ivsdev` (404). Para o smoke test, envie um vídeo pela tela da clínica ou copie arquivos de teste para o bucket.
- O R2 não tem permissão por arquivo: o `visibility => public` do disco não fecha nem abre nada. Quem deixa o bucket público é o domínio próprio, por isso a porta só fecha de verdade na fatia 8, quando o domínio sai do painel Cloudflare.
- Os prazos e o "vídeo baixado no play" partem de vídeos de exercício pequenos (uns 5 MB no seed). Vídeo grande ficaria pesado na memória do celular; se aparecer, é sinal para a fase 2 (Stream).
