# Responder avaliação vira Ficha e laudo

**Tipo:** História
**Plano:** `../plans/clinic-prontuario-formularios-ds.md`
**Histórias:** 15, 16, 17, 18, 27, 28, 29
**Issue:** ainda não criada

## Descrição

A rota de editar avaliação ainda é v1 com interruptor de protótipo. A
Ficha e laudo (C) é stub ao salvar e tem atalho `?rascunho=` e botão de
PDF que não existe. Esta fatia promove a C, grava e assina, e tira o
que era de mentira.

## O que construir

- **Tela:** `/clinica/pacientes/:id/avaliacoes/:assessmentId/editar` é a
  C em todos os ambientes: formulário de um lado, folha do outro; no
  celular, abas Preencher e Laudo. Sem `?variant=` e sem `?rascunho=`.
- **Gravar:** “Salvar rascunho” e “Assinar” pelos hooks que já existem.
  Assinada, a tela vira só a folha.
- **PDF:** o botão some.
- **404:** avaliação inexistente ou de outra clínica, como hoje.
- **Saída:** pasta `assessment-answer-prototype` e a v1 da página.

## Critérios de Aceite

- [x] A rota mostra a Ficha e laudo, sem barra de protótipo (teste).
- [x] Salvar rascunho chama o update com as respostas (teste).
- [x] Assinar chama o sign; depois a tela é só a folha e os campos não editam (teste).
- [x] Não existe “Baixar PDF” nem `?rascunho=` (teste / grep).
- [x] Avaliação de outra clínica ou id inexistente: 404 (teste).
- [x] Avaliação de outro paciente da mesma clínica: 404, sem laudo (teste).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: o drawer da 009 já abre esta rota. Melhor depois da 002 para o
  fluxo “Responder agora” cair na ficha nova.

## Notas de Implementação

- **Branch:** `feat/clinic-prontuario-formularios-ds`
- **Exemplo no código:** `assessment-answer-prototype/` (VariantC);
  `AssessmentEditPage` (update + sign da v1).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`.

## Como testar na mão

1. Abra uma avaliação rascunho. Preencha, salve, recarregue: o texto continua.
2. Assine. A tela vira a folha. Não há PDF.
3. Clínica B no mesmo id: 404.
