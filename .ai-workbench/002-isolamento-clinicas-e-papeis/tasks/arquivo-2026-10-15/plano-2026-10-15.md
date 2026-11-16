# Isolamento entre clínicas e regras de papel

Data: 2026-10-15
Fonte: auditoria de isolamento entre clínicas, papéis e acesso do paciente (colada na conversa), refinada com a skill `refinar` em 2026-10-15. Inclui os dois itens Críticos do `DEFERRED.md` da raiz vindos da feature 001: favoritos e `ClinicUserController`.

## Problema

O isolamento entre clínicas está certo na agenda, no financeiro, no prontuário e nos questionários do lado da clínica. Mas há pontos em que uma clínica alcança dados de outra:

- O admin de uma clínica lê, altera e apaga usuários de outra clínica, inclusive o mestre. Ao trocar e-mail e senha, ele entra na conta e passa a ver pacientes e prontuários da outra clínica.
- Uma clínica cria plano de tratamento com um paciente de outra clínica. A resposta devolve nome, CPF, telefone e data de nascimento, o que permite raspar os pacientes de todas as clínicas.
- Qualquer pessoa sem login lê e responde questionários de qualquer clínica pelo id sequencial e falsifica dado clínico.
- Qualquer usuário de qualquer clínica apaga ou altera vídeos do catálogo, e o arquivo some do R2.
- Exercícios pendentes ou rejeitados de outra clínica vazam pelos favoritos e pelo plano.
- O texto dos modelos de evolução privados de outra clínica vaza pelo gerador de texto.

Dentro da clínica, duas regras de papel estão erradas:

- A secretária hoje lê o prontuário. Ela pode continuar lendo, mas nenhuma escrita pode depender de cada controller lembrar de chamar `authorize`.
- O fisioterapeuta vê todos os pacientes da clínica. Ele deve ver só os pacientes dele.

A causa comum é que o `Gate::before` aprova tudo para o admin antes de a Policy rodar, então o isolamento depende de cada controller comparar `clinic_id` na mão, e alguns esqueceram.

## Solução

- Toda busca de recurso da clínica passa por uma checagem única, que devolve 404 quando o recurso é de outra clínica. O `Gate::before` deixa de liberar o admin para recurso de outra clínica, então qualquer Policy nova já nasce protegida. Um teste de arquitetura impede a volta da comparação feita na mão.
- O que a clínica envia (paciente, exercício, vídeo, modelo de evolução, pergunta de questionário) só é aceito se for dela ou do catálogo visível para ela.
- A rota pública de questionário deixa de existir. Hoje nenhuma tela usa essa rota e nenhum código gera link para ela.
- O vídeo passa a ter clínica dona, e a clínica só mexe nos vídeos que ela mesma enviou.
- A secretária lê o prontuário, mas não altera nada, e o SPA esconde as ações de escrita para ela.
- Todo paciente tem um fisioterapeuta responsável, que é admin ou fisio. O fisioterapeuta vê só os pacientes de que é responsável ou que já atendeu (consulta, plano, evolução ou avaliação). Paciente de outro fisio dá 404 e não aparece nas listas.

## Histórias de Usuário

