# Assistente de programa no DS v2 (novo, editar e modelos)

Data: 2026-10-27
Fonte: `decisoes.md` desta feature (sessão 2026-10-27, `refinar` e `escrever-plano`) e a conversa

## Problema

Para montar ou ajustar um programa, o fisioterapeuta passa por duas telas
antigas e diferentes: a de novo programa e a de editar. O assistente v2 em três
etapas (protótipo A) já aparece no novo, mas o salvar dele é simulado. Editar
programa e criar/editar modelo ainda caem na v1, com outro visual.

Há também três problemas escondidos na hora de salvar:

- **Editar apaga o que o paciente fez.** Salvar uma edição apaga todos os
  exercícios do programa e cria de novo. As séries que o paciente já registrou
  somem junto, então ajustar uma repetição zera o histórico.
- **Editar reativa o que já acabou.** Salvar sempre grava "ativo" (com
  paciente) ou "rascunho" (sem paciente), e um programa concluído ou arquivado
  volta a ficar ativo.
- **Exercício privado de outra clínica entra no programa.** Basta montar a
  requisição na mão, e o vídeo aparece para o paciente.

## Solução

Uma tela só, o assistente v2 em três etapas (Exercícios → Montar e dosar →
Paciente e envio), atende as seis entradas e salva de verdade. Editar é a
mesma tela, aberta com os dados do programa. O fluxo de modelo usa a mesma tela
com a etapa 3 reduzida a "Nome e mensagem".

Na edição, o exercício que continua no programa mantém o histórico do
paciente. A situação do programa só muda quando o paciente muda. Trocar de
paciente gera um link novo. Exercício que a clínica não enxerga é recusado.

As seis entradas:

| # | De onde | Abre em | Salva como |
|---|---|---|---|
| 1 | "Novo programa" (Programas, botão + do topo, Início) | etapa 1, vazio, com rascunho automático | programa novo |
| 2 | "Novo programa" no prontuário (`?patientId=`) | etapa 1, paciente já escolhido na etapa 3, com rascunho automático | programa novo |
| 3 | "Usar em novo programa" num exercício | etapa 2, com o exercício | programa novo |
| 4 | "Usar modelo" | etapa 2, com grupos e doses do modelo | programa novo |
| 5 | "Editar" no painel do programa (`/clinica/programas/:id/editar`) | etapa 2, com tudo do programa | o mesmo programa |
| 6 | "Usar em novo modelo" num exercício / "Editar modelo" em Meus modelos (`/:id/editar?modelo=1`) | etapa 2 | modelo novo / o mesmo modelo |

## Histórias de Usuário

