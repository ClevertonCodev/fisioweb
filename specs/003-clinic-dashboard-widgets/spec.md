# Feature Specification: Dashboard da Clínica com Widgets por Papel

**Feature Branch**: `003-clinic-dashboard-widgets`

**Created**: 2026-06-18

**Status**: Draft

**Input**: User description: "Dashboard da clínica com widgets e ações rápidas, com visibilidade por papel (admin, secretário, fisioterapeuta). Cards de Pacientes ativos, Consultas hoje, Programas ativos, Exercícios disponíveis; listas de Próximas consultas e Aniversariantes do mês; gráficos de Captação de pacientes e Taxa de ocupação; feed de Atividades recentes; e ações rápidas. Substituir os dados mockados da tela atual por dados reais, com gráficos via Chart.js."

## Clarifications

### Session 2026-06-18

- Q: Taxa de ocupação — como definir o "tempo disponível" (denominador)? → A: Janela de atendimento configurável por clínica (horário início/fim + dias da semana), com padrão (ex.: 08:00–18:00, seg–sex); ocupação = soma das durações das consultas ÷ duração da janela no período.
- Q: Captação — o que define o "ano" do paciente e o que significa "últimos 3 anos"? → A: Base = data de cadastro do paciente; o widget mostra os últimos 3 anos (ano atual + 2 anteriores) separados por ano E o consolidado dos três juntos, em comparação.
- Q: Atividades recentes — quais eventos o log registra na v1? → A: novo paciente, paciente editado, programa criado, programa concluído, consulta agendada, consulta concluída, consulta cancelada, exercícios adicionados.
- Q: "Próximas consultas" — inclui as já passadas de hoje e quantas mostrar? → A: Todas as consultas de hoje (passadas + futuras), ordenadas por horário, limitadas a ~5 itens, com "Ver agenda" para o restante.
- Q: Taxa de ocupação — o que cada granularidade representa no eixo? → A: Diária = dias do mês corrente; Semanal = últimas 12 semanas; Mensal = meses do ano corrente.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Painel de indicadores e atalhos do dia (admin/secretário) (Priority: P1)

Um administrador ou secretário abre o dashboard da clínica e vê, com dados reais, o panorama do dia inteiro da clínica: os quatro cards de indicadores (Pacientes ativos, Consultas hoje, Programas ativos, Exercícios disponíveis), a lista de Próximas consultas de hoje, e as Ações rápidas no topo para iniciar as tarefas mais comuns. Todos os números refletem a clínica inteira (todos os fisioterapeutas).

**Why this priority**: É o coração da feature — substitui a tela atual com dados fixos por um painel operacional real. Mesmo sem gráficos nem feed de atividades, já entrega valor: o gestor enxerga a operação do dia e age a partir dela.

**Independent Test**: Autenticar como admin ou secretário com dados de clínica populados e confirmar que cada card e a lista de Próximas consultas exibem os valores reais agregados de toda a clínica, e que cada Ação rápida leva à tela correta.

**Acceptance Scenarios**:

1. **Given** um admin autenticado em uma clínica com pacientes em vários status, **When** abre o dashboard, **Then** o card "Pacientes ativos" mostra a contagem de todos os pacientes da clínica cujo status NÃO é óbito, cancelado nem alta.
2. **Given** um secretário autenticado, **When** abre o dashboard, **Then** o card "Consultas hoje" mostra a quantidade de consultas agendadas no calendário para a data de hoje, considerando todos os fisioterapeutas.
3. **Given** consultas existentes para hoje, **When** o dashboard carrega, **Then** a lista "Próximas consultas" exibe os pacientes/horários de hoje de toda a clínica, ordenados por horário.
4. **Given** o dashboard carregado, **When** o usuário clica em "Novo paciente", **Then** é levado ao cadastro de paciente; **e** "Agendar consulta" abre a agenda já com o modal "Nova consulta"; **e** "Criar programa" abre a página de criação de programa; **e** "Ver exercícios" abre a biblioteca de exercícios.
5. **Given** o card "Exercícios disponíveis", **When** o dashboard carrega, **Then** ele mostra a quantidade total de exercícios (vídeos) disponíveis e a quantidade de categorias.

---

### User Story 2 - Visão restrita do fisioterapeuta (Priority: P1)

