# Agenda da clínica no design system v2

Data: 2026-10-17
Fonte: conversa de refinamento (skill `refinar`) sobre o protótipo da agenda
(variante A, coluna flutuante) e do modal de consulta (variante F, cabeçalho +
abas), que hoje só aparecem em desenvolvimento na rota `/clinica/agenda`.

## Problema

A agenda é a tela mais usada da clínica e ainda está na v1 (shadcn). O
protótipo no design system v2 foi aprovado, mas só existe em desenvolvimento,
atrás de um switcher de variantes. Além da cara nova, quem usa a agenda sente
falta de algumas coisas:

- Toda vez que volta para a agenda, ela abre em "Semana" com fim de semana,
  mesmo que o fisioterapeuta trabalhe sempre na visão "Dia".
- O tipo de serviço é digitado à mão a cada consulta, e a duração também.
- No modal, não dá para ver o histórico do paciente. Quando um fisioterapeuta
  cobre as férias de outro, ele não enxerga os atendimentos que o colega fez.
- Abaixo de 1024px, o protótipo perde a coluna da esquerda inteira (busca,
  filtros e Google Calendar).

## Solução

`/clinica/agenda` passa a ser só a agenda v2:

- Calendário em altura total, com as consultas em fundo suave e uma faixa na
  cor do status. A coluna da esquerda (busca, minicalendário, resumo por
  status, agendas por profissional, Google Calendar) flutua na borda e pode ser
  fixada com o alfinete. Abaixo de `lg`, um botão "Filtros" abre a mesma coluna
  numa gaveta.
- O modal de consulta tem cabeçalho na cor do status e as abas Resumo, Editar e
  Histórico. Para criar ou editar, há local (Na clínica + sala, ou Domiciliar),
  atalhos de tipo de serviço e de duração.
- A visão do calendário e o "mostrar fins de semana" ficam salvos na conta do
  usuário e valem em qualquer aparelho.
- Cada clínica tem a própria lista de tipos de serviço, com uma duração padrão
  cada. Ela começa com 5 tipos padrão, e o admin e a secretária editam a lista
  no próprio modal.
- A aba Histórico mostra todas as consultas do paciente, de qualquer
  profissional. O fisioterapeuta vê o histórico de quem ele atende.

A v1 da agenda e o protótipo saem do código.

## Histórias de Usuário

1. Como usuário da clínica, quero abrir `/clinica/agenda` e ver a agenda no
   design system v2, para trabalhar na tela nova em produção.
2. Como usuário da clínica, quero ver as consultas em fundo suave com uma faixa
   na cor do status, para distinguir agendada, confirmada, falta, concluída e
   cancelada de relance.
3. Como usuário da clínica, quero que a agenda funcione no tema claro e no
   escuro, para usá-la com o tema que escolhi no sistema.
4. Como usuário da clínica, quero trocar a visão entre Atendimentos, Dia,
   3 dias, Semana e Mês, para ver o período que preciso.
5. Como usuário da clínica, quero que a agenda reabra na visão que escolhi da
   última vez, em qualquer computador ou celular, para não precisar escolher de
   novo a cada visita.
6. Como usuário da clínica, quero esconder ou mostrar sábado e domingo e que
   essa escolha fique salva na minha conta, para ver só os dias em que atendo.
7. Como usuário da clínica, quero navegar com Hoje, anterior e próximo e ver o
   mês do período em foco, para me localizar no calendário.
8. Como usuário da clínica, quero que a coluna da esquerda fique escondida numa
   alça na borda e abra ao passar o mouse, para o calendário ter a tela inteira.
9. Como usuário da clínica, quero fixar a coluna aberta com o alfinete, para
   deixar os filtros sempre à mão enquanto trabalho.
10. Como usuário da clínica, quero que a coluna não feche enquanto estou
    digitando na busca, para não perder o que estou escrevendo.
11. Como usuário da clínica num tablet ou celular, quero um botão "Filtros" que
    abre a coluna numa gaveta, para ter busca, filtros e Google Calendar
    também em telas menores.
12. Como usuário da clínica, quero pesquisar consultas por paciente, tipo ou
    profissional, para achar uma consulta sem rolar a agenda.
13. Como usuário da clínica, quero clicar num dia do minicalendário e ir para
    ele, para pular para uma data distante.
