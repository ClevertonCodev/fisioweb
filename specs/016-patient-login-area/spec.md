# Feature Specification: Patient Login Area

**Feature Directory**: `specs/016-patient-login-area`

**Working Branch**: `feature/area-paciente`

**Created**: 2026-08-08

**Updated**: 2026-08-08

**Status**: Draft

**Input**: User description: "Área de login do paciente no FisioKine. Ao clicar no botão 'Entrar' do PatientNavbar, o paciente é levado para uma tela de login dedicada do paciente. As credenciais são: usuário = CPF ou e-mail; senha = CPF do paciente. A tela deve usar as cores do design system existente (primary teal, tokens de background/card/border, suporte a dark mode) e seguir os padrões de UI do projeto."

## Overview

O paciente já consegue **ver** um programa de exercícios sem login (deep link por token público, feature 015). O que falta é a porta de entrada para as ações que exigem identidade: listar "meus programas", executar, registrar séries/cargas, enviar feedback e concluir.

Hoje o botão **"Entrar"** da barra do paciente aponta para um destino que não resolve em tela nenhuma — o paciente clica e cai em página não encontrada. Esta feature entrega:

1. Uma **tela de login dedicada do paciente**, visualmente coerente com o restante da experiência do paciente (mesma família de cores, tipografia e modo escuro do sistema).
2. O **vínculo do botão "Entrar"** a essa tela, preservando o contexto de onde o paciente veio.
3. Um **contrato de credenciais** claro: identificador = CPF **ou** e-mail; senha = CPF do paciente (senha padrão atribuída na criação do cadastro).
4. **Resolução da clínica** a partir do contexto da URL quando disponível, com escolha explícita de clínica quando o mesmo identificador existe em mais de uma.
5. **Verificação real da senha digitada**, corrigindo o comportamento atual em que a senha informada não é conferida.

O valor de negócio: fecha o ciclo da experiência do paciente. Sem login o paciente é um espectador do próprio tratamento; com login ele vira participante, e a clínica passa a ter aderência mensurável.

Esta especificação descreve **o que** o sistema deve oferecer e **por quê**; endpoints, módulos, componentes e persistência ficam para o plano técnico.

## Clarifications

### Session 2026-08-08

- Q: Como a clínica do paciente deve ser resolvida no login, já que o mesmo CPF/e-mail pode existir em várias clínicas? → A: **Slug da URL + fallback de escolha**. Quando o paciente chega a partir de uma rota que já carrega a clínica no endereço, a clínica é fixada por esse contexto e o login acontece em uma única etapa. Quando não há contexto de clínica no endereço, o paciente informa o identificador, escolhe entre as clínicas em que possui cadastro e então autentica.
- Q: A senha digitada deve ser verificada? → A: **Sim**. O CPF é a senha **padrão** atribuída na criação do cadastro, não uma regra permanente de autenticação. O sistema MUST conferir a senha informada contra a credencial armazenada do paciente. O comportamento atual — em que a senha digitada é ignorada e o acesso é concedido a quem souber o CPF — é tratado como defeito de segurança a ser corrigido por esta feature.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Paciente entra a partir do contexto da clínica (Priority: P1)

O paciente está numa tela da experiência do paciente que já identifica a clínica (lista de programas, detalhe do programa aberto por deep link, execução). Ele aciona **"Entrar"** na barra superior e chega a uma tela de login que já mostra de qual clínica se trata. Informa CPF ou e-mail e a senha, e é autenticado direto — sem precisar escolher clínica.

**Why this priority**: É o caminho dominante. O paciente quase sempre chega pelo link que a clínica mandou, e esse link já carrega a clínica. Qualquer etapa extra aqui é atrito puro.

**Independent Test**: A partir de um deep link de programa válido, acionar "Entrar", confirmar que a clínica aparece identificada na tela, autenticar com credenciais válidas e chegar autenticado.

**Acceptance Scenarios**:

