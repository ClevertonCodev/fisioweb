# Feature Specification: Agendamento de Consultas com Google Calendar

**Feature Branch**: `002-appointment-scheduling`

**Created**: 2026-06-16

**Status**: Draft

**Input**: User description: "Agendamento de consultas com integração Google Calendar — módulo Clinic. Backend primeiro, depois remover mock e fazer frontend. Modal Nova Consulta (paciente, fisioterapeuta, início, término, título, observações, local). Integração bidirecional com Google Calendar. Autorização por papel (admin/secretário veem tudo e marcam para qualquer fisio; fisioterapeuta só vê e marca para si). Ao agendar, disparar evento de notificação para fisio e paciente (canal a decidir depois). Status: Agendada, Confirmada, Não compareceu, Concluída, Cancelada. Visões: Mês, Semana, Dia, Lista. Filtros por fisioterapeuta e por status."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Agendar uma consulta (Priority: P1)

Um usuário da clínica (admin, secretário ou fisioterapeuta) abre a Agenda, clica em "Nova Consulta" (ou clica/arrasta sobre um intervalo do calendário) e preenche o formulário: paciente, fisioterapeuta responsável, início, término, título, observações e local. Ao confirmar, a consulta é criada com status "Agendada", aparece imediatamente no calendário com a cor do status, e dispara as ações de pós-agendamento (enfileirar a notificação de fisio + paciente e, quando o fisioterapeuta responsável tiver o Google conectado, criar o evento no Google Calendar — ver User Story 4).

**Why this priority**: É o coração da feature — sem criar consultas, nada mais tem valor. Entrega um MVP utilizável mesmo sem as demais histórias.

**Independent Test**: Criar uma consulta válida pelo modal e confirmar que ela persiste, aparece no calendário com a cor correta e tem os campos preenchidos.

**Acceptance Scenarios**:

1. **Given** um secretário autenticado na clínica, **When** ele clica em "Nova Consulta", seleciona paciente, fisioterapeuta, define início/término e confirma, **Then** a consulta é criada com status "Agendada" e exibida no calendário.
2. **Given** o calendário aberto na visão Semana, **When** o usuário clica em um intervalo de horário livre, **Then** o mesmo modal abre com início/término pré-preenchidos pelo intervalo selecionado.
3. **Given** um formulário com término anterior ou igual ao início, **When** o usuário tenta confirmar, **Then** o sistema bloqueia o envio e exibe mensagem de validação.
4. **Given** uma consulta criada com sucesso, **When** a criação conclui, **Then** o sistema enfileira a notificação para fisioterapeuta e paciente; **e**, **se** o fisioterapeuta responsável tiver o Google Calendar conectado (ver User Story 4), o evento correspondente é criado no Google de forma assíncrona.

---

### User Story 2 - Visualizar e filtrar a agenda conforme o papel (Priority: P1)

O usuário visualiza as consultas no calendário em quatro visões (Mês, Semana, Dia, Lista) e pode filtrar por fisioterapeuta e por status. A visibilidade respeita o papel: admin e secretário veem todas as consultas e todos os pacientes da clínica; o fisioterapeuta vê apenas as suas próprias consultas.

**Why this priority**: A visualização correta e segura por papel é pré-requisito de uso real; sem ela, dados de outros profissionais vazariam ou a agenda ficaria inútil.

**Independent Test**: Autenticar como cada papel e confirmar que o conjunto de consultas e de fisioterapeutas/pacientes disponíveis corresponde às regras de visibilidade.

**Acceptance Scenarios**:

1. **Given** um fisioterapeuta autenticado, **When** abre a Agenda, **Then** vê apenas as consultas em que ele é o responsável, e o filtro de fisioterapeutas não permite ver os horários de outros.
2. **Given** um admin ou secretário, **When** abre a Agenda, **Then** vê as consultas de todos os fisioterapeutas da clínica e pode filtrar por qualquer um deles.
3. **Given** qualquer usuário, **When** seleciona um status no filtro, **Then** o calendário mostra apenas as consultas com aquele status.
4. **Given** qualquer usuário, **When** alterna entre Mês, Semana, Dia e Lista, **Then** as mesmas consultas filtradas são reapresentadas na visão escolhida.