Um fisioterapeuta abre o dashboard e vê os mesmos indicadores e listas, porém escopados apenas aos seus próprios pacientes/consultas/programas. Ele não vê dados de outros profissionais nem o feed de Atividades recentes da clínica, e na Taxa de ocupação enxerga somente a sua própria ocupação.

**Why this priority**: Sem o escopo correto por papel, dados de outros profissionais e da clínica inteira vazariam para o fisioterapeuta. É pré-requisito de uso real e de privacidade, no mesmo nível de criticidade da US1.

**Independent Test**: Autenticar como fisioterapeuta e confirmar que cada widget conta/lista apenas registros vinculados a ele, que o feed de Atividades recentes não aparece, e que a Taxa de ocupação mostra apenas a dele.

**Acceptance Scenarios**:

1. **Given** um fisioterapeuta autenticado, **When** abre o dashboard, **Then** o card "Pacientes ativos" conta apenas os pacientes ativos vinculados a ele.
2. **Given** um fisioterapeuta autenticado, **When** abre o dashboard, **Then** os cards "Consultas hoje" e "Programas ativos" e a lista "Próximas consultas" consideram apenas registros em que ele é o responsável.
3. **Given** um fisioterapeuta autenticado, **When** abre o dashboard, **Then** o widget "Atividades recentes" NÃO é exibido.
4. **Given** um fisioterapeuta autenticado, **When** vê a "Taxa de ocupação", **Then** o seletor de fisioterapeuta não está disponível e o gráfico mostra apenas a ocupação dele.
5. **Given** um fisioterapeuta autenticado, **When** vê "Aniversariantes do mês" e "Captação de pacientes", **Then** ambos consideram apenas os pacientes vinculados a ele.

---

### User Story 3 - Admin que também atende como fisioterapeuta alterna entre "Tudo" e "Somente meus" (Priority: P2)

Um administrador que também atende pacientes quer ver, nos cards e listas escopáveis (Pacientes ativos, Consultas hoje, Programas ativos, Próximas consultas), tanto o total da clínica quanto apenas o que é dele. Para isso há, em cada um desses widgets, um controle para alternar entre "Toda a clínica" e "Somente meus".

**Why this priority**: Melhora a usabilidade para o admin-atendente, mas o painel já é plenamente funcional sem o toggle (US1 e US2). Por isso P2.

**Independent Test**: Autenticar como admin, ativar o controle "Somente meus" em um card escopável e confirmar que a contagem muda para considerar apenas registros vinculados ao admin; desativar e confirmar que volta ao total da clínica.

**Acceptance Scenarios**:

1. **Given** um admin autenticado, **When** o dashboard carrega, **Then** cada widget escopável (Pacientes ativos, Consultas hoje, Programas ativos, Próximas consultas) exibe um controle "Toda a clínica / Somente meus", iniciando em "Toda a clínica".
2. **Given** um admin com o controle em "Somente meus", **When** o widget recarrega, **Then** ele conta/lista apenas registros vinculados ao próprio admin.
3. **Given** um secretário autenticado, **When** o dashboard carrega, **Then** o controle "Somente meus" NÃO é exibido (secretário sempre vê toda a clínica).

---

### User Story 4 - Gráfico de Taxa de ocupação por fisioterapeuta e período (Priority: P2)

Admin e secretário escolhem de qual fisioterapeuta querem ver a Taxa de ocupação e alternam a granularidade entre Diária, Semanal e Mensal. O gráfico mostra o percentual de tempo agendado em relação ao tempo disponível. O admin que atende pode escolher a si mesmo; o fisioterapeuta vê apenas a própria ocupação, sem seletor.

**Why this priority**: É um indicador gerencial valioso porém secundário em relação ao painel operacional do dia. Depende de um gráfico (Chart.js) e de regra de cálculo de ocupação, então é entregue após o núcleo.

**Independent Test**: Autenticar como admin, selecionar um fisioterapeuta e cada granularidade, e confirmar que o gráfico e o percentual-resumo refletem os agendamentos daquele profissional no período.

**Acceptance Scenarios**:

