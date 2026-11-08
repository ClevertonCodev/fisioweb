# Arquivos do prontuário com link de 5 minutos e apagados do R2

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 50, 51, 52, 53
**Issue:** ainda não criada

## Descrição

Hoje o arquivo do prontuário sobe com visibilidade pública, e a API grava e devolve um `cdn_url` fixo. Como o bucket é servido em público (ADR 026), quem viu o link uma vez abre o laudo para sempre, mesmo depois de o arquivo ser apagado no sistema (ponto a validar `clinicalrecord/patient-files/public-permanent-cdn-url`). O comprovante de Finanças já resolve isso com link assinado.

## O que construir

- O upload passa a usar o caminho privado do serviço de arquivos, como o comprovante. Ele deixa de gravar e de devolver o `cdn_url`, e a coluna fica nula para os arquivos novos.
- Endpoint novo `GET /api/clinic/patients/{patient}/files/{file}/url` (`auth:clinic`):
  - busca o paciente e o arquivo da clínica, com 404 se forem de outra clínica;
  - devolve `{data: {url, expires_at}}`, com link assinado de 5 minutos e o nome de download pelo tipo gravado.
- O DELETE apaga o objeto no R2 depois do soft delete. Uma falha ao apagar é reportada e não desfaz a exclusão.
- SPA: a entidade de arquivo do paciente perde `cdnUrl`. O repository ganha a busca do link, e as telas do prontuário (aba de arquivos e "tudo") pedem o link ao abrir ou baixar.
- O ADR 027 ganha o item do WAF para `patients` + `files` e do `r2.dev` desligado. É passo manual, que vai para o checklist de deploy.
- A regra de papel no prontuário fica como está (fora do escopo, em `papeis-fora-do-escopo.md`).

## Critérios de Aceite

- [ ] A listagem e o upload não devolvem `cdn_url` (o teste `AuditPatientFilePublicUrlTest` da auditoria, invertido)
- [ ] O upload usa o caminho privado
- [ ] O link de 5 minutos funciona para a clínica dona
- [ ] O link do arquivo ou do paciente de outra clínica dá 404
- [ ] O DELETE chama a remoção do objeto, e uma falha nela não quebra a exclusão
- [ ] Abrir o arquivo na tela pede o link e abre (teste Vitest)
- [ ] O ADR 027 tem o item novo de WAF
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/ClinicFinance/app/Services/FinancialAttachmentService.php` (`signedUrl` e o upload privado); a rota `transactions/{id}/attachments/{attachmentId}/url` de ClinicFinance; `resources/js/pages/clinic/patient/patient-record/parts.tsx`
- **Skills:** `backend-clean-code`, `php-testing`, `api-client`, `frontend-ddd`, `design-system`, `frontend-testing`, `qa-navegador`

## Como testar na mão

1. No prontuário de um paciente de teste, envie um PDF e clique para abrir: ele abre por um link com assinatura, que vence em 5 minutos.
2. Apague o arquivo e confira no R2 (ou no fake) que o objeto saiu.
3. Como usuário de outra clínica, peça o link pela API: deve dar 404.
