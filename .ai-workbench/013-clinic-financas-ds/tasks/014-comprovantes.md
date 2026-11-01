# Comprovantes no lançamento

**Tipo:** História
**Plano:** `../plans/clinic-financas-ds.md`
**Histórias:** 6, 49, 50, 51, 52, 53
**Issue:** ainda não criada

## Descrição

Não há onde guardar o recibo de um lançamento. A abordagem é uma tabela de comprovantes no `ClinicFinance`, arquivos no R2 numa pasta por clínica, e acesso só por link assinado depois de conferir a clínica — nunca por URL pública de CDN (a API não devolve URL pública; o CDN bloqueia a pasta de Finanças por uma regra de WAF, ver ADR 026).

## O que construir

- Migration em `ClinicFinance`: `clinic_financial_attachments` (clínica, lançamento, caminho no R2, nome original, tipo, tamanho, quem enviou). Sem `cdn_url`.
- Rotas (administrador e secretária): `GET /transactions/{id}/attachments`, `POST` multipart com `files[]`, `GET .../attachments/{attachmentId}/url` → `{ url, expires_at }` (link assinado de poucos minutos) e `DELETE .../attachments/{attachmentId}`.
- Validação no backend: JPG, PNG, WEBP, HEIC ou PDF; até 10 MB cada; no máximo 5 por lançamento. Upload síncrono.
- `Cloudflare`: `FileServiceInterface` ganha o método de link de download assinado (já existe o de upload assinado). O caminho começa pela clínica.
- Lançamento na lixeira: comprovantes inacessíveis (404); restaurar traz de volta. O arquivo no R2 fica.
- A listagem traz `attachments_count`. Modal: área de anexos (abrir, remover, enviar; câmera no celular).

## Critérios de Aceite

- [x] Tipo recusado, arquivo de mais de 10 MB e o 6º arquivo → 422 (testes)
- [x] O link assinado só é gerado para a própria clínica; outra clínica → 404 (teste)
- [x] A API não devolve URL pública, e nenhuma resposta traz o caminho no R2 como campo; o único lugar em que o caminho aparece é a URL do link assinado de 5 minutos (testes, com o link assinado num formato realista que contém o caminho). O arquivo fica no bucket que o CDN serve, num caminho não adivinhável (uuid, extensão pelo tipo do conteúdo), e o nome do download leva a extensão do tipo gravado. Decisão do usuário na revisão adversária de 2026-11-01.
- [ ] Regra de WAF no Cloudflare bloqueando a pasta de Finanças no domínio do CDN (ADR 026, decisão 6), com `r2.dev` desligado e a lista de `curl` da decisão 6 dando 403 em todas as linhas. **Pré-requisito de deploy, ainda não criada nem conferida** (configuração do Cloudflare, não código; o usuário vai criar).
- [x] O caminho gravado começa pela clínica (teste)
- [x] Lançamento na lixeira → comprovante 404; restaurado → volta (teste)
- [x] `FileServiceInterface` trocado por mock nos testes (padrão do `PatientFileControllerTest`)
- [x] Modal: enviar, abrir e remover; mensagem de tipo/tamanho/quantidade (Vitest)
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade (teste com duas clínicas)
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), com smoke headless (desktop e celular) e evidência em `evidence/014-comprovantes/`

## Depende de

- `006-lancar-editar-excluir` (Lançar, editar e excluir)
- `010-configuracoes-saldo-lixeira` (lixeira com restaurar)

## Notas de Implementação

- **Branch:** `feat/clinic-programa-assistente-ds` (a 013 é feita na mesma branch da 012, decisão do usuário)
- **Exemplo no código:** `modules/ClinicalRecord/app/Services/PatientFileService.php`, `modules/ClinicalRecord/tests/Feature/PatientFileControllerTest.php`, `modules/Cloudflare/app/Contracts/FileServiceInterface.php`
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-clean-code`, `security`, `php-testing`, `design-system`, `frontend-testing`

## Como testar na mão

1. Clínica A, secretária, no celular: abrir um lançamento, tirar foto do recibo, enviar.
2. Abrir o comprovante: abre pelo link assinado; o link expira em poucos minutos.
3. Tentar o 6º arquivo: aparece o limite.
4. Excluir o lançamento: o comprovante não abre; restaurar: abre de novo.
5. Clínica B, pela API, o `url` do comprovante da A → 404.