1. Como admin da clínica, quero que só os usuários da minha clínica apareçam e possam ser alterados por mim, para que ninguém de outra clínica sequestre uma conta da minha equipe.
2. Como admin da clínica, quero receber 404 ao tentar abrir, editar ou apagar um usuário de outra clínica, para que eu não descubra nem que ele existe.
3. Como usuário mestre da clínica, quero que nenhum admin de outra clínica consiga trocar meu e-mail ou senha, para não perder minha conta.
4. Como dono do produto, quero que o `Gate::before` não libere o admin para recurso de outra clínica, para que uma Policy nova não abra brecha por esquecimento.
5. Como mantenedor do backend, quero uma checagem de clínica única no controller base, para não reescrever a comparação de `clinic_id` em cada endpoint.
6. Como mantenedor do backend, quero que um teste de arquitetura falhe se um controller comparar `clinic_id` na mão, para que o padrão não se perca.
7. Como mantenedor do backend, quero o mesmo formato de resposta 404 em todos os endpoints da clínica, para que o SPA trate "não encontrado" de um jeito só.
8. Como clínica, quero que o plano de tratamento só aceite paciente da minha clínica, para não ligar um plano a paciente de outra clínica.
9. Como paciente, quero que nenhuma outra clínica consiga ver meu nome, CPF, telefone e data de nascimento, para que meus dados fiquem só com a clínica que me atende.
10. Como paciente, quero que nenhum plano de outra clínica seja ligado a mim, para não receber notificação nem ver plano de quem não me atende.
11. Como clínica, quero que o plano só aceite exercícios aprovados no catálogo ou enviados pela minha clínica, para não usar exercício privado de outra clínica.
12. Como clínica, quero favoritar só exercícios que eu consigo ver, e quero que a lista de favoritos não mostre de qual clínica veio o exercício, para não vazar o trabalho de outra clínica.
13. Como clínica, quero receber 404 ao favoritar um exercício pendente ou rejeitado de outra clínica.
14. Como fisioterapeuta, quero gerar o texto da evolução só com modelos do sistema ou da minha clínica, para não ver modelos privados de outra clínica.
15. Como clínica, quero que a evolução criada só aceite modelo e itens de modelo do sistema ou da minha clínica.
16. Como paciente, quero que ninguém sem login consiga ler ou responder meus questionários pela internet, para que minhas respostas clínicas sejam verdadeiras.
17. Como profissional, quero que meu e-mail e documento não apareçam em resposta pública nenhuma.
18. Como clínica, quero que a resposta de um questionário só aceite perguntas do template daquele questionário, para não gravar resposta numa pergunta de outro template.
19. Como clínica, quero que nenhuma outra clínica apague, altere ou troque a thumbnail ou as imagens de referência dos meus vídeos.
20. Como dono do produto, quero que nenhuma clínica apague ou altere vídeos do catálogo, para que os exercícios de todas as clínicas continuem funcionando.
21. Como clínica, quero enviar exercício só com vídeo que eu mesma subi.
22. Como clínica, quero continuar subindo vídeo, thumbnail e imagens de referência no envio de exercício como faço hoje.
23. Como secretária, quero ler evoluções, avaliações e arquivos do paciente, para apoiar o atendimento na recepção.
24. Como clínica, quero que a secretária receba 403 ao criar, editar, assinar, gerar texto ou apagar evolução, avaliação ou arquivo clínico, para manter o sigilo do registro profissional.
25. Como secretária, quero que as telas não me mostrem botões de editar ou assinar o prontuário, para não esbarrar em erro.
26. Como recepção, quero escolher no cadastro qual fisioterapeuta é responsável pelo paciente, porque eu cadastro, mas não atendo.
27. Como clínica, quero que o responsável seja obrigatório e só aceite admin ou fisioterapeuta da minha clínica.
28. Como clínica, quero receber 422 se o responsável for secretária, usuário de outra clínica ou estiver vazio.
29. Como admin que também atende, quero poder ser responsável por pacientes.
30. Como clínica, quero que os pacientes antigos com secretária como responsável fiquem sem responsável, para a recepção escolher o certo na próxima edição.
31. Como fisioterapeuta, quero ver na lista só os pacientes de que sou responsável ou que já atendi, para trabalhar com a minha carteira.
32. Como fisioterapeuta, quero que o seletor de paciente da agenda e do plano mostre só os meus pacientes.
33. Como fisioterapeuta, quero que um paciente apareça para mim assim que a recepção agenda uma consulta comigo, para cobrir um colega sem pedir ajuste no cadastro.
34. Como fisioterapeuta, quero continuar vendo pacientes que atendi antes desta mudança, para não perder o histórico.
35. Como clínica, quero que o fisioterapeuta receba 404 ao abrir pela URL paciente, prontuário, questionário ou arquivo de um paciente que não é dele.
36. Como clínica, quero que o fisioterapeuta não consiga agendar, criar plano, evolução ou avaliação para paciente que não é dele.
37. Como admin e como secretária, quero continuar vendo todos os pacientes da clínica.
38. Como fisioterapeuta, quero que a lista de planos de tratamento mostre só planos dos meus pacientes ou planos sem paciente criados por mim.
39. Como fisioterapeuta, quero que os widgets do dashboard que mostram pacientes respeitem a mesma regra.

## Decisões de Implementação

### Entrega

- Uma feature, uma branch (`feat/isolamento-clinicas-e-papeis`) e **uma PR só**, por decisão do usuário. As tarefas são feitas em ordem na mesma branch, cada uma com teste primeiro, e a revisão adversária roda por tarefa.

