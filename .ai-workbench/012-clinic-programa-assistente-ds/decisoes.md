# Decisões · Assistente de programa no DS v2 (novo e editar)

## Sessão 2026-10-27

Ponto de partida: o protótipo A, "Três etapas"
(`resources/js/pages/clinic/program/program-builder-prototype/`), escolhido em
2026-10-18 (commit 811f7a7). O pedido: novo e editar são a mesma tela; editar
abre com os dados do programa.

Respondido pelo código (sem pergunta):

- **Onde vive** → sem módulo novo. Dono do dado: `TreatmentProgram`. SPA em `pages/clinic/program/`.
- **Quem pode** → `TreatmentPlanPolicy::create` e `update` liberam todos os papéis da clínica; o isolamento entre clínicas é do repositório. Não muda.
- **Hoje, seis entradas no assistente** → (1) Novo programa vazio; (2) Novo pelo prontuário (`?patientId=`); (3) "Usar em novo programa" num exercício; (4) "Usar modelo"; (5) Editar programa (`/clinica/programas/:id/editar`, hoje `ProgramEditPage` v1); (6) "Usar em novo modelo" e "Editar modelo" (`asModel`, hoje só v1). De 1 a 4 o protótipo já aparece com `?variant=A`, mas o salvar é simulado.
- **Edição apaga histórico** → `TreatmentPlanService::update` apaga todos os exercícios do programa e recria (`$plan->exercises()->delete()`); `clinic_treatment_plan_execution_series.treatment_plan_exercise_id` tem `cascadeOnDelete`, então as séries que o paciente já registrou somem. A v1 já faz isso.
- **Edição muda o status** → a v1 manda `status` = `active` com paciente e `draft` sem; editar um programa concluído ou arquivado o reativa.
- **Rascunho no servidor** → a v1 do novo salva rascunho automático em `program-drafts` (só no novo, fora de modelo); o protótipo não tem.
- **Bug do protótipo** → `fromIncoming` marca tudo como `isConfigured: true`; vindo de um exercício, a barra diz "1/1 com dose" e o card diz "Sem dose".

Decisões com o usuário:

