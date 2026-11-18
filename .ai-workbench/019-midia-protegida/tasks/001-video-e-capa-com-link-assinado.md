# Vídeo e capa com link assinado no servidor

**Tipo:** História
**Plano:** `../plans/midia-protegida.md`
**Histórias:** 1, 2, 7, 14, 24, 28
**Issue:** ainda não criada

## Descrição

Hoje o vídeo e a capa guardam no banco um endereço fixo do CDN (`url`, `cdn_url`, `thumbnail_url`), que sai em toda resposta e abre fora do sistema para sempre. Esta tarefa troca o endereço fixo por um link assinado gerado a cada resposta, que vale 30 minutos.

Ela é a base das outras. O contrato de link assinado nasce aqui, e todos os leitores do vídeo (clínica, admin e paciente) passam a ler o campo novo. O player ainda é o de hoje, que toca o link assinado direto no `<video src>` e no `iframe`, para nenhuma tela quebrar até as tarefas seguintes trocarem o player.

## O que construir

- O módulo `Cloudflare` ganha um contrato público de leitura assinada por tipo de mídia: vídeo (30 min) e imagem (5 min), com os prazos num lugar só. Por dentro, ele usa o `createPresignedDownloadUrl` que já existe. Os outros módulos dependem só da interface.
- Uma migration do módulo `Media` apaga `url`, `cdn_url` e `thumbnail_url` de `media_videos`. Não há conversão: o banco de dev pode ser recriado. Ficam `path` e `thumbnail_path`.
- O upload, a confirmação, a troca de capa e a aprovação de proposta de vídeo gravam só o caminho.
- O `Video` serializa `video_url` e `thumbnail_url` assinados (30 min, `thumbnail_url` nulo sem capa) e esconde `path` e `thumbnail_path`.
- O seed de vídeos grava só o caminho.
- Os mappers da clínica, do admin e do programa do paciente leem `video_url` no lugar de `cdn_url ?? url`. O domínio do front continua com `videoUrl` e `thumbnailUrl`.
- Nenhuma rota nova e nenhuma regra de acesso muda. O link vai na resposta que já mostrava o vídeo, com a mesma Policy, o mesmo guard e o mesmo filtro por `clinic_id`, que vem da clínica do usuário autenticado.
- O `metadata` do vídeo ainda vai cru nesta tarefa. Quem trata as imagens de referência dentro dele é a tarefa 004.

## Critérios de Aceite

- [x] As colunas `url`, `cdn_url` e `thumbnail_url` não existem mais em `media_videos`, e `migrate:fresh --seed` roda sem erro.
- [x] As respostas de vídeo da clínica, do admin e do programa do paciente trazem `video_url` e `thumbnail_url` com assinatura e prazo de 30 min, e não trazem `url`, `cdn_url`, `path`, `thumbnail_path` nem o host do CDN.
- [x] O contrato de leitura assinada devolve 30 min para vídeo e 5 min para imagem (teste no Cloudflare).
- [x] O upload e a confirmação de vídeo, pela clínica e pelo admin, continuam funcionando e gravam só o caminho.
- [x] As telas de vídeo da clínica, do admin e do paciente continuam tocando o vídeo (com o player atual).
- [x] A clínica B não recebe link de vídeo pendente ou privado da clínica A.
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [x] Um paciente não vê nem altera nada de outro paciente
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/midia-protegida`
- **Exemplo no código:** o serviço de arquivos do prontuário no `ClinicalRecord` (link assinado e caminho em `$hidden`) e os testes `PatientFileSignedLinkTest` e `CloudflareR2PresignedDownloadTest`.
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-clean-code`, `laravel-eloquent`, `php-testing`, `frontend-ddd`, `frontend-testing`.
- Troca registrada no plano: o model resolve o assinador do container na serialização, em vez de um API Resource por endpoint. O ADR 030 (tarefa 009) registra a troca.
- Os vídeos do seed não existem no bucket `ivsdev` (404). Para o smoke test, envie um vídeo pela tela da clínica.

## Como testar na mão

1. `migrate:fresh --seed` e login como `admin` da clínica A.
2. Envie um exercício com vídeo e capa. Na resposta da biblioteca, `video_url` e `thumbnail_url` trazem assinatura e prazo, e não há `cdn_url`.
3. O vídeo toca na biblioteca, no detalhe do programa, no admin e na página do programa do paciente.
4. Como clínica B, o vídeo pendente da A não aparece em nenhuma resposta.