14. Como usuário da clínica, quero ver quantas consultas há no período visível,
    no total e por status, para ter um resumo da semana.
15. Como admin ou secretária, quero marcar e desmarcar a agenda de cada
    profissional, para ver só as agendas que me interessam.
16. Como fisioterapeuta, não quero ver a seção "Visualizar agendas", porque só
    tenho acesso à minha agenda.
17. Como usuário da clínica, quero conectar, atualizar e desconectar o Google
    Calendar pela coluna, como fazia na v1, e ver o aviso de retorno da
    conexão, para manter a integração funcionando.
18. Como usuário da clínica, quero clicar num horário vazio e abrir "Nova
    consulta" já com a data e o horário daquele espaço, para agendar mais
    rápido.
19. Como usuário da clínica, quero arrastar uma consulta para outro horário e
    redimensioná-la, com volta automática se o servidor recusar, para
    reagendar sem abrir o modal.
20. Como usuário da clínica, quero que consultas concluídas, canceladas ou com
    falta não possam ser arrastadas, para não alterar um atendimento encerrado.
21. Como usuário da clínica, quero que a ação rápida "Agendar consulta" do
    dashboard abra a agenda já com "Nova consulta", como hoje.
22. Como usuário da clínica, quero abrir a agenda filtrada por um paciente
    (`?patientId=`), já posicionada na próxima consulta dele, como hoje.
23. Como usuário da clínica, quero criar uma consulta escolhendo paciente,
    local, data, início, duração, fisioterapeuta, tipo de serviço e
    observações, para registrar o agendamento completo.
24. Como usuário da clínica, quero escolher entre "Na clínica" (com sala
    opcional) e "Domiciliar", para saber onde o atendimento acontece.
25. Como usuário da clínica, quero que o local escolhido vá para o Google
    Calendar como texto, como já acontece hoje com o local.
26. Como usuário da clínica, quero atalhos de duração (30, 45, 60, 90 min) e um
    término que acompanha o início mantendo a duração (inclusive quando passa
    da meia-noite), para não calcular o horário de término; e quero que uma
    consulta que termina em outro dia continue terminando nesse dia ao ser
    editada.
27. Como usuário da clínica, quero clicar num atalho de tipo de serviço e ter o
    tipo e o término preenchidos pela duração padrão dele, podendo mudar os
    dois depois, para agendar com menos cliques.
28. Como usuário da clínica, quero digitar um tipo de serviço que não está nos
    atalhos, para atender um caso fora do comum.
29. Como fisioterapeuta, quero que o campo de fisioterapeuta venha travado em
    mim, porque só posso agendar na minha agenda.
30. Como usuário da clínica, quero ver uma mensagem clara quando falta o
    paciente, o fisioterapeuta, a data ou quando o término é antes do início,
    para corrigir antes de salvar.
31. Como usuário da clínica, quero abrir uma consulta e ver no cabeçalho o
    paciente, a data, o horário e o status na cor do status, para entender a
    consulta de relance.
32. Como usuário da clínica, quero ver no Resumo o tipo de serviço, o local, o
    fisioterapeuta, a duração e as observações, para conferir a consulta sem
    entrar na edição.
33. Como usuário da clínica, quero mudar o status pelas pílulas do Resumo,
    vendo só as transições permitidas, para registrar confirmação, falta ou
    conclusão.
34. Como usuário da clínica, quero cancelar uma consulta por um botão próprio,
    para não cancelar sem querer ao trocar de status.
35. Como usuário da clínica, quero que uma consulta cancelada não tenha a aba
    Editar, para não alterar algo que já foi cancelado.
36. Como usuário da clínica, quero ir do modal para o prontuário do paciente,
    para continuar o atendimento.
37. Como usuário da clínica, quero abrir um evento importado do Google sem
    paciente, sem histórico e sem cancelamento, para ver o evento sem quebrar
    a sincronização.
38. Como usuário da clínica, quero ver na aba Histórico todas as consultas do
    paciente em ordem de data, com a atual destacada, para entender o
    tratamento dele.
39. Como fisioterapeuta que cobre as férias de um colega, quero ver no
    histórico as consultas que o colega fez com o paciente, para continuar o
    tratamento de onde ele parou.
