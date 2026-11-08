# `generate-text` só com modelo do sistema ou da própria clínica

**Tipo:** Bug
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 42, 43
**Issue:** ainda não criada

## Descrição

Hoje o `POST /api/clinic/evolutions/{id}/generate-text` monta o texto com qualquer item de modelo de evolução do banco. O fisio da clínica A lê o texto dos modelos privados da clínica B percorrendo ids (achado Médio `clinicalrecord/evolution-generate-text/template-items-cross-clinic`). O salvar já tem a regra certa; o `generate-text` não usa.

## O que construir

- O `generate-text` passa a receber a clínica e valida os `checked_item_ids` com a mesma regra do salvar:
  - modelo do sistema ou da clínica, ativo e não arquivado;
  - exceção do ADR 021: valem os itens que já estavam marcados no rascunho daquela evolução.
- Fora disso, 422 com a mesma mensagem do update, sem devolver texto.
- Sem migration. Sem mudança no SPA.

## Critérios de Aceite

- [ ] Item de modelo privado de outra clínica dá 422 e não devolve o texto (o teste `AuditEvolutionGenerateTextTest` da auditoria, invertido)
- [ ] Item do sistema dá 200
- [ ] Item da própria clínica dá 200
- [ ] Item arquivado que já estava marcado no rascunho dá 200
- [ ] Item arquivado que não estava marcado dá 422
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já.

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/ClinicalRecord/app/Services/EvolutionService.php` (a validação de modelo e itens do create e do update)
- **Skills:** `backend-clean-code`, `php-testing`

## Como testar na mão

1. Como fisio da clínica A, abra uma evolução em rascunho e gere o texto com os itens do modelo: funciona como antes.
2. Pela API, mande o id de um item de um modelo privado da clínica B: deve dar 422.
