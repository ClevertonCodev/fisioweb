# Ações reais do Histórico

**Tipo:** História
**Plano:** `../plans/clinic-historico-exercicios-programas.md`
**Issue:** ainda não criada

## Descrição

Os cartões do Histórico v2 ainda não gravam o que a v1 já grava. Esta fatia
liga o rodapé (link, PDF, texto do prontuário) e o ⋯ (duplicar, transformar
em modelo, excluir rascunho) nas APIs que já existem, com confirmação e regra
de papel na exclusão.

## O que construir

- **Atalhos do rodapé:** copiar link de acesso (quando há paciente), baixar
  PDF, copiar texto do prontuário — mesmos serviços da v1.
- **Menu ⋯:** componente `DsActionsMenu` mínimo no DS (catálogo
  `/design-system` com o essencial). Itens: Duplicar, Transformar em modelo,
  Excluir rascunho (só se for rascunho).
- **Excluir:** modal de confirmação com o título. Só admin da clínica
  dispara o `DELETE`. Fisioterapeuta e secretária veem o item desabilitado
  com o motivo (ADR 017). Backend: Policy já existente + 404 se outra clínica.
- **Donos:** `TreatmentProgram` (PDF, duplicate, to-model, destroy). Guard
  `clinic`. Sem migration, sem fila nova (PDF já existe).
- Isolamento: a tela só opera ids da listagem da clínica; a API recusa o
  resto.

## Critérios de Aceite

- [ ] Copiar link, PDF e texto do prontuário chamam os mesmos fluxos da v1
      e mostram toast de sucesso ou erro (teste).
- [ ] Duplicar chama a mutação e invalida a lista (teste).
- [ ] Transformar em modelo chama a mutação; o item passa a aparecer em
      Meus modelos (teste ou smoke).
- [ ] Excluir rascunho pede modal; confirma só para admin; outros papéis
      veem desabilitado e não disparam o `DELETE` (teste).
- [ ] Programa ativo não mostra Excluir (teste).
- [ ] Usuário de outra clínica recebe 404 ao duplicar, virar modelo, excluir
      ou baixar PDF de um plano alheio (PHPUnit existente ou novo, se faltar).
- [ ] Fisioterapeuta recebe 403 no `DELETE` (PHPUnit).
- [ ] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`)

## Depende de

- `001-casca-e-historico-em-cartoes` (cartões e casca no ar)

## Notas de Implementação

- **Branch:** `feat/clinic-historico-exercicios-programas`
- **Exemplo no código:** `ProgramHistoryTab` (mutações e toasts);
  `downloadProgramPdf`; `formatProgramClinicalRecordText`; atalho desabilitado
  da lista de pacientes (ADR 017).
- **Skills:** `design-system`, `frontend-testing`, `php-testing`, `security`.
- `DsActionsMenu` só o que Histórico (e depois Meus modelos) precisam.

## Como testar na mão

1. Clínica Cleverton, admin. Num cartão: copiar link, baixar PDF, copiar texto.
2. Duplicar: aparece a cópia. Transformar em modelo: vai a Meus modelos.
3. Excluir um rascunho: modal com o título; confirma e some.
4. Entrar como fisioterapeuta: Excluir desabilitado, tooltip de só admin.
5. Clínica Start: não opera programa da Cleverton.
