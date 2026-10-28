# Menu ⋯ com as seis ações, duplicar abrindo a cópia e excluir voltando ao Histórico

**Tipo:** História
**Plano:** `../plans/clinic-programa-detalhe-ds.md`
**Histórias:** 21, 22, 23, 24, 25, 26, 27, 28, 29, 37
**Issue:** ainda não criada

## Descrição

O menu ⋯ do protótipo só tem Duplicar, Transformar em modelo e Excluir
rascunho. A v1 também tinha Baixar PDF e Texto para prontuário, e o usuário
decidiu que nada se perde. Além disso, dentro do programa, duplicar e excluir
precisam levar a pessoa para outro lugar, o que no Histórico não acontece.

A abordagem é reaproveitar as ações reais do Histórico (`useProgramHistoryActions`)
e dar a elas um jeito de reagir ao sucesso. No detalhe, essa reação navega; no
Histórico, o comportamento continua igual.

## O que construir

- O menu ⋯ do topo traz, nesta ordem: Copiar link, Baixar PDF, Texto para
  prontuário, Duplicar, Transformar em modelo, Excluir rascunho.
- Copiar link fica desabilitado, com o motivo, no rascunho e no programa sem
  paciente.
- Excluir rascunho só aparece em rascunho. Fica desabilitado, com "Só o admin
  da clínica pode excluir.", para fisioterapeuta e secretária, igual ao
  Histórico. A Policy (`TreatmentPlanPolicy`, admin via `Gate::before`)
  continua sendo quem decide de verdade.
- Duplicar, quando dá certo, navega para `/clinica/programas/<id da cópia>`. A
  API já devolve a cópia no envelope `data`.
- Excluir rascunho, depois do modal de confirmação, navega para
  `/clinica/programas/historico`.
- No Histórico, duplicar e excluir continuam só com o toast e a lista
  atualizada, sem navegar.
- Sem endpoint novo e sem mudança no backend. O 404 de outra clínica em
  duplicate, to-model, PDF e delete já tem teste.

## Critérios de Aceite

- [x] O menu ⋯ do detalhe mostra as seis ações na ordem decidida; Excluir aparece só em rascunho.
- [x] Copiar link copia o `shareUrl`; fica desabilitado no rascunho e sem paciente.
- [x] Baixar PDF baixa o PDF; Texto para prontuário copia o texto.
- [x] Duplicar navega para a cópia e mostra o toast.
- [x] Transformar em modelo mostra o toast e continua no programa.
- [x] Excluir rascunho (admin) pede confirmação, exclui e volta ao Histórico.
- [x] Fisioterapeuta e secretária veem Excluir desabilitado, com o motivo.
- [x] No Histórico, duplicar e excluir continuam sem navegar (o teste do Histórico continua verde).
- [x] Os testes Vitest da página cobrem o menu, a regra de papel, a navegação depois de duplicar e a de excluir.
- [x] Um usuário de outra clínica não vê nem altera nada (as ações devolvem 404, e a tela nem abre).
- [x] Definição de Pronto cumprida (`docs/ai-harness/DEFINITION_OF_DONE.md`), menos a revisão adversária, que o usuário roda manualmente; `verificar.sh` com Prettier e Vitest falhando por itens que já existiam na branch (ver `DEFERRED.md`)

## Depende de

- `001-painel-do-programa-e-corte` (painel do programa v2 de verdade e corte da v1).

## Notas de Implementação

- **Branch:** `feat/clinic-programa-detalhe-ds`
- **Exemplo no código:** `ProgramHistoryActions` (o `run`, o `ProgramActionsMenu` e o modal de excluir) e a página v1 que está saindo (ela navegava ao Histórico depois de excluir).
- **Skills:** `design-system`, `frontend-react`, `frontend-testing`, `security`, `qa-navegador`

## Como testar na mão

1. Entre como admin da clínica A, abra um programa enviado e confira as cinco ações no ⋯ (sem Excluir).
2. Copie o link e cole: abre o programa do paciente. Baixe o PDF. Copie o texto.
3. Duplique: a URL muda para a cópia.
4. Abra um rascunho e exclua: depois de confirmar, volta ao Histórico.
5. Entre como fisioterapeuta e abra um rascunho: Excluir aparece desabilitado, com o motivo.
6. No Histórico, duplique um programa: continua na lista.