1. **Given** um paciente não autenticado numa rota que identifica a clínica, **When** aciona "Entrar", **Then** vê a tela de login do paciente com a clínica daquele contexto identificada de forma legível.
2. **Given** a tela de login com clínica identificada, **When** informa um CPF cadastrado naquela clínica e a senha correta, **Then** é autenticado como paciente daquela clínica.
3. **Given** a mesma tela, **When** informa o e-mail cadastrado naquela clínica e a senha correta, **Then** é autenticado — e-mail e CPF são aceitos no mesmo campo de identificador.
4. **Given** a mesma tela, **When** informa o CPF com máscara/pontuação (`123.456.789-00`), **Then** o sistema normaliza e autentica como se tivesse recebido apenas os dígitos.
5. **Given** um identificador válido e senha incorreta, **When** tenta entrar, **Then** permanece na tela com mensagem de erro clara e a senha é limpa ou mantida sem revelar qual dos dois campos falhou.
6. **Given** um identificador que não existe naquela clínica, **When** tenta entrar, **Then** recebe a **mesma** mensagem genérica do caso de senha incorreta, sem revelar se o cadastro existe.
7. **Given** o slug da clínica no endereço não corresponde a nenhuma clínica ativa, **When** a tela de login é aberta, **Then** o sistema recai no fluxo de escolha de clínica (User Story 2) em vez de falhar.

---

### User Story 2 - Paciente entra sem contexto de clínica (Priority: P1)

O paciente acessa a tela de login diretamente, sem um endereço que identifique a clínica (favorito salvo, digitou o endereço, veio de fora). Informa CPF ou e-mail; o sistema apresenta as clínicas em que aquele identificador possui cadastro; o paciente escolhe uma e autentica com a senha.

**Why this priority**: Sem esse caminho, quem salva o login nos favoritos fica sem porta de entrada — e um paciente atendido em duas clínicas não tem como escolher.

**Independent Test**: Acessar a tela de login sem contexto de clínica com um CPF cadastrado em duas clínicas; confirmar que ambas aparecem, escolher uma e autenticar naquela clínica especificamente.

**Acceptance Scenarios**:

1. **Given** a tela de login sem contexto de clínica, **When** o paciente informa um identificador cadastrado em exatamente uma clínica, **Then** o sistema pode seguir direto para a senha com aquela clínica já selecionada, sem exigir escolha manual.
2. **Given** a tela de login sem contexto de clínica, **When** o paciente informa um identificador cadastrado em duas ou mais clínicas, **Then** vê a lista dessas clínicas com nome legível e escolhe uma antes de informar a senha.
3. **Given** a lista de clínicas apresentada, **When** o paciente escolhe uma e informa a senha correta, **Then** é autenticado como paciente **daquela** clínica.
4. **Given** um identificador sem cadastro em nenhuma clínica, **When** o paciente submete, **Then** recebe mensagem genérica que não confirma nem nega a existência do cadastro, e nenhuma lista de clínicas é revelada.
5. **Given** o paciente escolheu uma clínica, **When** decide voltar, **Then** consegue retornar ao passo do identificador sem recarregar a página nem perder o que digitou.

---

### User Story 3 - Retorno ao ponto de origem após entrar (Priority: P1)

Depois de autenticar, o paciente volta para onde estava tentando ir, e não para um lugar genérico. Se estava vendo um programa por deep link, volta para aquele programa — agora com as ações de paciente autenticado disponíveis.

**Why this priority**: É o que transforma o login de interrupção em passagem. Jogar o paciente numa lista genérica depois do login o obriga a reencontrar sozinho o programa que já estava aberto.

**Independent Test**: Abrir um deep link de programa sem login, acionar "Entrar", autenticar e confirmar que o retorno é para o mesmo programa, autenticado.

**Acceptance Scenarios**:

1. **Given** um paciente que acionou "Entrar" a partir de uma tela específica da experiência do paciente, **When** autentica com sucesso, **Then** retorna para aquela mesma tela, agora autenticado.
2. **Given** um paciente que acessou a tela de login diretamente, sem origem registrada, **When** autentica com sucesso, **Then** chega à lista de programas da clínica em que autenticou.
3. **Given** um retorno registrado que aponta para fora da experiência do paciente ou para endereço externo, **When** o login é concluído, **Then** o sistema ignora esse destino e usa a lista de programas — o destino de retorno nunca leva para fora da aplicação.
4. **Given** um paciente **já autenticado**, **When** acessa a tela de login, **Then** não vê o formulário novamente; é levado ao destino de retorno ou à lista de programas.

---

### User Story 4 - Estado autenticado visível e reversível (Priority: P2)

Uma vez autenticado, o paciente reconhece que está logado pela barra superior, que deixa de oferecer "Entrar" e passa a identificá-lo, com a opção de sair.

**Why this priority**: Sem sinal visível de sessão, o paciente não sabe se as ações de execução vão funcionar; e sem sair, um aparelho compartilhado vira problema de privacidade.