---

### User Story 3 - Autorização ao marcar horário (Priority: P1)

Quem cria a consulta só pode escolher o fisioterapeuta de acordo com seu papel: admin e secretário podem marcar para qualquer fisioterapeuta e para qualquer paciente da clínica; o fisioterapeuta só pode marcar para si mesmo (o seletor de fisioterapeuta fica fixo nele).

**Why this priority**: É uma regra de segurança/negócio crítica. Frontend esconde para UX, mas o backend é a fonte de verdade e deve rejeitar tentativas fora da regra.

**Independent Test**: Tentar criar, como fisioterapeuta, uma consulta atribuída a outro fisioterapeuta e confirmar que o backend rejeita, mesmo que a UI seja contornada.

**Acceptance Scenarios**:

1. **Given** um fisioterapeuta, **When** abre o modal de Nova Consulta, **Then** o campo Fisioterapeuta está fixo nele e não pode ser alterado.
2. **Given** um fisioterapeuta que envia uma requisição com outro fisioterapeuta como responsável, **When** o backend processa, **Then** a requisição é rejeitada com erro de autorização.
3. **Given** um admin ou secretário, **When** cria uma consulta, **Then** pode escolher qualquer fisioterapeuta e qualquer paciente da clínica.

---

### User Story 4 - Conectar a conta Google e sincronizar bidirecionalmente (Priority: P2)

Cada fisioterapeuta pode, no seu cadastro de usuário, optar por conectar a própria conta Google Calendar. Uma vez conectado, ao salvar uma consulta atribuída a ele, um evento correspondente é criado/atualizado no calendário Google daquele profissional. Eventos criados ou alterados diretamente no calendário Google do profissional passam a aparecer no calendário do sistema (apenas para a agenda dele). Alterações de horário, cancelamento e exclusão se propagam entre os dois lados.

**Why this priority**: É um diferencial importante, mas a clínica já tem valor com agendamento interno (P1). Pode ser entregue logo após o núcleo. Depende de cada profissional conectar a conta.

**Independent Test**: Conectar a conta Google de um fisioterapeuta pelo cadastro, criar uma consulta para ele e confirmar que aparece no Google Calendar dele; criar um evento no calendário dele e confirmar que aparece no sistema após a sincronização.

**Acceptance Scenarios**:

1. **Given** um fisioterapeuta no cadastro de usuário, **When** ele opta por conectar o Google Calendar e autoriza, **Then** a conta fica vinculada ao usuário e disponível para sincronização.
2. **Given** um fisioterapeuta com Google conectado, **When** uma consulta atribuída a ele é criada, **Then** um evento equivalente existe no calendário Google dele com mesmo título, horário e dados.
3. **Given** uma consulta cujo horário foi alterado no sistema, **When** a alteração é salva, **Then** o evento correspondente no calendário Google do profissional é atualizado.
4. **Given** um evento novo criado diretamente no calendário Google de um fisioterapeuta conectado, **When** a sincronização ocorre, **Then** ele aparece na agenda do sistema daquele profissional.
5. **Given** uma consulta cancelada/excluída em um dos lados, **When** a sincronização ocorre, **Then** o outro lado reflete o cancelamento/exclusão sem duplicar o evento.
6. **Given** um fisioterapeuta sem Google conectado, **When** uma consulta é criada para ele, **Then** a consulta é salva normalmente no sistema e nenhuma sincronização é tentada.

---

### User Story 5 - Atualizar status e dados da consulta (Priority: P2)

A partir do calendário, o usuário pode abrir uma consulta existente, editar seus dados (horário, título, observações, local) e alterar seu status entre Agendada, Confirmada, Não compareceu, Concluída e Cancelada. A cor no calendário reflete o status atual.

**Why this priority**: Necessário para o ciclo de vida real da consulta, mas a criação (P1) já entrega valor. As cores de status já existem na UI mockada.

**Independent Test**: Abrir uma consulta, mudar o status e confirmar que a cor no calendário muda e que a mudança persiste.

**Acceptance Scenarios**:

