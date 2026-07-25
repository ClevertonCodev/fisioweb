# Feature Specification: Patient Program Experience (Backend)

**Feature Branch**: `015-patient-program-experience`

**Created**: 2026-07-25

**Updated**: 2026-07-25

**Status**: Draft

**Input**: User description: "Agora que o frontend da experiência do paciente (lista, detalhe, execução, feedback e conclusão de programa de exercícios) existe com dados mockados, implementar o backend que liga essas telas à fonte de verdade — listar programas do paciente, abrir detalhe por token público, registrar visualização, iniciar/salvar execução (séries e cargas), reportar exercícios não finalizados, enviar feedback e concluir o programa — com isolamento multi-tenant, guard do paciente e fronteiras de módulo limpas. Referência de produto: fluxo Vedius Paciente e `prompt-patient-program-experience.md`."

**Correção de produto (2026-07-25)**: "Copiar o link do programa" deve copiar `/{clinicSlug}/paciente/programas/{publicToken}`. Abrir esse link sem login leva a `/detalhe-programa?id={publicToken}`. O paciente **pode ver o programa sem fazer login**.

## Overview

O SPA do paciente já possui o fluxo completo de visualização e execução de programa de exercícios (lista → detalhe → detalhe do exercício → execução sequencial → exercícios não finalizados → feedback → confirmação), hoje alimentado por repositório mock. Esta feature entrega a **capacidade de backend** necessária para substituir os mocks e alinhar o compartilhamento do programa ao produto:

1. Na área da **clínica**, “Copiar o link do programa” copia a URL estável do deep link, no formato  
   `{origem}/{clinicSlug}/paciente/programas/{publicToken}`  
   (ex.: `http://localhost:8000/clinica-cleverton/paciente/programas/ba08c3d4-78ce-4e25-8ace-b0bcd1b77550`).
2. Ao **abrir** esse deep link **sem estar logado**, o paciente é conduzido à tela de detalhe em  
   `/detalhe-programa?id={publicToken}`  
   (ex.: `http://localhost:8000/detalhe-programa?id=ba08c3d4-78ce-4e25-8ace-b0bcd1b77550`) e **consegue ver o programa**.
3. Lista, execução, feedback e conclusão permanecem ações do **paciente autenticado** (dono do programa na clínica).

O valor de negócio é permitir que o paciente (e quem recebe o link) **consulte** o programa prescrito sem barreira de login, e que o paciente autenticado execute em casa com rastreio de visualização, cargas, exercícios não feitos, feedback e conclusão.

Esta especificação descreve **o que** o sistema deve oferecer e **por quê**; detalhes de endpoints, módulos e persistência ficam para o plano técnico.

## Clarifications

### Session 2026-07-25

- Q: Quando o paciente termina o fluxo (feedback + conclusão), como o sistema deve tratar essas duas ações? → A: Duas etapas — primeiro persiste feedback; depois registra conclusão (só então status/contador mudam).
- Q: Se o paciente inicia uma execução e abandona, o que acontece na próxima vez que tocar em “Iniciar exercícios”? → A: Retomar a execução em andamento existente (séries já salvas permanecem).
- Q: Se o paciente enviar no feedback uma dimensão desabilitada no programa, o que o sistema deve fazer? → A: Rejeitar a requisição com erro de validação.
- Q: O backend deve devolver a última carga utilizada para pré-preencher na execução? → A: Sim — da execução atual; senão, do histórico anterior do mesmo programa.
- Q: Se o paciente tentar concluir um programa já concluído, o que o sistema deve responder? → A: Sucesso idempotente — não duplica contador; resposta indica já concluído.

### Session 2026-07-25 (acesso e link)

- Q: O que “Copiar o link do programa” deve colocar na área de transferência? → A: A URL do deep link `{origem}/{clinicSlug}/paciente/programas/{publicToken}` (não `/detalhe-programa`).
- Q: O que acontece ao abrir esse deep link sem login? → A: O fluxo abre o detalhe em `/detalhe-programa?id={publicToken}` e o conteúdo do programa é visível **sem autenticação**.
- Q: O paciente precisa estar logado para ver o programa? → A: **Não** — leitura do detalhe (e o necessário para renderizar a tela de detalhe) é pública via token. Login continua necessário para listar “meus programas”, executar, enviar feedback e concluir.
- Q: O `clinicSlug` no deep link precisa bater com a clínica do plano? → A: No v1 o slug no path é **cosmético**; a resolução do programa é só pelo `publicToken`. A clínica copia sempre o slug correto no “Copiar o link”.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Abrir o detalhe pelo deep link (com ou sem login) (Priority: P1)