### Checagem de clínica centralizada (núcleo + Clinic)

- O controller base da clínica ganha uma checagem que recebe um model com `clinic_id` e aborta com 404 e mensagem padrão quando a clínica é outra. Os 33 `if` de comparação de `clinic_id` e os dois `authorizeClinic` privados (agenda e financeiro) passam a usar essa checagem, ou a busca de paciente acessível descrita abaixo.
- Formato único do 404: `{"message": "<Recurso> não encontrado."}`. O texto varia por recurso, o status e a chave não variam. O SPA já trata 404 pela chave `message`, então nada muda no frontend.
- O `Gate::before` continua liberando o admin, exceto quando algum argumento da habilidade for um model com `clinic_id` diferente do usuário. Nesse caso ele nega. É uma segunda barreira; a primeira é a checagem no controller.
- `ClinicUserController` show, update e destroy passam a usar a checagem. Os testes `markTestIncomplete` de `ClinicUserIsolationTest` passam a valer.
- Teste de arquitetura em `tests/Architecture`, no estilo do `ClinicGuardAccessTest`: falha se um controller de módulo de clínica comparar `clinic_id` na mão.

### Paciente acessível (Patient) — fronteira nova, leva ADR

- O módulo **Patient** é o dono da regra "quem pode ver este paciente".
- O contrato `PatientServiceInterface` ganha uma busca de paciente acessível: recebe o id do paciente e o usuário da clínica e devolve o paciente ou nulo. Devolve nulo quando:
  - o paciente é de outra clínica; ou
  - o usuário é fisioterapeuta e o paciente não está no vínculo dele.

  Admin e secretária veem todos da clínica.
- A listagem do contrato aplica o mesmo filtro quando quem lista é fisioterapeuta. O seletor de paciente da agenda usa a listagem, então herda o filtro sem mudança no SPA.
- ClinicalRecord, ClinicQuestionnaire, TreatmentProgram, ClinicScheduling (FormRequests) e o próprio `PatientController` trocam "buscar e comparar `clinic_id`" por essa busca. Nulo vira 404.
- **Vínculo fisio-paciente**: tabela nova `patient_care_links` no módulo Patient, com `clinic_id`, `patient_id`, `clinic_user_id`, `source` (`appointment`, `treatment_plan`, `evolution`, `assessment`) e `created_at`. Chave única em (patient_id, clinic_user_id), e a primeira origem fica gravada.
- **Como o vínculo nasce**: listeners **síncronos** no módulo Patient para eventos públicos que já existem e já carregam `clinicId`, `patientId` e `professionalId`:
  - `AppointmentScheduled` e `AppointmentRescheduled` (ClinicScheduling);
  - `TreatmentPlanCreated` (TreatmentProgram);
  - `EvolutionRecorded` e `AssessmentCreated` (ClinicalRecord).

  Ser síncrono garante que o fisio vê o paciente na resposta seguinte ao agendamento. O listener ignora evento sem paciente ou sem profissional e não duplica o vínculo.
- O vínculo não é apagado quando a consulta é cancelada ou o plano é arquivado: quem atendeu uma vez continua com acesso ao histórico.
- O responsável (`patients.clinic_user_id`) conta como vínculo por si só, sem linha na tabela. A busca considera "responsável OU linha em `patient_care_links`".
- **Backfill**: migration de dados no módulo Patient que preenche `patient_care_links` a partir de consultas, planos, evoluções e avaliações que já existem. Ela lê tabelas de outros módulos. É exceção pontual e de uso único, registrada no ADR, no mesmo espírito do ADR 007 (escrita compartilhada temporária).
- **ADR novo** em `docs/adr/`: "Vínculo fisioterapeuta-paciente no módulo Patient". Cobre o dono, os eventos consumidos, o porquê de tabela em vez de consultar os módulos na hora (a lista paginada precisaria perguntar a quatro módulos) e a exceção do backfill.

### Responsável pelo paciente (Patient + Clinic + SPA)