1. Como fisioterapeuta, quero criar um programa num assistente de três etapas, para escolher exercícios, dosar e enviar sem me perder.
2. Como fisioterapeuta, quero que "Novo programa" no prontuário já traga o paciente escolhido, para não procurar de novo.
3. Como fisioterapeuta, quero começar um programa a partir de um exercício da biblioteca, para não ter que achá-lo de novo no assistente.
4. Como fisioterapeuta, quero usar um modelo e já cair em "Montar e dosar" com os grupos e as doses do modelo, para só ajustar.
5. Como fisioterapeuta, quero editar um programa na mesma tela em que o criei, para não aprender duas telas.
6. Como fisioterapeuta, quero que a edição abra em "Montar e dosar", porque quase sempre vou ajustar dose.
7. Como fisioterapeuta, quero clicar nos números 1-2-3 do topo para ir direto a uma etapa, para trocar só a data sem passar pela dosagem.
8. Como fisioterapeuta, quero recarregar a página de edição (F5) sem perder a tela, porque ela abre pelo endereço do programa.
9. Como fisioterapeuta, quero que o exercício que eu adiciono já venha com a dose padrão do catálogo, para ver o que o paciente vai receber.
10. Como fisioterapeuta, quero que o aviso de "sem dose" diga que será usada a dose padrão do exercício, para não ser enganado com "só o vídeo".
11. Como fisioterapeuta, quero que a barra "X de Y com dose" bata com o que cada card mostra, para confiar no progresso.
12. Como fisioterapeuta, quero salvar um programa com paciente e ver o diálogo de envio com link, WhatsApp e e-mail funcionando, para mandar na hora.
13. Como fisioterapeuta, quero salvar sem paciente e o programa ir para Meus modelos, para usar depois.
14. Como fisioterapeuta, quero ver uma mensagem clara se salvar der erro, sem perder o que montei.
15. Como fisioterapeuta, quero que o novo programa guarde um rascunho automático e me ofereça Restaurar ou Descartar ao voltar, para não perder trabalho se a aba fechar.
16. Como fisioterapeuta, quero que o rascunho automático não apareça na edição, no modelo, nem vindo de exercício ou modelo, para não misturar trabalhos.
17. Como fisioterapeuta, quero editar a dose de um programa que o paciente já está fazendo sem apagar as séries que ele registrou, para continuar acompanhando a evolução.
18. Como fisioterapeuta, quero tirar um exercício do programa sabendo que só o histórico daquele exercício sai, para os outros continuarem intactos.
19. Como fisioterapeuta, quero que editar um programa concluído ou arquivado não o reative sozinho, para a lista de ativos não mentir.
20. Como fisioterapeuta, quero que um rascunho vire ativo quando eu escolho o paciente e salvo, porque isso é enviar.
21. Como fisioterapeuta, quero trocar o paciente de um programa na edição, para reaproveitar um programa mandado para a pessoa errada.
22. Como paciente, quero que, se o programa passar para outra pessoa, o meu link antigo pare de funcionar, para eu não ver nem registrar nada no programa de outro.
23. Como paciente novo de um programa trocado, quero não ver as cargas e séries de quem tinha o programa antes.
24. Como fisioterapeuta, quero tirar o paciente de um programa e ele virar rascunho, para não ficar "ativo" sem ninguém.
25. Como fisioterapeuta, quero que, depois de salvar uma edição com paciente, o diálogo de envio sempre abra, para reenviar o link se quiser.
26. Como fisioterapeuta, quero que, depois de salvar uma edição sem paciente, eu volte ao painel do programa (ou a Meus modelos, se for modelo).
27. Como fisioterapeuta, quero manter a data de início de um programa que começou no passado ao editar, mas não escolher outra data passada.
28. Como fisioterapeuta, quero que no novo programa o início nunca seja antes de hoje e o término nunca antes do início.
29. Como fisioterapeuta, quero que "Voltar" na etapa 1 me leve para onde eu estava (Histórico, prontuário, painel do programa ou Meus modelos).
30. Como fisioterapeuta, quero ser avisado com "Descartar alterações?" se sair da edição com mudanças não salvas (Voltar, menu do topo ou fechar a aba).
31. Como fisioterapeuta, quero sair do novo programa sem confirmação, porque o rascunho automático guarda.
32. Como fisioterapeuta, quero criar um modelo a partir de um exercício e editar um modelo na mesma tela, com título "Novo modelo"/"Editar modelo".
33. Como fisioterapeuta, quero que no modelo a etapa 3 peça só nome e mensagem padrão, sem paciente nem datas, e o botão diga "Salvar modelo".
34. Como fisioterapeuta, quero usar o assistente no celular, com a barra de baixo para ver o programa e avançar.
35. Como clínica, quero que nenhuma outra clínica consiga abrir ou salvar a edição dos meus programas (404).
36. Como clínica, quero que só entrem no programa os exercícios do catálogo aprovado e os nossos, para nenhum vídeo privado de outra clínica vazar (422).
37. Como clínica, quero que um exercício que já estava no programa continue aceito na edição, mesmo que o catálogo tenha mudado depois.
38. Como desenvolvedor, quero que a v1 (as duas páginas, os componentes da v1 e o `?variant=`) saia do código, para só existir um assistente.

## Decisões de Implementação

### Dono e telas