Uma pessoa abre o link do programa compartilhado pela clínica (`/{clinicSlug}/paciente/programas/{publicToken}`). Se não estiver autenticada como paciente, o sistema a leva para `/detalhe-programa?id={publicToken}` e mostra o detalhe completo do programa (nome, profissional, status, período, mensagem, grupos/exercícios e ações disponíveis conforme o estado). Se já estiver autenticada como o paciente dono, o mesmo conteúdo é apresentado (pode permanecer no deep link ou no detalhe legado — o importante é o conteúdo correto). Ao abrir, o sistema pode registrar visualização quando houver identidade de paciente; se o registro falhar, o detalhe continua utilizável.

**Why this priority**: É a entrada do QR/compartilhamento; o produto exige ver o programa **sem login**.

**Independent Test**: Com um programa ativo válido e token conhecido, abrir o deep link em sessão anônima e confirmar redirecionamento para `/detalhe-programa?id={token}` com conteúdo correto; repetir com paciente dono autenticado e confirmar o mesmo conteúdo.

**Acceptance Scenarios**:

1. **Given** um programa ativo com token público válido, **When** alguém abre `/{clinicSlug}/paciente/programas/{publicToken}` **sem login**, **Then** é conduzido a `/detalhe-programa?id={publicToken}` e vê o detalhe completo (nome, profissional, status, datas, mensagem, grupos, exercícios, prescrições e flags de outcome).
2. **Given** o mesmo token, **When** o detalhe é solicitado sem autenticação (leitura pública), **Then** o sistema devolve os dados necessários para renderizar a tela de detalhe.
3. **Given** o paciente dono autenticado, **When** abre o mesmo deep link ou o detalhe pelo token, **Then** recebe o mesmo conteúdo do programa e, se aplicável, registra visualização de forma idempotente.
4. **Given** falha temporária ao registrar a visualização (paciente autenticado), **When** continua na tela, **Then** o detalhe permanece utilizável.
5. **Given** um token inexistente ou programa em rascunho / não publicável, **When** alguém tenta abrir o detalhe, **Then** recebe não encontrado / indisponível sem vazar dados de outros programas.
6. **Given** um deep link com `clinicSlug` diferente da clínica do plano, **When** a abertura é processada, **Then** o sistema ainda resolve o programa pelo `publicToken` (o slug no path é cosmético no v1; a chave de acesso é o token). A clínica deve sempre copiar o slug correto.

---

### User Story 1b - Clínica copia o link canônico do programa (Priority: P1)

Na área da clínica, o profissional usa “Copiar o link do programa”. O sistema coloca na área de transferência exatamente a URL do deep link do paciente: `{origem}/{clinicSlug}/paciente/programas/{publicToken}`.

**Why this priority**: É o contrato de compartilhamento com o paciente (WhatsApp, QR, etc.); link errado quebra o fluxo de entrada.

**Independent Test**: Em um programa com slug `clinica-cleverton` e token conhecido, acionar copiar e verificar o texto da área de transferência no formato acima (origem do app + path).

**Acceptance Scenarios**:

1. **Given** um programa com `clinicSlug` e `publicToken` válidos, **When** o usuário da clínica copia o link do programa, **Then** o texto copiado é `{origem}/{clinicSlug}/paciente/programas/{publicToken}` (ex.: `http://localhost:8000/clinica-cleverton/paciente/programas/ba08c3d4-78ce-4e25-8ace-b0bcd1b77550`).
2. **Given** a ação de copiar, **When** o link é obtido, **Then** o texto **não** é `/detalhe-programa?id=…` (essa URL é só o destino de abertura sem login / rota legada de detalhe).
3. **Given** programa sem token público disponível, **When** tenta copiar, **Then** o sistema informa indisponibilidade e não copia URL inválida.