1. **Given** um admin no dashboard, **When** abre o seletor da "Taxa de ocupação", **Then** lista os fisioterapeutas da clínica (incluindo o próprio admin, se atender) e permite escolher um.
2. **Given** um fisioterapeuta escolhido e a granularidade "Diária", **When** o gráfico carrega, **Then** exibe a ocupação por dia do mês e um percentual-resumo de "tempo agendado".
3. **Given** as abas Diária/Semanal/Mensal, **When** o usuário troca de aba, **Then** o gráfico e o resumo são recalculados para a granularidade escolhida.
4. **Given** um fisioterapeuta autenticado (não admin), **When** vê a Taxa de ocupação, **Then** não há seletor de profissional e o gráfico mostra apenas a ocupação dele.

---

### User Story 5 - Aniversariantes do mês com atalho de WhatsApp (Priority: P2)

O usuário vê a lista de pacientes aniversariantes do mês corrente, com foto/inicial, nome e dia, e um botão "Enviar mensagem" via WhatsApp para cada um. Admin e secretário veem todos os aniversariantes da clínica; o fisioterapeuta vê apenas os seus pacientes.

**Why this priority**: É um recurso de relacionamento útil, mas não bloqueia a operação diária. P2.

**Independent Test**: Autenticar como cada papel em um mês com aniversariantes e confirmar a lista correta por papel, ordenada por dia, e que "Enviar mensagem" abre o WhatsApp do paciente.

**Acceptance Scenarios**:

1. **Given** pacientes com data de nascimento no mês corrente, **When** o admin abre o dashboard, **Then** vê todos os aniversariantes do mês da clínica, com a contagem total e ordenados por dia.
2. **Given** um fisioterapeuta autenticado, **When** vê os aniversariantes, **Then** vê apenas os do mês entre seus próprios pacientes.
3. **Given** um aniversariante com telefone cadastrado, **When** clica em "Enviar mensagem", **Then** é iniciada uma conversa de WhatsApp com aquele paciente.

---

### User Story 6 - Captação de pacientes por origem (Priority: P3)

O usuário vê a distribuição dos pacientes por origem/indicação (ex.: Médico, Não informado), comparando os últimos 3 anos (ano corrente + 2 anteriores): cada ano separadamente e o consolidado dos três juntos, com legenda em percentuais e uma tabela complementar de quantidades e percentuais. A base de cada paciente é a sua data de cadastro. Admin e secretário veem toda a clínica; o fisioterapeuta vê apenas os seus pacientes.

**Why this priority**: Indicador analítico de marketing/origem, valioso mas o menos crítico para a operação diária. P3.

**Independent Test**: Autenticar como cada papel, escolher um ano e confirmar que a rosca e a tabela refletem a distribuição por origem dos pacientes captados naquele recorte, respeitando o escopo do papel.

**Acceptance Scenarios**:

1. **Given** pacientes com diferentes origens de indicação, **When** o admin abre o widget, **Then** vê a quantidade e o percentual por origem para cada um dos últimos 3 anos e para o consolidado dos três juntos.
2. **Given** a visão comparativa, **When** o admin observa os três anos lado a lado, **Then** consegue comparar a evolução da captação por origem entre os anos.
3. **Given** um fisioterapeuta autenticado, **When** vê a Captação, **Then** considera apenas os pacientes vinculados a ele.

---

### User Story 7 - Feed de Atividades recentes da clínica (admin/secretário) (Priority: P3)

Admin e secretário veem um feed do que aconteceu na clínica no dia — por exemplo, programa criado, consulta finalizada, novo paciente cadastrado, exercícios adicionados — com descrição e tempo relativo ("10 min atrás"). O fisioterapeuta não vê este widget.

**Why this priority**: Útil para acompanhamento gerencial, porém não bloqueia a operação e depende de definir a fonte das atividades. P3.

**Independent Test**: Autenticar como admin/secretário após algumas ações na clínica no dia e confirmar que o feed lista esses eventos com descrição e tempo relativo, em ordem cronológica reversa; autenticar como fisioterapeuta e confirmar que o widget não aparece.

**Acceptance Scenarios**:

1. **Given** ações realizadas na clínica hoje (ex.: novo paciente, programa criado, consulta concluída), **When** o admin abre o dashboard, **Then** o feed "Atividades recentes" lista esses eventos, mais recente primeiro, com descrição e tempo relativo.
2. **Given** um fisioterapeuta autenticado, **When** abre o dashboard, **Then** o feed "Atividades recentes" não é exibido.
3. **Given** um dia sem atividades registradas, **When** o admin abre o dashboard, **Then** o feed mostra um estado vazio amigável.

---

### Edge Cases

