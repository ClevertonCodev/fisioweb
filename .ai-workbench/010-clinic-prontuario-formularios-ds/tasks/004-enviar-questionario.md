# Enviar questionário vira Escolher e prever

**Tipo:** História
**Plano:** `../plans/clinic-prontuario-formularios-ds.md`
**Histórias:** 19, 20, 21, 22, 23, 27, 28, 29
**Issue:** ainda não criada

## Descrição

“Enviar questionário” ainda abre o sheet da v1. O protótipo A não grava
e mistura modelos de exemplo. Esta fatia promove a gaveta A, envia só
pelo celular, e mostra Copiar / WhatsApp / E-mail com o token.

## O que construir

- **Tela:** overlay v2 no prontuário: cartões dos modelos ativos da
  clínica (último envio a este paciente), prévia das perguntas, prazo
  em chips. Só modalidade remoto. Sem “Aqui na clínica”. Sem
  `demo-data`.
- **Envio:** POST que já existe. No sucesso, Copiar, WhatsApp e E-mail
  com o `share_url` (token, não id), iguais à 009.
- **Criar novo:** navega para `/clinica/questionarios/novo?returnTo=`
  (essa tela continua protótipo).
- **Papel:** os três papéis enviam, como hoje.
- **Saída:** `QuestionnaireFormSheet` no prontuário e pasta
  `new-questionnaire`.

## Critérios de Aceite

- [x] “Enviar questionário” abre a gaveta A (não o sheet v1) (teste).
- [x] Enviar chama a API com `modality=remoto` e o passo Pronto mostra Copiar / WhatsApp / E-mail com o `share_url` de token (teste).
- [x] Não existe “Aqui na clínica” nem modelos de `demo-data` (teste / grep).
- [x] Sem telefone, WhatsApp desabilitado; sem e-mail, E-mail desabilitado (teste).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já. O `share_url` já vem da 009 / tarefa 002.

## Notas de Implementação

- **Branch:** `feat/clinic-prontuario-formularios-ds`
- **Exemplo no código:** `new-questionnaire/` (VariantA); teste atual
  de share no `PatientRecordPage.test.tsx`; `ProgramShareDialog`.
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`,
  `security`.

## Como testar na mão

1. Admin, paciente com telefone e e-mail. Enviar questionário remoto.
2. No sucesso, copie o link (tem o token). WhatsApp e e-mail abrem com o mesmo endereço.
3. Paciente sem telefone: WhatsApp desabilitado.
4. Secretária consegue enviar.
5. Clínica B: 404 no prontuário; POST nesse id não grava.