---

### User Story 2 - Paciente lista seus programas (Priority: P1)

O paciente **autenticado** vê a lista dos programas da própria clínica com nome, quantidade de exercícios, status (disponível, disponível a partir de uma data, indisponível, concluído, inativo), datas e profissional. Se não houver programas elegíveis, vê estado vazio adequado. Ao tocar em um item, vai ao detalhe.

**Why this priority**: É o hub pós-login e pós-conclusão; sem lista, o paciente depende só de deep links externos.

**Independent Test**: Autenticar um paciente com dois programas da clínica e nenhum de outra; a lista mostra apenas os seus dois, com status coerentes com datas e estado do plano.

**Acceptance Scenarios**:

1. **Given** um paciente com programas na clínica atual, **When** solicita a lista, **Then** vê apenas programas atribuídos a ele naquela clínica, cada um com nome, contagem de exercícios, status, período e profissional.
2. **Given** um paciente sem programas elegíveis, **When** solicita a lista, **Then** recebe lista vazia (o frontend exibe a mensagem de empty state).
3. **Given** programas em rascunho ou não publicados para o paciente, **When** a lista é montada, **Then** esses programas não aparecem.
4. **Given** um programa de outra clínica ou de outro paciente, **When** a lista é montada, **Then** esse programa nunca aparece.
5. **Given** visitante sem login, **When** tenta listar “meus programas”, **Then** o acesso é negado (lista não é pública).

---

### User Story 3 - Paciente executa o programa e registra séries/cargas (Priority: P1)

A partir do detalhe, o paciente **autenticado** inicia a execução e percorre os exercícios em sequência. Para cada série relevante, pode informar carga utilizada (ou peso do corpo) e avançar; o sistema persiste o progresso da execução. Se não concluir todos os exercícios, pode indicar quais não conseguiu fazer antes do feedback. Alternativamente, pode “concluir manualmente” e ir direto ao feedback sem executar o wizard.

**Why this priority**: É o valor clínico da experiência em casa — sem registro de execução, a clínica não tem aderência mensurável.

**Independent Test**: Iniciar execução de um programa com pelo menos dois exercícios, salvar séries com carga em um deles, marcar o outro como não finalizado e confirmar que esses dados ficam associados àquela execução do paciente.

**Acceptance Scenarios**:

1. **Given** um programa disponível do paciente sem execução em andamento, **When** ele inicia a execução autenticado, **Then** o sistema cria uma execução vinculada ao paciente e ao programa e permite registrar progresso.
2. **Given** uma execução em andamento, **When** o paciente salva séries de um exercício (contagem e carga/unidade ou peso do corpo), **Then** os dados ficam persistidos e associados àquela execução.
3. **Given** um exercício com carga já registrada na execução atual (ou em ciclo anterior do mesmo programa), **When** o paciente retoma/continua a execução, **Then** o sistema devolve a última carga utilizada desse exercício para pré-preenchimento na UI.
4. **Given** um programa disponível com execução em andamento (ex.: paciente abandonou no meio), **When** ele toca novamente em iniciar exercícios, **Then** o sistema retoma essa mesma execução e as séries já salvas permanecem.
5. **Given** uma execução em que faltaram exercícios, **When** o paciente informa os exercícios não finalizados, **Then** esses identificadores ficam registrados na execução.
6. **Given** um programa disponível, **When** o paciente escolhe concluir manualmente, **Then** pode seguir para feedback sem obrigar o wizard de execução (execução pode ser criada/atualizada no momento da conclusão/feedback conforme regras do plano).
7. **Given** um programa já concluído ou inativo / fora da janela de disponibilidade, **When** o paciente tenta iniciar execução, **Then** o sistema impede o início e comunica estado inválido.
8. **Given** visitante sem login, **When** tenta iniciar execução, salvar série, unfinished, feedback ou conclusão, **Then** o acesso é negado (só a leitura do detalhe é pública).

---

### User Story 4 - Paciente envia feedback e conclui o programa (Priority: P1)

