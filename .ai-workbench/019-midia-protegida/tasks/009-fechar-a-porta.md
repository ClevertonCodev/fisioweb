# Fechar a porta: sem endereço público no código, ADRs e roteiro do Cloudflare

**Tipo:** Tarefa
**Plano:** `../plans/midia-protegida.md`
**Histórias:** 1, 24, 26, 27, 28
**Issue:** ainda não criada

## Descrição

Depois das tarefas 001 a 008, nenhuma tela usa mais endereço público, mas o código ainda sabe gerar um: o `FileServiceInterface` tem `getFileUrl` e `getFileCdnUrl` e devolve `url`/`cdn_url` no upload, e a configuração ainda tem o host do CDN. O bucket também continua público pelo domínio próprio `cdn-dev.ivsmed.com`, porque o R2 ignora o `visibility`. Esta tarefa tira essa possibilidade do código, registra a decisão e entrega ao usuário o passo do painel Cloudflare que fecha o bucket de verdade.

## O que construir

- O `FileServiceInterface` e o serviço do R2 perdem `getFileUrl`, `getFileCdnUrl`, a geração de endereço do CDN e os campos `url`/`cdn_url` dos retornos de `uploadFile`, `uploadFromPath` e `uploadMultipleFiles`. Os chamadores que sobraram (inclusive o comando de teste de upload e o serviço de foto do `Media`) são ajustados.
- Saem a configuração `cloudflare.cdn_url` e o `url` do disco `r2`, e a variável sai do `.env.example`.
- Migrations: `clinic_patient_files.cdn_url` (módulo `ClinicalRecord`) e `clinic_financial_attachments.cdn_url` (módulo `ClinicFinance`) saem.
- Teste de arquitetura: nenhum código de produção chama `getFileCdnUrl`/`getFileUrl` nem cita o host do CDN.
- ADR 030: mídia privada, sem endereço público; link assinado por tipo com prazo; serialização pelo model; vídeo baixado como `blob:` por cliente sem JWT; página do paciente sem login como risco aceito; fim do fallback do QR externo.
- Notas no ADR 027 (a regra de WAF perde o objeto quando o domínio sai) e no ADR 029 (itens de `reference_images` sem `cdn_url`).
- Skill `api-client`: a exceção do cliente de armazenamento, que é sem JWT e só para link assinado do R2.
- Roteiro do painel Cloudflare para o usuário executar: tirar o domínio próprio `cdn-dev.ivsmed.com` do bucket `ivsdev`, conferir o `r2.dev` desligado e liberar `GET` no CORS para as origens do app (incluindo as portas das worktrees). Com o comando que prova que um caminho conhecido deixou de abrir.

## Critérios de Aceite

- [ ] `getFileUrl` e `getFileCdnUrl` não existem mais, e os retornos de upload não têm `url` nem `cdn_url`.
- [ ] `cloudflare.cdn_url` e o `url` do disco `r2` não existem mais.
- [ ] As colunas `clinic_patient_files.cdn_url` e `clinic_financial_attachments.cdn_url` não existem mais, e `migrate:fresh --seed` roda sem erro.
- [ ] O teste de arquitetura passa e falha se alguém reintroduzir `getFileCdnUrl` ou o host do CDN.
- [ ] Prontuário e Finanças continuam abrindo arquivo por link assinado (regressão).
- [ ] ADR 030 escrito, com notas nos ADRs 027 e 029, e a skill `api-client` atualizada.
- [ ] Roteiro do Cloudflare entregue ao usuário, com o comando de prova.
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-video-e-capa-com-link-assinado` até `008-pdf-do-programa-com-midia-assinada`.

## Notas de Implementação

- **Branch:** `feat/midia-protegida`
- **Exemplo no código:** o `ModuleBoundaryTest` (teste de arquitetura por varredura de código) e o ADR 027 (roteiro de painel Cloudflare com comando de prova).
- **Skills:** `architecture-paradigm-modular-monolith`, `domain-modeling` (ADR), `php-testing`, `api-client`.
- A troca no painel Cloudflare é do usuário. Até ela acontecer, um caminho conhecido ainda abre pelo CDN, e a tarefa deixa isso dito no fim.

## Como testar na mão

1. `bash bin/verificar.sh` e `migrate:fresh --seed`.
2. Abra um arquivo do prontuário e um comprovante de Finanças: abrem pelo link assinado.
3. Depois de o usuário tirar o domínio no Cloudflare: `curl -sI https://cdn-dev.ivsmed.com/<caminho de um vídeo>` não devolve mais 200.