40. Como fisioterapeuta, quero continuar vendo o histórico de um paciente que
    já atendi, mesmo depois que o colega volta, porque ele continua sendo um
    paciente que atendi.
41. Como clínica, não quero que um fisioterapeuta veja o histórico de um
    paciente que ele nunca atendeu (ou com quem só teve consulta cancelada),
    para proteger dado de saúde.
42. Como clínica, não quero que uma outra clínica veja o histórico, os tipos de
    serviço ou as preferências dos meus usuários.
43. Como clínica nova, quero já ter os tipos Avaliação (60 min), Sessão
    (45 min), Retorno (30 min), Reavaliação (60 min) e Sessão de Pilates
    (60 min), para começar a agendar sem configurar nada.
44. Como admin ou secretária, quero adicionar, renomear, mudar a duração,
    remover e reordenar os tipos de serviço no próprio modal, para adaptar a
    lista à minha clínica.
45. Como admin ou secretária, quero que os tipos padrão não voltem depois que
    eu apagar todos, para que a lista seja de fato a da minha clínica.
46. Como fisioterapeuta, quero usar os atalhos de tipo sem poder editá-los,
    porque a lista é da clínica.
47. Como usuário da clínica, quero que renomear ou apagar um tipo não mude as
    consultas que já existem, para não reescrever o passado.
48. Como usuário da clínica, quero ver "Falta" no lugar de "Não compareceu" na
    agenda nova, para ler o status mais rápido.

## Decisões de Implementação

### Dono de cada parte

- **ClinicScheduling** é dono da agenda: consultas, tipos de serviço e
  histórico do paciente.
- **Clinic** é dono das preferências do usuário da clínica, porque o dado é do
  `ClinicUser` e outras telas v2 vão usar a mesma tabela.
- **SPA:** a área `pages/clinic` (página da agenda) e `components/clinic/agenda`
  (componentes da agenda v2), com as camadas `domain/`, `application/` e
  `infrastructure/`.
- A agenda v2 usa só `@/components/ds` (skill `design-system`). Saem da base a
  v1 da agenda (a página antiga, o modal v1, a visão do calendário e a coluna
  v1, as ações do Google v1 e o teste do modal v1) e toda a pasta do protótipo
  com o switcher de variantes. O que serve do protótipo vira código de
  produção, sem o "Simular todos os status".
- O formulário do modal passa a ser React Hook Form + Zod, no lugar do rascunho
  em memória do protótipo.

### Migrations

Três tabelas novas, sem dado antigo para converter e sem tocar em tabela
grande:

- `clinic_user_preferences` (Clinic): `clinic_id`, `clinic_user_id`, `key`,
  `value` (json), timestamps. Única por `clinic_user_id` + `key`.
- `clinic_service_types` (ClinicScheduling): `clinic_id`, `name`,
  `duration_minutes`, `position`, timestamps e `deleted_at` (soft delete).
- Nenhuma mudança em `clinic_appointments`. O local continua no `location`
  (texto), e o tipo continua no `title` (texto livre).

### Local

O local é gravado como texto no `location`, com um formato fixo que o front
monta e lê:

```
"Clínica"                 → na clínica, sem sala
"Clínica · Sala 3"        → na clínica, com sala
"Domicílio do paciente"   → domiciliar
```

Qualquer outro texto (eventos do Google, consultas antigas) é lido como "na
clínica" com a sala igual ao texto, e o Resumo mostra o texto como está.

### Endpoints

Todos no guard `clinic` (`auth:clinic` + `clinic.guard`), com o `clinic_id`
vindo sempre do usuário autenticado, nunca da requisição. Respostas no envelope
`data`.

**Preferências (Clinic)**

- `GET /api/clinic/me/preferences?keys=agenda.view,agenda.show_weekends`
  → `{ data: { "agenda.view": "timeGridDay", "agenda.show_weekends": false } }`.
  Uma chave registrada sem valor salvo não aparece no objeto, e o front usa o
  padrão. Uma chave fora da lista dá 422.
- `PUT /api/clinic/me/preferences/{key}` com `{ value: ... }` → 200 com
  `{ data: { key, value } }`. Faz upsert da linha do próprio usuário. Uma
  chave fora da lista ou um valor inválido dá 422.
