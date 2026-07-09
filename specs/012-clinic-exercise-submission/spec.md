# Feature Specification: Clinic Exercise Submission & Admin Approval

**Feature Branch**: `012-clinic-exercise-submission`

**Created**: 2026-07-08

**Status**: Draft

**Input**: User description: "Permitir que clínicas enviem vídeos de exercícios pela área da clínica (aba Exercícios), com tela de envio semelhante à de upload de vídeo existente. Regras: (1) o vídeo enviado pela clínica salva o id da clínica e a princípio aparece somente para essa clínica; (2) aviso no frontend informando que, se aprovado, outras clínicas poderão ver; (3) quando uma clínica envia, aparece notificação no dashboard admin para revisar; um admin revisa e aprova para que passe a aparecer para todas as clínicas."

## Clarifications

### Session 2026-07-08

- Q: Quais campos descritivos a clínica preenche ao enviar um exercício? → A: Nome (obrigatório) + Categoria (obrigatória) + Dificuldade (obrigatória) + Descrição (opcional), além de vídeo/thumbnail/duração.
- Q: Quem, dentro da clínica, pode enviar exercícios? → A: Somente o admin da clínica pode enviar.
- Q: O que acontece quando o admin do sistema não aprova (rejeita) um exercício? → A: O exercício permanece disponível só para a clínica de origem e o vídeo exibe uma badge informando que está disponível apenas para a clínica que o enviou (sem motivo obrigatório nem fluxo de reenvio).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Clínica envia exercício próprio (Priority: P1)

Uma fisioterapeuta logada na área da clínica acessa a Biblioteca de Exercícios, aciona a ação de enviar um novo vídeo de exercício e preenche o formulário (vídeo obrigatório, thumbnail opcional, duração opcional, além dos dados descritivos do exercício como nome e categoria). Ao enviar, o exercício é gravado vinculado à sua clínica e passa a aparecer apenas na biblioteca daquela clínica.

**Why this priority**: É o núcleo da funcionalidade — sem a capacidade da clínica criar seu próprio acervo de exercícios, nenhuma das outras regras tem valor. Entrega valor imediato (clínica passa a ter exercícios próprios) mesmo sem o fluxo de aprovação.

**Independent Test**: Enviar um vídeo pela área da clínica A e confirmar que ele aparece na biblioteca da clínica A e não aparece na biblioteca da clínica B nem no catálogo global de outras clínicas.

**Acceptance Scenarios**:

1. **Given** uma usuária de clínica autenticada na aba Exercícios, **When** ela envia um vídeo válido com nome e categoria, **Then** o exercício é criado vinculado à clínica dela com status "pendente de revisão" e visibilidade restrita à própria clínica.
2. **Given** um exercício enviado pela clínica A, **When** uma usuária da clínica B abre sua biblioteca de exercícios, **Then** o exercício da clínica A não é exibido para a clínica B.
3. **Given** o formulário de envio, **When** a usuária tenta enviar sem o arquivo de vídeo, **Then** o envio é bloqueado e uma mensagem indica que o vídeo é obrigatório.
4. **Given** a tela de envio, **When** a usuária a visualiza, **Then** um aviso informa que, caso o exercício seja aprovado pelo sistema, ele poderá ficar visível para outras clínicas.

---

### User Story 2 - Admin revisa e aprova exercício enviado (Priority: P2)

Um administrador acessa o dashboard admin e vê um indicativo de que há exercícios enviados por clínicas aguardando revisão. Ele abre a lista de pendentes, assiste ao vídeo, e decide aprovar ou rejeitar. Ao aprovar, o exercício passa a compor o catálogo global e fica visível para todas as clínicas.

**Why this priority**: Habilita o compartilhamento entre clínicas, que é o diferencial da funcionalidade, mas depende do envio (P1) já existir. Sem essa etapa os exercícios simplesmente permanecem privados — estado ainda utilizável.

**Independent Test**: Com um exercício pendente criado pela clínica A, aprovar via admin e confirmar que ele passa a aparecer na biblioteca da clínica B.

**Acceptance Scenarios**:

1. **Given** um exercício enviado por uma clínica com status pendente, **When** o admin acessa o dashboard, **Then** ele vê um aviso/contador de exercícios aguardando revisão.
2. **Given** a lista de exercícios pendentes, **When** o admin aprova um exercício, **Then** o exercício passa a ter status aprovado e visibilidade global (todas as clínicas).
3. **Given** um exercício pendente, **When** o admin rejeita o exercício, **Then** o exercício permanece visível apenas para a clínica de origem e não entra no catálogo global.
4. **Given** um exercício aprovado, **When** qualquer clínica abre sua biblioteca, **Then** o exercício aparece junto aos demais exercícios do catálogo.

---

### Edge Cases