**Independent Test**: Autenticar, confirmar que a barra identifica o paciente e não mostra mais "Entrar"; acionar sair e confirmar que a barra volta ao estado anônimo.

**Acceptance Scenarios**:

1. **Given** um paciente autenticado, **When** vê a barra superior em qualquer tela da experiência do paciente, **Then** a ação "Entrar" foi substituída por uma identificação do paciente com opção de sair.
2. **Given** um paciente autenticado, **When** aciona sair, **Then** a sessão é encerrada, a barra volta ao estado anônimo e ele permanece numa tela pública utilizável.
3. **Given** um visitante anônimo, **When** vê a barra superior, **Then** a ação "Entrar" continua disponível como hoje.
4. **Given** um paciente cuja sessão expirou, **When** tenta uma ação que exige identidade, **Then** é conduzido à tela de login com o retorno registrado, em vez de receber falha silenciosa.

---

### User Story 5 - Proteção contra tentativa em massa (Priority: P2)

Como a senha padrão é derivada de um dado semipúblico (o CPF), tentativas automatizadas são um risco concreto. O sistema limita tentativas repetidas de autenticação e de descoberta de clínicas.

**Why this priority**: Um identificador adivinhável somado a uma senha padrão previsível é exatamente o par que ataques por força bruta exploram. Sem limite, a tela de login vira um oráculo de CPFs válidos.

**Independent Test**: Disparar tentativas malsucedidas sucessivas para o mesmo identificador e confirmar que o sistema passa a recusar novas tentativas por um período, com mensagem clara.

**Acceptance Scenarios**:

1. **Given** tentativas malsucedidas sucessivas para o mesmo identificador, **When** o limite é atingido, **Then** novas tentativas são recusadas por um período determinado, com mensagem informando a espera.
2. **Given** o passo de descoberta de clínicas, **When** é acionado repetidamente em volume anormal, **Then** também é limitado — a descoberta não pode ser usada para varrer CPFs válidos.
3. **Given** um bloqueio temporário ativo, **When** o período expira, **Then** o paciente consegue tentar novamente normalmente.
4. **Given** um paciente que erra a senha e depois acerta dentro do limite, **When** autentica com sucesso, **Then** a contagem de tentativas daquele identificador é zerada.

---

### Edge Cases

- Identificador ambíguo: um valor que é CPF válido para um paciente e aparece como e-mail de outro — o sistema decide o tipo pelo formato do que foi digitado, não por tentativa e erro em ambos os campos.
- CPF digitado com máscara, com espaços, ou com zeros à esquerda: normalização consistente antes de qualquer comparação.
- E-mail com diferença de caixa ou espaços nas pontas: comparação insensível a caixa e com espaços removidos.
- Paciente com cadastro em duas clínicas usando o **mesmo** e-mail: a escolha de clínica é obrigatória e a sessão vale para a clínica escolhida.
- Paciente cujo cadastro existe mas está inativo/arquivado na clínica: não autentica, e a mensagem não revela o motivo específico.
- Paciente sem e-mail cadastrado: consegue entrar normalmente por CPF.
- Paciente sem CPF cadastrado (se o domínio permitir): consegue entrar por e-mail; o passo de descoberta por CPF simplesmente não o encontra.
- Sessão de clínica ou de administrador já ativa no mesmo navegador: a sessão do paciente coexiste sem sobrescrever nem ser sobrescrita.
- Duas abas: entrar numa aba e a outra permanecer anônima até interação — não deve gerar estado inconsistente que impeça ações.
- Sessão expira no meio de uma execução de programa: o paciente é levado ao login com retorno para a execução, e o progresso já persistido não se perde.
- Falha de rede durante o login: mensagem de erro distinguível de credencial inválida, com possibilidade de tentar de novo sem redigitar o identificador.
- Tela aberta em modo escuro do sistema operacional: a tela nasce legível, sem descompasso de cor entre a barra e o corpo.
- Navegação por teclado e leitor de tela: os campos são alcançáveis, rotulados e o erro é anunciado.

## Requirements *(mandatory)*

### Functional Requirements

#### Acesso e navegação

