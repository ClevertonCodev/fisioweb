# Proposta de mídia de exercício aprovado no backend, com ADR

**Tipo:** História
**Plano:** `../plans/correcoes-auditoria-controle-de-acesso.md`
**Histórias:** 29, 31, 35
**Issue:** ainda não criada

## Descrição

Depois que o operador aprova um exercício da clínica A, ele aparece para todas as clínicas. Hoje a A ainda troca a thumbnail e as imagens sem revisão, e a clínica B passa a ver as imagens novas, inclusive nos PDFs (achado Médio `admin/exercise-approval/owner-clinic-rewrites-approved-media`).

A decisão foi que a troca vira uma **proposta**: a mídia aprovada continua valendo para todos até o operador aprovar a nova. Esta tarefa faz o backend e o ADR. A tela da clínica é a 019, e a revisão do operador é a 020.

## O que construir

- **Contrato público do Admin:** "este vídeo está travado?", ou seja, ligado a pelo menos um exercício aprovado ou global. O Media consulta esse contrato sem importar model do Admin.
- **O Media guarda a proposta no `metadata` do vídeo:** `proposed_thumbnail_path`, `proposed_reference_images`, `proposed_at` e `proposed_by_clinic_user_id`. Sem migration.
- **Nas rotas de mídia da clínica:**
  - **vídeo travado:** o `confirm-upload` de thumbnail e o `PUT reference-images` gravam a proposta em vez de aplicar, e respondem com o mesmo envelope `data` mais `proposal_pending: true`;
  - **uma proposta nova** substitui a anterior;
  - **os pedidos de URL pré-assinada** continuam iguais;
  - **vídeo não travado:** tudo como hoje.
- **A listagem de exercícios da clínica** devolve `media_proposal_pending` só nos exercícios da própria clínica.
- **ADR 029 "Proposta de mídia em exercício aprovado":**
  - o Admin decide o que é travado, e o Media guarda a proposta;
  - o evento da 017 no lugar da chamada direta;
  - por que o exercício não volta para pendente.

## Critérios de Aceite

- [ ] Depois da aprovação, o `PUT reference-images` da clínica A grava a proposta, e a clínica B continua vendo as imagens antigas na listagem; as imagens do PDF não mudam (o teste `VerifierApprovedMediaWriteTest` da auditoria, invertido)
- [ ] A variante do vídeo pendente na aprovação: o thumbnail confirmado depois vira proposta, e a B continua vendo o antigo
- [ ] A segunda proposta substitui a primeira
- [ ] O vídeo de exercício não aprovado continua aplicando na hora
- [ ] A clínica B leva 404 nas rotas de mídia do vídeo da A
- [ ] `media_proposal_pending` só aparece para a clínica dona
- [ ] O ADR 029 foi escrito
- [ ] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `017-seletor-do-operador-e-sync-por-evento` (sincronização por evento).

## Notas de Implementação

- **Branch:** `feat/isolamento-clinicas-e-papeis` (a mesma branch e a mesma PR das tarefas 002 a 020)
- **Exemplo no código:** `modules/Media/app/Http/Controllers/ClinicVideoController.php` (`ensureOwnedVideo`); `modules/Media/app/Services/VideoService.php` (`confirmPresignedUpload`, `syncReferenceImages`)
- **Skills:** `architecture-paradigm-modular-monolith`, `backend-clean-code`, `php-testing`, `domain-modeling` (ADR)

## Como testar na mão

1. Com um exercício da clínica A já aprovado, chame pela API a troca das imagens de referência: a resposta traz `proposal_pending: true`.
2. Como clínica B, abra o exercício na biblioteca: as imagens são as antigas.
