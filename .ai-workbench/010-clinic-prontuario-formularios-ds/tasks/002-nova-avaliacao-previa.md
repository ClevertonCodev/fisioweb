# Nova avaliação vira a Prévia

**Tipo:** História
**Plano:** `../plans/clinic-prontuario-formularios-ds.md`
**Histórias:** 10, 11, 12, 13, 14, 27, 28, 29
**Issue:** ainda não criada

## Descrição

`/clinica/pacientes/:id/avaliacoes/nova` ainda troca v1 e protótipo com
`?variant=`. “Enviar link” não faz nada. “Responder agora” no protótipo
é stub. Esta fatia deixa só a Prévia B, gravando ao começar.

## O que construir

- **Tela:** a rota é a B em todos os ambientes: lista por área, modelo
  indicado pelo diagnóstico, prévia com campos de verdade, índice das
  seções. Sem barra de protótipo e sem v1 desta rota.
- **Prévia:** mexer nos campos não grava. “Responder agora” cria a
  avaliação vazia e abre a rota de editar.
- **Enviar link:** some.
- **Papel:** secretária não chega aqui pelo prontuário (botão
  desabilitado). A rota continua protegida no backend como hoje.
- **Saída:** pasta `assessment-new-prototype` e a v1 da página.

## Critérios de Aceite

- [x] Em qualquer ambiente a rota mostra a Prévia B, sem `?variant=` e sem v1 (teste da página).
- [x] Mexer na prévia não chama create (teste).
- [x] “Responder agora” chama create e navega para a ficha deste paciente (teste).
- [x] Não existe botão “Enviar link” (teste).
- [x] Secretária no prontuário não abre a rota (teste da 009).
- [x] Um usuário de outra clínica não vê nem altera nada desta funcionalidade
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- Nada: pode começar já. A ficha de verdade entra na 003; até lá a
  navegação cai na tela de editar que existir.

## Notas de Implementação

- **Branch:** `feat/clinic-prontuario-formularios-ds`
- **Exemplo no código:** `assessment-new-prototype/` (VariantB, shared);
  `AssessmentNewPage` (`handleRespond` da v1).
- **Skills:** `design-system`, `frontend-ddd`, `frontend-testing`.

## Como testar na mão

1. Admin, paciente com diagnóstico de lombar. Nova avaliação.
2. A lista já destaca o modelo lombar. Mexa na prévia; recarregue: nada foi criado.
3. Responder agora: nasce a avaliação e abre a ficha.
4. Confira que não há “Enviar link”.
5. Clínica B no mesmo paciente: 404.