Após a execução (completa ou parcial) ou a conclusão manual, o paciente **autenticado** responde às perguntas de outcome habilitadas no programa (dor, dificuldade, satisfação, cada uma com texto opcional) e salva o feedback. Em uma etapa seguinte e separada, registra a conclusão. Somente nessa segunda etapa o sistema grava o momento da conclusão, atualiza o contador/histórico de conclusões e o status apresentado ao paciente passa a refletir a conclusão. Em seguida o paciente pode voltar à lista.

**Why this priority**: Fecha o ciclo de adesão e gera o outcome que o profissional precisa acompanhar.

**Independent Test**: Com flags de dor e satisfação habilitadas (dificuldade desabilitada), enviar feedback válido e concluir; confirmar persistência dos campos habilitados, incremento do contador de conclusões e status concluído na leitura seguinte.

**Acceptance Scenarios**:

1. **Given** um programa com apenas parte das perguntas de outcome habilitadas, **When** o paciente envia feedback contendo somente dimensões habilitadas, **Then** o sistema aceita e persiste; o status do programa ainda não muda para concluído.
2. **Given** um programa com uma dimensão de outcome desabilitada, **When** o paciente envia feedback incluindo essa dimensão (valor ou nota), **Then** o sistema rejeita a requisição com erro de validação e não persiste o feedback.
3. **Given** feedback válido já persistido, **When** o paciente registra a conclusão na etapa seguinte, **Then** a conclusão é registrada com horário, o contador de conclusões do paciente no programa aumenta e leituras seguintes refletem status concluído (ou equivalente de produto).
4. **Given** falha ao salvar feedback, **When** o envio falha, **Then** o paciente recebe erro claro e o programa não é marcado como concluído indevidamente (a etapa de conclusão não deve ser considerada bem-sucedida).
5. **Given** um programa já concluído, **When** o paciente (ou outra aba) tenta concluir de novo, **Then** o sistema responde com sucesso idempotente, não incrementa novamente o contador de conclusões e indica que o programa já está concluído.

---

### User Story 5 - Isolamento e autorização (Priority: P1)

- **Leitura pública do detalhe**: quem possui o token público válido pode ver aquele programa (conteúdo da prescrição compartilhada). Tokens inválidos / rascunho não revelam dados.
- **Escrita e listagem**: exigem autenticação do paciente dono; nenhum paciente autenticado executa, envia feedback ou conclui programa de outro paciente ou de outra clínica, mesmo conhecendo o token.

**Why this priority**: O produto aceita compartilhamento por link para visualização; escrita cross-patient/cross-clinic continua inaceitável.

**Independent Test**: Detalhe anônimo OK para token válido; list/execução/feedback/complete sem auth negados; matriz cross-patient/cross-clinic nas ações autenticadas — todas negadas.

**Acceptance Scenarios**:

1. **Given** token público válido de um programa ativo, **When** visitante anônimo solicita o detalhe, **Then** recebe o conteúdo daquele programa.
2. **Given** paciente da clínica A autenticado, **When** tenta qualquer ação de escrita ou listagem em programa da clínica B, **Then** recebe não encontrado / negado.
3. **Given** paciente P1 autenticado, **When** tenta escrita no programa do paciente P2 na mesma clínica, **Then** recebe não encontrado / negado.
4. **Given** requisição sem autenticação de paciente, **When** tenta listar, iniciar execução, salvar série, unfinished, feedback ou complete, **Then** o acesso é negado.
5. **Given** token inexistente, **When** alguém solicita detalhe, **Then** recebe não encontrado sem vazar existência de outros programas.

---

### Edge Cases