- `clinic_user_id` passa a ser obrigatório na criação e na edição, e é validado como usuário da própria clínica com papel em `ClinicUser::ATTENDABLE_ROLES` (admin ou fisio). Para validar, o Patient consulta o contrato público do Clinic (`ClinicUserServiceInterface` ou um contrato público de leitura novo em `Contracts/Public`, se o atual não for público), sem importar o model.
- O `PatientService` para de gravar o usuário logado como responsável. O valor vem do formulário.
- Migration de dados: zera `clinic_user_id` dos pacientes cujo responsável atual é secretária. Paciente nessa situação aparece sem responsável, e a edição exige escolher um.
- SPA: o formulário de paciente ganha o campo "Fisioterapeuta responsável" (select com admin e fisio da clínica, obrigatório no Zod). A entidade em `domain/clinic/patient.ts` ganha o id do responsável, e o mapper e o repository passam a enviá-lo. Para fisio, o select já vem preenchido com ele mesmo.
- O filtro "profissional" da lista de pacientes continua filtrando por responsável.

### Plano de tratamento (TreatmentProgram)

- Store e Update do plano: o `patient_id` precisa ser um paciente acessível ao usuário (mesma clínica e, para fisio, vínculo), senão devolve 422. O mesmo padrão já existe no `StoreAppointmentRequest`.
- O `exercises.*.exercise_id` só aceita exercício do escopo `visibleToClinic` (aprovado no catálogo ou da própria clínica). A validação passa por contrato público do Admin, sem importar o model.
- Listagem de planos para fisio: só planos de pacientes acessíveis, ou planos sem paciente criados por ele.

### Exercícios e favoritos (Clinic)

- `toggleFavorite` busca o exercício com `visibleToClinic` e devolve 404 fora dele.
- `favorites` lista só favoritos ainda visíveis e esconde `clinic_id`, `review_status` e `submitted_by_clinic_user_id`.
- O `ExerciseController` continua consultando Eloquent direto. Movê-lo para Service e contrato é Minor e fica no DEFERRED.

### Modelos de evolução (ClinicalRecord)

- `generate-text` e a criação ou edição de evolução só aceitam `evolution_template_id` e `checked_item_ids` de modelo do sistema (`is_system`) ou da própria clínica. A busca de itens de modelo passa a receber a clínica. Fora disso, devolve 422.

### Questionários (ClinicQuestionnaire)

- Saem as rotas `GET /api/questionnaires/{id}` e `POST /api/questionnaires/{id}/answer`, o `QuestionnaireAnswerController`, a Request e os testes exclusivos dele.
- `AnswerPatientQuestionnaireRequest`: cada `answers.*.question_id` precisa pertencer ao template do questionário respondido (422).

### Vídeos (Media)

- Migration em `media_videos`: coluna `clinic_id` nula, sem FK, porque Media é módulo compartilhado e não depende de Clinic. Vídeos existentes ficam nulos, ou seja, do catálogo do admin master.
- As rotas da clínica passam para um controller próprio da clínica no módulo Media, que herda o controller base da clínica. O `VideoController` atual fica só para o admin. A clínica mantém só:

  | Método | URL (guard `clinic`) | Regra |
  |---|---|---|
  | POST | `/api/clinic/media/videos/presigned-upload-request` | grava `clinic_id` do usuário no vídeo criado |
  | POST | `/api/clinic/media/videos/{video}/presigned-thumbnail-request` | 404 se o vídeo não for da clínica |
  | POST | `/api/clinic/media/videos/{video}/presigned-thumbnail-replace-request` | idem |
  | POST | `/api/clinic/media/videos/{video}/confirm-upload` | idem |
  | PUT | `/api/clinic/media/videos/{video}/reference-images` | idem |

  Entrada e saída dessas rotas não mudam (envelope `data`).
- Saem da clínica: `GET videos`, `GET videos/{video}`, `PATCH videos/{video}`, `PATCH videos/{video}/metadata`, `DELETE videos/{video}`. O SPA não usa nenhuma delas.
- `SubmitExerciseRequest`: o `video_id` precisa ser vídeo da própria clínica (422). O Media expõe a consulta de dono por contrato.

### Secretária lê o prontuário (ClinicalRecord + SPA)

