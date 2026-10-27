# 006 — Criar questionário (Banco de perguntas v2)

## Objetivo

Promover a variante C do protótipo para `/clinica/questionarios/novo` como tela
principal (sem `?variant=`), gravando via `POST /clinic/questionnaire-templates`
e voltando ao `returnTo` do prontuário.

## Critérios de aceite

- [x] Rota `/clinica/questionarios/novo` renderiza UI DS v2 (banco + roteiro + editor).
- [x] Salvar chama API real e navega para `returnTo` ou lista de pacientes.
- [x] Sem `PrototypeSwitcher` nem fallback v1 na página de novo.
- [x] Teste Vitest cobre adicionar do banco, salvar e navegação.
- [x] Smoke test com evidência em `evidence/006-criar-questionario-novo/`.

## Arquivos principais

- `resources/js/pages/clinic/questionnaire-template/QuestionnaireTemplateNewPage.tsx`
- `resources/js/pages/clinic/questionnaire-template/questionnaire-template-new/*`
- `resources/js/test/QuestionnaireTemplateNewPage.test.tsx`