- As chaves registradas ficam num enum no backend, e cada caso sabe validar o
  próprio valor. Nesta feature:

  | key | valor aceito |
  |---|---|
  | `agenda.view` | `listWeek` \| `timeGridDay` \| `timeGridThreeDay` \| `timeGridWeek` \| `dayGridMonth` |
  | `agenda.show_weekends` | booleano |

  Para outra tela usar a tabela, basta registrar uma chave nova.
- O front grava a preferência logo que o usuário troca a visão ou o fim de
  semana. Se falhar, o calendário continua na escolha nova, e o erro não
  interrompe o uso.

**Tipos de serviço (ClinicScheduling)**

- `GET /api/clinic/service-types` →
  `{ data: [{ id, name, duration_minutes, position }] }` em ordem de
  `position`. Se a clínica não tem nenhuma linha, nem apagada, o service grava
  os 5 padrão numa transação e devolve a lista. A transação precisa aguentar
  duas leituras simultâneas sem duplicar a lista (por exemplo, com um lock na
  leitura ou uma checagem dentro da transação). Os padrão são Avaliação 60,
  Sessão 45, Retorno 30, Reavaliação 60 e Sessão de Pilates 60.
- `PUT /api/clinic/service-types` com
  `{ items: [{ id?, name, duration_minutes }] }` substitui a lista inteira: a
  ordem do array vira `position`, um item com `id` é atualizado, um item sem
  `id` é criado e uma linha que não veio é apagada com soft delete. Devolve a
  lista nova. Validação: `name` obrigatório, até 100 caracteres, sem repetição
  na lista (ignorando maiúsculas); `duration_minutes` inteiro de 5 a 480; até
  30 itens; lista vazia é aceita. Um `id` de outra clínica dá 422, nunca
  atualiza a linha.
- Como a clínica já teve linhas (agora apagadas), uma lista vazia não recria os
  padrão.

**Histórico do paciente (ClinicScheduling)**

- `GET /api/clinic/patients/{patient}/appointments?page=&per_page=` →
  paginado no padrão do projeto, `{ data: { data: [{ id, starts_at, ends_at,
  title, clinic_user_name, status }], total, per_page, current_page,
  last_page } }`, da consulta mais recente para a mais antiga; `per_page`
  padrão 50, máximo 100 (acima disso, 422). O modal carrega a primeira página e
  um botão busca as mais antigas. Sem `description`, sem `location` e sem dado
  do paciente.
- A rota fica no ClinicScheduling e não consulta o módulo Patient. O paciente
  "existe" para o endpoint quando tem ao menos uma consulta **nesta clínica**.
  Se não tem, a resposta é 404, o que cobre também o paciente de outra clínica.
  O histórico só é aberto a partir de uma consulta, então o paciente sempre tem
  ao menos uma.
- Admin e secretária veem o histórico de qualquer paciente que passe nessa
  regra.
- O fisioterapeuta vê o histórico quando **atende** o paciente: tem ao menos
  uma consulta própria com ele, nesta clínica, que não esteja cancelada, seja
  passada ou futura, sem prazo. Se não tem, a resposta é 404 (e não 403), para
  não revelar que o paciente tem consultas. O histórico devolvido é o completo,
  com as consultas de qualquer profissional.