- **Dono do dado:** módulo `TreatmentProgram`, sem módulo novo. O módulo `Admin` só ganha um método no contrato público do catálogo.
- **Telas:** `/clinica/programas/novo` e `/clinica/programas/:id/editar` usam o mesmo assistente, que deixa de ser protótipo e vira pasta de tela real em `pages/clinic/program/`. Saem as duas páginas v1, os componentes da v1 do assistente (seleção, configuração, detalhes, painel de edição de exercício, barra de navegação e diálogo de envio em shadcn), seus testes e o seletor `?variant=` do assistente.
- **Sem migration.** Nenhum dado antigo para converter.

### Endpoints alterados

`POST /api/clinic/treatment-plans` (criar), guard `clinic`:
- `exercises.*.exercise_id`: além de existir, precisa ser visível para a clínica (catálogo aprovado ou da própria clínica). Senão, **422** em `exercises.N.exercise_id`.
- `status`: continua aceito, mas o assistente não manda mais. O service decide: com paciente, `active`; sem paciente, `draft`.

`PUT /api/clinic/treatment-plans/{id}` (editar), guard `clinic`. Entrada nova:

```
groups[]:    { id?: number, name, sort_order }
exercises[]: { id?: number, exercise_id, group_index, days_of_week, period,
               sets_min, sets_max, repetitions_min, repetitions_max,
               load_min, load_max, rest_time, notes, sort_order }
```

- **Grupo ou exercício com `id`:** atualiza no lugar. Precisa pertencer a este programa; senão, 422.
- **Sem `id`:** cria.
- **Existia e não veio:** é apagado. O exercício apagado leva as séries dele (cascade, como hoje); os que ficam mantêm as séries.
- **`exercise_id`:** deve ser visível para a clínica, exceto o de um exercício (por `id`) que já estava no programa com o mesmo `exercise_id`.
- **Status sem `status` no payload:** se o paciente foi removido, `draft`; se era `draft` e ganhou paciente, `active`; senão, mantém. Se `status` vier, vale como hoje (compatibilidade).
- **`patient_id` mudou (troca ou remoção):** `public_token` novo. O link antigo dá 404 em todas as rotas `patient/programs/{publicToken}`.
- **Saída:** a mesma de hoje (envelope `data`, com `groups.exercises` e os `id`s), agora com `public_token`/`share_url` novos quando trocar.
- **Outra clínica:** 404, como hoje (o controller confere a clínica do plano antes do service).

A listagem `GET /api/clinic/exercises` não muda. Ela já devolve `sets`,
`repetitions` e `rest_time` do Model; o front só passa a mapear esses campos.

### Permissões e isolamento

- **Permissões:** `TreatmentPlanPolicy::create`/`update` liberam todos os papéis da clínica (`admin`, `physiotherapist`, `secretary`). Não muda.
- **Clínica:** a clínica do plano é conferida no controller antes do service (o repositório busca só por id), e o paciente no `ValidatesPatientOfClinic`.
- **Exercício:** a regra de exercício visível fica na validação do FormRequest, pelo contrato público do Admin, nunca pelo Model `Exercise`.
- **Paciente:** o link público é a única chave do paciente para o programa; trocá-lo quando o paciente muda é o que separa os dois. As execuções já guardam o `patient_id` de quem fez, e as leituras filtram por ele.

### Colaboração entre módulos

- `Modules\Admin\Contracts\Public\ExerciseCatalogReadServiceInterface` ganha um método que recebe ids e o `clinic_id` e devolve os ids visíveis (catálogo aprovado ou da clínica), numa consulta só. A implementação usa `Exercise::scopeVisibleToClinic`. O `TreatmentProgram` só conhece a interface.

### Arquitetura

