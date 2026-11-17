# Decisões · Mídia protegida

## Sessão 2026-11-16 (conversa de direção, copiada do HANDOFF.md)

- **Qual é o medo?** → Os dois: compartilhar o link com gente de fora e baixar ou copiar a biblioteca. Gravar a tela é aceito.
- **Esconder o link no código basta?** → Não. Tocar como `blob:` é só reforço; a proteção de verdade é o link não funcionar fora da sessão de quem pediu.
- **Onde ficam os arquivos?** → Tudo privado no R2: vídeos, capas, imagens de referência, fotos do profissional e do paciente, e PDFs. Nada tem endereço público permanente; para abrir, o arquivo passa por link assinado gerado na hora só para quem tem permissão.
- **E o PDF do programa?** → Sem vídeo, sem endereço de arquivo e sem link ou QR por exercício. Fica só o QR do programa, que leva à página do programa; a proteção está nessa página, que passa a exigir autenticação para mostrar os vídeos.
- **Em que ordem?** → Fase 1: fechar a porta (tudo privado, link assinado, login). A fase 2 (Cloudflare Stream e marca d'água) só entra se ainda houver cópia depois da fase 1.

### Fora do escopo

- Impedir gravação de tela.
- Fase 2: Cloudflare Stream e marca d'água com o nome da clínica.
- Login do paciente na página do programa (decidido em 2026-11-16 na sessão do refinar, abaixo).
- Desligar o `r2.dev` ou apagar o bucket antigo `fisioweb` (outra conta Cloudflare): tarefa do usuário.
- Bloqueio do `/log-viewer` no `infra/`.

### Notas para o plano

- O `apiClient` põe `Authorization` nas chamadas; o download do link assinado do R2 não pode levar esse cabeçalho (o R2 recusa assinatura em dobro). O plano decide como baixar o `blob:` sem `fetch` solto, respeitando a regra do `apiClient`.
- O PDF do programa embute imagens e foto: o servidor lê o arquivo do disco R2 (ou gera link assinado) na hora de montar, porque o dompdf não tem mais URL pública.
- Testes de isolamento: link assinado só para a clínica dona do arquivo e, na área do paciente, só para a mídia do programa daquele `public_token`.

## Sessão 2026-11-16 (refinar)

- **Login do paciente para ver os vídeos?** → Não. A página do programa (`/{slug}/paciente/programas/{public_token}`, QR do PDF e link do WhatsApp) continua abrindo sem login, como hoje; a fase 1 só tira o endereço público dos arquivos, e a mídia do paciente sai em link assinado curto para quem tem o `public_token`. Risco aceito: quem recebe o link do programa encaminhado ainda assiste aos vídeos dele. (Substitui, na decisão sobre o PDF do programa, o trecho "a página passa a exigir autenticação para mostrar os vídeos".)
- **Prazo do link assinado** → Curto: vídeo e capa de vídeo 30 min; imagem de referência, foto e PDF 5 min. O usuário temia o vídeo vencer no meio da série do paciente; isso fica coberto pelo jeito de tocar (próxima decisão), não por prazo longo. Prazo de 1 ou 2 dias foi descartado porque um link copiado abriria fora do sistema esse tempo todo.
- **Como a tela toca o vídeo** → A tela baixa o vídeo inteiro pelo link assinado e toca como `blob:` (vídeos de exercício são pequenos, uns 5 MB). Depois de baixado, pausar e voltar horas depois não depende do link. Reabrir a página pede link novo; se o link vencer antes de terminar de baixar, a tela pede outro sozinha. Sem botão de download (`controlsList="nodownload"`) e sem menu de botão direito no player. Critério: o paciente nunca vê erro de acesso no meio do exercício.
- **Fotos do profissional e do paciente** → As duas ficam privadas, com link assinado de 5 min. A foto do paciente é dado pessoal (LGPD). Telas de lista (agenda, pacientes, dashboard) recebem o link assinado de cada foto na própria resposta da lista, sem uma chamada por foto.
- **QR do programa** → Continua como está: aponta para `APP_URL/{slug}/paciente/programas/{public_token}` e abre sem login (consequência da decisão sobre o login do paciente). Como o `public_token` passa a ser a única chave da página, ele não vai mais para serviço externo: sai o fallback do `api.qrserver.com` em `ProgramPdfQrCodeGenerator.php`.
- **Domínio `cdn-dev.ivsmed.com`** → Desligar o acesso público do bucket (tirar o domínio próprio). Sem endereço público não sobra nada para bloquear, e os links assinados usam o endpoint S3, não o CDN. A regra de WAF do ADR 027 perde o objeto; registrar no ADR.
- **Colunas com URL pública** (`cdn_url`, `url`, `thumbnail_url`, `photo_url`) → Parar de gravar e de devolver, guardar só o caminho do arquivo no bucket e apagar as colunas por migration. Onde ainda não há coluna de caminho (as fotos em `clinic_users` e `patients` só têm `photo_url`), a migration cria. Sem conversão de dado antigo: o banco de dev pode ser recriado. Os models escondem o que sobrar de campo de arquivo, como o prontuário faz hoje (`$hidden`).
- **Painel admin** (catálogo e revisão de vídeo) → Também usa link assinado, pela regra "tudo privado".
- **Delegação** → O usuário pediu explicação em linguagem simples e aceitou as recomendações técnicas (prazo, jeito de tocar, CDN, colunas, admin) depois de explicadas.


## Sessão 2026-11-16 (escrever-plano, ataque ao plano)

- **Testes que o usuário quer garantidos** → Nenhum endereço fixo sai; outra clínica não recebe link de mídia da clínica A (e o programa de um paciente não traz mídia de outro); vídeo não trava (link vencido é renovado e o vídeo baixado toca depois de pausa longa); prazo certo por tipo (vídeo 30 min, imagem e foto 5 min).
- **QR do PDF quando a geração local falha** → O PDF sai sem o QR e o erro vai para o log, sem o token. Nada vai para serviço de fora (sai o `api.qrserver.com`).