- Isso abre uma exceção à regra FR-009 ("fisioterapeuta só enxerga a própria
  agenda"), só para este endpoint e só com os campos acima. A listagem da
  agenda continua igual.

### Permissões

| Ação | admin | secretary | physiotherapist | Quem decide |
|---|---|---|---|---|
| Ler e gravar as próprias preferências | sim | sim | sim | o próprio endpoint: só existe "eu" (sem Policy) |
| Ler os tipos de serviço | sim | sim | sim | `ServiceTypePolicy::viewAny` |
| Editar os tipos de serviço | sim | sim | não (403) | `ServiceTypePolicy::manage` |
| Ver o histórico do paciente | sim | sim | só de paciente que atende (404 nos outros) | Service do histórico (regra de "atende") |
| Agendar, editar, status, cancelar | sem mudança | sem mudança | sem mudança | `AppointmentPolicy` |

O admin passa no `Gate::before`. No SPA, `permissions.ts` ganha uma checagem
para esconder o "Editar tipos" do fisioterapeuta, só como UX.

### Isolamento

- Preferências: toda leitura e escrita filtra por `clinic_user_id` do usuário
  autenticado e grava o `clinic_id` dele. Não existe rota que receba o id de
  outro usuário.
- Tipos de serviço: o Repository sempre filtra por `clinic_id`, inclusive ao
  resolver os `id` do `PUT`. Um `id` de outra clínica nunca é atualizado nem
  apagado.
- Histórico: a consulta filtra por `clinic_id` antes de olhar o paciente.

### Colaboração entre módulos

Nenhum contrato ou evento novo. O ClinicScheduling continua usando
`ClinicUser` (papel e `clinic_id`) do jeito que já usa no `AppointmentService`.
O Clinic não lê nada do ClinicScheduling. As preferências guardam só chaves e
valores, sem saber o que a agenda faz com eles.

### Frontend

- `domain/`: `ServiceType`, `AgendaPreferences` (view e showWeekends) e o item
  do histórico do paciente, todos em camelCase.
- `application/`: ports e hooks React Query para preferências (ler + salvar),
  tipos de serviço (ler + salvar a lista) e histórico do paciente.
- `infrastructure/`: repositórios das preferências e dos tipos de serviço e o
  método de histórico no repositório de consultas, com mappers snake_case ↔
  camelCase, sempre pelo `apiClient`.
- A aparência dos status na v2 (`DS_STATUS` com tokens `--ds-*` e o rótulo
  "Falta") vira um módulo de UI da agenda v2. O `STATUS_COLORS` do `domain`
  fica como está para o que ainda é v1 (o dashboard, por exemplo).
- A coluna da esquerda é um componente só, usado no modo flutuante, no modo
  fixado e dentro do `DsDrawer` abaixo de `lg`.
- O estado do alfinete e as agendas visíveis ficam só em memória (não são
  preferência).

### Fila, integrações e cache

- Nenhum job novo. O Google Calendar continua recebendo o `location` e o
  `title` pelo fluxo que já existe.
- O toast de retorno do OAuth (`?google=`) passa para a agenda v2.
- Cache só no React Query: salvar os tipos invalida a lista de tipos, e
  agendar, editar, mudar status ou cancelar também invalida o histórico.

### Arquitetura

A tabela genérica de preferências é uma fronteira nova no módulo Clinic: um
registro de chaves que outros módulos ou telas vão estender. Vale um ADR curto
sobre "preferências do usuário da clínica: chave-valor com chaves registradas".
O repositório ainda não tem `docs/adr/`, então o ADR cria a pasta.

## Fatias Verticais

1. **Agenda v2 substitui a v1.** Tela A completa (coluna flutuante e fixável,
   gaveta abaixo de `lg`, busca, minicalendário, resumo, agendas por
   profissional escondidas para o fisio, Google Calendar com o toast de
   retorno, visões, fim de semana em memória) e modal F (cabeçalho, Resumo com
   status e cancelamento, Editar com RHF + Zod, local, atalhos de duração e os
   5 tipos ainda fixos no front). Deep-link "Nova consulta", `?patientId=`,
   arrastar e redimensionar com rollback. Remove a v1 e o protótipo. A aba
   Histórico ainda não entra. Só front.
2. **Preferências do usuário.** Tabela, chaves registradas, os dois endpoints,
   o ADR, a camada do front e a agenda lendo e gravando `agenda.view` e
   `agenda.show_weekends`. Depende da 1.
3. **Tipos de serviço por clínica.** Tabela, padrão na primeira leitura,
   `GET`/`PUT`, Policy, os atalhos do modal vindo da API com duração padrão e
   o editor "Editar tipos" no modal para admin e secretária. Depende da 1.
4. **Histórico completo do paciente.** Endpoint com a regra de "atende", a
   camada do front e a aba Histórico no modal (não aparece para evento do
   Google). Depende da 1.

As fatias 2, 3 e 4 são independentes entre si.

## Testes

- Backend: `php artisan test --filter=<Classe>` ou
  `vendor/bin/phpunit modules/Clinic/tests` e
  `vendor/bin/phpunit modules/ClinicScheduling/tests`. Na worktree, o banco é o
  Postgres do `fisio-app`, e `composer run test` funciona do Mac.
- Front: `npm run test` e `npm run types`. `bash bin/verificar.sh` roda tudo nos
  arquivos que mudaram desde a `main`.
- Padrão a copiar: `AppointmentIndexVisibilityTest` (ClinicScheduling), com
  `RefreshDatabase`, `Clinic::factory()`, `ClinicUser::factory()` com
  `role`, `Patient::factory()`, `Appointment::factory()` e
  `actingAs($user, 'clinic')->getJson('/api/clinic/...')`, verificando o
  envelope `data`. A autorização segue `AppointmentAuthorizationTest`.

Por decisão do usuário, os testes automatizados cobrem **as regras novas do
backend**. O front é conferido no smoke test com evidência (claro e escuro,
três papéis, duas clínicas).

**Preferências**
- O usuário grava `agenda.view` e lê de volta. Um segundo `PUT` atualiza, e não
  duplica.
- Uma chave fora da lista dá 422 no `GET` e no `PUT`. Um valor inválido para
  `agenda.view` e um valor que não é booleano para `agenda.show_weekends` dão
  422.
- O usuário A não vê a preferência do usuário B da mesma clínica. Um usuário da
  clínica B não vê nem altera nada da clínica A.
- Sem token: 401.

**Tipos de serviço**
- A primeira leitura de uma clínica nova devolve os 5 padrão com as durações
  certas e na ordem certa. A segunda leitura não duplica.
- O `PUT` cria, renomeia, muda a duração, reordena e remove.
- Depois de um `PUT` com lista vazia, o `GET` devolve lista vazia (os padrão
  não voltam).
- Nome repetido, duração fora de 5 a 480 e mais de 30 itens dão 422.
- Fisioterapeuta: `GET` 200, `PUT` 403. Secretária e admin: `PUT` 200.
- Um `id` da clínica B no `PUT` da clínica A dá 422, e a linha da B não muda.
  A clínica B não vê os tipos da A.

**Histórico**
- Admin e secretária veem todas as consultas do paciente, de qualquer
  profissional, em ordem de data, sem `description` e `location`.
- O Sicrano, com uma consulta futura não cancelada com o paciente, vê também as
  consultas do Fulano.
- Um fisio sem consulta com o paciente recebe 404. Um fisio que só teve
  consulta cancelada com ele também recebe 404.
- Um paciente sem consulta nesta clínica dá 404. Um paciente da clínica B
  pedido por um usuário da clínica A dá 404.

## Fora do Escopo

- Coluna própria para o tipo de local (clínica ou domicílio), para relatórios.
  O local continua sendo texto no `location`.
- Carregar consultas só do período visível. A agenda continua carregando todas
  as consultas, como a v1.
- Trocar "Falta" e as cores novas no que ainda é v1 (dashboard, prontuário).
- Salvar o alfinete da coluna e as agendas visíveis como preferência.
- Tipos de serviço com cor, preço ou vínculo com o financeiro. Um tipo é só
  nome + duração.
- Testes automatizados de front para a agenda e o modal v2 (decisão do
  usuário). O teste do modal v1 sai junto com o modal v1.
- Rever a regra de acesso do histórico quando a tarefa 013 da feature 002
  ("fisio vê só os pacientes dele") sair: o "paciente que atende" pode virar
  "paciente acessível" (responsável ou vínculo).

## Notas

- O protótipo está na branch atual, na pasta do protótipo da agenda
  (`AgendaPrototype`, `VariantA`, `WideAgenda`, `AgendaRail`, `shared`) e na
  subpasta `modal` (`ModalF`, `AppointmentForm`, `modal-shared`). As variantes
  descartadas estão no commit `e415a8c` da branch `feat/prototipo`.
- O FullCalendar exige opções estáveis fora do componente. Um objeto novo a
  cada render dispara `datesSet` em loop (já tratado no protótipo; manter).
- A tela v2 rola no próprio contêiner (`h-full overflow-y-auto`), porque
  `html` e `body` da v1 têm `overflow: hidden`.
- Texto na cor da marca precisa de `ds-dark:text-ds-primary-60` no escuro.
- Ao fechar a feature, registrar no `DEFERRED.md` da 002 a revisão da regra do
  histórico (item acima).
- A agenda depende do `ClinicLayout` com a topbar Z (feature 004), que já está
  pronta.