- **FR-001**: A ação "Entrar" da barra do paciente MUST conduzir a uma tela de login do paciente que resolve em conteúdo real — nunca a um destino inexistente.
- **FR-002**: A tela de login do paciente MUST ser alcançável tanto a partir de um endereço que identifica a clínica quanto de um endereço sem essa identificação.
- **FR-003**: Ao acionar "Entrar", o sistema MUST registrar a tela de origem para retorno posterior.
- **FR-004**: Após autenticação bem-sucedida, o sistema MUST conduzir o paciente à tela de origem registrada; na ausência dela, à lista de programas da clínica autenticada.
- **FR-005**: O destino de retorno MUST ser restrito a telas internas da experiência do paciente; destinos externos ou fora dessa área MUST ser descartados em favor do destino padrão.
- **FR-006**: Um paciente já autenticado que acessa a tela de login MUST ser redirecionado em vez de ver o formulário novamente.

#### Credenciais e identificação

- **FR-007**: O sistema MUST aceitar, em um único campo de identificador, tanto o CPF quanto o e-mail do paciente.
- **FR-008**: O sistema MUST determinar o tipo do identificador pelo formato do valor informado, sem depender de o paciente declarar qual está usando.
- **FR-009**: O sistema MUST normalizar o CPF (removendo máscara e caracteres não numéricos) e o e-mail (removendo espaços nas pontas e ignorando diferenças de caixa) antes de qualquer comparação.
- **FR-010**: O sistema MUST exigir uma senha para autenticar e MUST verificar a senha informada contra a credencial armazenada daquele paciente.
- **FR-011**: O sistema MUST NOT conceder acesso com base apenas no conhecimento do identificador; informar identificador correto e senha incorreta MUST resultar em falha.
- **FR-012**: O CPF do paciente MUST ser tratado como a senha **padrão** atribuída na criação do cadastro — não como regra permanente de autenticação. A verificação MUST ocorrer contra a credencial armazenada, de modo que uma futura troca de senha passe a valer sem mudança nesta regra.
- **FR-013**: A tela MUST permitir alternar a visibilidade da senha digitada.

#### Resolução da clínica

- **FR-014**: Quando o endereço de acesso identifica a clínica, o sistema MUST fixar essa clínica como contexto do login e MUST exibi-la de forma legível ao paciente.
- **FR-015**: Com a clínica fixada por contexto, a autenticação MUST ocorrer em uma única etapa, sem exigir escolha de clínica.
- **FR-016**: Quando não houver clínica no endereço, o sistema MUST apresentar as clínicas em que o identificador informado possui cadastro e permitir que o paciente escolha uma antes de autenticar.
- **FR-017**: Quando o identificador possuir cadastro em exatamente uma clínica, o sistema MAY selecioná-la automaticamente e seguir direto para a senha.
- **FR-018**: Quando o endereço identificar uma clínica inexistente ou inativa, o sistema MUST recair no fluxo de escolha de clínica em vez de falhar.
- **FR-019**: A sessão resultante MUST estar vinculada à clínica efetivamente escolhida ou fixada, e MUST NOT conceder acesso a dados de outra clínica.

#### Segurança e mensagens

- **FR-020**: Falha por identificador inexistente e falha por senha incorreta MUST produzir a **mesma** mensagem genérica ao paciente, sem revelar qual das duas ocorreu.
- **FR-021**: O passo de descoberta de clínicas MUST NOT revelar a existência de um cadastro para identificadores sem vínculo — a resposta para identificador inexistente MUST ser indistinguível de uma resposta sem clínicas elegíveis.
- **FR-022**: O sistema MUST limitar tentativas de autenticação malsucedidas por identificador e por origem, recusando novas tentativas por um período após atingir o limite.
- **FR-023**: O sistema MUST limitar também as chamadas de descoberta de clínicas, impedindo seu uso como mecanismo de varredura de CPFs válidos.
- **FR-024**: Uma autenticação bem-sucedida MUST zerar a contagem de tentativas malsucedidas daquele identificador.
- **FR-025**: A senha MUST NOT ser registrada em log, telemetria ou mensagem de erro em nenhuma circunstância.
- **FR-026**: A sessão do paciente MUST coexistir com sessões de clínica ou administrador no mesmo navegador, sem sobrescrevê-las nem ser sobrescrita.
- **FR-027**: Expiração de sessão durante uma ação que exige identidade MUST conduzir o paciente ao login com retorno registrado, em vez de falhar silenciosamente.

#### Estado autenticado