- **Sincronizar por id**, em vez de apagar e recriar, segue o ADR 021 (modelo de evolução). Diferença consciente: aqui o que sai é apagado, não arquivado, por decisão do usuário. Registrar no **ADR 025**: editar programa não apaga o histórico do paciente, e trocar de paciente gera link novo.
- **O status sai do front.** A regra "rascunho que ganha paciente vira ativo" mora no `TreatmentPlanService`.
- **Front em camadas** (skill `frontend-ddd`):
  - `domain/`: `Exercise` ganha `sets`, `repetitions` e `restTime` (dose padrão do catálogo).
  - `application/`:
    - O estado do assistente (`useProgramBuilder`) e a conversão do que chega (programa da API, modelo, exercício) para grupos saem da pasta do protótipo.
    - A dose padrão vem do catálogo, com `isConfigured` verdadeiro só quando há dose de verdade (corrige o "1/1 com dose").
    - A montagem do `ProgramWriteDto` vira uso-caso puro.
    - O `ProgramWriteDto` ganha `id` em grupos e exercícios e perde `status`.
    - O hook de rascunho automático passa a receber o estado do assistente novo.
  - `infrastructure/`: o mapper manda `id` de grupo e de exercício quando existem.
  - `pages/`: o assistente tem três modos (`novo`, `edição`, `modelo`):
    - O modo **edição** carrega pelo `:id` da rota (loader + `useClinicProgram`); a edição de modelo usa `?modelo=1`. As entradas 3, 4 e "Usar em novo modelo" continuam com `location.state`.
    - O diálogo de envio do protótipo vira real, com as funções de `program-share` e a fase de erro.
    - "Voltar" usa a origem (como `programBackPath` da feature 011).
    - O aviso "Descartar alterações?" usa o bloqueio de navegação do React Router e `beforeunload`, só na edição e com mudança.
  - **Entradas que mudam de destino:** "Editar modelo" em Meus modelos passa a navegar para `/clinica/programas/:id/editar?modelo=1` em vez de levar o programa no `state`.

## Fatias Verticais

1. **Salvar programa sem apagar histórico e sem vazar** (backend + ADR):
   - O `PUT` sincroniza grupos e exercícios por `id`.
   - O status passa a ser decidido pelo service.
   - O `public_token` é renovado quando o paciente muda.
   - Criar e editar recusam exercício não visível para a clínica, pelo contrato novo do catálogo.
   - O front de hoje continua funcionando: os campos novos são opcionais, e o `status` enviado ainda vale.
   - Demonstra-se pela API e pelos testes PHPUnit.
2. **Novo programa de verdade** (entradas 1 a 4):
   - O assistente sai da pasta do protótipo e vira tela real em `/clinica/programas/novo`, salvando com `POST`.
   - O exercício entra com a dose do catálogo.
   - Diálogo de envio real, com erro.
   - Rascunho automático com faixa DS (Restaurar/Descartar) só nas entradas 1 e 2.
   - Etapas clicáveis, regras de datas do novo e "Voltar" para a origem.
   - Sem `?variant=` nesta rota.
   - Demonstra-se criando um programa com paciente e outro sem paciente.
3. **Editar programa na mesma tela** (entrada 5):
   - `/clinica/programas/:id/editar` abre o assistente em modo edição pela URL, na etapa 2.
   - O `PUT` leva os `id`s e não leva status.
   - O diálogo de envio sempre abre com paciente; sem paciente, volta ao painel.
   - Início passado mantido; confirmação "Descartar alterações?" ao sair com mudança.
   - Troca de paciente demonstrada com link novo.
   - Sai a `ProgramEditPage` v1.
4. **Modelos no assistente e corte da v1** (entrada 6):
   - Modo modelo: título "Novo modelo"/"Editar modelo" e etapa 3 "Nome e mensagem", sem paciente nem datas.
   - "Salvar modelo" volta para Meus modelos.
   - "Usar em novo modelo" (state) e "Editar modelo" (`/:id/editar?modelo=1`).
   - Sai a `ProgramNewPage` v1 com o `?variant=`, os componentes da v1 do assistente e os testes deles.

## Testes

- **Como rodam:**
  - Backend: `php artisan test --filter=TreatmentPlan` ou `vendor/bin/phpunit modules/TreatmentProgram/tests`.
  - Frontend: `npm run test` ou `npx vitest run resources/js/test/<arquivo>`.
  - Nos arquivos que mudaram: `bash bin/verificar.sh`.
- **Padrões copiados:**
  - `TreatmentPlanIsolationTest` para outra clínica e paciente de outra clínica: `actingAs($user, 'clinic')`, factories, `RefreshDatabase`, envelope `data`.
  - `SharedProgramControllerTest` e os testes de `Feature/Patient` para o link público.
  - `TreatmentProgramEventsTest` para os eventos de ativação.
  - No front: `program-builder-group-board.test.tsx`, `use-program-draft.test.tsx` e `NewProgramPage.test.tsx`, com `vi.mock` do repositório e `userEvent`.