- **Clínica/fisioterapeuta sem dados**: cada card mostra zero e cada lista/gráfico mostra um estado vazio amigável, sem erro.
- **Admin que NÃO atende pacientes**: o controle "Somente meus" pode aparecer mas resultar em zero; o admin é incluído no seletor da Taxa de ocupação apenas se tiver agendamentos. (Ver Assumptions.)
- **Paciente sem data de nascimento**: não aparece em Aniversariantes.
- **Paciente sem telefone**: o botão "Enviar mensagem" fica indisponível ou indica ausência de telefone.
- **Paciente sem origem de indicação**: contabilizado como "Não informado" na Captação.
- **Programa "ativo" de paciente que não está mais ativo**: o card "Programas ativos" conta apenas programas ativos de pacientes que estão ativos no mês corrente (programas de pacientes em óbito/cancelado/alta não contam).
- **Consulta de hoje cancelada**: excluída de "Consultas hoje" e de "Próximas consultas".
- **Fuso horário**: "hoje" e "mês corrente" são calculados no fuso da clínica.
- **Vídeo de exercício ainda em processamento**: excluído da contagem de "Exercícios disponíveis".

## Requirements *(mandatory)*

### Functional Requirements

#### Visibilidade e papéis (transversal)

- **FR-001**: O sistema MUST escopar todos os widgets à clínica do usuário autenticado (nenhum dado de outra clínica é exibido).
- **FR-002**: Para admin e secretário, os widgets escopáveis (Pacientes ativos, Consultas hoje, Programas ativos, Próximas consultas) MUST considerar, por padrão, toda a clínica.
- **FR-003**: Para fisioterapeuta, todos os widgets MUST considerar apenas registros vinculados a ele (pacientes, consultas e programas em que é o responsável).
- **FR-004**: Para admin, cada widget escopável MUST oferecer um controle para alternar entre "Toda a clínica" e "Somente meus"; para secretário esse controle NÃO é exibido.
- **FR-005**: O backend MUST ser a autoridade de visibilidade: mesmo que a UI esconda um controle, uma requisição fora do escopo permitido ao papel MUST ser negada/ignorada (nunca retornar dados de fora do escopo do papel).

#### Cards de indicadores

- **FR-006**: O card "Pacientes ativos" MUST contar pacientes cujo status NÃO é óbito, cancelado nem alta (ativos = em tratamento, em treinamento, em prevenção), respeitando o escopo do papel.
- **FR-007**: O card "Consultas hoje" MUST contar as consultas agendadas no calendário para a data de hoje (fuso da clínica), respeitando o escopo do papel.
- **FR-008**: O card "Programas ativos" MUST contar programas de tratamento com status ativo, pertencentes a pacientes ativos, vigentes no mês corrente, respeitando o escopo do papel.
- **FR-009**: O card "Exercícios disponíveis" MUST exibir a quantidade total de exercícios (vídeos) disponíveis e a quantidade de categorias correspondentes; esse card NÃO é escopável por papel.

#### Próximas consultas

- **FR-010**: A lista "Próximas consultas" MUST exibir as consultas de hoje — incluindo as já passadas e as futuras — (paciente, tipo/título e horário), ordenadas por horário, respeitando o escopo do papel.
- **FR-010a**: A lista MUST limitar a exibição a ~5 itens e oferecer o atalho "Ver agenda" para acessar as demais consultas do dia.
- **FR-011**: Cada item da lista MUST indicar o status da consulta (ex.: Confirmada, Pendente/Agendada) e permitir navegar para a agenda ("Ver agenda").

#### Aniversariantes do mês

- **FR-012**: O widget "Aniversariantes do mês" MUST listar os pacientes cujo dia/mês de nascimento cai no mês corrente, com foto/inicial, nome e dia, ordenados por dia, e exibir a contagem total.
- **FR-013**: Admin e secretário MUST ver todos os aniversariantes da clínica; o fisioterapeuta MUST ver apenas os seus pacientes.
- **FR-014**: Cada item MUST oferecer a ação "Enviar mensagem" que inicia uma conversa de WhatsApp com o paciente; quando o paciente não tiver telefone, a ação MUST ficar indisponível.

#### Captação de pacientes