- **FR-028**: Autenticado o paciente, a barra do paciente MUST substituir a ação "Entrar" por uma identificação do paciente com opção de encerrar a sessão.
- **FR-029**: Encerrar a sessão MUST devolver o paciente ao estado anônimo em uma tela pública utilizável.
- **FR-030**: Para visitantes anônimos, a barra MUST continuar oferecendo a ação "Entrar".

#### Apresentação e acessibilidade

- **FR-031**: A tela MUST usar exclusivamente as cores semânticas do design system do projeto (superfícies, bordas, texto, cor primária, estados de erro), sem cores fixas fora desse vocabulário.
- **FR-032**: A tela MUST ser legível e coerente em modo claro e escuro, incluindo o contraste entre barra superior e corpo da página.
- **FR-033**: A tela MUST se comportar corretamente em largura de telefone, que é o contexto dominante do paciente, sem rolagem horizontal.
- **FR-034**: A tela MUST comunicar visualmente três estados distintos: envio em andamento, erro de credencial e erro de comunicação.
- **FR-035**: Todos os elementos acionáveis MUST apresentar afordância de clique consistente com o restante do projeto.
- **FR-036**: Os campos MUST ser rotulados e navegáveis por teclado, e as mensagens de erro MUST ser anunciáveis por leitor de tela.
- **FR-037**: O campo de CPF MUST oferecer, em dispositivos móveis, o teclado apropriado ao tipo de identificador informado.
- **FR-038**: A tela MUST identificar visualmente que se trata da área **do paciente**, distinguindo-a das áreas de clínica e administrador.

### Key Entities *(include if feature involves data)*

- **Identificador do paciente**: valor único informado no login — CPF (apenas dígitos após normalização) ou e-mail (normalizado). Serve para localizar o cadastro dentro de uma clínica.
- **Credencial do paciente**: segredo verificável associado ao cadastro do paciente numa clínica. Nasce com o CPF como valor padrão na criação do cadastro.
- **Vínculo paciente-clínica**: relação que determina em quais clínicas um identificador possui cadastro; é o que torna a escolha de clínica necessária quando há mais de um.
- **Contexto de clínica da navegação**: clínica derivada do endereço de acesso, quando presente; fixa o login em etapa única.
- **Sessão do paciente**: identidade autenticada, vinculada a um paciente **e** a uma clínica, independente das sessões de clínica e administrador.
- **Destino de retorno**: tela da experiência do paciente registrada no momento em que o login foi acionado, usada após autenticação; restrita a destinos internos.
- **Contador de tentativas**: registro de tentativas malsucedidas por identificador e origem, usado para bloqueio temporário.

## Design Direction *(UI intent — não prescreve implementação)*

A tela de login do paciente é a primeira superfície **pessoal** da experiência. As telas anteriores (detalhe de programa por link) são compartilháveis e impessoais; esta é onde o paciente assume o próprio tratamento. A direção visual deve refletir isso:

- **Continuidade com a experiência do paciente, não com a da clínica.** A tela pertence à mesma família visual das telas de programa — mesma marca, mesma identificação de área "Paciente" — e não a uma reprodução do login da clínica.
- **Cor primária como acento, não como fundo.** A cor primária do sistema aparece em foco de campo, ação principal e sinais de progresso. Superfícies e fundos usam os tokens neutros de fundo e cartão.
- **Uma coluna, alvos generosos.** O paciente entra pelo telefone, muitas vezes já em roupa de treino, sem paciência. Campos altos, ação principal larga, nada de conteúdo secundário competindo.
- **A clínica é informação de segurança, não decoração.** Quando a clínica está fixada pelo contexto, o paciente precisa vê-la antes de digitar a senha — é assim que ele percebe que está entrando no lugar certo.
- **Modo escuro nativo.** Os tokens já suportam ambos os modos; a tela nasce correta nos dois, sem descompasso entre barra e corpo.
- **Erro sem culpa.** A mensagem genérica exigida por segurança não pode soar acusatória. O tom orienta o próximo passo em vez de sugerir que o paciente errou.