- O que acontece com um exercício já aprovado se o admin decidir revogar a aprovação? (Assumido: pode voltar a ficar restrito à clínica de origem; revogação é permitida.)
- Como o sistema trata um arquivo de vídeo acima do tamanho máximo permitido ou em formato não suportado? (Rejeição com mensagem clara, reaproveitando os limites já aplicados no upload de vídeo existente.)
- O que acontece se a clínica de origem for desativada/removida enquanto o exercício está pendente ou já aprovado?
- Como distinguir, na biblioteca da clínica de origem, exercícios pendentes, aprovados e rejeitados? (Indicação de status visível apenas para a clínica dona.)
- O que acontece se dois admins revisarem o mesmo exercício simultaneamente?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A área da clínica MUST oferecer, na aba Exercícios, uma ação para enviar um novo vídeo de exercício, com tela de envio semelhante à tela de upload de vídeo existente (área de arrastar/selecionar vídeo obrigatório, thumbnail opcional, duração opcional).
- **FR-001a**: O formulário de envio MUST capturar os campos descritivos: nome (obrigatório), categoria (obrigatória), dificuldade (obrigatória) e descrição (opcional), coerentes com os atributos exibidos nos cards da biblioteca.
- **FR-002**: O sistema MUST vincular todo exercício enviado por uma clínica ao identificador da clínica de origem.
- **FR-003**: Um exercício recém-enviado por uma clínica MUST iniciar com status "pendente de revisão" e visibilidade restrita à clínica de origem.
- **FR-004**: O sistema MUST exibir na biblioteca de uma clínica apenas: (a) os exercícios do catálogo global aprovados e (b) os exercícios de origem daquela própria clínica (independente do status).
- **FR-005**: A tela de envio MUST exibir um aviso informando que, se o exercício for aprovado pelo sistema, outras clínicas poderão visualizá-lo.
- **FR-006**: O sistema MUST validar que o arquivo de vídeo é obrigatório e respeitar os formatos e limites de tamanho já aplicados ao upload de vídeo existente.
- **FR-007**: Quando uma clínica envia um exercício, o dashboard admin MUST sinalizar que há exercícios aguardando revisão (aviso/contador).
- **FR-008**: O admin MUST poder listar os exercícios pendentes de revisão, visualizar seu conteúdo (vídeo/thumbnail/dados) e aprovar ou rejeitar cada um.
- **FR-009**: Ao aprovar um exercício, o sistema MUST alterar seu status para aprovado e torná-lo visível para todas as clínicas.
- **FR-010**: Ao rejeitar um exercício, o sistema MUST mantê-lo visível apenas para a clínica de origem e fora do catálogo global. Não é obrigatório informar motivo de rejeição, e não há fluxo de reenvio.
- **FR-010a**: Exercícios não aprovados (pendentes ou rejeitados) MUST exibir, para a clínica de origem, uma badge no vídeo/card informando que o exercício está disponível apenas para a clínica que o enviou.
- **FR-011**: A clínica de origem MUST conseguir identificar o status de revisão (pendente/aprovado/rejeitado) dos exercícios que ela mesma enviou.
- **FR-012**: Apenas usuários com perfil admin MUST poder aprovar ou rejeitar exercícios; clínicas não podem aprovar os próprios envios.
- **FR-012a**: Apenas o admin da clínica MUST poder enviar exercícios; usuários comuns da clínica (fisioterapeutas) não podem enviar.
- **FR-013**: O sistema MUST persistir o histórico mínimo da revisão (quem aprovou/rejeitou e quando) para rastreabilidade.

### Key Entities *(include if feature involves data)*

- **Exercício**: item da biblioteca com nome, categoria, dificuldade e mídia associada. Passa a ter: clínica de origem (opcional — nulo para itens do catálogo global oficial), status de revisão (pendente/aprovado/rejeitado) e escopo de visibilidade (privado da clínica de origem vs. global).
- **Vídeo do exercício**: mídia enviada (arquivo de vídeo obrigatório, thumbnail opcional, duração opcional) vinculada ao exercício.
- **Registro de revisão**: informação de quem revisou, decisão tomada e data/hora, associada ao exercício.
- **Clínica**: origem do envio; determina a visibilidade privada inicial.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Uma clínica consegue enviar um exercício e vê-lo em sua própria biblioteca imediatamente após o envio, sem depender de aprovação.
- **SC-002**: Um exercício enviado pela clínica A nunca aparece para a clínica B enquanto não for aprovado (0% de vazamento de exercícios pendentes entre clínicas).
- **SC-003**: Ao aprovar um exercício, ele passa a aparecer para 100% das clínicas na biblioteca de exercícios.
- **SC-004**: O admin identifica que existem exercícios pendentes de revisão em até 1 acesso ao dashboard (aviso visível na tela inicial).
- **SC-005**: A clínica de origem consegue distinguir o status de revisão de cada exercício que enviou diretamente na sua biblioteca.

## Assumptions

- O app está em fase de criação e existe apenas em ambiente local; portanto NÃO serão criadas novas migrations — as migrations existentes serão modificadas e, em seguida, `migrate` (com refresh) e seeders serão executados novamente.
- A entidade de Exercício já existe no catálogo; os novos atributos (clínica de origem, status de revisão) serão adicionados a ela em vez de criar uma entidade separada.
- Exercícios oficiais do catálogo global (criados pelo admin) têm clínica de origem nula e são considerados aprovados/globais por padrão.
- A infraestrutura de upload/armazenamento de vídeo existente (formatos, limites de tamanho, thumbnail, armazenamento em R2) será reutilizada.
- A autorização é imposta no backend (fonte de verdade): a visibilidade e a aprovação não dependem apenas do frontend.
- "Aprovado pelo sistema" significa aprovação por um administrador humano no dashboard admin (não uma aprovação automática).
- Não há fluxo de edição colaborativa entre clínicas: cada exercício privado pertence à clínica que o enviou.