1. **Given** uma consulta "Agendada", **When** o usuário muda o status para "Confirmada", **Then** a cor do bloco no calendário muda para a cor de Confirmada e a alteração persiste.
2. **Given** uma consulta existente, **When** o usuário edita o horário e salva, **Then** o calendário e o Google Calendar refletem o novo horário.
3. **Given** uma consulta cuja hora de início ainda não chegou, **When** o usuário tenta marcá-la como "Concluída" ou "Não compareceu", **Then** o backend rejeita a transição.
4. **Given** uma consulta "Cancelada", **When** o usuário tenta retorná-la para "Agendada" ou "Confirmada", **Then** o backend rejeita a transição.
5. **Given** uma consulta cancelada, **When** o cancelamento é salvo, **Then** o evento correspondente é removido do Google Calendar do responsável e a consulta permanece no histórico com status "Cancelada".

---

### Edge Cases

- **Conflito de horário (double-booking)**: ao agendar para um fisioterapeuta já ocupado no intervalo, o sistema avisa sobre a sobreposição; assume-se que permite continuar (apenas alerta), salvo decisão contrária.
- **Término ≤ início**: bloqueado na validação.
- **Falha na criação do evento no Google Calendar**: a consulta ainda é salva no sistema; a sincronização com o Google é tentada de forma assíncrona e re-tentada em caso de falha, sem perder a consulta.
- **Fisioterapeuta sem Google conectado**: a consulta é criada normalmente no sistema; nenhuma sincronização é tentada.
- **Fisioterapeuta desconecta o Google**: novas consultas deixam de sincronizar; consultas e vínculos existentes não são apagados do sistema.
- **Evento do Google Calendar sem paciente correspondente**: aparece na agenda do profissional como evento externo, sem vínculo a um paciente cadastrado.
- **Fisioterapeuta inativo ou removido**: não aparece como opção para novas consultas; consultas passadas permanecem visíveis.
- **Edição de consulta por fisioterapeuta de outra agenda**: rejeitada pelo backend.
- **Transição de status inválida**: rejeitada pelo backend (ex.: marcar "Concluída" antes do horário de início, ou reativar uma "Cancelada").
- **Cancelamento**: muda o status para "Cancelada" e remove o evento no Google do responsável; não há exclusão definitiva da consulta.

## Clarifications

### Session 2026-06-16