- Leitura: `show` e `indexByPatient` de evoluções, avaliações e arquivos passam a chamar `authorize` (`view`/`viewAny`), que hoje devolvem true para todos os papéis. A regra de leitura não muda. A mudança é passar a ter um ponto que a decide.
- Escrita: toda rota de escrita do prontuário (criar, editar, assinar, gerar texto, apagar, anexar e remover arquivo) chama `authorize`. As Policies já exigem fisio ou admin. A `PatientFilePolicy` é conferida e ajustada para a mesma regra. Secretária recebe 403.
- SPA: `permissions.ts` já tem `manageClinicalRecords` (admin ou fisio). As telas de prontuário (`PatientRecordPage`, drawers de evolução, avaliação, upload de arquivo) passam a esconder as ações de escrita com ele.

### Permissões resumidas

| Ação | admin | fisio | secretária |
|---|---|---|---|
| Ver paciente / prontuário | todos da clínica | só vinculados | todos da clínica (só leitura no prontuário) |
| Escrever no prontuário | sim | só vinculados | não (403) |
| Ser responsável por paciente | sim | sim | não |
| Gerenciar usuários | só da própria clínica | não | não |
| Vídeos | só os da própria clínica, no fluxo de envio | idem | idem |

## Fatias Verticais

Ordem de dependência. Todas na mesma branch e na mesma PR.

1. **Checagem de clínica e usuários de outra clínica.** Checagem no controller base, `Gate::before` mais estreito, `ClinicUserController` corrigido, testes incompletos de `ClinicUserIsolationTest` ativados. Demonstração: o PUT do admin da clínica A no usuário da clínica B devolve 404.
2. **Padronizar as checagens existentes e trava de arquitetura.** Os 33 `if` e os dois `authorizeClinic` migram. A busca de paciente acessível nasce no contrato do Patient, por enquanto só com a regra de clínica, e todos os módulos passam a usá-la. O formato do 404 é unificado. Entra o teste de arquitetura. Demonstração: a suíte de isolamento existente continua verde, e o teste de arquitetura falha ao reintroduzir uma comparação manual.
3. **Plano de tratamento, exercícios e favoritos.** `patient_id` e `exercise_id` validados no plano, `toggleFavorite` com 404, favoritos sem campos de origem. Demonstração: plano com paciente da clínica B devolve 422; favoritar exercício pendente da B devolve 404.
4. **Modelos de evolução.** Validação de modelo e itens por clínica em `generate-text` e na evolução. Demonstração: item de modelo privado da B devolve 422.
5. **Questionários.** Remove a rota pública e valida `question_id` contra o template. Demonstração: `GET /api/questionnaires/1` devolve 404; resposta com pergunta de outro template devolve 422.
6. **Vídeos com dono.** Migration, controller da clínica em Media, rotas que saem, `video_id` do envio de exercício. Demonstração: o fluxo de envio de exercício continua funcionando; thumbnail-replace num vídeo da B ou do catálogo devolve 404; DELETE pela clínica devolve 404 ou 405 (rota não existe).
7. **Secretária só lê o prontuário.** `authorize` em leitura e escrita, `PatientFilePolicy` ajustada, telas escondendo ações. Demonstração: secretária abre evolução (200) e recebe 403 ao assinar; na tela, não vê os botões.
8. **Responsável obrigatório.** Validação, migration de limpeza, `PatientService` sem responsável automático, campo no formulário do SPA. Demonstração: a recepção cadastra paciente escolhendo o fisio; tentar salvar com secretária como responsável devolve 422.
9. **Vínculo fisio-paciente.** Tabela, listeners síncronos, backfill e ADR. Demonstração: agendar consulta para o fisio cria o vínculo; o backfill cria vínculos dos atendimentos antigos.
10. **Fisio vê só os dele.** A busca de paciente acessível e a listagem passam a considerar responsável e vínculo para fisio. Lista de planos e widgets do dashboard filtrados. Demonstração: o fisio A não vê nem abre paciente do fisio B (404); depois que a recepção agenda uma consulta do A com esse paciente, ele aparece.

## Testes

- Como rodar:
  - `php artisan test --filter=Isolation`
  - `vendor/bin/phpunit modules/<Modulo>/tests`
  - `vendor/bin/phpunit tests/Architecture`
  - `npm run test`
  - `bash bin/verificar.sh` antes de cada revisão