- **Escopo** → as seis entradas passam para a tela nova, com salvar de verdade; `ProgramNewPage` v1, `ProgramEditPage`, o `?variant=` e os `Step*`/`EditExercisePanel` da v1 que ficarem sem uso saem.
- **Histórico do paciente ao editar** → preservar. O backend passa a atualizar o exercício que continua no programa (pelo `id` dele) em vez de apagar e recriar; só o exercício tirado do programa perde o histórico. Mudança em `TreatmentPlanService::update` com teste; o front manda o `id` de cada exercício que já existia.
- **Status ao editar** → editar não muda a situação. Única troca: rascunho que ganha paciente vira ativo (é o envio). Concluído e arquivado continuam como estão; reativar é ação do painel.
- **Trocar ou tirar o paciente na edição** → pode, como na v1. Trocar passa o programa para o outro paciente; tirar o paciente torna o programa rascunho (exceção à regra do status acima). As execuções já registradas guardam o `patient_id` de quem fez; o plano precisa garantir que o novo paciente não veja o que o anterior registrou.
- **Depois de salvar uma edição** → com paciente, sempre abre o diálogo de envio (link, WhatsApp, e-mail), como na v1; sem paciente, volta para o painel (programa) ou Meus modelos (modelo).
- **Diálogo de envio** (pelo código) → o `ShareDialog` do protótipo (DS) vira real com as funções de `application/clinic/program-share.ts` (copiar `shareUrl`, `programWhatsAppUrl`, `programMailtoUrl`) e a fase de erro da v1; `components/clinic/program/ProgramShareDialog.tsx` (shadcn) sai junto com a v1.
- **Rascunho automático no servidor** → mantém, como na v1: só no novo programa vazio ou pelo prontuário (nada de edição, modelo, exercício ou "Usar modelo"); faixa DS com Restaurar e Descartar no topo; some ao salvar.
- **Fluxo de modelo** → título "Novo modelo"/"Editar modelo"; a etapa 3 vira "Nome e mensagem" (só nome e mensagem padrão, sem paciente nem datas); botão "Salvar modelo"; volta para Meus modelos.
- **Editar pela URL** (técnico, sem pergunta) → editar programa e editar modelo carregam pelo `:id` da rota (`/clinica/programas/:id/editar`, o modelo com `?modelo=1`), não pelo `location.state`, para o F5 não perder a tela. As entradas 3, 4 e "Usar em novo modelo" continuam passando os dados pela navegação.
- **Voltar na etapa 1** (segue a tarefa 004 da feature 011) → volta para a origem: novo → Histórico; pelo prontuário → prontuário; editar → painel do programa; modelo → Meus modelos.
- **Sair com alteração não salva** → na edição (programa ou modelo), se mudou algo, modal DS "Descartar alterações?" (Voltar, navegação do topo e fechar a aba). No novo, sai direto: o rascunho automático guarda.
- **Etapa inicial e navegação** → editar (e entradas com dados) abre em "Montar e dosar"; com exercício no programa, clicar nos números 1-2-3 do `DsSteps` vai direto para a etapa (novo e edição).
- **Datas** → no novo, início nunca antes de hoje. Na edição, o início original pode ficar mesmo se já passou; trocar só para hoje em diante. Término sempre ≥ início.
- **Exercício de outra clínica** → corrigido nesta feature: criar e editar só aceitam `exercise_id` visível para a clínica (`Exercise::scopeVisibleToClinic`, via contrato público do módulo Admin); senão 422. Teste do caso "outra clínica". Hoje o `exists:admin_exercises,id` aceita exercício privado de qualquer clínica.
- **Exercício sem dose** → mantém o backend (`addExercise` completa com séries, repetições e descanso do catálogo). Na tela, o exercício entra já com a dose do catálogo pré-preenchida, e o aviso diz que usa a dose padrão do exercício, não "só o vídeo". Para isso o `Exercise` do front (e a API da biblioteca da clínica) precisa trazer `sets`, `repetitions` e `restTime`. Corrige junto o bug do "1/1 com dose" vindo de exercício.
- **Link do paciente ao trocar de paciente** (decidido no `escrever-plano`) → quando o `patient_id` muda (troca ou remoção), o backend gera um `public_token` novo e o link antigo passa a dar 404. O link público não pede login e usa o paciente atual do plano; sem isso, o paciente antigo veria as cargas do novo e registraria séries em nome dele.
- **Status no backend** (decidido no `escrever-plano`) → o assistente não manda `status` no `PUT`; o service aplica a regra (rascunho + paciente → ativo; sem paciente → rascunho; senão mantém).
- **Critérios de sucesso** → os seis caminhos salvam de verdade e caem no destino certo; editar um programa com séries registradas mantém o histórico dos exercícios que ficaram; outra clínica recebe 404 no editar e 422 com exercício alheio; v1 apagada e sem `?variant=` no assistente; testes PHPUnit e Vitest; smoke no navegador (desktop e celular) com evidência.

### Fora do escopo

- Programas do painel admin (`/admin/programas`).
- Área/subárea e duração do programa (a API aceita, a tela não mostra hoje).
- Mudanças visuais além do protótipo A.

## Sessão 2026-10-28 (revisão adversária)

- **Rascunho que já tinha o paciente, salvo de novo com ele** → vira ativo (envio). Decidido pelo agente na rodada 2 da revisão, seguindo as decisões "rascunho que ganha paciente vira ativo (é o envio)" e "com paciente, sempre abre o diálogo de envio": sem isso o diálogo mostrava "Programa enviado" com um link que dá 404 (o link público não abre rascunho). Substitui a correção da rodada 1 (R1 casos-de-borda 013), que deixava esse rascunho como rascunho. **Confirmar com o usuário.**
- **Tirar o paciente pela tela** → o seletor de paciente ganhou a opção "Nenhum paciente (vai para Meus modelos)": o seletor de escolha única não deixava limpar, então a decisão "tirar o paciente na edição" era impossível pela tela.
- **Dose do atalho ("3 × 12")** → grava máximo igual ao mínimo; o backend completa a dose por par (nunca faixa invertida) e recusa mínimo acima do máximo.