- Q: Como o sistema deve puxar eventos criados/alterados direto no Google (sync reverso Google→sistema)? → A: Polling periódico (job agendado usando sync tokens; latência de alguns minutos).
- Q: Como tratar fuso horário nos horários das consultas (armazenamento e sync)? → A: Armazenar em UTC; exibir/converter pelo fuso da clínica; enviar ao Google com timezone explícito.
- Q: Uma consulta pode ser excluída de vez ou só cancelada? → A: Só cancelar (status Cancelada + remoção do evento no Google); sem hard delete.
- Q: As transições de status são livres ou restritas? → A: Restritas por fluxo de negócio.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir criar uma consulta informando paciente, fisioterapeuta responsável, início, término, título (opcional), observações (opcional) e local (opcional).
- **FR-002**: O sistema MUST oferecer dois caminhos de criação que abrem o mesmo formulário: o botão "Nova Consulta" e o clique/seleção de um intervalo no calendário (pré-preenchendo início/término).
- **FR-003**: O sistema MUST validar que o término é posterior ao início antes de salvar.
- **FR-004**: O sistema MUST atribuir o status "Agendada" a toda consulta recém-criada.
- **FR-005**: O sistema MUST suportar os status Agendada, Confirmada, Não compareceu, Concluída e Cancelada, cada um com cor distinta no calendário.
- **FR-006**: O sistema MUST permitir editar dados e alterar o status de uma consulta existente, respeitando as transições válidas (ver FR-023).
- **FR-007**: O sistema MUST exibir as consultas em visões de Mês, Semana, Dia e Lista.
- **FR-008**: O sistema MUST permitir filtrar as consultas exibidas por fisioterapeuta e por status.
- **FR-009**: O sistema MUST restringir a visibilidade por papel: admin e secretário veem todas as consultas e todos os pacientes da clínica; fisioterapeuta vê apenas as próprias consultas.
- **FR-010**: O sistema MUST impedir que um fisioterapeuta crie ou edite consultas atribuídas a outro fisioterapeuta; admin e secretário podem atribuir a qualquer fisioterapeuta da clínica.
- **FR-011**: A autorização MUST ser garantida no backend (fonte de verdade), independentemente do que a interface exibe ou esconde.
- **FR-012**: Os pacientes e fisioterapeutas oferecidos no formulário MUST pertencer à clínica do usuário autenticado e respeitar a regra de papel.
- **FR-013**: O sistema MUST oferecer, no cadastro de usuário, a opção de cada usuário da clínica conectar/desconectar a própria conta Google Calendar (autorização individual por usuário).
- **FR-014**: A sincronização com o Google é sempre **por usuário e da própria agenda**: cada usuário conectado só envia/recebe no seu Google Calendar os agendamentos associados a ele mesmo (consultas em que é o responsável). O agendamento do sistema é a fonte de verdade; o evento Google é gerado após salvar.
- **FR-015**: Ao salvar uma consulta cujo responsável tem Google conectado, o sistema MUST criar/atualizar um evento correspondente no calendário Google **desse usuário** de forma assíncrona, com re-tentativa em caso de falha, sem bloquear nem perder a consulta.
- **FR-016**: O sistema MUST refletir na agenda do sistema os eventos criados/alterados/cancelados diretamente no calendário Google de cada usuário conectado, atribuídos à agenda **daquele usuário** (nunca à de outros), por meio de **polling periódico** (job agendado que consulta o Google em intervalos usando sync tokens incrementais). Não há dependência de endpoint público (webhook) nesta feature.
- **FR-017**: O sistema MUST manter a correspondência entre uma consulta e seu evento no Google Calendar (por usuário) para evitar duplicação ao sincronizar nos dois sentidos.
- **FR-018**: Quando o responsável pela consulta não tem Google conectado, o sistema MUST salvar a consulta normalmente sem tentar sincronização.
- **FR-019**: A regra de sincronização Google (por usuário, só a própria agenda) é INDEPENDENTE da visibilidade interna (FR-009): admin/secretário continuam vendo toda a agenda da clínica no sistema, mas no Google de cada um aparece apenas a agenda dele mesmo.
- **FR-020**: Ao concluir um agendamento, o sistema MUST disparar (enfileirar) um evento de notificação dirigido ao fisioterapeuta e ao paciente; a entrega efetiva por um canal específico (e-mail/SMS/WhatsApp) fica fora do escopo desta feature.
- **FR-021**: O sistema MUST isolar os dados por clínica (multi-tenant): uma clínica nunca vê consultas, pacientes ou fisioterapeutas de outra.
- **FR-022**: O sistema MUST tratar falhas de integração com o Google Calendar sem corromper o estado interno da consulta nem produzir eventos duplicados.
- **FR-023**: O sistema MUST restringir as transições de status por fluxo de negócio: (a) os status "Concluída" e "Não compareceu" só podem ser definidos após o horário de início da consulta; (b) uma consulta "Cancelada" não pode retornar para "Agendada" ou "Confirmada"; (c) "Confirmada" só a partir de "Agendada". Transições inválidas MUST ser rejeitadas pelo backend.
- **FR-024**: O sistema MUST permitir cancelar uma consulta (status "Cancelada"), o que remove o evento correspondente no Google Calendar do responsável; o sistema MUST NOT oferecer exclusão definitiva (hard delete) de consultas — o histórico é preservado.
- **FR-025**: O sistema MUST armazenar os horários das consultas em UTC, exibi-los/convertê-los pelo fuso horário da clínica, e enviar ao Google Calendar com timezone explícito.

### Key Entities *(include if feature involves data)*