- Token público válido mas programa em rascunho / inativo / fora do período: detalhe ou ação devem refletir status correto e bloquear início quando indisponível; rascunho não é legível publicamente.
- Deep link com `clinicSlug` que não corresponde à clínica do programa: no v1 ainda abre o detalhe pelo token (slug cosmético); não é vetor de vazamento de *outro* programa.
- Programa sem grupos ou sem exercícios: listagem/detalhe não quebram; iniciar execução é bloqueado ou resulta em fluxo vazio controlado.
- Paciente abandona a execução e volta depois: retoma a mesma execução em andamento; séries já salvas não são descartadas.
- Registro de visualização repetido (abrir detalhe várias vezes): não corrompe dados; permanece idempotente quando autenticado.
- Visitante anônimo na tela de detalhe toca em “Iniciar exercícios”: o produto exige autenticação antes de mutações (login/fluxo paciente da clínica); o detalhe em si já foi visto sem login.
- Feedback com notas longas ou caracteres especiais: validação com limites razoáveis e mensagens claras.
- Feedback incluindo dimensão desabilitada no programa: rejeição com erro de validação; nada é persistido.
- Conclusão sem ter iniciado execução (concluir manualmente): permitido e rastreável (autenticado).
- Duas abas concluindo o mesmo programa ao mesmo tempo: sucesso idempotente; contador incrementa no máximo uma vez para aquele ciclo.
- Mídia de exercício indisponível: o backend ainda devolve metadados; falha de player é tratada na UI.
- Paciente troca de contexto/clínica (se aplicável no produto): só lista/escreve programas da clínica do contexto autenticado.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema MUST permitir que um paciente autenticado liste os programas de exercícios atribuídos a ele na clínica do contexto autenticado.
- **FR-002**: Cada item da listagem MUST incluir, no mínimo: identificador público do programa (token), nome, status para o paciente, datas de início e fim, nome do profissional responsável e quantidade de exercícios.
- **FR-003**: O status apresentado ao paciente MUST distinguir, no mínimo: disponível, disponível a partir de uma data, indisponível (ex.: data de início), concluído e inativo.
- **FR-004**: Programas em rascunho ou não destinados ao paciente MUST NOT aparecer na listagem nem ser legíveis pelo token público.
- **FR-005**: O sistema MUST permitir obter o detalhe completo de um programa pelo token público **sem exigir login**, incluindo grupos ordenados, exercícios (identificador, nome, mídia quando houver, notas, dias, período) e prescrição (séries, repetições, carga, descanso, duração, manter, intensidade quando existirem).
- **FR-005a**: Abrir o deep link `/{clinicSlug}/paciente/programas/{publicToken}` sem sessão de paciente MUST conduzir o usuário a `/detalhe-programa?id={publicToken}` com o detalhe utilizável.
- **FR-005b**: Na área da clínica, “Copiar o link do programa” MUST copiar `{origem}/{clinicSlug}/paciente/programas/{publicToken}` (não `/detalhe-programa?id=…`).
- **FR-006**: O detalhe MUST incluir as flags que indicam se as dimensões de outcome dor, dificuldade e satisfação estão habilitadas para aquele programa.
- **FR-007**: Quando houver paciente autenticado dono do programa, o sistema MUST registrar a visualização ao solicitar esse registro; falha no registro MUST NOT impedir o uso do detalhe. Visitante anônimo MUST poder ver o detalhe mesmo sem registro de visualização autenticado.
- **FR-008**: O sistema MUST permitir iniciar uma execução de programa disponível apenas para o paciente autenticado dono do programa.
- **FR-008a**: Se já existir uma execução em andamento do mesmo paciente no mesmo programa, “iniciar exercícios” MUST retomar essa execução (não criar outra em paralelo) e preservar séries já salvas.
- **FR-009**: O sistema MUST permitir persistir, por execução, séries de um exercício com contagem e carga (valor/unidade ou indicação de peso do corpo) — somente paciente autenticado dono.
- **FR-009a**: Ao ler a execução (ou contexto de execução do programa), o sistema MUST fornecer a última carga utilizada por exercício: preferindo a execução em andamento; se inexistente, a mais recente de ciclo anterior do mesmo programa; se nunca houver, indicar ausência.
- **FR-010**: O sistema MUST permitir registrar na execução a lista de exercícios não finalizados pelo paciente autenticado dono.
- **FR-011**: O sistema MUST permitir concluir o programa sem percorrer a execução completa (“concluir manualmente”), ainda assim permitindo feedback e registro de conclusão — somente autenticado.
- **FR-012**: O sistema MUST aceitar e persistir feedback do paciente autenticado com as dimensões habilitadas (dor e/ou dificuldade em escala, satisfação em escala qualitativa, cada uma com nota textual opcional) em uma etapa própria, sem alterar por si só o status do programa para concluído.
- **FR-012a**: Se o feedback incluir qualquer dimensão desabilitada no programa (valor ou nota), o sistema MUST rejeitar a requisição com erro de validação e MUST NOT persistir o feedback.
- **FR-013**: O sistema MUST registrar a conclusão do programa em uma etapa separada e posterior ao feedback (momento da conclusão e incremento do contador de conclusões do paciente naquele programa) e refletir o novo estado nas leituras seguintes.
- **FR-013a**: Persistência de feedback e registro de conclusão MUST ser operações distintas; falha no feedback MUST impedir que o programa seja tratado como concluído.
- **FR-013b**: Conclusão repetida de um programa já concluído MUST ser idempotente: sucesso sem novo incremento do contador, indicando estado já concluído.
- **FR-014**: O sistema MUST negar listagem e todas as escritas da experiência (`POST` view, execução, unfinished, feedback, complete) a usuários não autenticados como paciente. O `GET` do detalhe por token é a **única** exceção pública.
- **FR-015**: O sistema MUST impedir que um paciente autenticado leia (via listagem) ou escreva em programas de outro paciente ou de outra clínica. A leitura pública por token revela apenas o programa daquele token (compartilhamento intencional); tokens inválidos MUST NOT vazar dados de outros programas.
- **FR-016**: Mensagens de erro de negócio (não encontrado, indisponível, validação de feedback/execução) MUST ser claras o suficiente para a UI existente exibir os textos de produto já previstos.
- **FR-017**: A capacidade de backend MUST cobrir o contrato de dados consumido pelo frontend já implementado da experiência (substituindo mocks), sem exigir redesenho das telas para o fluxo v1.
- **FR-018**: Regras críticas de autorização, ownership e conclusão MUST ser aplicadas no backend (fonte de verdade); o frontend apenas orquestra a UX.