- **PHPUnit:**
  - Histórico:
    - Editar a dose de um exercício com séries registradas mantém as séries (mesmo `id`).
    - Tirar um exercício apaga só as séries dele.
    - Mudar a ordem e o grupo mantém os `id`s.
  - `id` de grupo ou exercício de outro programa (mesmo da mesma clínica): 422, e nada muda.
  - Status:
    - Rascunho + paciente vira ativo e dispara `TreatmentPlanActivated`.
    - Concluído e arquivado continuam como estão.
    - Tirar o paciente vira rascunho.
    - Sem paciente e sem `status` continua rascunho.
  - Link:
    - Trocar o paciente gera `public_token` novo, e o antigo dá 404 no `show` e no `executions`.
    - Tirar o paciente também troca o link.
    - Editar sem mexer no paciente mantém o link.
    - O paciente novo não vê as cargas do anterior pelo link novo.
  - Exercício:
    - Privado de outra clínica dá 422 no criar e no editar.
    - Aprovado do catálogo e da própria clínica passam.
    - O que já estava no programa continua aceito na edição.
  - Outra clínica: `PUT` no programa de outra clínica dá 404 e não revela nada (já coberto; manter verde com o payload novo).
- **Vitest:**
  - Seis caminhos: cada entrada abre na etapa certa, com título, subtítulo e dados certos, e salva com o payload certo (`create` ou `update`, com `id`s na edição, sem `status`, `patientId` nulo no modelo).
  - Dose padrão: o exercício novo entra com a dose do catálogo, e a barra "com dose" bate com os cards.
  - Saída: editar com mudança e clicar em Voltar abre "Descartar alterações?"; sem mudança, sai direto; no novo, sai direto.
  - Rascunho: a faixa aparece só nas entradas 1 e 2; Restaurar repõe os grupos; salvar apaga o rascunho.
  - Datas: no novo, não aceita antes de hoje; na edição, mantém o início passado.
  - Diálogo de envio: sempre aparece ao salvar com paciente; com erro da API, mostra a mensagem e não perde o que foi montado.
- **Smoke no navegador** (skill `qa-navegador`), desktop e celular, com evidência em `evidence/<tarefa>/`:
  - Os seis caminhos.
  - Editar o programa 7 com execução registrada.
  - Troca de paciente com o link antigo dando 404.
  - O caso de outra clínica.

## Fora do Escopo

- Programas do painel admin (`/admin/programas`) e as telas dele.
- Área/subárea e duração do programa: a API aceita, a tela não mostra hoje e continua não mostrando.
- Mudanças visuais além do protótipo A.
- Arquivar (em vez de apagar) o exercício tirado do programa: o usuário escolheu que ele perde o histórico.

## Notas

- **A fatia 1 primeiro.** Ela muda o `PUT` de forma compatível. Enquanto a v1 de edição existir (até a fatia 3), ela continua mandando sem `id`: tudo sem `id` é criado e o que existia é apagado, que é o comportamento de hoje. Nada piora até a fatia 3 entrar.
- **O seletor de variantes (`PrototypeSwitcher`)** continua existindo para outras telas; só sai o uso dele no assistente. O `docs/prototipos-v2.md` deve marcar o assistente como implementado.
- **Testes da v1 que saem:** `NewProgramPage`, `StepSelectExercises`, `StepConfigureExercises`, `ProgramWizardNavBar` e `ProgramShareDialog`. O que eles cobriam e ainda vale passa para os testes novos.
- **O mapeamento cru (`fromIncoming`)** aceita hoje camelCase e snake_case porque o `state` chegava de vários lugares. Com a edição pela URL, ele pode se restringir às entradas por `state` (modelo, exercício) no formato do domínio.
- **Branch:** a feature 011 está na `feat/clinic-historico-exercicios-programas`, sem push. Perguntar ao usuário, antes de implementar, se esta segue na mesma branch ou numa nova.