- **Consulta (Appointment)**: agendamento de uma sessão. Atributos: paciente, fisioterapeuta responsável, início e término (armazenados em UTC), título, observações, local, status (Agendada/Confirmada/Não compareceu/Concluída/Cancelada), vínculo com o evento externo do Google Calendar, e a clínica dona. Relaciona-se a um Paciente e a um Fisioterapeuta (usuário da clínica). Nunca é excluída definitivamente — o ciclo de vida termina em "Concluída", "Não compareceu" ou "Cancelada".
- **Paciente (Patient)**: pessoa atendida, pertencente a uma clínica; selecionável no agendamento.
- **Fisioterapeuta (Clinic User com papel physiotherapist)**: profissional responsável pela consulta; usuários da clínica têm papéis admin, secretário ou fisioterapeuta. Pode ter (ou não) uma conexão Google Calendar vinculada à própria conta.
- **Conexão Google do usuário**: vínculo entre um fisioterapeuta e sua conta Google autorizada (credenciais/token + identificador do calendário), criado/removido a partir do cadastro de usuário. Habilita a sincronização da agenda daquele profissional.
- **Evento de Google Calendar**: representação externa de uma consulta (ou evento criado externamente) no calendário de um profissional conectado, com identificador próprio usado para correlação e deduplicação.
- **Notificação de agendamento**: evento disparado para fisioterapeuta e paciente avisando do agendamento; canal de entrega indefinido nesta feature.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Um usuário consegue criar uma consulta válida pelo modal em menos de 30 segundos e vê-la no calendário imediatamente após confirmar.
- **SC-002**: 100% das consultas criadas no sistema têm um evento correspondente no Google Calendar dentro de 1 minuto, ou ficam pendentes e sincronizam automaticamente quando a conexão é restabelecida.
- **SC-003**: 100% das tentativas de um fisioterapeuta de criar/editar consultas para outro profissional são rejeitadas pelo backend.
- **SC-004**: Eventos criados diretamente no Google Calendar aparecem no calendário do sistema no próximo ciclo de polling (até ~5 minutos), sem duplicação.
- **SC-005**: Nenhum usuário visualiza consultas, pacientes ou fisioterapeutas de outra clínica em nenhuma visão ou filtro.
- **SC-006**: A troca entre as visões Mês/Semana/Dia/Lista e a aplicação de filtros de fisioterapeuta e status mantêm coerência: o mesmo conjunto filtrado é apresentado em qualquer visão.

## Assumptions

- O papel "secretário" equivale ao admin para fins de visibilidade da agenda e de escolha de fisioterapeuta/paciente; os papéis da clínica são admin, secretário e fisioterapeuta (já refletidos no frontend).
- O frontend da Agenda já existe mockado (tela, calendário, modal, cores de status) e será religado ao backend real, removendo o mock; a estrutura visual e as cores de status são mantidas.
- A entrega da notificação por um canal concreto (e-mail/SMS/WhatsApp) será definida e implementada depois; esta feature apenas dispara/enfileira o evento de notificação.
- O checkbox "Enviar convite para o paciente via Google Calendar" do mock é desconsiderado nesta feature.
- Conflitos de horário (sobreposição para o mesmo fisioterapeuta) geram apenas um aviso, sem bloquear o agendamento, salvo decisão contrária futura.
- A consulta é criada com sucesso mesmo que a sincronização com o Google Calendar falhe momentaneamente; a sincronização é assíncrona e re-tentável.
- **Modelo de integração Google**: cada usuário da clínica conecta a própria conta Google Calendar (um calendário por usuário); a opção de conectar/desconectar fica no cadastro de usuário. Não há calendário único compartilhado da clínica.
- **Escopo do sync por usuário**: independentemente da visibilidade interna, o Google Calendar de cada usuário recebe/reflete apenas a agenda dele mesmo (os agendamentos em que ele é o responsável). Admin/secretário continuam vendo toda a agenda da clínica dentro do sistema, mas no Google de cada um só aparece a própria agenda. O agendamento interno é a fonte de verdade e empurra o evento para o Google após salvar.
- **Sem novas migrations**: o sistema está em desenvolvimento, sem produção nem servidor de teste. Não é necessário criar migrations novas para campos adicionais — as migrations existentes podem ser ajustadas e o banco recriado (`migrate:fresh`). O vínculo da conexão Google ao usuário pode reaproveitar/estender estruturas já existentes.