Os padrões concretos de componente, hover, foco e cursor seguem o catálogo do projeto (`specs/_shared/frontend-ui-patterns.md`), e o formulário segue o padrão de formulários do projeto — a decisão de componentes fica para o plano.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Acionar "Entrar" a partir de qualquer tela da experiência do paciente leva a uma tela de login funcional em 100% dos casos — nenhuma rota da barra do paciente termina em página não encontrada.
- **SC-002**: Um paciente que chega por deep link com contexto de clínica completa o login em **uma única etapa** de formulário, sem escolher clínica.
- **SC-003**: Um paciente cadastrado em duas clínicas consegue autenticar especificamente na clínica escolhida, e a sessão resultante não dá acesso a dados da outra, verificado por teste de isolamento.
- **SC-004**: CPF e e-mail autenticam o mesmo paciente com resultado idêntico, incluindo variações de máscara, espaços e caixa — verificado para pelo menos quatro formatos de entrada por tipo.
- **SC-005**: Tentativa com identificador válido e senha incorreta é **negada em 100%** dos casos de teste — nenhuma combinação concede acesso apenas por conhecer o identificador.
- **SC-006**: As mensagens retornadas para identificador inexistente e para senha incorreta são indistinguíveis entre si em texto e em comportamento observável.
- **SC-007**: Após um número definido de tentativas malsucedidas, novas tentativas são recusadas por um período, e o acesso volta a ser possível ao fim desse período — verificado por teste.
- **SC-008**: Após login bem-sucedido iniciado a partir de um programa, o paciente retorna àquele mesmo programa autenticado, sem precisar navegar manualmente.
- **SC-009**: Destinos de retorno externos ou fora da experiência do paciente são descartados em 100% dos casos de teste, sempre recaindo no destino padrão.
- **SC-010**: Um paciente autenticado vê a barra do paciente sem a ação "Entrar" e com opção de sair, em todas as telas da experiência do paciente.
- **SC-011**: A tela é legível e sem rolagem horizontal em largura de telefone e em modo claro e escuro, verificado nos dois modos.
- **SC-012**: Nenhuma senha aparece em log, telemetria ou resposta de erro, verificado por inspeção da saída de uma tentativa malsucedida e de uma bem-sucedida.

## Assumptions

- O cadastro do paciente, seu CPF e seu e-mail já são criados e mantidos na área da clínica; esta feature **consome** esses dados e não introduz autocadastro de paciente.
- A senha padrão igual ao CPF já é atribuída na criação do cadastro do paciente; esta feature não altera esse padrão de criação, apenas passa a **verificá-la** no login.
- A capacidade de o paciente **trocar** a própria senha fica fora do v1, mas a verificação é especificada contra a credencial armazenada justamente para que a troca possa ser adicionada depois sem revisar estas regras.
- Recuperação de senha ("esqueci minha senha") do paciente fica fora do v1 — o paciente sem acesso é reatendido pela clínica.
- A leitura pública do programa por token continua **sem exigir login**, conforme a feature 015; esta feature não introduz barreira em nenhuma tela hoje pública.
- Sessões de paciente, clínica e administrador são independentes entre si e podem coexistir no mesmo navegador.
- O identificador é considerado e-mail quando contém a estrutura de um endereço de e-mail; caso contrário é tratado como CPF após remoção de caracteres não numéricos.
- A duração da sessão do paciente segue o padrão já praticado pelas demais áreas do produto, sem regra própria nesta feature.
- Os limites numéricos de tentativas e a duração do bloqueio temporário seguirão valores usuais para autenticação em aplicações web, definidos no plano.
- Login social (ex.: Google), presente no login da clínica, **não** se aplica ao paciente no v1 — o paciente é identificado pelo cadastro que a clínica criou.
- Confirmação de e-mail, verificação por SMS, PIN e captcha permanecem fora do escopo, coerente com o que a feature 015 já deixou de fora.
- O contrato de descoberta de clínicas por identificador já existe no produto para CPF; estendê-lo para e-mail e alinhá-lo à regra de não revelar existência de cadastro faz parte desta feature.

## Out of Scope

- Autocadastro de paciente e onboarding completo (boas-vindas, PIN, captcha).
- Troca de senha e recuperação de senha pelo paciente.
- Login social do paciente.
- Alteração das regras de criação do cadastro de paciente na área da clínica.
- Redesenho das telas de programa já implementadas (lista, detalhe, execução, feedback, conclusão).
- Painel da clínica para acompanhar acessos/sessões de pacientes.
- Autenticação multifator.
- Alteração dos fluxos de login de clínica e de administrador.

## Dependencies

- Experiência do paciente (feature 015): as telas de destino após o login e a barra do paciente onde a ação "Entrar" vive.
- Cadastro de paciente na área da clínica: fonte do CPF, do e-mail e da credencial padrão.
- Design system do projeto: tokens de cor e catálogo de componentes que garantem a coerência visual exigida.