- **FR-015**: O widget "Captação de pacientes" MUST agregar os pacientes por origem/indicação (base = data de cadastro do paciente) e exibir a distribuição em gráfico e tabela com quantidade e percentual por origem.
- **FR-016**: O widget MUST comparar os **últimos 3 anos** (ano corrente + 2 anteriores), apresentando cada ano **separadamente** e também o **consolidado dos três anos juntos**, de forma a permitir comparação da captação entre os anos.
- **FR-017**: Pacientes sem origem informada MUST ser agregados como "Não informado".
- **FR-018**: Admin e secretário MUST ver toda a clínica; o fisioterapeuta MUST ver apenas os seus pacientes.

#### Taxa de ocupação

- **FR-019**: O widget "Taxa de ocupação" MUST exibir o percentual de tempo agendado em relação ao tempo disponível e um gráfico por período, com granularidades Diária, Semanal e Mensal.
- **FR-019a**: O "tempo disponível" MUST ser derivado de uma **janela de atendimento configurável por clínica** (horário de início, horário de fim e dias da semana atendidos), com um padrão sensato quando não configurada (ex.: 08:00–18:00, seg–sex). A ocupação no período = soma das durações das consultas (não canceladas) ÷ duração total da janela de atendimento no mesmo período.
- **FR-019b**: Cada granularidade MUST cobrir: **Diária** = dias do mês corrente; **Semanal** = últimas 12 semanas; **Mensal** = meses do ano corrente.
- **FR-020**: Admin e secretário MUST poder escolher de qual fisioterapeuta ver a ocupação (incluindo o próprio admin, se atender); o fisioterapeuta MUST ver apenas a própria ocupação, sem seletor.
- **FR-021**: Ao trocar de granularidade ou de fisioterapeuta, o gráfico e o percentual-resumo MUST ser recalculados.

#### Atividades recentes

- **FR-022**: O widget "Atividades recentes" MUST listar os eventos ocorridos na clínica no dia (ex.: novo paciente, programa criado, consulta concluída, exercícios adicionados), mais recente primeiro, com descrição e tempo relativo.
- **FR-022a**: O sistema MUST manter um registro dedicado de atividades, gravando um evento (tipo, descrição, ator, instante, clínica) sempre que uma ação relevante ocorre; o widget consome esse registro.
- **FR-022b**: A v1 do log MUST cobrir os seguintes tipos de evento: novo paciente cadastrado, paciente editado, programa criado, programa concluído, consulta agendada, consulta concluída, consulta cancelada e exercícios adicionados.
- **FR-023**: O widget "Atividades recentes" MUST ser visível apenas para admin e secretário; o fisioterapeuta NÃO o vê.
- **FR-024**: Quando não houver atividades no dia, o widget MUST exibir um estado vazio amigável.

#### Ações rápidas

- **FR-025**: A seção "Ações rápidas" MUST aparecer no topo do dashboard, antes dos cards, com as ações: Novo paciente, Agendar consulta, Criar programa, Ver exercícios.
- **FR-026**: "Novo paciente" MUST levar ao cadastro de paciente; "Agendar consulta" MUST abrir a agenda já com o modal "Nova consulta"; "Criar programa" MUST levar à criação de programa; "Ver exercícios" MUST levar à biblioteca de exercícios.

#### Layout e apresentação

- **FR-027**: O dashboard MUST organizar os blocos nesta ordem: (1) Ações rápidas, (2) linha de cards (Pacientes ativos, Consultas hoje, Programas ativos, Exercícios disponíveis), (3) Próximas consultas com Aniversariantes do mês ao lado, (4) Captação de pacientes, (5) Taxa de ocupação, (6) Atividades recentes.
- **FR-028**: Os dados mockados/fixos da tela atual MUST ser substituídos por dados reais da clínica.
- **FR-029**: Cada widget MUST tratar estados de carregamento, vazio e erro sem quebrar o restante do painel.

### Key Entities *(include if feature involves data)*