### Key Entities *(include if feature involves data)*

- **Programa do paciente**: plano de exercícios atribuído a um paciente em uma clínica, identificado publicamente por token opaco; possui nome, status, período, profissional, mensagem, flags de outcome, grupos e exercícios. O token é o segredo de compartilhamento para leitura.
- **Deep link do programa**: URL canônica de compartilhamento `/{clinicSlug}/paciente/programas/{publicToken}` — o que a clínica copia.
- **Rota de detalhe sem login**: `/detalhe-programa?id={publicToken}` — destino de abertura quando não há sessão de paciente.
- **Grupo de exercícios**: bloco nomeado dentro do programa contendo exercícios ordenados.
- **Exercício prescrito**: item com mídia opcional, notas, dias/período e parâmetros de prescrição (séries, repetições, carga, descanso, etc.).
- **Visualização**: registro de que o paciente autenticado abriu/viu o programa.
- **Execução**: sessão em que o paciente autenticado realiza (ou inicia) o programa; agrega séries registradas e exercícios não finalizados. No máximo uma execução em andamento por paciente+programa; abandono implica retomada da mesma execução.
- **Série registrada**: contagem e carga utilizadas em uma série de um exercício dentro de uma execução.
- **Última carga do exercício**: valor/unidade (ou peso do corpo) mais recente daquele exercício para o paciente no programa — usada para pré-preencher a UI de execução.
- **Feedback / outcome**: respostas de dor, dificuldade e/ou satisfação (conforme flags) associadas à conclusão.
- **Conclusão**: fato de o paciente ter finalizado o ciclo (manual ou após execução), com horário e contagem acumulada.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% dos programas retornados na listagem de um paciente autenticado pertencem exclusivamente a esse paciente e à clínica do contexto (verificado por testes de isolamento).
- **SC-002**: Visitante **sem login** abre um deep link válido e, via `/detalhe-programa?id={token}`, obtém todos os dados necessários para renderizar a tela de detalhe em uma leitura bem-sucedida.
- **SC-002a**: “Copiar o link do programa” na clínica produz exatamente `{origem}/{clinicSlug}/paciente/programas/{publicToken}` em 100% dos casos de teste do link.
- **SC-003**: Em fluxo feliz (paciente autenticado), o paciente consegue iniciar execução, registrar pelo menos uma série com carga, enviar feedback das dimensões habilitadas e, na etapa seguinte, concluir — com todos os fatos persistidos e visíveis em leitura subsequente, e com status concluído apenas após a etapa de conclusão.
- **SC-004**: Tentativas cross-patient e cross-clinic em listagem, view autenticada, execução, feedback e conclusão resultam em negação em 100% dos casos de teste de segurança da feature; detalhe anônimo só funciona para o token correto.
- **SC-005**: Falha ao registrar visualização não impede o paciente autenticado de iniciar exercícios ou concluir manualmente (comportamento não bloqueante verificado).
- **SC-006**: Após conclusão bem-sucedida, a listagem/detalhe refletem estado concluído e o contador de conclusões do programa para aquele paciente aumenta em exatamente 1 em relação ao valor anterior; uma segunda chamada de conclusão no mesmo estado não altera o contador.
- **SC-007**: O frontend da experiência deixa de depender de dados mock para o fluxo principal (lista autenticada, detalhe público, view, feedback, conclusão) quando o backend da feature está disponível.