- Padrões a copiar:
  - `modules/Clinic/tests/Feature/ClinicUserIsolationTest.php` e `modules/ClinicalRecord/tests/Feature/ClinicalRecordIsolationTest.php`: duas clínicas com usuários `adminA`/`adminB`, `actingAs($user, 'clinic')`, `RefreshDatabase`, factories.
  - `tests/Architecture/ClinicGuardAccessTest.php`: varredura de arquivos para a trava de arquitetura.
  - `Event::fake` só onde o teste não depende do listener. Os testes de vínculo usam o evento real, porque o listener é síncrono.
  - Frontend: `resources/js/test/` com `vi.mock` do repository e `userEvent` (skill `frontend-testing`).
- Comportamentos testados. Cada endpoint tocado tem o caso de outra clínica.
  - Os quatro sugeridos pela auditoria:
    - PUT de usuário da B pelo admin da A devolve 404;
    - plano com `patient_id` da B devolve 422;
    - DELETE de vídeo pela clínica não existe mais (404/405);
    - `GET /api/questionnaires/{id}` devolve 404.
  - Usuários: GET e DELETE da B pelo admin da A devolvem 404, e o registro da B continua igual. O `Gate::before` nega o admin da A numa Policy com model da B (teste unitário).
  - Exercícios: favoritar pendente da B devolve 404; a lista de favoritos não traz os campos de origem; plano com exercício pendente da B devolve 422; plano com exercício pendente da própria clínica é aceito.
  - Modelos de evolução: `generate-text` com item privado da B devolve 422; com item do sistema, 200.
  - Questionário: resposta com `question_id` de outro template devolve 422.
  - Vídeos: thumbnail-replace e reference-images em vídeo da B ou do catálogo devolvem 404; o presigned-upload grava a clínica; o envio de exercício com vídeo da B devolve 422; o fluxo de envio completo continua verde.
  - **Fisio fora do vínculo:**
    - 404 em paciente, evoluções, avaliações, arquivos e questionários do paciente;
    - lista e seletor sem o paciente;
    - agendar ou criar plano para paciente sem vínculo devolve 422;
    - depois de a recepção agendar consulta do fisio com o paciente, ele aparece;
    - consulta cancelada não remove o vínculo;
    - o backfill cria vínculos a partir de dados antigos.
  - **Secretária só lê:** 200 em show e listagem do prontuário; 403 em criar, editar, assinar, gerar texto, apagar evolução e avaliação, anexar e remover arquivo. Teste de UI: as ações não aparecem para a secretária.
  - **Responsável inválido:** 422 para secretária, usuário de outra clínica ou vazio; admin e fisio são aceitos. A migration de limpeza zera só os casos de secretária.
  - **Trava de arquitetura:** o teste falha numa fixture de controller que compara `clinic_id` na mão.

## Fora do Escopo

- Questionário respondido pelo paciente por link (token, expiração, tela pública). Volta numa feature própria.
- Área do paciente ("meus planos") e qualquer acesso pelo guard do paciente.
- Tirar o Eloquent direto do `ExerciseController` e mover para Service e contrato público do Admin (Minor no DEFERRED da raiz).
- Remover o vínculo quando o fisio deixa a clínica ou é desativado. O usuário desativado não loga, então o vínculo fica inerte.
- Atribuir dono aos vídeos antigos. Eles ficam como catálogo do admin master.
- Mudanças no guard `admin` (painel master) e no `login-as`, que a auditoria confirmou estarem corretos.
- Flag separada de "admin que atende". Vale a regra que já existe, `ATTENDABLE_ROLES`.

## Notas

- A auditoria foi feita só lendo o código. Cada falha precisa de um teste que a reproduza **antes** da correção (ciclo vermelho-verde da skill `implementar-tarefa`).
- A fatia 2 mexe em muitos controllers que hoje estão corretos. A rede de segurança são as suítes de isolamento por módulo criadas na feature 001, que precisam ficar verdes antes e depois.
- Como tudo sai numa PR só, a correção do `ClinicUserController` (Crítico, já na `main`) só chega a produção no fim. Essa foi uma escolha do usuário.
- A regra do fisio muda o que o usuário vê na tela. Depois do merge, avisar as clínicas que pacientes cadastrados pela secretária sem consulta ficam sem responsável e não aparecem para nenhum fisio até a recepção escolher um.
- Itens do `DEFERRED.md` da raiz que esta feature resolve: favoritos (Crítico) e `ClinicUserController` (Crítico). Marcá-los como resolvidos quando a fatia correspondente fechar.
- Dado de saúde (LGPD): o plano não cria cópia de dado clínico. A tabela de vínculo guarda só ids.