- **Paciente**: pessoa atendida pela clínica. Atributos relevantes: status (ativo = não óbito/cancelado/alta), data de nascimento (aniversariantes), origem/indicação (captação), telefone (WhatsApp), fisioterapeuta responsável (escopo do papel), clínica.
- **Consulta (Appointment)**: compromisso no calendário. Atributos relevantes: data/hora de início e fim, status, fisioterapeuta responsável, paciente, clínica. Base para "Consultas hoje", "Próximas consultas" e "Taxa de ocupação".
- **Programa de tratamento (TreatmentPlan)**: plano de exercícios de um paciente. Atributos relevantes: status (ativo), vigência (mês corrente), fisioterapeuta responsável, paciente, clínica. Base para "Programas ativos".
- **Exercício / Vídeo**: item da biblioteca de exercícios e suas categorias. Base para "Exercícios disponíveis".
- **Usuário da clínica (ClinicUser)**: admin, secretário ou fisioterapeuta; determina visibilidade e escopo dos widgets.
- **Janela de atendimento da clínica**: configuração por clínica com horário de início, horário de fim e dias da semana atendidos; serve de denominador ("tempo disponível") no cálculo da Taxa de ocupação.
- **Atividade recente (log dedicado)**: registro persistido de um evento ocorrido na clínica (criação de paciente, programa, conclusão de consulta etc.), com tipo, descrição, ator (usuário que realizou), instante de ocorrência e clínica.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos widgets exibem dados reais da clínica (nenhum valor fixo/mockado permanece na tela).
- **SC-002**: Para cada papel (admin, secretário, fisioterapeuta), os widgets exibem exatamente o conjunto de dados permitido — verificável reproduzindo as regras de visibilidade e comparando contagens.
- **SC-003**: O dashboard carrega o conteúdo inicial visível (ações rápidas, cards e próximas consultas) em até 2 segundos para uma clínica de porte típico.
- **SC-004**: Nenhum widget vaza dados de fora do escopo do papel, mesmo quando a requisição é forjada — verificável por teste de autorização no backend.
- **SC-005**: Cada Ação rápida leva o usuário à tela correta em 1 clique, e "Agendar consulta" já abre o modal "Nova consulta".
- **SC-006**: A falha de um widget isolado não impede a renderização dos demais (degradação graciosa).
- **SC-007**: A Taxa de ocupação reflete corretamente os controles (granularidade, fisioterapeuta) ao serem alterados, e a Captação apresenta corretamente a comparação dos últimos 3 anos, tudo sem recarregar a página.

## Assumptions

- **Papéis**: o modelo de usuário da clínica possui um único papel entre admin, secretário e fisioterapeuta. "Admin que também é fisioterapeuta" é interpretado como um usuário de papel admin que possui registros (pacientes/consultas/programas) vinculados a ele; o controle "Somente meus" e a sua presença no seletor da Taxa de ocupação baseiam-se nesse vínculo.
- **Pacientes ativos**: ativos = status diferente de óbito, cancelado e alta (ou seja, em tratamento, em treinamento ou em prevenção).
- **"Hoje" e "mês corrente"**: calculados no fuso horário da clínica.
- **Consultas hoje / Próximas consultas**: consideram consultas com início na data de hoje; consultas canceladas são excluídas.
- **Programas ativos**: contam programas com status ativo, de pacientes ativos, cuja vigência (período de início/fim) intersecta o mês corrente.
- **Exercícios disponíveis**: contagem de vídeos de exercício prontos para uso (processamento concluído) e o número de categorias correspondentes; vídeos ainda em processamento/falha são excluídos.
- **Captação de pacientes**: agrupada pela origem/indicação do paciente, usando a data de cadastro como base; "Não informado" cobre ausência de origem; o widget compara os últimos 3 anos (corrente + 2 anteriores), cada ano separado e o consolidado dos três juntos.
- **Taxa de ocupação**: percentual = tempo agendado ÷ tempo disponível no período; "tempo disponível" vem de uma janela de atendimento configurável por clínica (início/fim + dias da semana), com padrão 08:00–18:00 seg–sex quando não configurada; granularidades — Diária = dias do mês corrente, Semanal = últimas 12 semanas, Mensal = meses do ano corrente.
- **Atividades recentes**: o feed cobre eventos do dia corrente e é alimentado por um **registro dedicado de atividades** — um novo log gravado sempre que ações relevantes ocorrem (novo paciente, programa criado, consulta concluída, exercícios adicionados, etc.), com tipo, descrição, ator, instante e clínica.
- **WhatsApp**: a ação "Enviar mensagem" reutiliza o mecanismo de WhatsApp já existente no projeto.
- **Gráficos**: implementados com Chart.js, conforme solicitado.
- **Reaproveitamento**: a feature evolui o endpoint/tela de dashboard já existentes da clínica, em vez de criar um contexto novo.