## Assumptions

- Login/autenticação do paciente na clínica e as rotas de deep link / detalhe já existem no SPA; esta feature não refaz onboarding, PIN, reCAPTCHA nem seleção de profissional.
- **Ver o programa não exige login**; **agir** (listar meus programas, executar, feedback, concluir) exige login do paciente dono.
- A URL copiada pela clínica é sempre o deep link com `clinicSlug` + `publicToken`; `/detalhe-programa?id=` é o destino de abertura sem login / rota legada de detalhe — não o texto do “Copiar”.
- No v1, `clinicSlug` no deep link não é validado contra o plano; só o `publicToken` resolve o conteúdo.
- A prescrição (programa, grupos, exercícios, token público, flags de outcome, `patient_viewed` / contador de conclusões) já é criada/gerida na área da clínica; esta feature consome e atualiza o lado paciente.
- Programas em rascunho não são visíveis nem executáveis pelo paciente (nem anonimamente).
- “Concluir manualmente” é permitido para programa disponível e segue para feedback e, em seguida, conclusão (duas etapas), sem exigir séries — com paciente autenticado.
- Feedback e conclusão são sempre duas etapas distintas: feedback persiste outcomes; conclusão altera status/contador.
- Há no máximo uma execução em andamento por paciente e programa; novo “iniciar” retoma a existente até a conclusão do ciclo.
- Dimensões de outcome desabilitadas no programa não podem ser enviadas no feedback; o backend rejeita com validação (flags não são só de UI).
- Última carga por exercício é parte do contrato de leitura da execução (atual, senão histórico do mesmo programa).
- Reexecução de um programa já concluído: fora do escopo mínimo do v1; se o produto já permitir novo ciclo no futuro, será especificado à parte. No v1, após conclusão o paciente vê status concluído e não inicia nova execução; novas chamadas de conclusão são sucesso idempotente sem novo incremento.
- Visualização da clínica sobre feedback/cargas do paciente (dashboard profissional) está fora do escopo desta feature; apenas persistência e API do paciente + link de compartilhamento correto na clínica.
- Calorias, push notifications, app nativo e seleção multi-profissional (lista Vedius) permanecem fora de escopo, conforme o prompt de produto.
- Limites de validação de escalas de dor/dificuldade e de tamanho de notas textuais seguirão padrões razoáveis do domínio clínico (escalas finitas; notas opcionais com teto de caracteres), detalhados no plano.
- Ownership técnico entre módulos (ex.: quem expõe a API do paciente vs. quem é dono do plano de tratamento) será definido no plano com fronteiras de monólito modular e contratos públicos — sem o paciente atravessar dados internos de outro bounded context indevidamente.

## Out of Scope

- Redesign visual das telas do paciente (já implementadas).
- Onboarding completo estilo Vedius (boas-vindas, PIN, reCAPTCHA).
- Troca de profissional / lista de profissionais.
- Cálculo de calorias.
- App nativo e notificações push.
- Painel da clínica para analisar feedbacks/execuções desta feature (pode ser feature futura).
- Alteração das APIs da clínica de prescrição (criar/editar plano), exceto o estritamente necessário para campos já existentes usados pelo paciente e para o link de compartilhamento (`share_url` / deep link) no formato canônico.
