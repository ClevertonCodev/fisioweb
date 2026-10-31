# ADR: Editar programa não apaga o histórico do paciente, e trocar de paciente troca o link

## Contexto

O programa de exercícios (`clinic_treatment_plans`) tem grupos
(`clinic_treatment_plan_groups`) e exercícios (`clinic_treatment_plan_exercises`).
O paciente abre o programa por um link público (`public_token`, sem login) e
registra o que fez. Cada execução fica em `clinic_treatment_plan_executions`
(com o `patient_id` de quem fez), e cada série em
`clinic_treatment_plan_execution_series`, apontando para o exercício do
programa (`treatment_plan_exercise_id`, `cascadeOnDelete`).

Como estava até a feature 012:

- **Editar apagava o histórico.** `TreatmentPlanService::update` apagava todos
  os grupos e exercícios e criava de novo, com ids novos. Pelo cascade, as séries
  que o paciente registrou sumiam junto. Ajustar uma repetição zerava o
  histórico de execução daquele programa.
- **Trocar o paciente mantinha o link.** As rotas `patient/programs/{publicToken}`
  agem sempre como o paciente atual do plano: as cargas que mostram e as séries
  que gravam usam `$plan->patient_id`. Depois de uma troca, o paciente antigo,
  com o link no WhatsApp, via as cargas do novo e registrava séries em nome dele.
- **O status vinha da tela.** A tela mandava `active` com paciente e `draft` sem.
  Editar um programa concluído ou arquivado o reativava.

## Decisão

1. **A edição sincroniza grupos e exercícios por id, não apaga e recria.**
   - O `PUT /api/clinic/treatment-plans/{id}` aceita `id` em cada grupo e exercício que já existe.
   - Com `id`: atualiza no lugar (nome e ordem do grupo; grupo, ordem, dose, dias, período e notas do exercício). As séries ficam.
   - Sem `id`: cria. Série, repetição e descanso vazios recebem o padrão do catálogo, como antes.
   - Com `id`, vale o mesmo: série, repetição e descanso vazios voltam ao padrão do catálogo; dias, período, carga e notas vazios ficam vazios. Se o exercício saiu do catálogo (excluído pelo admin), a dose atual da linha faz o papel do padrão e a edição continua possível.
   - O padrão vale por par: mínimo e máximo vazios recebem o padrão; só um dos dois vazio copia o outro ("3 × 12" grava 3–3 séries e 12–12 repetições, nunca uma faixa invertida com o máximo do catálogo). Mínimo acima do máximo responde 422.
   - O que existia e não veio é **apagado**, levando só as séries dele. Diferente do ADR 021, aqui não se arquiva: tirar o exercício do programa é a decisão de não acompanhá-lo mais (escolha do usuário em 2026-10-27).
   - A ordem é o `sort_order` enviado ou, sem ele, a posição no payload (a tela manda a posição).
   - `id` que não pertence ao programa, `id` de exercício repetido no payload, ou `id` de exercício com outro `exercise_id`, responde 422 e nada muda. A checagem roda depois do 404 de outra clínica, para um `id` alheio nunca responder diferente de um programa inexistente.
   - Payload sem nenhum `id` continua aceito e se comporta como antes (tudo é criado), por compatibilidade da API.
2. **Trocar ou tirar o paciente gera link novo e zera o que era do anterior.** Quando o `patient_id` muda, o plano ganha `public_token` novo, e o antigo passa a responder 404. `patient_viewed_at` e `patient_completed_count`, que ficam na linha do plano, voltam a vazio e zero: o paciente novo não herda "visto" nem "concluído" do anterior. As execuções, séries e feedbacks guardam o `patient_id` de quem fez e continuam lá, filtrados por paciente. Editar sem mexer no paciente mantém o link e esses contadores.
3. **O status é decidido no backend.** Sem `status` no payload:
   - rascunho salvo com paciente vira ativo (é o envio: o assistente mostra o link na hora, e o link público não abre rascunho). Para o rascunho que já tinha o paciente, esta regra foi decidida na revisão adversária e aguarda confirmação do usuário (`decisoes.md` da feature 012, sessão de 2026-10-28);
   - tirar o paciente torna o programa rascunho;
   - no resto, a situação se mantém (concluído e arquivado não reativam).

   `status` explícito continua valendo.

## Consequências

- Benefícios:
  - O fisioterapeuta ajusta a dose sem apagar o que o paciente fez.
  - Um link nunca serve a dois pacientes.
  - A lista de ativos não ganha programas reativados por engano.
- Custos:
  - O update do service vira uma sincronização com validação de posse dos ids.
  - A tela de edição passa a mandar os ids.
  - O paciente antigo perde o link depois de uma troca (é o objetivo); o fisioterapeuta reenvia o link novo ao paciente novo.
- Regras que agentes devem preservar:
  - Nunca apagar e recriar exercícios de um programa existente para editar dose, ordem ou grupo.
  - Toda leitura ou escrita do paciente pelo link usa o `patient_id` atual do plano, e o link muda junto com ele. Dado do paciente guardado na linha do plano (visto, concluído) é zerado na troca.
  - Testes de feature: `TreatmentPlanUpdateKeepsHistoryTest` (histórico, ids alheios, outra clínica) e os de status e link da tarefa 002 da feature 012.

## Alternativas descartadas

- **Trocar a FK das séries para `restrictOnDelete`:** o "apaga e recria" passaria a falhar com erro de banco em todo programa com execução. Para de perder dado, mas quebra a edição.
- **Arquivar o exercício tirado (como o ADR 021):** guardaria o histórico de algo que o fisioterapeuta decidiu não acompanhar, e a tela do paciente teria que esconder arquivados. Ficou para depois, se alguém pedir.
- **Proibir trocar o paciente:** mais simples, mas o usuário quer poder reaproveitar um programa mandado para a pessoa errada.

## Relacionados

- [ADR 021](021-editar-modelo-de-evolucao-nao-apaga-historico.md): o mesmo problema no modelo de evolução.
- Feature `.ai-workbench/012-clinic-programa-assistente-ds/` (decisões e plano).
